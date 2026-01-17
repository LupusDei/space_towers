// Tesla Coil Sprite - Electrical tower with arc effects
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    windingCount: 10 + (clampedLevel - 1) * 2, // 10, 12, 14, 16, 18
    insulatorCount: 3 + Math.floor((clampedLevel - 1) / 2), // 3, 3, 4, 4, 5
    sparkCount: 3 + clampedLevel, // 4, 5, 6, 7, 8
    sparkLength: 0.8 + clampedLevel * 0.15, // longer sparks at higher levels
    electrodeScale: 1 + (clampedLevel - 1) * 0.12, // 1.0, 1.12, 1.24, 1.36, 1.48
    glowIntensityBase: 0.3 + (clampedLevel - 1) * 0.08, // brighter glow
    glowScale: 2.5 + (clampedLevel - 1) * 0.3, // larger glow radius
    strutCount: 3 + Math.floor((clampedLevel - 1) / 2), // 3, 3, 4, 4, 5
    hasOuterRing: clampedLevel >= 4, // outer electrode ring at level 4+
    hasCorona: clampedLevel >= 5, // corona effect at level 5
    hasEnergyField: clampedLevel >= 3, // ambient energy at level 3+
    copperBrightness: 1 + (clampedLevel - 1) * 0.1, // shinier copper
  };
}

