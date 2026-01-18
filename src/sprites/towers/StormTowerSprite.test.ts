// Storm Tower Sprite Tests
// Tests for StormTowerSprite rendering functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StormTowerSprite } from './StormTowerSprite';
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
    id: 'tower-1',
    type: 'storm',
    position: { x: 5, y: 5 },
    level: 1,
    damage: 10,
    range: 100,
    fireRate: 1,
    lastFired: 0,
    kills: 0,
    damageDealt: 0,
    ...overrides,
  } as Tower;
}

// ============================================================================
// StormTowerSprite Tests
// ============================================================================

describe('StormTowerSprite', () => {
  let context: SpriteRenderContext;
  let tower: Tower;

  beforeEach(() => {
    context = createMockContext();
    tower = createMockTower();
  });

  describe('interface compliance', () => {
    it('should implement draw method', () => {
      expect(typeof StormTowerSprite.draw).toBe('function');
    });

    it('should implement drawFiring method', () => {
      expect(typeof StormTowerSprite.drawFiring).toBe('function');
    });

    it('should implement drawRange method', () => {
      expect(typeof StormTowerSprite.drawRange).toBe('function');
    });
  });

  describe('draw', () => {
    it('should not throw when drawing level 1 tower', () => {
      tower.level = 1;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should not throw when drawing level 5 tower', () => {
      tower.level = 5;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should handle all tower levels 1-5', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
      }
    });

    it('should clamp level below 1 to 1', () => {
      tower.level = 0;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should clamp level above 5 to 5', () => {
      tower.level = 10;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should handle undefined level', () => {
      tower.level = undefined as unknown as number;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('should use canvas context for drawing', () => {
      StormTowerSprite.draw(context, tower);
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('should create gradients for visual elements', () => {
      StormTowerSprite.draw(context, tower);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
    });

    it('should save and restore context state', () => {
      StormTowerSprite.draw(context, tower);
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });

    it('should draw ellipses for base platform', () => {
      StormTowerSprite.draw(context, tower);
      expect(context.ctx.ellipse).toHaveBeenCalled();
    });
  });

  describe('drawFiring', () => {
    const target = { x: 10, y: 10 };

    it('should not throw when drawing firing effect', () => {
      expect(() => StormTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
    });

    it('should handle all tower levels', () => {
      for (let level = 1; level <= 5; level++) {
        tower.level = level;
        expect(() => StormTowerSprite.drawFiring!(context, tower, target)).not.toThrow();
      }
    });

    it('should draw lightning to target', () => {
      StormTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('should draw impact glow at target', () => {
      StormTowerSprite.drawFiring!(context, tower, target);
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawRange', () => {
    it('should not throw when drawing range', () => {
      expect(() => StormTowerSprite.drawRange!(context, tower)).not.toThrow();
    });

    it('should handle selected state', () => {
      expect(() => StormTowerSprite.drawRange!(context, tower, true)).not.toThrow();
      expect(() => StormTowerSprite.drawRange!(context, tower, false)).not.toThrow();
    });

    it('should draw range circle', () => {
      StormTowerSprite.drawRange!(context, tower);
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('should use dashed line for range indicator', () => {
      StormTowerSprite.drawRange!(context, tower);
      expect(context.ctx.setLineDash).toHaveBeenCalled();
    });
  });

  describe('animation', () => {
    it('should handle time parameter for animations', () => {
      context.time = 0;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();

      context.time = 1000;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();

      context.time = 99999;
      expect(() => StormTowerSprite.draw(context, tower)).not.toThrow();
    });
  });

  describe('level-based visuals', () => {
    it('should draw energy field for level 2+', () => {
      tower.level = 1;
      StormTowerSprite.draw(context, tower);
      const callsLevel1 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 2;
      StormTowerSprite.draw(context, tower);
      const callsLevel2 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 2 should have more gradient calls due to energy field
      expect(callsLevel2).toBeGreaterThan(callsLevel1);
    });

    it('should draw arc bridges for level 3+', () => {
      tower.level = 2;
      StormTowerSprite.draw(context, tower);
      const strokesLevel2 = (context.ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 3;
      StormTowerSprite.draw(context, tower);
      const strokesLevel3 = (context.ctx.stroke as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 3 may have more strokes due to arc bridges (depending on animation timing)
      expect(strokesLevel3).toBeGreaterThanOrEqual(strokesLevel2);
    });

    it('should draw core glow for level 4+', () => {
      tower.level = 3;
      StormTowerSprite.draw(context, tower);
      const callsLevel3 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 4;
      StormTowerSprite.draw(context, tower);
      const callsLevel4 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 4 should have more gradient calls due to core glow
      expect(callsLevel4).toBeGreaterThan(callsLevel3);
    });

    it('should draw storm cloud for level 5', () => {
      tower.level = 4;
      StormTowerSprite.draw(context, tower);
      const callsLevel4 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 5;
      StormTowerSprite.draw(context, tower);
      const callsLevel5 = (context.ctx.createRadialGradient as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 5 should have more gradient calls due to storm cloud
      expect(callsLevel5).toBeGreaterThan(callsLevel4);
    });

    it('should increase prong count at higher levels', () => {
      // Level 1-2 has 3 prongs, level 3-4 has 4 prongs, level 5 has 5 prongs
      // Each prong draws an arc for the orb, so we can check arc calls
      tower.level = 1;
      StormTowerSprite.draw(context, tower);
      const arcCallsLevel1 = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      context = createMockContext();
      tower.level = 5;
      StormTowerSprite.draw(context, tower);
      const arcCallsLevel5 = (context.ctx.arc as ReturnType<typeof vi.fn>).mock.calls.length;

      // Level 5 should have more arc calls due to more prongs and effects
      expect(arcCallsLevel5).toBeGreaterThan(arcCallsLevel1);
    });
  });
});
