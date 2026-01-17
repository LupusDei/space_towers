// Health Bar Tests
// Tests for smooth health bar animation utility

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDisplayedHealth,
  cleanupHealthBarState,
  resetAllHealthBarStates,
  drawHealthBar,
  drawBossHealthBar,
} from './HealthBar';

// ============================================================================
// Test Setup
// ============================================================================

// Mock canvas context
function createMockContext(): CanvasRenderingContext2D {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    shadowBlur: 0,
    shadowColor: '',
    fillRect: () => {},
    strokeRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    stroke: () => {},
    createLinearGradient: () => ({
      addColorStop: () => {},
    }),
  } as unknown as CanvasRenderingContext2D;
}

// ============================================================================
// getDisplayedHealth Tests
// ============================================================================

describe('getDisplayedHealth', () => {
  beforeEach(() => {
    resetAllHealthBarStates();
  });

  it('should return actual health on first call for new enemy', () => {
    const result = getDisplayedHealth('enemy_1', 50, 100, 0);
    expect(result).toBe(50);
  });

  it('should return actual health when enemy is at full health', () => {
    const result = getDisplayedHealth('enemy_2', 100, 100, 0);
    expect(result).toBe(100);
  });

  it('should instantly update when health increases (healing)', () => {
    // Initial state
    getDisplayedHealth('enemy_3', 50, 100, 0);

    // Health increases instantly (time in seconds)
    const result = getDisplayedHealth('enemy_3', 75, 100, 0.1);
    expect(result).toBe(75);
  });

  it('should smoothly decrease health over time', () => {
    // Initial state at full health
    getDisplayedHealth('enemy_4', 100, 100, 0);

    // Damage dealt - health drops to 50 (time in seconds)
    const result1 = getDisplayedHealth('enemy_4', 50, 100, 0.1);
    // Displayed health should be > 50 (still animating down)
    expect(result1).toBeGreaterThan(50);
    expect(result1).toBeLessThan(100);
  });

  it('should eventually reach actual health value', () => {
    // Initial state
    getDisplayedHealth('enemy_5', 100, 100, 0);

    // Simulate time passing with damage (time in seconds)
    let result = getDisplayedHealth('enemy_5', 50, 100, 0.1);

    // After enough time passes (10 seconds), should reach target
    result = getDisplayedHealth('enemy_5', 50, 100, 10);
    expect(result).toBe(50);
  });

  it('should track different enemies independently', () => {
    // Two different enemies
    getDisplayedHealth('enemy_a', 100, 100, 0);
    getDisplayedHealth('enemy_b', 80, 100, 0);

    // Damage enemy_a (time in seconds)
    const resultA = getDisplayedHealth('enemy_a', 50, 100, 0.1);
    const resultB = getDisplayedHealth('enemy_b', 80, 100, 0.1);

    // enemy_a should be animating, enemy_b unchanged
    expect(resultA).toBeGreaterThan(50);
    expect(resultB).toBe(80);
  });
});

// ============================================================================
// cleanupHealthBarState Tests
// ============================================================================

describe('cleanupHealthBarState', () => {
  beforeEach(() => {
    resetAllHealthBarStates();
  });

  it('should remove state for specific enemy', () => {
    // Initialize state
    getDisplayedHealth('enemy_6', 100, 100, 0);
    getDisplayedHealth('enemy_6', 50, 100, 0);

    // Clean up
    cleanupHealthBarState('enemy_6');

    // Next call should treat as new enemy
    const result = getDisplayedHealth('enemy_6', 25, 100, 0);
    expect(result).toBe(25); // No animation, starts at actual health
  });

  it('should not affect other enemies', () => {
    // Initialize two enemies
    getDisplayedHealth('enemy_7', 100, 100, 0);
    getDisplayedHealth('enemy_8', 100, 100, 0);

    // Damage both (time in seconds)
    getDisplayedHealth('enemy_7', 50, 100, 0.1);
    getDisplayedHealth('enemy_8', 50, 100, 0.1);

    // Clean up only enemy_7
    cleanupHealthBarState('enemy_7');

    // enemy_8 should still have state (still animating)
    const result8 = getDisplayedHealth('enemy_8', 50, 100, 0.2);
    expect(result8).toBeGreaterThan(50);
  });
});

// ============================================================================
// resetAllHealthBarStates Tests
// ============================================================================

