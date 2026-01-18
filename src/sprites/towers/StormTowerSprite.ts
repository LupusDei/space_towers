// Storm Tower Sprite - Multi-pronged transformer/generator visual
// Metal structure with energy coils and storm effects
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    prongCount: 3 + Math.floor((clampedLevel - 1) / 2), // 3, 3, 4, 4, 5
    coilCount: 6 + (clampedLevel - 1) * 2, // 6, 8, 10, 12, 14
    sparkCount: 4 + clampedLevel, // 5, 6, 7, 8, 9
    prongScale: 1 + (clampedLevel - 1) * 0.08, // 1.0, 1.08, 1.16, 1.24, 1.32
    glowIntensity: 0.25 + (clampedLevel - 1) * 0.1, // brighter glow at higher levels
    glowRadius: 2.0 + (clampedLevel - 1) * 0.3, // larger glow radius
    hasEnergyField: clampedLevel >= 2, // ambient energy at level 2+
    hasArcBridge: clampedLevel >= 3, // arcs between prongs at level 3+
    hasCoreGlow: clampedLevel >= 4, // central core glow at level 4+
    hasStormCloud: clampedLevel >= 5, // storm cloud effect at level 5
    metalBrightness: 1 + (clampedLevel - 1) * 0.08, // shinier metal
  };
}

