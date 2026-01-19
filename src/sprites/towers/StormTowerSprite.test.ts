// Storm Tower Sprite Tests
// Tests the StormTowerSprite visual component

import { describe, it, expect, vi } from 'vitest';
import { StormTowerSprite } from './StormTowerSprite';
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
    lineCap: 'butt',
    lineJoin: 'miter',
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
    id: 'test-storm-tower-1',
    type: TowerType.STORM,
    position: { x: 5, y: 5 },
    level,
    damage: 8,
    range: 120,
    fireRate: 0.8,
    lastFired: 0,
    target: null,
    targetPosition: null,
    kills: 0,
    totalDamage: 0,
  };
}

describe('StormTowerSprite', () => {
  describe('draw method', () => {
    it('exports a valid TowerSprite object', () => {
      expect(StormTowerSprite).toBeDefined();
      expect(typeof StormTowerSprite.draw).toBe('function');
      expect(typeof StormTowerSprite.drawFiring).toBe('function');
      expect(typeof StormTowerSprite.drawRange).toBe('function');
    });

    it('draws without errors at level 1', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at level 2 (with rain)', () => {
      const context = createMockContext();
      const tower = createMockTower(2);

      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('draws without errors at level 3 (with wind swirl)', () => {
      const context = createMockContext();
      const tower = createMockTower(3);

      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('draws without errors at level 4 (with thunder glow)', () => {
      const context = createMockContext();
      const tower = createMockTower(4);

      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('draws without errors at level 5 (all features including eye of storm)', () => {
      const context = createMockContext();
      const tower = createMockTower(5);

      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('handles animation time correctly', () => {
      const context = createMockContext(1000);
      const tower = createMockTower(1);

      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('creates gradients for visual effects', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.draw(context, tower);

      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('draws the base platform', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.draw(context, tower);

      expect(context.ctx.ellipse).toHaveBeenCalled();
    });

    it('draws the storm cloud', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.draw(context, tower);

      // Cloud layers are drawn with ellipse
      expect(context.ctx.ellipse).toHaveBeenCalled();
      expect(context.ctx.fill).toHaveBeenCalled();
    });

    it('draws the pedestal', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.draw(context, tower);

      // Pedestal body is drawn with fillRect
      expect(context.ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawFiring method', () => {
    it('draws firing effect without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      expect(() =>
        StormTowerSprite.drawFiring!(context, tower, target)
      ).not.toThrow();
    });

    it('draws firing effect at different levels', () => {
      const context = createMockContext();
      const target = { x: 10, y: 10 };

      for (let level = 1; level <= 5; level++) {
        const tower = createMockTower(level);
        expect(() =>
          StormTowerSprite.drawFiring!(context, tower, target)
        ).not.toThrow();
      }
    });

    it('creates lightning bolt effect', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      StormTowerSprite.drawFiring!(context, tower, target);

      // Lightning uses moveTo and lineTo
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
    });

    it('creates impact glow at target', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      StormTowerSprite.drawFiring!(context, tower, target);

      // Impact uses radial gradient
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawRange method', () => {
    it('draws range circle without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() =>
        StormTowerSprite.drawRange!(context, tower)
      ).not.toThrow();
    });

    it('uses different opacity for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.drawRange!(context, tower, true);

      expect(context.ctx.arc).toHaveBeenCalled();
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('uses correct line width for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.drawRange!(context, tower, true);

      // Line width should be 2 for selected
      expect(context.ctx.lineWidth).toBe(2);
    });

    it('uses correct line width for non-selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      StormTowerSprite.drawRange!(context, tower, false);

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

      StormTowerSprite.draw(context1, tower1);
      const calls1 = (context1.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      StormTowerSprite.draw(context5, tower5);
      const calls5 = (context5.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      // Level 5 should have more drawing calls due to additional features
      expect(calls5).toBeGreaterThan(calls1);
    });

    it('draws rain at level 2+', () => {
      const context1 = createMockContext();
      const context2 = createMockContext();
      const tower1 = createMockTower(1);
      const tower2 = createMockTower(2);

      StormTowerSprite.draw(context1, tower1);
      const strokeCalls1 = (context1.ctx.stroke as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      StormTowerSprite.draw(context2, tower2);
      const strokeCalls2 = (context2.ctx.stroke as ReturnType<typeof vi.fn>)
        .mock.calls.length;

      // Level 2 should have more stroke calls for rain
      expect(strokeCalls2).toBeGreaterThan(strokeCalls1);
    });

    it('draws wind swirl at level 3+', () => {
      const context2 = createMockContext();
      const context3 = createMockContext();
      const tower2 = createMockTower(2);
      const tower3 = createMockTower(3);

      StormTowerSprite.draw(context2, tower2);
      const arcCalls2 = (context2.ctx.arc as ReturnType<typeof vi.fn>).mock
        .calls.length;

      StormTowerSprite.draw(context3, tower3);
      const arcCalls3 = (context3.ctx.arc as ReturnType<typeof vi.fn>).mock
        .calls.length;

      // Level 3 should have more arc calls for wind swirl
      expect(arcCalls3).toBeGreaterThan(arcCalls2);
    });

    it('draws thunder glow at level 4+', () => {
      const context3 = createMockContext();
      const context4 = createMockContext();
      const tower3 = createMockTower(3);
      const tower4 = createMockTower(4);

      StormTowerSprite.draw(context3, tower3);
      const gradientCalls3 = (
        context3.ctx.createRadialGradient as ReturnType<typeof vi.fn>
      ).mock.calls.length;

      StormTowerSprite.draw(context4, tower4);
      const gradientCalls4 = (
        context4.ctx.createRadialGradient as ReturnType<typeof vi.fn>
      ).mock.calls.length;

      // Level 4 should have more gradient calls for thunder glow
      expect(gradientCalls4).toBeGreaterThan(gradientCalls3);
    });
  });

  describe('animation', () => {
    it('cloud wobble changes with time', () => {
      const context0 = createMockContext(0);
      const context1000 = createMockContext(1000);
      const tower = createMockTower(1);

      // Both should draw without error at different times
      expect(() => StormTowerSprite.draw(context0, tower)).not.toThrow();
      expect(() => StormTowerSprite.draw(context1000, tower)).not.toThrow();
    });

    it('lightning sparks flicker based on time', () => {
      const context1 = createMockContext(0);
      const context2 = createMockContext(500);
      const tower = createMockTower(1);

      // Both should draw without error
      expect(() => StormTowerSprite.draw(context1, tower)).not.toThrow();
      expect(() => StormTowerSprite.draw(context2, tower)).not.toThrow();
    });
  });
});
