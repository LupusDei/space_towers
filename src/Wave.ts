// Wave Controller for Space Towers

import type { WaveDefinition, WaveSpawn, EnemyType, Enemy } from './types';
import { eventBus, createEvent } from './events';
import { getWaveDefinition, calculateBossHealth } from './data/waves';
import { ENEMY_STATS } from './config';
import { EnemyType as EnemyTypeEnum } from './types';

// ============================================================================
// Spawn Group State
// ============================================================================

interface SpawnGroupState {
  spawn: WaveSpawn;
  spawned: number;
  nextSpawnTime: number;
}

// ============================================================================
// Wave Controller
// ============================================================================

export interface WaveControllerConfig {
  onSpawnEnemy: (type: EnemyType, health: number) => Enemy | null;
}

export class WaveController {
  private currentWave: number = 0;
  private waveDefinition: WaveDefinition | null = null;
  private spawnGroups: SpawnGroupState[] = [];
  private elapsedTime: number = 0;
  private waveSpawnedHp: number = 0;
  private totalSpawned: number = 0;
  private totalToSpawn: number = 0;
  private isActive: boolean = false;
  private onSpawnEnemy: WaveControllerConfig['onSpawnEnemy'];

  constructor(config: WaveControllerConfig) {
    this.onSpawnEnemy = config.onSpawnEnemy;
  }

  /**
   * Start a new wave
   */
  startWave(waveNumber: number): void {
    this.currentWave = waveNumber;
    this.waveDefinition = getWaveDefinition(waveNumber);
    this.elapsedTime = 0;
    this.waveSpawnedHp = 0;
    this.totalSpawned = 0;
    this.totalToSpawn = this.waveDefinition.spawns.reduce((sum, s) => sum + s.count, 0);
    this.isActive = true;

    // Initialize spawn groups
    this.spawnGroups = this.waveDefinition.spawns.map((spawn) => ({
      spawn,
      spawned: 0,
      nextSpawnTime: spawn.delay,
    }));

    // Emit wave start event
    eventBus.emit(
      createEvent('WAVE_START', {
        wave: waveNumber,
        definition: this.waveDefinition,
      })
    );
  }

  /**
   * Update wave spawning logic
   * @param dt Delta time in seconds
   */
  update(dt: number): void {
    if (!this.isActive || !this.waveDefinition) {
      return;
    }

    this.elapsedTime += dt * 1000; // Convert to milliseconds

    // Process each spawn group
    for (const group of this.spawnGroups) {
      while (
        group.spawned < group.spawn.count &&
        this.elapsedTime >= group.nextSpawnTime
      ) {
        this.spawnEnemy(group);
        group.spawned++;

        // Calculate next spawn time
        if (group.spawned < group.spawn.count) {
          group.nextSpawnTime += group.spawn.spawnInterval;
        }
      }
    }

    // Check if wave spawning is complete
    if (this.totalSpawned >= this.totalToSpawn) {
      this.isActive = false;
    }
  }

  /**
   * Spawn a single enemy from a spawn group
   */
  private spawnEnemy(group: SpawnGroupState): void {
    const { enemyType } = group.spawn;

    // Calculate health (special handling for boss)
    let health: number;
    if (enemyType === EnemyTypeEnum.BOSS) {
      health = calculateBossHealth(this.currentWave);
    } else {
      health = ENEMY_STATS[enemyType].health;
    }

    // Track spawned HP
    this.waveSpawnedHp += health;

    // Call the spawn callback
    const enemy = this.onSpawnEnemy(enemyType, health);

    if (enemy) {
      // Emit spawn event
      eventBus.emit(createEvent('ENEMY_SPAWN', { enemy }));
    }

    this.totalSpawned++;
  }

  /**
   * Called when all enemies in the wave have been defeated
   */
  completeWave(): void {
    if (!this.waveDefinition) {
      return;
    }

    eventBus.emit(
      createEvent('WAVE_COMPLETE', {
        wave: this.currentWave,
        reward: this.waveDefinition.reward,
      })
    );
  }

  /**
   * Check if all enemies have been spawned for this wave
   */
  get spawningComplete(): boolean {
    return this.totalSpawned >= this.totalToSpawn;
  }

  /**
   * Check if wave is currently active (spawning)
   */
  get active(): boolean {
    return this.isActive;
  }

  /**
   * Get current wave number
   */
  get wave(): number {
    return this.currentWave;
  }

  /**
   * Get total HP spawned this wave (for boss scaling)
   */
  get spawnedHp(): number {
    return this.waveSpawnedHp;
  }

  /**
   * Get wave reward
   */
  get reward(): number {
    return this.waveDefinition?.reward ?? 0;
  }

  /**
   * Get spawn progress
   */
  get progress(): { spawned: number; total: number } {
    return {
      spawned: this.totalSpawned,
      total: this.totalToSpawn,
    };
  }

  /**
   * Reset the wave controller
   */
  reset(): void {
    this.currentWave = 0;
    this.waveDefinition = null;
    this.spawnGroups = [];
    this.elapsedTime = 0;
    this.waveSpawnedHp = 0;
    this.totalSpawned = 0;
    this.totalToSpawn = 0;
    this.isActive = false;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createWaveController(config: WaveControllerConfig): WaveController {
  return new WaveController(config);
}
