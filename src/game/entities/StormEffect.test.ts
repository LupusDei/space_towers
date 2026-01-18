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
});
