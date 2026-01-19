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

    describe('level-up stats', () => {
      it('should have correct damage per level', () => {
        // High base damage (50) with careful scaling (+35 per level)
        expect(sniperStats.damagePerLevel).toBe(35);
      });

      it('should have correct range per level', () => {
        // Already long range (350), modest increase per level
        expect(sniperStats.rangePerLevel).toBe(25);
      });

      it('should have correct fire rate improvement', () => {
        expect(sniperStats.fireRatePerLevel).toBe(-0.1);
      });

      it('should have correct upgrade costs', () => {
        expect(sniperStats.upgradeCosts).toEqual([85, 130, 195, 290]);
      });

      it('should have correct max level', () => {
        expect(sniperStats.maxLevel).toBe(5);
      });

      it('should have high damage at max level', () => {
        // Level 5: 50 + (4 * 35) = 190 damage
        const maxLevelDamage = sniperStats.damage + (sniperStats.maxLevel - 1) * sniperStats.damagePerLevel;
        expect(maxLevelDamage).toBe(190);
      });

      it('should have extended range at max level', () => {
        // Level 5: 350 + (4 * 25) = 450 range
        const maxLevelRange = sniperStats.range + (sniperStats.maxLevel - 1) * sniperStats.rangePerLevel;
        expect(maxLevelRange).toBe(450);
      });

      it('should have faster fire rate at max level', () => {
        // Level 5: 2.0 - (4 * 0.1) = 1.6s between shots
        const maxLevelFireRate = sniperStats.fireRate + (sniperStats.maxLevel - 1) * sniperStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(1.6, 2);
      });

      it('should maintain reasonable upgrade cost progression', () => {
        // Each upgrade should cost more than the previous
        for (let i = 1; i < sniperStats.upgradeCosts.length; i++) {
          expect(sniperStats.upgradeCosts[i]).toBeGreaterThan(sniperStats.upgradeCosts[i - 1]);
        }
      });

      it('should have total upgrade cost appropriate for premium tower', () => {
        // Total cost to max: 75 (base) + 85 + 130 + 195 + 290 = 775
        const totalCost = sniperStats.cost + sniperStats.upgradeCosts.reduce((a, b) => a + b, 0);
        expect(totalCost).toBe(775);
      });
    });
  });

  describe('STORM tower', () => {
    const stormStats = TOWER_STATS[TowerType.STORM];

    it('should have correct cost', () => {
      expect(stormStats.cost).toBe(100);
    });

    it('should have correct damage per second', () => {
      expect(stormStats.damage).toBe(10);
    });

    it('should have correct range', () => {
      expect(stormStats.range).toBe(200);
    });

    it('should have correct fire rate (cooldown)', () => {
      expect(stormStats.fireRate).toBe(4.0);
    });

    it('should have correct unlock cost', () => {
      expect(stormStats.unlockCost).toBe(0);
    });

    it('should have correct type', () => {
      expect(stormStats.type).toBe(TowerType.STORM);
    });

    it('should have correct name', () => {
      expect(stormStats.name).toBe('Storm Tower');
    });

    describe('level-up stats', () => {
      it('should have correct damage per level', () => {
        expect(stormStats.damagePerLevel).toBe(5);
      });

      it('should have correct range per level', () => {
        expect(stormStats.rangePerLevel).toBe(15);
      });

      it('should have correct fire rate improvement', () => {
        expect(stormStats.fireRatePerLevel).toBe(-0.2);
      });

      it('should have correct upgrade costs', () => {
        expect(stormStats.upgradeCosts).toEqual([120, 180, 270, 400]);
      });

      it('should have correct max level', () => {
        expect(stormStats.maxLevel).toBe(5);
      });

      it('should have correct base storm duration', () => {
        expect(stormStats.stormDuration).toBe(3.0);
      });

      it('should have correct storm duration per level', () => {
        expect(stormStats.stormDurationPerLevel).toBe(0.5);
      });

      it('should have correct base storm radius', () => {
        expect(stormStats.stormRadius).toBe(100);
      });

      it('should have correct storm radius per level', () => {
        expect(stormStats.stormRadiusPerLevel).toBe(10);
      });

      it('should have extended storm duration at max level', () => {
        // Level 5: 3.0 + (4 * 0.5) = 5.0 seconds
        const maxLevelDuration = stormStats.stormDuration! + (stormStats.maxLevel - 1) * stormStats.stormDurationPerLevel!;
        expect(maxLevelDuration).toBe(5.0);
      });

      it('should have larger storm radius at max level', () => {
        // Level 5: 100 + (4 * 10) = 140 pixels
        const maxLevelRadius = stormStats.stormRadius! + (stormStats.maxLevel - 1) * stormStats.stormRadiusPerLevel!;
        expect(maxLevelRadius).toBe(140);
      });

      it('should have higher damage at max level', () => {
        // Level 5: 10 + (4 * 5) = 30 damage per second
        const maxLevelDamage = stormStats.damage + (stormStats.maxLevel - 1) * stormStats.damagePerLevel;
        expect(maxLevelDamage).toBe(30);
      });

      it('should have faster cooldown at max level', () => {
        // Level 5: 4.0 - (4 * 0.2) = 3.2 seconds
        const maxLevelFireRate = stormStats.fireRate + (stormStats.maxLevel - 1) * stormStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(3.2, 2);
      });

      it('should have total upgrade cost appropriate for area denial tower', () => {
        // Total cost to max: 100 (base) + 120 + 180 + 270 + 400 = 1070
        const totalCost = stormStats.cost + stormStats.upgradeCosts.reduce((a, b) => a + b, 0);
        expect(totalCost).toBe(1070);
      });
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

    it('should be a starter tower (no unlock cost)', () => {
      expect(gravityStats.unlockCost).toBe(0);
    });

    it('should have correct type', () => {
      expect(gravityStats.type).toBe(TowerType.GRAVITY);
    });

    it('should have correct name', () => {
      expect(gravityStats.name).toBe('Gravity Tower');
    });

    describe('slow effect properties', () => {
      it('should have 50% slow multiplier', () => {
        expect(gravityStats.slowMultiplier).toBe(0.5);
      });

      it('should have 1 second base slow duration', () => {
        expect(gravityStats.slowDuration).toBe(1.0);
      });

      it('should have slow duration scaling per level', () => {
        expect(gravityStats.slowDurationPerLevel).toBe(0.2);
      });

      it('should have max slow duration of 1.8s at level 5', () => {
        // Level 5: 1.0 + (4 * 0.2) = 1.8s
        const maxSlowDuration =
          gravityStats.slowDuration! +
          (gravityStats.maxLevel - 1) * gravityStats.slowDurationPerLevel!;
        expect(maxSlowDuration).toBeCloseTo(1.8, 2);
      });
    });

    describe('level-up stats', () => {
      it('should have correct damage per level', () => {
        expect(gravityStats.damagePerLevel).toBe(3);
      });

      it('should have correct range per level', () => {
        expect(gravityStats.rangePerLevel).toBe(10);
      });

      it('should have correct fire rate per level', () => {
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
        const maxLevelDamage =
          gravityStats.damage + (gravityStats.maxLevel - 1) * gravityStats.damagePerLevel;
        expect(maxLevelDamage).toBe(17);
      });

      it('should have increased range at max level', () => {
        // Level 5: 100 + (4 * 10) = 140 range
        const maxLevelRange =
          gravityStats.range + (gravityStats.maxLevel - 1) * gravityStats.rangePerLevel;
        expect(maxLevelRange).toBe(140);
      });

      it('should have faster fire rate at max level', () => {
        // Level 5: 1.0 - (4 * 0.05) = 0.8s (1.25 shots/sec)
        const maxLevelFireRate =
          gravityStats.fireRate + (gravityStats.maxLevel - 1) * gravityStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(0.8, 2);
        expect(maxLevelFireRate).toBeGreaterThan(0);
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
