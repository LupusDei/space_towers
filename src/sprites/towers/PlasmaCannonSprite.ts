// Plasma Cannon Sprite - Heavy cannon with purple/pink glow

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const PlasmaCannonSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Heavy industrial base platform with metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - cellSize * 0.4,
      centerY + cellSize * 0.1,
      centerX - cellSize * 0.4,
      centerY + cellSize * 0.35
    );
    baseGradient.addColorStop(0, '#3d2d45');
    baseGradient.addColorStop(0.3, '#2a2030');
    baseGradient.addColorStop(0.7, '#1a1520');
    baseGradient.addColorStop(1, '#2a2030');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.rect(centerX - cellSize * 0.4, centerY + cellSize * 0.1, cellSize * 0.8, cellSize * 0.25);
    ctx.fill();
    ctx.strokeStyle = '#5a4068';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Base platform highlight edge
    ctx.strokeStyle = 'rgba(150, 120, 170, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - cellSize * 0.4, centerY + cellSize * 0.1);
    ctx.lineTo(centerX + cellSize * 0.4, centerY + cellSize * 0.1);
    ctx.stroke();

    // Side supports with metallic sheen
    const supportGradient = ctx.createLinearGradient(
      centerX - cellSize * 0.35,
      0,
      centerX - cellSize * 0.23,
      0
    );
    supportGradient.addColorStop(0, '#4a3858');
    supportGradient.addColorStop(0.4, '#5a4868');
    supportGradient.addColorStop(0.6, '#4a3858');
    supportGradient.addColorStop(1, '#3a2840');
    ctx.fillStyle = supportGradient;
    ctx.fillRect(
      centerX - cellSize * 0.35,
      centerY - cellSize * 0.1,
      cellSize * 0.12,
      cellSize * 0.25
    );

    const supportGradient2 = ctx.createLinearGradient(
      centerX + cellSize * 0.23,
      0,
      centerX + cellSize * 0.35,
      0
    );
    supportGradient2.addColorStop(0, '#3a2840');
    supportGradient2.addColorStop(0.4, '#5a4868');
    supportGradient2.addColorStop(0.6, '#4a3858');
    supportGradient2.addColorStop(1, '#4a3858');
    ctx.fillStyle = supportGradient2;
    ctx.fillRect(
      centerX + cellSize * 0.23,
      centerY - cellSize * 0.1,
      cellSize * 0.12,
      cellSize * 0.25
    );

    // Main cannon housing with metallic gradient
    const housingGradient = ctx.createLinearGradient(
      centerX - cellSize * 0.25,
      0,
      centerX + cellSize * 0.25,
      0
    );
    housingGradient.addColorStop(0, '#3a2848');
    housingGradient.addColorStop(0.2, '#5a4878');
    housingGradient.addColorStop(0.5, '#6a5888');
    housingGradient.addColorStop(0.8, '#5a4878');
    housingGradient.addColorStop(1, '#3a2848');
    ctx.fillStyle = housingGradient;
    ctx.beginPath();
    ctx.rect(centerX - cellSize * 0.25, centerY - cellSize * 0.25, cellSize * 0.5, cellSize * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#7a5898';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Housing panel lines (texture detail)
    ctx.strokeStyle = 'rgba(90, 60, 100, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - cellSize * 0.1, centerY - cellSize * 0.25);
    ctx.lineTo(centerX - cellSize * 0.1, centerY + cellSize * 0.15);
    ctx.moveTo(centerX + cellSize * 0.1, centerY - cellSize * 0.25);
    ctx.lineTo(centerX + cellSize * 0.1, centerY + cellSize * 0.15);
    ctx.stroke();

    // Housing highlight
    ctx.strokeStyle = 'rgba(180, 150, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - cellSize * 0.25, centerY - cellSize * 0.25);
    ctx.lineTo(centerX + cellSize * 0.25, centerY - cellSize * 0.25);
    ctx.stroke();

    // Heavy barrel with metallic gradient
    const barrelLength = cellSize * 0.35;
    const barrelWidth = cellSize * 0.18;
    const barrelGradient = ctx.createLinearGradient(
      centerX - barrelWidth / 2,
      0,
      centerX + barrelWidth / 2,
      0
    );
    barrelGradient.addColorStop(0, '#4a3858');
    barrelGradient.addColorStop(0.25, '#6a5888');
    barrelGradient.addColorStop(0.5, '#7a68a8');
    barrelGradient.addColorStop(0.75, '#6a5888');
    barrelGradient.addColorStop(1, '#4a3858');
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(
      centerX - barrelWidth / 2,
      centerY - cellSize * 0.25 - barrelLength,
      barrelWidth,
      barrelLength
    );
    ctx.strokeStyle = '#8a6898';
    ctx.lineWidth = 1;
    ctx.strokeRect(
      centerX - barrelWidth / 2,
      centerY - cellSize * 0.25 - barrelLength,
      barrelWidth,
      barrelLength
    );

    // Barrel rings with metallic effect (industrial detail)
    const ringY1 = centerY - cellSize * 0.3;
    const ringY2 = centerY - cellSize * 0.45;

    // Ring shadows
    ctx.strokeStyle = '#3a2848';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY1 + 1);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY1 + 1);
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY2 + 1);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY2 + 1);
    ctx.stroke();

    // Ring highlights
    ctx.strokeStyle = '#9a78b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY1);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY1);
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY2);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY2);
    ctx.stroke();

    // Rivets/bolts for texture
    ctx.fillStyle = '#7a5898';
    const rivetSize = cellSize * 0.025;
    const rivetPositions = [
      { x: centerX - cellSize * 0.2, y: centerY - cellSize * 0.2 },
      { x: centerX + cellSize * 0.2, y: centerY - cellSize * 0.2 },
      { x: centerX - cellSize * 0.2, y: centerY + cellSize * 0.1 },
      { x: centerX + cellSize * 0.2, y: centerY + cellSize * 0.1 },
    ];
    for (const rivet of rivetPositions) {
      ctx.beginPath();
      ctx.arc(rivet.x, rivet.y, rivetSize, 0, Math.PI * 2);
      ctx.fill();
      // Rivet highlight
      ctx.fillStyle = 'rgba(180, 150, 200, 0.5)';
      ctx.beginPath();
      ctx.arc(rivet.x - rivetSize * 0.3, rivet.y - rivetSize * 0.3, rivetSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#7a5898';
    }

    // Plasma core glow (pulsing)
    const glowIntensity = 0.4 + 0.2 * Math.sin(time * 3);
    const coreY = centerY - cellSize * 0.05;
    const gradient = ctx.createRadialGradient(centerX, coreY, 0, centerX, coreY, cellSize * 0.3);
    gradient.addColorStop(0, `rgba(255, 100, 255, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(200, 50, 200, ${glowIntensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(150, 0, 150, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, coreY, cellSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Plasma core (bright center with inner glow)
    const coreGradient = ctx.createRadialGradient(centerX, coreY, 0, centerX, coreY, cellSize * 0.1);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.4, '#ff88ff');
    coreGradient.addColorStop(1, '#ff66ff');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, coreY, cellSize * 0.08, 0, Math.PI * 2);
    ctx.fill();

    // Barrel tip with metallic rim
    const tipY = centerY - cellSize * 0.25 - barrelLength;
    ctx.strokeStyle = '#9a78b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, tipY, barrelWidth / 2 + 1, Math.PI, 0);
    ctx.stroke();

    // Barrel tip glow
    const tipGlow = ctx.createRadialGradient(centerX, tipY, 0, centerX, tipY, cellSize * 0.15);
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
      centerX,
      muzzleY,
      0,
      centerX,
      muzzleY,
      flashSize * 1.5
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
      centerX,
      muzzleY,
      0,
      centerX,
      muzzleY,
      flashSize * 0.5
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
      ctx.lineTo(centerX + Math.cos(angle) * length, muzzleY + Math.sin(angle) * length);
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
      targetX,
      targetY,
      0,
      targetX,
      targetY,
      cellSize * 0.25
    );
    impactGradient.addColorStop(0, 'rgba(255, 200, 255, 0.8)');
    impactGradient.addColorStop(0.5, 'rgba(200, 100, 200, 0.4)');
    impactGradient.addColorStop(1, 'rgba(150, 50, 150, 0)');
    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(targetX, targetY, cellSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    // Range is already in pixels
    const rangePixels = tower.range;

    // Different opacity for selected vs hovered
    const fillAlpha = isSelected ? 0.15 : 0.08;
    const strokeAlpha = isSelected ? 0.5 : 0.3;

    // Range circle fill (purple tint)
    ctx.fillStyle = `rgba(200, 100, 200, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(200, 100, 200, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

export default PlasmaCannonSprite;
