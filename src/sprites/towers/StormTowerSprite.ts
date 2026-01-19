// Storm Tower Sprite - Dark storm cloud with crackling lightning
// Weather-based tower with swirling clouds and electrical discharges
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Storm color configuration
const STORM_COLORS = {
  cloudDark: '#1e2332',
  cloudMid: '#323746',
  cloudLight: '#464b5a',
  lightning: '180, 200, 255',
  lightningCore: '220, 240, 255',
  rain: 'rgba(150, 180, 220, 0.6)',
};

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    cloudScale: 0.7 + (clampedLevel - 1) * 0.06, // larger cloud at higher levels
    cloudLayers: 2 + Math.floor((clampedLevel - 1) / 2), // 2, 2, 3, 3, 4
    lightningCount: 2 + clampedLevel, // 3, 4, 5, 6, 7
    sparkIntensity: 0.4 + (clampedLevel - 1) * 0.1, // brighter sparks
    hasRain: clampedLevel >= 2, // rain effect at level 2+
    rainCount: 6 + (clampedLevel - 2) * 4, // more rain at higher levels
    hasWindSwirl: clampedLevel >= 3, // wind swirl at level 3+
    hasThunderGlow: clampedLevel >= 4, // ambient thunder glow at level 4+
    hasEyeOfStorm: clampedLevel >= 5, // eye of storm at level 5
    glowIntensity: 0.3 + (clampedLevel - 1) * 0.08,
  };
}

