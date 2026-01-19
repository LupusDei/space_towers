// Sniper Tower Sprite Tests
// Tests for SniperTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SniperTowerSprite } from './SniperTowerSprite';
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
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    setLineDash: vi.fn(),
    roundRect: vi.fn(),
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
    type: 'laser',
    position: { x: 5, y: 5 },
    level: 1,
    damage: 10,
    range: 100,
    fireRate: 1,
    lastFired: 0,
    kills: 0,
    totalDamage: 0,
    target: null,
    targetPosition: null,
    ...overrides,
  } as Tower;
}

// ============================================================================
// SniperTowerSprite Tests
// ============================================================================

describe('SniperTowerSprite', () => {
  let context: SpriteRenderContext;
  let tower: Tower;

  beforeEach(() => {
    context = createMockContext();
    tower = createMockTower();
  });

  describe('interface compliance', () => {
    it('should implement draw method', () => {
      expect(typeof SniperTowerSprite.draw).toBe('function');
    });

    it('should implement drawFiring method', () => {
      expect(typeof SniperTowerSprite.drawFiring).toBe('function');
    });

    it('should implement drawRange method', () => {
      expect(typeof SniperTowerSprite.drawRange).toBe('function');
    });
  });

  describe('draw', () => {
    it('should not throw when drawing level 1 tower', () => {
      tower.level = 1;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should not throw when drawing level 5 tower', () => {
      tower.level = 5;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should handle all tower levels 1-5', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
      }
    });

    it('should clamp level below 1 to 1', () => {
      tower.level = 0;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should clamp level above 5 to 5', () => {
      tower.level = 10;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should handle undefined level', () => {
      tower.level = undefined as unknown as number;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should use canvas context for drawing', () => {
      SniperTowerSprite.draw(context, tower);
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('should create gradients for visual elements', () => {
      SniperTowerSprite.draw(context, tower);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('should save and restore context state', () => {
      SniperTowerSprite.draw(context, tower);
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });
  });

  describe('drawFiring', () => {
    const target = { x: 10, y: 10 };

    it('should not throw when drawing firing effect', () => {
      expect(() => SniperTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
    });

    it('should handle all tower levels', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => SniperTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
      }
    });

    it('should draw bullet trail', () => {
      SniperTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('should draw muzzle flash', () => {
      SniperTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawRange', () => {
    it('should not throw when drawing range', () => {
      expect(() => SniperTowerSprite.drawRange!(context, tower)).not.toThrow();
    });

    it('should handle selected state', () => {
      expect(() => SniperTowerSprite.drawRange!(context, tower, true)).not.toThrow();
      expect(() => SniperTowerSprite.drawRange!(context, tower, false)).not.toThrow();
    });

    it('should draw range circle', () => {
      SniperTowerSprite.drawRange!(context, tower);
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('should use dashed line for range indicator', () => {
      SniperTowerSprite.drawRange!(context, tower);
      expect(context.ctx.setLineDash).toHaveBeenCalled();
    });
  });

  describe('animation', () => {
    it('should handle time parameter for animations', () => {
      context.time = 0;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();

      context.time = 1000;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();

      context.time = 99999;
      expect(() => SniperTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should rotate turret based on time', () => {
      SniperTowerSprite.draw(context, tower);
      expect(context.ctx.rotate).toHaveBeenCalled();
    });
  });

  describe('level-based visuals', () => {
    it('should draw ambient glow for level 3+', () => {
      tower.level = 2;
      const callsBefore = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;
      SniperTowerSprite.draw(context, tower);
      const callsLevel2 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length - callsBefore;

      context = createMockContext();
      tower.level = 3;
      SniperTowerSprite.draw(context, tower);
      const callsLevel3 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 3 should have more gradient calls due to ambient glow
      expect(callsLevel3).toBeGreaterThan(callsLevel2);
    });
  });

  describe('targeting rotation', () => {
    it('should rotate to face target when targetPosition is set', () => {
      // Tower at (5, 5), target at (10, 5) - directly to the right
      tower.targetPosition = { x: 10, y: 5 };
      SniperTowerSprite.draw(context, tower);

      // Verify rotate was called
      expect(context.ctx.rotate).toHaveBeenCalled();

      // Get the rotation angle used (rifle is drawn pointing up, so right target = PI rotation)
      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      // Should have been called at least once for rifle and scope
      expect(rotateCalls.length).toBeGreaterThanOrEqual(2);

      // The angle should be Math.atan2(0, targetX - centerX) + PI/2 = 0 + PI/2 = PI/2
      // But with cell positioning: target is to the right, so angle should make rifle point right
      const firstAngle = rotateCalls[0][0];
      expect(typeof firstAngle).toBe('number');
      expect(Number.isNaN(firstAngle)).toBe(false);
    });

    it('should use time-based rotation when no target', () => {
      tower.targetPosition = null;
      context.time = 5;
      SniperTowerSprite.draw(context, tower);

      const rotateCalls1 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle1 = rotateCalls1[0][0];

      // Draw again with different time
      context = createMockContext();
      context.time = 10;
      tower = createMockTower({ targetPosition: null });
      SniperTowerSprite.draw(context, tower);

      const rotateCalls2 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle2 = rotateCalls2[0][0];

      // Angles should be different because time is different
      expect(angle1).not.toBe(angle2);
    });

    it('should calculate correct angle to target above tower', () => {
      // Tower at (5, 5), target at (5, 0) - directly above
      tower.targetPosition = { x: 5, y: 0 };
      SniperTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target above means atan2(negative dy, 0) = -PI/2, plus PI/2 offset = 0
      // So angle should be close to 0 (rifle points up at target above)
      expect(Math.abs(angle)).toBeLessThan(0.01);
    });

    it('should calculate correct angle to target below tower', () => {
      // Tower at (5, 5), target at (5, 10) - directly below
      tower.targetPosition = { x: 5, y: 10 };
      SniperTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target below means atan2(positive dy, 0) = PI/2, plus PI/2 offset = PI
      expect(Math.abs(angle - Math.PI)).toBeLessThan(0.01);
    });
  });
});
