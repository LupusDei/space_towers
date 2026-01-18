// Storm Effect Sprite Tests
// Tests for storm effect sprite, manager, and charging manager

import { describe, it, expect, beforeEach } from 'vitest';
import {
  createStormEffectSprite,
  stormEffectManager,
  StormEffectSprite,
  stormChargingManager,
} from './StormEffectSprite';
import type { SpriteRenderContext } from '../types';

// ============================================================================
// Test Constants
// ============================================================================

const DEFAULT_STORM_DURATION = 2000; // Must match the value in StormEffectSprite.ts

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    quadraticCurveTo: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    ellipse: () => {},
    save: () => {},
    restore: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
  } as unknown as CanvasRenderingContext2D;
}

function createMockRenderContext(time: number = 0): SpriteRenderContext {
  return {
    ctx: createMockContext(),
    cellSize: 44,
    time,
  };
}

// ============================================================================
// createStormEffectSprite Tests
// ============================================================================

describe('createStormEffectSprite', () => {
  it('should create a sprite with draw method', () => {
    const sprite = createStormEffectSprite();

    expect(sprite).toBeDefined();
    expect(typeof sprite.draw).toBe('function');
  });

  it('should not throw when drawing at progress 0', () => {
    const sprite = createStormEffectSprite();
    const context = createMockRenderContext();

    expect(() => {
      sprite.draw(context, { x: 5, y: 5 }, 0);
    }).not.toThrow();
  });

  it('should not throw when drawing at progress 0.5', () => {
    const sprite = createStormEffectSprite();
    const context = createMockRenderContext(1.5);

    expect(() => {
      sprite.draw(context, { x: 5, y: 5 }, 0.5);
    }).not.toThrow();
  });

  it('should not throw when drawing at progress 1', () => {
    const sprite = createStormEffectSprite();
    const context = createMockRenderContext(3);

    expect(() => {
      sprite.draw(context, { x: 5, y: 5 }, 1);
    }).not.toThrow();
  });

  it('should handle different grid positions', () => {
    const sprite = createStormEffectSprite();
    const context = createMockRenderContext();

    expect(() => {
      sprite.draw(context, { x: 0, y: 0 }, 0.5);
      sprite.draw(context, { x: 10, y: 10 }, 0.5);
      sprite.draw(context, { x: 19, y: 14 }, 0.5);
    }).not.toThrow();
  });

  it('should handle varying time values for animation', () => {
    const sprite = createStormEffectSprite();

    expect(() => {
      for (let t = 0; t < 5; t += 0.1) {
        const context = createMockRenderContext(t);
        sprite.draw(context, { x: 5, y: 5 }, 0.5);
      }
    }).not.toThrow();
  });
});

// ============================================================================
// StormEffectSprite (pre-built instance) Tests
// ============================================================================

describe('StormEffectSprite', () => {
  it('should be defined as pre-built instance', () => {
    expect(StormEffectSprite).toBeDefined();
    expect(typeof StormEffectSprite.draw).toBe('function');
  });

  it('should draw without error', () => {
    const context = createMockRenderContext();

    expect(() => {
      StormEffectSprite.draw(context, { x: 5, y: 5 }, 0.5);
    }).not.toThrow();
  });
});

// ============================================================================
// StormEffectManager Tests
// ============================================================================

