// Rapid Fire Effect Sprite Tests
// Tests for rapid fire visual effect and manager

import { describe, it, expect, beforeEach } from 'vitest';
import { RapidFireEffectSprite, rapidFireEffectManager } from './RapidFireEffectSprite';
import type { SpriteRenderContext } from '../types';

// ============================================================================
// Test Setup
// ============================================================================

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
    closePath: () => {},
    stroke: () => {},
    fill: () => {},
    arc: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
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
// RapidFireEffectSprite Tests
// ============================================================================

describe('RapidFireEffectSprite', () => {
  it('should be defined with draw method', () => {
    expect(RapidFireEffectSprite).toBeDefined();
    expect(typeof RapidFireEffectSprite.draw).toBe('function');
  });

  it('should not throw when drawing with intensity 0', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 5 }, 0);
    }).not.toThrow();
  });

  it('should not throw when drawing with intensity 0.5', () => {
    const context = createMockRenderContext(1.5);

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 5 }, 0.5);
    }).not.toThrow();
  });

  it('should not throw when drawing with intensity 1', () => {
    const context = createMockRenderContext(3);

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 5 }, 1);
    }).not.toThrow();
  });

  it('should clamp intensity above 1', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 5 }, 2);
    }).not.toThrow();
  });

  it('should handle negative intensity', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 5 }, -1);
    }).not.toThrow();
  });

  it('should handle different grid positions', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 0, y: 0 }, { x: 5, y: 5 }, 0.5);
      RapidFireEffectSprite.draw(context, { x: 10, y: 10 }, { x: 15, y: 15 }, 0.5);
      RapidFireEffectSprite.draw(context, { x: 19, y: 14 }, { x: 0, y: 0 }, 0.5);
    }).not.toThrow();
  });

  it('should handle origin and target at same position', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 5, y: 5 }, 0.5);
    }).not.toThrow();
  });

  it('should handle varying time values for animation', () => {
    expect(() => {
      for (let t = 0; t < 5; t += 0.1) {
        const context = createMockRenderContext(t);
        RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 5 }, 0.8);
      }
    }).not.toThrow();
  });

  it('should handle vertical firing direction', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 5, y: 10 }, 0.5);
    }).not.toThrow();
  });

  it('should handle diagonal firing direction', () => {
    const context = createMockRenderContext();

    expect(() => {
      RapidFireEffectSprite.draw(context, { x: 5, y: 5 }, { x: 10, y: 10 }, 0.5);
    }).not.toThrow();
  });
});

// ============================================================================
// RapidFireEffectManager Tests
// ============================================================================

