// Combat Module - Tower firing, damage calculation, and visual effect orchestration
// Layer 2: Combat Integration

import type {
  Tower,
  Enemy,
  Point,
  TowerType,
  GameModule,
  QueryInterface,
  CommandInterface,
  ProjectileHitEvent,
} from '../types';
import { TowerType as TT } from '../types';
import { Tower as TowerClass } from '../towers/Tower';
import { findTarget, findChainTargets, getEnemiesInSplash } from '../towers/Targeting';
import { projectilePool } from '../pools';
import { eventBus, createEvent } from '../events';
import { GAME_CONFIG, COMBAT_CONFIG } from '../config';

// ============================================================================
// Visual Effect Tracking
// ============================================================================

export interface HitscanEffect {
  type: 'laser' | 'tesla';
  towerId: string;
  towerPosition: Point;
  targetPosition: Point;
  startTime: number;
  duration: number;
}

export interface ChainLightningEffect {
  towerId: string;
  towerPosition: Point;
  targets: Point[]; // All hit positions in chain order
  startTime: number;
  duration: number;
}

export interface SplashEffect {
  position: Point;
  radius: number;
  startTime: number;
  duration: number;
}

// ============================================================================
// Combat State
// ============================================================================

interface CombatState {
  hitscanEffects: HitscanEffect[];
  chainEffects: ChainLightningEffect[];
  splashEffects: SplashEffect[];
  towerInstances: Map<string, TowerClass>;
  eventUnsubscribers: (() => void)[];
}

// ============================================================================
// Helper Functions
// ============================================================================

function isHitscanTower(type: TowerType): boolean {
  return type === TT.LASER || type === TT.TESLA;
}

function isProjectileTower(type: TowerType): boolean {
  return type === TT.MISSILE || type === TT.CANNON;
}

function towerPositionToPixels(position: Point): Point {
  return {
    x: position.x * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
    y: position.y * GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2,
  };
}

function calculateDamage(baseDamage: number, armor: number): number {
  // Minimum 1 damage ensures enemies can always be killed eventually,
  // even when armor exceeds base damage
  return Math.max(1, baseDamage - armor);
}

// ============================================================================
// Combat Module Implementation
// ============================================================================

class CombatModuleImpl implements GameModule {
  name = 'CombatModule';
  private query: QueryInterface | null = null;
  private commands: CommandInterface | null = null;
  private state: CombatState = {
    hitscanEffects: [],
    chainEffects: [],
    splashEffects: [],
    towerInstances: new Map(),
    eventUnsubscribers: [],
  };

  init(query: QueryInterface, commands: CommandInterface): void {
    this.query = query;
    this.commands = commands;
    this.state = {
      hitscanEffects: [],
      chainEffects: [],
      splashEffects: [],
      towerInstances: new Map(),
      eventUnsubscribers: [],
    };

    // Subscribe to projectile hit events for splash damage
    const unsubHit = eventBus.on('PROJECTILE_HIT', this.handleProjectileHit.bind(this));
    this.state.eventUnsubscribers.push(unsubHit);
  }

  private handleProjectileHit(event: ProjectileHitEvent): void {
    const projectile = event.payload.projectile;

    // Only apply splash damage if projectile has aoe > 0
    if (projectile.aoe > 0) {
      // Convert to grid coordinates for splash calculation
      const impactPosition: Point = {
        x: projectile.position.x / GAME_CONFIG.CELL_SIZE,
        y: projectile.position.y / GAME_CONFIG.CELL_SIZE,
      };

      // Apply splash damage to nearby enemies (excluding primary target which engine already hit)
      this.applySplashDamageExcluding(
        impactPosition,
        projectile.damage,
        projectile.aoe,
        projectile.sourceId,
        projectile.targetId
      );
    }
  }

  update(dt: number): void {
    if (!this.query || !this.commands) return;

    const currentTime = this.commands.getTime();

    // Update tower instances and cooldowns
    this.updateTowers(dt);

    // Process tower firing
    this.processTowerFiring(currentTime);

    // Clean up expired visual effects
    this.cleanupEffects(currentTime);
  }

  destroy(): void {
    // Unsubscribe from all events
    for (const unsub of this.state.eventUnsubscribers) {
      unsub();
    }

    this.query = null;
    this.commands = null;
    this.state.hitscanEffects = [];
    this.state.chainEffects = [];
    this.state.splashEffects = [];
    this.state.towerInstances.clear();
    this.state.eventUnsubscribers = [];
  }