export const StormTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.38;

    ctx.save();

    // === STORM CLOUD EFFECT (Level 5) ===
    if (params.hasStormCloud) {
      const cloudY = centerY - cellSize * 0.35;
      const cloudIntensity = 0.15 + 0.05 * Math.sin(time * 0.002);

      // Multiple cloud layers
      for (let i = 0; i < 3; i++) {
        const cloudRadius = cellSize * (0.4 - i * 0.08);
        const offsetX = Math.sin(time * 0.001 + i) * 3;
        const gradient = ctx.createRadialGradient(
          centerX + offsetX, cloudY - i * 4, 0,
          centerX + offsetX, cloudY - i * 4, cloudRadius
        );
        gradient.addColorStop(0, `rgba(68, 170, 255, ${cloudIntensity * (1 - i * 0.2)})`);
        gradient.addColorStop(0.6, `rgba(40, 100, 180, ${cloudIntensity * 0.5 * (1 - i * 0.2)})`);
        gradient.addColorStop(1, 'rgba(30, 60, 120, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX + offsetX, cloudY - i * 4, cloudRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === AMBIENT ENERGY FIELD (Level 2+) ===
    if (params.hasEnergyField) {
      const fieldIntensity = 0.08 + 0.04 * Math.sin(time * 0.003);
      const fieldGradient = ctx.createRadialGradient(
        centerX, centerY - cellSize * 0.1, 0,
        centerX, centerY - cellSize * 0.1, cellSize * 0.55
      );
      fieldGradient.addColorStop(0, `rgba(68, 170, 255, ${fieldIntensity * (level - 1) * 0.25})`);
      fieldGradient.addColorStop(0.7, `rgba(40, 120, 200, ${fieldIntensity * (level - 1) * 0.12})`);
      fieldGradient.addColorStop(1, 'rgba(30, 80, 150, 0)');
      ctx.fillStyle = fieldGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.1, cellSize * 0.55, 0, Math.PI * 2);
      ctx.fill();
    }

    // === METALLIC BASE PLATFORM ===
    // Base shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY + baseRadius * 0.6, baseRadius * 1.08, baseRadius * 0.32, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base platform with industrial metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius, centerY,
      centerX + baseRadius, centerY + baseRadius * 0.5
    );
    const brightness = params.metalBrightness;
    baseGradient.addColorStop(0, `rgb(${Math.floor(70 * brightness)}, ${Math.floor(75 * brightness)}, ${Math.floor(85 * brightness)})`);
    baseGradient.addColorStop(0.3, `rgb(${Math.floor(55 * brightness)}, ${Math.floor(60 * brightness)}, ${Math.floor(70 * brightness)})`);
    baseGradient.addColorStop(0.7, `rgb(${Math.floor(40 * brightness)}, ${Math.floor(45 * brightness)}, ${Math.floor(55 * brightness)})`);
    baseGradient.addColorStop(1, `rgb(${Math.floor(25 * brightness)}, ${Math.floor(30 * brightness)}, ${Math.floor(40 * brightness)})`);
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + baseRadius * 0.55, baseRadius, baseRadius * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Base rim highlights
    ctx.strokeStyle = '#6a7080';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + baseRadius * 0.55, baseRadius, baseRadius * 0.28, 0, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#2a3040';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY + baseRadius * 0.55, baseRadius, baseRadius * 0.28, 0, 0, Math.PI);
    ctx.stroke();

    // === CENTRAL TRANSFORMER COLUMN ===
    const columnHeight = cellSize * 0.45;
    const columnWidthBottom = baseRadius * 0.5;
    const columnWidthTop = baseRadius * 0.35;
    const columnTop = centerY - columnHeight * 0.5;
    const columnBottom = centerY + baseRadius * 0.2;

    // Column body with gradient
    const columnGradient = ctx.createLinearGradient(
      centerX - columnWidthBottom / 2, centerY,
      centerX + columnWidthBottom / 2, centerY
    );
    columnGradient.addColorStop(0, '#2a3040');
    columnGradient.addColorStop(0.2, '#4a5060');
    columnGradient.addColorStop(0.5, '#5a6070');
    columnGradient.addColorStop(0.8, '#4a5060');
    columnGradient.addColorStop(1, '#2a3040');
    ctx.fillStyle = columnGradient;
    ctx.beginPath();
    ctx.moveTo(centerX - columnWidthBottom / 2, columnBottom);
    ctx.lineTo(centerX - columnWidthTop / 2, columnTop);
    ctx.lineTo(centerX + columnWidthTop / 2, columnTop);
    ctx.lineTo(centerX + columnWidthBottom / 2, columnBottom);
    ctx.closePath();
    ctx.fill();

    // Column edge highlight
    ctx.strokeStyle = '#6a7080';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - columnWidthBottom / 2, columnBottom);
    ctx.lineTo(centerX - columnWidthTop / 2, columnTop);
    ctx.stroke();

    // === ENERGY COILS (wrapped around column) ===
    for (let i = 0; i < params.coilCount; i++) {
      const t = i / params.coilCount;
      const coilY = columnTop + (columnBottom - columnTop) * t;
      const coilWidth = columnWidthTop + (columnWidthBottom - columnWidthTop) * t;

      // Coil color with energy tint
      const pulsePhase = Math.sin(time * 0.004 + i * 0.5);
      const coilBrightness = 0.7 + pulsePhase * 0.15;

      const coilGradient = ctx.createLinearGradient(
        centerX - coilWidth / 2 - 3, coilY,
        centerX + coilWidth / 2 + 3, coilY
      );
      coilGradient.addColorStop(0, `rgb(${Math.floor(40 * coilBrightness)}, ${Math.floor(80 * coilBrightness)}, ${Math.floor(140 * coilBrightness)})`);
      coilGradient.addColorStop(0.3, `rgb(${Math.floor(60 * coilBrightness)}, ${Math.floor(130 * coilBrightness)}, ${Math.floor(200 * coilBrightness)})`);
      coilGradient.addColorStop(0.5, `rgb(${Math.floor(80 * coilBrightness)}, ${Math.floor(160 * coilBrightness)}, ${Math.floor(230 * coilBrightness)})`);
      coilGradient.addColorStop(0.7, `rgb(${Math.floor(60 * coilBrightness)}, ${Math.floor(130 * coilBrightness)}, ${Math.floor(200 * coilBrightness)})`);
      coilGradient.addColorStop(1, `rgb(${Math.floor(40 * coilBrightness)}, ${Math.floor(80 * coilBrightness)}, ${Math.floor(140 * coilBrightness)})`);

      ctx.strokeStyle = coilGradient;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(centerX - coilWidth / 2 - 2, coilY);
      ctx.lineTo(centerX + coilWidth / 2 + 2, coilY);
      ctx.stroke();

      // Coil highlight
      ctx.strokeStyle = `rgba(150, 200, 255, ${0.25 + pulsePhase * 0.1})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(centerX - coilWidth / 2, coilY - 1);
      ctx.lineTo(centerX + coilWidth / 2, coilY - 1);
      ctx.stroke();
    }

    // === CORE GLOW (Level 4+) ===
    if (params.hasCoreGlow) {
      const coreY = (columnTop + columnBottom) / 2;
      const coreIntensity = 0.3 + 0.15 * Math.sin(time * 0.005);
      const coreGradient = ctx.createRadialGradient(
        centerX, coreY, 0,
        centerX, coreY, columnWidthBottom * 0.6
      );
      coreGradient.addColorStop(0, `rgba(100, 180, 255, ${coreIntensity})`);
      coreGradient.addColorStop(0.6, `rgba(68, 140, 220, ${coreIntensity * 0.5})`);
      coreGradient.addColorStop(1, 'rgba(50, 100, 180, 0)');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, coreY, columnWidthBottom * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // === GENERATOR PRONGS ===
    const prongBaseY = columnTop;
    const prongHeight = cellSize * 0.25 * params.prongScale;
    const prongSpread = baseRadius * 0.55;

    // Store prong tip positions for arc bridges
    const prongTips: Array<{ x: number; y: number }> = [];

    for (let i = 0; i < params.prongCount; i++) {
      const angle = (i / params.prongCount) * Math.PI * 2 - Math.PI / 2;
      const prongBaseX = centerX + Math.cos(angle) * columnWidthTop * 0.4;
      const prongTipX = centerX + Math.cos(angle) * prongSpread;
      const prongTipY = prongBaseY - prongHeight + Math.sin(angle) * prongHeight * 0.2;

      prongTips.push({ x: prongTipX, y: prongTipY });

      // Prong body (metallic)
      const prongGradient = ctx.createLinearGradient(
        prongBaseX, prongBaseY,
        prongTipX, prongTipY
      );
      prongGradient.addColorStop(0, '#4a5060');
      prongGradient.addColorStop(0.5, '#6a7080');
      prongGradient.addColorStop(1, '#5a6070');

      ctx.strokeStyle = prongGradient;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(prongBaseX, prongBaseY);
      ctx.lineTo(prongTipX, prongTipY);
      ctx.stroke();

      // Prong highlight
      ctx.strokeStyle = '#8a90a0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(prongBaseX - 1, prongBaseY);
      ctx.lineTo(prongTipX - 1, prongTipY);
      ctx.stroke();

      // Energy orb at prong tip
      const orbRadius = cellSize * 0.04 * params.prongScale;
      const orbPulse = 0.8 + 0.2 * Math.sin(time * 0.006 + i * 1.2);

      // Orb glow
      const orbGlowRadius = orbRadius * params.glowRadius;
      const orbGradient = ctx.createRadialGradient(
        prongTipX, prongTipY, 0,
        prongTipX, prongTipY, orbGlowRadius
      );
      orbGradient.addColorStop(0, `rgba(100, 200, 255, ${params.glowIntensity * orbPulse})`);
      orbGradient.addColorStop(0.5, `rgba(68, 170, 255, ${params.glowIntensity * orbPulse * 0.5})`);
      orbGradient.addColorStop(1, 'rgba(50, 120, 200, 0)');
      ctx.fillStyle = orbGradient;
      ctx.beginPath();
      ctx.arc(prongTipX, prongTipY, orbGlowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Orb core
      const coreGradient = ctx.createRadialGradient(
        prongTipX - orbRadius * 0.3, prongTipY - orbRadius * 0.3, 0,
        prongTipX, prongTipY, orbRadius
      );
      coreGradient.addColorStop(0, '#e0f0ff');
      coreGradient.addColorStop(0.4, '#80c0ff');
      coreGradient.addColorStop(1, '#44aaff');
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(prongTipX, prongTipY, orbRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // === ARC BRIDGES BETWEEN PRONGS (Level 3+) ===
    if (params.hasArcBridge && prongTips.length >= 2) {
      for (let i = 0; i < prongTips.length; i++) {
        const next = (i + 1) % prongTips.length;
        const from = prongTips[i];
        const to = prongTips[next];

        // Only draw arc occasionally (flickering effect)
        const arcPhase = (time * 0.008 + i * 2.3) % 1;
        if (arcPhase > 0.4) continue;

        drawMiniArc(ctx, from.x, from.y, to.x, to.y, time, i);
      }
    }

    // === IDLE SPARKS ===
    drawIdleSparks(ctx, centerX, columnTop - prongHeight * 0.5, cellSize * 0.2, time, params.sparkCount);

    ctx.restore();
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    // Draw base tower first
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.38;
    const columnHeight = cellSize * 0.45;
    const prongHeight = cellSize * 0.25 * params.prongScale;
    const columnTop = centerY - columnHeight * 0.5;

    // Storm originates from above the prongs
    const stormOriginY = columnTop - prongHeight * 0.5;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw storm lightning to target
    drawStormLightning(ctx, centerX, stormOriginY, targetX, targetY, time, level);

    // Enhanced glow when firing
    const glowRadius = baseRadius * (1.5 + (level - 1) * 0.2);
    const gradient = ctx.createRadialGradient(
      centerX, stormOriginY, 0,
      centerX, stormOriginY, glowRadius
    );
    gradient.addColorStop(0, 'rgba(100, 200, 255, 0.7)');
    gradient.addColorStop(0.5, 'rgba(68, 170, 255, 0.35)');
    gradient.addColorStop(1, 'rgba(50, 120, 200, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, stormOriginY, glowRadius, 0, Math.PI * 2);
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

    // Range circle fill (storm blue tint)
    ctx.fillStyle = `rgba(68, 170, 255, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(68, 170, 255, ${strokeAlpha})`;
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
  sparkCount: number = 4
): void {
  for (let i = 0; i < sparkCount; i++) {
    const seed = time * 0.01 + i * 1000;
    const angle = (seed * 0.5) % (Math.PI * 2);
    const sparkLength = radius * (0.6 + 0.4 * Math.sin(seed * 0.3));

    // Flicker effect
    const sparkPhase = (time * 0.004 + i * 1.7) % 1;
    if (sparkPhase > 0.6) continue;

    const startX = x + Math.cos(angle) * radius * 0.3;
    const startY = y + Math.sin(angle) * radius * 0.3;
    const endX = x + Math.cos(angle) * (radius * 0.3 + sparkLength);
    const endY = y + Math.sin(angle) * (radius * 0.3 + sparkLength);

    ctx.strokeStyle = 'rgba(120, 200, 255, 0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Jagged midpoint
    const midX = (startX + endX) / 2 + Math.sin(seed * 4) * 2;
    const midY = (startY + endY) / 2 + Math.cos(seed * 4) * 2;
    ctx.lineTo(midX, midY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawMiniArc(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  seed: number
): void {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;

  ctx.strokeStyle = 'rgba(100, 180, 255, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(startX, startY);

  const segments = 4;
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const baseX = startX + dx * t;
    const baseY = startY + dy * t;
    const displacement = Math.sin(time * 0.015 + seed + i * 1.3) * length * 0.12;
    ctx.lineTo(baseX + perpX * displacement, baseY + perpY * displacement);
  }

  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawStormLightning(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  level: number = 1
): void {
  const segments = 10 + Math.floor((level - 1) * 2);
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / length;
  const perpY = dx / length;

  const widthMultiplier = 1 + (level - 1) * 0.12;
  const alphaBoost = (level - 1) * 0.04;

  // Multiple arc layers for glow
  const arcLayers = [
    { width: 5 * widthMultiplier, alpha: 0.25 + alphaBoost, color: '68, 170, 255' },
    { width: 3 * widthMultiplier, alpha: 0.5 + alphaBoost, color: '100, 200, 255' },
    { width: 1.5 * widthMultiplier, alpha: 0.9, color: '200, 230, 255' },
  ];

  for (const layer of arcLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${Math.min(1, layer.alpha)})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;
      const displacementScale = 0.1 + (level - 1) * 0.01;
      const displacement = Math.sin(time * 0.025 + i * 1.8) * length * displacementScale;
      ctx.lineTo(baseX + perpX * displacement, baseY + perpY * displacement);
    }

    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Impact glow at target
  const impactRadius = 18 + (level - 1) * 4;
  const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactRadius);
  impactGradient.addColorStop(0, 'rgba(120, 200, 255, 0.6)');
  impactGradient.addColorStop(1, 'rgba(68, 170, 255, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

export default StormTowerSprite;
