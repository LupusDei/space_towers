// Needle Tower Sprite Tests
// Tests the NeedleTowerSprite visual component

import { describe, it, expect, vi } from 'vitest';
import { NeedleTowerSprite } from './NeedleTowerSprite';
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
    id: 'test-tower-1',
    type: TowerType.LASER, // Using LASER as placeholder, NEEDLE type may not exist yet
    position: { x: 5, y: 5 },
    level,
    damage: 10,
    range: 150,
    fireRate: 1,
    lastFired: 0,
    target: null,
    kills: 0,
    totalDamage: 0,
  };
}

describe('NeedleTowerSprite', () => {
  describe('draw method', () => {
    it('exports a valid TowerSprite object', () => {
      expect(NeedleTowerSprite).toBeDefined();
      expect(typeof NeedleTowerSprite.draw).toBe('function');
      expect(typeof NeedleTowerSprite.drawFiring).toBe('function');
      expect(typeof NeedleTowerSprite.drawRange).toBe('function');
    });

    it('draws without errors at level 1', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at level 3 (with secondary needles)', () => {
      const context = createMockContext();
      const tower = createMockTower(3);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at level 5 (all features)', () => {
      const context = createMockContext();
      const tower = createMockTower(5);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('handles animation time correctly', () => {
      const context = createMockContext(1000);
      const tower = createMockTower(1);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('creates gradients for metallic effects', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('draws the base platform', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.ellipse).toHaveBeenCalled();
    });

    it('draws hazard stripes at level 2+', () => {
      const context = createMockContext();
      const tower = createMockTower(2);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.clip).toHaveBeenCalled();
      expect(context.ctx.fillRect).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });

    it('does not draw hazard stripes at level 1', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.save).not.toHaveBeenCalled();
      expect(context.ctx.clip).not.toHaveBeenCalled();
    });
  });

  describe('drawFiring method', () => {
    it('draws firing beam without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      expect(() =>
        NeedleTowerSprite.drawFiring!(context, tower, target)
      ).not.toThrow();
    });

    it('draws firing beam at different levels', () => {
      const context = createMockContext();
      const target = { x: 10, y: 10 };

      for (let level = 1; level <= 5; level++) {
        const tower = createMockTower(level);
        expect(() =>
          NeedleTowerSprite.drawFiring!(context, tower, target)
        ).not.toThrow();
      }
    });

    it('creates impact glow at target', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      NeedleTowerSprite.drawFiring!(context, tower, target);

      // Multiple radial gradients should be created (tip glow + impact)
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawRange method', () => {
    it('draws range circle without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() =>
        NeedleTowerSprite.drawRange!(context, tower)
      ).not.toThrow();
    });

    it('uses different opacity for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.drawRange!(context, tower, true);

      expect(context.ctx.arc).toHaveBeenCalled();
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('uses correct line width for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.drawRange!(context, tower, true);

      // Line width should be 2 for selected
      expect(context.ctx.lineWidth).toBe(2);
    });

    it('uses correct line width for non-selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.drawRange!(context, tower, false);

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

      NeedleTowerSprite.draw(context1, tower1);
      const calls1 = (context1.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      NeedleTowerSprite.draw(context5, tower5);
      const calls5 = (context5.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      // Level 5 should have more drawing calls due to additional features
      expect(calls5).toBeGreaterThan(calls1);
    });
  });
});
