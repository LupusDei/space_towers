// StormEffect Tests
// Tests for storm effect entity lifecycle and behavior

import { describe, it, expect, beforeEach } from 'vitest';
import { StormEffect, STORM_DEFAULTS } from './StormEffect';

describe('StormEffect', () => {
  let storm: StormEffect;

  beforeEach(() => {
    storm = new StormEffect();
  });

  describe('initialization', () => {
    it('should have default values', () => {
      expect(storm.id).toBe('');
      expect(storm.position).toEqual({ x: 0, y: 0 });
      expect(storm.radius).toBe(STORM_DEFAULTS.RADIUS);
      expect(storm.duration).toBe(STORM_DEFAULTS.DURATION);
      expect(storm.damagePerSecond).toBe(STORM_DEFAULTS.DAMAGE_PER_SECOND);
      expect(storm.active).toBe(false);
    });

    it('should initialize with provided values', () => {
      storm.init('storm_1', { x: 100, y: 200 }, 5);

      expect(storm.id).toBe('storm_1');
      expect(storm.position).toEqual({ x: 100, y: 200 });
      expect(storm.radius).toBe(50);
      expect(storm.duration).toBe(3);
      expect(storm.damagePerSecond).toBe(10);
      expect(storm.startTime).toBe(5);
      expect(storm.active).toBe(true);
    });

    it('should initialize with custom radius, duration, and damage', () => {
      storm.init('storm_2', { x: 50, y: 50 }, 0, 100, 5, 25);

      expect(storm.radius).toBe(100);
      expect(storm.duration).toBe(5);
      expect(storm.damagePerSecond).toBe(25);
    });
  });

  describe('update', () => {
    it('should return false while storm is active', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.update(1)).toBe(false);
      expect(storm.update(2)).toBe(false);
      expect(storm.update(2.9)).toBe(false);
    });

    it('should return true when storm expires', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.update(3)).toBe(true);
      expect(storm.active).toBe(false);
    });

    it('should return true for inactive storm', () => {
      expect(storm.update(0)).toBe(true);
    });

    it('should handle storms started at non-zero time', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 10);

      expect(storm.update(11)).toBe(false);
      expect(storm.update(12)).toBe(false);
      expect(storm.update(13)).toBe(true);
    });
  });

  describe('getRemainingDuration', () => {
    it('should return correct remaining duration', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.getRemainingDuration(0)).toBe(3);
      expect(storm.getRemainingDuration(1)).toBe(2);
      expect(storm.getRemainingDuration(2.5)).toBe(0.5);
    });

    it('should return 0 when expired', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.getRemainingDuration(5)).toBe(0);
    });

    it('should return 0 for inactive storm', () => {
      expect(storm.getRemainingDuration(0)).toBe(0);
    });
  });

  describe('containsPoint', () => {
    it('should return true for point at center', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      expect(storm.containsPoint({ x: 100, y: 100 })).toBe(true);
    });

    it('should return true for point within radius', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      expect(storm.containsPoint({ x: 120, y: 100 })).toBe(true);
      expect(storm.containsPoint({ x: 100, y: 140 })).toBe(true);
      expect(storm.containsPoint({ x: 135, y: 135 })).toBe(true);
    });

    it('should return true for point exactly on radius', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      expect(storm.containsPoint({ x: 150, y: 100 })).toBe(true);
    });

    it('should return false for point outside radius', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      expect(storm.containsPoint({ x: 200, y: 100 })).toBe(false);
      expect(storm.containsPoint({ x: 100, y: 200 })).toBe(false);
    });
  });

  describe('calculateDamage', () => {
    it('should calculate damage based on delta time', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.calculateDamage(1)).toBe(10);
      expect(storm.calculateDamage(0.5)).toBe(5);
      expect(storm.calculateDamage(0.1)).toBeCloseTo(1);
    });

    it('should use custom damage per second', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0, 50, 3, 25);

      expect(storm.calculateDamage(1)).toBe(25);
      expect(storm.calculateDamage(0.5)).toBe(12.5);
    });
  });

  describe('reset', () => {
    it('should reset all values to defaults', () => {
      storm.init('storm_1', { x: 100, y: 200 }, 5, 75, 10, 20);
      storm.reset();

      expect(storm.id).toBe('');
      expect(storm.position).toEqual({ x: 0, y: 0 });
      expect(storm.radius).toBe(STORM_DEFAULTS.RADIUS);
      expect(storm.duration).toBe(STORM_DEFAULTS.DURATION);
      expect(storm.damagePerSecond).toBe(STORM_DEFAULTS.DAMAGE_PER_SECOND);
      expect(storm.startTime).toBe(0);
      expect(storm.active).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return false for active storm within duration', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.isExpired(1)).toBe(false);
      expect(storm.isExpired(2.9)).toBe(false);
    });

    it('should return true when duration exceeded', () => {
      storm.init('storm_1', { x: 0, y: 0 }, 0);

      expect(storm.isExpired(3)).toBe(true);
      expect(storm.isExpired(5)).toBe(true);
    });

    it('should return true for inactive storm', () => {
      expect(storm.isExpired(0)).toBe(true);
    });
  });

  describe('isActive getter', () => {
    it('should return active state', () => {
      expect(storm.isActive).toBe(false);

      storm.init('storm_1', { x: 0, y: 0 }, 0);
      expect(storm.isActive).toBe(true);

      storm.update(5);
      expect(storm.isActive).toBe(false);
    });
  });

  describe('multiple enemies in storm', () => {
    it('should correctly identify multiple points within the storm radius', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      // Multiple enemy positions within radius
      const enemyPositions = [
        { x: 100, y: 100 }, // center
        { x: 120, y: 100 }, // right
        { x: 80, y: 100 }, // left
        { x: 100, y: 120 }, // below
        { x: 100, y: 80 }, // above
        { x: 135, y: 135 }, // diagonal (within ~50 radius)
      ];

      // All should be inside
      for (const pos of enemyPositions) {
        expect(storm.containsPoint(pos)).toBe(true);
      }
    });

    it('should correctly reject multiple points outside the storm radius', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      // Multiple enemy positions outside radius
      const outsidePositions = [
        { x: 200, y: 100 }, // far right
        { x: 0, y: 100 }, // far left
        { x: 100, y: 200 }, // far below
        { x: 100, y: 0 }, // far above
        { x: 160, y: 160 }, // diagonal outside
      ];

      // All should be outside
      for (const pos of outsidePositions) {
        expect(storm.containsPoint(pos)).toBe(false);
      }
    });

    it('should handle mixed positions (some inside, some outside)', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      const positions = [
        { x: 100, y: 100, expected: true }, // center
        { x: 200, y: 100, expected: false }, // outside
        { x: 120, y: 100, expected: true }, // inside
        { x: 160, y: 160, expected: false }, // outside diagonal
        { x: 135, y: 135, expected: true }, // inside diagonal
      ];

      for (const { x, y, expected } of positions) {
        expect(storm.containsPoint({ x, y })).toBe(expected);
      }
    });

    it('should calculate damage for multiple enemies over time', () => {
      storm.init('storm_1', { x: 100, y: 100 }, 0);

      // Simulate tick damage for 3 enemies over 1 second
      const deltaTime = 0.016; // ~60fps
      const ticksPerSecond = Math.floor(1 / deltaTime);
      const numEnemies = 3;

      let totalDamage = 0;
      for (let i = 0; i < ticksPerSecond; i++) {
        totalDamage += storm.calculateDamage(deltaTime) * numEnemies;
      }

      // Should be approximately 10 dps * 3 enemies = 30 damage per second
      expect(totalDamage).toBeCloseTo(30, 0);
    });
  });

  describe('level-up radius behavior', () => {
    it('should apply level 1 radius correctly (base radius)', () => {
      // Base Storm tower radius is 200 (from range stat)
      // Using 50 as a simplified base radius for entity tests
      storm.init('storm_1', { x: 100, y: 100 }, 0, 50); // radius = 50

      expect(storm.containsPoint({ x: 150, y: 100 })).toBe(true); // exactly on edge
      expect(storm.containsPoint({ x: 151, y: 100 })).toBe(false); // just outside
    });

    it('should apply larger radius at higher levels', () => {
      // Simulating level 3: base 50 + (2 * 15) = 80 radius
      storm.init('storm_1', { x: 100, y: 100 }, 0, 80);

      // Points that would be outside at level 1 but inside at level 3
      expect(storm.containsPoint({ x: 170, y: 100 })).toBe(true); // inside at 80 radius
      expect(storm.containsPoint({ x: 180, y: 100 })).toBe(true); // exactly on edge at 80
      expect(storm.containsPoint({ x: 181, y: 100 })).toBe(false); // just outside
    });

    it('should apply max level radius (level 5)', () => {
      // Simulating level 5: base 50 + (4 * 15) = 110 radius
      storm.init('storm_1', { x: 100, y: 100 }, 0, 110);

      // Points that would be outside at lower levels
      expect(storm.containsPoint({ x: 200, y: 100 })).toBe(true); // inside at 110
      expect(storm.containsPoint({ x: 210, y: 100 })).toBe(true); // exactly on edge at 110
      expect(storm.containsPoint({ x: 211, y: 100 })).toBe(false); // just outside
    });

    it('should apply level-scaled damage correctly', () => {
      // Level 1 storm: 10 dps
      const level1Storm = new StormEffect();
      level1Storm.init('storm_1', { x: 0, y: 0 }, 0, 50, 3, 10);
      expect(level1Storm.calculateDamage(1)).toBe(10);

      // Level 5 storm: 10 + (4 * 5) = 30 dps
      const level5Storm = new StormEffect();
      level5Storm.init('storm_5', { x: 0, y: 0 }, 0, 110, 5, 30);
      expect(level5Storm.calculateDamage(1)).toBe(30);
    });

    it('should apply level-scaled duration correctly', () => {
      // Level 1 storm: 3.0s duration
      const level1Storm = new StormEffect();
      level1Storm.init('storm_1', { x: 0, y: 0 }, 0, 50, 3.0, 10);
      expect(level1Storm.getRemainingDuration(0)).toBe(3.0);
      expect(level1Storm.isExpired(2.9)).toBe(false);
      expect(level1Storm.isExpired(3.0)).toBe(true);

      // Level 5 storm: 3.0 + (4 * 0.5) = 5.0s duration
      const level5Storm = new StormEffect();
      level5Storm.init('storm_5', { x: 0, y: 0 }, 0, 110, 5.0, 30);
      expect(level5Storm.getRemainingDuration(0)).toBe(5.0);
      expect(level5Storm.isExpired(4.9)).toBe(false);
      expect(level5Storm.isExpired(5.0)).toBe(true);
    });
  });
});
