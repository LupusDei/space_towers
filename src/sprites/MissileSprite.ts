// Missile Sprite - Rocket projectile with exhaust trail and explosion effect

import type { Projectile, Point } from '../types';
import type { ProjectileSprite, EffectSprite, SpriteRenderContext } from './types';

export const MissileSprite: ProjectileSprite = {
  draw(context: SpriteRenderContext, projectile: Projectile): void {
    const { ctx, time } = context;
    const { position, velocity } = projectile;

    // Calculate angle from velocity
    const angle = Math.atan2(velocity.y, velocity.x);

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    // Exhaust trail (drawn first, behind missile)
    drawExhaustTrail(ctx, time);

    // Missile body
    drawMissileBody(ctx);

    ctx.restore();
  },
};

function drawMissileBody(ctx: CanvasRenderingContext2D): void {
  const bodyLength = 16;
  const bodyWidth = 5;
  const noseLength = 6;
  const finSize = 6;

  // Main body (dark gray metallic)
  ctx.fillStyle = '#4a4a5a';
  ctx.fillRect(-bodyLength / 2, -bodyWidth / 2, bodyLength, bodyWidth);

  // Body highlight stripe
  ctx.fillStyle = '#6a6a7a';
  ctx.fillRect(-bodyLength / 2, -bodyWidth / 4, bodyLength, bodyWidth / 2);

  // Nose cone (red tip)
  ctx.fillStyle = '#cc3333';
  ctx.beginPath();
  ctx.moveTo(bodyLength / 2, -bodyWidth / 2);
  ctx.lineTo(bodyLength / 2 + noseLength, 0);
  ctx.lineTo(bodyLength / 2, bodyWidth / 2);
  ctx.closePath();
  ctx.fill();

  // Nose highlight
  ctx.fillStyle = '#ff5555';
  ctx.beginPath();
  ctx.moveTo(bodyLength / 2, -bodyWidth / 4);
  ctx.lineTo(bodyLength / 2 + noseLength * 0.7, 0);
  ctx.lineTo(bodyLength / 2, bodyWidth / 4);
  ctx.closePath();
  ctx.fill();

  // Fins (back of missile)
  ctx.fillStyle = '#3a3a4a';

  // Top fin
  ctx.beginPath();
  ctx.moveTo(-bodyLength / 2, -bodyWidth / 2);
  ctx.lineTo(-bodyLength / 2 - finSize * 0.5, -bodyWidth / 2 - finSize);
  ctx.lineTo(-bodyLength / 2 + finSize * 0.5, -bodyWidth / 2);
  ctx.closePath();
  ctx.fill();

  // Bottom fin
  ctx.beginPath();
  ctx.moveTo(-bodyLength / 2, bodyWidth / 2);
  ctx.lineTo(-bodyLength / 2 - finSize * 0.5, bodyWidth / 2 + finSize);
  ctx.lineTo(-bodyLength / 2 + finSize * 0.5, bodyWidth / 2);
  ctx.closePath();
  ctx.fill();

  // Engine nozzle
  ctx.fillStyle = '#2a2a3a';
  ctx.fillRect(-bodyLength / 2 - 2, -bodyWidth / 3, 2, bodyWidth * 0.66);
}

