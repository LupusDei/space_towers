// Gatling Projectile Sprite - Small bullet tracer with yellow/orange trail

import type { Projectile, Point } from '../../game/types';
import type { ProjectileSprite, EffectSprite, SpriteRenderContext } from '../types';

export const GatlingProjectileSprite: ProjectileSprite = {
  draw(context: SpriteRenderContext, projectile: Projectile): void {
    const { ctx, time } = context;
    const { position, velocity } = projectile;

    // Calculate angle from velocity
    const angle = Math.atan2(velocity.y, velocity.x);

    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.rotate(angle);

    // Draw tracer trail (drawn first, behind bullet)
    drawTracerTrail(ctx, time);

    // Draw bullet core
    drawBullet(ctx);

    ctx.restore();
  },
};

function drawBullet(ctx: CanvasRenderingContext2D): void {
  const bulletLength = 6;
  const bulletWidth = 2;

  // Bullet body (bright yellow core)
  const gradient = ctx.createLinearGradient(-bulletLength / 2, 0, bulletLength / 2, 0);
  gradient.addColorStop(0, '#ffaa00');
  gradient.addColorStop(0.5, '#ffdd44');
  gradient.addColorStop(1, '#ffffff');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.ellipse(0, 0, bulletLength / 2, bulletWidth / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bright tip glow
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.beginPath();
  ctx.arc(bulletLength / 3, 0, bulletWidth / 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawTracerTrail(ctx: CanvasRenderingContext2D, time: number): void {
  const trailLength = 18;
  const baseWidth = 1.5;

  // Slight flicker effect for dynamic look
  const flicker = 0.85 + Math.sin(time * 50) * 0.15;

  // Outer tracer glow (orange)
  const gradient1 = ctx.createLinearGradient(0, 0, -trailLength, 0);
  gradient1.addColorStop(0, `rgba(255, 180, 50, ${flicker})`);
  gradient1.addColorStop(0.3, `rgba(255, 140, 30, ${flicker * 0.6})`);
  gradient1.addColorStop(1, 'rgba(255, 100, 20, 0)');

  ctx.fillStyle = gradient1;
  ctx.beginPath();
  ctx.moveTo(0, -baseWidth);
  ctx.lineTo(-trailLength, 0);
  ctx.lineTo(0, baseWidth);
  ctx.closePath();
  ctx.fill();

  // Inner tracer core (bright yellow)
  const gradient2 = ctx.createLinearGradient(0, 0, -trailLength * 0.6, 0);
  gradient2.addColorStop(0, `rgba(255, 255, 150, ${flicker})`);
  gradient2.addColorStop(0.5, `rgba(255, 220, 80, ${flicker * 0.5})`);
  gradient2.addColorStop(1, 'rgba(255, 200, 50, 0)');

  ctx.fillStyle = gradient2;
  ctx.beginPath();
  ctx.moveTo(0, -baseWidth * 0.5);
  ctx.lineTo(-trailLength * 0.6, 0);
  ctx.lineTo(0, baseWidth * 0.5);
  ctx.closePath();
  ctx.fill();
}

export const GatlingImpactSprite: EffectSprite = {
  draw(context: SpriteRenderContext, position: Point, progress: number): void {
    const { ctx } = context;
    const { x, y } = position;

    // Quick, small spark effect
    const maxRadius = 8;
    const radius = maxRadius * easeOutQuad(progress);
    const alpha = 1 - easeInQuad(progress);

    // Spark burst
    const sparkCount = 4;
    for (let i = 0; i < sparkCount; i++) {
      const angle = (i / sparkCount) * Math.PI * 2 + progress * 2;
      const sparkDistance = radius * 0.8;
      const sparkX = x + Math.cos(angle) * sparkDistance;
      const sparkY = y + Math.sin(angle) * sparkDistance;
      const sparkSize = 1.5 * (1 - progress);

      ctx.fillStyle = `rgba(255, 220, 100, ${alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central flash
    const flashGradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 0.6);
    flashGradient.addColorStop(0, `rgba(255, 255, 200, ${alpha * 0.7})`);
    flashGradient.addColorStop(0.5, `rgba(255, 180, 50, ${alpha * 0.4})`);
    flashGradient.addColorStop(1, 'rgba(255, 150, 30, 0)');

    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
  },
};

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

function easeInQuad(t: number): number {
  return t * t;
}

export default GatlingProjectileSprite;
