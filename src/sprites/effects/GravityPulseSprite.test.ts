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

    it('draws without errors with negative progress (edge case)', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      // Negative progress can occur if currentTime < pulse.startTime
      expect(() => sprite.draw(context, position, -0.1)).not.toThrow();
    });

    it('draws without errors with progress > 1 (edge case)', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      expect(() => sprite.draw(context, position, 1.5)).not.toThrow();
    });

    it('resets globalAlpha to 1 after drawing', () => {
      const sprite = createGravityPulseSprite();
      const context = createMockContext();
      const position = { x: 5, y: 5 };

      sprite.draw(context, position, 0.5);
      expect(context.ctx.globalAlpha).toBe(1);
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
