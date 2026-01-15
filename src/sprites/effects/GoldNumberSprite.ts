// Gold Number Sprite - Floating gold reward text that rises and fades
// Features: green color, rise animation, fade out, object pooling

import type { Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// ============================================================================
// Configuration
// ============================================================================

const GOLD_NUMBER_DURATION = 1000; // ms (slightly longer than damage numbers)
const RISE_DISTANCE = 50; // pixels (slightly higher than damage numbers)
const FONT_SIZE = 18; // slightly larger for emphasis
const GREEN_COLOR = '#00ff88';
const GREEN_GLOW = 'rgba(0, 255, 136, 0.6)';
const POOL_INITIAL_SIZE = 10;

// ============================================================================
// GoldNumber Instance
// ============================================================================

export interface GoldNumber {
  id: number;
  amount: number;
  position: Point;
  startTime: number;
  active: boolean;
}

// ============================================================================
// Object Pool
// ============================================================================

class GoldNumberPool {
  private pool: GoldNumber[] = [];
  private activeNumbers: GoldNumber[] = [];
  private nextId = 0;

  constructor() {
    // Pre-allocate pool
    for (let i = 0; i < POOL_INITIAL_SIZE; i++) {
      this.pool.push(this.createInstance());
    }
  }

  private createInstance(): GoldNumber {
    return {
      id: this.nextId++,
      amount: 0,
      position: { x: 0, y: 0 },
      startTime: 0,
      active: false,
    };
  }

  spawn(amount: number, position: Point, time: number): GoldNumber {
    // Get from pool or create new
    let instance = this.pool.pop();
    if (!instance) {
      instance = this.createInstance();
    }

    // Initialize
    instance.amount = amount;
    instance.position = { x: position.x, y: position.y };
    instance.startTime = time;
    instance.active = true;

    this.activeNumbers.push(instance);
    return instance;
  }

  update(currentTime: number): void {
    // Remove expired numbers using swap-and-pop (O(n) instead of O(n^2) splice)
    let i = 0;
    while (i < this.activeNumbers.length) {
      const num = this.activeNumbers[i];
      const elapsed = currentTime - num.startTime;

      if (elapsed >= GOLD_NUMBER_DURATION) {
        num.active = false;
        // Swap with last element and pop (O(1) removal)
        this.activeNumbers[i] = this.activeNumbers[this.activeNumbers.length - 1];
        this.activeNumbers.pop();
        this.pool.push(num);
        // Don't increment i - need to check the swapped element
      } else {
        i++;
      }
    }
  }

  getActive(): GoldNumber[] {
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

export const goldNumberPool = new GoldNumberPool();

// ============================================================================
// Rendering
// ============================================================================

export function drawGoldNumber(context: SpriteRenderContext, goldNumber: GoldNumber): void {
  const { ctx, time } = context;
  const elapsed = time - goldNumber.startTime;
  const progress = Math.min(1, elapsed / GOLD_NUMBER_DURATION);

  if (progress >= 1) return;

  // Easing for smooth rise
  const easeOut = 1 - Math.pow(1 - progress, 3);
  const fadeOut = 1 - progress;

  // Calculate position (rise upward)
  const offsetY = -easeOut * RISE_DISTANCE;
  const x = goldNumber.position.x;
  const y = goldNumber.position.y + offsetY;

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

  // Format as "+$X"
  const text = `+$${goldNumber.amount}`;

  // Glow effect
  ctx.globalAlpha = fadeOut * 0.5;
  ctx.shadowColor = GREEN_GLOW;
  ctx.shadowBlur = 8;
  ctx.fillStyle = GREEN_COLOR;
  ctx.fillText(text, 0, 0);

  // Main text
  ctx.globalAlpha = fadeOut;
  ctx.shadowBlur = 4;
  ctx.fillStyle = GREEN_COLOR;
  ctx.fillText(text, 0, 0);

  // Outline for readability
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.lineWidth = 1;
  ctx.strokeText(text, 0, 0);

  ctx.restore();
}

export function drawAllGoldNumbers(context: SpriteRenderContext): void {
  goldNumberPool.update(context.time);

  for (const num of goldNumberPool.getActive()) {
    drawGoldNumber(context, num);
  }
}

// ============================================================================
// Convenience API
// ============================================================================

/**
 * Spawn a gold number at a position.
 * Call this when an enemy is killed and gold is awarded.
 *
 * @param amount - The gold amount to display
 * @param position - Screen position (in pixels) to spawn at
 * @param time - Current game time in ms
 */
export function spawnGoldNumber(amount: number, position: Point, time: number): GoldNumber {
  return goldNumberPool.spawn(amount, position, time);
}

export default {
  spawn: spawnGoldNumber,
  drawAll: drawAllGoldNumbers,
  pool: goldNumberPool,
};
