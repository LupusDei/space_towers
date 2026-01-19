// Needle Tower Sprite Tests
// Tests the NeedleTowerSprite visual component and hit pulse manager

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NeedleTowerSprite, needleHitPulseManager } from './NeedleTowerSprite';
import type { SpriteRenderContext } from '../types';
import type { Tower } from '../../game/types';
import { TowerType } from '../../game/types';

// Mock canvas context
function createMockContext(time: number = 0): SpriteRenderContext {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    ellipse: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    fillRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    clip: vi.fn(),
    setLineDash: vi.fn(),
    rotate: vi.fn(),
    translate: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    cellSize: 44,
    time,
  };
}

// Create a mock tower
function createMockTower(level: number = 1): Tower {
  return {
    id: 'test-tower-1',
    type: TowerType.LASER, // Using LASER as placeholder, NEEDLE type may not exist yet
    position: { x: 5, y: 5 },
    level,
    damage: 10,
    range: 150,
    fireRate: 1,
    lastFired: 0,
    target: null,
    targetPosition: null,
    kills: 0,
    totalDamage: 0,
  };
}

describe('NeedleTowerSprite', () => {
  describe('draw method', () => {
    it('exports a valid TowerSprite object', () => {
      expect(NeedleTowerSprite).toBeDefined();
      expect(typeof NeedleTowerSprite.draw).toBe('function');
      expect(typeof NeedleTowerSprite.drawFiring).toBe('function');
      expect(typeof NeedleTowerSprite.drawRange).toBe('function');
    });

    it('draws without errors at level 1', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at level 3 (with secondary needles)', () => {
      const context = createMockContext();
      const tower = createMockTower(3);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at level 5 (all features)', () => {
      const context = createMockContext();
      const tower = createMockTower(5);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('handles animation time correctly', () => {
      const context = createMockContext(1000);
      const tower = createMockTower(1);

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('creates gradients for metallic effects', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('draws the base platform', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.ellipse).toHaveBeenCalled();
    });

    it('draws hazard stripes at level 2+', () => {
      const context = createMockContext();
      const tower = createMockTower(2);

      NeedleTowerSprite.draw(context, tower);

      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.clip).toHaveBeenCalled();
      expect(context.ctx.fillRect).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });

    it('does not draw hazard stripes at level 1', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.draw(context, tower);

      // save is called for rotation, but clip should not be called (no hazard stripes)
      expect(context.ctx.clip).not.toHaveBeenCalled();
    });

    it('rotates to face target when targetPosition is set', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      tower.targetPosition = { x: 10, y: 5 }; // target to the right

      NeedleTowerSprite.draw(context, tower);

      // rotate should be called for aiming at target
      expect(context.ctx.rotate).toHaveBeenCalled();
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });

    it('does not rotate when no target', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      tower.targetPosition = null;

      NeedleTowerSprite.draw(context, tower);

      // rotate should be called with angle 0 (no rotation)
      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(rotateCalls.length).toBeGreaterThanOrEqual(1);
      expect(rotateCalls[0][0]).toBe(0);
    });

    it('calculates correct angle to target above', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      // Tower at (5,5), target at (5,0) - directly above
      tower.targetPosition = { x: 5, y: 0 };

      NeedleTowerSprite.draw(context, tower);

      // Target above means angle should be close to 0 (needle points up)
      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(Math.abs(rotateCalls[0][0])).toBeLessThan(0.01);
    });

    it('calculates correct angle to target below', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      // Tower at (5,5), target at (5,10) - directly below
      tower.targetPosition = { x: 5, y: 10 };

      NeedleTowerSprite.draw(context, tower);

      // Target below means angle should be close to PI
      const rotateCalls = (context.ctx.rotate as ReturnType<typeof vi.fn>).mock.calls;
      expect(Math.abs(rotateCalls[0][0] - Math.PI)).toBeLessThan(0.01);
    });
  });

  describe('drawFiring method', () => {
    it('draws firing beam without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      expect(() =>
        NeedleTowerSprite.drawFiring!(context, tower, target)
      ).not.toThrow();
    });

    it('draws firing beam at different levels', () => {
      const context = createMockContext();
      const target = { x: 10, y: 10 };

      for (let level = 1; level <= 5; level++) {
        const tower = createMockTower(level);
        expect(() =>
          NeedleTowerSprite.drawFiring!(context, tower, target)
        ).not.toThrow();
      }
    });

    it('creates impact glow at target', () => {
      const context = createMockContext();
      const tower = createMockTower(1);
      const target = { x: 8, y: 8 };

      NeedleTowerSprite.drawFiring!(context, tower, target);

      // Multiple radial gradients should be created (tip glow + impact)
      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });
  });

  describe('drawRange method', () => {
    it('draws range circle without errors', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      expect(() =>
        NeedleTowerSprite.drawRange!(context, tower)
      ).not.toThrow();
    });

    it('uses different opacity for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.drawRange!(context, tower, true);

      expect(context.ctx.arc).toHaveBeenCalled();
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([5, 5]);
      expect(context.ctx.setLineDash).toHaveBeenCalledWith([]);
    });

    it('uses correct line width for selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.drawRange!(context, tower, true);

      // Line width should be 2 for selected
      expect(context.ctx.lineWidth).toBe(2);
    });

    it('uses correct line width for non-selected state', () => {
      const context = createMockContext();
      const tower = createMockTower(1);

      NeedleTowerSprite.drawRange!(context, tower, false);

      // Line width should be 1 for non-selected
      expect(context.ctx.lineWidth).toBe(1);
    });
  });

  describe('level progression', () => {
    it('increases visual complexity with level', () => {
      const context1 = createMockContext();
      const context5 = createMockContext();
      const tower1 = createMockTower(1);
      const tower5 = createMockTower(5);

      NeedleTowerSprite.draw(context1, tower1);
      const calls1 = (context1.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      NeedleTowerSprite.draw(context5, tower5);
      const calls5 = (context5.ctx.beginPath as ReturnType<typeof vi.fn>).mock
        .calls.length;

      // Level 5 should have more drawing calls due to additional features
      expect(calls5).toBeGreaterThan(calls1);
    });
  });

  describe('hit pulse integration', () => {
    it('draws without errors when hit pulse is active', () => {
      const context = createMockContext(0.1); // time in seconds
      const tower = createMockTower(1);

      // Trigger a hit pulse
      needleHitPulseManager.triggerHit(tower.id, 50); // 50ms

      expect(() => NeedleTowerSprite.draw(context, tower)).not.toThrow();
    });

    it('draws hit pulse ring when pulse is active', () => {
      const context = createMockContext(0.05); // 50ms in seconds
      const tower = createMockTower(1);

      // Trigger a hit pulse at time 0
      needleHitPulseManager.triggerHit(tower.id, 0);

      NeedleTowerSprite.draw(context, tower);

      // Should draw the hit pulse ring (extra stroke call)
      expect(context.ctx.stroke).toHaveBeenCalled();
    });
  });
});

