// Core Types & Interfaces for Space Towers

// ============================================================================
// Basic Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

// ============================================================================
// Enums
// ============================================================================

export const GamePhase = {
  MENU: 'menu',
  PLANNING: 'planning',
  COMBAT: 'combat',
  PAUSED: 'paused',
  VICTORY: 'victory',
  DEFEAT: 'defeat',
} as const;

export type GamePhase = (typeof GamePhase)[keyof typeof GamePhase];

export const CellState = {
  EMPTY: 'empty',
  PATH: 'path',
  BLOCKED: 'blocked',
  TOWER: 'tower',
  SPAWN: 'spawn',
  EXIT: 'exit',
} as const;

export type CellState = (typeof CellState)[keyof typeof CellState];

export const TowerType = {
  LASER: 'laser',
  MISSILE: 'missile',
  TESLA: 'tesla',
  CANNON: 'cannon',
} as const;

export type TowerType = (typeof TowerType)[keyof typeof TowerType];

export const EnemyType = {
  SCOUT: 'scout',
  FIGHTER: 'fighter',
  TANK: 'tank',
  SWARM: 'swarm',
  BOSS: 'boss',
} as const;

export type EnemyType = (typeof EnemyType)[keyof typeof EnemyType];

// ============================================================================
// Game Entities
// ============================================================================

export interface Tower {
  id: string;
  type: TowerType;
  position: Point;
  level: number;
  damage: number;
  range: number;
  fireRate: number;
  lastFired: number;
  target: string | null;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  position: Point;
  health: number;
  maxHealth: number;
  speed: number;
  armor: number;
  reward: number;
  pathIndex: number;
  path: Point[];
}

export interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  position: Point;
  velocity: Point;
  damage: number;
  speed: number;
  piercing: boolean;
  aoe: number;
}

// ============================================================================
// Wave System
// ============================================================================

export interface WaveSpawn {
  enemyType: EnemyType;
  count: number;
  delay: number;
  spawnInterval: number;
}

export interface WaveDefinition {
  waveNumber: number;
  spawns: WaveSpawn[];
  reward: number;
}

// ============================================================================
// Game State
// ============================================================================

export interface GameState {
  phase: GamePhase;
  wave: number;
  lives: number;
  credits: number;
  score: number;
  towers: Map<string, Tower>;
  enemies: Map<string, Enemy>;
  projectiles: Map<string, Projectile>;
  grid: CellState[][];
  path: Point[];
  selectedTower: string | null;
  selectedTowerType: TowerType | null;
  isPaused: boolean;
}

// ============================================================================
// Event System
// ============================================================================

export type GameEventType =
  | 'GAME_START'
  | 'GAME_OVER'
  | 'WAVE_START'
  | 'WAVE_COMPLETE'
  | 'ENEMY_SPAWN'
  | 'ENEMY_KILLED'
  | 'ENEMY_ESCAPED'
  | 'TOWER_PLACED'
  | 'TOWER_SOLD'
  | 'TOWER_UPGRADED'
  | 'PROJECTILE_FIRED'
  | 'PROJECTILE_HIT'
  | 'PHASE_CHANGE'
  | 'CREDITS_CHANGED'
  | 'LIVES_CHANGED';

export interface GameEvent<T = unknown> {
  type: GameEventType;
  payload: T;
  timestamp: number;
}

export interface GameStartEvent extends GameEvent<{ wave: number }> {
  type: 'GAME_START';
}

export interface GameOverEvent extends GameEvent<{ victory: boolean; score: number }> {
  type: 'GAME_OVER';
}

export interface WaveStartEvent extends GameEvent<{ wave: number; definition: WaveDefinition }> {
  type: 'WAVE_START';
}

export interface WaveCompleteEvent extends GameEvent<{ wave: number; reward: number }> {
  type: 'WAVE_COMPLETE';
}

export interface EnemySpawnEvent extends GameEvent<{ enemy: Enemy }> {
  type: 'ENEMY_SPAWN';
}

export interface EnemyKilledEvent extends GameEvent<{ enemy: Enemy; towerId: string; reward: number }> {
  type: 'ENEMY_KILLED';
}

export interface EnemyEscapedEvent extends GameEvent<{ enemy: Enemy; livesLost: number }> {
  type: 'ENEMY_ESCAPED';
}

export interface TowerPlacedEvent extends GameEvent<{ tower: Tower; cost: number }> {
  type: 'TOWER_PLACED';
}

export interface TowerSoldEvent extends GameEvent<{ tower: Tower; refund: number }> {
  type: 'TOWER_SOLD';
}

export interface TowerUpgradedEvent extends GameEvent<{ tower: Tower; cost: number }> {
  type: 'TOWER_UPGRADED';
}

export interface ProjectileFiredEvent extends GameEvent<{ projectile: Projectile }> {
  type: 'PROJECTILE_FIRED';
}

export interface ProjectileHitEvent extends GameEvent<{ projectile: Projectile; targetId: string; damage: number }> {
  type: 'PROJECTILE_HIT';
}

export interface PhaseChangeEvent extends GameEvent<{ from: GamePhase; to: GamePhase }> {
  type: 'PHASE_CHANGE';
}

export interface CreditsChangedEvent extends GameEvent<{ amount: number; newTotal: number }> {
  type: 'CREDITS_CHANGED';
}

export interface LivesChangedEvent extends GameEvent<{ amount: number; newTotal: number }> {
  type: 'LIVES_CHANGED';
}

export type GameEvents =
  | GameStartEvent
  | GameOverEvent
  | WaveStartEvent
  | WaveCompleteEvent
  | EnemySpawnEvent
  | EnemyKilledEvent
  | EnemyEscapedEvent
  | TowerPlacedEvent
  | TowerSoldEvent
  | TowerUpgradedEvent
  | ProjectileFiredEvent
  | ProjectileHitEvent
  | PhaseChangeEvent
  | CreditsChangedEvent
  | LivesChangedEvent;

// ============================================================================
// Module System
// ============================================================================

export interface QueryInterface {
  getTowers(): Tower[];
  getEnemies(): Enemy[];
  getProjectiles(): Projectile[];
  getTowerById(id: string): Tower | undefined;
  getEnemyById(id: string): Enemy | undefined;
  getEnemiesInRange(position: Point, range: number): Enemy[];
  getPath(): Point[];
  getCell(position: Point): CellState;
  getGameState(): GameState;
}

export interface GameModule {
  name: string;
  init(query: QueryInterface): void;
  update(deltaTime: number): void;
  destroy(): void;
}

// ============================================================================
// Tower Stats (for config)
// ============================================================================

export interface TowerStats {
  type: TowerType;
  name: string;
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  upgradeCost: number;
  damagePerLevel: number;
  rangePerLevel: number;
  fireRatePerLevel: number;
}

// ============================================================================
// Enemy Stats (for config)
// ============================================================================

export interface EnemyStats {
  type: EnemyType;
  name: string;
  health: number;
  speed: number;
  armor: number;
  reward: number;
}
