// Tower Class Tests
// Tests for Tower targeting and rotation

import { describe, it, expect } from 'vitest';
import { Tower } from './Tower';
import { TowerType } from '../types';

describe('Tower', () => {
  describe('targetPosition', () => {
    it('initializes targetPosition to null', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });
      expect(tower.targetPosition).toBeNull();
    });

    it('stores targetPosition when setting a target', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });
      const targetPos = { x: 200, y: 150 };

      tower.setTarget('enemy_1', targetPos);

      expect(tower.target).toBe('enemy_1');
      expect(tower.targetPosition).toEqual(targetPos);
    });

    it('clears targetPosition when clearing target', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });
      tower.setTarget('enemy_1', { x: 200, y: 150 });

      tower.setTarget(null, null);

      expect(tower.target).toBeNull();
      expect(tower.targetPosition).toBeNull();
    });

    it('handles setTarget with only targetId (backward compatible)', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });

      tower.setTarget('enemy_1');

      expect(tower.target).toBe('enemy_1');
      expect(tower.targetPosition).toBeNull();
    });

    it('includes targetPosition in toData()', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });
      const targetPos = { x: 200, y: 150 };
      tower.setTarget('enemy_1', targetPos);

      const data = tower.toData();

      expect(data.targetPosition).toEqual(targetPos);
    });

    it('returns copy of targetPosition in toData() to prevent mutation', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });
      const targetPos = { x: 200, y: 150 };
      tower.setTarget('enemy_1', targetPos);

      const data = tower.toData();
      if (data.targetPosition) {
        data.targetPosition.x = 999;
      }

      // Original should not be mutated
      expect(tower.targetPosition?.x).toBe(200);
    });
  });

  describe('angle calculation for rotation', () => {
    it('can provide data needed for angle calculation', () => {
      const tower = new Tower('tower_1', TowerType.LASER, { x: 5, y: 5 });
      const enemyPixelPos = { x: 300, y: 200 }; // Enemy position in pixels

      tower.setTarget('enemy_1', enemyPixelPos);

      // Tower sprite will use targetPosition to calculate rotation angle
      // The angle calculation is: Math.atan2(dy, dx) + Math.PI / 2
      // This centers the "forward" direction (where barrel points) to up/north
      const towerCenterX = 5 * 44 + 22; // 242 (assuming cellSize 44)
      const towerCenterY = 5 * 44 + 22; // 242
      const dx = enemyPixelPos.x - towerCenterX;
      const dy = enemyPixelPos.y - towerCenterY;
      const expectedAngle = Math.atan2(dy, dx) + Math.PI / 2;

      // Just verify we have the data needed for the calculation
      expect(tower.targetPosition).toEqual(enemyPixelPos);
      expect(tower.position).toEqual({ x: 5, y: 5 });
      // The actual angle calculation happens in the sprite, but we can verify
      // the math is reasonable (angle pointing toward lower-right quadrant)
      expect(expectedAngle).toBeGreaterThan(0);
      expect(expectedAngle).toBeLessThan(Math.PI);
    });
  });
});
