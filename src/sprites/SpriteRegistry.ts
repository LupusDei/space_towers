// Sprite Registry - Centralized sprite mapping to decouple components
// Allows sprite implementations to be swapped without touching consumers

import { TowerType, EnemyType } from '../game/types';
import type { TowerSprite, EnemySprite } from './types';

// Tower sprites
import { LaserTurretSprite } from './towers/LaserTurretSprite';
import { MissileBatterySprite } from './towers/MissileBatterySprite';
import { TeslaCoilSprite } from './towers/TeslaCoilSprite';
import { PlasmaCannonSprite } from './towers/PlasmaCannonSprite';

// Enemy sprites
import { ScoutDroneSprite } from './enemies/ScoutDroneSprite';
import { AssaultBotSprite } from './enemies/AssaultBotSprite';
import { HeavyMechSprite } from './enemies/HeavyMechSprite';
import { SwarmUnitSprite } from './enemies/SwarmUnitSprite';
import { BossSprite } from './enemies/BossSprite';

// Stateful sprite instances (classes that need instantiation)
const scoutDroneInstance = new ScoutDroneSprite();

// Tower type to sprite mapping
const towerSprites: Record<TowerType, TowerSprite> = {
  [TowerType.LASER]: LaserTurretSprite,
  [TowerType.MISSILE]: MissileBatterySprite,
  [TowerType.TESLA]: TeslaCoilSprite,
  [TowerType.CANNON]: PlasmaCannonSprite,
  [TowerType.GRAVITY]: LaserTurretSprite, // TODO: Replace with GravityWellSprite
  [TowerType.STORM]: TeslaCoilSprite, // TODO: Replace with StormSpire sprite
  [TowerType.NEEDLE]: LaserTurretSprite, // TODO: Replace with NeedleSprite
};

// Enemy type to sprite mapping
const enemySprites: Record<EnemyType, EnemySprite> = {
  [EnemyType.SCOUT]: scoutDroneInstance,
  [EnemyType.FIGHTER]: AssaultBotSprite,
  [EnemyType.TANK]: HeavyMechSprite,
  [EnemyType.SWARM]: SwarmUnitSprite,
  [EnemyType.BOSS]: BossSprite,
};

/**
 * Get the sprite implementation for a tower type
 */
export function getTowerSprite(type: TowerType): TowerSprite {
  return towerSprites[type];
}

/**
 * Get the sprite implementation for an enemy type
 */
export function getEnemySprite(type: EnemyType): EnemySprite {
  return enemySprites[type];
}

/**
 * Get the ScoutDroneSprite instance for damage flash triggers
 * This is needed because ScoutDroneSprite has stateful methods
 */
export function getScoutDroneSpriteInstance(): ScoutDroneSprite {
  return scoutDroneInstance;
}