export const TeslaCoilSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.35;

    // === AMBIENT ENERGY FIELD (Level 3+) ===
    if (params.hasEnergyField) {
      const fieldIntensity = 0.1 + 0.05 * Math.sin(time * 0.003);
      const fieldGradient = ctx.createRadialGradient(
        centerX, centerY - cellSize * 0.1, 0,
        centerX, centerY - cellSize * 0.1, cellSize * 0.6
      );
      fieldGradient.addColorStop(0, `rgba(100, 180, 255, ${fieldIntensity * (level - 2) * 0.3})`);
      fieldGradient.addColorStop(0.7, `rgba(80, 140, 220, ${fieldIntensity * (level - 2) * 0.15})`);
      fieldGradient.addColorStop(1, 'rgba(60, 120, 200, 0)');
      ctx.fillStyle = fieldGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.1, cellSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

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

    // === COPPER WINDINGS (scales with level) ===
    const brightness = params.copperBrightness;
    for (let i = 0; i < params.windingCount; i++) {
      const t = i / params.windingCount;
      const windY = coilTop + (coilBottom - coilTop) * t;
      const windWidth = coilWidthTop + (coilWidthBottom - coilWidthTop) * t;

      // Winding gradient for 3D copper look (brighter at higher levels)
      const copperGradient = ctx.createLinearGradient(
        centerX - windWidth / 2 - 3, windY,
        centerX + windWidth / 2 + 3, windY
      );
      const r1 = Math.min(255, Math.floor(90 * brightness));
      const g1 = Math.min(255, Math.floor(58 * brightness));
      const r2 = Math.min(255, Math.floor(184 * brightness));
      const g2 = Math.min(255, Math.floor(115 * brightness));
      const r3 = Math.min(255, Math.floor(218 * brightness));
      const g3 = Math.min(255, Math.floor(138 * brightness));
      copperGradient.addColorStop(0, `rgb(${r1}, ${g1}, 26)`);
      copperGradient.addColorStop(0.3, `rgb(${r2}, ${g2}, 51)`);
      copperGradient.addColorStop(0.5, `rgb(${r3}, ${g3}, 68)`);
      copperGradient.addColorStop(0.7, `rgb(${r2}, ${g2}, 51)`);
      copperGradient.addColorStop(1, `rgb(${r1}, ${g1}, 26)`);

      ctx.strokeStyle = copperGradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - windWidth / 2 - 2, windY);
      ctx.lineTo(centerX + windWidth / 2 + 2, windY);
      ctx.stroke();

      // Subtle highlight on top of winding
      ctx.strokeStyle = `rgba(255, 200, 150, ${0.3 + (level - 1) * 0.05})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - windWidth / 2, windY - 1);
      ctx.lineTo(centerX + windWidth / 2, windY - 1);
      ctx.stroke();
    }

    // === CERAMIC INSULATORS (scales with level) ===
    const insulatorStep = 1 / (params.insulatorCount + 1);
    for (let i = 1; i <= params.insulatorCount; i++) {
      const pos = i * insulatorStep;
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

    // === OUTER ELECTRODE RING (Level 4+) ===
    const electrodeRadius = baseRadius * 0.28 * params.electrodeScale;
    const electrodeY = coilTop - electrodeRadius * 0.3;

    if (params.hasOuterRing) {
      const ringRadius = electrodeRadius * 1.8;
      const ringGlow = ctx.createRadialGradient(
        centerX, electrodeY, ringRadius - 3,
        centerX, electrodeY, ringRadius + 5
      );
      ringGlow.addColorStop(0, 'rgba(100, 180, 255, 0.3)');
      ringGlow.addColorStop(0.5, 'rgba(80, 140, 220, 0.15)');
      ringGlow.addColorStop(1, 'rgba(60, 120, 200, 0)');
      ctx.fillStyle = ringGlow;
      ctx.beginPath();
      ctx.arc(centerX, electrodeY, ringRadius + 5, 0, Math.PI * 2);
      ctx.fill();

      // Metallic ring
      ctx.strokeStyle = '#7ab0e0';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(centerX, electrodeY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Ring highlight
      ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, electrodeY, ringRadius, Math.PI * 1.2, Math.PI * 1.8);
      ctx.stroke();

      // Small nodes on the ring
      const nodeCount = 4;
      for (let i = 0; i < nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const nodeX = centerX + Math.cos(angle) * ringRadius;
        const nodeY = electrodeY + Math.sin(angle) * ringRadius;
        ctx.fillStyle = '#8ac0f0';
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === CORONA EFFECT (Level 5) ===
    if (params.hasCorona) {
      const coronaIntensity = 0.2 + 0.1 * Math.sin(time * 0.004);
      const coronaCount = 12;
      for (let i = 0; i < coronaCount; i++) {
        const angle = (i / coronaCount) * Math.PI * 2 + time * 0.001;
        const length = electrodeRadius * (1.5 + 0.5 * Math.sin(time * 0.005 + i));
        const startX = centerX + Math.cos(angle) * electrodeRadius * 0.9;
        const startY = electrodeY + Math.sin(angle) * electrodeRadius * 0.9;
        const endX = centerX + Math.cos(angle) * (electrodeRadius + length);
        const endY = electrodeY + Math.sin(angle) * (electrodeRadius + length);

        ctx.strokeStyle = `rgba(150, 220, 255, ${coronaIntensity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }
    }

    // === TOP ELECTRODE ===
    // Electrode glow (pulsing, scales with level)
    const glowIntensity = params.glowIntensityBase + 0.2 * Math.sin(time * 0.005);
    const glowGradient = ctx.createRadialGradient(
      centerX, electrodeY, 0,
      centerX, electrodeY, electrodeRadius * params.glowScale
    );
    glowGradient.addColorStop(0, `rgba(100, 180, 255, ${glowIntensity})`);
    glowGradient.addColorStop(0.5, `rgba(80, 140, 220, ${glowIntensity * 0.5})`);
    glowGradient.addColorStop(1, 'rgba(60, 120, 200, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, electrodeRadius * params.glowScale, 0, Math.PI * 2);
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

    // === SUPPORT STRUTS (scales with level) ===
    for (let i = 0; i < params.strutCount; i++) {
      const angle = (i / params.strutCount) * Math.PI * 2 - Math.PI / 2;
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

    // Idle sparks (more sparks at higher levels)
    drawIdleSparks(ctx, centerX, electrodeY, electrodeRadius, time, params.sparkCount, params.sparkLength);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    // First draw the base tower
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.35;
    const coilHeight = cellSize * 0.55;
    const coilTop = centerY - coilHeight * 0.55;
    const electrodeRadius = baseRadius * 0.28 * params.electrodeScale;
    const electrodeY = coilTop - electrodeRadius * 0.3;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw chain lightning arc (scales with level)
    drawLightningArc(ctx, centerX, electrodeY, targetX, targetY, time, level);

    // Enhanced electrode glow when firing (scales with level)
    const glowRadius = electrodeRadius * (3 + (level - 1) * 0.3);
    const glowIntensity = 0.8 + (level - 1) * 0.05;
    const gradient = ctx.createRadialGradient(
      centerX,
      electrodeY,
      0,
      centerX,
      electrodeY,
      glowRadius
    );
    gradient.addColorStop(0, `rgba(150, 220, 255, ${glowIntensity})`);
    gradient.addColorStop(0.5, `rgba(100, 180, 255, ${glowIntensity * 0.5})`);
    gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, electrodeY, glowRadius, 0, Math.PI * 2);
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
  time: number,
  sparkCount: number = 3,
  sparkLengthMultiplier: number = 0.8
): void {
  for (let i = 0; i < sparkCount; i++) {
    // Use time to create varying spark positions
    const seed = time * 0.01 + i * 1000;
    const angle = (seed * 0.7) % (Math.PI * 2);
    const sparkLength = radius * (sparkLengthMultiplier + 0.5 * Math.sin(seed * 0.3));

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
  time: number,
  level: number = 1
): void {
  const segments = 8 + Math.floor((level - 1) * 1.5); // more segments at higher levels
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;

  // Scale width and intensity with level
  const widthMultiplier = 1 + (level - 1) * 0.15;
  const alphaBoost = (level - 1) * 0.05;

  // Draw multiple overlapping arcs for glow effect
  const arcLayers = [
    { width: 4 * widthMultiplier, alpha: 0.3 + alphaBoost, color: '100, 180, 255' },
    { width: 2 * widthMultiplier, alpha: 0.6 + alphaBoost, color: '150, 220, 255' },
    { width: 1 * widthMultiplier, alpha: 1.0, color: '220, 240, 255' },
  ];

  for (const layer of arcLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${Math.min(1, layer.alpha)})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Generate jagged lightning path
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;

      // Displacement varies with time for animation (more jagged at higher levels)
      const displacementScale = 0.08 + (level - 1) * 0.01;
      const displacement = Math.sin(time * 0.02 + i * 1.5) * length * displacementScale;
      const offsetX = perpX * displacement;
      const offsetY = perpY * displacement;

      ctx.lineTo(baseX + offsetX, baseY + offsetY);
    }

    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Draw impact glow at target (scales with level)
  const impactRadius = 15 + (level - 1) * 3;
  const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactRadius);
  impactGradient.addColorStop(0, 'rgba(150, 220, 255, 0.6)');
  impactGradient.addColorStop(1, 'rgba(100, 180, 255, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

export default TeslaCoilSprite;
