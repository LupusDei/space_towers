// Plasma Ball Sprite - Glowing purple orb with trail effect

import type { Projectile } from '../../game/types';
import type { ProjectileSprite, SpriteRenderContext } from '../types';

export const PlasmaballSprite: ProjectileSprite = {
  draw(context: SpriteRenderContext, projectile: Projectile): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = projectile.position;
    const { velocity } = projectile;

    // Convert grid position to pixel coordinates
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Calculate trail direction (opposite of velocity)
    const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
    const trailDirX = speed > 0 ? -velocity.x / speed : 0;
    const trailDirY = speed > 0 ? -velocity.y / speed : 0;

    // Trail effect - multiple fading circles behind the projectile
    const trailCount = 5;
    const trailSpacing = cellSize * 0.08;

    for (let i = trailCount; i >= 1; i--) {
      const trailX = centerX + trailDirX * trailSpacing * i * cellSize;
      const trailY = centerY + trailDirY * trailSpacing * i * cellSize;
      const alpha = 0.3 * (1 - i / (trailCount + 1));
      const trailSize = cellSize * 0.08 * (1 - i / (trailCount + 2));

      ctx.fillStyle = `rgba(180, 100, 255, ${alpha})`;
      ctx.beginPath();
      ctx.arc(trailX, trailY, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer glow (pulsing)
    const pulse = 0.8 + Math.sin(time * 10) * 0.2;
    const glowSize = cellSize * 0.18 * pulse;

    ctx.fillStyle = 'rgba(150, 50, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Middle glow
    ctx.fillStyle = 'rgba(180, 100, 255, 0.6)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Core orb (bright purple)
    ctx.fillStyle = '#CC66FF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Bright center highlight
    ctx.fillStyle = '#EECCFF';
    ctx.beginPath();
    ctx.arc(
      centerX - cellSize * 0.015,
      centerY - cellSize * 0.015,
      cellSize * 0.025,
      0,
      Math.PI * 2
    );
    ctx.fill();
  },
};
