// Gravity Pulse Effect Sprite - Expanding ring effect when Gravity tower fires
// Shows a gravitational distortion wave emanating from the tower
// Supports level-based visual scaling (levels 1-5)

import type { Point } from '../../game/types';
import type { EffectSprite, SpriteRenderContext } from '../types';

// Gravity pulse colors (purple/violet theme for gravitational effect)
const PULSE_COLORS = {
  core: '#9060ff',
  glow: '144, 96, 255',
  ring: '#b080ff',
};

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    radiusMultiplier: 1.0 + (clampedLevel - 1) * 0.15, // larger pulse at higher levels
    ringCount: clampedLevel >= 3 ? 2 : 1, // extra ring at level 3+
    glowIntensity: 0.4 + (clampedLevel - 1) * 0.1, // brighter glow
    hasDistortion: clampedLevel >= 2, // distortion waves at level 2+
    hasParticles: clampedLevel >= 4, // particle trail at level 4+
    hasQuantumRipple: clampedLevel >= 5, // quantum ripple effect at level 5
    ringWidth: 6 + (clampedLevel - 1) * 1, // thicker rings
  };
}

/**
 * Creates a gravity pulse effect sprite.
 * Duration is controlled by the caller via progress (0-1).
 * Designed for ~400ms duration.
 * @param level - Tower level (1-5) for visual scaling
 */
export function createGravityPulseSprite(level: number = 1): EffectSprite {
  const params = getLevelParams(level);

  return {
    draw(context: SpriteRenderContext, position: Point, progress: number): void {
      const { ctx, cellSize, time } = context;
      const centerX = position.x * cellSize + cellSize / 2;
      const centerY = position.y * cellSize + cellSize / 2;

      // Easing for smooth expansion
      const easeOut = 1 - Math.pow(1 - progress, 2);
      const fadeOut = 1 - progress;

      // Max radius scales with level
      const maxRadius = cellSize * 2.5 * params.radiusMultiplier;
      const ringRadius = easeOut * maxRadius;

      // === DISTORTION WAVES (Level 2+) ===
      if (params.hasDistortion && progress < 0.7) {
        const distortionCount = 3;
        for (let i = 0; i < distortionCount; i++) {
          const wavePhase = (progress * 2 + i / distortionCount) % 1;
          const waveRadius = ringRadius * (0.6 + wavePhase * 0.4);
          const waveAlpha = (1 - wavePhase) * 0.15 * params.glowIntensity;

          ctx.strokeStyle = `rgba(100, 60, 160, ${waveAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // === OUTER GLOW (fades quickly) ===
      if (progress < 0.6) {
        const glowAlpha = (0.6 - progress) * params.glowIntensity;
        const glowRadius = ringRadius * 1.3;
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          ringRadius * 0.8,
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

      // === PRIMARY EXPANDING RING ===
      const ringWidth = Math.max(2, (1 - progress) * params.ringWidth);
      ctx.strokeStyle = PULSE_COLORS.ring;
      ctx.globalAlpha = fadeOut * 0.8;
      ctx.lineWidth = ringWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // === SECONDARY INNER RING (Level 3+ has extra ring) ===
      if (progress > 0.1 && progress < 0.9) {
        const innerProgress = (progress - 0.1) / 0.8;
        const innerRadius = innerProgress * maxRadius * 0.7;
        const innerAlpha = (1 - innerProgress) * 0.5;
        const innerWidth = Math.max(1, (1 - innerProgress) * 3);

        ctx.strokeStyle = PULSE_COLORS.core;
        ctx.globalAlpha = innerAlpha;
        ctx.lineWidth = innerWidth;
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.stroke();

        // Third ring for level 3+
        if (params.ringCount >= 2 && progress > 0.2 && progress < 0.85) {
          const thirdProgress = (progress - 0.2) / 0.65;
          const thirdRadius = thirdProgress * maxRadius * 0.5;
          const thirdAlpha = (1 - thirdProgress) * 0.3;

          ctx.strokeStyle = `rgba(180, 140, 255, ${thirdAlpha})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, thirdRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // === PARTICLE TRAIL (Level 4+) ===
      if (params.hasParticles && progress > 0.05 && progress < 0.8) {
        const particleCount = 8;
        const particleProgress = (progress - 0.05) / 0.75;
        for (let i = 0; i < particleCount; i++) {
          const angle = (i / particleCount) * Math.PI * 2 + time * 0.002;
          const particleRadius = ringRadius * 0.95;
          const particleX = centerX + Math.cos(angle) * particleRadius;
          const particleY = centerY + Math.sin(angle) * particleRadius;
          const particleAlpha = (1 - particleProgress) * 0.7;
          const particleSize = 2 + (1 - particleProgress) * 2;

          ctx.fillStyle = `rgba(200, 160, 255, ${particleAlpha})`;
          ctx.globalAlpha = 1;
          ctx.beginPath();
          ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // === QUANTUM RIPPLE (Level 5) ===
      if (params.hasQuantumRipple && progress > 0.1 && progress < 0.7) {
        const rippleProgress = (progress - 0.1) / 0.6;
        const rippleCount = 5;
        for (let i = 0; i < rippleCount; i++) {
          const angle = (i / rippleCount) * Math.PI * 2 + progress * Math.PI;
          const rippleRadius = ringRadius * (0.3 + rippleProgress * 0.6);
          const offsetX = Math.cos(angle) * rippleRadius * 0.3;
          const offsetY = Math.sin(angle) * rippleRadius * 0.3;
          const rippleAlpha = (1 - rippleProgress) * 0.4;

          ctx.strokeStyle = `rgba(220, 200, 255, ${rippleAlpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(centerX + offsetX, centerY + offsetY, rippleRadius * 0.2, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // === CENTER FLASH (brief, at start) ===
      if (progress < 0.2) {
        const flashAlpha = (0.2 - progress) * 3 * params.glowIntensity;
        const flashRadius = cellSize * 0.4 * params.radiusMultiplier;
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
  level: number;
  sprite: EffectSprite;
}

class GravityPulseManager {
  private pulses: ActiveGravityPulse[] = [];
  private nextId = 0;

  /**
   * Spawn a gravity pulse at a tower position.
   * @param position - Tower position in pixels (center of tower)
   * @param time - Current game time in ms
   * @param level - Tower level (1-5) for visual scaling
   */
  spawn(position: Point, time: number, level: number = 1): void {
    this.pulses.push({
      id: this.nextId++,
      position: { x: position.x, y: position.y },
      startTime: time,
      level,
      sprite: createGravityPulseSprite(level),
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

      // Convert pixel position to grid position for sprite
      const gridPos: Point = {
        x: pulse.position.x / context.cellSize,
        y: pulse.position.y / context.cellSize,
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
