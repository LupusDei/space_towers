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
} from './types';
import { GamePhase as Phase, CellState as CS } from './types';
import { GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';
import { createGrid, type Grid } from './grid/Grid';
import { eventBus, createEvent } from './events';
import { enemyPool, projectilePool } from './pools';
import { findPath } from './grid/Pathfinding';
import type { SpriteRenderContext } from '../sprites/types';

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

  // Rendering
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  constructor() {
    this.grid = createGrid();
    this.state = this.createInitialState();
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
    };
  }

  init(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

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
    eventBus.clear();
    enemyPool.reset();
    projectilePool.reset();
    this.subscribers.clear();
    this.canvas = null;
    this.ctx = null;
  }

  // ==========================================================================
  // Phase State Machine
  // ==========================================================================

  private setPhase(newPhase: GamePhase): void {
    const oldPhase = this.state.phase;
    if (oldPhase === newPhase) return;

    this.state.phase = newPhase;

    eventBus.emit(createEvent('PHASE_CHANGE', { from: oldPhase, to: newPhase }));
    this.notifySubscribers();
  }

  startGame(): void {
    if (this.state.phase !== Phase.MENU) return;

    this.state = this.createInitialState();
    this.state.phase = Phase.PLANNING;
    this.state.wave = 1;
    this.grid.reset();
    this.setupDefaultLevel();
    this.recalculatePath();

    eventBus.emit(createEvent('GAME_START', { wave: 1 }));
    this.start();
  }

  startWave(): void {
    if (this.state.phase !== Phase.PLANNING) return;

    this.setPhase(Phase.COMBAT);
    // Wave spawning will be handled by combat integration layer
  }

  endWave(): void {
    if (this.state.phase !== Phase.COMBAT) return;

    // Check if all enemies are cleared
    if (this.state.enemies.size === 0) {
      this.state.wave++;
      this.setPhase(Phase.PLANNING);
    }
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
    eventBus.emit(createEvent('GAME_OVER', { victory: true, score: this.state.score }));
  }

  defeat(): void {
    this.setPhase(Phase.DEFEAT);
    this.stop();
    eventBus.emit(createEvent('GAME_OVER', { victory: false, score: this.state.score }));
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

    // Render with interpolation
    const interpolation = this.accumulator / FIXED_TIMESTEP;
    this.render(interpolation);

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

    // Check for wave completion
    if (this.state.enemies.size === 0) {
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
      projectilePool.release(projectile);
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

  private enemyEscaped(enemy: Enemy): void {
    this.state.enemies.delete(enemy.id);
    this.state.lives--;

    eventBus.emit(createEvent('ENEMY_ESCAPED', { enemy, livesLost: 1 }));
    eventBus.emit(createEvent('LIVES_CHANGED', { amount: -1, newTotal: this.state.lives }));

    enemyPool.release(enemy);
    this.notifySubscribers();
  }

  private projectileHit(projectile: Projectile): void {
    const target = this.state.enemies.get(projectile.targetId);
    if (target) {
      const effectiveDamage = Math.max(0, projectile.damage - target.armor);
      target.health -= effectiveDamage;

      eventBus.emit(
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
    projectilePool.release(projectile);
  }

  private enemyKilled(enemy: Enemy, towerId: string): void {
    this.state.enemies.delete(enemy.id);
    this.state.credits += enemy.reward;
    this.state.score += enemy.reward;

    eventBus.emit(createEvent('ENEMY_KILLED', { enemy, towerId, reward: enemy.reward }));
    eventBus.emit(
      createEvent('CREDITS_CHANGED', { amount: enemy.reward, newTotal: this.state.credits })
    );

    enemyPool.release(enemy);
    this.notifySubscribers();
  }

  // ==========================================================================
  // Rendering
  // ==========================================================================

  private render(_interpolation: number): void {
    void _interpolation; // Will be used for smooth rendering
    if (!this.ctx || !this.canvas) return;

    const ctx = this.ctx;

    // Clear canvas
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    const renderContext: SpriteRenderContext = {
      ctx,
      cellSize: GAME_CONFIG.CELL_SIZE,
      time: this.state.time,
    };

    // Render grid
    this.renderGrid(renderContext);

    // Render path
    this.renderPath(renderContext);

    // Render towers (sprites will be called by integration layers)
    // Render enemies (sprites will be called by integration layers)
    // Render projectiles (sprites will be called by integration layers)
  }

  private renderGrid(context: SpriteRenderContext): void {
    const { ctx, cellSize } = context;
    const cells = this.grid.getCells();

    for (let y = 0; y < cells.length; y++) {
      for (let x = 0; x < cells[y].length; x++) {
        const cell = cells[y][x];
        const px = x * cellSize;
        const py = y * cellSize;

        // Grid lines
        ctx.strokeStyle = 'rgba(50, 50, 100, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(px, py, cellSize, cellSize);

        // Spawn/Exit markers
        if (cell === CS.SPAWN) {
          ctx.fillStyle = 'rgba(0, 255, 100, 0.3)';
          ctx.fillRect(px, py, cellSize, cellSize);
        } else if (cell === CS.EXIT) {
          ctx.fillStyle = 'rgba(255, 0, 100, 0.3)';
          ctx.fillRect(px, py, cellSize, cellSize);
        }
      }
    }
  }

  private renderPath(context: SpriteRenderContext): void {
    if (this.path.length < 2) return;

    const { ctx, cellSize } = context;

    ctx.strokeStyle = 'rgba(100, 150, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    ctx.beginPath();
    const first = this.path[0];
    ctx.moveTo(first.x * cellSize + cellSize / 2, first.y * cellSize + cellSize / 2);

    for (let i = 1; i < this.path.length; i++) {
      const point = this.path[i];
      ctx.lineTo(point.x * cellSize + cellSize / 2, point.y * cellSize + cellSize / 2);
    }

    ctx.stroke();
    ctx.setLineDash([]);
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

  getCell(position: Point): CellState {
    return this.grid.getCell(position);
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
      enemyPool.release(enemy);
      this.notifySubscribers();
    }
  }

  addProjectile(projectile: Projectile): void {
    this.state.projectiles.set(projectile.id, projectile);
  }

  addCredits(amount: number): void {
    this.state.credits += amount;
    eventBus.emit(createEvent('CREDITS_CHANGED', { amount, newTotal: this.state.credits }));
    this.notifySubscribers();
  }

  spendCredits(amount: number): boolean {
    if (this.state.credits < amount) return false;
    this.state.credits -= amount;
    eventBus.emit(
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
}

// ============================================================================
// Singleton Export
// ============================================================================

export const engine = new GameEngine();

export default engine;
