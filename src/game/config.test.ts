import { describe, it, expect } from 'vitest';
import { TOWER_STATS } from './config';
import { TowerType } from './types';

describe('TOWER_STATS', () => {
  describe('SNIPER tower', () => {
    const sniperStats = TOWER_STATS[TowerType.SNIPER];

    it('should have correct cost', () => {
      expect(sniperStats.cost).toBe(75);
    });

    it('should have correct damage', () => {
      expect(sniperStats.damage).toBe(50);
    });

    it('should have correct range', () => {
      expect(sniperStats.range).toBe(350);
    });

    it('should have correct fire rate', () => {
      expect(sniperStats.fireRate).toBe(2.0);
    });

    it('should have correct unlock cost', () => {
      expect(sniperStats.unlockCost).toBe(10);
    });

    it('should have correct type', () => {
      expect(sniperStats.type).toBe(TowerType.SNIPER);
    });

    it('should have correct name', () => {
      expect(sniperStats.name).toBe('Sniper Tower');
    });
  });

  describe('all tower types', () => {
    const towerTypes = Object.values(TowerType) as TowerType[];

    towerTypes.forEach((type) => {
      describe(`${type} tower`, () => {
        const stats = TOWER_STATS[type];

        it('should have a defined config', () => {
          expect(stats).toBeDefined();
        });

        it('should have matching type field', () => {
          expect(stats.type).toBe(type);
        });

        it('should have positive cost', () => {
          expect(stats.cost).toBeGreaterThan(0);
        });

        it('should have positive damage', () => {
          expect(stats.damage).toBeGreaterThan(0);
        });

        it('should have positive range', () => {
          expect(stats.range).toBeGreaterThan(0);
        });

        it('should have positive fire rate', () => {
          expect(stats.fireRate).toBeGreaterThan(0);
        });

        it('should have non-negative unlock cost', () => {
          expect(stats.unlockCost).toBeGreaterThanOrEqual(0);
        });

        it('should have valid leveling stats', () => {
          expect(stats.maxLevel).toBeGreaterThanOrEqual(1);
          expect(stats.upgradeCosts.length).toBe(stats.maxLevel - 1);
          expect(stats.damagePerLevel).toBeGreaterThan(0);
          expect(stats.rangePerLevel).toBeGreaterThan(0);
        });
      });
    });
  });
});
