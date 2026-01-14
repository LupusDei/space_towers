// Damage Number Sprite Tests
// Tests for damage number object pooling and lifecycle

import { describe, it, expect, beforeEach } from 'vitest';
import { damageNumberPool, spawnDamageNumber } from './DamageNumberSprite';

// ============================================================================
// Test Constants
// ============================================================================

const DAMAGE_NUMBER_DURATION = 800; // Must match the value in DamageNumberSprite.ts

// ============================================================================
// DamageNumberPool Tests
// ============================================================================

describe('DamageNumberPool', () => {
  beforeEach(() => {
    damageNumberPool.clear();
  });

  describe('spawn', () => {
    it('should create an active damage number', () => {
      const num = spawnDamageNumber(100, { x: 50, y: 50 }, 0);

      expect(num.active).toBe(true);
      expect(num.value).toBe(100);
      expect(num.position.x).toBe(50);
      expect(num.position.y).toBe(50);
      expect(num.startTime).toBe(0);
    });

    it('should add spawned number to active list', () => {
      spawnDamageNumber(50, { x: 0, y: 0 }, 0);

      expect(damageNumberPool.getActive().length).toBe(1);
    });

    it('should handle multiple spawns', () => {
      spawnDamageNumber(10, { x: 0, y: 0 }, 0);
      spawnDamageNumber(20, { x: 10, y: 10 }, 0);
      spawnDamageNumber(30, { x: 20, y: 20 }, 0);

      expect(damageNumberPool.getActive().length).toBe(3);
    });
  });

  describe('update', () => {
    it('should keep active numbers that have not expired', () => {
      spawnDamageNumber(100, { x: 0, y: 0 }, 0);

      damageNumberPool.update(DAMAGE_NUMBER_DURATION - 1);

      expect(damageNumberPool.getActive().length).toBe(1);
    });

    it('should remove numbers that have expired', () => {
      spawnDamageNumber(100, { x: 0, y: 0 }, 0);

      damageNumberPool.update(DAMAGE_NUMBER_DURATION);

      expect(damageNumberPool.getActive().length).toBe(0);
    });

    it('should handle mixed expiration times correctly', () => {
      // Spawn numbers at different times
      spawnDamageNumber(100, { x: 0, y: 0 }, 0);
      spawnDamageNumber(200, { x: 10, y: 10 }, 500);
      spawnDamageNumber(300, { x: 20, y: 20 }, 1000);

      // At time 800, first should expire
      damageNumberPool.update(DAMAGE_NUMBER_DURATION);
      expect(damageNumberPool.getActive().length).toBe(2);

      // At time 1300, second should expire
      damageNumberPool.update(500 + DAMAGE_NUMBER_DURATION);
      expect(damageNumberPool.getActive().length).toBe(1);

      // Verify the remaining one is the last spawned
      expect(damageNumberPool.getActive()[0].value).toBe(300);
    });

    it('should remove all expired numbers in single update call', () => {
      // Spawn 10 numbers all at the same time
      for (let i = 0; i < 10; i++) {
        spawnDamageNumber(i * 10, { x: i, y: i }, 0);
      }
      expect(damageNumberPool.getActive().length).toBe(10);

      // All should expire at once
      damageNumberPool.update(DAMAGE_NUMBER_DURATION);
      expect(damageNumberPool.getActive().length).toBe(0);
    });

    it('should correctly handle removing elements with swap-and-pop', () => {
      // This test verifies the swap-and-pop doesn't miss elements
      // Spawn numbers with staggered expiration times
      spawnDamageNumber(1, { x: 0, y: 0 }, 0); // Expires at 800
      spawnDamageNumber(2, { x: 0, y: 0 }, 100); // Expires at 900
      spawnDamageNumber(3, { x: 0, y: 0 }, 200); // Expires at 1000
      spawnDamageNumber(4, { x: 0, y: 0 }, 300); // Expires at 1100
      spawnDamageNumber(5, { x: 0, y: 0 }, 400); // Expires at 1200

      // First expires
      damageNumberPool.update(DAMAGE_NUMBER_DURATION);
      expect(damageNumberPool.getActive().length).toBe(4);

      // Check remaining values are correct (order may vary due to swap-and-pop)
      const values = damageNumberPool.getActive().map((n) => n.value).sort((a, b) => a - b);
      expect(values).toEqual([2, 3, 4, 5]);
    });

    it('should mark removed numbers as inactive', () => {
      const num = spawnDamageNumber(100, { x: 0, y: 0 }, 0);

      damageNumberPool.update(DAMAGE_NUMBER_DURATION);

      expect(num.active).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all active numbers', () => {
      spawnDamageNumber(100, { x: 0, y: 0 }, 0);
      spawnDamageNumber(200, { x: 10, y: 10 }, 0);

      damageNumberPool.clear();

      expect(damageNumberPool.getActive().length).toBe(0);
    });

    it('should mark cleared numbers as inactive', () => {
      const num1 = spawnDamageNumber(100, { x: 0, y: 0 }, 0);
      const num2 = spawnDamageNumber(200, { x: 10, y: 10 }, 0);

      damageNumberPool.clear();

      expect(num1.active).toBe(false);
      expect(num2.active).toBe(false);
    });
  });

  describe('object pooling', () => {
    it('should reuse pooled objects after expiration', () => {
      // Spawn and let expire
      const num1 = spawnDamageNumber(100, { x: 0, y: 0 }, 0);
      const id1 = num1.id;

      damageNumberPool.update(DAMAGE_NUMBER_DURATION);

      // Spawn again - should get the recycled instance
      const num2 = spawnDamageNumber(200, { x: 10, y: 10 }, 1000);

      // The id should be reused (same pooled instance)
      expect(num2.id).toBe(id1);
      expect(num2.value).toBe(200);
      expect(num2.active).toBe(true);
    });
  });
});
