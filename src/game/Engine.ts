// Engine - Main game orchestrator for Space Towers
// Manages game loop, phase state machine, module initialization, and React subscriptions

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
import { createWaveController, type WaveController } from './enemies/Wave';

// ============================================================================
// Constants
// ============================================================================

const FIXED_TIMESTEP = 1000 / GAME_CONFIG.TICK_RATE; // ~16.67ms at 60fps
const MAX_FRAME_TIME = 250; // Prevent spiral of death

// ============================================================================
// Engine State
// ============================================================================

interface EngineState {
  phase: GamePhase;
  wave: number;
  lives: number;
  credits: number;
  score: number;
  towers: Map<string, Tower>;
  enemies: Map<string, Enemy>;
  projectiles: Map<string, Projectile>;
  selectedTower: string | null;
  selectedTowerType: TowerType | null;
  isPaused: boolean;
  time: number;
  towersPlacedThisRound: Set<string>;
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

  // Game loop state
  private running = false;
  private lastTime = 0;
  private accumulator = 0;
  private animationFrameId: number | null = null;

  // Subscribers for React integration
  private subscribers = new Set<() => void>();
  private stateVersion = 0;

  // Factory for creating towers
  private towerFactory = new TowerFactory();

  // Wave controller
  private waveController: WaveController;

  // Injected dependencies (use globals if not provided)
  private eventBus: EventBus;
  private enemyPool: ObjectPool<Enemy>;
  private projectilePool: ObjectPool<Projectile>;

  constructor(deps?: Partial<EngineDependencies>) {
    // Use injected dependencies or fall back to globals
    this.eventBus = deps?.eventBus ?? globalEventBus;
    this.enemyPool = deps?.enemyPool ?? globalEnemyPool;
    this.projectilePool = deps?.projectilePool ?? globalProjectilePool;

    this.grid = createGrid();
    this.state = this.createInitialState();
    this.waveController = createWaveController({
      onSpawnEnemy: this.handleSpawnEnemy.bind(this),
    });
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  private createInitialState(): EngineState {
    return {
      phase: Phase.MENU,
      wave: 0,
      lives: GAME_CONFIG.STARTING_LIVES,
      credits: GAME_CONFIG.STARTING_CREDITS,
      score: 0,
      towers: new Map(),
      enemies: new Map(),
      projectiles: new Map(),
      selectedTower: null,
      selectedTowerType: null,
      isPaused: false,
      time: 0,
      towersPlacedThisRound: new Set(),
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

    this.notifySubscribers();
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
    this.stop();
    this.eventBus.clear();
    this.enemyPool.reset();
    this.projectilePool.reset();
    this.waveController.reset();
    this.subscribers.clear();
  }

  /**
   * Reset engine to initial state without destroying canvas binding.
   * Useful for tests that need to reset state between test cases.
   */
  reset(): void {
    this.stop();
    this.state = this.createInitialState();
    this.grid = createGrid();
    this.path = [];
    this.spawnPoint = { x: 0, y: 0 };
    this.exitPoint = { x: 0, y: 0 };
    this.waveController.reset();
    this.eventBus.clear();
    this.enemyPool.reset();
    this.projectilePool.reset();
    this.subscribers.clear();
    this.stateVersion = 0;
  }

  // ==========================================================================
  // Phase State Machine
  // ==========================================================================

  private setPhase(newPhase: GamePhase): void {
    const oldPhase = this.state.phase;
    if (oldPhase === newPhase) return;

    this.state.phase = newPhase;

    this.eventBus.emit(createEvent('PHASE_CHANGE', { from: oldPhase, to: newPhase }));
    this.notifySubscribers();
  }

  startGame(): void {
    // Allow starting from MENU, DEFEAT, or VICTORY phases
    if (this.state.phase !== Phase.MENU &&
        this.state.phase !== Phase.DEFEAT &&
        this.state.phase !== Phase.VICTORY) {
      return;
    }

    // Stop any running game loop when restarting
    this.stop();

    this.state = this.createInitialState();
    this.state.phase = Phase.PLANNING;
    this.state.wave = 1;
    this.grid.reset();
    this.setupDefaultLevel();
    this.recalculatePath();
    this.waveController.reset();

    this.eventBus.emit(createEvent('GAME_START', { wave: 1 }));
    this.notifySubscribers();
    this.start();
  }

  startWave(): void {
    if (this.state.phase !== Phase.PLANNING) return;

    // Clear towers placed this round - they no longer get full refund
    this.state.towersPlacedThisRound.clear();

    // Recalculate path before combat begins
    this.recalculatePath();

    this.setPhase(Phase.COMBAT);
    this.waveController.startWave(this.state.wave);
  }

  endWave(): void {
    if (this.state.phase !== Phase.COMBAT) return;

    // Award wave completion reward
    const waveReward = this.waveController.reward;
    if (waveReward > 0) {
      this.addCredits(waveReward);
    }

    // Signal wave completion to controller (emits WAVE_COMPLETE event)
    this.waveController.completeWave();

    // Advance to next wave
    this.state.wave++;
    this.setPhase(Phase.PLANNING);
  }

  pause(): void {
    if (this.state.phase === Phase.COMBAT || this.state.phase === Phase.PLANNING) {
      this.state.isPaused = true;
      this.setPhase(Phase.PAUSED);
    }
  }

  resume(): void {
    if (this.state.phase === Phase.PAUSED) {
      this.state.isPaused = false;
      // Return to combat or planning based on enemies
      this.setPhase(this.state.enemies.size > 0 ? Phase.COMBAT : Phase.PLANNING);
    }
  }

  victory(): void {
    this.setPhase(Phase.VICTORY);
    this.stop();
    this.eventBus.emit(createEvent('GAME_OVER', { victory: true, score: this.state.score }));
  }

  defeat(): void {
    this.setPhase(Phase.DEFEAT);
    this.stop();
    this.eventBus.emit(createEvent('GAME_OVER', { victory: false, score: this.state.score }));
  }

  // ==========================================================================
  // Game Loop (Fixed Timestep)
  // ==========================================================================

  start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;

    this.gameLoop(this.lastTime);
  }

  stop(): void {
    this.running = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private gameLoop = (currentTime: number): void => {
    if (!this.running) return;

    let frameTime = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Clamp frame time to prevent spiral of death
    if (frameTime > MAX_FRAME_TIME) {
      frameTime = MAX_FRAME_TIME;
    }

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= FIXED_TIMESTEP) {
      if (!this.state.isPaused) {
        this.update(FIXED_TIMESTEP / 1000); // Convert to seconds
      }
      this.accumulator -= FIXED_TIMESTEP;
    }

    // Note: Rendering is handled by Game.tsx component, not here
    // This allows React to manage the render loop while Engine handles game logic

    this.animationFrameId = requestAnimationFrame(this.gameLoop);
  };

  // ==========================================================================
  // Update Logic
  // ==========================================================================

  private update(dt: number): void {
    this.state.time += dt * 1000;

    // Update based on phase
    if (this.state.phase === Phase.COMBAT) {
      this.updateCombat(dt);
    }
  }

  private updateCombat(dt: number): void {
    // Update wave spawning
    this.waveController.update(dt);

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
      if (enemy.pathIndex >= this.path.length) {
        return true;
      }
      return false;
    }

    const moveDistance = enemy.speed * dt;
    if (moveDistance >= distance) {
      enemy.position.x = target.x * GAME_CONFIG.CELL_SIZE;
      enemy.position.y = target.y * GAME_CONFIG.CELL_SIZE;
      enemy.pathIndex++;
    } else {
      const ratio = moveDistance / distance;
      enemy.position.x += dx * ratio;
      enemy.position.y += dy * ratio;
    }

    return enemy.pathIndex >= this.path.length;
  }