describe('needleHitPulseManager', () => {
  beforeEach(() => {
    needleHitPulseManager.clear();
  });

  it('starts with no active pulses', () => {
    expect(needleHitPulseManager.getActiveCount()).toBe(0);
  });

  it('triggers a hit pulse for a tower', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    expect(needleHitPulseManager.getActiveCount()).toBe(1);
  });

  it('returns pulse intensity > 0 immediately after trigger', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    const intensity = needleHitPulseManager.getPulseIntensity('tower-1', 10);
    expect(intensity).toBeGreaterThan(0);
  });

  it('returns pulse intensity of 0 after duration expires', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    // Duration is 150ms, so at 200ms it should be 0
    const intensity = needleHitPulseManager.getPulseIntensity('tower-1', 200);
    expect(intensity).toBe(0);
  });

  it('returns 0 intensity for unknown tower', () => {
    const intensity = needleHitPulseManager.getPulseIntensity('unknown', 0);
    expect(intensity).toBe(0);
  });

  it('replaces pulse when same tower is triggered again', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    needleHitPulseManager.triggerHit('tower-1', 100);

    // Should still only have 1 pulse
    expect(needleHitPulseManager.getActiveCount()).toBe(1);

    // Intensity should be based on the new start time
    // At 105ms (only 5ms elapsed from 100ms start), should be high
    const intensity = needleHitPulseManager.getPulseIntensity('tower-1', 105);
    expect(intensity).toBeGreaterThan(0.9); // Should be near max since only 5ms elapsed
  });

  it('tracks multiple towers independently', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    needleHitPulseManager.triggerHit('tower-2', 50);

    expect(needleHitPulseManager.getActiveCount()).toBe(2);

    // tower-1 at 100ms should be further decayed
    const intensity1 = needleHitPulseManager.getPulseIntensity('tower-1', 100);
    // tower-2 at 100ms should be less decayed (started at 50ms)
    const intensity2 = needleHitPulseManager.getPulseIntensity('tower-2', 100);

    expect(intensity2).toBeGreaterThan(intensity1);
  });

  it('clears all pulses', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    needleHitPulseManager.triggerHit('tower-2', 0);

    needleHitPulseManager.clear();

    expect(needleHitPulseManager.getActiveCount()).toBe(0);
  });

  it('removes expired pulse when getting intensity', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);
    expect(needleHitPulseManager.getActiveCount()).toBe(1);

    // Get intensity after expiration
    needleHitPulseManager.getPulseIntensity('tower-1', 200);

    // Pulse should be removed
    expect(needleHitPulseManager.getActiveCount()).toBe(0);
  });

  it('pulse intensity decays smoothly', () => {
    needleHitPulseManager.triggerHit('tower-1', 0);

    const intensity0 = needleHitPulseManager.getPulseIntensity('tower-1', 0);
    const intensity50 = needleHitPulseManager.getPulseIntensity('tower-1', 50);
    const intensity100 = needleHitPulseManager.getPulseIntensity('tower-1', 100);

    // Should decay over time
    expect(intensity0).toBeGreaterThan(intensity50);
    expect(intensity50).toBeGreaterThan(intensity100);
  });
});
