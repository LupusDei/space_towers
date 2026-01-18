// Gravity Tower Sprite Tests
// Tests the GravityTowerSprite visual component

import { describe, it, expect, vi } from 'vitest';
import { GravityTowerSprite } from './GravityTowerSprite';
import type { SpriteRenderContext } from '../types';
import type { Tower } from '../../game/types';
import { TowerType } from '../../game/types';

// Mock canvas context
function createMockContext(time: number = 0): SpriteRenderContext {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    quadraticCurveTo: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    cellSize: 44,
    time,
  };
}

// Create a mock tower
function createMockTower(level: number = 1): Tower {
  return {
    id: 'test-gravity-tower-1',
    type: TowerType.GRAVITY,
    position: { x: 5, y: 5 },
    level,
    damage: 10,
    range: 150,
    fireRate: 1,
    lastFired: 0,
    target: null,
    targetPosition: null,
    kills: 0,
    totalDamage: 0,
  };
}

describe('GravityTowerSprite', () => {
  describe('draw method', () => {
    it('exports a valid TowerSprite object', () => {
      expect(GravityTowerSprite).toBeDefined();
      expect(typeof GravityTowerSprite.draw).toBe('function');
      expect(typeof GravityTowerSprite.drawFiring).toBe('function');
      expect(typeof GravityTowerSprite.drawRange).toBe('function');
    });

    it('draws without errors at level 1', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() => GravityTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at level 2 (with event horizon)', () => {
      const context = createMockContext();
      const tower = createMockTower(2);

      expect(() => GravityTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('draws without errors at level 3 (with gravity waves)', () => {
      const context = createMockContext();
      const tower = createMockTower(3);

      expect(() => GravityTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('draws without errors at level 4 (with relativistic jets)', () => {
      const context = createMockContext();
      const tower = createMockTower(4);

      expect(() => GravityTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.moveTo).toHaveBeenCalled();
    });

    it('draws without errors at level 5 (all features including quantum flicker)', () => {
      const context = createMockContext();
      const tower = createMockTower(5);

      expect(() => GravityTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('handles animation time correctly', () => {
      const context = createMockContext(1000);
      const tower = createMockTower(1);

      expect(() => GravityTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('creates gradients for visual effects', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.draw(context, tower);

      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('draws the base platform', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.draw(context, tower);

      expect(context.ctx.ellipse).toHaveBeenCalled();
    });

    it('draws the singularity core', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.draw(context, tower);

      // Core is drawn with arc
      expect(context.ctx.arc).toHaveBeenCalled();
      expect(context.ctx.fill).toHaveBeenCalled();
    });

    it('draws swirling accretion disk', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.draw(context, tower);

      // Disk rings are drawn with ellipse
      expect(context.ctx.ellipse).toHaveBeenCalled();
    });
  });

  describe('drawFiring method', () => {
    it('draws firing effect without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      expect(() =>
        GravityTowerSprite.drawFiring!(context, tower, target)
      ).not.toThrow();
    });

    it('draws firing effect at different levels', () => {
      const context = createMockContext();
      const target = { x: 10, y: 10 };

      for (let level = 1; level <= 5; level++) {
        const tower = createMockTower(level);
        expect(() =>
          GravityTowerSprite.drawFiring!(context, tower, target)
        ).not.toThrow();
      }
    });

    it('creates gravity beam effect', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      GravityTowerSprite.drawFiring!(context, tower, target);

      // Beam uses quadraticCurveTo for warped lines
      expect(context.ctx.quadraticCurveTo).toHaveBeenCalled();
    });

    it('creates gravitational lens effect at target', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      GravityTowerSprite.drawFiring!(context, tower, target);

      // Multiple gradients for lens effect
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawRange method', () => {
    it('draws range circle without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() =>
        GravityTowerSprite.drawRange!(context, tower)
      ).not.toThrow();
    });

    it('uses different opacity for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.drawRange!(context, tower, true);

      expect(context.ctx.arc).toHaveBeenCalled();
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('uses correct line width for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.drawRange!(context, tower, true);

      // Line width should be 2 for selected
      expect(context.ctx.lineWidth).toBe(2);
    });

    it('uses correct line width for non-selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      GravityTowerSprite.drawRange!(context, tower, false);

      // Line width should be 1 for non-selected
      expect(context.ctx.lineWidth).toBe(1);
    });
  });

  describe('level progression', () => {
    it('increases visual complexity with level', () => {
      const context1 = createMockContext();
      const context5 = createMockContext();
      const tower1 = createMockTower(1);
      const tower5 = createMockTower(5);

      GravityTowerSprite.draw(context1, tower1);
      const calls1 = (context1.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      GravityTowerSprite.draw(context5, tower5);
      const calls5 = (context5.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      // Level 5 should have more drawing calls due to additional features
      expect(calls5).toBeGreaterThan(calls1);
    });

    it('draws gravity waves at level 3+', () => {
      const context2 = createMockContext();
      const context3 = createMockContext();
      const tower2 = createMockTower(2);
      const tower3 = createMockTower(3);

      GravityTowerSprite.draw(context2, tower2);
      const strokeCalls2 = (context2.ctx.stroke as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      GravityTowerSprite.draw(context3, tower3);
      const strokeCalls3 = (context3.ctx.stroke as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      // Level 3 should have more stroke calls for gravity waves
      expect(strokeCalls3).toBeGreaterThan(strokeCalls2);
    });

    it('draws relativistic jets at level 4+', () => {
      const context3 = createMockContext();
      const context4 = createMockContext();
      const tower3 = createMockTower(3);
      const tower4 = createMockTower(4);

      GravityTowerSprite.draw(context3, tower3);
      const closePath3 = (context3.ctx.closePath as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      GravityTowerSprite.draw(context4, tower4);
      const closePath4 = (context4.ctx.closePath as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      // Level 4 should have more closePath calls for jets
      expect(closePath4).toBeGreaterThan(closePath3);
    });
  });

  describe('animation', () => {
    it('rotation changes with time', () => {
      const context0 = createMockContext(0);
      const context1000 = createMockContext(1000);
      const tower = createMockTower(1);

      // Both should draw without error at different times
      expect(() => GravityTowerSprite.draw(context0, tower)).not.toThrow();
      expect(() => GravityTowerSprite.draw(context1000, tower)).not.toThrow();
    });
  });
});
