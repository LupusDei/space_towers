// Engine - Main game orchestrator for Space Towers
// Coordinates game modules and provides unified API for game operations

import type {
  GameState,
  GamePhase,
  Tower,
  Enemy,
  Projectile,
  Point,
  CellState,
  TowerType,
  EnemyType,
  CommandInterface,
  QueryInterface,
} from './types';
import { GamePhase as Phase, CellState as CS } from './types';
import { GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_STATS, ENEMY_STATS } from './config';
import { createGrid, type Grid } from './grid/Grid';
import { eventBus as globalEventBus, createEvent, type EventBus } from './events';
import {
  enemyPool as globalEnemyPool,
  projectilePool as globalProjectilePool,
  type ObjectPool,
} from './pools';
import { findPath, wouldBlockPath } from './grid/Pathfinding';
import { TowerFactory } from './towers/TowerFactory';
import { Tower as TowerClass } from './towers/Tower';
import { createWaveController, type WaveController } from './enemies/Wave';
import { combatModule } from './combat/CombatModule';
import { createSpatialHash, type SpatialHash } from './SpatialHash';
import { StormEffect } from './entities/StormEffect';
import {
  StateNotifier,
  GameLoopManager,
  GameStateMachine,
} from './core';
import { calculateWaveCredits } from '../data/waves';
import { loadProgress, saveProgress } from './storage';

// ============================================================================
// Engine State (Data Container)
// ============================================================================

interface EngineState {
  wave: number;
  lives: number;
  credits: number;
  score: number;
  towers: Map<string, Tower>;
  enemies: Map<string, Enemy>;
  projectiles: Map<string, Projectile>;
  stormEffects: Map<string, StormEffect>;
  selectedTower: string | null;
  selectedTowerType: TowerType | null;
  isPaused: boolean;
  time: number;
  towersPlacedThisRound: Set<string>;
  /** Tower types allowed for building. null = all towers allowed (backward compatible) */
  allowedTowers: TowerType[] | null;
}

// ============================================================================
// Engine Dependencies (for dependency injection / testing)
// ============================================================================

export interface EngineDependencies {
  eventBus?: EventBus;
  enemyPool?: ObjectPool<Enemy>;
  projectilePool?: ObjectPool<Projectile>;
}

// ============================================================================
// Engine Class
// ============================================================================

class GameEngine {
  private state: EngineState;
  private grid: Grid;
  private path: Point[] = [];
  private spawnPoint: Point = { x: 0, y: 0 };
  private exitPoint: Point = { x: 0, y: 0 };

  // Core modules
  private stateNotifier: StateNotifier;
  private loopManager: GameLoopManager;
  private stateMachine: GameStateMachine;

  // Factory for creating towers
  private towerFactory = new TowerFactory();

  // Wave controller
  private waveController: WaveController;

  // Spatial hash for efficient enemy queries
  private spatialHash: SpatialHash;

  // Cached sorted enemies list for getEnemiesAlongPath()
  private sortedEnemiesCache: Enemy[] | null = null;

  // Cached snapshot for getSnapshot() (performance optimization)
  // Returns same GameState object if stateVersion hasn't changed
  private cachedSnapshot: GameState | null = null;
  private snapshotVersion = -1;

  // Injected dependencies (use globals if not provided)
  private eventBus: EventBus;
  private enemyPool: ObjectPool<Enemy>;
  private projectilePool: ObjectPool<Projectile>;

  // Cached arrays for frequently accessed collections (performance optimization)
  private towersCache: Tower[] = [];
  private towersCacheDirty = true;
  private enemiesCache: Enemy[] = [];
  private enemiesCacheDirty = true;
  private projectilesCache: Projectile[] = [];
  private projectilesCacheDirty = true;