describe('resetAllHealthBarStates', () => {
  it('should clear all enemy states', () => {
    // Initialize multiple enemies
    getDisplayedHealth('enemy_9', 100, 100, 0);
    getDisplayedHealth('enemy_10', 100, 100, 0);

    // Damage both (time in seconds)
    getDisplayedHealth('enemy_9', 50, 100, 0.1);
    getDisplayedHealth('enemy_10', 50, 100, 0.1);

    // Reset all
    resetAllHealthBarStates();

    // Both should be treated as new
    const result9 = getDisplayedHealth('enemy_9', 25, 100, 0);
    const result10 = getDisplayedHealth('enemy_10', 25, 100, 0);

    expect(result9).toBe(25);
    expect(result10).toBe(25);
  });
});

// ============================================================================
// drawHealthBar Tests
// ============================================================================

describe('drawHealthBar', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
    resetAllHealthBarStates();
  });

  it('should not draw when showOnlyWhenDamaged is true and enemy is at full health', () => {
    let fillRectCalled = false;
    ctx.fillRect = () => {
      fillRectCalled = true;
    };

    drawHealthBar(ctx, 'enemy_11', 100, 100, 100, 100, 0, {
      offsetY: -20,
      showOnlyWhenDamaged: true,
    });

    expect(fillRectCalled).toBe(false);
  });

  it('should draw when showOnlyWhenDamaged is true and enemy is damaged', () => {
    let fillRectCalled = false;
    ctx.fillRect = () => {
      fillRectCalled = true;
    };

    drawHealthBar(ctx, 'enemy_12', 100, 100, 50, 100, 0, {
      offsetY: -20,
      showOnlyWhenDamaged: true,
    });

    expect(fillRectCalled).toBe(true);
  });

  it('should always draw when showOnlyWhenDamaged is false', () => {
    let fillRectCalled = false;
    ctx.fillRect = () => {
      fillRectCalled = true;
    };

    drawHealthBar(ctx, 'enemy_13', 100, 100, 100, 100, 0, {
      offsetY: -20,
      showOnlyWhenDamaged: false,
    });

    expect(fillRectCalled).toBe(true);
  });

  it('should use custom health color function', () => {
    let appliedColor = '';
    ctx.fillRect = function () {
      if (this.fillStyle !== '#333333') {
        // Skip background color
        appliedColor = this.fillStyle as string;
      }
    };

    drawHealthBar(ctx, 'enemy_14', 100, 100, 30, 100, 0, {
      offsetY: -20,
      showOnlyWhenDamaged: false,
      style: {
        getHealthColor: (percent: number) => (percent < 0.5 ? '#custom_red' : '#custom_green'),
      },
    });

    expect(appliedColor).toBe('#custom_red');
  });
});

// ============================================================================
// drawBossHealthBar Tests
// ============================================================================

describe('drawBossHealthBar', () => {
  let ctx: CanvasRenderingContext2D;

  beforeEach(() => {
    ctx = createMockContext();
    resetAllHealthBarStates();
  });

  it('should draw health bar with segments', () => {
    let segmentCount = 0;
    ctx.moveTo = () => {
      segmentCount++;
    };

    drawBossHealthBar(ctx, 'boss_1', 200, 200, 500, 500, 0, {
      width: 100,
      height: 10,
      offsetY: -50,
      segments: 10,
    });

    // 9 segment lines (10 segments means 9 dividers)
    expect(segmentCount).toBe(9);
  });

  it('should apply glow effect when not flashing', () => {
    let glowApplied = false;
    Object.defineProperty(ctx, 'shadowBlur', {
      set: (val: number) => {
        if (val > 0) glowApplied = true;
      },
      get: () => 0,
    });

    drawBossHealthBar(ctx, 'boss_2', 200, 200, 500, 500, 0, {
      width: 100,
      height: 10,
      offsetY: -50,
      glowColor: '#FF00FF',
      isFlashing: false,
    });

    expect(glowApplied).toBe(true);
  });

  it('should not apply glow when flashing', () => {
    let glowApplied = false;
    Object.defineProperty(ctx, 'shadowBlur', {
      set: (val: number) => {
        if (val > 0) glowApplied = true;
      },
      get: () => 0,
    });

    drawBossHealthBar(ctx, 'boss_3', 200, 200, 500, 500, 0, {
      width: 100,
      height: 10,
      offsetY: -50,
      glowColor: '#FF00FF',
      isFlashing: true,
    });

    expect(glowApplied).toBe(false);
  });
});
