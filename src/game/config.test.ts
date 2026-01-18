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

  describe('STORM tower', () => {
    const stormStats = TOWER_STATS[TowerType.STORM];

    it('should have correct cost', () => {
      expect(stormStats.cost).toBe(100);
    });

    it('should have correct damage (damage per second during storm)', () => {
      expect(stormStats.damage).toBe(10);
    });

    it('should have correct range (storm radius)', () => {
      expect(stormStats.range).toBe(200);
    });

    it('should have correct fire rate (cooldown between storms)', () => {
      expect(stormStats.fireRate).toBe(4.0);
    });

    it('should have correct type', () => {
      expect(stormStats.type).toBe(TowerType.STORM);
    });

    it('should have correct name', () => {
      expect(stormStats.name).toBe('Storm Tower');
    });

    describe('storm-specific stats', () => {
      it('should have storm duration', () => {
        expect(stormStats.stormDuration).toBe(3.0);
      });

      it('should have storm duration per level', () => {
        expect(stormStats.stormDurationPerLevel).toBe(0.5);
      });
    });

    describe('level-up stats', () => {
      it('should have correct damage per level', () => {
        expect(stormStats.damagePerLevel).toBe(5);
      });

      it('should have correct range per level (storm radius increase)', () => {
        expect(stormStats.rangePerLevel).toBe(15);
      });

      it('should have correct fire rate per level', () => {
        expect(stormStats.fireRatePerLevel).toBe(-0.2);
      });

      it('should have correct upgrade costs', () => {
        expect(stormStats.upgradeCosts).toEqual([120, 180, 270, 400]);
      });

      it('should scale storm duration correctly at max level', () => {
        // Level 5: 3.0 + (4 * 0.5) = 5.0s duration
        const maxLevelDuration =
          stormStats.stormDuration! + (stormStats.maxLevel - 1) * stormStats.stormDurationPerLevel!;
        expect(maxLevelDuration).toBe(5.0);
      });

      it('should scale storm radius correctly at max level', () => {
        // Level 5: 200 + (4 * 15) = 260 radius
        const maxLevelRadius = stormStats.range + (stormStats.maxLevel - 1) * stormStats.rangePerLevel;
        expect(maxLevelRadius).toBe(260);
      });

      it('should have meaningful damage at max level', () => {
        // Level 5: 10 + (4 * 5) = 30 damage per second
        const maxLevelDamage = stormStats.damage + (stormStats.maxLevel - 1) * stormStats.damagePerLevel;
        expect(maxLevelDamage).toBe(30);
      });

      it('should have faster storm spawn at max level', () => {
        // Level 5: 4.0 + (4 * -0.2) = 3.2s cooldown
        const maxLevelFireRate = stormStats.fireRate + (stormStats.maxLevel - 1) * stormStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(3.2, 2);
      });
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
