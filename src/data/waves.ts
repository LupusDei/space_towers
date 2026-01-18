// Wave Definitions for Space Towers

import type { WaveDefinition, WaveSpawn } from '../game/types';
import { EnemyType } from '../game/types';
import { ENEMY_STATS, GAME_CONFIG } from '../game/config';

// ============================================================================
// Wave Definitions (Waves 1-10+)
// ============================================================================

export const WAVE_DEFINITIONS: WaveDefinition[] = [
  // Wave 1: Introduction - small scout group
  {
    waveNumber: 1,
    spawns: [{ enemyType: EnemyType.SCOUT, count: 5, delay: 0, spawnInterval: 1000 }],
    reward: 25,
  },

  // Wave 2: More scouts
  {
    waveNumber: 2,
    spawns: [{ enemyType: EnemyType.SCOUT, count: 8, delay: 0, spawnInterval: 900 }],
    reward: 30,
  },

  // Wave 3: Introduce fighters
  {
    waveNumber: 3,
    spawns: [
      { enemyType: EnemyType.SCOUT, count: 5, delay: 0, spawnInterval: 1000 },
      { enemyType: EnemyType.FIGHTER, count: 3, delay: 3000, spawnInterval: 1500 },
    ],
    reward: 40,
  },

  // Wave 4: Fighter focus with scout support
  {
    waveNumber: 4,
    spawns: [
      { enemyType: EnemyType.FIGHTER, count: 5, delay: 0, spawnInterval: 1200 },
      { enemyType: EnemyType.SCOUT, count: 6, delay: 2000, spawnInterval: 800 },
    ],
    reward: 50,
  },

  // Wave 5: BOSS WAVE
  {
    waveNumber: 5,
    spawns: [
      { enemyType: EnemyType.FIGHTER, count: 4, delay: 0, spawnInterval: 1000 },
      { enemyType: EnemyType.BOSS, count: 1, delay: 5000, spawnInterval: 0 },
    ],
    reward: 100,
  },

  // Wave 6: Introduce swarm
  {
    waveNumber: 6,
    spawns: [
      { enemyType: EnemyType.SWARM, count: 12, delay: 0, spawnInterval: 400 },
      { enemyType: EnemyType.FIGHTER, count: 4, delay: 3000, spawnInterval: 1200 },
    ],
    reward: 60,
  },

  // Wave 7: Mixed assault
  {
    waveNumber: 7,
    spawns: [
      { enemyType: EnemyType.SCOUT, count: 6, delay: 0, spawnInterval: 800 },
      { enemyType: EnemyType.FIGHTER, count: 5, delay: 2000, spawnInterval: 1000 },
      { enemyType: EnemyType.SWARM, count: 8, delay: 5000, spawnInterval: 500 },
    ],
    reward: 70,
  },

  // Wave 8: Introduce tanks
  {
    waveNumber: 8,
    spawns: [
      { enemyType: EnemyType.TANK, count: 2, delay: 0, spawnInterval: 3000 },
      { enemyType: EnemyType.FIGHTER, count: 6, delay: 2000, spawnInterval: 1000 },
    ],
    reward: 80,
  },

  // Wave 9: Heavy assault
  {
    waveNumber: 9,
    spawns: [
      { enemyType: EnemyType.SWARM, count: 15, delay: 0, spawnInterval: 350 },
      { enemyType: EnemyType.TANK, count: 3, delay: 3000, spawnInterval: 2500 },
      { enemyType: EnemyType.FIGHTER, count: 5, delay: 6000, spawnInterval: 1000 },
    ],
    reward: 90,
  },

  // Wave 10: BOSS WAVE - harder
  {
    waveNumber: 10,
    spawns: [
      { enemyType: EnemyType.TANK, count: 2, delay: 0, spawnInterval: 2000 },
      { enemyType: EnemyType.FIGHTER, count: 6, delay: 2000, spawnInterval: 800 },
      { enemyType: EnemyType.BOSS, count: 1, delay: 8000, spawnInterval: 0 },
    ],
    reward: 200,
  },
];

