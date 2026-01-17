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

    // === METALLIC BASE PLATFORM ===
    // Base shadow for depth
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY + baseRadius * 0.65, baseRadius * 1.05, baseRadius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base platform with metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius, centerY,
      centerX + baseRadius, centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#4a4a5a');
    baseGradient.addColorStop(0.3, '#3a3a4a');
    baseGradient.addColorStop(0.7, '#2a2a3a');
    baseGradient.addColorStop(1, '#1a1a2a');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + baseRadius * 0.6, baseRadius, baseRadius * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base rim highlight
    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + baseRadius * 0.6, baseRadius, baseRadius * 0.3, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#2a2a3a';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + baseRadius * 0.6, baseRadius, baseRadius * 0.3, 0, 0, Math.PI);
    ctx.stroke();

    // === COIL TOWER BODY ===
    const coilHeight = cellSize * 0.55;
    const coilWidthBottom = baseRadius * 0.55;
    const coilWidthTop = baseRadius * 0.35;
    const coilTop = centerY - coilHeight * 0.55;
    const coilBottom = centerY + baseRadius * 0.25;

    // Tapered metallic core with gradient
    const coreGradient = ctx.createLinearGradient(
      centerX - coilWidthBottom / 2, centerY,
      centerX + coilWidthBottom / 2, centerY
    );
    coreGradient.addColorStop(0, '#2a2a3a');
    coreGradient.addColorStop(0.2, '#4a4a5a');
    coreGradient.addColorStop(0.5, '#5a5a6a');
    coreGradient.addColorStop(0.8, '#4a4a5a');
    coreGradient.addColorStop(1, '#2a2a3a');

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.moveTo(centerX - coilWidthBottom / 2, coilBottom);
    ctx.lineTo(centerX - coilWidthTop / 2, coilTop);
    ctx.lineTo(centerX + coilWidthTop / 2, coilTop);
    ctx.lineTo(centerX + coilWidthBottom / 2, coilBottom);
    ctx.closePath();
    ctx.fill();

    // Core edge highlights
    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - coilWidthBottom / 2, coilBottom);
    ctx.lineTo(centerX - coilWidthTop / 2, coilTop);
    ctx.stroke();

    // === COPPER WINDINGS ===
    const windingCount = 10;
    for (let i = 0; i < windingCount; i++) {
      const t = i / windingCount;
      const windY = coilTop + (coilBottom - coilTop) * t;
      const windWidth = coilWidthTop + (coilWidthBottom - coilWidthTop) * t;

      // Winding gradient for 3D copper look
      const copperGradient = ctx.createLinearGradient(
        centerX - windWidth / 2 - 3, windY,
        centerX + windWidth / 2 + 3, windY
      );
      copperGradient.addColorStop(0, '#5a3a1a');
      copperGradient.addColorStop(0.3, '#b87333');
      copperGradient.addColorStop(0.5, '#da8a44');
      copperGradient.addColorStop(0.7, '#b87333');
      copperGradient.addColorStop(1, '#5a3a1a');

      ctx.strokeStyle = copperGradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - windWidth / 2 - 2, windY);
      ctx.lineTo(centerX + windWidth / 2 + 2, windY);
      ctx.stroke();

      // Subtle highlight on top of winding
      ctx.strokeStyle = 'rgba(255, 200, 150, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - windWidth / 2, windY - 1);
      ctx.lineTo(centerX + windWidth / 2, windY - 1);
      ctx.stroke();
    }

    // === CERAMIC INSULATORS ===
    const insulatorPositions = [0.25, 0.5, 0.75];
    for (const pos of insulatorPositions) {
      const insY = coilTop + (coilBottom - coilTop) * pos;
      const insWidth = coilWidthTop + (coilWidthBottom - coilWidthTop) * pos;

      // Ceramic ring
      ctx.fillStyle = '#e8e0d0';
      ctx.beginPath();
      ctx.ellipse(centerX, insY, insWidth / 2 + 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ring shading
      ctx.strokeStyle = '#a09080';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(centerX, insY, insWidth / 2 + 4, 3, 0, 0, Math.PI);
      ctx.stroke();
    }

    // === TOP ELECTRODE ===
    const electrodeRadius = baseRadius * 0.28;
    const electrodeY = coilTop - electrodeRadius * 0.3;

    // Electrode glow (pulsing)
    const glowIntensity = 0.3 + 0.2 * Math.sin(time * 0.005);
    const glowGradient = ctx.createRadialGradient(
      centerX, electrodeY, 0,
      centerX, electrodeY, electrodeRadius * 2.5
    );
    glowGradient.addColorStop(0, `rgba(100, 180, 255, ${glowIntensity})`);
    glowGradient.addColorStop(0.5, `rgba(80, 140, 220, ${glowIntensity * 0.5})`);
    glowGradient.addColorStop(1, 'rgba(60, 120, 200, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Electrode sphere with metallic gradient
    const sphereGradient = ctx.createRadialGradient(
      centerX - electrodeRadius * 0.3, electrodeY - electrodeRadius * 0.3, 0,
      centerX, electrodeY, electrodeRadius
    );
    sphereGradient.addColorStop(0, '#c0e0ff');
    sphereGradient.addColorStop(0.3, '#8ac0f0');
    sphereGradient.addColorStop(0.7, '#5a90d0');
    sphereGradient.addColorStop(1, '#3a60a0');
    ctx.fillStyle = sphereGradient;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Electrode highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(centerX - electrodeRadius * 0.3, electrodeY - electrodeRadius * 0.3, electrodeRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Electrode rim
    ctx.strokeStyle = '#7ab0e0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius, 0, Math.PI * 2);
    ctx.stroke();

    // === SUPPORT STRUTS ===
    const strutCount = 3;
    for (let i = 0; i < strutCount; i++) {
      const angle = (i / strutCount) * Math.PI * 2 - Math.PI / 2;
      const strutX = Math.cos(angle) * baseRadius * 0.7;
      const strutY = Math.sin(angle) * baseRadius * 0.2;

      ctx.strokeStyle = '#5a5a6a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(centerX + strutX, centerY + baseRadius * 0.5 + strutY);
      ctx.lineTo(centerX + strutX * 0.3, coilBottom);
      ctx.stroke();

      // Strut highlight
      ctx.strokeStyle = '#7a7a8a';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX + strutX - 1, centerY + baseRadius * 0.5 + strutY);
      ctx.lineTo(centerX + strutX * 0.3 - 1, coilBottom);
      ctx.stroke();
    }

    // Subtle idle sparks
    drawIdleSparks(ctx, centerX, electrodeY, electrodeRadius, time);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // First draw the base tower
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.35;
    const coilHeight = cellSize * 0.55;
    const coilTop = centerY - coilHeight * 0.55;
    const electrodeRadius = baseRadius * 0.28;
    const electrodeY = coilTop - electrodeRadius * 0.3;

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

    // Range circle fill (electric blue tint)
    ctx.fillStyle = `rgba(100, 180, 255, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(100, 180, 255, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
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