describe('stormEffectManager', () => {
  beforeEach(() => {
    stormEffectManager.clear();
  });

  describe('spawn', () => {
    it('should create an active storm effect', () => {
      stormEffectManager.spawn({ x: 50, y: 50 }, 0);

      expect(stormEffectManager.getActive().length).toBe(1);
    });

    it('should store position correctly', () => {
      stormEffectManager.spawn({ x: 100, y: 200 }, 0);

      const effect = stormEffectManager.getActive()[0];
      expect(effect.position.x).toBe(100);
      expect(effect.position.y).toBe(200);
    });

    it('should store start time correctly', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 1000);

      const effect = stormEffectManager.getActive()[0];
      expect(effect.startTime).toBe(1000);
    });

    it('should handle custom duration', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0, 5000);

      const effect = stormEffectManager.getActive()[0];
      expect(effect.duration).toBe(5000);
    });

    it('should handle multiple spawns', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0);
      stormEffectManager.spawn({ x: 100, y: 100 }, 0);
      stormEffectManager.spawn({ x: 200, y: 200 }, 0);

      expect(stormEffectManager.getActive().length).toBe(3);
    });

    it('should assign unique ids to each effect', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0);
      stormEffectManager.spawn({ x: 100, y: 100 }, 0);

      const effects = stormEffectManager.getActive();
      expect(effects[0].id).not.toBe(effects[1].id);
    });
  });

  describe('drawAll', () => {
    it('should keep active effects that have not expired', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0);

      // Time in seconds, spawn time in ms - simulate 1 second (1000ms) elapsed
      const context = createMockRenderContext(1); // 1000ms

      stormEffectManager.drawAll(context);

      expect(stormEffectManager.getActive().length).toBe(1);
    });

    it('should remove effects that have expired', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0);

      // Time in seconds - simulate 2.1 seconds (2100ms) elapsed to exceed 2000ms duration
      const context = createMockRenderContext(2.1);

      stormEffectManager.drawAll(context);

      expect(stormEffectManager.getActive().length).toBe(0);
    });

    it('should handle mixed expiration times correctly', () => {
      // Spawn effects at different times
      stormEffectManager.spawn({ x: 0, y: 0 }, 0, DEFAULT_STORM_DURATION);
      stormEffectManager.spawn({ x: 100, y: 100 }, 1000, DEFAULT_STORM_DURATION);
      stormEffectManager.spawn({ x: 200, y: 200 }, 2000, DEFAULT_STORM_DURATION);

      // At 2.1 seconds (2100ms), first effect should expire
      const context1 = createMockRenderContext(2.1);
      stormEffectManager.drawAll(context1);
      expect(stormEffectManager.getActive().length).toBe(2);

      // At 3.1 seconds (3100ms), second effect should expire
      const context2 = createMockRenderContext(3.1);
      stormEffectManager.drawAll(context2);
      expect(stormEffectManager.getActive().length).toBe(1);

      // Verify remaining effect is the last spawned
      expect(stormEffectManager.getActive()[0].position.x).toBe(200);
    });

    it('should not throw when drawing effects', () => {
      stormEffectManager.spawn({ x: 50, y: 50 }, 0);
      stormEffectManager.spawn({ x: 150, y: 150 }, 0);

      const context = createMockRenderContext(0.5);

      expect(() => {
        stormEffectManager.drawAll(context);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all active effects', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0);
      stormEffectManager.spawn({ x: 100, y: 100 }, 0);

      stormEffectManager.clear();

      expect(stormEffectManager.getActive().length).toBe(0);
    });
  });

  describe('getActive', () => {
    it('should return empty array when no effects', () => {
      expect(stormEffectManager.getActive()).toEqual([]);
    });

    it('should return all active effects', () => {
      stormEffectManager.spawn({ x: 0, y: 0 }, 0);
      stormEffectManager.spawn({ x: 100, y: 100 }, 0);

      const active = stormEffectManager.getActive();

      expect(active.length).toBe(2);
      expect(active[0].sprite).toBeDefined();
      expect(active[1].sprite).toBeDefined();
    });
  });
});

// ============================================================================
// StormChargingManager Tests
// ============================================================================

