// Enemy Class Tests
// Tests for Enemy slow effect system

import { describe, it, expect, beforeEach } from 'vitest';
import { Enemy } from './Enemy';

describe('Enemy', () => {
  let enemy: Enemy;

  beforeEach(() => {
    enemy = new Enemy();
    enemy.init('enemy_1', 'scout', { x: 0, y: 0 });
  });

  describe('slow effect properties', () => {
    it('initializes with no slow effect (multiplier = 1)', () => {
      expect(enemy.slowMultiplier).toBe(1);
      expect(enemy.slowEndTime).toBe(0);
    });

    it('reset() clears slow effect properties', () => {
      enemy.slowMultiplier = 0.5;
      enemy.slowEndTime = 5000;

      enemy.reset();

      expect(enemy.slowMultiplier).toBe(1);
      expect(enemy.slowEndTime).toBe(0);
    });
  });

  describe('applySlow', () => {
    it('applies slow effect when enemy has no active slow', () => {
      enemy.applySlow(0.5, 5000);

      expect(enemy.slowMultiplier).toBe(0.5);
      expect(enemy.slowEndTime).toBe(5000);
    });

    it('updates slow effect if new endTime is later', () => {
      enemy.applySlow(0.5, 5000);
      enemy.applySlow(0.3, 8000);

      expect(enemy.slowMultiplier).toBe(0.3);
      expect(enemy.slowEndTime).toBe(8000);
    });

    it('does not update slow effect if new endTime is earlier', () => {
      enemy.applySlow(0.5, 5000);
      enemy.applySlow(0.3, 3000);

      expect(enemy.slowMultiplier).toBe(0.5);
      expect(enemy.slowEndTime).toBe(5000);
    });

    it('does not update slow effect if new endTime is equal', () => {
      enemy.applySlow(0.5, 5000);
      enemy.applySlow(0.3, 5000);

      expect(enemy.slowMultiplier).toBe(0.5);
      expect(enemy.slowEndTime).toBe(5000);
    });
  });

  describe('isSlowed', () => {
    it('returns false when enemy has no slow effect', () => {
      expect(enemy.isSlowed(1000)).toBe(false);
    });

    it('returns true when current time is before slowEndTime', () => {
      enemy.applySlow(0.5, 5000);

      expect(enemy.isSlowed(1000)).toBe(true);
      expect(enemy.isSlowed(4999)).toBe(true);
    });

    it('returns false when current time equals slowEndTime', () => {
      enemy.applySlow(0.5, 5000);

      expect(enemy.isSlowed(5000)).toBe(false);
    });

    it('returns false when current time is after slowEndTime', () => {
      enemy.applySlow(0.5, 5000);

      expect(enemy.isSlowed(5001)).toBe(false);
      expect(enemy.isSlowed(10000)).toBe(false);
    });
  });

  describe('getEffectiveSpeed', () => {
    it('returns base speed when not slowed', () => {
      const baseSpeed = enemy.speed;

      expect(enemy.getEffectiveSpeed(1000)).toBe(baseSpeed);
    });

    it('returns reduced speed when slowed', () => {
      const baseSpeed = enemy.speed;
      enemy.applySlow(0.5, 5000);

      expect(enemy.getEffectiveSpeed(1000)).toBe(baseSpeed * 0.5);
    });

    it('returns base speed after slow expires', () => {
      const baseSpeed = enemy.speed;
      enemy.applySlow(0.5, 5000);

      expect(enemy.getEffectiveSpeed(6000)).toBe(baseSpeed);
    });

    it('handles different slow multipliers', () => {
      const baseSpeed = enemy.speed;

      enemy.applySlow(0.3, 5000);
      expect(enemy.getEffectiveSpeed(1000)).toBe(baseSpeed * 0.3);

      enemy.applySlow(0.7, 8000);
      expect(enemy.getEffectiveSpeed(6000)).toBe(baseSpeed * 0.7);
    });
  });

  describe('path property', () => {
    it('initializes with empty path', () => {
      const newEnemy = new Enemy();
      expect(newEnemy.path).toEqual([]);
    });

    it('reset() clears path', () => {
      enemy.path = [{ x: 0, y: 0 }, { x: 1, y: 1 }];

      enemy.reset();

      expect(enemy.path).toEqual([]);
    });
  });
});
