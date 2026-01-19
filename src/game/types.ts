// Core Types & Interfaces for Space Towers

// ============================================================================
// Basic Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

// ============================================================================
// Const Enums (erasableSyntaxOnly compatible)
// ============================================================================

export const GamePhase = {
  MENU: 'menu',
  TOWER_STORE: 'tower_store',
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
  GRAVITY: 'gravity',
  STORM: 'storm',
  SNIPER: 'sniper',
  NEEDLE: 'needle',
  GATLING: 'gatling',
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
  targetPosition: Point | null;
  kills: number;
  totalDamage: number;
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
  slowMultiplier: number;
  slowEndTime: number;
}

export interface Projectile {
  id: string;
  sourceId: string;
  targetId: string;
  towerType: TowerType;
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
  | 'WAVE_CREDITS_EARNED'
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
  | 'LIVES_CHANGED'
  | 'DAMAGE_NUMBER_REQUESTED'
  | 'EXPLOSION_REQUESTED'
  | 'GOLD_NUMBER_REQUESTED'
  | 'GRAVITY_PULSE_REQUESTED';

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

export interface WaveCreditsEarnedEvent extends GameEvent<{
  wave: number;
  creditsEarned: number;
  totalCredits: number;
}> {
  type: 'WAVE_CREDITS_EARNED';
}

export interface EnemySpawnEvent extends GameEvent<{ enemy: Enemy }> {
  type: 'ENEMY_SPAWN';
}

export interface EnemyKilledEvent extends GameEvent<{
  enemy: Enemy;
  towerId: string;
  reward: number;
}> {
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

export interface ProjectileHitEvent extends GameEvent<{
  projectile: Projectile;
  targetId: string;
  damage: number;
}> {
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

// Visual effect events - emitted by game logic, handled by rendering layer
export interface DamageNumberRequestedEvent extends GameEvent<{
  damage: number;
  position: Point;
  time: number;
}> {
  type: 'DAMAGE_NUMBER_REQUESTED';
}

export interface ExplosionRequestedEvent extends GameEvent<{
  position: Point;
  enemyType: EnemyType;
  time: number;
}> {
  type: 'EXPLOSION_REQUESTED';
}

export interface GoldNumberRequestedEvent extends GameEvent<{
  amount: number;
  position: Point;
  time: number;
}> {
  type: 'GOLD_NUMBER_REQUESTED';
}

export interface GravityPulseRequestedEvent extends GameEvent<{
  position: Point;
  time: number;
}> {
  type: 'GRAVITY_PULSE_REQUESTED';
}

export type GameEvents =
  | GameStartEvent
  | GameOverEvent
  | WaveStartEvent
  | WaveCompleteEvent
  | WaveCreditsEarnedEvent
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
  | LivesChangedEvent
  | DamageNumberRequestedEvent
  | ExplosionRequestedEvent
  | GoldNumberRequestedEvent
  | GravityPulseRequestedEvent;

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
  getEnemiesAlongPath(): Enemy[];
  getPath(): Point[];
  getCell(position: Point): CellState;
  getTowerAt(position: Point): Tower | undefined;
  getGameState(): GameState;
}

export interface CommandInterface {
  addProjectile(projectile: Projectile): void;
  removeEnemy(enemyId: string): void;
  addCredits(amount: number): void;
  getTime(): number;
  applySlow(enemyId: string, multiplier: number, duration: number): void;
  addStormEffect(position: Point, radius: number, duration: number, damagePerSecond: number): void;
}

export interface GameModule {
  name: string;
  init(query: QueryInterface, commands: CommandInterface): void;
  update(deltaTime: number): void;
  destroy(): void;
}

// ============================================================================
// Tower Stats (for config)
// ============================================================================

export interface TowerStats {
  type: TowerType;
  name: string;
  description: string; // Tower ability description for tooltips
  cost: number;
  damage: number;
  range: number;
  fireRate: number;
  unlockCost: number; // Wave credits required to unlock this tower
  // Leveling system
  maxLevel: number;
  upgradeCosts: number[]; // Cost to upgrade to each level (index 0 = cost for level 2)
  damagePerLevel: number;
  rangePerLevel: number;
  fireRatePerLevel: number; // Negative = faster (lower cooldown)
  // Special stats (optional, tower-specific)
  splashRadius?: number; // Missile tower base splash radius (cells)
  splashRadiusPerLevel?: number; // Missile tower splash increase per level
  chainCount?: number; // Tesla tower base chain targets
  chainCountPerLevel?: number; // Tesla tower chain increase per level
  stormDuration?: number; // Storm tower effect duration (seconds)
  stormDurationPerLevel?: number; // Storm tower duration increase per level
  stormRadius?: number; // Storm tower base AOE radius (pixels)
  stormRadiusPerLevel?: number; // Storm tower radius increase per level
  // Gravity tower slow effect
  slowDuration?: number; // Gravity tower base slow duration (seconds)
  slowDurationPerLevel?: number; // Gravity tower slow duration increase per level
  slowMultiplier?: number; // Gravity tower base slow strength (0.5 = 50% speed)
  slowMultiplierPerLevel?: number; // Gravity tower slow improvement per level (negative = stronger slow)
  // Gatling tower spin-up mechanic
  spinUpTime?: number; // Gatling tower time to reach max fire rate (seconds)
  spinUpFireRateMultiplier?: number; // Gatling tower initial fire rate multiplier (e.g., 0.25 = starts at 25% speed)
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

// ============================================================================
// Player Progress (Persistence)
// ============================================================================

export interface UserProgress {
  waveCredits: number;
  unlockedTowers: TowerType[];
  highestWaveCompleted: number;
  lastSelectedLoadout: TowerType[] | null;
}
