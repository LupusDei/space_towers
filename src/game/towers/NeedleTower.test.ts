// Needle Tower Tests
// Tests for rapid fire rate, rotation calculation, single target damage,
// DPS calculation, and level-up fire rate changes

import { describe, it, expect } from 'vitest';
import { Tower } from './Tower';
import { TowerType } from '../types';
import { TOWER_STATS } from '../config';

describe('Needle Tower', () => {
  const NEEDLE_STATS = TOWER_STATS[TowerType.NEEDLE];

  describe('rapid fire rate', () => {
    it('has a base fire rate of 0.25 seconds (4 shots per second)', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      expect(tower.fireRate).toBe(0.25);
      expect(NEEDLE_STATS.fireRate).toBe(0.25);
    });

    it('has the fastest fire rate among all tower types', () => {
      const needleFireRate = NEEDLE_STATS.fireRate;

      // Check against all other tower types
      for (const [type, stats] of Object.entries(TOWER_STATS)) {
        if (type !== TowerType.NEEDLE) {
          expect(needleFireRate).toBeLessThanOrEqual(stats.fireRate);
        }
      }
    });

    it('can fire 4 times per second at base level', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 200 });

      const shotsPerSecond = 1 / tower.fireRate;
      expect(shotsPerSecond).toBe(4);
    });

    it('is ready to fire immediately after creation', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      expect(tower.canFire()).toBe(true);
    });

    it('cannot fire again until cooldown expires', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 200 });

      tower.fire(0);

      expect(tower.canFire()).toBe(false);
    });

    it('can fire again after cooldown expires', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 200 });

      tower.fire(0);
      expect(tower.canFire()).toBe(false);

      // Advance time by fire rate (0.25 seconds)
      tower.update(0.25);

      expect(tower.canFire()).toBe(true);
    });

    it('accumulates multiple shots over time correctly', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 200 });

      let shotCount = 0;
      const totalTime = 1.0; // 1 second
      const deltaTime = 0.05; // 50ms steps
      let currentTime = 0;

      // Simulate 1 second of game time
      for (let t = 0; t < totalTime; t += deltaTime) {
        if (tower.canFire()) {
          tower.fire(currentTime);
          shotCount++;
        }
        tower.update(deltaTime);
        currentTime += deltaTime * 1000;
      }

      // Should fire 4 times in 1 second (at t=0, t=0.25, t=0.5, t=0.75)
      expect(shotCount).toBe(4);
    });
  });

  describe('rotation calculation', () => {
    it('stores target position for rotation calculation', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      const targetPos = { x: 300, y: 200 };

      tower.setTarget('enemy_1', targetPos);

      expect(tower.targetPosition).toEqual(targetPos);
    });

    it('clears target position when target is cleared', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 300, y: 200 });

      tower.setTarget(null, null);

      expect(tower.targetPosition).toBeNull();
    });

    it('provides data for calculating angle to target', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      const cellSize = 44;
      const towerCenterX = tower.position.x * cellSize + cellSize / 2;
      const towerCenterY = tower.position.y * cellSize + cellSize / 2;
      const targetPos = { x: 400, y: 300 };

      tower.setTarget('enemy_1', targetPos);

      // Calculate expected angle (what sprites use for rotation)
      const dx = targetPos.x - towerCenterX;
      const dy = targetPos.y - towerCenterY;
      const angle = Math.atan2(dy, dx) + Math.PI / 2;

      // Verify we have the data needed for angle calculation
      expect(tower.position.x).toBe(5);
      expect(tower.position.y).toBe(5);
      expect(tower.targetPosition).toEqual(targetPos);

      // Angle should point toward the target (lower-right in this case)
      expect(angle).toBeGreaterThan(0);
      expect(angle).toBeLessThan(Math.PI);
    });

    it('updates target position when target moves', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      tower.setTarget('enemy_1', { x: 300, y: 200 });
      expect(tower.targetPosition).toEqual({ x: 300, y: 200 });

      // Simulate target moving
      tower.setTarget('enemy_1', { x: 350, y: 250 });
      expect(tower.targetPosition).toEqual({ x: 350, y: 250 });
    });

    it('includes target position in toData() for serialization', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      const targetPos = { x: 300, y: 200 };
      tower.setTarget('enemy_1', targetPos);

      const data = tower.toData();

      expect(data.targetPosition).toEqual(targetPos);
    });
  });

  describe('single target damage', () => {
    it('has base damage of 10', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      expect(tower.damage).toBe(10);
      expect(NEEDLE_STATS.damage).toBe(10);
    });

    it('returns correct damage when firing', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 200 });

      const result = tower.fire(0);

      expect(result).not.toBeNull();
      expect(result!.damage).toBe(10);
      expect(result!.targetId).toBe('enemy_1');
    });

    it('returns null when no target is set', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      const result = tower.fire(0);

      expect(result).toBeNull();
    });

    it('returns null when on cooldown', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 200 });

      tower.fire(0); // First shot
      const result = tower.fire(100); // Second shot (still on cooldown)

      expect(result).toBeNull();
    });

    it('tracks total damage dealt', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      // Simulate damage being tracked (this is usually done by CombatModule)
      tower.totalDamage = 0;
      tower.totalDamage += tower.damage;
      tower.totalDamage += tower.damage;
      tower.totalDamage += tower.damage;

      expect(tower.totalDamage).toBe(30);
    });
  });

  describe('DPS calculation', () => {
    it('has theoretical DPS of 40 at base level (10 damage * 4 shots/sec)', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      const dps = tower.damage / tower.fireRate;

      expect(dps).toBe(40);
    });

    it('has lower per-shot damage than heavy hitters to balance fast fire rate', () => {
      const needleDamage = NEEDLE_STATS.damage;
      const missileDamage = TOWER_STATS[TowerType.MISSILE].damage;
      const cannonDamage = TOWER_STATS[TowerType.CANNON].damage;
      const sniperDamage = TOWER_STATS[TowerType.SNIPER].damage;

      // Needle should have lower per-shot damage than heavy hitting towers
      expect(needleDamage).toBeLessThan(missileDamage);
      expect(needleDamage).toBeLessThan(cannonDamage);
      expect(needleDamage).toBeLessThan(sniperDamage);
    });

    it('DPS increases with level upgrades', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      const baseDps = tower.damage / tower.fireRate;

      tower.upgrade(); // Level 2
      const level2Dps = tower.damage / tower.fireRate;

      tower.upgrade(); // Level 3
      const level3Dps = tower.damage / tower.fireRate;

      expect(level2Dps).toBeGreaterThan(baseDps);
      expect(level3Dps).toBeGreaterThan(level2Dps);
    });

    it('calculates DPS correctly at each level', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      const dpsAtLevels: number[] = [];

      // Record DPS at each level
      for (let level = 1; level <= NEEDLE_STATS.maxLevel; level++) {
        const dps = tower.damage / tower.fireRate;
        dpsAtLevels.push(dps);

        if (level < NEEDLE_STATS.maxLevel) {
          tower.upgrade();
        }
      }

      // Each level should have higher DPS than the previous
      for (let i = 1; i < dpsAtLevels.length; i++) {
        expect(dpsAtLevels[i]).toBeGreaterThan(dpsAtLevels[i - 1]);
      }

      // Level 1 DPS should be 40
      expect(dpsAtLevels[0]).toBe(40);
    });
  });

  describe('level-up fire rate changes', () => {
    it('has fire rate that decreases (faster) with each level', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });
      const baseFireRate = tower.fireRate;

      tower.upgrade(); // Level 2
      expect(tower.fireRate).toBeLessThan(baseFireRate);

      const level2FireRate = tower.fireRate;
      tower.upgrade(); // Level 3
      expect(tower.fireRate).toBeLessThan(level2FireRate);
    });

    it('decreases fire rate by 0.015 per level', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      tower.upgrade(); // Level 2

      // Fire rate should be: base + (level-1) * fireRatePerLevel
      // 0.25 + (2-1) * (-0.015) = 0.25 - 0.015 = 0.235
      expect(tower.fireRate).toBeCloseTo(0.235, 5);

      tower.upgrade(); // Level 3
      // 0.25 + (3-1) * (-0.015) = 0.25 - 0.030 = 0.22
      expect(tower.fireRate).toBeCloseTo(0.22, 5);
    });

    it('has correct fire rate at max level', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      // Upgrade to max level
      while (tower.level < NEEDLE_STATS.maxLevel) {
        tower.upgrade();
      }

      // Fire rate at max level: 0.25 + (5-1) * (-0.015) = 0.25 - 0.06 = 0.19
      const expectedFireRate =
        NEEDLE_STATS.fireRate +
        (NEEDLE_STATS.maxLevel - 1) * NEEDLE_STATS.fireRatePerLevel;
      expect(tower.fireRate).toBeCloseTo(expectedFireRate, 5);
      expect(tower.fireRate).toBeCloseTo(0.19, 5);
    });

    it('fires more shots per second at higher levels', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      const shotsPerSecondLevel1 = 1 / tower.fireRate;
      expect(shotsPerSecondLevel1).toBe(4);

      tower.upgrade(); // Level 2
      const shotsPerSecondLevel2 = 1 / tower.fireRate;
      expect(shotsPerSecondLevel2).toBeGreaterThan(shotsPerSecondLevel1);

      // At max level
      while (tower.level < NEEDLE_STATS.maxLevel) {
        tower.upgrade();
      }
      const shotsPerSecondMaxLevel = 1 / tower.fireRate;

      // Should fire approximately 5.26 shots per second at max level (1/0.19)
      expect(shotsPerSecondMaxLevel).toBeCloseTo(5.26, 1);
    });

    it('increases damage per level correctly', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      expect(tower.damage).toBe(10); // Level 1

      tower.upgrade(); // Level 2
      expect(tower.damage).toBe(16); // 10 + 6

      tower.upgrade(); // Level 3
      expect(tower.damage).toBe(22); // 10 + 12

      tower.upgrade(); // Level 4
      expect(tower.damage).toBe(28); // 10 + 18

      tower.upgrade(); // Level 5
      expect(tower.damage).toBe(34); // 10 + 24
    });

    it('increases range per level correctly', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      expect(tower.range).toBe(100); // Level 1

      tower.upgrade(); // Level 2
      expect(tower.range).toBe(108); // 100 + 8

      tower.upgrade(); // Level 3
      expect(tower.range).toBe(116); // 100 + 16
    });

    it('cannot upgrade beyond max level', () => {
      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      // Upgrade to max level
      while (tower.level < NEEDLE_STATS.maxLevel) {
        expect(tower.upgrade()).toBe(true);
      }

      // Try to upgrade beyond max
      expect(tower.upgrade()).toBe(false);
      expect(tower.level).toBe(NEEDLE_STATS.maxLevel);
    });

    it('has max level of 5', () => {
      expect(NEEDLE_STATS.maxLevel).toBe(5);

      const tower = new Tower('needle_1', TowerType.NEEDLE, { x: 5, y: 5 });

      let upgradeCount = 0;
      while (tower.upgrade()) {
        upgradeCount++;
      }

      expect(upgradeCount).toBe(4); // 4 upgrades to go from level 1 to 5
      expect(tower.level).toBe(5);
    });
  });

  describe('cost and upgrade costs', () => {
    it('has base cost of 100', () => {
      expect(NEEDLE_STATS.cost).toBe(100);
    });

    it('has correct upgrade costs', () => {
      expect(NEEDLE_STATS.upgradeCosts).toEqual([110, 165, 250, 375]);
    });

    it('has total upgrade cost of 900', () => {
      const totalUpgradeCost = NEEDLE_STATS.upgradeCosts.reduce(
        (sum, cost) => sum + cost,
        0
      );
      expect(totalUpgradeCost).toBe(900);
    });

    it('has total cost of 1000 (base + all upgrades)', () => {
      const totalCost =
        NEEDLE_STATS.cost +
        NEEDLE_STATS.upgradeCosts.reduce((sum, cost) => sum + cost, 0);
      expect(totalCost).toBe(1000);
    });
  });
});
