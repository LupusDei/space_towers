import { describe, it, expect } from 'vitest';
import { TOWER_STATS, COMBAT_CONFIG } from './config';
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

  describe('NEEDLE tower', () => {
    const needleStats = TOWER_STATS[TowerType.NEEDLE];

    it('should have correct cost', () => {
      expect(needleStats.cost).toBe(100);
    });

    it('should have correct damage', () => {
      expect(needleStats.damage).toBe(10);
    });

    it('should have correct range', () => {
      expect(needleStats.range).toBe(100);
    });

    it('should have very fast fire rate', () => {
      expect(needleStats.fireRate).toBe(0.25);
    });

    it('should have correct unlock cost', () => {
      expect(needleStats.unlockCost).toBe(20);
    });

    it('should have correct type', () => {
      expect(needleStats.type).toBe(TowerType.NEEDLE);
    });

    it('should have correct name', () => {
      expect(needleStats.name).toBe('Needle Tower');
    });

    describe('level-up stats', () => {
      it('should have correct damage per level', () => {
        expect(needleStats.damagePerLevel).toBe(6);
      });

      it('should have modest fire rate improvement (diminishing returns)', () => {
        // Fire rate improvement should be smaller than other towers
        // since Needle is already very fast
        expect(needleStats.fireRatePerLevel).toBe(-0.015);
      });

      it('should have correct upgrade costs', () => {
        expect(needleStats.upgradeCosts).toEqual([110, 165, 250, 375]);
      });

      it('should maintain fast fire rate at max level', () => {
        // At max level (5), fire rate should still be fast but not too extreme
        // Level 5: 0.25 - (4 * 0.015) = 0.19s (about 5.3 shots/sec)
        const maxLevelFireRate = needleStats.fireRate + (needleStats.maxLevel - 1) * needleStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(0.19, 2);
        expect(maxLevelFireRate).toBeGreaterThan(0.1); // Should not be too fast
      });

      it('should have meaningful damage at max level', () => {
        // Level 5: 10 + (4 * 6) = 34 damage
        const maxLevelDamage = needleStats.damage + (needleStats.maxLevel - 1) * needleStats.damagePerLevel;
        expect(maxLevelDamage).toBe(34);
      });
    });
  });

  describe('GRAVITY tower', () => {
    const gravityStats = TOWER_STATS[TowerType.GRAVITY];

    it('should have correct cost', () => {
      expect(gravityStats.cost).toBe(80);
    });

    it('should have correct damage', () => {
      expect(gravityStats.damage).toBe(5);
    });

    it('should have correct range', () => {
      expect(gravityStats.range).toBe(100);
    });

    it('should have correct fire rate', () => {
      expect(gravityStats.fireRate).toBe(1.0);
    });

    it('should have correct unlock cost (starter tower)', () => {
      expect(gravityStats.unlockCost).toBe(0);
    });

    it('should have correct type', () => {
      expect(gravityStats.type).toBe(TowerType.GRAVITY);
    });

    it('should have correct name', () => {
      expect(gravityStats.name).toBe('Gravity Tower');
    });

    describe('level-up stats', () => {
      it('should have correct damage per level', () => {
        expect(gravityStats.damagePerLevel).toBe(3);
      });

      it('should have correct range per level', () => {
        expect(gravityStats.rangePerLevel).toBe(8);
      });

      it('should have correct fire rate improvement per level', () => {
        expect(gravityStats.fireRatePerLevel).toBe(-0.05);
      });

      it('should have correct upgrade costs', () => {
        expect(gravityStats.upgradeCosts).toEqual([90, 135, 200, 300]);
      });

      it('should have max level of 5', () => {
        expect(gravityStats.maxLevel).toBe(5);
      });

      it('should have meaningful damage at max level', () => {
        // Level 5: 5 + (4 * 3) = 17 damage
        const maxLevelDamage = gravityStats.damage + (gravityStats.maxLevel - 1) * gravityStats.damagePerLevel;
        expect(maxLevelDamage).toBe(17);
      });

      it('should have improved range at max level', () => {
        // Level 5: 100 + (4 * 8) = 132 range
        const maxLevelRange = gravityStats.range + (gravityStats.maxLevel - 1) * gravityStats.rangePerLevel;
        expect(maxLevelRange).toBe(132);
      });

      it('should have faster fire rate at max level', () => {
        // Level 5: 1.0 + (4 * -0.05) = 0.8s between pulses
        const maxLevelFireRate = gravityStats.fireRate + (gravityStats.maxLevel - 1) * gravityStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(0.8, 2);
      });
    });
  });

  describe('GRAVITY slow constants', () => {
    it('should have correct slow multiplier (50% slow)', () => {
      expect(COMBAT_CONFIG.GRAVITY_SLOW_MULTIPLIER).toBe(0.5);
    });

    it('should have correct slow duration (1 second)', () => {
      expect(COMBAT_CONFIG.GRAVITY_SLOW_DURATION).toBe(1.0);
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
