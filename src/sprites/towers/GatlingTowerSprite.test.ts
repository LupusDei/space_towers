// Gatling Tower Sprite Tests
// Tests for GatlingTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatlingTowerSprite, barrelSpinManager } from './GatlingTowerSprite';
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
    type: 'gatling',
    position: { x: 5, y: 5 },
    level: 1,
    damage: 5,
    range: 100,
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
    barrelSpinManager.clear();
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

    it('should draw fillRect for barrel elements', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.fillRect).toHaveBeenCalled();
    });
  });

  describe('drawFiring', () => {
    const target = { x: 10, y: 10 };

    it('should not throw when drawing firing effect', () => {
      tower.targetPosition = { x: target.x * 40, y: target.y * 40 };
      expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
    });

    it('should handle all tower levels', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        tower.targetPosition = { x: target.x * 40, y: target.y * 40 };
        expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
      }
    });

    it('should draw bullet trails', () => {
      tower.targetPosition = { x: target.x * 40, y: target.y * 40 };
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('should draw muzzle flash', () => {
      tower.targetPosition = { x: target.x * 40, y: target.y * 40 };
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('should handle firing without targetPosition', () => {
      tower.targetPosition = null;
      expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
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

    it('should reset line dash after drawing', () => {
      GatlingTowerSprite.drawRange!(context, tower);
      const setLineDashCalls = (context.ctx.setLineDash as ReturnType<typeof vi.fn>).mock.calls;
      expect(setLineDashCalls[setLineDashCalls.length - 1][0]).toEqual([]);
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

    it('should rotate turret', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.rotate).toHaveBeenCalled();
    });
  });

  describe('level-based visuals', () => {
    it('should draw ambient glow for level 3+', () => {
      tower.level = 2;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel2 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower = createMockTower({ level: 3 });
      GatlingTowerSprite.draw(context, tower);
      const callsLevel3 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      expect(callsLevel3).toBeGreaterThan(callsLevel2);
    });

    it('should draw ammo feed for level 2+', () => {
      tower.level = 1;
      GatlingTowerSprite.draw(context, tower);
      const callsLevel1 = (context.ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower = createMockTower({ level: 2 });
      GatlingTowerSprite.draw(context, tower);
      const callsLevel2 = (context.ctx.fillRect as ReturnType<typeof vi.fn>).mock.calls.length;

      expect(callsLevel2).toBeGreaterThan(callsLevel1);
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

    it('should use time-based rotation when no target', () => {
      tower.targetPosition = null;
      context.time = 0;
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls1 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle1 = rotateCalls1[0][0];

      context = createMockContext();
      context.time = 5000;
      tower = createMockTower({ targetPosition: null });
      GatlingTowerSprite.draw(context, tower);

      const rotateCalls2 = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      const angle2 = rotateCalls2[0][0];

      expect(angle1).not.toBe(angle2);
    });
  });
});

// ============================================================================
// BarrelSpinManager Tests
// ============================================================================

describe('barrelSpinManager', () => {
  beforeEach(() => {
    barrelSpinManager.clear();
  });

  it('should return barrel angle', () => {
    const angle = barrelSpinManager.getBarrelAngle('tower-1', 0, false);
    expect(typeof angle).toBe('number');
    expect(Number.isNaN(angle)).toBe(false);
  });

  it('should track different towers independently', () => {
    barrelSpinManager.getBarrelAngle('tower-1', 0, false);
    barrelSpinManager.getBarrelAngle('tower-2', 0, false);
    barrelSpinManager.getBarrelAngle('tower-1', 100, true);
    barrelSpinManager.getBarrelAngle('tower-2', 100, false);

    const speed1 = barrelSpinManager.getSpinSpeed('tower-1');
    const speed2 = barrelSpinManager.getSpinSpeed('tower-2');

    expect(speed1).not.toBe(speed2);
  });

  it('should increase spin speed when firing', () => {
    const initialSpeed = barrelSpinManager.getSpinSpeed('tower-1') ?? 0.5;
    barrelSpinManager.getBarrelAngle('tower-1', 0, false);

    // Simulate time passing while firing
    for (let t = 0; t < 500; t += 16) {
      barrelSpinManager.getBarrelAngle('tower-1', t, true);
    }

    const firingSpeed = barrelSpinManager.getSpinSpeed('tower-1');
    expect(firingSpeed).toBeGreaterThan(initialSpeed);
  });

  it('should decrease spin speed when not firing', () => {
    // First spin up
    for (let t = 0; t < 500; t += 16) {
      barrelSpinManager.getBarrelAngle('tower-1', t, true);
    }
    const fastSpeed = barrelSpinManager.getSpinSpeed('tower-1');

    // Then spin down
    for (let t = 500; t < 2000; t += 16) {
      barrelSpinManager.getBarrelAngle('tower-1', t, false);
    }
    const slowSpeed = barrelSpinManager.getSpinSpeed('tower-1');

    expect(slowSpeed).toBeLessThan(fastSpeed);
  });

  it('should clear all states', () => {
    // Spin up tower-1 to fast speed
    for (let t = 0; t < 500; t += 16) {
      barrelSpinManager.getBarrelAngle('tower-1', t, true);
    }
    const fastSpeed = barrelSpinManager.getSpinSpeed('tower-1');
    expect(fastSpeed).toBeGreaterThan(1); // Should be spinning fast

    barrelSpinManager.clear();

    // After clear, getting speed for a tower that had state should return idle speed
    // (getSpinSpeed returns IDLE_SPEED as fallback when no state exists)
    const speedAfterClear = barrelSpinManager.getSpinSpeed('tower-1');
    expect(speedAfterClear).toBe(0.5); // IDLE_SPEED constant
  });

  it('should keep barrel angle within 0 to 2*PI range', () => {
    // Simulate lots of time passing
    for (let t = 0; t < 100000; t += 100) {
      const angle = barrelSpinManager.getBarrelAngle('tower-1', t, true);
      expect(angle).toBeGreaterThanOrEqual(0);
      expect(angle).toBeLessThan(Math.PI * 2);
    }
  });
});
