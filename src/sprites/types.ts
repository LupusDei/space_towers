// Sprite Interfaces for Space Towers

import type { Tower, Enemy, Projectile, Point } from '../types';

// ============================================================================
// Render Context
// ============================================================================

export interface SpriteRenderContext {
  ctx: CanvasRenderingContext2D;
  cellSize: number;
  time: number;
}

// ============================================================================
// Tower Sprite
// ============================================================================

export interface TowerSprite {
  draw(context: SpriteRenderContext, tower: Tower): void;
  drawFiring?(context: SpriteRenderContext, tower: Tower, target: Point): void;
  drawRange?(context: SpriteRenderContext, tower: Tower): void;
}

// ============================================================================
// Enemy Sprite
// ============================================================================

export interface EnemySprite {
  draw(context: SpriteRenderContext, enemy: Enemy): void;
}

// ============================================================================
// Projectile Sprite
// ============================================================================

export interface ProjectileSprite {
  draw(context: SpriteRenderContext, projectile: Projectile): void;
}

// ============================================================================
// Effect Sprite
// ============================================================================

export interface EffectSprite {
  draw(context: SpriteRenderContext, position: Point, progress: number): void;
}
