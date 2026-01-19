// Slow Indicator - Visual effect for slowed enemies

import type { Enemy } from '../../game/types';

// Slow indicator colors - cyan/ice theme to match gravity tower
const SLOW_COLOR_OUTER = 'rgba(0, 200, 255, 0.3)';
const SLOW_COLOR_INNER = 'rgba(100, 220, 255, 0.5)';
const SLOW_COLOR_GLOW = '#00ccff';

// Animation constants
const PULSE_SPEED = 4; // pulses per second
const PULSE_AMPLITUDE = 0.15; // intensity variation

/**
 * Check if an enemy is currently slowed
 */
export function isEnemySlowed(enemy: Enemy, currentTime: number): boolean {
  return currentTime < enemy.slowEndTime;
}

/**
 * Draw a slow indicator effect around a slowed enemy
 * Call this from enemy sprite draw methods after drawing the main sprite
 */
export function drawSlowIndicator(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  centerX: number,
  centerY: number,
  radius: number,
  currentTime: number
): void {
  // Only draw if enemy is currently slowed
  if (!isEnemySlowed(enemy, currentTime)) {
    return;
  }

  // Calculate remaining slow duration for fade-out effect
  const remainingDuration = enemy.slowEndTime - currentTime;
  const fadeAlpha = Math.min(1, remainingDuration / 0.3); // Fade out in last 0.3 seconds

  // Pulsing animation
  const pulse = Math.sin(currentTime * PULSE_SPEED) * PULSE_AMPLITUDE;
  const pulseRadius = radius * (1.2 + pulse);

  ctx.save();

  // Apply fade alpha
  ctx.globalAlpha = fadeAlpha;

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius * 1.3, 0, Math.PI * 2);
  ctx.strokeStyle = SLOW_COLOR_OUTER;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner glow ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius * 1.1, 0, Math.PI * 2);
  ctx.strokeStyle = SLOW_COLOR_INNER;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Add glow effect
  ctx.shadowBlur = 8;
  ctx.shadowColor = SLOW_COLOR_GLOW;

  // Core indicator circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
  ctx.strokeStyle = SLOW_COLOR_GLOW;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Reset shadow
  ctx.shadowBlur = 0;

  ctx.restore();
}