  // ==========================================================================
  // Tower Management
  // ==========================================================================

  private updateTowers(dt: number): void {
    if (!this.query) return;

    const towers = this.query.getTowers();

    // Sync tower instances with game state
    const currentTowerIds = new Set<string>();
    for (const towerData of towers) {
      currentTowerIds.add(towerData.id);

      // Get or create tower instance
      let towerInstance = this.state.towerInstances.get(towerData.id);
      if (!towerInstance) {
        towerInstance = new TowerClass(towerData.id, towerData.type, towerData.position);
        this.state.towerInstances.set(towerData.id, towerInstance);
      }

      // Update cooldown
      towerInstance.update(dt);
    }

    // Remove towers that no longer exist
    for (const towerId of this.state.towerInstances.keys()) {
      if (!currentTowerIds.has(towerId)) {
        this.state.towerInstances.delete(towerId);
      }
    }
  }

  // ==========================================================================
  // Tower Firing Logic
  // ==========================================================================

  private processTowerFiring(currentTime: number): void {
    if (!this.query) return;

    for (const [towerId, tower] of this.state.towerInstances) {
      // Skip if tower is on cooldown
      if (!tower.canFire()) continue;

      // Find target
      const towerData = this.query.getTowerById(towerId);
      if (!towerData) continue;

      const target = findTarget(towerData, this.query);
      if (!target) {
        tower.setTarget(null);
        continue;
      }

      // Set target and fire
      tower.setTarget(target.id);
      const fireResult = tower.fire(currentTime);

      if (fireResult) {
        if (isHitscanTower(towerData.type)) {
          this.handleHitscanFire(towerData, target, currentTime);
        } else if (isProjectileTower(towerData.type)) {
          this.handleProjectileFire(towerData, target, currentTime);
        }
      }
    }
  }

  // ==========================================================================
  // Hitscan Towers (Laser, Tesla)
  // ==========================================================================

  private handleHitscanFire(tower: Tower, target: Enemy, currentTime: number): void {
    if (!this.query) return;

    if (tower.type === TT.LASER) {
      this.fireLaser(tower, target, currentTime);
    } else if (tower.type === TT.TESLA) {
      this.fireTesla(tower, target, currentTime);
    }
  }

  private fireLaser(tower: Tower, target: Enemy, currentTime: number): void {
    // Apply instant damage
    const damage = calculateDamage(tower.damage, target.armor);
    this.applyDamage(target, damage, tower.id);

    // Create visual effect
    this.state.hitscanEffects.push({
      type: 'laser',
      towerId: tower.id,
      towerPosition: { ...tower.position },
      targetPosition: { ...target.position },
      startTime: currentTime,
      duration: COMBAT_CONFIG.HITSCAN_EFFECT_DURATION,
    });

    // Emit projectile fired event (for audio/other systems)
    eventBus.emit(
      createEvent('PROJECTILE_FIRED', {
        projectile: {
          id: `laser_${tower.id}_${currentTime}`,
          sourceId: tower.id,
          targetId: target.id,
          position: towerPositionToPixels(tower.position),
          velocity: { x: 0, y: 0 },
          damage: tower.damage,
          speed: 0,
          piercing: false,
          aoe: 0,
        },
      })
    );
  }

  private fireTesla(tower: Tower, target: Enemy, currentTime: number): void {
    if (!this.query) return;

    // Primary target damage
    const primaryDamage = calculateDamage(tower.damage, target.armor);
    this.applyDamage(target, primaryDamage, tower.id);

    // Find chain targets
    const chainTargets = findChainTargets(target, this.query, COMBAT_CONFIG.TESLA_MAX_CHAIN, COMBAT_CONFIG.TESLA_CHAIN_RANGE);

    // Build target positions for visual effect
    const targetPositions: Point[] = [{ ...target.position }];

    // Apply chain lightning damage with falloff
    let chainDamage = tower.damage;
    for (const chainTarget of chainTargets) {
      chainDamage *= COMBAT_CONFIG.CHAIN_DAMAGE_FALLOFF;
      const effectiveDamage = calculateDamage(chainDamage, chainTarget.armor);
      this.applyDamage(chainTarget, effectiveDamage, tower.id);
      targetPositions.push({ ...chainTarget.position });
    }

    // Create chain lightning visual effect
    this.state.chainEffects.push({
      towerId: tower.id,
      towerPosition: { ...tower.position },
      targets: targetPositions,
      startTime: currentTime,
      duration: COMBAT_CONFIG.HITSCAN_EFFECT_DURATION,
    });

    // Also add to hitscan effects for compatibility
    this.state.hitscanEffects.push({
      type: 'tesla',
      towerId: tower.id,
      towerPosition: { ...tower.position },
      targetPosition: { ...target.position },
      startTime: currentTime,
      duration: COMBAT_CONFIG.HITSCAN_EFFECT_DURATION,
    });

    // Emit event
    eventBus.emit(
      createEvent('PROJECTILE_FIRED', {
        projectile: {
          id: `tesla_${tower.id}_${currentTime}`,
          sourceId: tower.id,
          targetId: target.id,
          position: towerPositionToPixels(tower.position),
          velocity: { x: 0, y: 0 },
          damage: tower.damage,
          speed: 0,
          piercing: false,
          aoe: 0,
        },
      })
    );
  }

