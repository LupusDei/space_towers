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

    describe('base stats', () => {
      it('should have correct cost', () => {
        expect(stormStats.cost).toBe(100);
      });

      it('should have correct base damage per second', () => {
        expect(stormStats.damage).toBe(10);
      });

      it('should have correct range (AOE radius)', () => {
        expect(stormStats.range).toBe(200);
      });

      it('should have correct fire rate (cooldown between storms)', () => {
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
    });

    describe('storm-specific stats', () => {
      it('should have base storm duration of 3 seconds', () => {
        expect(stormStats.stormDuration).toBe(3.0);
      });

      it('should have storm duration increase per level', () => {
        expect(stormStats.stormDurationPerLevel).toBe(0.5);
      });
    });

    describe('level-up stats', () => {
      it('should have max level of 5', () => {
        expect(stormStats.maxLevel).toBe(5);
      });

      it('should have correct upgrade costs', () => {
        expect(stormStats.upgradeCosts).toEqual([120, 180, 270, 400]);
      });

      it('should have correct damage per level (+5 DPS)', () => {
        expect(stormStats.damagePerLevel).toBe(5);
      });

      it('should have correct range per level (+15 AOE radius)', () => {
        expect(stormStats.rangePerLevel).toBe(15);
      });

      it('should have correct fire rate per level (-0.2s cooldown)', () => {
        expect(stormStats.fireRatePerLevel).toBe(-0.2);
      });
    });

    describe('calculated max level stats', () => {
      it('should have 30 DPS at max level (10 + 4*5)', () => {
        const maxLevelDamage = stormStats.damage + (stormStats.maxLevel - 1) * stormStats.damagePerLevel;
        expect(maxLevelDamage).toBe(30);
      });

      it('should have 260 range at max level (200 + 4*15)', () => {
        const maxLevelRange = stormStats.range + (stormStats.maxLevel - 1) * stormStats.rangePerLevel;
        expect(maxLevelRange).toBe(260);
      });

      it('should have 3.2s cooldown at max level (4.0 + 4*-0.2)', () => {
        const maxLevelFireRate = stormStats.fireRate + (stormStats.maxLevel - 1) * stormStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeCloseTo(3.2, 2);
      });

      it('should have 5.0s storm duration at max level (3.0 + 4*0.5)', () => {
        const maxLevelDuration = stormStats.stormDuration! + (stormStats.maxLevel - 1) * stormStats.stormDurationPerLevel!;
        expect(maxLevelDuration).toBe(5.0);
      });

      it('should maintain positive fire rate at max level', () => {
        const maxLevelFireRate = stormStats.fireRate + (stormStats.maxLevel - 1) * stormStats.fireRatePerLevel;
        expect(maxLevelFireRate).toBeGreaterThan(0);
      });
    });

    describe('level progression calculations', () => {
      it('should correctly calculate level 2 stats', () => {
        const level2Damage = stormStats.damage + 1 * stormStats.damagePerLevel;
        const level2Range = stormStats.range + 1 * stormStats.rangePerLevel;
        const level2Duration = stormStats.stormDuration! + 1 * stormStats.stormDurationPerLevel!;
        const level2FireRate = stormStats.fireRate + 1 * stormStats.fireRatePerLevel;

        expect(level2Damage).toBe(15);
        expect(level2Range).toBe(215);
        expect(level2Duration).toBe(3.5);
        expect(level2FireRate).toBeCloseTo(3.8, 2);
      });

      it('should correctly calculate level 3 stats', () => {
        const level3Damage = stormStats.damage + 2 * stormStats.damagePerLevel;
        const level3Range = stormStats.range + 2 * stormStats.rangePerLevel;
        const level3Duration = stormStats.stormDuration! + 2 * stormStats.stormDurationPerLevel!;
        const level3FireRate = stormStats.fireRate + 2 * stormStats.fireRatePerLevel;

        expect(level3Damage).toBe(20);
        expect(level3Range).toBe(230);
        expect(level3Duration).toBe(4.0);
        expect(level3FireRate).toBeCloseTo(3.6, 2);
      });

      it('should correctly calculate level 4 stats', () => {
        const level4Damage = stormStats.damage + 3 * stormStats.damagePerLevel;
        const level4Range = stormStats.range + 3 * stormStats.rangePerLevel;
        const level4Duration = stormStats.stormDuration! + 3 * stormStats.stormDurationPerLevel!;
        const level4FireRate = stormStats.fireRate + 3 * stormStats.fireRatePerLevel;

        expect(level4Damage).toBe(25);
        expect(level4Range).toBe(245);
        expect(level4Duration).toBe(4.5);
        expect(level4FireRate).toBeCloseTo(3.4, 2);
      });
    });

    describe('total investment cost', () => {
      it('should have total upgrade cost of 970 credits', () => {
        const totalUpgradeCost = stormStats.upgradeCosts.reduce((a, b) => a + b, 0);
        expect(totalUpgradeCost).toBe(970);
      });

      it('should have total investment cost of 1070 (base + upgrades)', () => {
        const totalCost = stormStats.cost + stormStats.upgradeCosts.reduce((a, b) => a + b, 0);
        expect(totalCost).toBe(1070);
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
