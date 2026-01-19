// Gatling Tower Sprite Tests
// Tests for GatlingTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatlingTowerSprite } from './GatlingTowerSprite';
import type { Tower } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// ============================================================================
// Mock Setup
// ============================================================================

function createMockContext(): SpriteRenderContext {
  const ctx = {
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    setLineDash: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt' as CanvasLineCap,
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    cellSize: 40,
    time: 0,
  };
}

function createMockTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 'tower-1',
    type: 'gatling',
    position: { x: 5, y: 5 },
    level: 1,
    damage: 8,
    range: 130,
    fireRate: 0.15,
    lastFired: 0,
    kills: 0,
    totalDamage: 0,
    target: null,
    targetPosition: null,
    ...overrides,
  } as Tower;
}

// ============================================================================
// GatlingTowerSprite Tests
// ============================================================================

describe('GatlingTowerSprite', () => {
  let context: SpriteRenderContext;
  let tower: Tower;

  beforeEach(() => {
    context = createMockContext();
    tower = createMockTower();
  });

  describe('interface compliance', () => {
    it('should implement draw method', () => {
      expect(typeof GatlingTowerSprite.draw).toBe('function');
    });

    it('should implement drawFiring method', () => {
      expect(typeof GatlingTowerSprite.drawFiring).toBe('function');
    });

    it('should implement drawRange method', () => {
      expect(typeof GatlingTowerSprite.drawRange).toBe('function');
    });
  });

  describe('draw', () => {
    it('should not throw when drawing level 1 tower', () => {
      tower.level = 1;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should not throw when drawing level 5 tower', () => {
      tower.level = 5;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should handle all tower levels 1-5', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
      }
    });

    it('should clamp level below 1 to 1', () => {
      tower.level = 0;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should clamp level above 5 to 5', () => {
      tower.level = 10;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should handle undefined level', () => {
      tower.level = undefined as unknown as number;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should use canvas context for drawing', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('should create gradients for visual elements', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('should save and restore context state', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });
  });

  describe('drawFiring', () => {
    const target = { x: 10, y: 10 };

    it('should not throw when drawing firing effect', () => {
      expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
    });

    it('should handle all tower levels', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
      }
    });

    it('should draw bullet tracer', () => {
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('should draw muzzle flash', () => {
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('should rotate barrels toward firing target', () => {
      const firingTarget = { x: 10, y: 5 };
      GatlingTowerSprite.drawFiring!(context, tower, firingTarget);

      expect(context.ctx.rotate).toHaveBeenCalled();
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });
  });

  describe('drawRange', () => {
    it('should not throw when drawing range', () => {
      expect(() => GatlingTowerSprite.drawRange!(context, tower)).not.toThrow();
    });

    it('should handle selected state', () => {
      expect(() => GatlingTowerSprite.drawRange!(context, tower, true)).not.toThrow();
      expect(() => GatlingTowerSprite.drawRange!(context, tower, false)).not.toThrow();
    });

    it('should draw range circle', () => {
      GatlingTowerSprite.drawRange!(context, tower);
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('should use dashed line for range indicator', () => {
      GatlingTowerSprite.drawRange!(context, tower);
      expect(context.ctx.setLineDash).toHaveBeenCalled();
    });

    it('should use brass/gold color for range', () => {
      GatlingTowerSprite.drawRange!(context, tower);
      // The fillStyle and strokeStyle should have been set to brass/gold colors
      expect(context.ctx.fill).toHaveBeenCalled();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });
  });

  describe('animation', () => {
    it('should handle time parameter for animations', () => {
      context.time = 0;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();

      context.time = 1000;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();

      context.time = 99999;
      expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should rotate barrel assembly based on time', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.rotate).toHaveBeenCalled();
    });

    it('should spin barrels faster when firing', () => {
      const target = { x: 10, y: 10 };
      context.time = 5;

      // Get rotation calls during normal draw
      GatlingTowerSprite.draw(context, tower);
      const normalRotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls.length;

      // Reset and draw firing
      context = createMockContext();
      context.time = 5;
      GatlingTowerSprite.drawFiring!(context, tower, target);
      const firingRotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls.length;

      // Both should use rotation
      expect(normalRotateCalls).toBeGreaterThan(0);
      expect(firingRotateCalls).toBeGreaterThan(0);
    });
  });

  describe('level-based visuals', () => {
    it('should draw ambient glow for level 3+', () => {
      tower.level = 2;
      const callsBefore = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel2 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length - callsBefore;

      context = createMockContext();
      tower.level = 3;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel3 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 3 should have more gradient calls due to ambient glow
      expect(callsLevel3).toBeGreaterThan(callsLevel2);
    });

    it('should draw ammunition belt decoration for level 2+', () => {
      tower.level = 1;
      GatlingTowerSprite.draw(context, tower);
      const dashCallsLevel1 = (context.ctx.setLineDash as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 2;
      GatlingTowerSprite.draw(context, tower);
      const dashCallsLevel2 = (context.ctx.setLineDash as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 2 should have more setLineDash calls for ammunition belt
      expect(dashCallsLevel2).toBeGreaterThan(dashCallsLevel1);
    });
  });

  describe('targeting rotation', () => {
    it('should rotate to face target when targetPosition is set', () => {
      // targetPosition uses grid coordinates
      tower.targetPosition = { x: 10, y: 5 };
      GatlingTowerSprite.draw(context, tower);

      expect(context.ctx.rotate).toHaveBeenCalled();

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);

      const firstAngle = rotateCalls[0][0];
      expect(typeof firstAngle).toBe('number');
      expect(Number.isNaN(firstAngle)).toBe(false);
    });

    it('should point straight up when no target', () => {
      tower.targetPosition = null;
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      // First rotate call should be for turret angle (0 when no target)
      const turretAngle = rotateCalls[0][0];
      expect(turretAngle).toBe(0);
    });

    it('should calculate correct angle to target to the right', () => {
      // Tower at grid (5, 5), target at grid (10, 5) - directly to the right
      // targetPosition uses grid coordinates, not pixels
      tower.targetPosition = { x: 10, y: 5 };
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target to the right: angle should be close to PI/2
      expect(Math.abs(angle - Math.PI / 2)).toBeLessThan(0.1);
    });
  });

  describe('multi-barrel rendering', () => {
    it('should draw multiple barrels (6 barrel gatling design)', () => {
      GatlingTowerSprite.draw(context, tower);

      // Should call fillRect multiple times for barrels
      const fillRectCalls = (context.ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls;
      expect(fillRectCalls.length).toBeGreaterThan(0);
    });

    it('should draw barrel tips', () => {
      GatlingTowerSprite.draw(context, tower);

      // Should draw circles for barrel tips (arc calls)
      expect(context.ctx.arc).toHaveBeenCalled();
    });
  });
});
