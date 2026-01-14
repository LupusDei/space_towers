// Damage Number Sprite - Floating damage text that rises and fades
// Features: gold color, rise animation, fade out, object pooling

import type { Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const DAMAGE_NUMBER_DURATION = 800; // ms
const RISE_DISTANCE = 40; // pixels
const FONT_SIZE = 16;
const GOLD_COLOR = '#ffd700';
const GOLD_GLOW = 'rgba(255, 215, 0, 0.6)';
const POOL_INITIAL_SIZE = 20;

// ============================================================================
// DamageNumber Instance
// ============================================================================

export interface DamageNumber {
  id: number;
  value: number;
  position: Point;
  startTime: number;
  active: boolean;
}

// ============================================================================
// Object Pool
// ============================================================================

class DamageNumberPool {
  private pool: DamageNumber[] = [];
  private activeNumbers: DamageNumber[] = [];
  private nextId = 0;

  constructor() {
    // Pre-allocate pool
    for (let i = 0; i < POOL_INITIAL_SIZE; i++) {
      this.pool.push(this.createInstance());
    }
  }

  private createInstance(): DamageNumber {
    return {
      id: this.nextId++,
      value: 0,
      position: { x: 0, y: 0 },
      startTime: 0,
      active: false,
    };
  }

  spawn(value: number, position: Point, time: number): DamageNumber {
    // Get from pool or create new
    let instance = this.pool.pop();
    if (!instance) {
      instance = this.createInstance();
    }

    // Initialize
    instance.value = value;
    instance.position = { x: position.x, y: position.y };
    instance.startTime = time;
    instance.active = true;

    this.activeNumbers.push(instance);
    return instance;
  }

  update(currentTime: number): void {
    // Remove expired numbers and return to pool
    for (let i = this.activeNumbers.length - 1; i >= 0; i--) {
      const num = this.activeNumbers[i];
      const elapsed = currentTime - num.startTime;

      if (elapsed >= DAMAGE_NUMBER_DURATION) {
        num.active = false;
        this.activeNumbers.splice(i, 1);
        this.pool.push(num);
      }
    }
  }

  getActive(): DamageNumber[] {
    return this.activeNumbers;
  }

  clear(): void {
    for (const num of this.activeNumbers) {
      num.active = false;
      this.pool.push(num);
    }
    this.activeNumbers.length = 0;
  }
}

// ============================================================================
// Singleton Pool Instance
// ============================================================================

export const damageNumberPool = new DamageNumberPool();

// ============================================================================
// Rendering
// ============================================================================

export function drawDamageNumber(context: SpriteRenderContext, damageNumber: DamageNumber): void {
  const { ctx, time } = context;
  const elapsed = time - damageNumber.startTime;
  const progress = Math.min(1, elapsed / DAMAGE_NUMBER_DURATION);

  if (progress >= 1) return;

  // Easing for smooth rise
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const fadeOut = 1 - progress;

  // Calculate position (rise upward)
  const offsetY = -easeOut * RISE_DISTANCE;
  const x = damageNumber.position.x;
  const y = damageNumber.position.y + offsetY;

  // Scale effect: slight grow then shrink
  const scale =
    progress < 0.1
      ? 0.8 + (progress / 0.1) * 0.4 // Grow from 0.8 to 1.2
      : 1.2 - (progress - 0.1) * 0.3; // Shrink from 1.2 to ~0.93

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // Text styling
  ctx.font = `bold ${FONT_SIZE}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Glow effect
  ctx.globalAlpha = fadeOut * 0.5;
  ctx.shadowColor = GOLD_GLOW;
  ctx.shadowBlur = 8;
  ctx.fillStyle = GOLD_COLOR;
  ctx.fillText(String(damageNumber.value), 0, 0);

  // Main text
  ctx.globalAlpha = fadeOut;
  ctx.shadowBlur = 4;
  ctx.fillStyle = GOLD_COLOR;
  ctx.fillText(String(damageNumber.value), 0, 0);

  // Outline for readability
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeText(String(damageNumber.value), 0, 0);

  ctx.restore();
}

export function drawAllDamageNumbers(context: SpriteRenderContext): void {
  damageNumberPool.update(context.time);

  for (const num of damageNumberPool.getActive()) {
    drawDamageNumber(context, num);
  }
}

// ============================================================================
// Convenience API
// ============================================================================

/**
 * Spawn a damage number at a position.
 * Call this when damage is dealt to an enemy.
 *
 * @param value - The damage amount to display
 * @param position - Screen position (in pixels) to spawn at
 * @param time - Current game time in ms
 */
export function spawnDamageNumber(value: number, position: Point, time: number): DamageNumber {
  return damageNumberPool.spawn(value, position, time);
}

/**
 * Spawn a damage number at a grid cell position.
 * Converts grid coordinates to screen coordinates.
 *
 * @param value - The damage amount to display
 * @param gridPosition - Position in grid coordinates
 * @param cellSize - Size of each grid cell in pixels
 * @param time - Current game time in ms
 */
export function spawnDamageNumberAtCell(
  value: number,
  gridPosition: Point,
  cellSize: number,
  time: number
): DamageNumber {
  const screenPos: Point = {
    x: gridPosition.x * cellSize + cellSize / 2,
    y: gridPosition.y * cellSize + cellSize / 2,
  };
  return damageNumberPool.spawn(value, screenPos, time);
}

export default {
  spawn: spawnDamageNumber,
  spawnAtCell: spawnDamageNumberAtCell,
  drawAll: drawAllDamageNumbers,
  pool: damageNumberPool,
};
