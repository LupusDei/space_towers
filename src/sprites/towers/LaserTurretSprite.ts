// Laser Turret Sprite - Sleek metallic turret with beam effect

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const LaserTurretSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.38;

    // Base platform with metallic gradient
    const baseGradient = ctx.createRadialGradient(
      centerX - baseRadius * 0.3,
      centerY - baseRadius * 0.3,
      0,
      centerX,
      centerY,
      baseRadius
    );
    baseGradient.addColorStop(0, '#1a4a4a');
    baseGradient.addColorStop(0.5, '#0d3333');
    baseGradient.addColorStop(1, '#082222');

    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.fill();

    // Base rim highlight
    ctx.strokeStyle = '#2a6666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring detail
    ctx.strokeStyle = '#1a4a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.75, 0, Math.PI * 2);
    ctx.stroke();

    // Panel line details on base
    drawPanelLines(ctx, centerX, centerY, baseRadius);

    // Rotating turret assembly
    const rotationSpeed = 0.5;
    const angle = time * rotationSpeed;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    // Turret mount (darker ring)
    const mountGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cellSize * 0.2);
    mountGradient.addColorStop(0, '#2a5a5a');
    mountGradient.addColorStop(0.7, '#1a4040');
    mountGradient.addColorStop(1, '#0d2a2a');

    ctx.fillStyle = mountGradient;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Turret barrel housing
    drawBarrel(ctx, cellSize);

    // Turret body (main rotating part)
    const bodyGradient = ctx.createRadialGradient(
      -cellSize * 0.03,
      -cellSize * 0.03,
      0,
      0,
      0,
      cellSize * 0.15
    );
    bodyGradient.addColorStop(0, '#00e5e5');
    bodyGradient.addColorStop(0.4, '#00cccc');
    bodyGradient.addColorStop(0.8, '#00a0a0');
    bodyGradient.addColorStop(1, '#007a7a');

    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.14, 0, Math.PI * 2);
    ctx.fill();

    // Body edge highlight
    ctx.strokeStyle = '#33ffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.14, -Math.PI * 0.7, Math.PI * 0.3);
    ctx.stroke();

    // Center lens/emitter
    const lensGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, cellSize * 0.07);
    lensGradient.addColorStop(0, '#ffffff');
    lensGradient.addColorStop(0.3, '#aaffff');
    lensGradient.addColorStop(0.7, '#00ffff');
    lensGradient.addColorStop(1, '#00cccc');

    ctx.fillStyle = lensGradient;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.06, 0, Math.PI * 2);
    ctx.fill();

    // Pulsing glow effect
    const pulseIntensity = 0.3 + 0.2 * Math.sin(time * 3);
    ctx.fillStyle = `rgba(0, 255, 255, ${pulseIntensity})`;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.1, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Corner status indicators
    drawStatusIndicators(ctx, centerX, centerY, baseRadius, time);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const startX = x * cellSize + cellSize / 2;
    const startY = y * cellSize + cellSize / 2;
    const endX = target.x * cellSize + cellSize / 2;
    const endY = target.y * cellSize + cellSize / 2;

    // Outer glow (wide, soft)
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = cellSize * 0.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Middle glow
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
    ctx.lineWidth = cellSize * 0.1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = 'rgba(100, 255, 255, 0.8)';
    ctx.lineWidth = cellSize * 0.05;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Core beam with flicker
    const flicker = 0.85 + Math.sin(time * 25) * 0.15;
    ctx.strokeStyle = `rgba(200, 255, 255, ${flicker})`;
    ctx.lineWidth = cellSize * 0.025;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Impact flash at target
    const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, cellSize * 0.15);
    impactGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    impactGradient.addColorStop(0.3, 'rgba(150, 255, 255, 0.6)');
    impactGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(endX, endY, cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.15 : 0.08;
    const strokeAlpha = isSelected ? 0.5 : 0.3;

    ctx.fillStyle = `rgba(0, 255, 255, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(0, 255, 255, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawPanelLines(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.strokeStyle = '#0a2a2a';
  ctx.lineWidth = 1;

  // Radial panel lines
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const innerR = radius * 0.5;
    const outerR = radius * 0.9;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.stroke();
  }
}

function drawBarrel(ctx: CanvasRenderingContext2D, cellSize: number): void {
  const barrelLength = cellSize * 0.28;
  const barrelWidth = cellSize * 0.08;

  // Barrel base (wider section)
  const baseGradient = ctx.createLinearGradient(-barrelWidth, 0, barrelWidth, 0);
  baseGradient.addColorStop(0, '#006666');
  baseGradient.addColorStop(0.3, '#00a0a0');
  baseGradient.addColorStop(0.5, '#00cccc');
  baseGradient.addColorStop(0.7, '#00a0a0');
  baseGradient.addColorStop(1, '#006666');

  ctx.fillStyle = baseGradient;
  ctx.fillRect(-barrelWidth * 0.6, -barrelLength, barrelWidth * 1.2, barrelLength * 0.4);

  // Main barrel
  const barrelGradient = ctx.createLinearGradient(-barrelWidth / 2, 0, barrelWidth / 2, 0);
  barrelGradient.addColorStop(0, '#005555');
  barrelGradient.addColorStop(0.2, '#00aaaa');
  barrelGradient.addColorStop(0.5, '#00dddd');
  barrelGradient.addColorStop(0.8, '#00aaaa');
  barrelGradient.addColorStop(1, '#005555');

  ctx.fillStyle = barrelGradient;
  ctx.fillRect(-barrelWidth / 2, -barrelLength - cellSize * 0.05, barrelWidth, barrelLength);

  // Barrel tip (emitter)
  ctx.fillStyle = '#00ffff';
  ctx.fillRect(
    -barrelWidth * 0.4,
    -barrelLength - cellSize * 0.08,
    barrelWidth * 0.8,
    cellSize * 0.04
  );

  // Barrel highlight line
  ctx.strokeStyle = '#66ffff';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, -cellSize * 0.12);
  ctx.lineTo(0, -barrelLength - cellSize * 0.03);
  ctx.stroke();
}

function drawStatusIndicators(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  time: number
): void {
  const indicatorRadius = radius * 0.08;
  const indicatorDistance = radius * 0.85;

  // Four corner indicators
  const positions = [
    { angle: Math.PI * 0.25 },
    { angle: Math.PI * 0.75 },
    { angle: Math.PI * 1.25 },
    { angle: Math.PI * 1.75 },
  ];

  for (let i = 0; i < positions.length; i++) {
    const { angle } = positions[i];
    const ix = centerX + Math.cos(angle) * indicatorDistance;
    const iy = centerY + Math.sin(angle) * indicatorDistance;

    // Blinking pattern
    const blinkPhase = (time * 1.5 + i * 0.4) % 2;
    const isOn = blinkPhase < 1.6;

    ctx.fillStyle = isOn ? '#00ff88' : '#004422';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glow when on
    if (isOn) {
      ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
      ctx.beginPath();
      ctx.arc(ix, iy, indicatorRadius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default LaserTurretSprite;
