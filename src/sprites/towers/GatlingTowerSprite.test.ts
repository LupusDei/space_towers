// Gatling Tower Sprite Tests
// Tests for GatlingTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatlingTowerSprite, gatlingBarrelSpinManager } from './GatlingTowerSprite';
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
    id: 'tower-gatling-1',
    type: 'gatling',
    position: { x: 5, y: 5 },
    level: 1,
    damage: 5,
    range: 80,
    fireRate: 10,
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
    gatlingBarrelSpinManager.clear();
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

    it('should draw bullet tracers', () => {
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

    it('should rotate turret based on target position', () => {
      tower.targetPosition = { x: 400, y: 200 };
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.rotate).toHaveBeenCalled();
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

    it('should have more visual elements at higher levels', () => {
      tower.level = 1;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel1 = (context.ctx.beginPath as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 5;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel5 = (context.ctx.beginPath as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 5 should have more drawing operations
      expect(callsLevel5).toBeGreaterThan(callsLevel1);
    });
  });

  describe('targeting rotation', () => {
    it('should rotate to face target when targetPosition is set', () => {
      tower.targetPosition = { x: 400, y: 200 };
      GatlingTowerSprite.draw(context, tower);

      expect(context.ctx.rotate).toHaveBeenCalled();

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);

      const firstAngle = rotateCalls[0][0];
      expect(typeof firstAngle).toBe('number');
      expect(Number.isNaN(firstAngle)).toBe(false);
    });

    it('should use default rotation when no target', () => {
      tower.targetPosition = null;
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      // Should still call rotate (for barrel assembly)
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('barrel spin manager', () => {
    it('should track spin state for each tower', () => {
      const tower1 = createMockTower({ id: 'tower-1' });
      const tower2 = createMockTower({ id: 'tower-2' });

      GatlingTowerSprite.draw(context, tower1);
      GatlingTowerSprite.draw(context, tower2);

      // Both towers should have spin states
      expect(gatlingBarrelSpinManager.getSpinSpeed('tower-1')).toBeDefined();
      expect(gatlingBarrelSpinManager.getSpinSpeed('tower-2')).toBeDefined();
    });

    it('should increase spin speed when firing', () => {
      const target = { x: 10, y: 10 };

      // First draw (idle)
      GatlingTowerSprite.draw(context, tower);
      const idleSpeed = gatlingBarrelSpinManager.getSpinSpeed(tower.id);

      // Simulate firing multiple times to spin up
      for (let i = 0; i < 10; i++) {
        context.time += 100;
        GatlingTowerSprite.drawFiring!(context, tower, target);
      }
      const firingSpeed = gatlingBarrelSpinManager.getSpinSpeed(tower.id);

      // Firing should increase spin speed
      expect(firingSpeed).toBeGreaterThan(idleSpeed);
    });

    it('should clear all spin states', () => {
      // Draw multiple times with time advancing to allow spin-up
      for (let i = 0; i < 5; i++) {
        context.time = i * 100;
        GatlingTowerSprite.draw(context, tower);
      }
      // After multiple draws with time advancing, spin speed should be > 0
      expect(gatlingBarrelSpinManager.getSpinSpeed(tower.id)).toBeGreaterThan(0);

      gatlingBarrelSpinManager.clear();
      expect(gatlingBarrelSpinManager.getSpinSpeed(tower.id)).toBe(0);
    });
  });

  describe('multi-barrel drawing', () => {
    it('should draw multiple barrels', () => {
      GatlingTowerSprite.draw(context, tower);

      // Multiple arc calls for barrels (bore holes)
      const arcCalls = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls;
      // Should have many arc calls - base, mount, hub, barrel bores, indicators
      expect(arcCalls.length).toBeGreaterThan(6);
    });

    it('should draw barrel assembly with line strokes', () => {
      GatlingTowerSprite.draw(context, tower);

      // Barrels are drawn with strokes
      const strokeCalls = (context.ctx.stroke as ReturnType<typeof vi.fn>).mock.calls;
      expect(strokeCalls.length).toBeGreaterThan(0);
    });
  });

  describe('firing effects', () => {
    const target = { x: 10, y: 10 };

    it('should draw impact sparks at target', () => {
      GatlingTowerSprite.drawFiring!(context, tower, target);

      // Multiple fill calls for sparks
      const fillCalls = (context.ctx.fill as ReturnType<typeof vi.fn>).mock.calls;
      expect(fillCalls.length).toBeGreaterThan(5);
    });

    it('should draw multiple tracer lines', () => {
      tower.level = 5; // Higher level = more tracers
      GatlingTowerSprite.drawFiring!(context, tower, target);

      // Multiple stroke calls for tracers
      const strokeCalls = (context.ctx.stroke as ReturnType<typeof vi.fn>).mock.calls;
      expect(strokeCalls.length).toBeGreaterThan(2);
    });
  });
});
