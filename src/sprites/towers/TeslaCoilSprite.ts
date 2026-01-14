// Tesla Coil Sprite - Electrical tower with arc effects

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const TeslaCoilSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.35;

    // Base platform
    ctx.fillStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.6,
      baseRadius,
      baseRadius * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#4a4a6a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Coil body (cylindrical with windings)
    const coilHeight = cellSize * 0.5;
    const coilWidth = baseRadius * 0.5;
    const coilTop = centerY - coilHeight * 0.5;
    const coilBottom = centerY + baseRadius * 0.3;

    // Coil core
    ctx.fillStyle = '#3a3a4a';
    ctx.fillRect(centerX - coilWidth / 2, coilTop, coilWidth, coilBottom - coilTop);

    // Coil windings
    ctx.strokeStyle = '#7a5a2a';
    ctx.lineWidth = 2;
    const windingCount = 8;
    for (let i = 0; i < windingCount; i++) {
      const windY = coilTop + (coilBottom - coilTop) * (i / windingCount);
      ctx.beginPath();
      ctx.moveTo(centerX - coilWidth / 2 - 2, windY);
      ctx.lineTo(centerX + coilWidth / 2 + 2, windY);
      ctx.stroke();
    }

    // Top electrode (sphere)
    const electrodeRadius = baseRadius * 0.25;
    const electrodeY = coilTop - electrodeRadius * 0.5;

    // Electrode glow
    const glowIntensity = 0.3 + 0.2 * Math.sin(time * 0.005);
    const gradient = ctx.createRadialGradient(
      centerX,
      electrodeY,
      0,
      centerX,
      electrodeY,
      electrodeRadius * 2
    );
    gradient.addColorStop(0, `rgba(100, 180, 255, ${glowIntensity})`);
    gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius * 2, 0, Math.PI * 2);
    ctx.fill();

    // Electrode sphere
    ctx.fillStyle = '#6ab4ff';
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#8ad4ff';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Subtle idle sparks
    drawIdleSparks(ctx, centerX, electrodeY, electrodeRadius, time);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // First draw the base tower
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.35;
    const coilHeight = cellSize * 0.5;
    const coilTop = y * cellSize + cellSize / 2 - coilHeight * 0.5;
    const electrodeRadius = baseRadius * 0.25;
    const electrodeY = coilTop - electrodeRadius * 0.5;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw chain lightning arc
    drawLightningArc(ctx, centerX, electrodeY, targetX, targetY, time);

    // Enhanced electrode glow when firing
    const gradient = ctx.createRadialGradient(
      centerX,
      electrodeY,
      0,
      centerX,
      electrodeY,
      electrodeRadius * 3
    );
    gradient.addColorStop(0, 'rgba(150, 220, 255, 0.8)');
    gradient.addColorStop(0.5, 'rgba(100, 180, 255, 0.4)');
    gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius * 3, 0, Math.PI * 2);
    ctx.fill();
  },
};

function drawIdleSparks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  time: number
): void {
  const sparkCount = 3;

  for (let i = 0; i < sparkCount; i++) {
    // Use time to create varying spark positions
    const seed = time * 0.01 + i * 1000;
    const angle = (seed * 0.7) % (Math.PI * 2);
    const sparkLength = radius * (0.8 + 0.5 * Math.sin(seed * 0.3));

    // Only draw spark if it's "active" based on time
    const sparkPhase = (time * 0.003 + i * 2.1) % 1;
    if (sparkPhase > 0.7) continue; // Sparks flicker on/off

    const startX = x + Math.cos(angle) * radius * 0.8;
    const startY = y + Math.sin(angle) * radius * 0.8;
    const endX = x + Math.cos(angle) * (radius + sparkLength);
    const endY = y + Math.sin(angle) * (radius + sparkLength);

    // Draw spark with slight jagged path
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Add one midpoint for jagged effect
    const midX = (startX + endX) / 2 + Math.sin(seed * 5) * 3;
    const midY = (startY + endY) / 2 + Math.cos(seed * 5) * 3;
    ctx.lineTo(midX, midY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawLightningArc(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number
): void {
  const segments = 8;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;

  // Draw multiple overlapping arcs for glow effect
  const arcLayers = [
    { width: 4, alpha: 0.3, color: '100, 180, 255' },
    { width: 2, alpha: 0.6, color: '150, 220, 255' },
    { width: 1, alpha: 1.0, color: '220, 240, 255' },
  ];

  for (const layer of arcLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${layer.alpha})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Generate jagged lightning path
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;

      // Displacement varies with time for animation
      const displacement = Math.sin(time * 0.02 + i * 1.5) * length * 0.08;
      const offsetX = perpX * displacement;
      const offsetY = perpY * displacement;

      ctx.lineTo(baseX + offsetX, baseY + offsetY);
    }

    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Draw impact glow at target
  const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, 15);
  impactGradient.addColorStop(0, 'rgba(150, 220, 255, 0.6)');
  impactGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, 15, 0, Math.PI * 2);
  ctx.fill();
}

export default TeslaCoilSprite;
