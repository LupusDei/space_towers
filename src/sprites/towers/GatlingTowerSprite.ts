// Gatling Tower Sprite - Multi-barrel rotary cannon
// Spinning barrel cluster with industrial military aesthetic
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    barrelCount: 4 + Math.floor((clampedLevel - 1) / 2), // 4, 4, 5, 5, 6
    barrelLength: 0.45 + (clampedLevel - 1) * 0.04,
    barrelWidth: 0.03 + (clampedLevel - 1) * 0.003,
    spinSpeed: 0.008 + (clampedLevel - 1) * 0.002, // Faster spin at higher levels
    muzzleFlashIntensity: 0.5 + (clampedLevel - 1) * 0.1,
    hasHeatVents: clampedLevel >= 2,
    hasAmmoFeed: clampedLevel >= 3,
    hasPowerCore: clampedLevel >= 4,
    hasShieldPlates: clampedLevel >= 5,
    metalBrightness: 1 + (clampedLevel - 1) * 0.08,
  };
}

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.34;

    // === AMBIENT POWER GLOW (Level 4+) ===
    if (params.hasPowerCore) {
      const glowIntensity = 0.1 + 0.05 * Math.sin(time * 0.004);
      const powerGlow = ctx.createRadialGradient(
        centerX,
        centerY - cellSize * 0.15,
        0,
        centerX,
        centerY - cellSize * 0.15,
        cellSize * 0.45
      );
      powerGlow.addColorStop(0, `rgba(255, 180, 50, ${glowIntensity})`);
      powerGlow.addColorStop(0.5, `rgba(255, 140, 30, ${glowIntensity * 0.5})`);
      powerGlow.addColorStop(1, 'rgba(200, 100, 20, 0)');
      ctx.fillStyle = powerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.15, cellSize * 0.45, 0, Math.PI * 2);
      ctx.fill();
    }

    // === BASE PLATFORM ===
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + 2,
      centerY + baseRadius * 0.65,
      baseRadius * 1.1,
      baseRadius * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Base with metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY,
      centerX + baseRadius,
      centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#4a5568');
    baseGradient.addColorStop(0.3, '#3d4555');
    baseGradient.addColorStop(0.7, '#2d3544');
    baseGradient.addColorStop(1, '#1d2534');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.55,
      baseRadius,
      baseRadius * 0.32,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Base rim
    ctx.strokeStyle = '#6a7588';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.55,
      baseRadius,
      baseRadius * 0.32,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.stroke();

    // Warning stripes on base
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.55,
      baseRadius * 0.85,
      baseRadius * 0.26,
      0,
      0,
      Math.PI * 2
    );
    ctx.clip();
    const stripeWidth = baseRadius * 0.12;
    ctx.fillStyle = '#cc8800';
    for (let i = -5; i <= 5; i += 2) {
      ctx.fillRect(
        centerX + i * stripeWidth - stripeWidth / 2,
        centerY + baseRadius * 0.3,
        stripeWidth,
        baseRadius * 0.25
      );
    }
    ctx.restore();

    // === CALCULATE ROTATION ===
    let rotationAngle = 0;
    if (tower.targetPosition) {
      const targetX = tower.targetPosition.x * cellSize + cellSize / 2;
      const targetY = tower.targetPosition.y * cellSize + cellSize / 2;
      rotationAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
    }

    // Save and apply rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // === MAIN HOUSING ===
    const housingHeight = cellSize * 0.22;
    const housingWidth = baseRadius * 0.7;
    const housingTop = centerY + baseRadius * 0.2;

    // Housing body
    const housingGradient = ctx.createLinearGradient(
      centerX - housingWidth,
      housingTop,
      centerX + housingWidth,
      housingTop
    );
    const brightness = params.metalBrightness;
    const m1 = Math.min(255, Math.floor(70 * brightness));
    const m2 = Math.min(255, Math.floor(90 * brightness));
    const m3 = Math.min(255, Math.floor(100 * brightness));
    housingGradient.addColorStop(0, `rgb(${m1}, ${m1 + 5}, ${m1 + 15})`);
    housingGradient.addColorStop(0.3, `rgb(${m2}, ${m2 + 5}, ${m2 + 15})`);
    housingGradient.addColorStop(0.5, `rgb(${m3}, ${m3 + 5}, ${m3 + 15})`);
    housingGradient.addColorStop(0.7, `rgb(${m2}, ${m2 + 5}, ${m2 + 15})`);
    housingGradient.addColorStop(1, `rgb(${m1}, ${m1 + 5}, ${m1 + 15})`);
    ctx.fillStyle = housingGradient;
    ctx.fillRect(
      centerX - housingWidth,
      housingTop - housingHeight,
      housingWidth * 2,
      housingHeight
    );

    // Housing top cap
    ctx.fillStyle = `rgb(${m2 + 10}, ${m2 + 15}, ${m2 + 25})`;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      housingTop - housingHeight,
      housingWidth,
      housingWidth * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = `rgb(${m3 + 20}, ${m3 + 25}, ${m3 + 35})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    // === HEAT VENTS (Level 2+) ===
    if (params.hasHeatVents) {
      const ventGlow = 0.3 + 0.15 * Math.sin(time * 0.005);
      [-1, 1].forEach((side) => {
        const ventX = centerX + side * housingWidth * 0.6;
        const ventY = housingTop - housingHeight * 0.5;

        // Vent slot
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(ventX - 3, ventY - 8, 6, 16);

        // Heat glow
        const heatGlow = ctx.createLinearGradient(ventX, ventY - 8, ventX, ventY + 8);
        heatGlow.addColorStop(0, `rgba(255, 150, 50, ${ventGlow})`);
        heatGlow.addColorStop(0.5, `rgba(255, 100, 30, ${ventGlow * 0.6})`);
        heatGlow.addColorStop(1, 'rgba(200, 50, 20, 0)');
        ctx.fillStyle = heatGlow;
        ctx.fillRect(ventX - 2, ventY - 7, 4, 14);
      });
    }

    // === AMMO FEED (Level 3+) ===
    if (params.hasAmmoFeed) {
      const feedX = centerX + housingWidth * 0.9;
      const feedY = housingTop - housingHeight * 0.3;

      // Feed tube
      ctx.fillStyle = '#3a3a4a';
      ctx.beginPath();
      ctx.moveTo(feedX, feedY);
      ctx.lineTo(feedX + cellSize * 0.12, feedY + cellSize * 0.08);
      ctx.lineTo(feedX + cellSize * 0.12, feedY + cellSize * 0.14);
      ctx.lineTo(feedX, feedY + cellSize * 0.06);
      ctx.closePath();
      ctx.fill();

      // Belt links (animated)
      ctx.fillStyle = '#aa8833';
      for (let i = 0; i < 3; i++) {
        const linkOffset = ((time * 0.003 + i * 0.3) % 1) * cellSize * 0.04;
        ctx.fillRect(
          feedX + cellSize * 0.02 + linkOffset,
          feedY + cellSize * 0.02,
          cellSize * 0.025,
          cellSize * 0.04
        );
      }
    }

    // === BARREL CLUSTER ===
    const barrelHubY = housingTop - housingHeight - cellSize * 0.05;
    const barrelHubRadius = housingWidth * 0.6;
    const barrelLength = cellSize * params.barrelLength;
    const barrelWidth = cellSize * params.barrelWidth;

    // Calculate barrel spin
    const spinAngle = time * params.spinSpeed;

    // Barrel hub (cylindrical mount)
    const hubGradient = ctx.createRadialGradient(
      centerX,
      barrelHubY,
      0,
      centerX,
      barrelHubY,
      barrelHubRadius
    );
    hubGradient.addColorStop(0, '#5a5a6a');
    hubGradient.addColorStop(0.7, '#4a4a5a');
    hubGradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = hubGradient;
    ctx.beginPath();
    ctx.arc(centerX, barrelHubY, barrelHubRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw barrels
    for (let i = 0; i < params.barrelCount; i++) {
      const angle = spinAngle + (i * Math.PI * 2) / params.barrelCount;
      const barrelOffsetX = Math.cos(angle) * barrelHubRadius * 0.5;
      const barrelOffsetY = Math.sin(angle) * barrelHubRadius * 0.3;
      const barrelStartX = centerX + barrelOffsetX;
      const barrelStartY = barrelHubY + barrelOffsetY;

      // Barrel shadow/depth
      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.beginPath();
      ctx.rect(
        barrelStartX - barrelWidth - 1,
        barrelStartY - barrelLength,
        barrelWidth * 2 + 2,
        barrelLength
      );
      ctx.fill();

      // Barrel body gradient
      const barrelGradient = ctx.createLinearGradient(
        barrelStartX - barrelWidth,
        barrelStartY,
        barrelStartX + barrelWidth,
        barrelStartY
      );
      const depthFactor = 0.7 + Math.sin(angle) * 0.3; // Depth shading based on rotation
      const b1 = Math.floor(120 * brightness * depthFactor);
      const b2 = Math.floor(160 * brightness * depthFactor);
      const b3 = Math.floor(180 * brightness * depthFactor);
      barrelGradient.addColorStop(0, `rgb(${b1}, ${b1}, ${b1 + 10})`);
      barrelGradient.addColorStop(0.3, `rgb(${b2}, ${b2}, ${b2 + 10})`);
      barrelGradient.addColorStop(0.5, `rgb(${b3}, ${b3}, ${b3 + 10})`);
      barrelGradient.addColorStop(0.7, `rgb(${b2}, ${b2}, ${b2 + 10})`);
      barrelGradient.addColorStop(1, `rgb(${b1}, ${b1}, ${b1 + 10})`);
      ctx.fillStyle = barrelGradient;
      ctx.fillRect(
        barrelStartX - barrelWidth,
        barrelStartY - barrelLength,
        barrelWidth * 2,
        barrelLength
      );

      // Barrel tip (darker muzzle)
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(
        barrelStartX - barrelWidth - 0.5,
        barrelStartY - barrelLength,
        barrelWidth * 2 + 1,
        cellSize * 0.02
      );

      // Barrel highlight
      ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * depthFactor})`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(barrelStartX - barrelWidth + 1, barrelStartY - barrelLength);
      ctx.lineTo(barrelStartX - barrelWidth + 1, barrelStartY);
      ctx.stroke();
    }

    // Center hub cap
    ctx.fillStyle = '#4a4a5a';
    ctx.beginPath();
    ctx.arc(centerX, barrelHubY, barrelHubRadius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(centerX, barrelHubY, barrelHubRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // === POWER CORE (Level 4+) ===
    if (params.hasPowerCore) {
      const coreY = housingTop - housingHeight * 0.5;
      const coreRadius = cellSize * 0.04;
      const corePulse = 0.7 + 0.3 * Math.sin(time * 0.006);

      // Core glow
      const coreGlow = ctx.createRadialGradient(
        centerX,
        coreY,
        0,
        centerX,
        coreY,
        coreRadius * 3
      );
      coreGlow.addColorStop(0, `rgba(255, 200, 100, ${corePulse})`);
      coreGlow.addColorStop(0.5, `rgba(255, 150, 50, ${corePulse * 0.4})`);
      coreGlow.addColorStop(1, 'rgba(200, 100, 30, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, coreY, coreRadius * 3, 0, Math.PI * 2);
      ctx.fill();

      // Core orb
      const coreOrb = ctx.createRadialGradient(
        centerX - coreRadius * 0.3,
        coreY - coreRadius * 0.3,
        0,
        centerX,
        coreY,
        coreRadius
      );
      coreOrb.addColorStop(0, '#ffffcc');
      coreOrb.addColorStop(0.5, '#ffcc66');
      coreOrb.addColorStop(1, '#ff9933');
      ctx.fillStyle = coreOrb;
      ctx.beginPath();
      ctx.arc(centerX, coreY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // === SHIELD PLATES (Level 5) ===
    if (params.hasShieldPlates) {
      const plateAlpha = 0.15 + 0.05 * Math.sin(time * 0.003);
      [-1, 1].forEach((side) => {
        ctx.fillStyle = `rgba(100, 180, 255, ${plateAlpha})`;
        ctx.beginPath();
        ctx.moveTo(centerX + side * housingWidth * 0.3, housingTop - housingHeight);
        ctx.lineTo(centerX + side * housingWidth * 1.2, housingTop - housingHeight * 0.7);
        ctx.lineTo(centerX + side * housingWidth * 1.2, housingTop);
        ctx.lineTo(centerX + side * housingWidth * 0.3, housingTop);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = `rgba(150, 200, 255, ${plateAlpha + 0.2})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

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
    const baseRadius = cellSize * 0.34;
    const housingHeight = cellSize * 0.22;
    const housingTop = centerY + baseRadius * 0.2;
    const barrelHubY = housingTop - housingHeight - cellSize * 0.05;
    const barrelHubRadius = baseRadius * 0.7 * 0.6;
    const barrelLength = cellSize * params.barrelLength;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Calculate rotation for muzzle flash positioning
    let rotationAngle = 0;
    if (tower.targetPosition) {
      const tgtX = tower.targetPosition.x * cellSize + cellSize / 2;
      const tgtY = tower.targetPosition.y * cellSize + cellSize / 2;
      rotationAngle = Math.atan2(tgtY - centerY, tgtX - centerX) + Math.PI / 2;
    }

    // Calculate barrel positions for muzzle flashes
    const spinAngle = time * params.spinSpeed;
    const firingBarrelIndex = Math.floor((time * 0.02) % params.barrelCount);

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // Muzzle flash on firing barrel
    const angle = spinAngle + (firingBarrelIndex * Math.PI * 2) / params.barrelCount;
    const barrelOffsetX = Math.cos(angle) * barrelHubRadius * 0.5;
    const barrelOffsetY = Math.sin(angle) * barrelHubRadius * 0.3;
    const muzzleX = centerX + barrelOffsetX;
    const muzzleY = barrelHubY + barrelOffsetY - barrelLength;

    // Muzzle flash
    const flashIntensity = params.muzzleFlashIntensity * (0.7 + 0.3 * Math.sin(time * 0.03));
    const flashRadius = cellSize * 0.08 * (1 + level * 0.1);

    const flashGradient = ctx.createRadialGradient(
      muzzleX,
      muzzleY,
      0,
      muzzleX,
      muzzleY,
      flashRadius
    );
    flashGradient.addColorStop(0, `rgba(255, 255, 200, ${flashIntensity})`);
    flashGradient.addColorStop(0.3, `rgba(255, 200, 100, ${flashIntensity * 0.7})`);
    flashGradient.addColorStop(0.6, `rgba(255, 150, 50, ${flashIntensity * 0.4})`);
    flashGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(muzzleX, muzzleY, flashRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw tracer beam to target
    drawGatlingTracer(ctx, centerX, barrelHubY - barrelLength, targetX, targetY, time, level);

    // Impact sparks
    const sparkCount = 2 + level;
    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = (time * 0.02 + i * 0.7) % (Math.PI * 2);
      const sparkDist = cellSize * 0.05 + Math.sin(time * 0.03 + i) * cellSize * 0.03;
      const sparkX = targetX + Math.cos(sparkAngle) * sparkDist;
      const sparkY = targetY + Math.sin(sparkAngle) * sparkDist;
      const sparkAlpha = 0.6 + 0.4 * Math.sin(time * 0.04 + i);

      ctx.fillStyle = `rgba(255, 220, 150, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    // Range circle fill (orange tint for gatling)
    ctx.fillStyle = `rgba(255, 180, 80, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(255, 200, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawGatlingTracer(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  _time: number,
  level: number = 1
): void {
  const baseWidth = 1 + (level - 1) * 0.2;

  // Tracer layers
  const tracerLayers = [
    { width: 4 * baseWidth, alpha: 0.2, color: '255, 200, 100' },
    { width: 2 * baseWidth, alpha: 0.5, color: '255, 220, 150' },
    { width: 1 * baseWidth, alpha: 0.9, color: '255, 255, 200' },
  ];

  for (const layer of tracerLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${layer.alpha})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Impact glow
  const impactRadius = 10 + level * 2;
  const impactGradient = ctx.createRadialGradient(
    endX,
    endY,
    0,
    endX,
    endY,
    impactRadius
  );
  impactGradient.addColorStop(0, 'rgba(255, 220, 150, 0.6)');
  impactGradient.addColorStop(0.5, 'rgba(255, 180, 100, 0.3)');
  impactGradient.addColorStop(1, 'rgba(200, 150, 80, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
