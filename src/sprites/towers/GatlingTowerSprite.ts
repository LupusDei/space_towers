// Gatling Tower Sprite - Multi-barrel rotating minigun
// Military industrial aesthetic with brass/steel coloring
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    barrelCount: 4 + Math.floor((clampedLevel - 1) / 2), // 4, 4, 5, 5, 6 barrels
    barrelLength: 0.5 + (clampedLevel - 1) * 0.04, // longer barrels
    rotationSpeed: 0.008 + (clampedLevel - 1) * 0.002, // faster spin
    muzzleFlashIntensity: 0.6 + (clampedLevel - 1) * 0.1,
    hasAmmoFeed: clampedLevel >= 2,
    hasHeatVents: clampedLevel >= 3,
    hasPowerCore: clampedLevel >= 4,
    hasOvercharger: clampedLevel >= 5,
    brassShine: 1 + (clampedLevel - 1) * 0.1,
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
    const baseRadius = cellSize * 0.35;

    // === ROTATION TOWARD TARGET ===
    let rotationAngle = 0;
    if (tower.targetPosition) {
      const targetX = tower.targetPosition.x * cellSize + cellSize / 2;
      const targetY = tower.targetPosition.y * cellSize + cellSize / 2;
      rotationAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
    }

    // === AMBIENT POWER GLOW (Level 4+) ===
    if (params.hasPowerCore) {
      const glowIntensity = 0.1 + 0.05 * Math.sin(time * 0.003);
      const powerGlow = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        cellSize * 0.6
      );
      powerGlow.addColorStop(0, `rgba(255, 200, 100, ${glowIntensity})`);
      powerGlow.addColorStop(0.5, `rgba(255, 150, 50, ${glowIntensity * 0.5})`);
      powerGlow.addColorStop(1, 'rgba(200, 100, 0, 0)');
      ctx.fillStyle = powerGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, cellSize * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    // === BASE PLATFORM ===
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
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

    // Base platform with military green/gray
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY,
      centerX + baseRadius,
      centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#4a5a4a');
    baseGradient.addColorStop(0.3, '#3a4a3a');
    baseGradient.addColorStop(0.7, '#2a3a2a');
    baseGradient.addColorStop(1, '#1a2a1a');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.55,
      baseRadius,
      baseRadius * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Base rim
    ctx.strokeStyle = '#6a7a6a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.55,
      baseRadius,
      baseRadius * 0.3,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.stroke();

    // === AMMO FEED (Level 2+) ===
    if (params.hasAmmoFeed) {
      const beltX = centerX - baseRadius * 0.7;
      const beltY = centerY + baseRadius * 0.2;
      const beltWidth = baseRadius * 0.25;
      const beltHeight = baseRadius * 0.4;

      // Ammo box
      ctx.fillStyle = '#3a4a3a';
      ctx.fillRect(beltX - beltWidth / 2, beltY, beltWidth, beltHeight);
      ctx.strokeStyle = '#5a6a5a';
      ctx.lineWidth = 1;
      ctx.strokeRect(beltX - beltWidth / 2, beltY, beltWidth, beltHeight);

      // Brass bullets visible
      const bulletCount = 3;
      for (let i = 0; i < bulletCount; i++) {
        const bulletY = beltY + beltHeight * 0.2 + i * beltHeight * 0.25;
        ctx.fillStyle = `rgb(${180 + i * 10}, ${140 + i * 10}, ${60 + i * 10})`;
        ctx.beginPath();
        ctx.ellipse(beltX, bulletY, beltWidth * 0.3, beltWidth * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // === MOUNTING HOUSING ===
    const housingWidth = baseRadius * 0.6;
    const housingHeight = cellSize * 0.15;
    const housingY = centerY + baseRadius * 0.2;

    const housingGradient = ctx.createLinearGradient(
      centerX - housingWidth,
      housingY,
      centerX + housingWidth,
      housingY
    );
    housingGradient.addColorStop(0, '#3a3a4a');
    housingGradient.addColorStop(0.3, '#5a5a6a');
    housingGradient.addColorStop(0.7, '#5a5a6a');
    housingGradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = housingGradient;
    ctx.fillRect(
      centerX - housingWidth,
      housingY - housingHeight,
      housingWidth * 2,
      housingHeight
    );

    // === BARREL ASSEMBLY ===
    const barrelRadius = baseRadius * 0.45;
    const barrelLength = cellSize * params.barrelLength;
    const barrelAssemblyY = housingY - housingHeight;

    // Barrel rotation (continuous spin)
    const barrelSpin = time * params.rotationSpeed;

    // Central barrel housing (cylinder)
    const cylGradient = ctx.createLinearGradient(
      centerX - barrelRadius,
      barrelAssemblyY,
      centerX + barrelRadius,
      barrelAssemblyY
    );
    cylGradient.addColorStop(0, '#4a4a5a');
    cylGradient.addColorStop(0.3, '#6a6a7a');
    cylGradient.addColorStop(0.5, '#7a7a8a');
    cylGradient.addColorStop(0.7, '#6a6a7a');
    cylGradient.addColorStop(1, '#4a4a5a');
    ctx.fillStyle = cylGradient;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      barrelAssemblyY,
      barrelRadius,
      barrelRadius * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Draw individual barrels
    const barrelCount = params.barrelCount;
    for (let i = 0; i < barrelCount; i++) {
      const angle = (i / barrelCount) * Math.PI * 2 + barrelSpin;
      const barrelOffsetX = Math.sin(angle) * barrelRadius * 0.6;
      const barrelOffsetY = Math.cos(angle) * barrelRadius * 0.2;
      const barrelStartY = barrelAssemblyY + barrelOffsetY;
      const barrelEndY = barrelStartY - barrelLength;

      // Barrel depth (darker if behind)
      const depth = Math.cos(angle);
      const brightness = 0.7 + depth * 0.3;

      // Barrel body gradient
      const barrelGradient = ctx.createLinearGradient(
        centerX + barrelOffsetX - 3,
        barrelStartY,
        centerX + barrelOffsetX + 3,
        barrelStartY
      );
      const r = Math.floor(90 * brightness * params.brassShine);
      const g = Math.floor(85 * brightness * params.brassShine);
      const b = Math.floor(80 * brightness);
      barrelGradient.addColorStop(0, `rgb(${r - 20}, ${g - 20}, ${b - 20})`);
      barrelGradient.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
      barrelGradient.addColorStop(0.7, `rgb(${r + 10}, ${g + 10}, ${b + 10})`);
      barrelGradient.addColorStop(1, `rgb(${r - 20}, ${g - 20}, ${b - 20})`);

      ctx.fillStyle = barrelGradient;
      ctx.beginPath();
      ctx.moveTo(centerX + barrelOffsetX - 3, barrelStartY);
      ctx.lineTo(centerX + barrelOffsetX - 2, barrelEndY);
      ctx.lineTo(centerX + barrelOffsetX + 2, barrelEndY);
      ctx.lineTo(centerX + barrelOffsetX + 3, barrelStartY);
      ctx.closePath();
      ctx.fill();

      // Barrel tip (muzzle)
      ctx.fillStyle = `rgb(${Math.floor(40 * brightness)}, ${Math.floor(40 * brightness)}, ${Math.floor(45 * brightness)})`;
      ctx.beginPath();
      ctx.arc(centerX + barrelOffsetX, barrelEndY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central spindle
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.moveTo(centerX - 2, barrelAssemblyY);
    ctx.lineTo(centerX - 1.5, barrelAssemblyY - barrelLength * 0.7);
    ctx.lineTo(centerX + 1.5, barrelAssemblyY - barrelLength * 0.7);
    ctx.lineTo(centerX + 2, barrelAssemblyY);
    ctx.closePath();
    ctx.fill();

    // === HEAT VENTS (Level 3+) ===
    if (params.hasHeatVents) {
      const ventY = barrelAssemblyY - barrelLength * 0.3;
      const heatGlow = 0.3 + 0.1 * Math.sin(time * 0.005);

      // Side vents
      [-1, 1].forEach((side) => {
        const ventX = centerX + side * barrelRadius * 0.8;
        ctx.fillStyle = `rgba(255, 150, 50, ${heatGlow})`;
        ctx.fillRect(ventX - 2, ventY - 4, 4, 8);
        ctx.fillStyle = `rgba(255, 200, 100, ${heatGlow * 0.5})`;
        ctx.fillRect(ventX - 1, ventY - 3, 2, 6);
      });
    }

    // === OVERCHARGER (Level 5) ===
    if (params.hasOvercharger) {
      const chargerY = barrelAssemblyY - barrelLength * 0.15;
      const pulseIntensity = 0.6 + 0.3 * Math.sin(time * 0.006);

      // Energy ring
      ctx.strokeStyle = `rgba(255, 200, 100, ${pulseIntensity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, chargerY, barrelRadius * 0.5, barrelRadius * 0.15, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Inner glow
      const chargerGlow = ctx.createRadialGradient(
        centerX,
        chargerY,
        0,
        centerX,
        chargerY,
        barrelRadius * 0.4
      );
      chargerGlow.addColorStop(0, `rgba(255, 220, 150, ${pulseIntensity * 0.4})`);
      chargerGlow.addColorStop(0.5, `rgba(255, 180, 100, ${pulseIntensity * 0.2})`);
      chargerGlow.addColorStop(1, 'rgba(200, 150, 50, 0)');
      ctx.fillStyle = chargerGlow;
      ctx.beginPath();
      ctx.ellipse(centerX, chargerY, barrelRadius * 0.4, barrelRadius * 0.12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Restore context
    ctx.restore();
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    // Draw base tower
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Calculate muzzle position
    const barrelLength = cellSize * params.barrelLength;
    const baseRadius = cellSize * 0.35;
    const housingHeight = cellSize * 0.15;
    const barrelAssemblyY = centerY + baseRadius * 0.2 - housingHeight;
    const muzzleY = barrelAssemblyY - barrelLength;

    // Apply rotation to find muzzle position
    let rotationAngle = 0;
    if (tower.targetPosition) {
      const tgtX = tower.targetPosition.x * cellSize + cellSize / 2;
      const tgtY = tower.targetPosition.y * cellSize + cellSize / 2;
      rotationAngle = Math.atan2(tgtY - centerY, tgtX - centerX) + Math.PI / 2;
    }

    const muzzleDist = centerY - muzzleY;
    const muzzleX = centerX + Math.sin(rotationAngle) * muzzleDist;
    const actualMuzzleY = centerY - Math.cos(rotationAngle) * muzzleDist;

    // === MUZZLE FLASH ===
    const flashIntensity = params.muzzleFlashIntensity;
    const flashPhase = (time * 0.03) % 1;
    const flashSize = cellSize * 0.15 * (1 + flashPhase * 0.3);

    // Outer flash
    const flashGradient = ctx.createRadialGradient(
      muzzleX,
      actualMuzzleY,
      0,
      muzzleX,
      actualMuzzleY,
      flashSize * 1.5
    );
    flashGradient.addColorStop(0, `rgba(255, 255, 200, ${flashIntensity})`);
    flashGradient.addColorStop(0.3, `rgba(255, 200, 100, ${flashIntensity * 0.6})`);
    flashGradient.addColorStop(0.6, `rgba(255, 150, 50, ${flashIntensity * 0.3})`);
    flashGradient.addColorStop(1, 'rgba(200, 100, 0, 0)');
    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(muzzleX, actualMuzzleY, flashSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core flash
    ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
    ctx.beginPath();
    ctx.arc(muzzleX, actualMuzzleY, flashSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // === BULLET TRACER ===
    drawBulletTracer(ctx, muzzleX, actualMuzzleY, targetX, targetY, time, level);

    // === SHELL CASINGS (visual flair) ===
    const casingPhase = (time * 0.02) % 1;
    if (casingPhase < 0.5) {
      const casingX = centerX + Math.cos(rotationAngle + Math.PI / 2) * 8;
      const casingY = centerY - Math.sin(rotationAngle + Math.PI / 2) * 8 - casingPhase * 20;
      const casingAlpha = 1 - casingPhase * 2;

      ctx.fillStyle = `rgba(180, 140, 60, ${casingAlpha})`;
      ctx.beginPath();
      ctx.ellipse(casingX, casingY, 2, 4, casingPhase * Math.PI, 0, Math.PI * 2);
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

    // Range circle fill (brass/gold tint)
    ctx.fillStyle = `rgba(200, 160, 80, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(220, 180, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawBulletTracer(
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

  // Multiple tracers for rapid fire effect
  const tracerCount = 2 + Math.floor(level / 2);

  for (let i = 0; i < tracerCount; i++) {
    const phase = ((time * 0.015 + i * 0.3) % 1);
    const tracerX = startX + dx * phase;
    const tracerY = startY + dy * phase;

    // Tracer glow
    const tracerGradient = ctx.createRadialGradient(
      tracerX,
      tracerY,
      0,
      tracerX,
      tracerY,
      6 + level
    );
    tracerGradient.addColorStop(0, 'rgba(255, 220, 150, 0.8)');
    tracerGradient.addColorStop(0.5, 'rgba(255, 180, 100, 0.4)');
    tracerGradient.addColorStop(1, 'rgba(200, 150, 50, 0)');
    ctx.fillStyle = tracerGradient;
    ctx.beginPath();
    ctx.arc(tracerX, tracerY, 6 + level, 0, Math.PI * 2);
    ctx.fill();

    // Tracer core
    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.beginPath();
    ctx.arc(tracerX, tracerY, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tracer line (faint)
  ctx.strokeStyle = 'rgba(255, 200, 100, 0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  // Impact sparks
  const sparkCount = 3 + level;
  for (let i = 0; i < sparkCount; i++) {
    const sparkPhase = ((time * 0.02 + i * 0.15) % 1);
    const sparkAngle = (i / sparkCount) * Math.PI * 2 + time * 0.01;
    const sparkDist = 8 * sparkPhase;
    const sparkX = endX + Math.cos(sparkAngle) * sparkDist;
    const sparkY = endY + Math.sin(sparkAngle) * sparkDist;
    const sparkAlpha = (1 - sparkPhase) * 0.6;

    ctx.fillStyle = `rgba(255, 200, 100, ${sparkAlpha})`;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Impact glow
  const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, 10 + level * 2);
  impactGradient.addColorStop(0, 'rgba(255, 200, 100, 0.5)');
  impactGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.25)');
  impactGradient.addColorStop(1, 'rgba(200, 100, 0, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, 10 + level * 2, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
