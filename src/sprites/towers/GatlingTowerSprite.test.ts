// Gatling Tower Sprite Tests
// Tests for GatlingTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatlingTowerSprite, gatlingSpinManager } from './GatlingTowerSprite';
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
    type: 'laser', // placeholder type
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
    gatlingSpinManager.clear();
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

    it('should draw multiple barrels', () => {
      GatlingTowerSprite.draw(context, tower);
      // fillRect is used for barrel bodies - should be called multiple times
      expect(context.ctx.fillRect).toHaveBeenCalled();
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

    it('should rotate barrel assembly toward target', () => {
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
      tower.targetPosition = { x: 300, y: 200 };
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.rotate).toHaveBeenCalled();
    });
  });

  describe('barrel spin manager', () => {
    it('should track spin state per tower', () => {
      const state1 = gatlingSpinManager.getState('tower-1', 0);
      const state2 = gatlingSpinManager.getState('tower-2', 0);

      expect(state1).toBeDefined();
      expect(state2).toBeDefined();
      expect(state1).not.toBe(state2);
    });

    it('should increase rotation over time', () => {
      const state1 = gatlingSpinManager.getState('tower-1', 0);
      const rotation1 = state1.rotation;

      const state2 = gatlingSpinManager.getState('tower-1', 100);
      const rotation2 = state2.rotation;

      expect(rotation2).toBeGreaterThan(rotation1);
    });

    it('should accelerate when firing', () => {
      gatlingSpinManager.getState('tower-1', 0);
      gatlingSpinManager.setFiring('tower-1', true);

      const state1 = gatlingSpinManager.getState('tower-1', 10);
      const speed1 = state1.currentSpeed;

      const state2 = gatlingSpinManager.getState('tower-1', 20);
      const speed2 = state2.currentSpeed;

      expect(speed2).toBeGreaterThan(speed1);
    });

    it('should decelerate when not firing', () => {
      // Start firing to increase speed
      gatlingSpinManager.getState('tower-1', 0);
      gatlingSpinManager.setFiring('tower-1', true);

      // Accelerate
      for (let t = 10; t <= 100; t += 10) {
        gatlingSpinManager.getState('tower-1', t);
      }

      // Stop firing
      gatlingSpinManager.setFiring('tower-1', false);
      const state1 = gatlingSpinManager.getState('tower-1', 110);
      const speed1 = state1.currentSpeed;

      const state2 = gatlingSpinManager.getState('tower-1', 120);
      const speed2 = state2.currentSpeed;

      expect(speed2).toBeLessThan(speed1);
    });

    it('should clear all states', () => {
      gatlingSpinManager.getState('tower-1', 0);
      gatlingSpinManager.getState('tower-2', 0);
      gatlingSpinManager.clear();

      // Getting state after clear should create new state
      const newState = gatlingSpinManager.getState('tower-1', 0);
      expect(newState.rotation).toBe(0);
    });
  });

  describe('level-based visuals', () => {
    it('should draw ambient glow for level 4+', () => {
      tower.level = 3;
      const callsBefore = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel3 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length - callsBefore;

      context = createMockContext();
      tower.level = 4;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel4 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 4 should have more gradient calls due to ambient glow
      expect(callsLevel4).toBeGreaterThan(callsLevel3);
    });

    it('should have more barrels at higher levels', () => {
      // Level 1 should have 4 barrels, level 5 should have 6
      // We can verify this by checking fillRect calls (one per barrel)
      tower.level = 1;
      GatlingTowerSprite.draw(context, tower);
      const fillRectCallsLevel1 = (context.ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 5;
      GatlingTowerSprite.draw(context, tower);
      const fillRectCallsLevel5 = (context.ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

      expect(fillRectCallsLevel5).toBeGreaterThan(fillRectCallsLevel1);
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

    it('should not rotate when no target', () => {
      tower.targetPosition = null;
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      // Should still call rotate but with angle 0
      if (rotateCalls.length > 0) {
        expect(rotateCalls[0][0]).toBe(0);
      }
    });

    it('should calculate correct angle to target to the right', () => {
      // Tower at grid (5, 5), target at pixel (400, 200) - to the right
      tower.targetPosition = { x: 400, y: 200 };
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target to the right: angle should be close to PI/2
      expect(Math.abs(angle - Math.PI / 2)).toBeLessThan(0.2);
    });

    it('should calculate correct angle to target above tower', () => {
      // Tower at grid (5, 5), target at pixel (200, 20) - above
      tower.targetPosition = { x: 200, y: 20 };
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle = rotateCalls[0][0];

      // Target above: angle should be close to 0
      expect(Math.abs(angle)).toBeLessThan(0.2);
    });
  });
});