describe('rapidFireEffectManager', () => {
  beforeEach(() => {
    rapidFireEffectManager.clear();
  });

  describe('update', () => {
    it('should create a new effect', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.8, 0);

      expect(rapidFireEffectManager.getActive().length).toBe(1);
    });

    it('should store position and intensity correctly', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 10 }, 0.75, 0);

      const effect = rapidFireEffectManager.getActive()[0];
      expect(effect.id).toBe('tower_1');
      expect(effect.origin.x).toBe(5);
      expect(effect.origin.y).toBe(5);
      expect(effect.target.x).toBe(10);
      expect(effect.target.y).toBe(10);
      expect(effect.intensity).toBe(0.75);
    });

    it('should clamp intensity to 0-1 range', () => {
      rapidFireEffectManager.update('tower_1', { x: 0, y: 0 }, { x: 5, y: 5 }, 1.5, 0);
      rapidFireEffectManager.update('tower_2', { x: 0, y: 0 }, { x: 5, y: 5 }, -0.5, 0);

      const effects = rapidFireEffectManager.getActive();
      expect(effects.find((e) => e.id === 'tower_1')?.intensity).toBe(1);
      expect(effects.find((e) => e.id === 'tower_2')?.intensity).toBe(0);
    });

    it('should update existing effect with same id', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.5, 0);
      rapidFireEffectManager.update('tower_1', { x: 6, y: 6 }, { x: 11, y: 6 }, 0.9, 0.1);

      expect(rapidFireEffectManager.getActive().length).toBe(1);

      const effect = rapidFireEffectManager.getActive()[0];
      expect(effect.origin.x).toBe(6);
      expect(effect.intensity).toBe(0.9);
    });

    it('should handle multiple effects', () => {
      rapidFireEffectManager.update('tower_1', { x: 0, y: 0 }, { x: 5, y: 0 }, 0.8, 0);
      rapidFireEffectManager.update('tower_2', { x: 10, y: 10 }, { x: 15, y: 10 }, 0.6, 0);
      rapidFireEffectManager.update('tower_3', { x: 20, y: 20 }, { x: 25, y: 20 }, 0.7, 0);

      expect(rapidFireEffectManager.getActive().length).toBe(3);
    });
  });

  describe('drawAll', () => {
    it('should draw active effects without error', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.8, 0);
      rapidFireEffectManager.update('tower_2', { x: 15, y: 15 }, { x: 20, y: 15 }, 0.6, 0);

      const context = createMockRenderContext(0.1);

      expect(() => {
        rapidFireEffectManager.drawAll(context);
      }).not.toThrow();
    });

    it('should decay and remove stale effects', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.5, 0);

      // Draw at time 0.1 - effect should still be active (decayed but not removed)
      const context1 = createMockRenderContext(0.1);
      rapidFireEffectManager.drawAll(context1);
      expect(rapidFireEffectManager.getActive().length).toBe(1);

      // Draw at time 1.0 - effect should be removed (intensity decayed to 0)
      const context2 = createMockRenderContext(1.0);
      rapidFireEffectManager.drawAll(context2);
      expect(rapidFireEffectManager.getActive().length).toBe(0);
    });

    it('should keep effects that are continuously updated', () => {
      // Simulate continuous firing
      for (let t = 0; t < 2; t += 0.1) {
        rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.8, t);
        const context = createMockRenderContext(t);
        rapidFireEffectManager.drawAll(context);
      }

      expect(rapidFireEffectManager.getActive().length).toBe(1);
    });
  });

  describe('remove', () => {
    it('should remove specific effect', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.8, 0);
      rapidFireEffectManager.update('tower_2', { x: 15, y: 15 }, { x: 20, y: 15 }, 0.6, 0);

      rapidFireEffectManager.remove('tower_1');

      expect(rapidFireEffectManager.getActive().length).toBe(1);
      expect(rapidFireEffectManager.getActive()[0].id).toBe('tower_2');
    });

    it('should handle removing non-existent effect', () => {
      rapidFireEffectManager.update('tower_1', { x: 5, y: 5 }, { x: 10, y: 5 }, 0.8, 0);

      expect(() => {
        rapidFireEffectManager.remove('non_existent');
      }).not.toThrow();

      expect(rapidFireEffectManager.getActive().length).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all effects', () => {
      rapidFireEffectManager.update('tower_1', { x: 0, y: 0 }, { x: 5, y: 0 }, 0.8, 0);
      rapidFireEffectManager.update('tower_2', { x: 10, y: 10 }, { x: 15, y: 10 }, 0.6, 0);

      rapidFireEffectManager.clear();

      expect(rapidFireEffectManager.getActive().length).toBe(0);
    });
  });

  describe('getActive', () => {
    it('should return empty array when no effects', () => {
      expect(rapidFireEffectManager.getActive()).toEqual([]);
    });

    it('should return all active effects', () => {
      rapidFireEffectManager.update('tower_1', { x: 0, y: 0 }, { x: 5, y: 0 }, 0.8, 0);
      rapidFireEffectManager.update('tower_2', { x: 10, y: 10 }, { x: 15, y: 10 }, 0.6, 0);

      const active = rapidFireEffectManager.getActive();

      expect(active.length).toBe(2);
      expect(active.map((e) => e.id).sort()).toEqual(['tower_1', 'tower_2']);
    });
  });
});
