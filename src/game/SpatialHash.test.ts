// Tests for Spatial Hash Grid

import { describe, it, expect, beforeEach } from 'vitest';
import { createSpatialHash, type SpatialHash } from './SpatialHash';
import type { Enemy } from './types';
import { EnemyType } from './types';
import { GAME_CONFIG } from './config';

function createMockEnemy(id: string, x: number, y: number): Enemy {
  return {
    id,
    type: EnemyType.SCOUT,
    position: { x, y },
    health: 100,
    maxHealth: 100,
    speed: 50,
    armor: 0,
    reward: 10,
    pathIndex: 0,
    path: [],
  };
}

describe('SpatialHash', () => {
  let spatialHash: SpatialHash;

  beforeEach(() => {
    spatialHash = createSpatialHash();
  });

  describe('insert and query', () => {
    it('should find enemy within range', () => {
      const enemy = createMockEnemy('e1', 100, 100);
      spatialHash.insert(enemy);

      // Query from grid position (0, 0) with range that includes pixel (100, 100)
      // Grid position (0, 0) is at pixel (0, 0), range of 200 should include (100, 100)
      const result = spatialHash.query({ x: 0, y: 0 }, 200);

      expect(result).toContain(enemy);
    });

    it('should not find enemy outside range', () => {
      const enemy = createMockEnemy('e1', 500, 500);
      spatialHash.insert(enemy);

      // Query from grid position (0, 0) with small range
      const result = spatialHash.query({ x: 0, y: 0 }, 50);

      expect(result).not.toContain(enemy);
    });

    it('should find multiple enemies in range', () => {
      const e1 = createMockEnemy('e1', 50, 50);
      const e2 = createMockEnemy('e2', 60, 60);
      const e3 = createMockEnemy('e3', 500, 500);

      spatialHash.insert(e1);
      spatialHash.insert(e2);
      spatialHash.insert(e3);

      // Query from grid position that covers e1 and e2
      const result = spatialHash.query({ x: 1, y: 1 }, 100);

      expect(result).toContain(e1);
      expect(result).toContain(e2);
      expect(result).not.toContain(e3);
    });
  });

  describe('remove', () => {
    it('should remove enemy from spatial hash', () => {
      const enemy = createMockEnemy('e1', 100, 100);
      spatialHash.insert(enemy);

      // Verify it's found
      let result = spatialHash.query({ x: 0, y: 0 }, 200);
      expect(result).toContain(enemy);

      // Remove
      spatialHash.remove(enemy);

      // Verify it's no longer found
      result = spatialHash.query({ x: 0, y: 0 }, 200);
      expect(result).not.toContain(enemy);
    });
  });

  describe('update', () => {
    it('should update enemy position in spatial hash', () => {
      const enemy = createMockEnemy('e1', 50, 50);
      spatialHash.insert(enemy);

      // Move enemy to a different cell
      enemy.position.x = 400;
      enemy.position.y = 400;
      spatialHash.update(enemy);

      // Should not be found at old position
      const oldResult = spatialHash.query({ x: 0, y: 0 }, 100);
      expect(oldResult).not.toContain(enemy);

      // Should be found at new position
      const newResult = spatialHash.query({ x: 400 / GAME_CONFIG.CELL_SIZE, y: 400 / GAME_CONFIG.CELL_SIZE }, 100);
      expect(newResult).toContain(enemy);
    });

    it('should handle update of non-inserted enemy (inserts it)', () => {
      const enemy = createMockEnemy('e1', 100, 100);

      // Update without insert should still work
      spatialHash.update(enemy);

      const result = spatialHash.query({ x: 0, y: 0 }, 200);
      expect(result).toContain(enemy);
    });
  });

  describe('clear', () => {
    it('should remove all enemies', () => {
      const e1 = createMockEnemy('e1', 100, 100);
      const e2 = createMockEnemy('e2', 200, 200);

      spatialHash.insert(e1);
      spatialHash.insert(e2);

      spatialHash.clear();

      // Neither should be found
      const result = spatialHash.query({ x: 0, y: 0 }, 1000);
      expect(result).toHaveLength(0);
    });
  });

  describe('rebuild', () => {
    it('should rebuild with new enemies', () => {
      const e1 = createMockEnemy('e1', 100, 100);
      spatialHash.insert(e1);

      const e2 = createMockEnemy('e2', 150, 150);
      const e3 = createMockEnemy('e3', 160, 160);

      // Rebuild with new set
      spatialHash.rebuild([e2, e3]);

      const result = spatialHash.query({ x: 0, y: 0 }, 300);

      expect(result).not.toContain(e1);
      expect(result).toContain(e2);
      expect(result).toContain(e3);
    });
  });

  describe('edge cases', () => {
    it('should handle enemies at canvas boundaries', () => {
      // Enemy at (0, 0)
      const e1 = createMockEnemy('e1', 0, 0);
      spatialHash.insert(e1);

      const result = spatialHash.query({ x: 0, y: 0 }, 50);
      expect(result).toContain(e1);
    });

    it('should handle query with very large range', () => {
      const e1 = createMockEnemy('e1', 100, 100);
      const e2 = createMockEnemy('e2', 500, 500);

      spatialHash.insert(e1);
      spatialHash.insert(e2);

      // Query with huge range should find both
      const result = spatialHash.query({ x: 0, y: 0 }, 10000);
      expect(result).toContain(e1);
      expect(result).toContain(e2);
    });

    it('should handle query with zero range', () => {
      // Enemy at center of cell (1,1) - pixel position (CELL_SIZE + CELL_SIZE/2, CELL_SIZE + CELL_SIZE/2)
      const centerX = GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const centerY = GAME_CONFIG.CELL_SIZE + GAME_CONFIG.CELL_SIZE / 2;
      const enemy = createMockEnemy('e1', centerX, centerY);
      spatialHash.insert(enemy);

      // Query at grid (1,1) with zero range - should find enemy at cell center
      const result = spatialHash.query({ x: 1, y: 1 }, 0);

      // The enemy is at the center of cell (1,1)
      // Query center is also at center of cell (1,1)
      // Distance is 0, so it should be found
      expect(result).toContain(enemy);
    });
  });
});
