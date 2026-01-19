// Gatling Tower Sprite - Multi-barrel rotary cannon
// Features spinning barrels and continuous muzzle flash
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    barrelCount: 4 + Math.floor((clampedLevel - 1) / 2), // 4, 4, 5, 5, 6
    barrelLength: 0.45 + (clampedLevel - 1) * 0.04, // longer barrels
    barrelWidth: 0.025 + (clampedLevel - 1) * 0.003, // thicker barrels
    spinSpeed: 0.008 + (clampedLevel - 1) * 0.002, // faster spin
    muzzleFlashSize: 0.12 + (clampedLevel - 1) * 0.025, // larger flash
    hasHeatVents: clampedLevel >= 2, // cooling vents at level 2+
    hasAmmoFeed: clampedLevel >= 3, // visible ammo belt at level 3+
    hasShieldPlate: clampedLevel >= 4, // armor plate at level 4+
    hasOvercharger: clampedLevel >= 5, // energy coils at level 5
    metalBrightness: 1 + (clampedLevel - 1) * 0.06,
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

    // === BASE PLATFORM ===
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + 2,
      centerY + baseRadius * 0.6,
      baseRadius * 1.05,
      baseRadius * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Base platform with industrial gradient
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
      centerY + baseRadius * 0.5,
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
      centerY + baseRadius * 0.5,
      baseRadius,
      baseRadius * 0.3,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.stroke();

    // === ROTATION TOWARD TARGET ===
    let rotationAngle = 0;
    if (tower.targetPosition) {
      const targetX = tower.targetPosition.x * cellSize + cellSize / 2;
      const targetY = tower.targetPosition.y * cellSize + cellSize / 2;
      rotationAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
    }

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // === TURRET HOUSING ===
    const housingWidth = baseRadius * 0.65;
    const housingHeight = cellSize * 0.18;
    const housingY = centerY + baseRadius * 0.1;

    // Housing body
    const housingGradient = ctx.createLinearGradient(
      centerX - housingWidth,
      housingY,
      centerX + housingWidth,
      housingY
    );
    housingGradient.addColorStop(0, '#3a3a4a');
    housingGradient.addColorStop(0.3, '#5a5a6a');
    housingGradient.addColorStop(0.5, '#6a6a7a');
    housingGradient.addColorStop(0.7, '#5a5a6a');
    housingGradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = housingGradient;
    ctx.fillRect(
      centerX - housingWidth,
      housingY - housingHeight,
      housingWidth * 2,
      housingHeight
    );

    // Housing top
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      housingY - housingHeight,
      housingWidth,
      housingWidth * 0.2,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // === SHIELD PLATE (Level 4+) ===
    if (params.hasShieldPlate) {
      const plateWidth = housingWidth * 0.6;
      const plateHeight = cellSize * 0.08;
      const plateY = housingY - housingHeight - cellSize * 0.02;

      ctx.fillStyle = '#5a6a7a';
      ctx.beginPath();
      ctx.moveTo(centerX - plateWidth, plateY);
      ctx.lineTo(centerX - plateWidth * 0.8, plateY - plateHeight);
      ctx.lineTo(centerX + plateWidth * 0.8, plateY - plateHeight);
      ctx.lineTo(centerX + plateWidth, plateY);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#7a8a9a';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // === BARREL ASSEMBLY ===
    const barrelAssemblyY = housingY - housingHeight - cellSize * 0.05;
    const barrelAssemblyRadius = housingWidth * 0.5;
    const barrelLength = cellSize * params.barrelLength;
    const barrelWidth = cellSize * params.barrelWidth;

    // Barrel rotation (spins continuously, faster when targeting)
    const spinMultiplier = tower.target ? 2 : 0.5;
    const barrelRotation = time * params.spinSpeed * spinMultiplier;

    // Draw barrel ring (the rotating mount)
    ctx.fillStyle = '#4a4a5a';
    ctx.beginPath();
    ctx.arc(centerX, barrelAssemblyY, barrelAssemblyRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#6a6a7a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw individual barrels
    const brightness = params.metalBrightness;
    for (let i = 0; i < params.barrelCount; i++) {
      const angle = barrelRotation + (i * Math.PI * 2) / params.barrelCount;
      const barrelX = centerX + Math.sin(angle) * barrelAssemblyRadius * 0.6;
      const barrelBaseY = barrelAssemblyY + Math.cos(angle) * barrelAssemblyRadius * 0.15;
      const barrelTipY = barrelBaseY - barrelLength;

      // Barrel gradient
      const barrelGradient = ctx.createLinearGradient(
        barrelX - barrelWidth * 2,
        barrelBaseY,
        barrelX + barrelWidth * 2,
        barrelBaseY
      );
      const m1 = Math.min(255, Math.floor(100 * brightness));
      const m2 = Math.min(255, Math.floor(140 * brightness));
      const m3 = Math.min(255, Math.floor(160 * brightness));
      barrelGradient.addColorStop(0, `rgb(${m1}, ${m1}, ${m1 + 10})`);
      barrelGradient.addColorStop(0.3, `rgb(${m2}, ${m2}, ${m2 + 10})`);
      barrelGradient.addColorStop(0.5, `rgb(${m3}, ${m3}, ${m3 + 5})`);
      barrelGradient.addColorStop(0.7, `rgb(${m2}, ${m2}, ${m2 + 10})`);
      barrelGradient.addColorStop(1, `rgb(${m1}, ${m1}, ${m1 + 10})`);

      ctx.fillStyle = barrelGradient;
      ctx.fillRect(
        barrelX - barrelWidth,
        barrelTipY,
        barrelWidth * 2,
        barrelLength
      );

      // Barrel bore (dark circle at tip)
      ctx.fillStyle = '#1a1a2a';
      ctx.beginPath();
      ctx.arc(barrelX, barrelTipY, barrelWidth * 0.6, 0, Math.PI * 2);
      ctx.fill();

      // Barrel highlight
      ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(barrelX - barrelWidth + 1, barrelBaseY);
      ctx.lineTo(barrelX - barrelWidth + 1, barrelTipY);
      ctx.stroke();
    }

    // === HEAT VENTS (Level 2+) ===
    if (params.hasHeatVents) {
      const ventGlow = 0.3 + 0.1 * Math.sin(time * 0.003);
      ctx.fillStyle = `rgba(255, 100, 50, ${ventGlow})`;

      [-1, 1].forEach((side) => {
        ctx.beginPath();
        ctx.arc(
          centerX + side * housingWidth * 0.7,
          housingY - housingHeight * 0.5,
          cellSize * 0.025,
          0,
          Math.PI * 2
        );
        ctx.fill();
      });
    }

    // === AMMO FEED (Level 3+) ===
    if (params.hasAmmoFeed) {
      const feedX = centerX + housingWidth * 0.8;
      const feedY = housingY - housingHeight * 0.3;

      ctx.fillStyle = '#8a7a50';
      ctx.fillRect(feedX, feedY - cellSize * 0.08, cellSize * 0.06, cellSize * 0.16);

      // Ammo belt links
      ctx.fillStyle = '#aa9a60';
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(feedX, feedY - cellSize * 0.06 + i * cellSize * 0.04, cellSize * 0.06, cellSize * 0.02);
      }
    }

    // === OVERCHARGER COILS (Level 5) ===
    if (params.hasOvercharger) {
      const coilPulse = 0.5 + 0.3 * Math.sin(time * 0.005);
      const coilGlow = ctx.createRadialGradient(
        centerX,
        barrelAssemblyY,
        0,
        centerX,
        barrelAssemblyY,
        barrelAssemblyRadius * 1.5
      );
      coilGlow.addColorStop(0, `rgba(100, 200, 255, ${coilPulse * 0.3})`);
      coilGlow.addColorStop(0.5, `rgba(50, 150, 255, ${coilPulse * 0.15})`);
      coilGlow.addColorStop(1, 'rgba(30, 100, 200, 0)');
      ctx.fillStyle = coilGlow;
      ctx.beginPath();
      ctx.arc(centerX, barrelAssemblyY, barrelAssemblyRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Energy rings
      ctx.strokeStyle = `rgba(100, 200, 255, ${coilPulse * 0.5})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(centerX, barrelAssemblyY - barrelLength * 0.3, barrelAssemblyRadius * 0.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Central spindle
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.arc(centerX, barrelAssemblyY, barrelAssemblyRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();

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
    const baseRadius = cellSize * 0.35;
    const housingHeight = cellSize * 0.18;
    const housingY = centerY + baseRadius * 0.1;
    const barrelAssemblyY = housingY - housingHeight - cellSize * 0.05;
    const barrelLength = cellSize * params.barrelLength;
    const muzzleY = barrelAssemblyY - barrelLength;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw tracer rounds (multiple thin lines for rapid fire effect)
    const tracerCount = 2 + Math.floor(level / 2);
    for (let i = 0; i < tracerCount; i++) {
      const offset = (Math.sin(time * 0.05 + i * 1.7) * cellSize * 0.02);
      const alpha = 0.4 + (Math.sin(time * 0.03 + i * 2.1) + 1) * 0.3;

      // Tracer glow
      ctx.strokeStyle = `rgba(255, 200, 100, ${alpha * 0.3})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX + offset, muzzleY);
      ctx.lineTo(targetX + offset * 0.5, targetY);
      ctx.stroke();

      // Tracer core
      ctx.strokeStyle = `rgba(255, 255, 200, ${alpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(centerX + offset, muzzleY);
      ctx.lineTo(targetX + offset * 0.5, targetY);
      ctx.stroke();
    }

    // Muzzle flash (multiple barrel flashes)
    const flashSize = cellSize * params.muzzleFlashSize;
    const flashPhase = (time * 0.02) % 1;
    const flashIntensity = 0.6 + 0.4 * Math.sin(flashPhase * Math.PI * 2 * 3);

    // Outer flash glow
    const outerFlash = ctx.createRadialGradient(
      centerX,
      muzzleY,
      0,
      centerX,
      muzzleY,
      flashSize * 1.5
    );
    outerFlash.addColorStop(0, `rgba(255, 200, 100, ${flashIntensity * 0.6})`);
    outerFlash.addColorStop(0.5, `rgba(255, 150, 50, ${flashIntensity * 0.3})`);
    outerFlash.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = outerFlash;
    ctx.beginPath();
    ctx.arc(centerX, muzzleY, flashSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core flash
    const coreFlash = ctx.createRadialGradient(
      centerX,
      muzzleY,
      0,
      centerX,
      muzzleY,
      flashSize
    );
    coreFlash.addColorStop(0, `rgba(255, 255, 220, ${flashIntensity})`);
    coreFlash.addColorStop(0.3, `rgba(255, 220, 150, ${flashIntensity * 0.8})`);
    coreFlash.addColorStop(0.6, `rgba(255, 180, 100, ${flashIntensity * 0.4})`);
    coreFlash.addColorStop(1, 'rgba(255, 150, 80, 0)');
    ctx.fillStyle = coreFlash;
    ctx.beginPath();
    ctx.arc(centerX, muzzleY, flashSize, 0, Math.PI * 2);
    ctx.fill();

    // Impact sparks at target
    const impactRadius = 8 + level * 2;
    const impactGradient = ctx.createRadialGradient(
      targetX,
      targetY,
      0,
      targetX,
      targetY,
      impactRadius
    );
    impactGradient.addColorStop(0, `rgba(255, 200, 100, ${flashIntensity * 0.8})`);
    impactGradient.addColorStop(0.5, `rgba(255, 150, 50, ${flashIntensity * 0.4})`);
    impactGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');
    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(targetX, targetY, impactRadius, 0, Math.PI * 2);
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

export default GatlingTowerSprite;
