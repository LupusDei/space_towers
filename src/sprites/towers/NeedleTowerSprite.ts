// Needle Tower Sprite - Steel needle with glowing red tip
// Sharp pointed design with industrial/medical aesthetic
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    needleLength: 0.6 + (clampedLevel - 1) * 0.05, // taller at higher levels
    needleWidth: 0.08 + (clampedLevel - 1) * 0.01, // slightly thicker
    tipGlowRadius: 1.5 + (clampedLevel - 1) * 0.3, // larger glow
    tipGlowIntensity: 0.4 + (clampedLevel - 1) * 0.1, // brighter glow
    hasSecondaryNeedles: clampedLevel >= 3, // side needles at level 3+
    hasCoolantRings: clampedLevel >= 2, // cooling rings at level 2+
    coolantRingCount: Math.floor((clampedLevel + 1) / 2), // 1, 1, 2, 2, 3
    hasEnergyField: clampedLevel >= 4, // ambient energy at level 4+
    hasPlasmaCore: clampedLevel >= 5, // plasma core at level 5
    steelBrightness: 1 + (clampedLevel - 1) * 0.08, // shinier steel
    hazardStripes: clampedLevel >= 2, // warning stripes at level 2+
  };
}

export const NeedleTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.32;

    // === AMBIENT ENERGY FIELD (Level 4+) ===
    if (params.hasEnergyField) {
      const fieldIntensity = 0.08 + 0.04 * Math.sin(time * 0.003);
      const fieldGradient = ctx.createRadialGradient(
        centerX,
        centerY - cellSize * 0.2,
        0,
        centerX,
        centerY - cellSize * 0.2,
        cellSize * 0.5
      );
      fieldGradient.addColorStop(
        0,
        `rgba(255, 80, 80, ${fieldIntensity * (level - 3) * 0.25})`
      );
      fieldGradient.addColorStop(
        0.7,
        `rgba(200, 50, 50, ${fieldIntensity * (level - 3) * 0.12})`
      );
      fieldGradient.addColorStop(1, 'rgba(150, 30, 30, 0)');
      ctx.fillStyle = fieldGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.2, cellSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // === METALLIC BASE PLATFORM ===
    // Base shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + 2,
      centerY + baseRadius * 0.7,
      baseRadius * 1.05,
      baseRadius * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Base platform with industrial metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY,
      centerX + baseRadius,
      centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#5a5a6a');
    baseGradient.addColorStop(0.3, '#4a4a5a');
    baseGradient.addColorStop(0.7, '#3a3a4a');
    baseGradient.addColorStop(1, '#2a2a3a');
    ctx.fillStyle = baseGradient;
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

    // Base rim highlight
    ctx.strokeStyle = '#7a7a8a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.6,
      baseRadius,
      baseRadius * 0.3,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.stroke();

    // Hazard stripes on base (Level 2+)
    if (params.hazardStripes) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + baseRadius * 0.6,
        baseRadius * 0.85,
        baseRadius * 0.25,
        0,
        0,
        Math.PI * 2
      );
      ctx.clip();

      const stripeWidth = baseRadius * 0.15;
      ctx.fillStyle = '#cc3333';
      for (let i = -4; i <= 4; i += 2) {
        ctx.fillRect(
          centerX + i * stripeWidth - stripeWidth / 2,
          centerY + baseRadius * 0.3,
          stripeWidth,
          baseRadius * 0.3
        );
      }
      ctx.restore();
    }

    // === NEEDLE MOUNTING CYLINDER ===
    const cylinderHeight = cellSize * 0.12;
    const cylinderWidth = baseRadius * 0.5;
    const cylinderTop = centerY + baseRadius * 0.25;

    // Cylinder body
    const cylGradient = ctx.createLinearGradient(
      centerX - cylinderWidth,
      cylinderTop,
      centerX + cylinderWidth,
      cylinderTop
    );
    cylGradient.addColorStop(0, '#3a3a4a');
    cylGradient.addColorStop(0.3, '#5a5a6a');
    cylGradient.addColorStop(0.5, '#6a6a7a');
    cylGradient.addColorStop(0.7, '#5a5a6a');
    cylGradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = cylGradient;
    ctx.fillRect(
      centerX - cylinderWidth,
      cylinderTop - cylinderHeight,
      cylinderWidth * 2,
      cylinderHeight
    );

    // Cylinder top ellipse
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      cylinderTop - cylinderHeight,
      cylinderWidth,
      cylinderWidth * 0.25,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#7a7a8a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === SECONDARY NEEDLES (Level 3+) ===
    if (params.hasSecondaryNeedles) {
      const secondaryLength = cellSize * params.needleLength * 0.5;
      const secondaryWidth = cellSize * params.needleWidth * 0.6;
      const angleSpread = 0.25;

      [-1, 1].forEach((side) => {
        const offsetX = side * baseRadius * 0.35;
        const baseY = cylinderTop - cylinderHeight;
        const tipY = baseY - secondaryLength;
        const tipX = centerX + offsetX + side * secondaryLength * Math.sin(angleSpread);

        // Secondary needle shaft gradient
        const secGradient = ctx.createLinearGradient(
          centerX + offsetX - secondaryWidth,
          baseY,
          centerX + offsetX + secondaryWidth,
          baseY
        );
        const brightness = params.steelBrightness;
        const r1 = Math.min(255, Math.floor(140 * brightness));
        const r2 = Math.min(255, Math.floor(180 * brightness));
        const r3 = Math.min(255, Math.floor(200 * brightness));
        secGradient.addColorStop(0, `rgb(${r1}, ${r1}, ${r1 + 10})`);
        secGradient.addColorStop(0.4, `rgb(${r2}, ${r2}, ${r2 + 10})`);
        secGradient.addColorStop(0.6, `rgb(${r3}, ${r3}, ${r3 + 10})`);
        secGradient.addColorStop(1, `rgb(${r1}, ${r1}, ${r1 + 10})`);

        ctx.fillStyle = secGradient;
        ctx.beginPath();
        ctx.moveTo(centerX + offsetX - secondaryWidth, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(centerX + offsetX + secondaryWidth, baseY);
        ctx.closePath();
        ctx.fill();

        // Secondary tip glow
        const secGlowGradient = ctx.createRadialGradient(
          tipX,
          tipY,
          0,
          tipX,
          tipY,
          cellSize * 0.08
        );
        secGlowGradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
        secGlowGradient.addColorStop(0.5, 'rgba(255, 50, 50, 0.3)');
        secGlowGradient.addColorStop(1, 'rgba(200, 30, 30, 0)');
        ctx.fillStyle = secGlowGradient;
        ctx.beginPath();
        ctx.arc(tipX, tipY, cellSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // === MAIN NEEDLE SHAFT ===
    const needleLength = cellSize * params.needleLength;
    const needleWidthBase = cellSize * params.needleWidth;
    const needleBase = cylinderTop - cylinderHeight;
    const needleTip = needleBase - needleLength;

    // Steel needle gradient
    const brightness = params.steelBrightness;
    const needleGradient = ctx.createLinearGradient(
      centerX - needleWidthBase,
      needleBase,
      centerX + needleWidthBase,
      needleBase
    );
    const s1 = Math.min(255, Math.floor(150 * brightness));
    const s2 = Math.min(255, Math.floor(190 * brightness));
    const s3 = Math.min(255, Math.floor(220 * brightness));
    needleGradient.addColorStop(0, `rgb(${s1}, ${s1}, ${s1 + 15})`);
    needleGradient.addColorStop(0.3, `rgb(${s2}, ${s2}, ${s2 + 10})`);
    needleGradient.addColorStop(0.5, `rgb(${s3}, ${s3}, ${s3 + 5})`);
    needleGradient.addColorStop(0.7, `rgb(${s2}, ${s2}, ${s2 + 10})`);
    needleGradient.addColorStop(1, `rgb(${s1}, ${s1}, ${s1 + 15})`);

    // Draw needle as sharp triangle
    ctx.fillStyle = needleGradient;
    ctx.beginPath();
    ctx.moveTo(centerX - needleWidthBase, needleBase);
    ctx.lineTo(centerX, needleTip);
    ctx.lineTo(centerX + needleWidthBase, needleBase);
    ctx.closePath();
    ctx.fill();

    // Needle edge highlight
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + (level - 1) * 0.05})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX - needleWidthBase + 1, needleBase);
    ctx.lineTo(centerX, needleTip);
    ctx.stroke();

    // === COOLANT RINGS (Level 2+) ===
    if (params.hasCoolantRings) {
      for (let i = 0; i < params.coolantRingCount; i++) {
        const ringT = 0.25 + (i * 0.25) / params.coolantRingCount;
        const ringY = needleBase - needleLength * ringT;
        const ringWidth = needleWidthBase * (1 - ringT * 0.8);

        // Ring glow
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - ringWidth - 2, ringY);
        ctx.lineTo(centerX + ringWidth + 2, ringY);
        ctx.stroke();

        // Ring metal
        ctx.strokeStyle = '#8ac0d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - ringWidth - 1, ringY);
        ctx.lineTo(centerX + ringWidth + 1, ringY);
        ctx.stroke();
      }
    }

    // === PLASMA CORE (Level 5) ===
    if (params.hasPlasmaCore) {
      const coreY = needleBase - needleLength * 0.15;
      const coreRadius = needleWidthBase * 1.5;
      const pulseIntensity = 0.6 + 0.2 * Math.sin(time * 0.006);

      // Core glow
      const coreGlow = ctx.createRadialGradient(
        centerX,
        coreY,
        0,
        centerX,
        coreY,
        coreRadius * 2
      );
      coreGlow.addColorStop(0, `rgba(255, 100, 100, ${pulseIntensity})`);
      coreGlow.addColorStop(0.5, `rgba(200, 50, 50, ${pulseIntensity * 0.4})`);
      coreGlow.addColorStop(1, 'rgba(150, 30, 30, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, coreY, coreRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core orb
      const coreOrb = ctx.createRadialGradient(
        centerX - coreRadius * 0.2,
        coreY - coreRadius * 0.2,
        0,
        centerX,
        coreY,
        coreRadius
      );
      coreOrb.addColorStop(0, '#ffaaaa');
      coreOrb.addColorStop(0.5, '#ff5555');
      coreOrb.addColorStop(1, '#cc2222');
      ctx.fillStyle = coreOrb;
      ctx.beginPath();
      ctx.arc(centerX, coreY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // === GLOWING RED TIP ===
    const tipGlowSize = cellSize * 0.1 * params.tipGlowRadius;
    const tipPulse = params.tipGlowIntensity + 0.15 * Math.sin(time * 0.004);

    // Outer glow
    const outerGlow = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      tipGlowSize
    );
    outerGlow.addColorStop(0, `rgba(255, 100, 100, ${tipPulse})`);
    outerGlow.addColorStop(0.4, `rgba(255, 50, 50, ${tipPulse * 0.5})`);
    outerGlow.addColorStop(0.7, `rgba(200, 30, 30, ${tipPulse * 0.2})`);
    outerGlow.addColorStop(1, 'rgba(150, 20, 20, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, tipGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    const innerGlow = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      cellSize * 0.03
    );
    innerGlow.addColorStop(0, '#ffffff');
    innerGlow.addColorStop(0.3, '#ffcccc');
    innerGlow.addColorStop(0.6, '#ff6666');
    innerGlow.addColorStop(1, '#ff3333');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, cellSize * 0.03, 0, Math.PI * 2);
    ctx.fill();

    // Tip highlight spark (flickers)
    const sparkPhase = (time * 0.005) % 1;
    if (sparkPhase > 0.6) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX, needleTip - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
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
    const baseRadius = cellSize * 0.32;
    const needleLength = cellSize * params.needleLength;
    const cylinderHeight = cellSize * 0.12;
    const needleBase = centerY + baseRadius * 0.25 - cylinderHeight;
    const needleTip = needleBase - needleLength;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw precision beam (thin, focused)
    drawNeedleBeam(ctx, centerX, needleTip, targetX, targetY, time, level);

    // Enhanced tip glow when firing
    const firingGlowRadius = cellSize * 0.15 * (1.5 + (level - 1) * 0.2);
    const firingGlow = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      firingGlowRadius
    );
    firingGlow.addColorStop(0, 'rgba(255, 150, 150, 0.9)');
    firingGlow.addColorStop(0.3, 'rgba(255, 80, 80, 0.6)');
    firingGlow.addColorStop(0.6, 'rgba(200, 50, 50, 0.3)');
    firingGlow.addColorStop(1, 'rgba(150, 30, 30, 0)');
    ctx.fillStyle = firingGlow;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, firingGlowRadius, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    // Range circle fill (red tint for needle)
    ctx.fillStyle = `rgba(255, 80, 80, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(255, 100, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawNeedleBeam(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  level: number = 1
): void {
  const dx = endX - startX;
  const dy = endY - startY;

  // Scale width with level
  const baseWidth = 1 + (level - 1) * 0.3;
  const alphaBoost = (level - 1) * 0.05;

  // Draw beam layers (thin, precise)
  const beamLayers = [
    { width: 6 * baseWidth, alpha: 0.15 + alphaBoost, color: '255, 80, 80' },
    { width: 3 * baseWidth, alpha: 0.35 + alphaBoost, color: '255, 120, 120' },
    { width: 1.5 * baseWidth, alpha: 0.7 + alphaBoost, color: '255, 180, 180' },
    { width: 0.5 * baseWidth, alpha: 1.0, color: '255, 255, 255' },
  ];

  for (const layer of beamLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${Math.min(1, layer.alpha)})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Draw traveling pulse along beam
  const pulseT = ((time * 0.01) % 1);
  const pulseX = startX + dx * pulseT;
  const pulseY = startY + dy * pulseT;
  const pulseRadius = 4 + level;

  const pulseGradient = ctx.createRadialGradient(
    pulseX,
    pulseY,
    0,
    pulseX,
    pulseY,
    pulseRadius
  );
  pulseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  pulseGradient.addColorStop(0.5, 'rgba(255, 150, 150, 0.4)');
  pulseGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
  ctx.fillStyle = pulseGradient;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Impact glow at target (scales with level)
  const impactRadius = 12 + (level - 1) * 2;
  const impactGradient = ctx.createRadialGradient(
    endX,
    endY,
    0,
    endX,
    endY,
    impactRadius
  );
  impactGradient.addColorStop(0, 'rgba(255, 150, 150, 0.7)');
  impactGradient.addColorStop(0.5, 'rgba(255, 80, 80, 0.3)');
  impactGradient.addColorStop(1, 'rgba(200, 50, 50, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

export default NeedleTowerSprite;
