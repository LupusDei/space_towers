// WavePreview Utility Tests for Space Towers
// Tests the utility functions used by the WavePreview component

import { describe, it, expect } from 'vitest';
import { aggregateEnemies, isBossWave, getEnemyIcon, formatSpeed } from './wavePreview';
import { EnemyType, type WaveDefinition } from '../game/types';
import { ENEMY_STATS } from '../game/config';

describe('WavePreview Utilities', () => {
  describe('aggregateEnemies', () => {
    it('aggregates a single enemy type with stats', () => {
      const wave: WaveDefinition = {
        waveNumber: 1,
        spawns: [{ enemyType: EnemyType.SCOUT, count: 5, delay: 0, spawnInterval: 1000 }],
        reward: 25,
      };

      const result = aggregateEnemies(wave);

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe(EnemyType.SCOUT);
      expect(result[0].name).toBe(ENEMY_STATS[EnemyType.SCOUT].name);
      expect(result[0].count).toBe(5);
      expect(result[0].hp).toBe(ENEMY_STATS[EnemyType.SCOUT].health);
      expect(result[0].armor).toBe(ENEMY_STATS[EnemyType.SCOUT].armor);
      expect(result[0].speed).toBe(ENEMY_STATS[EnemyType.SCOUT].speed);
    });

    it('aggregates multiple enemy types', () => {
      const wave: WaveDefinition = {
        waveNumber: 3,
        spawns: [
          { enemyType: EnemyType.SCOUT, count: 5, delay: 0, spawnInterval: 1000 },
          { enemyType: EnemyType.FIGHTER, count: 3, delay: 3000, spawnInterval: 1500 },
        ],
        reward: 40,
      };

      const result = aggregateEnemies(wave);

      expect(result).toHaveLength(2);

      const scout = result.find((e) => e.type === EnemyType.SCOUT);
      const fighter = result.find((e) => e.type === EnemyType.FIGHTER);

      expect(scout).toBeDefined();
      expect(scout!.count).toBe(5);

      expect(fighter).toBeDefined();
      expect(fighter!.count).toBe(3);
    });

    it('combines counts for same enemy type appearing multiple times', () => {
      const wave: WaveDefinition = {
        waveNumber: 7,
        spawns: [
          { enemyType: EnemyType.SCOUT, count: 6, delay: 0, spawnInterval: 800 },
          { enemyType: EnemyType.FIGHTER, count: 5, delay: 2000, spawnInterval: 1000 },
          { enemyType: EnemyType.SCOUT, count: 4, delay: 5000, spawnInterval: 500 }, // More scouts later
        ],
        reward: 70,
      };

      const result = aggregateEnemies(wave);

      // Should combine scouts into one entry
      const scout = result.find((e) => e.type === EnemyType.SCOUT);
      expect(scout).toBeDefined();
      expect(scout!.count).toBe(10); // 6 + 4
    });

    it('handles empty spawns array', () => {
      const wave: WaveDefinition = {
        waveNumber: 0,
        spawns: [],
        reward: 0,
      };

      const result = aggregateEnemies(wave);

      expect(result).toHaveLength(0);
    });

    it('handles boss wave with escorts', () => {
      const wave: WaveDefinition = {
        waveNumber: 5,
        spawns: [
          { enemyType: EnemyType.FIGHTER, count: 4, delay: 0, spawnInterval: 1000 },
          { enemyType: EnemyType.BOSS, count: 1, delay: 5000, spawnInterval: 0 },
        ],
        reward: 100,
      };

      const result = aggregateEnemies(wave);

      expect(result).toHaveLength(2);

      const boss = result.find((e) => e.type === EnemyType.BOSS);
      expect(boss).toBeDefined();
      expect(boss!.count).toBe(1);
      expect(boss!.name).toBe(ENEMY_STATS[EnemyType.BOSS].name);
    });
  });

  describe('isBossWave', () => {
    it('returns true for wave with boss', () => {
      const wave: WaveDefinition = {
        waveNumber: 5,
        spawns: [
          { enemyType: EnemyType.FIGHTER, count: 4, delay: 0, spawnInterval: 1000 },
          { enemyType: EnemyType.BOSS, count: 1, delay: 5000, spawnInterval: 0 },
        ],
        reward: 100,
      };

      expect(isBossWave(wave)).toBe(true);
    });

    it('returns false for wave without boss', () => {
      const wave: WaveDefinition = {
        waveNumber: 3,
        spawns: [
          { enemyType: EnemyType.SCOUT, count: 5, delay: 0, spawnInterval: 1000 },
          { enemyType: EnemyType.FIGHTER, count: 3, delay: 3000, spawnInterval: 1500 },
        ],
        reward: 40,
      };

      expect(isBossWave(wave)).toBe(false);
    });

    it('returns false for empty wave', () => {
      const wave: WaveDefinition = {
        waveNumber: 0,
        spawns: [],
        reward: 0,
      };

      expect(isBossWave(wave)).toBe(false);
    });

    it('returns true even with only boss (no escorts)', () => {
      const wave: WaveDefinition = {
        waveNumber: 99,
        spawns: [{ enemyType: EnemyType.BOSS, count: 1, delay: 0, spawnInterval: 0 }],
        reward: 500,
      };

      expect(isBossWave(wave)).toBe(true);
    });
  });

  describe('getEnemyIcon', () => {
    it('returns diamond for scout', () => {
      expect(getEnemyIcon(EnemyType.SCOUT)).toBe('\u25C6');
    });

    it('returns square for fighter', () => {
      expect(getEnemyIcon(EnemyType.FIGHTER)).toBe('\u25A0');
    });

    it('returns hexagon for tank', () => {
      expect(getEnemyIcon(EnemyType.TANK)).toBe('\u2B22');
    });

    it('returns circle for swarm', () => {
      expect(getEnemyIcon(EnemyType.SWARM)).toBe('\u25CF');
    });

    it('returns star for boss', () => {
      expect(getEnemyIcon(EnemyType.BOSS)).toBe('\u2605');
    });
  });

  describe('formatSpeed', () => {
    it('returns vfast for speed >= 90', () => {
      expect(formatSpeed(100)).toBe('vfast');
      expect(formatSpeed(90)).toBe('vfast');
    });

    it('returns fast for speed 70-89', () => {
      expect(formatSpeed(89)).toBe('fast');
      expect(formatSpeed(70)).toBe('fast');
    });

    it('returns med for speed 50-69', () => {
      expect(formatSpeed(69)).toBe('med');
      expect(formatSpeed(50)).toBe('med');
    });

    it('returns slow for speed 35-49', () => {
      expect(formatSpeed(49)).toBe('slow');
      expect(formatSpeed(35)).toBe('slow');
    });

    it('returns vslow for speed < 35', () => {
      expect(formatSpeed(34)).toBe('vslow');
      expect(formatSpeed(25)).toBe('vslow');
    });
  });
});