  private updateProjectile(projectile: Projectile, dt: number): boolean {
    const target = this.state.enemies.get(projectile.targetId);
    if (!target) {
      // Target no longer exists, remove projectile
      this.state.projectiles.delete(projectile.id);
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

    const moveDistance = projectile.speed * dt;
    const ratio = Math.min(1, moveDistance / distance);
    projectile.position.x += dx * ratio;
    projectile.position.y += dy * ratio;

    return false;
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

    // Add to engine state
    this.state.enemies.set(enemy.id, enemy);
    this.notifySubscribers();

    return enemy;
  }

  private enemyEscaped(enemy: Enemy): void {
    this.state.enemies.delete(enemy.id);
    this.state.lives--;

    this.eventBus.emit(createEvent('ENEMY_ESCAPED', { enemy, livesLost: 1 }));
    this.eventBus.emit(createEvent('LIVES_CHANGED', { amount: -1, newTotal: this.state.lives }));

    this.enemyPool.release(enemy);
    this.notifySubscribers();
  }

  private projectileHit(projectile: Projectile): void {
    const target = this.state.enemies.get(projectile.targetId);
    if (target) {
      const effectiveDamage = Math.max(0, projectile.damage - target.armor);
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
    this.projectilePool.release(projectile);
  }

  private enemyKilled(enemy: Enemy, towerId: string): void {
    this.state.enemies.delete(enemy.id);
    this.state.credits += enemy.reward;
    this.state.score += enemy.reward;

    this.eventBus.emit(createEvent('ENEMY_KILLED', { enemy, towerId, reward: enemy.reward }));
    this.eventBus.emit(
      createEvent('CREDITS_CHANGED', { amount: enemy.reward, newTotal: this.state.credits })
    );

    this.enemyPool.release(enemy);
    this.notifySubscribers();
  }

  // ==========================================================================
  // React Subscribe Pattern
  // ==========================================================================

  subscribe(callback: () => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifySubscribers(): void {
    this.stateVersion++;
    this.subscribers.forEach((cb) => cb());
  }

  getSnapshot(): GameState {
    return {
      phase: this.state.phase,
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
  }

  getVersion(): number {
    return this.stateVersion;
  }

  // ==========================================================================
  // Public Accessors (for QueryInterface)
  // ==========================================================================

  getTowers(): Tower[] {
    return Array.from(this.state.towers.values());
  }

  getEnemies(): Enemy[] {
    return Array.from(this.state.enemies.values());
  }

  getProjectiles(): Projectile[] {
    return Array.from(this.state.projectiles.values());
  }

  getTowerById(id: string): Tower | undefined {
    return this.state.towers.get(id);
  }

  getEnemyById(id: string): Enemy | undefined {
    return this.state.enemies.get(id);
  }

  getEnemiesInRange(position: Point, range: number): Enemy[] {
    const result: Enemy[] = [];
    const rangeSquared = range * range;

    for (const enemy of this.state.enemies.values()) {
      const dx = enemy.position.x - position.x * GAME_CONFIG.CELL_SIZE;
      const dy = enemy.position.y - position.y * GAME_CONFIG.CELL_SIZE;
      const distSquared = dx * dx + dy * dy;

      if (distSquared <= rangeSquared) {
        result.push(enemy);
      }
    }

    return result;
  }

  getPath(): Point[] {
    return this.path;
  }

  /**
   * Get all enemies sorted by their progress along the path (furthest first).
   * Enemies with higher pathIndex are closer to escaping.
   * @returns Array of enemies sorted by path progress (descending)
   */
  getEnemiesAlongPath(): Enemy[] {
    const enemies = Array.from(this.state.enemies.values());
    return enemies.sort((a, b) => b.pathIndex - a.pathIndex);
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
    return this.state.phase;
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
    };
  }

  // ==========================================================================
  // Public Mutators (for Build/Combat integration)
  // ==========================================================================

  addTower(tower: Tower): void {
    this.state.towers.set(tower.id, tower);
    this.grid.setCell(tower.position, CS.TOWER);
    this.recalculatePath();
    this.notifySubscribers();
  }

  removeTower(towerId: string): Tower | undefined {
    const tower = this.state.towers.get(towerId);
    if (tower) {
      this.state.towers.delete(towerId);
      this.grid.setCell(tower.position, CS.EMPTY);
      this.recalculatePath();
      this.notifySubscribers();
    }
    return tower;
  }

  addEnemy(enemy: Enemy): void {
    this.state.enemies.set(enemy.id, enemy);
    this.notifySubscribers();
  }

  removeEnemy(enemyId: string): void {
    const enemy = this.state.enemies.get(enemyId);
    if (enemy) {
      this.state.enemies.delete(enemyId);
      this.enemyPool.release(enemy);
      this.notifySubscribers();
    }
  }

  addProjectile(projectile: Projectile): void {
    this.state.projectiles.set(projectile.id, projectile);
  }

  addCredits(amount: number): void {
    this.state.credits += amount;
    this.eventBus.emit(createEvent('CREDITS_CHANGED', { amount, newTotal: this.state.credits }));
    this.notifySubscribers();
  }

  spendCredits(amount: number): boolean {
    if (this.state.credits < amount) return false;
    this.state.credits -= amount;
    this.eventBus.emit(
      createEvent('CREDITS_CHANGED', { amount: -amount, newTotal: this.state.credits })
    );
    this.notifySubscribers();
    return true;
  }

  setSelectedTowerType(type: TowerType | null): void {
    this.state.selectedTowerType = type;
    this.notifySubscribers();
  }

  setSelectedTower(towerId: string | null): void {
    this.state.selectedTower = towerId;
    this.notifySubscribers();
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
   * Validates: phase, position, path blocking, and credits.
   * @param type - Tower type to place
   * @param position - Grid position to place at
   * @returns The placed tower if successful, null otherwise
   */
  placeTower(type: TowerType, position: Point): Tower | null {
    // Must be in planning phase
    if (this.state.phase !== Phase.PLANNING) {
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
    this.grid.setCell(position, CS.TOWER);
    this.recalculatePath();

    // Track that this tower was placed this round (eligible for full refund)
    this.state.towersPlacedThisRound.add(tower.id);

    // Emit event
    this.eventBus.emit(createEvent('TOWER_PLACED', { tower: tower.toData(), cost: stats.cost }));
    this.notifySubscribers();

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
    this.grid.setCell(tower.position, CS.EMPTY);
    this.recalculatePath();

    // Remove from this round's tracking if present
    this.state.towersPlacedThisRound.delete(towerId);

    // Refund credits
    this.addCredits(refund);

    // Emit event
    const towerData = tower instanceof Object && 'toData' in tower ? (tower as { toData: () => Tower }).toData() : tower;
    this.eventBus.emit(createEvent('TOWER_SOLD', { tower: towerData, refund }));
    this.notifySubscribers();

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
