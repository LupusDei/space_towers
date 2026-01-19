// Slow Indicator Tests
// Tests for slow visual indicator on enemies

import { describe, it, expect, beforeEach } from 'vitest';
import { isEnemySlowed, drawSlowIndicator } from './SlowIndicator';
import type { Enemy } from '../../game/types';

// ============================================================================
// Test Setup
// ============================================================================

// Create a mock enemy with slow properties
function createMockEnemy(overrides: Partial<Enemy> = {}): Enemy {
  return {
    id: 'test-enemy-1',
    type: 'scout',
    position: { x: 100, y: 100 },
    health: 100,
    maxHealth: 100,
    speed: 50,
    armor: 0,
    reward: 10,
    pathIndex: 0,
    path: [],
    slowMultiplier: 1,
    slowEndTime: 0,
    ...overrides,
  } as Enemy;
}

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: '',
    globalAlpha: 1,
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    arc: () => {},
    stroke: () => {},
    fill: () => {},
  } as unknown as CanvasRenderingContext2D;
}

// ============================================================================
// isEnemySlowed Tests
// ============================================================================

describe('isEnemySlowed', () => {
  it('should return false when enemy has no slow effect', () => {
    const enemy = createMockEnemy({ slowEndTime: 0 });
    const result = isEnemySlowed(enemy, 1.0);
    expect(result).toBe(false);
  });

  it('should return true when enemy slow effect is active', () => {
    const enemy = createMockEnemy({ slowEndTime: 5.0 });
    const result = isEnemySlowed(enemy, 2.0);
    expect(result).toBe(true);
  });

  it('should return false when slow effect has expired', () => {
    const enemy = createMockEnemy({ slowEndTime: 2.0 });
    const result = isEnemySlowed(enemy, 3.0);
    expect(result).toBe(false);
  });

  it('should return false at exact expiration time', () => {
    const enemy = createMockEnemy({ slowEndTime: 2.0 });
    const result = isEnemySlowed(enemy, 2.0);
    expect(result).toBe(false);
  });

  it('should return true just before expiration', () => {
    const enemy = createMockEnemy({ slowEndTime: 2.0 });
    const result = isEnemySlowed(enemy, 1.999);
    expect(result).toBe(true);
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
    let drawCalled = false;
    ctx.arc = () => {
      drawCalled = true;
    };

    const enemy = createMockEnemy({ slowEndTime: 0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.0);

    expect(drawCalled).toBe(false);
  });

  it('should draw when enemy is slowed', () => {
    let drawCalled = false;
    ctx.arc = () => {
      drawCalled = true;
    };

    const enemy = createMockEnemy({ slowEndTime: 5.0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.0);

    expect(drawCalled).toBe(true);
  });

  it('should save and restore canvas context', () => {
    let saveCount = 0;
    let restoreCount = 0;
    ctx.save = () => {
      saveCount++;
    };
    ctx.restore = () => {
      restoreCount++;
    };

    const enemy = createMockEnemy({ slowEndTime: 5.0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.0);

    expect(saveCount).toBe(1);
    expect(restoreCount).toBe(1);
  });

  it('should apply glow effect via shadowBlur', () => {
    let glowApplied = false;
    let shadowBlurValue = 0;
    Object.defineProperty(ctx, 'shadowBlur', {
      set: (val: number) => {
        shadowBlurValue = val;
        if (val > 0) glowApplied = true;
      },
      get: () => shadowBlurValue,
    });

    const enemy = createMockEnemy({ slowEndTime: 5.0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.0);

    expect(glowApplied).toBe(true);
  });

  it('should apply fade effect when slow is about to expire', () => {
    let alphaSet = 1;
    Object.defineProperty(ctx, 'globalAlpha', {
      set: (val: number) => {
        alphaSet = val;
      },
      get: () => alphaSet,
    });

    // Slow expires at 2.0, current time is 1.9 (0.1s remaining, should fade)
    const enemy = createMockEnemy({ slowEndTime: 2.0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.9);

    // Alpha should be less than 1 (fading out in last 0.3 seconds)
    expect(alphaSet).toBeLessThan(1);
  });

  it('should have full opacity when slow has time remaining', () => {
    let alphaSet = 0;
    Object.defineProperty(ctx, 'globalAlpha', {
      set: (val: number) => {
        alphaSet = val;
      },
      get: () => alphaSet,
    });

    // Slow expires at 5.0, current time is 1.0 (4s remaining)
    const enemy = createMockEnemy({ slowEndTime: 5.0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.0);

    // Alpha should be 1 (full opacity)
    expect(alphaSet).toBe(1);
  });

  it('should draw multiple ring layers', () => {
    let arcCount = 0;
    ctx.arc = () => {
      arcCount++;
    };

    const enemy = createMockEnemy({ slowEndTime: 5.0 });
    drawSlowIndicator(ctx, enemy, 100, 100, 20, 1.0);

    // Should draw outer ring, inner ring, and core indicator (3 arcs)
    expect(arcCount).toBe(3);
  });
});
