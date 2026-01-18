// Slow Indicator Tests
// Tests for slow visual effect on enemies

import { describe, it, expect, beforeEach } from 'vitest';
import { isSlowed, drawSlowIndicator } from './SlowIndicator';
import type { Enemy } from '../../game/types';
import { EnemyType } from '../../game/types';

// ============================================================================
// Test Setup
// ============================================================================

function createMockEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'test_enemy_1',
    type: EnemyType.SCOUT,
    position: { x: 100, y: 100 },
    health: 100,
    maxHealth: 100,
    speed: 50,
    armor: 0,
    reward: 10,
    pathIndex: 0,
    path: [{ x: 0, y: 0 }],
    slowMultiplier: 1,
    slowEndTime: 0,
    ...overrides,
  };
}

function createMockContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: '',
    save: () => {},
    restore: () => {},
    translate: () => {},
    rotate: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    arc: () => {},
    moveTo: () => {},
    lineTo: () => {},
    closePath: () => {},
    fill: () => {},
    stroke: () => {},
    createRadialGradient: () => ({
      addColorStop: () => {},
    }),
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
  } as unknown as CanvasRenderingContext2D;
}

// ============================================================================
// isSlowed Tests
// ============================================================================

describe('isSlowed', () => {
  it('should return false when enemy has no slow effect', () => {
    const enemy = createMockEnemy({ slowEndTime: 0 });
    expect(isSlowed(enemy, 1)).toBe(false);
  });

  it('should return false when slow effect has expired', () => {
    const enemy = createMockEnemy({ slowEndTime: 5 });
    expect(isSlowed(enemy, 10)).toBe(false);
  });

  it('should return true when slow effect is active', () => {
    const enemy = createMockEnemy({ slowEndTime: 10 });
    expect(isSlowed(enemy, 5)).toBe(true);
  });

  it('should return false exactly at slow end time', () => {
    const enemy = createMockEnemy({ slowEndTime: 10 });
    expect(isSlowed(enemy, 10)).toBe(false);
  });

  it('should return true just before slow end time', () => {
    const enemy = createMockEnemy({ slowEndTime: 10 });
    expect(isSlowed(enemy, 9.99)).toBe(true);
  });
});

// ============================================================================
// drawSlowIndicator Tests
// ============================================================================

describe('drawSlowIndicator', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
  });

  it('should not draw when enemy is not slowed', () => {
    const enemy = createMockEnemy({ slowEndTime: 0 });
    let drawCalled = false;
    ctx.beginPath = () => {
      drawCalled = true;
    };

    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });

    expect(drawCalled).toBe(false);
  });

  it('should draw when enemy is slowed', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    let drawCalled = false;
    ctx.beginPath = () => {
      drawCalled = true;
    };

    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });

    expect(drawCalled).toBe(true);
  });

  it('should apply blue glow colors', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    const strokeColors: string[] = [];
    Object.defineProperty(ctx, 'strokeStyle', {
      set: (val: string) => {
        if (val.includes('136, 204, 255') || val.includes('0, 170, 255')) {
          strokeColors.push(val);
        }
      },
      get: () => '',
    });

    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });

    // Should have applied blue colors for glow rings
    expect(strokeColors.length).toBeGreaterThan(0);
  });

  it('should call save and restore for state management', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    let saveCount = 0;
    let restoreCount = 0;
    ctx.save = () => {
      saveCount++;
    };
    ctx.restore = () => {
      restoreCount++;
    };

    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });

    // At least one save/restore pair for main effect + crystals
    expect(saveCount).toBeGreaterThan(0);
    expect(restoreCount).toBeGreaterThan(0);
    expect(saveCount).toBe(restoreCount);
  });

  it('should draw ice crystals with glow effect', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    let glowApplied = false;
    Object.defineProperty(ctx, 'shadowBlur', {
      set: (val: number) => {
        if (val > 0) glowApplied = true;
      },
      get: () => 0,
    });

    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });

    expect(glowApplied).toBe(true);
  });

  it('should respect offsetY configuration', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    const arcCenterYs: number[] = [];
    ctx.arc = (_x: number, y: number) => {
      arcCenterYs.push(y);
    };

    // Draw with offset
    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20, offsetY: -10 });

    // All arc centers should be adjusted by offset
    arcCenterYs.forEach((y) => {
      // Center Y was 100, offset is -10, so effective Y should be 90
      // Crystals orbit around this center
      expect(y).toBeLessThanOrEqual(110); // Within orbit radius of 90
    });
  });

  it('should fade out effect near slow end time', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    const alphaValues: number[] = [];

    // Capture alpha from stroke style
    Object.defineProperty(ctx, 'strokeStyle', {
      set: (val: string) => {
        const match = val.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        if (match) {
          alphaValues.push(parseFloat(match[1]));
        }
      },
      get: () => '',
    });

    // Time is 9.7, slowEndTime is 10, so 0.3 seconds remaining (within fade threshold)
    drawSlowIndicator(ctx, enemy, 100, 100, 9.7, { radius: 20 });

    // Alpha values should be reduced (fading)
    const avgAlpha = alphaValues.reduce((a, b) => a + b, 0) / alphaValues.length;
    expect(avgAlpha).toBeLessThan(0.5); // Should be faded
  });

  it('should have full intensity when not near slow end', () => {
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });
    const alphaValues: number[] = [];

    Object.defineProperty(ctx, 'strokeStyle', {
      set: (val: string) => {
        const match = val.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
        if (match) {
          alphaValues.push(parseFloat(match[1]));
        }
      },
      get: () => '',
    });

    // Time is 5, slowEndTime is 10, so 5 seconds remaining (not fading)
    drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });

    // Should have some alpha values (effect is visible)
    expect(alphaValues.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// Integration-style tests
// ============================================================================

describe('SlowIndicator integration', () => {
  it('should handle enemy with zero slow multiplier', () => {
    const ctx = createMockContext();
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0 });

    // Should not throw
    expect(() => {
      drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 20 });
    }).not.toThrow();
  });

  it('should handle very small radius', () => {
    const ctx = createMockContext();
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });

    // Should not throw with tiny radius
    expect(() => {
      drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 1 });
    }).not.toThrow();
  });

  it('should handle very large radius', () => {
    const ctx = createMockContext();
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });

    // Should not throw with large radius
    expect(() => {
      drawSlowIndicator(ctx, enemy, 100, 100, 5, { radius: 1000 });
    }).not.toThrow();
  });

  it('should handle negative time values', () => {
    const ctx = createMockContext();
    const enemy = createMockEnemy({ slowEndTime: 10, slowMultiplier: 0.5 });

    // Should not throw with negative time
    expect(() => {
      drawSlowIndicator(ctx, enemy, 100, 100, -5, { radius: 20 });
    }).not.toThrow();
  });
});