  constructor(deps?: Partial<EngineDependencies>) {
    // Use injected dependencies or fall back to globals
    this.eventBus = deps?.eventBus ?? globalEventBus;
    this.enemyPool = deps?.enemyPool ?? globalEnemyPool;
    this.projectilePool = deps?.projectilePool ?? globalProjectilePool;

    // Initialize core modules
    this.stateNotifier = new StateNotifier();
    this.loopManager = new GameLoopManager();
    this.stateMachine = new GameStateMachine({
      onPhaseChange: this.handlePhaseChange.bind(this),
    });

    // Configure game loop
    this.loopManager.setUpdateCallback(this.update.bind(this));
    this.loopManager.setPausedCheck(() => this.state.isPaused);

    // Initialize game state
    this.grid = createGrid();
    this.state = this.createInitialState();
    this.spatialHash = createSpatialHash();
    this.waveController = createWaveController({
      onSpawnEnemy: this.handleSpawnEnemy.bind(this),
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private createInitialState(): EngineState {
    return {
      wave: 0,
      lives: GAME_CONFIG.STARTING_LIVES,
      credits: GAME_CONFIG.STARTING_CREDITS,
      score: 0,
      towers: new Map(),
      enemies: new Map(),
      projectiles: new Map(),
      stormEffects: new Map(),
      selectedTower: null,
      selectedTowerType: null,
      isPaused: false,
      time: 0,
      towersPlacedThisRound: new Set(),
      allowedTowers: null, // null = all towers allowed
    };
  }

  init(canvas: HTMLCanvasElement): void {
    // Set canvas dimensions
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    // Initialize grid with spawn and exit
    this.setupDefaultLevel();

    // Calculate initial path
    this.recalculatePath();

    this.stateNotifier.notify();
  }

  private setupDefaultLevel(): void {
    // Set spawn point (left side)
    this.spawnPoint = { x: 0, y: Math.floor(GAME_CONFIG.GRID_HEIGHT / 2) };
    this.grid.setCell(this.spawnPoint, CS.SPAWN);

    // Set exit point (right side)
    this.exitPoint = { x: GAME_CONFIG.GRID_WIDTH - 1, y: Math.floor(GAME_CONFIG.GRID_HEIGHT / 2) };
    this.grid.setCell(this.exitPoint, CS.EXIT);
  }

  private recalculatePath(): void {
    this.path = findPath(this.grid.getCells(), this.spawnPoint, this.exitPoint);
  }

  destroy(): void {
    this.loopManager.stop();
    this.eventBus.clear();
    this.enemyPool.reset();
    this.projectilePool.reset();
    this.waveController.reset();
    this.stateNotifier.clear();
  }

  /**
   * Reset engine to initial state without destroying canvas binding.
   * Useful for tests that need to reset state between test cases.
   */
  reset(): void {
    this.loopManager.stop();
    this.state = this.createInitialState();
    this.stateMachine.reset();
    this.grid = createGrid();
    this.path = [];
    this.spawnPoint = { x: 0, y: 0 };
    this.exitPoint = { x: 0, y: 0 };
    this.spatialHash.clear();
    this.sortedEnemiesCache = null;
    this.cachedSnapshot = null;
    this.snapshotVersion = -1;
    this.waveController.reset();
    this.eventBus.clear();
    this.enemyPool.reset();
    this.projectilePool.reset();
    this.stateNotifier.reset();
  }

  // ==========================================================================
  // Phase State Machine (delegated to GameStateMachine)
  // ==========================================================================

  private handlePhaseChange(from: GamePhase, to: GamePhase): void {
    this.eventBus.emit(createEvent('PHASE_CHANGE', { from, to }));
    this.stateNotifier.notify();
  }

  startGame(): void {
    // Allow starting from MENU, DEFEAT, or VICTORY phases
    if (!this.stateMachine.canStartGame()) {
      return;
    }

    // Stop any running game loop when restarting
    this.loopManager.stop();

    this.state = this.createInitialState();
    this.state.wave = 1;
    this.stateMachine.forcePhase(Phase.PLANNING);
    this.grid.reset();
    this.setupDefaultLevel();
    this.recalculatePath();
    this.waveController.reset();

    // Initialize combat module with query and command interfaces
    combatModule.init(this.getQueryInterface(), this.getCommandInterface());

    this.eventBus.emit(createEvent('GAME_START', { wave: 1 }));
    this.stateNotifier.notify();
    this.loopManager.start();
  }

  startWave(): void {
    if (!this.stateMachine.canStartWave()) return;

    // Clear towers placed this round - they no longer get full refund
    this.state.towersPlacedThisRound.clear();

    // Recalculate path before combat begins
    this.recalculatePath();

    this.stateMachine.transitionTo(Phase.COMBAT);
    this.waveController.startWave(this.state.wave);
  }

  endWave(): void {
    if (!this.stateMachine.isCombat()) return;

    const completedWave = this.state.wave;

    // Award wave completion reward (in-game credits)
    const waveReward = this.waveController.reward;
    if (waveReward > 0) {
      this.addCredits(waveReward);
    }

    // Signal wave completion to controller (emits WAVE_COMPLETE event)
    this.waveController.completeWave();

    // Award wave credits (persistent currency) and update progress
    const waveCreditsEarned = calculateWaveCredits(completedWave);
    this.awardWaveCredits(completedWave, waveCreditsEarned);

    // Advance to next wave
    this.state.wave++;
    this.stateMachine.transitionTo(Phase.PLANNING);
  }

  /**
   * Award wave credits and update persistent user progress.
   * Called after each wave completion.
   */
  private awardWaveCredits(completedWave: number, creditsEarned: number): void {
    // Load current progress
    const progress = loadProgress();

    // Update wave credits
    progress.waveCredits += creditsEarned;

    // Update highest wave completed if this is a new record
    if (completedWave > progress.highestWaveCompleted) {
      progress.highestWaveCompleted = completedWave;
    }

    // Save updated progress
    saveProgress(progress);

    // Emit event for UI notification
    this.eventBus.emit(createEvent('WAVE_CREDITS_EARNED', {
      wave: completedWave,
      creditsEarned,
      totalCredits: progress.waveCredits,
    }));
  }

  pause(): void {
    if (this.stateMachine.canPause()) {
      this.state.isPaused = true;
      this.stateMachine.transitionTo(Phase.PAUSED);
    }
  }

  resume(): void {
    if (this.stateMachine.canResume()) {
      this.state.isPaused = false;
      // Return to combat or planning based on enemies
      const resumePhase = this.state.enemies.size > 0 ? Phase.COMBAT : Phase.PLANNING;
      this.stateMachine.transitionTo(resumePhase);
    }
  }

  victory(): void {
    this.stateMachine.forcePhase(Phase.VICTORY);
    this.loopManager.stop();
    this.eventBus.emit(createEvent('GAME_OVER', { victory: true, score: this.state.score }));
  }

  defeat(): void {
    this.stateMachine.forcePhase(Phase.DEFEAT);
    this.loopManager.stop();
    this.eventBus.emit(createEvent('GAME_OVER', { victory: false, score: this.state.score }));
  }

  // ==========================================================================
  // Game Loop (delegated to GameLoopManager)
  // ==========================================================================

  start(): void {
    this.loopManager.start();
  }

  stop(): void {
    this.loopManager.stop();
  }

  // ==========================================================================
  // Update Logic
  // ==========================================================================

  private update(dt: number): void {
    this.state.time += dt * 1000;

    // Update based on phase
    if (this.stateMachine.isCombat()) {
      this.updateCombat(dt);
    }

    // Always clean up visual effects to prevent lingering after combat ends
    combatModule.cleanupVisualEffects(this.state.time);
  }

  private updateCombat(dt: number): void {
    // Update wave spawning
    this.waveController.update(dt);

    // Update combat module (tower targeting and firing)
    combatModule.update(dt);

    // Update storm effects (tick damage to enemies in storms)
    this.updateStormEffects(dt);

    // Update enemies
    for (const enemy of this.state.enemies.values()) {
      const reachedEnd = this.updateEnemy(enemy, dt);
      if (reachedEnd) {
        this.enemyEscaped(enemy);
      }
    }

    // Update projectiles
    for (const projectile of this.state.projectiles.values()) {
      const arrived = this.updateProjectile(projectile, dt);
      if (arrived) {
        this.projectileHit(projectile);
      }
    }

    // Check for wave completion (all spawned and all killed)
    if (this.waveController.spawningComplete && this.state.enemies.size === 0) {
      this.endWave();
    }

    // Check for defeat
    if (this.state.lives <= 0) {
      this.defeat();
    }
  }

  private updateEnemy(enemy: Enemy, dt: number): boolean {
    if (this.path.length === 0 || enemy.pathIndex >= this.path.length) {
      return true;
    }

    const target = this.path[enemy.pathIndex];
    const dx = target.x * GAME_CONFIG.CELL_SIZE - enemy.position.x;
    const dy = target.y * GAME_CONFIG.CELL_SIZE - enemy.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const threshold = GAME_CONFIG.CELL_SIZE * 0.5;

    if (distance < threshold) {
      enemy.pathIndex++;
      this.invalidateSortedEnemiesCache();
      if (enemy.pathIndex >= this.path.length) {
        return true;
      }
      return false;
    }

    // Apply slow effect if active, otherwise use full speed
    const effectiveSpeed = this.state.time < enemy.slowEndTime
      ? enemy.speed * enemy.slowMultiplier
      : enemy.speed;
    const moveDistance = effectiveSpeed * dt;
    if (moveDistance >= distance) {
      enemy.position.x = target.x * GAME_CONFIG.CELL_SIZE;
      enemy.position.y = target.y * GAME_CONFIG.CELL_SIZE;
      enemy.pathIndex++;
      this.invalidateSortedEnemiesCache();
    } else {
      const ratio = moveDistance / distance;
      enemy.position.x += dx * ratio;
      enemy.position.y += dy * ratio;
    }

    // Update spatial hash after position change
    this.spatialHash.update(enemy);

    return enemy.pathIndex >= this.path.length;
  }

  private updateProjectile(projectile: Projectile, dt: number): boolean {
    const target = this.state.enemies.get(projectile.targetId);
    if (!target) {
      // Target no longer exists, remove projectile
      this.state.projectiles.delete(projectile.id);
      this.projectilesCacheDirty = true;
      this.projectilePool.release(projectile);
      return false;
    }

    // Update target position (homing)
    const dx = target.position.x - projectile.position.x;
    const dy = target.position.y - projectile.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < 10) {
      return true;
    }

    // Calculate normalized direction and update velocity for sprite rendering
    const dirX = dx / distance;
    const dirY = dy / distance;
    projectile.velocity.x = dirX * projectile.speed;
    projectile.velocity.y = dirY * projectile.speed;

    const moveDistance = projectile.speed * dt;
    const ratio = Math.min(1, moveDistance / distance);
    projectile.position.x += dx * ratio;
    projectile.position.y += dy * ratio;

    return false;
  }

  /**
   * Update all storm effects - apply tick damage and remove expired storms.
   * @param dt - Delta time in seconds
   */
  private updateStormEffects(dt: number): void {
    const currentTimeSeconds = this.state.time / 1000;
    const expiredStorms: string[] = [];

    for (const [stormId, storm] of this.state.stormEffects) {
      // Check if storm has expired
      if (storm.isExpired(currentTimeSeconds)) {
        expiredStorms.push(stormId);
        continue;
      }

      // Calculate damage for this tick
      const tickDamage = storm.calculateDamage(dt);

      // Find all enemies within storm radius and apply damage
      for (const enemy of this.state.enemies.values()) {
        // Enemy position is in pixels, storm position is in pixels
        if (storm.containsPoint(enemy.position)) {
          // Apply tick damage (minimum 1 damage)
          const effectiveDamage = Math.max(1, tickDamage - enemy.armor);
          enemy.health -= effectiveDamage;

          // Track damage on source tower
          const tower = this.state.towers.get(storm.sourceId);
          if (tower && effectiveDamage > 0) {
            tower.totalDamage += effectiveDamage;
          }

          // Check if enemy was killed
          if (enemy.health <= 0) {
            this.stormKilledEnemy(enemy, storm.sourceId);
          }
        }
      }
    }

    // Remove expired storms
    for (const stormId of expiredStorms) {
      this.state.stormEffects.delete(stormId);
    }

    if (expiredStorms.length > 0) {
      this.stateNotifier.notify();
    }
  }

  /**
   * Handle an enemy killed by storm damage.
   * Similar to enemyKilled but with proper attribution to storm's source tower.
   */
  private stormKilledEnemy(enemy: Enemy, towerId: string): void {
    // Track kill on tower
    const tower = this.state.towers.get(towerId);
    if (tower) {
      tower.kills++;
    }

    this.state.enemies.delete(enemy.id);
    this.enemiesCacheDirty = true;
    this.spatialHash.remove(enemy);
    this.invalidateSortedEnemiesCache();
    this.state.credits += enemy.reward;
    this.state.score += enemy.reward;

    // Request gold number visual effect (floating +$X)
    const deathPos = {
      x: enemy.position.x + GAME_CONFIG.CELL_SIZE / 2,
      y: enemy.position.y + GAME_CONFIG.CELL_SIZE / 2,
    };
    this.eventBus.emit(createEvent('GOLD_NUMBER_REQUESTED', {
      amount: enemy.reward,
      position: deathPos,
      time: this.state.time,
    }));

    // Request explosion visual effect
    this.eventBus.emit(createEvent('EXPLOSION_REQUESTED', {
      position: deathPos,
      enemyType: enemy.type,
      time: this.state.time,
    }));

    console.log(`[Kill] Enemy ${enemy.type} killed by storm (tower ${towerId}) → +$${enemy.reward}`);

    this.eventBus.emit(createEvent('ENEMY_KILLED', { enemy, towerId, reward: enemy.reward }));
    this.eventBus.emit(
      createEvent('CREDITS_CHANGED', { amount: enemy.reward, newTotal: this.state.credits })
    );

    this.enemyPool.release(enemy);
    this.stateNotifier.notify();
  }

  private handleSpawnEnemy(type: EnemyType, health: number): Enemy | null {
    const stats = ENEMY_STATS[type];
    const enemy = this.enemyPool.acquire();

    // Initialize enemy with stats
    enemy.type = type;
    enemy.health = health;
    enemy.maxHealth = health;
    enemy.speed = stats.speed;
    enemy.armor = stats.armor;
    enemy.reward = stats.reward;
    enemy.pathIndex = 0;
    enemy.path = this.path;

    // Set spawn position (convert grid position to pixel position)
    enemy.position.x = this.spawnPoint.x * GAME_CONFIG.CELL_SIZE;
    enemy.position.y = this.spawnPoint.y * GAME_CONFIG.CELL_SIZE;

    // Add to engine state and spatial hash
    this.state.enemies.set(enemy.id, enemy);
    this.enemiesCacheDirty = true;
    this.spatialHash.insert(enemy);
    this.invalidateSortedEnemiesCache();
    this.stateNotifier.notify();

    return enemy;
  }

  private enemyEscaped(enemy: Enemy): void {
    this.state.enemies.delete(enemy.id);
    this.enemiesCacheDirty = true;
    this.spatialHash.remove(enemy);
    this.invalidateSortedEnemiesCache();
    this.state.lives--;

    this.eventBus.emit(createEvent('ENEMY_ESCAPED', { enemy, livesLost: 1 }));
    this.eventBus.emit(createEvent('LIVES_CHANGED', { amount: -1, newTotal: this.state.lives }));

    this.enemyPool.release(enemy);
    this.stateNotifier.notify();
  }

  /**
   * Handle projectile hitting its target. Applies damage to PRIMARY target only.
   *
   * ARCHITECTURE NOTE: Splash damage for missiles is handled separately by
   * CombatModule.handleProjectileHit() which listens for PROJECTILE_HIT events.
   * That handler explicitly excludes the primary target to prevent double-damage.
   * See CombatModule.applyDamage() for the full damage flow documentation.
   */
  private projectileHit(projectile: Projectile): void {
    const target = this.state.enemies.get(projectile.targetId);
    if (target) {
      // Minimum 1 damage ensures enemies can always be killed
      const effectiveDamage = Math.max(1, projectile.damage - target.armor);
      target.health -= effectiveDamage;

      this.eventBus.emit(
        createEvent('PROJECTILE_HIT', {
          projectile,
          targetId: projectile.targetId,
          damage: effectiveDamage,
        })
      );

      if (target.health <= 0) {
        this.enemyKilled(target, projectile.sourceId);
      }
    }

    this.state.projectiles.delete(projectile.id);
    this.projectilesCacheDirty = true;
    this.projectilePool.release(projectile);
  }

  private enemyKilled(enemy: Enemy, towerId: string): void {
    this.state.enemies.delete(enemy.id);
    this.enemiesCacheDirty = true;
    this.spatialHash.remove(enemy);
    this.invalidateSortedEnemiesCache();
    this.state.credits += enemy.reward;
    this.state.score += enemy.reward;

    // Request gold number visual effect (floating +$X)
    const deathPos = {
      x: enemy.position.x + GAME_CONFIG.CELL_SIZE / 2,
      y: enemy.position.y + GAME_CONFIG.CELL_SIZE / 2,
    };
    this.eventBus.emit(createEvent('GOLD_NUMBER_REQUESTED', {
      amount: enemy.reward,
      position: deathPos,
      time: this.state.time,
    }));

    // Request explosion visual effect
    this.eventBus.emit(createEvent('EXPLOSION_REQUESTED', {
      position: deathPos,
      enemyType: enemy.type,
      time: this.state.time,
    }));

    console.log(`[Kill] Enemy ${enemy.type} killed by tower ${towerId} → +$${enemy.reward}`);

    this.eventBus.emit(createEvent('ENEMY_KILLED', { enemy, towerId, reward: enemy.reward }));
    this.eventBus.emit(
      createEvent('CREDITS_CHANGED', { amount: enemy.reward, newTotal: this.state.credits })
    );

    this.enemyPool.release(enemy);
    this.stateNotifier.notify();
  }

  // ==========================================================================
  // React Subscribe Pattern (delegated to StateNotifier)
  // ==========================================================================

  subscribe(callback: () => void): () => void {
    return this.stateNotifier.subscribe(callback);
  }

  getSnapshot(): GameState {
    // Return cached snapshot if stateVersion hasn't changed
    const currentVersion = this.stateNotifier.getVersion();
    if (this.cachedSnapshot !== null && this.snapshotVersion === currentVersion) {
      return this.cachedSnapshot;
    }

    // Create new snapshot and cache it
    this.cachedSnapshot = {
      phase: this.stateMachine.getPhase(),
      wave: this.state.wave,
      lives: this.state.lives,
      credits: this.state.credits,
      score: this.state.score,
      towers: new Map(this.state.towers),
      enemies: new Map(this.state.enemies),
      projectiles: new Map(this.state.projectiles),
      grid: this.grid.getCells(),
      path: [...this.path],
      selectedTower: this.state.selectedTower,
      selectedTowerType: this.state.selectedTowerType,
      isPaused: this.state.isPaused,
    };
    this.snapshotVersion = currentVersion;

    return this.cachedSnapshot;
  }

  getVersion(): number {
    return this.stateNotifier.getVersion();
  }

  // ==========================================================================
  // Public Accessors (for QueryInterface)
  // ==========================================================================

  getTowers(): Tower[] {
    if (this.towersCacheDirty) {
      this.towersCache = Array.from(this.state.towers.values());
      this.towersCacheDirty = false;
    }
    return this.towersCache;
  }

  getEnemies(): Enemy[] {
    if (this.enemiesCacheDirty) {
      this.enemiesCache = Array.from(this.state.enemies.values());
      this.enemiesCacheDirty = false;
    }
    return this.enemiesCache;
  }

  getProjectiles(): Projectile[] {
    if (this.projectilesCacheDirty) {
      this.projectilesCache = Array.from(this.state.projectiles.values());
      this.projectilesCacheDirty = false;
    }
    return this.projectilesCache;
  }

  getTowerById(id: string): Tower | undefined {
    return this.state.towers.get(id);
  }

  getEnemyById(id: string): Enemy | undefined {
    return this.state.enemies.get(id);
  }

  getEnemiesInRange(position: Point, range: number): Enemy[] {
    // Use spatial hash for O(1) average-case lookups
    return this.spatialHash.query(position, range);
  }

  getPath(): Point[] {
    return this.path;
  }

  /**
   * Get all enemies sorted by their progress along the path (furthest first).
   * Enemies with higher pathIndex are closer to escaping.
   * Uses cached sorted list, invalidated when enemies added/removed/moved.
   * @returns Array of enemies sorted by path progress (descending)
   */
  getEnemiesAlongPath(): Enemy[] {
    if (this.sortedEnemiesCache === null) {
      const enemies = Array.from(this.state.enemies.values());
      this.sortedEnemiesCache = enemies.sort((a, b) => b.pathIndex - a.pathIndex);
    }
    return this.sortedEnemiesCache;
  }

  /**
   * Invalidate the sorted enemies cache.
   * Called when enemies are added, removed, or move along the path.
   */
  private invalidateSortedEnemiesCache(): void {
    this.sortedEnemiesCache = null;
  }

  getCell(position: Point): CellState {
    return this.grid.getCell(position);
  }

  /**
   * Get the tower at a specific grid position.
   * @param position - Grid position to check
   * @returns The tower at that position, or undefined if none
   */
  getTowerAt(position: Point): Tower | undefined {
    for (const tower of this.state.towers.values()) {
      if (tower.position.x === position.x && tower.position.y === position.y) {
        return tower;
      }
    }
    return undefined;
  }

  /**
   * Get the current game state (for QueryInterface).
   * @returns The current GameState snapshot
   */
  getGameState(): GameState {
    return this.getSnapshot();
  }

  getGrid(): Grid {
    return this.grid;
  }

  getTime(): number {
    return this.state.time;
  }

  getPhase(): GamePhase {
    return this.stateMachine.getPhase();
  }

  getCredits(): number {
    return this.state.credits;
  }

  getLives(): number {
    return this.state.lives;
  }

  getWave(): number {
    return this.state.wave;
  }

  getScore(): number {
    return this.state.score;
  }

  /**
   * Get a CommandInterface for modules that need to mutate game state.
   * This allows modules like CombatModule to be decoupled from the Engine singleton.
   */
  getCommandInterface(): CommandInterface {
    return {
      addProjectile: (projectile) => this.addProjectile(projectile),
      removeEnemy: (enemyId) => this.removeEnemy(enemyId),
      addCredits: (amount) => this.addCredits(amount),
      getTime: () => this.getTime(),
      applySlow: (enemyId, multiplier, duration) => this.applySlow(enemyId, multiplier, duration),
      addStormEffect: (position, radius, duration, damagePerSecond, sourceId) =>
        this.addStormEffect(position, radius, duration, damagePerSecond, sourceId),
    };
  }

  /**
   * Get a QueryInterface for modules that need read-only access to game state.
   */
  getQueryInterface(): QueryInterface {
    return {
      getTowers: () => this.getTowers(),
      getEnemies: () => this.getEnemies(),
      getProjectiles: () => this.getProjectiles(),
      getTowerById: (id) => this.getTowerById(id),
      getEnemyById: (id) => this.getEnemyById(id),
      getEnemiesInRange: (position, range) => this.getEnemiesInRange(position, range),
      getEnemiesAlongPath: () => this.getEnemiesAlongPath(),
      getPath: () => this.getPath(),
      getCell: (position) => this.getCell(position),
      getTowerAt: (position) => this.getTowerAt(position),
      getGameState: () => this.getGameState(),
    };
  }

  // ==========================================================================
  // Public Mutators (for Build/Combat integration)
  // ==========================================================================

  addTower(tower: Tower): void {
    this.state.towers.set(tower.id, tower);
    this.towersCacheDirty = true;
    this.grid.setCell(tower.position, CS.TOWER);
    this.recalculatePath();
    this.stateNotifier.notify();
  }

  removeTower(towerId: string): Tower | undefined {
    const tower = this.state.towers.get(towerId);
    if (tower) {
      this.state.towers.delete(towerId);
      this.towersCacheDirty = true;
      this.grid.setCell(tower.position, CS.EMPTY);
      this.recalculatePath();
      this.stateNotifier.notify();
    }
    return tower;
  }

  addEnemy(enemy: Enemy): void {
    this.state.enemies.set(enemy.id, enemy);
    this.enemiesCacheDirty = true;
    this.spatialHash.insert(enemy);
    this.invalidateSortedEnemiesCache();
    this.stateNotifier.notify();
  }

  removeEnemy(enemyId: string): void {
    const enemy = this.state.enemies.get(enemyId);
    if (enemy) {
      this.state.enemies.delete(enemyId);
      this.enemiesCacheDirty = true;
      this.spatialHash.remove(enemy);
      this.invalidateSortedEnemiesCache();
      this.enemyPool.release(enemy);
      this.stateNotifier.notify();
    }
  }

  addProjectile(projectile: Projectile): void {
    this.state.projectiles.set(projectile.id, projectile);
    this.projectilesCacheDirty = true;
    this.stateNotifier.notify();
  }

  addCredits(amount: number): void {
    this.state.credits += amount;
    this.eventBus.emit(createEvent('CREDITS_CHANGED', { amount, newTotal: this.state.credits }));
    this.stateNotifier.notify();
  }

  /**
   * Apply a slow effect to an enemy. Multiple slows don't stack - just refreshes duration.
   * @param enemyId - ID of the enemy to slow
   * @param multiplier - Speed multiplier (0.5 = 50% speed)
   * @param duration - Duration in milliseconds
   */
  applySlow(enemyId: string, multiplier: number, duration: number): void {
    const enemy = this.state.enemies.get(enemyId);
    if (!enemy) return;

    const newEndTime = this.state.time + duration;
    // Only update if new slow would last longer than current
    if (newEndTime > enemy.slowEndTime) {
      enemy.slowMultiplier = multiplier;
      enemy.slowEndTime = newEndTime;
    }
  }

  /**
   * Add a storm effect at the specified position.
   * @param position - Position in pixels
   * @param radius - Radius of the storm effect
   * @param duration - Duration in seconds
   * @param damagePerSecond - Damage dealt per second to enemies in the storm
   * @param sourceId - Tower ID that created this storm (for kill attribution)
   */
  addStormEffect(position: Point, radius: number, duration: number, damagePerSecond: number, sourceId: string): void {
    const storm = new StormEffect();
    const stormId = `storm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    // StormEffect uses seconds for time, so convert from Engine's milliseconds
    const startTimeSeconds = this.state.time / 1000;
    storm.init(stormId, position, startTimeSeconds, radius, duration, damagePerSecond, sourceId);
    this.state.stormEffects.set(stormId, storm);
    this.stateNotifier.notify();
  }

  /**
   * Get all active storm effects.
   * @returns Array of active storm effects
   */
  getStormEffects(): StormEffect[] {
    return Array.from(this.state.stormEffects.values());
  }

  spendCredits(amount: number): boolean {
    if (this.state.credits < amount) return false;
    this.state.credits -= amount;
    this.eventBus.emit(
      createEvent('CREDITS_CHANGED', { amount: -amount, newTotal: this.state.credits })
    );
    this.stateNotifier.notify();
    return true;
  }

  setSelectedTowerType(type: TowerType | null): void {
    this.state.selectedTowerType = type;
    this.stateNotifier.notify();
  }

  setSelectedTower(towerId: string | null): void {
    this.state.selectedTower = towerId;
    this.stateNotifier.notify();
  }

  /**
   * Set the tower types allowed for building during this game session.
   * Call this before startGame() to restrict which towers the player can place.
   * @param types - Array of allowed tower types. Pass null to allow all towers.
   */
  setAllowedTowers(types: TowerType[] | null): void {
    this.state.allowedTowers = types ? [...types] : null;
    this.stateNotifier.notify();
  }

  /**
   * Get the currently allowed tower types.
   * @returns Array of allowed types, or null if all towers are allowed.
   */
  getAllowedTowers(): TowerType[] | null {
    return this.state.allowedTowers;
  }

  /**
   * Check if a tower type is allowed for building.
   * @param type - The tower type to check
   * @returns true if the tower type can be built
   */
  isTowerTypeAllowed(type: TowerType): boolean {
    // If allowedTowers is null, all towers are allowed
    if (this.state.allowedTowers === null) {
      return true;
    }
    return this.state.allowedTowers.includes(type);
  }

  getSpawnPoint(): Point {
    return this.spawnPoint;
  }

  canPlaceTower(position: Point): boolean {
    return this.grid.canPlaceTower(position);
  }

  // ==========================================================================
  // Build Phase Integration
  // ==========================================================================

  /**
   * Check if placing a tower at a position would block the path.
   * @param position - Grid position to check
   * @returns true if placement would block path, false otherwise
   */
  wouldBlockPath(position: Point): boolean {
    return wouldBlockPath(this.grid.getCells(), position);
  }

  /**
   * Place a tower at a position during the build phase.
   * Validates: phase, tower type allowed, position, path blocking, and credits.
   * @param type - Tower type to place
   * @param position - Grid position to place at
   * @returns The placed tower if successful, null otherwise
   */
  placeTower(type: TowerType, position: Point): Tower | null {
    // Must be in planning phase
    if (!this.stateMachine.isPlanning()) {
      return null;
    }

    // Check if tower type is allowed for this game session
    if (!this.isTowerTypeAllowed(type)) {
      return null;
    }

    // Check if position is valid for tower placement
    if (!this.canPlaceTower(position)) {
      return null;
    }

    // Check if placing here would block the path
    if (this.wouldBlockPath(position)) {
      return null;
    }

    // Check if player has enough credits
    const stats = TOWER_STATS[type];
    if (this.state.credits < stats.cost) {
      return null;
    }

    // Create the tower
    const tower = this.towerFactory.create(type, position);

    // Spend credits
    this.spendCredits(stats.cost);

    // Add tower to the game
    this.state.towers.set(tower.id, tower);
    this.towersCacheDirty = true;
    this.grid.setCell(position, CS.TOWER);
    this.recalculatePath();

    // Track that this tower was placed this round (eligible for full refund)
    this.state.towersPlacedThisRound.add(tower.id);

    // Emit event
    this.eventBus.emit(createEvent('TOWER_PLACED', { tower: tower.toData(), cost: stats.cost }));
    this.stateNotifier.notify();

    return tower;
  }

  /**
   * Sell a tower and receive a refund.
   * Refund is 100% if tower was placed this round (during planning), 70% otherwise.
   * @param towerId - ID of the tower to sell
   * @returns The refund amount, or 0 if tower not found
   */
  sellTower(towerId: string): number {
    const tower = this.state.towers.get(towerId);
    if (!tower) {
      return 0;
    }

    // Calculate refund: 100% if placed this round, 70% otherwise
    const stats = TOWER_STATS[tower.type];
    const wasPlacedThisRound = this.state.towersPlacedThisRound.has(towerId);
    const refundPercent = wasPlacedThisRound ? 1.0 : 0.7;
    const refund = Math.floor(stats.cost * refundPercent);

    // Remove tower from the game
    this.state.towers.delete(towerId);
    this.towersCacheDirty = true;
    this.grid.setCell(tower.position, CS.EMPTY);
    this.recalculatePath();

    // Remove from this round's tracking if present
    this.state.towersPlacedThisRound.delete(towerId);

    // Refund credits
    this.addCredits(refund);

    // Emit event
    const towerData = tower instanceof Object && 'toData' in tower ? (tower as { toData: () => Tower }).toData() : tower;
    this.eventBus.emit(createEvent('TOWER_SOLD', { tower: towerData, refund }));
    this.stateNotifier.notify();

    return refund;
  }

  /**
   * Check if a tower was placed during the current round.
   * @param towerId - ID of the tower to check
   * @returns true if the tower was placed this round
   */
  wasTowerPlacedThisRound(towerId: string): boolean {
    return this.state.towersPlacedThisRound.has(towerId);
  }

  /**
   * Upgrade a tower to the next level.
   * Must be in planning phase and have enough credits.
   * @param towerId - ID of the tower to upgrade
   * @returns The upgrade cost if successful, 0 if upgrade failed
   */
  upgradeTower(towerId: string): number {
    // Must be in planning phase
    if (!this.stateMachine.isPlanning()) {
      return 0;
    }

    const tower = this.state.towers.get(towerId) as TowerClass | undefined;
    if (!tower) {
      return 0;
    }

    const stats = TOWER_STATS[tower.type];

    // Check if already at max level
    if (tower.level >= stats.maxLevel) {
      return 0;
    }

    // Get upgrade cost (index 0 = cost for level 2, etc.)
    const upgradeCost = stats.upgradeCosts[tower.level - 1];

    // Check if player can afford
    if (this.state.credits < upgradeCost) {
      return 0;
    }

    // Deduct credits
    this.spendCredits(upgradeCost);

    // Upgrade the tower
    tower.upgrade();

    // Emit event
    const towerData = tower instanceof Object && 'toData' in tower ? (tower as { toData: () => Tower }).toData() : tower;
    this.eventBus.emit(createEvent('TOWER_UPGRADED', { tower: towerData, cost: upgradeCost }));
    this.stateNotifier.notify();

    return upgradeCost;
  }
}

// ============================================================================
// Factory Function (for testing with isolated instances)
// ============================================================================

/**
 * Create a new GameEngine instance with optional dependency injection.
 * Use this for testing to get isolated instances that don't share global state.
 *
 * @example
 * import { createEngine } from './Engine';
 * import { createEventBus } from './events';
 * import { createEnemyPool, createProjectilePool } from './pools';
 *
 * const testEngine = createEngine({
 *   eventBus: createEventBus(),
 *   enemyPool: createEnemyPool(),
 *   projectilePool: createProjectilePool(),
 * });
 */
export function createEngine(deps?: Partial<EngineDependencies>): GameEngine {
  return new GameEngine(deps);
}

// ============================================================================
// Singleton Export (for production use)
// ============================================================================

export const engine = new GameEngine();

export default engine;
