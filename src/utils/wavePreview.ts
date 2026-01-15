// Wave Preview Utility Functions

import { EnemyType, type WaveDefinition } from '../game/types';
import { ENEMY_STATS } from '../game/config';

export interface EnemySummary {
  type: EnemyType;
  name: string;
  count: number;
  hp: number;
  armor: number;
  speed: number;
}

/**
 * Aggregates spawn data into enemy type summaries
 */
export function aggregateEnemies(wave: WaveDefinition): EnemySummary[] {
  const counts = new Map<EnemyType, number>();

  for (const spawn of wave.spawns) {
    const current = counts.get(spawn.enemyType) || 0;
    counts.set(spawn.enemyType, current + spawn.count);
  }

  return Array.from(counts.entries()).map(([type, count]) => {
    const stats = ENEMY_STATS[type];
    return {
      type,
      name: stats.name,
      count,
      hp: stats.health,
      armor: stats.armor,
      speed: stats.speed,
    };
  });
}

/**
 * Checks if a wave contains a boss enemy
 */
export function isBossWave(wave: WaveDefinition): boolean {
  return wave.spawns.some((spawn) => spawn.enemyType === EnemyType.BOSS);
}

/**
 * Returns an icon/symbol for each enemy type
 */
export function getEnemyIcon(type: EnemyType): string {
  switch (type) {
    case EnemyType.SCOUT:
      return '\u25C6'; // Diamond
    case EnemyType.FIGHTER:
      return '\u25A0'; // Square
    case EnemyType.TANK:
      return '\u2B22'; // Hexagon
    case EnemyType.SWARM:
      return '\u25CF'; // Circle
    case EnemyType.BOSS:
      return '\u2605'; // Star
    default:
      return '\u25CF';
  }
}

/**
 * Converts numeric speed to a descriptive label
 */
export function formatSpeed(speed: number): string {
  if (speed >= 90) return 'vfast';
  if (speed >= 70) return 'fast';
  if (speed >= 50) return 'med';
  if (speed >= 35) return 'slow';
  return 'vslow';
}
