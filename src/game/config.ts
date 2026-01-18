// Game Config & Constants for Space Towers

import { TowerType, EnemyType, type TowerStats, type EnemyStats } from './types';

// ============================================================================
// Game Configuration
// ============================================================================

export const GAME_CONFIG = {
  // Grid settings
  GRID_WIDTH: 20,
  GRID_HEIGHT: 15,
  CELL_SIZE: 44,

  // Timing
  TICK_RATE: 60,
  SPAWN_INTERVAL: 1000, // ms between enemy spawns in a wave

  // Economy
  STARTING_CREDITS: 200,
  STARTING_LIVES: 20,
  SELL_REFUND_PERCENT: 0.6,

  // Boss settings
  BOSS_SPAWN_WAVE: 5, // First boss at wave 5
  BOSS_WAVE_INTERVAL: 5, // Boss every 5 waves
  BOSS_HEALTH_MULTIPLIER: 3.0,
  BOSS_REWARD_MULTIPLIER: 5.0,

  // Gameplay
  MAX_TOWERS: 50,
  MAX_ENEMIES: 100,
  MAX_PROJECTILES: 200,

  // UI
  SELECTION_RANGE_OPACITY: 0.2,
} as const;

// ============================================================================
// Combat Configuration
// ============================================================================

export const COMBAT_CONFIG = {
  // Projectile settings
  DEFAULT_PROJECTILE_SPEED: 400, // pixels per second for projectile towers

  // Missile tower
  MISSILE_SPLASH_RADIUS: 1.5, // cells

  // Tesla tower
  TESLA_MAX_CHAIN: 2, // maximum chain targets
  TESLA_CHAIN_RANGE: 2, // cells for chain jump
  CHAIN_DAMAGE_FALLOFF: 0.7, // each chain target takes 70% of previous damage

  // Visual effect durations (ms)
  HITSCAN_EFFECT_DURATION: 100, // Brief flash for laser/tesla
  SPLASH_EFFECT_DURATION: 200,
} as const;

// ============================================================================
// Tower Statistics
// ============================================================================

export const TOWER_STATS: Record<TowerType, TowerStats> = {
  [TowerType.LASER]: {
    type: TowerType.LASER,
    name: 'Laser Tower',
    cost: 25,
    damage: 5,
    range: 150,
    fireRate: 0.5, // seconds between shots
    // Leveling: cheap, fast upgrades
    maxLevel: 5,
    upgradeCosts: [30, 45, 70, 100], // Total to max: 245
    damagePerLevel: 3,
    rangePerLevel: 10,
    fireRatePerLevel: -0.03, // faster = lower cooldown
  },

  [TowerType.MISSILE]: {
    type: TowerType.MISSILE,
    name: 'Missile Tower',
    cost: 50,
    damage: 20,
    range: 200,
    fireRate: 2.0,
    // Leveling: expensive but powerful AoE
    maxLevel: 5,
    upgradeCosts: [60, 90, 135, 200], // Total to max: 485
    damagePerLevel: 15,
    rangePerLevel: 15,
    fireRatePerLevel: -0.1,
    // Special: splash damage
    splashRadius: 1.5, // cells
    splashRadiusPerLevel: 0.25,
  },

  [TowerType.TESLA]: {
    type: TowerType.TESLA,
    name: 'Tesla Tower',
    cost: 40,
    damage: 8,
    range: 120,
    fireRate: 0.8,
    // Leveling: chain lightning specialist
    maxLevel: 5,
    upgradeCosts: [45, 70, 105, 155], // Total to max: 375
    damagePerLevel: 6,
    rangePerLevel: 10,
    fireRatePerLevel: -0.05,
    // Special: chain lightning
    chainCount: 2, // base chain targets
    chainCountPerLevel: 1, // +1 chain per level (max 6 at level 5)
  },

  [TowerType.CANNON]: {
    type: TowerType.CANNON,
    name: 'Cannon Tower',
    cost: 60,
    damage: 30,
    range: 175,
    fireRate: 2.5,
    // Leveling: heavy single-target damage
    maxLevel: 5,
    upgradeCosts: [75, 115, 170, 250], // Total to max: 610
    damagePerLevel: 25,
    rangePerLevel: 12,
    fireRatePerLevel: -0.12,
  },

  [TowerType.GRAVITY]: {
    type: TowerType.GRAVITY,
    name: 'Gravity Tower',
    cost: 80,
    damage: 5,
    range: 100,
    fireRate: 1.0,
    // Leveling: utility/slow tower
    maxLevel: 5,
    upgradeCosts: [90, 135, 200, 300], // Total to max: 725
    damagePerLevel: 3,
    rangePerLevel: 8,
    fireRatePerLevel: -0.05,
  },
};

// ============================================================================
// Enemy Statistics
// ============================================================================

export const ENEMY_STATS: Record<EnemyType, EnemyStats> = {
  [EnemyType.SCOUT]: {
    type: EnemyType.SCOUT,
    name: 'Scout',
    health: 30,
    speed: 80, // pixels per second
    armor: 0,
    reward: 10,
  },

  [EnemyType.FIGHTER]: {
    type: EnemyType.FIGHTER,
    name: 'Fighter',
    health: 60,
    speed: 60,
    armor: 0,
    reward: 20,
  },

  [EnemyType.TANK]: {
    type: EnemyType.TANK,
    name: 'Tank',
    health: 200,
    speed: 30,
    armor: 0,
    reward: 50,
  },

  [EnemyType.SWARM]: {
    type: EnemyType.SWARM,
    name: 'Swarm',
    health: 15,
    speed: 100,
    armor: 0,
    reward: 5,
  },

  [EnemyType.BOSS]: {
    type: EnemyType.BOSS,
    name: 'Boss',
    health: 500,
    speed: 25,
    armor: 0,
    reward: 200,
  },
};

// ============================================================================
// Derived Constants
// ============================================================================

export const CANVAS_WIDTH = GAME_CONFIG.GRID_WIDTH * GAME_CONFIG.CELL_SIZE;
export const CANVAS_HEIGHT = GAME_CONFIG.GRID_HEIGHT * GAME_CONFIG.CELL_SIZE;
export const FRAME_TIME = 1000 / GAME_CONFIG.TICK_RATE;
