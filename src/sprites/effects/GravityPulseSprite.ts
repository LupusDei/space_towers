// Gravity Pulse Effect Sprite - Expanding ring effect when Gravity tower fires
// Shows a gravitational distortion wave emanating from the tower

import type { Point } from '../../game/types';
import type { EffectSprite, SpriteRenderContext } from '../types';

// Gravity pulse colors (purple/violet theme for gravitational effect)
const PULSE_COLORS = {
  core: '#9060ff',
  glow: '144, 96, 255',
  ring: '#b080ff',
};

/**
 * Creates a gravity pulse effect sprite.
 * Duration is controlled by the caller via progress (0-1).
 * Designed for ~400ms duration.
 */
export function createGravityPulseSprite(): EffectSprite {
  return {
    draw(context: SpriteRenderContext, position: Point, progress: number): void {
      const { ctx, cellSize } = context;
      const centerX = position.x * cellSize + cellSize / 2;
      const centerY = position.y * cellSize + cellSize / 2;

      // Clamp progress to valid range to prevent negative radii in createRadialGradient
      const clampedProgress = Math.max(0, Math.min(1, progress));

      // Easing for smooth expansion
      const easeOut = 1 - Math.pow(1 - clampedProgress, 2);
      const fadeOut = 1 - clampedProgress;

      // Max radius is the tower's range (approximately 2.5 cells for gravity tower)
      const maxRadius = cellSize * 2.5;
      const ringRadius = easeOut * maxRadius;

      // Outer glow (fades quickly)
      // Skip if ringRadius is too small to prevent createRadialGradient errors
      if (clampedProgress < 0.6 && ringRadius > 1) {
        const glowAlpha = (0.6 - clampedProgress) * 0.4;
        const glowRadius = ringRadius * 1.3;
        const innerRadius = Math.max(0, ringRadius * 0.8);
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          innerRadius,
          centerX,
          centerY,
          glowRadius
        );
        gradient.addColorStop(0, `rgba(${PULSE_COLORS.glow}, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Primary expanding ring (skip if too small)
      if (ringRadius > 1) {
        const ringWidth = Math.max(2, (1 - clampedProgress) * 6);
        ctx.strokeStyle = PULSE_COLORS.ring;
        ctx.globalAlpha = fadeOut * 0.8;
        ctx.lineWidth = ringWidth;
        ctx.beginPath();
        ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Secondary inner ring (slightly delayed, creates ripple effect)
      if (clampedProgress > 0.1 && clampedProgress < 0.9) {
        const innerProgress = (clampedProgress - 0.1) / 0.8;
        const innerRadius = innerProgress * maxRadius * 0.7;

        // Only draw if radius is meaningful
        if (innerRadius > 1) {
          const innerAlpha = (1 - innerProgress) * 0.5;
          const innerWidth = Math.max(1, (1 - innerProgress) * 3);

          ctx.strokeStyle = PULSE_COLORS.core;
          ctx.globalAlpha = innerAlpha;
          ctx.lineWidth = innerWidth;
          ctx.beginPath();
          ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Center flash (brief, at start)
      if (clampedProgress < 0.2) {
        const flashAlpha = (0.2 - clampedProgress) * 3;
        const flashRadius = cellSize * 0.4;
        const flashGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          flashRadius
        );
        flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        flashGradient.addColorStop(0.4, `rgba(${PULSE_COLORS.glow}, ${flashAlpha * 0.6})`);
        flashGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flashGradient;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, flashRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset global alpha
      ctx.globalAlpha = 1;
    },
  };
}

// ============================================================================
// Gravity Pulse Manager - Track and render active pulses
// ============================================================================

const PULSE_DURATION = 400; // ms

export interface ActiveGravityPulse {
  id: number;
  position: Point; // Tower position in pixels
  startTime: number;
  sprite: EffectSprite;
}

class GravityPulseManager {
  private pulses: ActiveGravityPulse[] = [];
  private nextId = 0;

  /**
   * Spawn a gravity pulse at a tower position.
   * @param position - Tower position in pixels (center of tower)
   * @param time - Current game time in ms
   */
  spawn(position: Point, time: number): void {
    this.pulses.push({
      id: this.nextId++,
      position: { x: position.x, y: position.y },
      startTime: time,
      sprite: createGravityPulseSprite(),
    });
  }

  /**
   * Update and draw all active gravity pulses.
   * Removes expired pulses automatically.
   */
  drawAll(context: SpriteRenderContext): void {
    const currentTime = context.time * 1000; // Convert to ms

    // Remove expired pulses and draw active ones
    this.pulses = this.pulses.filter((pulse) => {
      const elapsed = currentTime - pulse.startTime;
      const progress = elapsed / PULSE_DURATION;

      if (progress >= 1) {
        return false; // Remove expired
      }

      // Convert pixel position (which is cell-centered) back to grid position for sprite
      // The pixel position includes cellSize/2 offset, so we subtract it before dividing
      const gridPos: Point = {
        x: (pulse.position.x - context.cellSize / 2) / context.cellSize,
        y: (pulse.position.y - context.cellSize / 2) / context.cellSize,
      };

      pulse.sprite.draw(context, gridPos, progress);
      return true;
    });
  }

  clear(): void {
    this.pulses = [];
  }

  getActive(): ActiveGravityPulse[] {
    return this.pulses;
  }
}

// Singleton instance
export const gravityPulseManager = new GravityPulseManager();

export default createGravityPulseSprite;
