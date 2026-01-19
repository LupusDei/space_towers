// Gravity Pulse Sprite Tests for Space Towers
// Tests the gravity pulse effect and manager

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGravityPulseSprite, gravityPulseManager } from './GravityPulseSprite';
import type { SpriteRenderContext } from '../types';

// Mock canvas context
function createMockContext(): SpriteRenderContext {
  const ctx = {
    fillStyle: '',
    strokeStyle: '',
    globalAlpha: 1,
    lineWidth: 1,
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
  } as unknown as CanvasRenderingContext2D;

  return {
    ctx,
    cellSize: 44,
    time: 0,
  };
}

describe('GravityPulseSprite', () => {
  describe('createGravityPulseSprite', () => {
    it('creates an effect sprite with draw method', () => {
      const sprite = createGravityPulseSprite();
      expect(sprite).toBeDefined();
      expect(typeof sprite.draw).toBe('function');
    });

    it('creates sprite with default level 1', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0.5)).not.toThrow();
    });

    it('creates sprite with explicit level parameter', () => {
      for (let level = 1; level <= 5; level++) {
        const sprite = createGravityPulseSprite(level);
        expect(sprite).toBeDefined();
        expect(typeof sprite.draw).toBe('function');
      }
    });

    it('draws without errors at progress 0', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at progress 0.5', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0.5)).not.toThrow();
    });

    it('draws without errors at progress 1', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 1)).not.toThrow();
    });

    it('resets globalAlpha to 1 after drawing', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      sprite.draw(context, position, 0.5);
      expect(context.ctx.globalAlpha).toBe(1);
    });

    it('draws level 2 with distortion waves', () => {
      const sprite = createGravityPulseSprite(2);
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0.3)).not.toThrow();
      // Distortion waves use additional stroke calls
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('draws level 3 with extra ring', () => {
      const sprite = createGravityPulseSprite(3);
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0.4)).not.toThrow();
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('draws level 4 with particles', () => {
      const sprite = createGravityPulseSprite(4);
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0.3)).not.toThrow();
      // Particles use fill calls
      expect(context.ctx.fill).toHaveBeenCalled();
    });

    it('draws level 5 with quantum ripple', () => {
      const sprite = createGravityPulseSprite(5);
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 0.3)).not.toThrow();
      expect(context.ctx.stroke).toHaveBeenCalled();
    });

    it('clamps level to valid range', () => {
      // Level below 1 should work (clamped to 1)
      const spriteBelow = createGravityPulseSprite(0);
      const context = createMockContext();
      const position = { x: 5, y: 5 };
      expect(() => spriteBelow.draw(context, position, 0.5)).not.toThrow();

      // Level above 5 should work (clamped to 5)
      const spriteAbove = createGravityPulseSprite(10);
      expect(() => spriteAbove.draw(context, position, 0.5)).not.toThrow();
    });
  });

  describe('gravityPulseManager', () => {
    beforeEach(() => {
      gravityPulseManager.clear();
    });

    it('starts with no active pulses', () => {
      expect(gravityPulseManager.getActive()).toHaveLength(0);
    });

    it('spawns a pulse at the given position', () => {
      const position = { x: 220, y: 220 }; // pixel position
      gravityPulseManager.spawn(position, 1000);

      const active = gravityPulseManager.getActive();
      expect(active).toHaveLength(1);
      expect(active[0].position).toEqual(position);
      expect(active[0].startTime).toBe(1000);
    });

    it('spawns a pulse with default level 1', () => {
      gravityPulseManager.spawn({ x: 100, y: 100 }, 1000);

      const active = gravityPulseManager.getActive();
      expect(active).toHaveLength(1);
      expect(active[0].level).toBe(1);
    });

    it('spawns a pulse with explicit level', () => {
      gravityPulseManager.spawn({ x: 100, y: 100 }, 1000, 3);

      const active = gravityPulseManager.getActive();
      expect(active).toHaveLength(1);
      expect(active[0].level).toBe(3);
    });

    it('spawns multiple pulses with different levels', () => {
      gravityPulseManager.spawn({ x: 100, y: 100 }, 1000, 1);
      gravityPulseManager.spawn({ x: 200, y: 200 }, 1100, 3);
      gravityPulseManager.spawn({ x: 300, y: 300 }, 1200, 5);

      const active = gravityPulseManager.getActive();
      expect(active).toHaveLength(3);
      expect(active[0].level).toBe(1);
      expect(active[1].level).toBe(3);
      expect(active[2].level).toBe(5);
    });

    it('spawns multiple pulses', () => {
      gravityPulseManager.spawn({ x: 100, y: 100 }, 1000);
      gravityPulseManager.spawn({ x: 200, y: 200 }, 1100);
      gravityPulseManager.spawn({ x: 300, y: 300 }, 1200);

      expect(gravityPulseManager.getActive()).toHaveLength(3);
    });

    it('clears all pulses', () => {
      gravityPulseManager.spawn({ x: 100, y: 100 }, 1000);
      gravityPulseManager.spawn({ x: 200, y: 200 }, 1100);

      gravityPulseManager.clear();
      expect(gravityPulseManager.getActive()).toHaveLength(0);
    });

    it('removes expired pulses during drawAll', () => {
      // Spawn a pulse at time 0
      gravityPulseManager.spawn({ x: 100, y: 100 }, 0);

      // Create context with time after pulse duration (400ms = 0.4s)
      const context = createMockContext();
      context.time = 0.5; // 500ms in seconds

      gravityPulseManager.drawAll(context);

      // Pulse should be expired and removed
      expect(gravityPulseManager.getActive()).toHaveLength(0);
    });

    it('keeps active pulses during drawAll', () => {
      // Spawn a pulse at time 100ms
      gravityPulseManager.spawn({ x: 100, y: 100 }, 100);

      // Create context with time within duration
      const context = createMockContext();
      context.time = 0.2; // 200ms in seconds (pulse started at 100ms, so 100ms elapsed)

      gravityPulseManager.drawAll(context);

      // Pulse should still be active
      expect(gravityPulseManager.getActive()).toHaveLength(1);
    });

    it('draws active pulses during drawAll', () => {
      gravityPulseManager.spawn({ x: 220, y: 220 }, 0);

      const context = createMockContext();
      context.time = 0.1; // 100ms

      gravityPulseManager.drawAll(context);

      // Verify drawing occurred (arc was called for the rings)
      expect(context.ctx.arc).toHaveBeenCalled();
    });
  });
});