  // ==========================================================================
  // Projectile Towers (Missile, Cannon)
  // ==========================================================================

  private handleProjectileFire(tower: Tower, target: Enemy, _currentTime: number): void {
    const startPosition = towerPositionToPixels(tower.position);
    // Target position saved for potential projectile tracking: { ...target.position }

    // Acquire projectile from pool
    const projectile = projectilePool.acquire();

    // Determine if this is a splash projectile
    const isSplash = tower.type === TT.MISSILE;
    const aoeRadius = isSplash ? COMBAT_CONFIG.MISSILE_SPLASH_RADIUS * GAME_CONFIG.CELL_SIZE : 0;

    // Initialize projectile
    projectile.id = `proj_${tower.id}_${Date.now()}`;
    projectile.sourceId = tower.id;
    projectile.targetId = target.id;
    projectile.position.x = startPosition.x;
    projectile.position.y = startPosition.y;
    projectile.velocity.x = 0;
    projectile.velocity.y = 0;
    projectile.damage = tower.damage;
    projectile.speed = COMBAT_CONFIG.DEFAULT_PROJECTILE_SPEED;
    projectile.piercing = false;
    projectile.aoe = aoeRadius;

    // Add to game engine
    this.commands!.addProjectile(projectile);

    // Emit event
    eventBus.emit(
      createEvent('PROJECTILE_FIRED', {
        projectile: {
          id: projectile.id,
          sourceId: projectile.sourceId,
          targetId: projectile.targetId,
          position: { ...projectile.position },
          velocity: projectile.velocity,
          damage: projectile.damage,
          speed: projectile.speed,
          piercing: projectile.piercing,
          aoe: projectile.aoe,
        },
      })
    );
  }

  // ==========================================================================
  // Damage Application
  // ==========================================================================

  /**
   * Apply damage to an enemy. Used ONLY by hitscan towers (Laser, Tesla).
   *
   * ARCHITECTURE NOTE - Damage Flow:
   * - Hitscan towers (Laser, Tesla): CombatModule.applyDamage() applies damage directly
   * - Projectile towers (Missile, Cannon): Engine.projectileHit() applies primary damage
   * - Splash damage (Missiles): CombatModule.applySplashDamageExcluding() handles
   *   secondary targets, explicitly EXCLUDING the primary to prevent double-damage
   *
   * This split is intentional - projectile towers need Engine to track travel time,
   * while hitscan towers deal instant damage without projectiles.
   */
  private applyDamage(enemy: Enemy, damage: number, _towerId: string): void {
    enemy.health -= damage;

    // Request damage number visual effect
    if (damage > 0 && this.commands) {
      const currentTime = this.commands.getTime();
      // Enemy position is in pixels, add offset for center
      const damagePos = {
        x: enemy.position.x + GAME_CONFIG.CELL_SIZE / 2,
        y: enemy.position.y + GAME_CONFIG.CELL_SIZE / 2,
      };
      eventBus.emit(createEvent('DAMAGE_NUMBER_REQUESTED', {
        damage: Math.round(damage),
        position: damagePos,
        time: currentTime,
      }));
    }

    if (enemy.health <= 0) {
      this.handleEnemyKilled(enemy, _towerId);
    }
  }