function drawExhaustTrail(ctx: CanvasRenderingContext2D, time: number): void {
  const trailLength = 25;
  const baseWidth = 4;

  // Outer flame (orange/yellow)
  const flicker1 = 0.8 + Math.sin(time * 30) * 0.2;
  const gradient1 = ctx.createLinearGradient(-10, 0, -10 - trailLength, 0);
  gradient1.addColorStop(0, `rgba(255, 150, 50, ${flicker1})`);
  gradient1.addColorStop(0.4, `rgba(255, 100, 30, ${flicker1 * 0.6})`);
  gradient1.addColorStop(1, 'rgba(255, 80, 20, 0)');

  ctx.fillStyle = gradient1;
  ctx.beginPath();
  ctx.moveTo(-10, -baseWidth);
  ctx.quadraticCurveTo(-10 - trailLength * 0.5, -baseWidth * 0.5, -10 - trailLength, 0);
  ctx.quadraticCurveTo(-10 - trailLength * 0.5, baseWidth * 0.5, -10, baseWidth);
  ctx.closePath();
  ctx.fill();

  // Inner flame (bright yellow/white core)
  const flicker2 = 0.9 + Math.sin(time * 40 + 1) * 0.1;
  const gradient2 = ctx.createLinearGradient(-10, 0, -10 - trailLength * 0.6, 0);
  gradient2.addColorStop(0, `rgba(255, 255, 200, ${flicker2})`);
  gradient2.addColorStop(0.5, `rgba(255, 220, 100, ${flicker2 * 0.5})`);
  gradient2.addColorStop(1, 'rgba(255, 180, 50, 0)');

  ctx.fillStyle = gradient2;
  ctx.beginPath();
  ctx.moveTo(-10, -baseWidth * 0.5);
  ctx.quadraticCurveTo(-10 - trailLength * 0.3, -baseWidth * 0.25, -10 - trailLength * 0.6, 0);
  ctx.quadraticCurveTo(-10 - trailLength * 0.3, baseWidth * 0.25, -10, baseWidth * 0.5);
  ctx.closePath();
  ctx.fill();

  // Smoke particles (trailing behind)
  const smokeCount = 5;
  for (let i = 0; i < smokeCount; i++) {
    const offset = (time * 0.05 + i * 0.7) % 1;
    const smokeX = -10 - trailLength - offset * 15;
    const smokeY = Math.sin(time * 0.02 + i * 2) * 3;
    const smokeAlpha = 0.3 * (1 - offset);
    const smokeSize = 2 + offset * 3;

    ctx.fillStyle = `rgba(100, 100, 110, ${smokeAlpha})`;
    ctx.beginPath();
    ctx.arc(smokeX, smokeY, smokeSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

export const MissileExplosionSprite: EffectSprite = {
  draw(context: SpriteRenderContext, position: Point, progress: number): void {
    const { ctx } = context;
    const { x, y } = position;

    // Progress goes from 0 to 1
    // Early phase: rapid expansion with bright core
    // Late phase: fading rings and debris

    const maxRadius = 30;
    const radius = maxRadius * easeOutQuad(progress);
    const alpha = 1 - easeInQuad(progress);

    // Outer shockwave ring
    if (progress < 0.7) {
      const ringRadius = radius * 1.3;
      const ringAlpha = alpha * 0.5;
      ctx.strokeStyle = `rgba(255, 200, 100, ${ringAlpha})`;
      ctx.lineWidth = 3 - progress * 2;
      ctx.beginPath();
      ctx.arc(x, y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Main explosion (orange/red gradient)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);

    if (progress < 0.3) {
      // Early phase: bright white/yellow core
      gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      gradient.addColorStop(0.2, `rgba(255, 255, 150, ${alpha * 0.9})`);
      gradient.addColorStop(0.5, `rgba(255, 150, 50, ${alpha * 0.7})`);
      gradient.addColorStop(1, `rgba(255, 80, 20, 0)`);
    } else {
      // Late phase: fading orange/red
      gradient.addColorStop(0, `rgba(255, 200, 100, ${alpha * 0.6})`);
      gradient.addColorStop(0.4, `rgba(255, 100, 50, ${alpha * 0.4})`);
      gradient.addColorStop(1, `rgba(200, 50, 20, 0)`);
    }

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Debris particles
    if (progress > 0.1 && progress < 0.8) {
      drawDebris(ctx, x, y, radius, progress);
    }

    // Smoke cloud (appears in later phase)
    if (progress > 0.4) {
      const smokeAlpha = (progress - 0.4) * 0.5 * (1 - progress);
      const smokeRadius = radius * 0.8;
      const smokeGradient = ctx.createRadialGradient(x, y, 0, x, y, smokeRadius);
      smokeGradient.addColorStop(0, `rgba(80, 80, 90, ${smokeAlpha})`);
      smokeGradient.addColorStop(1, `rgba(60, 60, 70, 0)`);
      ctx.fillStyle = smokeGradient;
      ctx.beginPath();
      ctx.arc(x, y, smokeRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};

function drawDebris(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  progress: number
): void {
  const debrisCount = 8;

  for (let i = 0; i < debrisCount; i++) {
    const angle = (i / debrisCount) * Math.PI * 2 + progress * 0.5;
    const distance = radius * (0.5 + progress * 0.8);
    const debrisX = centerX + Math.cos(angle) * distance;
    const debrisY = centerY + Math.sin(angle) * distance;
    const debrisAlpha = (1 - progress) * 0.8;
    const debrisSize = 2 + (1 - progress) * 2;

    // Orange/yellow debris particles
    ctx.fillStyle = `rgba(255, ${150 + i * 10}, 50, ${debrisAlpha})`;
    ctx.beginPath();
    ctx.arc(debrisX, debrisY, debrisSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}

export default MissileSprite;
