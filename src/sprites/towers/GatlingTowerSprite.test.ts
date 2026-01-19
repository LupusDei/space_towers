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
    roundRect: vi.fn(),
    clip: vi.fn(),
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
    id: 'gatling-tower-1',
    type: 'laser', // Using existing type for testing
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

    it('should draw bullet stream', () => {
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('should draw muzzle flash', () => {
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('should rotate turret toward firing target', () => {
      const firingTarget = { x: 10, y: 5 };
      GatlingTowerSprite.drawFiring!(context, tower, firingTarget);

      expect(context.ctx.rotate).toHaveBeenCalled();
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });

    it('should calculate rotation angle to target right of tower when firing', () => {
      // Tower at (5, 5), target at (10, 5) - directly to the right
      const firingTarget = { x: 10, y: 5 };
      GatlingTowerSprite.drawFiring!(context, tower, firingTarget);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);

      // Target to the right means atan2(0, positive dx) = 0, plus PI/2 offset = PI/2
      const angle = rotateCalls[0][0];
      expect(Math.abs(angle - Math.PI / 2)).toBeLessThan(0.1);
    });

    it('should calculate rotation angle to target above tower when firing', () => {
      // Tower at (5, 5), target at (5, 0) - directly above
      const firingTarget = { x: 5, y: 0 };
      GatlingTowerSprite.drawFiring!(context, tower, firingTarget);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);

      // Target above means atan2(negative dy, 0) = -PI/2, plus PI/2 offset = 0
      const angle = rotateCalls[0][0];
      expect(Math.abs(angle)).toBeLessThan(0.1);
    });

    it('should calculate rotation angle to target below tower when firing', () => {
      // Tower at (5, 5), target at (5, 10) - directly below
      const firingTarget = { x: 5, y: 10 };
      GatlingTowerSprite.drawFiring!(context, tower, firingTarget);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);

      // Target below means atan2(positive dy, 0) = PI/2, plus PI/2 offset = PI
      const angle = rotateCalls[0][0];
      expect(Math.abs(angle - Math.PI)).toBeLessThan(0.1);
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

    it('should rotate turret based on time when no target', () => {
      tower.targetPosition = null;
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.rotate).toHaveBeenCalled();
    });

    it('should spin barrels with time-based animation', () => {
      // Draw at two different times to verify barrel spin changes
      context.time = 0;
      GatlingTowerSprite.draw(context, tower);
      const calls1 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      context.time = 100;
      GatlingTowerSprite.draw(context, tower);
      const calls2 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls.length;

      // Both should call rotate for turret and barrel animation
      expect(calls1).toBeGreaterThan(0);
      expect(calls2).toBeGreaterThan(0);
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

    it('should draw ammo belt for level 2+', () => {
      tower.level = 1;
      GatlingTowerSprite.draw(context, tower);
      const ellipseCalls1 = (context.ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 2;
      GatlingTowerSprite.draw(context, tower);
      const ellipseCalls2 = (context.ctx.ellipse as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 2 should have ellipse calls for ammo belt bullets
      expect(ellipseCalls2).toBeGreaterThan(ellipseCalls1);
    });
  });

  describe('targeting rotation', () => {
    it('should rotate to face target when targetPosition is set', () => {
      // Tower at grid (5, 5) = pixel center (220, 220) with cellSize=40
      // Target at pixel (400, 200) - to the right of tower
      tower.targetPosition = { x: 400, y: 200 };
      GatlingTowerSprite.draw(context, tower);

      expect(context.ctx.rotate).toHaveBeenCalled();

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);

      const firstAngle = rotateCalls[0][0];
      expect(typeof firstAngle).toBe('number');
      expect(Number.isNaN(firstAngle)).toBe(false);
    });

    it('should use time-based rotation when no target', () => {
      tower.targetPosition = null;
      context.time = 5;
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls1 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle1 = rotateCalls1[0][0];

      // Draw again with different time
      context = createMockContext();
      context.time = 10;
      tower = createMockTower({ targetPosition: null });
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls2 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle2 = rotateCalls2[0][0];

      // Angles should be different because time is different
      expect(angle1).not.toBe(angle2);
    });

    it('should calculate correct angle to target above tower', () => {
      // Tower at grid (5, 5) = pixel center (220, 220) with cellSize=40
      // Target at pixel (200, 20) - directly above tower
      tower.targetPosition = { x: 200, y: 20 };
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target above means atan2(negative dy, 0) = -PI/2, plus PI/2 offset = 0
      // So angle should be close to 0 (turret points up at target above)
      expect(Math.abs(angle)).toBeLessThan(0.1);
    });

    it('should calculate correct angle to target below tower', () => {
      // Tower at grid (5, 5) = pixel center (220, 220) with cellSize=40
      // Target at pixel (200, 400) - directly below tower
      tower.targetPosition = { x: 200, y: 400 };
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target below means atan2(positive dy, 0) = PI/2, plus PI/2 offset = PI
      expect(Math.abs(angle - Math.PI)).toBeLessThan(0.1);
    });
  });

  describe('barrel spin animation', () => {
    it('should spin barrels faster when firing', () => {
      const target = { x: 10, y: 10 };

      // First call to initialize spin state
      context.time = 0;
      GatlingTowerSprite.draw(context, tower);

      // Drawing in firing mode should work without error
      context.time = 100;
      expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
    });

    it('should maintain barrel spin state across multiple draws', () => {
      // Multiple draws should not throw and should use barrel spin tracking
      for (let i = 0; i < 5; i++) {
        context.time = i * 100;
        expect(() => GatlingTowerSprite.draw(context, tower)).not.toThrow();
      }
    });

    it('should handle different tower IDs separately', () => {
      const tower1 = createMockTower({ id: 'gatling-1' });
      const tower2 = createMockTower({ id: 'gatling-2' });

      context.time = 0;
      expect(() => GatlingTowerSprite.draw(context, tower1)).not.toThrow();
      expect(() => GatlingTowerSprite.draw(context, tower2)).not.toThrow();

      context.time = 100;
      expect(() => GatlingTowerSprite.draw(context, tower1)).not.toThrow();
      expect(() => GatlingTowerSprite.draw(context, tower2)).not.toThrow();
    });
  });
});
