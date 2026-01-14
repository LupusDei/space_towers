// Laser Turret Sprite - Cyan rotating turret with beam effect

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const LaserTurretSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // Center of the cell
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Base platform (darker cyan)
    ctx.fillStyle = '#006666';
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Rotating turret (cyan)
    const rotationSpeed = 0.5; // radians per second
    const angle = time * rotationSpeed;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Turret barrel
    ctx.fillStyle = '#00FFFF';
    ctx.fillRect(-cellSize * 0.05, -cellSize * 0.3, cellSize * 0.1, cellSize * 0.25);

    // Turret body
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Center glow
    ctx.fillStyle = '#AAFFFF';
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // Tower center
    const startX = x * cellSize + cellSize / 2;
    const startY = y * cellSize + cellSize / 2;

    // Target position (convert grid to pixel coordinates)
    const endX = target.x * cellSize + cellSize / 2;
    const endY = target.y * cellSize + cellSize / 2;

    // Draw the laser beam with glow effect
    // Outer glow
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.3)';
    ctx.lineWidth = cellSize * 0.15;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Middle glow
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.6)';
    ctx.lineWidth = cellSize * 0.08;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Core beam (bright cyan with flicker)
    const flicker = 0.8 + Math.sin(time * 20) * 0.2;
    ctx.strokeStyle = `rgba(170, 255, 255, ${flicker})`;
    ctx.lineWidth = cellSize * 0.03;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Impact flash at target
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(endX, endY, cellSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRange(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    // Center of the cell
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Range in pixels
    const rangePixels = tower.range * cellSize;

    // Range circle fill
    ctx.fillStyle = 'rgba(0, 255, 255, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};
