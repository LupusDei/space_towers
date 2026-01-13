// Plasma Cannon Sprite - Heavy cannon with purple/pink glow

import type { Tower, Point } from '../types';
import type { TowerSprite, SpriteRenderContext } from './types';

export const PlasmaCannonSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Heavy industrial base platform
    ctx.fillStyle = '#2a2030';
    ctx.beginPath();
    ctx.rect(
      centerX - cellSize * 0.4,
      centerY + cellSize * 0.1,
      cellSize * 0.8,
      cellSize * 0.25
    );
    ctx.fill();
    ctx.strokeStyle = '#4a3050';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Side supports (chunky industrial)
    ctx.fillStyle = '#3a2840';
    ctx.fillRect(centerX - cellSize * 0.35, centerY - cellSize * 0.1, cellSize * 0.12, cellSize * 0.25);
    ctx.fillRect(centerX + cellSize * 0.23, centerY - cellSize * 0.1, cellSize * 0.12, cellSize * 0.25);

    // Main cannon housing
    ctx.fillStyle = '#4a3858';
    ctx.beginPath();
    ctx.rect(
      centerX - cellSize * 0.25,
      centerY - cellSize * 0.25,
      cellSize * 0.5,
      cellSize * 0.4
    );
    ctx.fill();
    ctx.strokeStyle = '#6a4878';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Heavy barrel
    const barrelLength = cellSize * 0.35;
    const barrelWidth = cellSize * 0.18;
    ctx.fillStyle = '#5a4068';
    ctx.fillRect(
      centerX - barrelWidth / 2,
      centerY - cellSize * 0.25 - barrelLength,
      barrelWidth,
      barrelLength
    );
    ctx.strokeStyle = '#7a5888';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - barrelWidth / 2,
      centerY - cellSize * 0.25 - barrelLength,
      barrelWidth,
      barrelLength
    );

    // Barrel rings (industrial detail)
    ctx.strokeStyle = '#8a6898';
    ctx.lineWidth = 3;
    const ringY1 = centerY - cellSize * 0.3;
    const ringY2 = centerY - cellSize * 0.45;
    ctx.beginPath();
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY1);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY1);
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY2);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY2);
    ctx.stroke();

    // Plasma core glow (pulsing)
    const glowIntensity = 0.4 + 0.2 * Math.sin(time * 3);
    const coreY = centerY - cellSize * 0.05;
    const gradient = ctx.createRadialGradient(
      centerX, coreY, 0,
      centerX, coreY, cellSize * 0.3
    );
    gradient.addColorStop(0, `rgba(255, 100, 255, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(200, 50, 200, ${glowIntensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(150, 0, 150, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, coreY, cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Plasma core (bright center)
    ctx.fillStyle = '#ff66ff';
    ctx.beginPath();
    ctx.arc(centerX, coreY, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Barrel tip glow
    const tipY = centerY - cellSize * 0.25 - barrelLength;
    const tipGlow = ctx.createRadialGradient(
      centerX, tipY, 0,
      centerX, tipY, cellSize * 0.15
    );
    tipGlow.addColorStop(0, `rgba(255, 150, 255, ${glowIntensity * 0.6})`);
    tipGlow.addColorStop(1, 'rgba(200, 50, 200, 0)');
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(centerX, tipY, cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // Draw base tower first
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const barrelLength = cellSize * 0.35;
    const muzzleY = centerY - cellSize * 0.25 - barrelLength;

    // Muzzle flash - large plasma burst
    const flashSize = cellSize * 0.4;
    const flashIntensity = 0.8 + 0.2 * Math.sin(time * 30);

    // Outer flash glow
    const outerFlash = ctx.createRadialGradient(
      centerX, muzzleY, 0,
      centerX, muzzleY, flashSize * 1.5
    );
    outerFlash.addColorStop(0, `rgba(255, 150, 255, ${flashIntensity * 0.6})`);
    outerFlash.addColorStop(0.4, `rgba(200, 50, 200, ${flashIntensity * 0.3})`);
    outerFlash.addColorStop(1, 'rgba(150, 0, 150, 0)');
    ctx.fillStyle = outerFlash;
    ctx.beginPath();
    ctx.arc(centerX, muzzleY, flashSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core flash (bright white-pink)
    const coreFlash = ctx.createRadialGradient(
      centerX, muzzleY, 0,
      centerX, muzzleY, flashSize * 0.5
    );
    coreFlash.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
    coreFlash.addColorStop(0.3, `rgba(255, 200, 255, ${flashIntensity * 0.8})`);
    coreFlash.addColorStop(1, 'rgba(255, 100, 255, 0)');
    ctx.fillStyle = coreFlash;
    ctx.beginPath();
    ctx.arc(centerX, muzzleY, flashSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Energy tendrils from muzzle
    ctx.strokeStyle = `rgba(255, 150, 255, ${flashIntensity * 0.7})`;
    ctx.lineWidth = 2;
    const tendrilCount = 6;
    for (let i = 0; i < tendrilCount; i++) {
      const angle = (i / tendrilCount) * Math.PI * 2 + time * 5;
      const length = flashSize * (0.8 + 0.3 * Math.sin(time * 20 + i));
      ctx.beginPath();
      ctx.moveTo(centerX, muzzleY);
      ctx.lineTo(
        centerX + Math.cos(angle) * length,
        muzzleY + Math.sin(angle) * length
      );
      ctx.stroke();
    }

    // Draw projectile trail toward target
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Plasma trail
    ctx.strokeStyle = 'rgba(255, 100, 255, 0.4)';
    ctx.lineWidth = cellSize * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, muzzleY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 200, 255, 0.6)';
    ctx.lineWidth = cellSize * 0.05;
    ctx.beginPath();
    ctx.moveTo(centerX, muzzleY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Impact glow at target
    const impactGradient = ctx.createRadialGradient(
      targetX, targetY, 0,
      targetX, targetY, cellSize * 0.25
    );
    impactGradient.addColorStop(0, 'rgba(255, 200, 255, 0.8)');
    impactGradient.addColorStop(0.5, 'rgba(200, 100, 200, 0.4)');
    impactGradient.addColorStop(1, 'rgba(150, 50, 150, 0)');
    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(targetX, targetY, cellSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRange(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range * cellSize;

    // Range circle fill (purple tint)
    ctx.fillStyle = 'rgba(200, 100, 200, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = 'rgba(200, 100, 200, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

export default PlasmaCannonSprite;