describe('stormChargingManager', () => {
  beforeEach(() => {
    stormChargingManager.clear();
  });

  describe('startCharging', () => {
    it('should start charging for a tower', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);

      expect(stormChargingManager.getActiveCount()).toBe(1);
    });

    it('should track multiple charging towers', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);
      stormChargingManager.startCharging('tower-2', { x: 10, y: 10 }, 0);
      stormChargingManager.startCharging('tower-3', { x: 15, y: 15 }, 0);

      expect(stormChargingManager.getActiveCount()).toBe(3);
    });

    it('should replace charging state when same tower starts again', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 500);

      expect(stormChargingManager.getActiveCount()).toBe(1);
      // Progress should be based on new start time
      const progress = stormChargingManager.getChargeProgress('tower-1', 600);
      expect(progress).toBeCloseTo(0.125, 2); // 100ms elapsed / 800ms duration
    });
  });

  describe('stopCharging', () => {
    it('should stop charging for a tower', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);
      stormChargingManager.stopCharging('tower-1');

      expect(stormChargingManager.getActiveCount()).toBe(0);
    });

    it('should not affect other charging towers', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);
      stormChargingManager.startCharging('tower-2', { x: 10, y: 10 }, 0);
      stormChargingManager.stopCharging('tower-1');

      expect(stormChargingManager.getActiveCount()).toBe(1);
      expect(stormChargingManager.isCharging('tower-2')).toBe(true);
    });

    it('should handle stopping non-existent tower gracefully', () => {
      expect(() => {
        stormChargingManager.stopCharging('non-existent');
      }).not.toThrow();
    });
  });

  describe('getChargeProgress', () => {
    it('should return 0 for non-charging tower', () => {
      const progress = stormChargingManager.getChargeProgress('tower-1', 0);

      expect(progress).toBe(0);
    });

    it('should return progress based on elapsed time', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0, 800);

      expect(stormChargingManager.getChargeProgress('tower-1', 200)).toBeCloseTo(0.25, 2);
      expect(stormChargingManager.getChargeProgress('tower-1', 400)).toBeCloseTo(0.5, 2);
      expect(stormChargingManager.getChargeProgress('tower-1', 600)).toBeCloseTo(0.75, 2);
    });

    it('should return 1 when charge is complete', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0, 800);

      expect(stormChargingManager.getChargeProgress('tower-1', 800)).toBe(1);
      expect(stormChargingManager.getChargeProgress('tower-1', 1000)).toBe(1);
    });
  });

  describe('isCharging', () => {
    it('should return false for non-charging tower', () => {
      expect(stormChargingManager.isCharging('tower-1')).toBe(false);
    });

    it('should return true for charging tower', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);

      expect(stormChargingManager.isCharging('tower-1')).toBe(true);
    });
  });

  describe('drawAll', () => {
    it('should not throw when drawing charging effects', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);
      stormChargingManager.startCharging('tower-2', { x: 10, y: 10 }, 0);

      const context = createMockRenderContext(0.4); // 400ms in seconds

      expect(() => {
        stormChargingManager.drawAll(context);
      }).not.toThrow();
    });

    it('should remove completed charges', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0, 800);

      // 1 second = 1000ms, which exceeds 800ms charge duration
      const context = createMockRenderContext(1);
      stormChargingManager.drawAll(context);

      expect(stormChargingManager.getActiveCount()).toBe(0);
    });

    it('should keep active charges that are not complete', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0, 800);

      // 400ms elapsed, still charging
      const context = createMockRenderContext(0.4);
      stormChargingManager.drawAll(context);

      expect(stormChargingManager.getActiveCount()).toBe(1);
    });
  });

  describe('drawForTower', () => {
    it('should not throw when drawing for specific tower', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);

      const context = createMockRenderContext(0.4);

      expect(() => {
        stormChargingManager.drawForTower(context, 'tower-1', 100, 100);
      }).not.toThrow();
    });

    it('should not throw when tower is not charging', () => {
      const context = createMockRenderContext(0.4);

      expect(() => {
        stormChargingManager.drawForTower(context, 'non-existent', 100, 100);
      }).not.toThrow();
    });
  });

  describe('clear', () => {
    it('should remove all charging states', () => {
      stormChargingManager.startCharging('tower-1', { x: 5, y: 5 }, 0);
      stormChargingManager.startCharging('tower-2', { x: 10, y: 10 }, 0);

      stormChargingManager.clear();

      expect(stormChargingManager.getActiveCount()).toBe(0);
    });
  });
});
