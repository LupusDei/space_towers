// Slow Indicator - Visual effect for slowed enemies

import type { Enemy } from '../../game/types';

export interface SlowIndicatorConfig {
  radius: number;
  offsetY?: number;
}

// Ice crystal colors
const ICE_GLOW = '#00aaff';

// Animation constants
const CRYSTAL_COUNT = 4;
const ROTATION_SPEED = 2; // radians per second
const PULSE_SPEED = 4; // pulses per second

/**
 * Check if an enemy is currently slowed
 */
export function isSlowed(enemy: Enemy, currentTime: number): boolean {
  return currentTime < enemy.slowEndTime;
}

/**
 * Draw slow indicator effect around an enemy
 * Shows a blue glow and orbiting ice crystals when enemy is slowed
 */
export function drawSlowIndicator(
  ctx: CanvasRenderingContext2D,
  enemy: Enemy,
  centerX: number,
  centerY: number,
  currentTime: number,
  config: SlowIndicatorConfig
): void {
  // Only draw if enemy is slowed
  if (!isSlowed(enemy, currentTime)) {
    return;
  }

  const { radius, offsetY = 0 } = config;
  const adjustedY = centerY + offsetY;

  // Calculate slow intensity (fade out as slow ends)
  const timeRemaining = enemy.slowEndTime - currentTime;
  const fadeThreshold = 0.5; // Start fading in last 0.5 seconds
  const intensity = timeRemaining < fadeThreshold
    ? timeRemaining / fadeThreshold
    : 1;

  ctx.save();

  // Draw blue glow aura
  drawGlowAura(ctx, centerX, adjustedY, radius, currentTime, intensity);

  // Draw orbiting ice crystals
  drawIceCrystals(ctx, centerX, adjustedY, radius, currentTime, intensity);

  ctx.restore();
}

/**
 * Draw the blue glow aura around the enemy
 */
function drawGlowAura(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  intensity: number
): void {
  // Pulsing glow effect
  const pulse = 0.6 + Math.sin(time * PULSE_SPEED) * 0.2;
  const glowAlpha = pulse * intensity * 0.4;

  // Outer glow ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(136, 204, 255, ${glowAlpha})`;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Inner glow ring
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.9, 0, Math.PI * 2);
  ctx.strokeStyle = `rgba(0, 170, 255, ${glowAlpha * 0.7})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Radial gradient fill for subtle tint
  const gradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius
  );
  gradient.addColorStop(0, `rgba(136, 204, 255, ${0.15 * intensity})`);
  gradient.addColorStop(0.7, `rgba(0, 170, 255, ${0.08 * intensity})`);
  gradient.addColorStop(1, 'rgba(0, 170, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * Draw orbiting ice crystals around the enemy
 */
function drawIceCrystals(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number,
  intensity: number
): void {
  const crystalSize = Math.max(3, radius * 0.12);
  const orbitRadius = radius * 0.85;
  const rotation = time * ROTATION_SPEED;

  // Set up crystal glow
  ctx.shadowBlur = 4;
  ctx.shadowColor = ICE_GLOW;

  for (let i = 0; i < CRYSTAL_COUNT; i++) {
    const angle = rotation + (i * Math.PI * 2) / CRYSTAL_COUNT;
    const crystalX = centerX + Math.cos(angle) * orbitRadius;
    const crystalY = centerY + Math.sin(angle) * orbitRadius;

    // Individual crystal pulse offset
    const crystalPulse = 0.7 + Math.sin(time * PULSE_SPEED + i) * 0.3;
    const alpha = intensity * crystalPulse;

    drawIceCrystal(ctx, crystalX, crystalY, crystalSize, angle, alpha);
  }

  ctx.shadowBlur = 0;
}

/**
 * Draw a single ice crystal (diamond shape)
 */
function drawIceCrystal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  alpha: number
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  // Diamond shape
  ctx.beginPath();
  ctx.moveTo(0, -size);      // Top
  ctx.lineTo(size * 0.6, 0); // Right
  ctx.lineTo(0, size);       // Bottom
  ctx.lineTo(-size * 0.6, 0); // Left
  ctx.closePath();

  // Fill with gradient
  const gradient = ctx.createLinearGradient(0, -size, 0, size);
  gradient.addColorStop(0, `rgba(204, 255, 255, ${alpha})`);
  gradient.addColorStop(0.5, `rgba(136, 204, 255, ${alpha * 0.8})`);
  gradient.addColorStop(1, `rgba(0, 170, 255, ${alpha * 0.6})`);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Outline
  ctx.strokeStyle = `rgba(204, 255, 255, ${alpha})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}