  private handleEnemyKilled(enemy: Enemy, towerId: string): void {
    // Request explosion visual effect
    const currentTime = this.commands!.getTime();
    const deathPos = {
      x: enemy.position.x + GAME_CONFIG.CELL_SIZE / 2,
      y: enemy.position.y + GAME_CONFIG.CELL_SIZE / 2,
    };
    eventBus.emit(createEvent('EXPLOSION_REQUESTED', {
      position: deathPos,
      enemyType: enemy.type,
      time: currentTime,
    }));

    // Request gold number visual effect
    eventBus.emit(createEvent('GOLD_NUMBER_REQUESTED', {
      amount: enemy.reward,
      position: deathPos,
      time: currentTime,
    }));

    console.log(`[Kill] Enemy ${enemy.type} killed by tower ${towerId} → +$${enemy.reward}`);

    // Save reward before removing enemy (removeEnemy releases to pool which resets reward to 0)
    const reward = enemy.reward;

    // Emit kill event before removing (enemy object is reset when released to pool)
    eventBus.emit(createEvent('ENEMY_KILLED', { enemy, towerId, reward }));

    // Remove enemy from game
    this.commands!.removeEnemy(enemy.id);

    // Award credits using saved reward value
    this.commands!.addCredits(reward);
  }

  // ==========================================================================
  // Splash Damage (called when missile projectile hits)
  // ==========================================================================

  applySplashDamage(position: Point, damage: number, radius: number, sourceId: string): void {
    if (!this.query || !this.commands) return;

    const currentTime = this.commands.getTime();
    const splashEnemies = getEnemiesInSplash(position, this.query, radius / GAME_CONFIG.CELL_SIZE);

    for (const enemy of splashEnemies) {
      const effectiveDamage = calculateDamage(damage, enemy.armor);
      this.applyDamage(enemy, effectiveDamage, sourceId);
    }

    // Create splash visual effect
    this.state.splashEffects.push({
      position: { ...position },
      radius,
      startTime: currentTime,
      duration: COMBAT_CONFIG.SPLASH_EFFECT_DURATION,
    });
  }

  /**
   * Apply splash damage but exclude a specific target (already damaged by direct hit)
   */
  private applySplashDamageExcluding(
    position: Point,
    damage: number,
    radius: number,
    sourceId: string,
    excludeTargetId: string
  ): void {
    if (!this.query || !this.commands) return;

    const currentTime = this.commands.getTime();
    const splashEnemies = getEnemiesInSplash(position, this.query, radius / GAME_CONFIG.CELL_SIZE);

    for (const enemy of splashEnemies) {
      // Skip the primary target (already damaged by engine)
      if (enemy.id === excludeTargetId) continue;

      const effectiveDamage = calculateDamage(damage, enemy.armor);
      this.applyDamage(enemy, effectiveDamage, sourceId);
    }

    // Create splash visual effect
    this.state.splashEffects.push({
      position: { ...position },
      radius,
      startTime: currentTime,
      duration: COMBAT_CONFIG.SPLASH_EFFECT_DURATION,
    });
  }

  // ==========================================================================
  // Effect Cleanup
  // ==========================================================================

  private cleanupEffects(currentTime: number): void {
    // Clean hitscan effects
    this.state.hitscanEffects = this.state.hitscanEffects.filter(
      (effect) => currentTime - effect.startTime < effect.duration
    );

    // Clean chain effects
    this.state.chainEffects = this.state.chainEffects.filter(
      (effect) => currentTime - effect.startTime < effect.duration
    );

    // Clean splash effects
    this.state.splashEffects = this.state.splashEffects.filter(
      (effect) => currentTime - effect.startTime < effect.duration
    );
  }

  // ==========================================================================
  // Visual Effect Getters (for rendering layer)
  // ==========================================================================

  getHitscanEffects(): HitscanEffect[] {
    return this.state.hitscanEffects;
  }

  getChainEffects(): ChainLightningEffect[] {
    return this.state.chainEffects;
  }

  getSplashEffects(): SplashEffect[] {
    return this.state.splashEffects;
  }

  getTowerInstance(towerId: string): TowerClass | undefined {
    return this.state.towerInstances.get(towerId);
  }

  getAllTowerInstances(): Map<string, TowerClass> {
    return this.state.towerInstances;
  }

  /**
   * Clean up expired visual effects.
   * Should be called every frame regardless of game phase to prevent lingering effects.
   */
  cleanupVisualEffects(currentTime: number): void {
    this.cleanupEffects(currentTime);
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

export const combatModule = new CombatModuleImpl();

export default combatModule;