// Seeded random for deterministic effects
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export const StormTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.32;

    // === THUNDER GLOW (Level 4+) ===
    if (params.hasThunderGlow) {
      const glowPulse = 0.08 + 0.06 * Math.sin(time * 0.002);
      const thunderGradient = ctx.createRadialGradient(
        centerX,
        centerY - cellSize * 0.15,
        0,
        centerX,
        centerY - cellSize * 0.15,
        cellSize * 0.6
      );
      thunderGradient.addColorStop(
        0,
        `rgba(${STORM_COLORS.lightning}, ${glowPulse * (level - 3) * 0.3})`
      );
      thunderGradient.addColorStop(
        0.6,
        `rgba(${STORM_COLORS.lightning}, ${glowPulse * (level - 3) * 0.15})`
      );
      thunderGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = thunderGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.15, cellSize * 0.6, 0, Math.PI * 2);
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

    // Base platform with dark metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY,
      centerX + baseRadius,
      centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#4a4a5a');
    baseGradient.addColorStop(0.3, '#3a3a4a');
    baseGradient.addColorStop(0.7, '#2a2a3a');
    baseGradient.addColorStop(1, '#1a1a2a');
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
    ctx.strokeStyle = '#6a6a7a';
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

    // === STORM PEDESTAL ===
    const pedestalHeight = cellSize * 0.15;
    const pedestalWidth = baseRadius * 0.4;
    const pedestalTop = centerY + baseRadius * 0.2;

    // Pedestal body
    const pedestalGradient = ctx.createLinearGradient(
      centerX - pedestalWidth,
      pedestalTop,
      centerX + pedestalWidth,
      pedestalTop
    );
    pedestalGradient.addColorStop(0, '#3a3a4a');
    pedestalGradient.addColorStop(0.3, '#5a5a6a');
    pedestalGradient.addColorStop(0.5, '#6a6a7a');
    pedestalGradient.addColorStop(0.7, '#5a5a6a');
    pedestalGradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = pedestalGradient;
    ctx.fillRect(
      centerX - pedestalWidth,
      pedestalTop - pedestalHeight,
      pedestalWidth * 2,
      pedestalHeight
    );

    // Pedestal top cap
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      pedestalTop - pedestalHeight,
      pedestalWidth,
      pedestalWidth * 0.25,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#7a7a8a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === WIND SWIRL (Level 3+) ===
    if (params.hasWindSwirl) {
      const cloudY = centerY - cellSize * 0.2;
      const swirlCount = 3;
      for (let i = 0; i < swirlCount; i++) {
        const swirlPhase = time * 0.002 + (i * Math.PI * 2) / swirlCount;
        const swirlRadius = cellSize * params.cloudScale * 0.4 * (0.8 + 0.2 * Math.sin(swirlPhase));
        const swirlAlpha = 0.15 * (level - 2) * 0.4;

        ctx.strokeStyle = `rgba(100, 120, 150, ${swirlAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, cloudY, swirlRadius, swirlPhase, swirlPhase + Math.PI * 0.7);
        ctx.stroke();
      }
    }

    // === STORM CLOUD ===
    const cloudY = centerY - cellSize * 0.2;
    const cloudWidth = cellSize * params.cloudScale * 0.5;
    const cloudHeight = cellSize * params.cloudScale * 0.2;

    // Draw cloud layers (darker in center)
    const cloudLayers = [
      { yOffset: 0, scale: 1.0, color: STORM_COLORS.cloudDark },
      { yOffset: -3, scale: 0.85, color: STORM_COLORS.cloudMid },
      { yOffset: -5, scale: 0.7, color: STORM_COLORS.cloudLight },
    ];

    for (let i = 0; i < Math.min(params.cloudLayers + 1, cloudLayers.length); i++) {
      const layer = cloudLayers[i];
      const layerWidth = cloudWidth * layer.scale;
      const layerHeight = cloudHeight * layer.scale;
      const wobble = Math.sin(time * 0.0015 + i) * 2;

      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.ellipse(
        centerX + wobble,
        cloudY + layer.yOffset,
        layerWidth,
        layerHeight,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Cloud internal glow from lightning
    const internalGlow = 0.15 + 0.1 * Math.sin(time * 0.008);
    const cloudGlow = ctx.createRadialGradient(
      centerX,
      cloudY,
      0,
      centerX,
      cloudY,
      cloudWidth
    );
    cloudGlow.addColorStop(0, `rgba(${STORM_COLORS.lightning}, ${internalGlow * params.glowIntensity})`);
    cloudGlow.addColorStop(0.5, `rgba(${STORM_COLORS.lightning}, ${internalGlow * params.glowIntensity * 0.3})`);
    cloudGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = cloudGlow;
    ctx.beginPath();
    ctx.ellipse(centerX, cloudY, cloudWidth, cloudHeight, 0, 0, Math.PI * 2);
    ctx.fill();

    // === EYE OF STORM (Level 5) ===
    if (params.hasEyeOfStorm) {
      const eyeRadius = cloudWidth * 0.2;
      const eyePulse = 0.6 + 0.2 * Math.sin(time * 0.004);

      // Eye glow
      const eyeGlow = ctx.createRadialGradient(
        centerX,
        cloudY,
        0,
        centerX,
        cloudY,
        eyeRadius * 2
      );
      eyeGlow.addColorStop(0, `rgba(${STORM_COLORS.lightningCore}, ${eyePulse})`);
      eyeGlow.addColorStop(0.5, `rgba(${STORM_COLORS.lightning}, ${eyePulse * 0.4})`);
      eyeGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = eyeGlow;
      ctx.beginPath();
      ctx.arc(centerX, cloudY, eyeRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Eye core
      const eyeCore = ctx.createRadialGradient(
        centerX - eyeRadius * 0.2,
        cloudY - eyeRadius * 0.2,
        0,
        centerX,
        cloudY,
        eyeRadius
      );
      eyeCore.addColorStop(0, '#ffffff');
      eyeCore.addColorStop(0.3, '#ddeeff');
      eyeCore.addColorStop(0.7, '#aaccff');
      eyeCore.addColorStop(1, '#88aadd');
      ctx.fillStyle = eyeCore;
      ctx.beginPath();
      ctx.arc(centerX, cloudY, eyeRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // === LIGHTNING SPARKS ===
    drawIdleLightning(ctx, centerX, cloudY, cloudWidth, cloudHeight, time, params);

    // === RAIN (Level 2+) ===
    if (params.hasRain) {
      const rainStartY = cloudY + cloudHeight;
      const rainEndY = centerY + baseRadius * 0.4;
      const rainHeight = rainEndY - rainStartY;

      ctx.strokeStyle = STORM_COLORS.rain;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      for (let i = 0; i < params.rainCount; i++) {
        const dropX = centerX + (seededRandom(i * 100) - 0.5) * cloudWidth * 1.6;
        const dropSpeed = 0.8 + seededRandom(i * 200) * 0.4;
        const dropLength = 3 + seededRandom(i * 300) * 4;
        const dropDelay = seededRandom(i * 400);

        const dropTime = ((time * 0.004 * dropSpeed + dropDelay) % 1);
        const dropY = rainStartY + dropTime * rainHeight;

        // Fade at top and bottom
        const verticalFade = Math.min(
          (dropY - rainStartY) / (rainHeight * 0.2),
          (rainEndY - dropY) / (rainHeight * 0.3),
          1
        );

        if (verticalFade > 0) {
          ctx.globalAlpha = verticalFade * 0.5;
          ctx.beginPath();
          ctx.moveTo(dropX, dropY);
          ctx.lineTo(dropX, dropY + dropLength);
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
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
    const cloudY = centerY - cellSize * 0.2;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw lightning bolt to target
    drawStormLightningBolt(ctx, centerX, cloudY, targetX, targetY, time, level);

    // Enhanced cloud glow when firing
    const cloudWidth = cellSize * params.cloudScale * 0.5;
    const firingGlowRadius = cloudWidth * 1.5;
    const firingGlow = ctx.createRadialGradient(
      centerX,
      cloudY,
      0,
      centerX,
      cloudY,
      firingGlowRadius
    );
    firingGlow.addColorStop(0, 'rgba(200, 220, 255, 0.7)');
    firingGlow.addColorStop(0.4, 'rgba(150, 180, 255, 0.4)');
    firingGlow.addColorStop(0.7, 'rgba(100, 150, 220, 0.2)');
    firingGlow.addColorStop(1, 'rgba(80, 120, 200, 0)');
    ctx.fillStyle = firingGlow;
    ctx.beginPath();
    ctx.arc(centerX, cloudY, firingGlowRadius, 0, Math.PI * 2);
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

    // Range circle fill (storm blue tint)
    ctx.fillStyle = `rgba(100, 140, 200, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(120, 160, 220, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawIdleLightning(
  ctx: CanvasRenderingContext2D,
  cloudX: number,
  cloudY: number,
  cloudWidth: number,
  cloudHeight: number,
  time: number,
  params: ReturnType<typeof getLevelParams>
): void {
  for (let i = 0; i < params.lightningCount; i++) {
    // Determine if this spark is active based on time
    const sparkCycle = (time * 0.003 + i * 1.7) % 1;
    if (sparkCycle > 0.15) continue; // Short flashes

    const sparkIntensity = params.sparkIntensity * (0.15 - sparkCycle) / 0.15;
    const startAngle = seededRandom(Math.floor(time * 0.01) + i * 100) * Math.PI * 2;
    const startRadius = cloudWidth * 0.6;
    const endRadius = cloudWidth * 0.9 + seededRandom(i * 50) * cloudWidth * 0.3;

    const startX = cloudX + Math.cos(startAngle) * startRadius * 0.5;
    const startY = cloudY + Math.sin(startAngle) * cloudHeight * 0.3;
    const endX = cloudX + Math.cos(startAngle) * endRadius;
    const endY = cloudY + cloudHeight * 0.5 + seededRandom(i * 60) * cloudHeight * 0.8;

    // Draw spark with glow layers
    const layers = [
      { width: 4, alpha: sparkIntensity * 0.3, color: STORM_COLORS.lightning },
      { width: 2, alpha: sparkIntensity * 0.6, color: STORM_COLORS.lightning },
      { width: 1, alpha: sparkIntensity, color: STORM_COLORS.lightningCore },
    ];

    for (const layer of layers) {
      ctx.strokeStyle = `rgba(${layer.color}, ${layer.alpha})`;
      ctx.lineWidth = layer.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);

      // Add jagged segments
      const midX = (startX + endX) / 2 + (seededRandom(i * 70) - 0.5) * 8;
      const midY = (startY + endY) / 2;
      ctx.lineTo(midX, midY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }
}

function drawStormLightningBolt(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  level: number
): void {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const perpX = -dy / distance;
  const perpY = dx / distance;

  const segments = 6 + Math.floor((level - 1) * 1.5);
  const widthMultiplier = 1 + (level - 1) * 0.2;
  const alphaBoost = (level - 1) * 0.05;

  // Draw multiple overlapping bolts for glow effect
  const boltLayers = [
    { width: 8 * widthMultiplier, alpha: 0.2 + alphaBoost, color: '100, 140, 200' },
    { width: 4 * widthMultiplier, alpha: 0.4 + alphaBoost, color: '150, 180, 230' },
    { width: 2 * widthMultiplier, alpha: 0.7 + alphaBoost, color: '200, 220, 255' },
    { width: 1 * widthMultiplier, alpha: 1.0, color: '240, 250, 255' },
  ];

  for (const layer of boltLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${Math.min(1, layer.alpha)})`;
    ctx.lineWidth = layer.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Generate jagged lightning path
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;

      // Displacement varies with time for animation
      const displacementScale = 0.1 + (level - 1) * 0.015;
      const displacement = Math.sin(time * 0.025 + i * 1.8) * distance * displacementScale;
      const offsetX = perpX * displacement;
      const offsetY = perpY * displacement;

      ctx.lineTo(baseX + offsetX, baseY + offsetY);
    }

    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Draw impact flash at target
  const impactRadius = 18 + (level - 1) * 4;
  const impactFlash = 0.7 + 0.3 * Math.sin(time * 0.015);
  const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactRadius);
  impactGradient.addColorStop(0, `rgba(220, 240, 255, ${impactFlash * 0.8})`);
  impactGradient.addColorStop(0.4, `rgba(150, 180, 230, ${impactFlash * 0.4})`);
  impactGradient.addColorStop(1, 'rgba(100, 140, 200, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();

  // Draw ground crackle effect
  const crackleCount = 3 + Math.floor(level / 2);
  for (let i = 0; i < crackleCount; i++) {
    const crackleAngle = (i / crackleCount) * Math.PI * 2 + time * 0.01;
    const crackleLength = impactRadius * (0.5 + 0.3 * Math.sin(time * 0.02 + i));
    const crackleEndX = endX + Math.cos(crackleAngle) * crackleLength;
    const crackleEndY = endY + Math.sin(crackleAngle) * crackleLength;

    ctx.strokeStyle = `rgba(${STORM_COLORS.lightningCore}, 0.5)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(crackleEndX, crackleEndY);
    ctx.stroke();
  }
}

export default StormTowerSprite;
