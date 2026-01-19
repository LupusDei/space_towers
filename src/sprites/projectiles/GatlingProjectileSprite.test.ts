// Gatling Projectile Sprite Tests for Space Towers
// Tests the bullet tracer projectile and impact effect

import { describe, it, expect, vi } from 'vitest';
import { GatlingProjectileSprite, GatlingImpactSprite } from './GatlingProjectileSprite';
import type { SpriteRenderContext } from '../types';
import type { Projectile } from '../../game/types';

// Mock canvas context
function createMockContext(): SpriteRenderContext {
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
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
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

function createMockProjectile(overrides: Partial<Projectile> = {}): Projectile {
  return {
    id: 'proj_test',
    sourceId: 'tower_1',
    targetId: 'enemy_1',
    towerType: 'laser', // Will be 'gatling' when that tower type exists
    position: { x: 100, y: 100 },
    velocity: { x: 10, y: 0 },
    damage: 5,
    speed: 500,
    piercing: false,
    aoe: 0,
    ...overrides,
  };
}

describe('GatlingProjectileSprite', () => {
  describe('draw', () => {
    it('has a draw method', () => {
      expect(typeof GatlingProjectileSprite.draw).toBe('function');
    });

    it('draws without errors with standard velocity', () => {
      const context = createMockContext();
      const projectile = createMockProjectile({ velocity: { x: 10, y: 5 } });

      expect(() => GatlingProjectileSprite.draw(context, projectile)).not.toThrow();
      expect(context.ctx.save).toHaveBeenCalled();
      expect(context.ctx.restore).toHaveBeenCalled();
    });

    it('draws without errors with zero velocity', () => {
      const context = createMockContext();
      const projectile = createMockProjectile({ velocity: { x: 0, y: 0 } });

      expect(() => GatlingProjectileSprite.draw(context, projectile)).not.toThrow();
    });

    it('draws without errors with negative velocity', () => {
      const context = createMockContext();
      const projectile = createMockProjectile({ velocity: { x: -10, y: -5 } });

      expect(() => GatlingProjectileSprite.draw(context, projectile)).not.toThrow();
    });

    it('translates to projectile position', () => {
      const context = createMockContext();
      const projectile = createMockProjectile({ position: { x: 200, y: 150 } });

      GatlingProjectileSprite.draw(context, projectile);

      expect(context.ctx.translate).toHaveBeenCalledWith(200, 150);
    });

    it('rotates based on velocity direction', () => {
      const context = createMockContext();
      const projectile = createMockProjectile({ velocity: { x: 10, y: 10 } });

      GatlingProjectileSprite.draw(context, projectile);

      // Velocity (10, 10) should result in rotation of Math.PI/4 (45 degrees)
      const expectedAngle = Math.atan2(10, 10);
      expect(context.ctx.rotate).toHaveBeenCalledWith(expectedAngle);
    });

    it('draws bullet using ellipse', () => {
      const context = createMockContext();
      const projectile = createMockProjectile();

      GatlingProjectileSprite.draw(context, projectile);

      expect(context.ctx.ellipse).toHaveBeenCalled();
    });

    it('draws tracer trail using path methods', () => {
      const context = createMockContext();
      const projectile = createMockProjectile();

      GatlingProjectileSprite.draw(context, projectile);

      expect(context.ctx.beginPath).toHaveBeenCalled();
      expect(context.ctx.moveTo).toHaveBeenCalled();
      expect(context.ctx.lineTo).toHaveBeenCalled();
      expect(context.ctx.closePath).toHaveBeenCalled();
    });

    it('creates linear gradients for tracer effect', () => {
      const context = createMockContext();
      const projectile = createMockProjectile();

      GatlingProjectileSprite.draw(context, projectile);

      // Should create gradients for tracer trail and bullet
      expect(context.ctx.createLinearGradient).toHaveBeenCalled();
    });

    it('draws with varying time for flicker effect', () => {
      const context1 = createMockContext();
      context1.time = 0;

      const context2 = createMockContext();
      context2.time = 0.5;

      const projectile = createMockProjectile();

      expect(() => GatlingProjectileSprite.draw(context1, projectile)).not.toThrow();
      expect(() => GatlingProjectileSprite.draw(context2, projectile)).not.toThrow();
    });
  });
});

describe('GatlingImpactSprite', () => {
  describe('draw', () => {
    it('has a draw method', () => {
      expect(typeof GatlingImpactSprite.draw).toBe('function');
    });

    it('draws without errors at progress 0', () => {
      const context = createMockContext();
      const position = { x: 100, y: 100 };

      expect(() => GatlingImpactSprite.draw(context, position, 0)).not.toThrow();
      expect(context.ctx.beginPath).toHaveBeenCalled();
    });

    it('draws without errors at progress 0.5', () => {
      const context = createMockContext();
      const position = { x: 100, y: 100 };

      expect(() => GatlingImpactSprite.draw(context, position, 0.5)).not.toThrow();
    });

    it('draws without errors at progress 1', () => {
      const context = createMockContext();
      const position = { x: 100, y: 100 };

      expect(() => GatlingImpactSprite.draw(context, position, 1)).not.toThrow();
    });

    it('draws spark particles', () => {
      const context = createMockContext();
      const position = { x: 150, y: 150 };

      GatlingImpactSprite.draw(context, position, 0.3);

      // Should draw multiple arcs for sparks
      expect(context.ctx.arc).toHaveBeenCalled();
    });

    it('creates radial gradient for central flash', () => {
      const context = createMockContext();
      const position = { x: 100, y: 100 };

      GatlingImpactSprite.draw(context, position, 0.5);

      expect(context.ctx.createRadialGradient).toHaveBeenCalled();
    });

    it('handles edge case with negative progress', () => {
      const context = createMockContext();
      const position = { x: 100, y: 100 };

      expect(() => GatlingImpactSprite.draw(context, position, -0.1)).not.toThrow();
    });

    it('handles edge case with progress > 1', () => {
      const context = createMockContext();
      const position = { x: 100, y: 100 };

      expect(() => GatlingImpactSprite.draw(context, position, 1.5)).not.toThrow();
    });
  });
});