// ============================================================================
// Wave Utility Functions
// ============================================================================

/**
 * Calculate total HP spawned in a wave (for boss scaling)
 */
export function calculateWaveSpawnedHP(wave: WaveDefinition): number {
  return wave.spawns.reduce((total, spawn) => {
    const baseHealth = ENEMY_STATS[spawn.enemyType].health;
    return total + baseHealth * spawn.count;
  }, 0);
}

/**
 * Get wave definition by wave number
 * For waves beyond defined ones, generates a scaled version
 */
export function getWaveDefinition(waveNumber: number): WaveDefinition {
  // Return defined wave if it exists
  if (waveNumber <= WAVE_DEFINITIONS.length) {
    return WAVE_DEFINITIONS[waveNumber - 1];
  }

  // Generate waves beyond wave 10
  const isBossWave = waveNumber % GAME_CONFIG.BOSS_WAVE_INTERVAL === 0;
  const scaleFactor = 1 + (waveNumber - 10) * 0.15;

  const spawns: WaveSpawn[] = [];

  if (isBossWave) {
    // Boss wave: escort + boss
    spawns.push({
      enemyType: EnemyType.TANK,
      count: Math.floor(2 * scaleFactor),
      delay: 0,
      spawnInterval: 2000,
    });
    spawns.push({
      enemyType: EnemyType.FIGHTER,
      count: Math.floor(6 * scaleFactor),
      delay: 2000,
      spawnInterval: 800,
    });
    spawns.push({
      enemyType: EnemyType.BOSS,
      count: 1,
      delay: 8000,
      spawnInterval: 0,
    });
  } else {
    // Regular wave: mixed enemies
    spawns.push({
      enemyType: EnemyType.SWARM,
      count: Math.floor(10 * scaleFactor),
      delay: 0,
      spawnInterval: 400,
    });
    spawns.push({
      enemyType: EnemyType.FIGHTER,
      count: Math.floor(5 * scaleFactor),
      delay: 2000,
      spawnInterval: 1000,
    });
    spawns.push({
      enemyType: EnemyType.TANK,
      count: Math.floor(2 * scaleFactor),
      delay: 5000,
      spawnInterval: 2500,
    });
  }

  return {
    waveNumber,
    spawns,
    reward: isBossWave ? Math.floor(200 * scaleFactor) : Math.floor(90 * scaleFactor),
  };
}

/**
 * Calculate boss health based on cumulative HP spawned up to this point
 * Boss health scales with total HP players have dealt with
 */
export function calculateBossHealth(waveNumber: number): number {
  let totalHP = 0;

  for (let i = 1; i < waveNumber; i++) {
    const wave = getWaveDefinition(i);
    totalHP += calculateWaveSpawnedHP(wave);
  }

  // Boss base health + scaled amount based on cumulative HP
  const baseHealth = ENEMY_STATS[EnemyType.BOSS].health;
  const scaledHealth = baseHealth + totalHP * 0.1;

  return Math.floor(scaledHealth * GAME_CONFIG.BOSS_HEALTH_MULTIPLIER);
}

/**
 * Get total enemy count for a wave
 */
export function getWaveEnemyCount(wave: WaveDefinition): number {
  return wave.spawns.reduce((total, spawn) => total + spawn.count, 0);
}

/**
 * Get wave duration estimate in milliseconds
 */
export function getWaveDuration(wave: WaveDefinition): number {
  let maxEndTime = 0;

  for (const spawn of wave.spawns) {
    const spawnEndTime = spawn.delay + spawn.count * spawn.spawnInterval;
    maxEndTime = Math.max(maxEndTime, spawnEndTime);
  }

  return maxEndTime;
}

/**
 * Calculate credits awarded for completing a wave
 * Completing wave N awards N credits
 */
export function calculateWaveCredits(waveNumber: number): number {
  return waveNumber;
}
