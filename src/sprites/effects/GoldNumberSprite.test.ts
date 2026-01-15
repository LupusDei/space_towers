// Gold Number Sprite Tests
// Tests for gold number object pooling and lifecycle

import { describe, it, expect, beforeEach } from 'vitest';
import { goldNumberPool, spawnGoldNumber } from './GoldNumberSprite';

// ============================================================================
// Test Constants
// ============================================================================

const GOLD_NUMBER_DURATION = 1000; // Must match the value in GoldNumberSprite.ts

// ============================================================================
// GoldNumberPool Tests
// ============================================================================

describe('GoldNumberPool', () => {
  beforeEach(() => {
    goldNumberPool.clear();
  });

  describe('spawn', () => {
    it('should create an active gold number', () => {
      const num = spawnGoldNumber(100, { x: 50, y: 50 }, 0);

      expect(num.active).toBe(true);
      expect(num.amount).toBe(100);
      expect(num.position.x).toBe(50);
      expect(num.position.y).toBe(50);
      expect(num.startTime).toBe(0);
    });

    it('should add spawned number to active list', () => {
      spawnGoldNumber(50, { x: 0, y: 0 }, 0);

      expect(goldNumberPool.getActive().length).toBe(1);
    });

    it('should handle multiple spawns', () => {
      spawnGoldNumber(10, { x: 0, y: 0 }, 0);
      spawnGoldNumber(20, { x: 10, y: 10 }, 0);
      spawnGoldNumber(30, { x: 20, y: 20 }, 0);

      expect(goldNumberPool.getActive().length).toBe(3);
    });
  });

  describe('update', () => {
    it('should keep active numbers that have not expired', () => {
      spawnGoldNumber(100, { x: 0, y: 0 }, 0);

      goldNumberPool.update(GOLD_NUMBER_DURATION - 1);

      expect(goldNumberPool.getActive().length).toBe(1);
    });

    it('should remove numbers that have expired', () => {
      spawnGoldNumber(100, { x: 0, y: 0 }, 0);

      goldNumberPool.update(GOLD_NUMBER_DURATION);

      expect(goldNumberPool.getActive().length).toBe(0);
    });

    it('should handle mixed expiration times correctly', () => {
      // Spawn numbers at different times
      spawnGoldNumber(100, { x: 0, y: 0 }, 0);
      spawnGoldNumber(200, { x: 10, y: 10 }, 500);
      spawnGoldNumber(300, { x: 20, y: 20 }, 1000);

      // At time 1000, first should expire
      goldNumberPool.update(GOLD_NUMBER_DURATION);
      expect(goldNumberPool.getActive().length).toBe(2);

      // At time 1500, second should expire
      goldNumberPool.update(500 + GOLD_NUMBER_DURATION);
      expect(goldNumberPool.getActive().length).toBe(1);

      // Verify the remaining one is the last spawned
      expect(goldNumberPool.getActive()[0].amount).toBe(300);
    });

    it('should remove all expired numbers in single update call', () => {
      // Spawn 10 numbers all at the same time
      for (let i = 0; i < 10; i++) {
        spawnGoldNumber(i * 10, { x: i, y: i }, 0);
      }
      expect(goldNumberPool.getActive().length).toBe(10);

      // All should expire at once
      goldNumberPool.update(GOLD_NUMBER_DURATION);
      expect(goldNumberPool.getActive().length).toBe(0);
    });

    it('should correctly handle removing elements with swap-and-pop', () => {
      // This test verifies the swap-and-pop doesn't miss elements
      // Spawn numbers with staggered expiration times
      spawnGoldNumber(1, { x: 0, y: 0 }, 0); // Expires at 1000
      spawnGoldNumber(2, { x: 0, y: 0 }, 100); // Expires at 1100
      spawnGoldNumber(3, { x: 0, y: 0 }, 200); // Expires at 1200
      spawnGoldNumber(4, { x: 0, y: 0 }, 300); // Expires at 1300
      spawnGoldNumber(5, { x: 0, y: 0 }, 400); // Expires at 1400

      // First expires
      goldNumberPool.update(GOLD_NUMBER_DURATION);
      expect(goldNumberPool.getActive().length).toBe(4);

      // Check remaining values are correct (order may vary due to swap-and-pop)
      const values = goldNumberPool.getActive().map((n) => n.amount).sort((a, b) => a - b);
      expect(values).toEqual([2, 3, 4, 5]);
    });

    it('should mark removed numbers as inactive', () => {
      const num = spawnGoldNumber(100, { x: 0, y: 0 }, 0);

      goldNumberPool.update(GOLD_NUMBER_DURATION);

      expect(num.active).toBe(false);
    });
  });

  describe('clear', () => {
    it('should remove all active numbers', () => {
      spawnGoldNumber(100, { x: 0, y: 0 }, 0);
      spawnGoldNumber(200, { x: 10, y: 10 }, 0);

      goldNumberPool.clear();

      expect(goldNumberPool.getActive().length).toBe(0);
    });

    it('should mark cleared numbers as inactive', () => {
      const num1 = spawnGoldNumber(100, { x: 0, y: 0 }, 0);
      const num2 = spawnGoldNumber(200, { x: 10, y: 10 }, 0);

      goldNumberPool.clear();

      expect(num1.active).toBe(false);
      expect(num2.active).toBe(false);
    });
  });

  describe('object pooling', () => {
    it('should reuse pooled objects after expiration', () => {
      // Spawn and let expire
      const num1 = spawnGoldNumber(100, { x: 0, y: 0 }, 0);
      const id1 = num1.id;

      goldNumberPool.update(GOLD_NUMBER_DURATION);

      // Spawn again - should get the recycled instance
      const num2 = spawnGoldNumber(200, { x: 10, y: 10 }, 1000);

      // The id should be reused (same pooled instance)
      expect(num2.id).toBe(id1);
      expect(num2.amount).toBe(200);
      expect(num2.active).toBe(true);
    });
  });
});
