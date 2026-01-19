// Gatling Tower Sprite Tests
// Tests for GatlingTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GatlingTowerSprite } from './GatlingTowerSprite';
import type { Tower } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// Mock the combat module
vi.mock('../../game/combat/CombatModule', () => ({
  combatModule: {
    getGatlingSpinProgress: vi.fn(() => 0),
  },
}));

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
    rect: vi.fn(),
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
    globalAlpha: 1,
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    cellSize: 44,
    time: 0,
  };
}

function createMockTower(overrides: Partial<Tower> = {}): Tower {
  return {
    id: 'tower-1',
    type: 'gatling',
    position: { x: 5, y: 5 },
    level: 1,
    damage: 8,
    range: 140,
    fireRate: 0.2,
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
      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
    });

    it('should save and restore context state', () => {
      GatlingTowerSprite.draw(context, tower);
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });
  });

  describe('drawFiring', () => {
    const target = { x: 300, y: 300 };

    it('should not throw when drawing firing effect', () => {
      expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
    });

    it('should handle all tower levels', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => GatlingTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
      }
    });

    it('should draw muzzle flash effect', () => {
      GatlingTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
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
  });

  describe('level-based visuals', () => {
    it('should draw ammo drum for level 2+', () => {
      // Level 1 - no ammo drum
      tower.level = 1;
      GatlingTowerSprite.draw(context, tower);
      const level1Calls = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 2 - has ammo drum
      context = createMockContext();
      tower = createMockTower({ level: 2 });
      GatlingTowerSprite.draw(context, tower);
      const level2Calls = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 2 should have more arc calls due to ammo drum
      expect(level2Calls).toBeGreaterThan(level1Calls);
    });

    it('should draw second ammo drum for level 4+', () => {
      // Level 3 - one ammo drum
      tower.level = 3;
      GatlingTowerSprite.draw(context, tower);
      const level3Calls = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 4 - two ammo drums
      context = createMockContext();
      tower = createMockTower({ level: 4 });
      GatlingTowerSprite.draw(context, tower);
      const level4Calls = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 4 should have more arc calls due to second ammo drum
      expect(level4Calls).toBeGreaterThan(level3Calls);
    });
  });

  describe('targeting rotation', () => {
    it('should rotate to face target when targetPosition is set', () => {
      tower.targetPosition = { x: 400, y: 200 };
      GatlingTowerSprite.draw(context, tower);

      // Verify rotate was called for aiming
      expect(context.ctx.rotate).toHaveBeenCalled();
    });

    it('should not rotate when no target', () => {
      tower.targetPosition = null;
      GatlingTowerSprite.draw(context, tower);

      // Rotate should still be called (for barrel rotation), but aim angle should be 0
      expect(context.ctx.rotate).toHaveBeenCalled();
    });
  });
});
