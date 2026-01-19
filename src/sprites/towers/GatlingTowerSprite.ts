// Gatling Tower Sprite - Multi-barrel rotary gun with spin-up mechanic
// Industrial military aesthetic with brass/orange glow
// Supports 5 visual tiers based on tower level
// Barrel rotation speed reflects spin-up progress

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';
import { combatModule } from '../../game/combat/CombatModule';

// Level-based color palettes
const LEVEL_COLORS = {
  1: { base: '#4a4035', accent: '#6a5a45', glow: '#ffaa44', highlight: '#8a7a5a', barrel: '#5a5045' },
  2: { base: '#554838', accent: '#756850', glow: '#ffbb55', highlight: '#9a8a68', barrel: '#655848' },
  3: { base: '#604f3a', accent: '#807560', glow: '#ffcc66', highlight: '#aa9a78', barrel: '#706050' },
  4: { base: '#6b5540', accent: '#8b8068', glow: '#ffdd77', highlight: '#bbaa88', barrel: '#7b6858' },
  5: { base: '#755c45', accent: '#958a70', glow: '#ffee88', highlight: '#ccbb98', barrel: '#8b7060' },
};

function getLevelColors(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level)) as 1 | 2 | 3 | 4 | 5;
  return LEVEL_COLORS[clampedLevel];
}

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const colors = getLevelColors(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Get spin progress from combat module (0-1)
    const spinProgress = combatModule.getGatlingSpinProgress(tower.id);
    // Base rotation speed + spin-up boost
    const rotationSpeed = 0.002 + spinProgress * 0.015;
    const barrelRotation = (time * rotationSpeed) % (Math.PI * 2);

    // === ROTATION TOWARD TARGET ===
    let aimAngle = 0;
    if (tower.targetPosition) {
      const targetX = tower.targetPosition.x + cellSize / 2;
      const targetY = tower.targetPosition.y + cellSize / 2;
      aimAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
    }

    // === BASE PLATFORM ===
    const baseWidth = cellSize * 0.38;
    const baseGradient = ctx.createLinearGradient(
      centerX - baseWidth,
      centerY + cellSize * 0.15,
      centerX - baseWidth,
      centerY + cellSize * 0.35
    );
    baseGradient.addColorStop(0, colors.base);
    baseGradient.addColorStop(0.3, '#3a3028');
    baseGradient.addColorStop(0.7, '#2a2520');
    baseGradient.addColorStop(1, '#3a3028');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.rect(centerX - baseWidth, centerY + cellSize * 0.15, baseWidth * 2, cellSize * 0.2);
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Base highlight
    ctx.strokeStyle = 'rgba(150, 130, 100, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - baseWidth, centerY + cellSize * 0.15);
    ctx.lineTo(centerX + baseWidth, centerY + cellSize * 0.15);
    ctx.stroke();

    // === AMMO DRUM (Level 2+) ===
    if (level >= 2) {
      drawAmmoDrum(ctx, centerX, centerY, cellSize, colors, level, time);
    }

    // Save context for rotation
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(aimAngle);
    ctx.translate(-centerX, -centerY);

    // === TURRET HOUSING ===
    const housingGradient = ctx.createLinearGradient(
      centerX - cellSize * 0.22,
      0,
      centerX + cellSize * 0.22,
      0
    );
    housingGradient.addColorStop(0, '#4a4038');
    housingGradient.addColorStop(0.2, '#5a5048');
    housingGradient.addColorStop(0.5, '#6a6058');
    housingGradient.addColorStop(0.8, '#5a5048');
    housingGradient.addColorStop(1, '#4a4038');
    ctx.fillStyle = housingGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, cellSize * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // === ROTATING BARREL ASSEMBLY ===
    const barrelCount = 4 + Math.floor(level / 2); // 4, 4, 5, 5, 6 barrels
    const barrelLength = cellSize * (0.32 + (level - 1) * 0.02);
    const barrelWidth = cellSize * 0.04;
    const barrelRadius = cellSize * 0.1;

    // Barrel shroud (outer ring that holds barrels)
    ctx.save();
    ctx.translate(centerX, centerY - cellSize * 0.15);
    ctx.rotate(barrelRotation);

    // Draw barrel shroud
    ctx.fillStyle = colors.barrel;
    ctx.beginPath();
    ctx.arc(0, 0, barrelRadius + barrelWidth, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw individual barrels
    for (let i = 0; i < barrelCount; i++) {
      const angle = (i / barrelCount) * Math.PI * 2;
      const bx = Math.cos(angle) * barrelRadius;
      const by = Math.sin(angle) * barrelRadius;

      // Barrel gradient
      const barrelGradient = ctx.createLinearGradient(
        bx - barrelWidth / 2,
        0,
        bx + barrelWidth / 2,
        0
      );
      barrelGradient.addColorStop(0, '#4a4540');
      barrelGradient.addColorStop(0.3, '#6a6560');
      barrelGradient.addColorStop(0.5, '#7a7570');
      barrelGradient.addColorStop(0.7, '#6a6560');
      barrelGradient.addColorStop(1, '#4a4540');

      ctx.fillStyle = barrelGradient;
      ctx.beginPath();
      ctx.rect(bx - barrelWidth / 2, by - barrelLength, barrelWidth, barrelLength);
      ctx.fill();

      // Barrel outline
      ctx.strokeStyle = colors.highlight;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      // Barrel tip (muzzle)
      ctx.fillStyle = '#3a3530';
      ctx.beginPath();
      ctx.arc(bx, by - barrelLength, barrelWidth / 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central spindle
    const spindleGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, barrelRadius * 0.5);
    spindleGradient.addColorStop(0, colors.highlight);
    spindleGradient.addColorStop(0.5, colors.accent);
    spindleGradient.addColorStop(1, colors.base);
    ctx.fillStyle = spindleGradient;
    ctx.beginPath();
    ctx.arc(0, 0, barrelRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore(); // Restore from barrel rotation

    // === HEAT GLOW (based on spin progress) ===
    if (spinProgress > 0.1) {
      const heatIntensity = spinProgress * 0.4;
      const heatGlow = ctx.createRadialGradient(
        centerX,
        centerY - cellSize * 0.15,
        0,
        centerX,
        centerY - cellSize * 0.15,
        cellSize * 0.25
      );
      heatGlow.addColorStop(0, `rgba(255, 150, 50, ${heatIntensity})`);
      heatGlow.addColorStop(0.5, `rgba(255, 100, 30, ${heatIntensity * 0.5})`);
      heatGlow.addColorStop(1, 'rgba(200, 50, 0, 0)');
      ctx.fillStyle = heatGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.15, cellSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // Restore from aim rotation

    // === POWER CORE (always visible, pulsing) ===
    const corePulse = 0.5 + 0.2 * Math.sin(time * 0.004) + spinProgress * 0.3;
    const coreGlow = ctx.createRadialGradient(
      centerX,
      centerY + cellSize * 0.05,
      0,
      centerX,
      centerY + cellSize * 0.05,
      cellSize * 0.15
    );
    coreGlow.addColorStop(0, `rgba(255, 200, 100, ${corePulse})`);
    coreGlow.addColorStop(0.5, `rgba(255, 150, 50, ${corePulse * 0.5})`);
    coreGlow.addColorStop(1, 'rgba(200, 100, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY + cellSize * 0.05, cellSize * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Core center
    const coreCenter = ctx.createRadialGradient(
      centerX,
      centerY + cellSize * 0.05,
      0,
      centerX,
      centerY + cellSize * 0.05,
      cellSize * 0.05
    );
    coreCenter.addColorStop(0, '#ffffff');
    coreCenter.addColorStop(0.4, colors.glow);
    coreCenter.addColorStop(1, colors.accent);
    ctx.fillStyle = coreCenter;
    ctx.beginPath();
    ctx.arc(centerX, centerY + cellSize * 0.05, cellSize * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // === RIVETS ===
    drawRivets(ctx, centerX, centerY, cellSize, colors, level);

    // === SPIN INDICATOR (Level 3+) ===
    if (level >= 3 && spinProgress > 0) {
      drawSpinIndicator(ctx, centerX, centerY, cellSize, spinProgress, colors);
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // Draw base tower first
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Calculate aim direction
    const targetX = target.x + cellSize / 2;
    const targetY = target.y + cellSize / 2;
    const aimAngle = Math.atan2(targetY - centerY, targetX - centerX);

    // Muzzle flash at barrel tips
    const spinProgress = combatModule.getGatlingSpinProgress(tower.id);
    const flashIntensity = 0.6 + 0.4 * Math.sin(time * 0.02) + spinProgress * 0.2;

    // Flash position (in front of barrels)
    const flashDist = cellSize * 0.45;
    const flashX = centerX + Math.cos(aimAngle - Math.PI / 2) * flashDist * 0.3;
    const flashY = centerY + Math.sin(aimAngle - Math.PI / 2) * flashDist;

    // Outer muzzle flash
    const flashSize = cellSize * 0.2;
    const outerFlash = ctx.createRadialGradient(
      flashX,
      flashY,
      0,
      flashX,
      flashY,
      flashSize
    );
    outerFlash.addColorStop(0, `rgba(255, 220, 150, ${flashIntensity})`);
    outerFlash.addColorStop(0.3, `rgba(255, 180, 80, ${flashIntensity * 0.6})`);
    outerFlash.addColorStop(0.6, `rgba(255, 100, 30, ${flashIntensity * 0.3})`);
    outerFlash.addColorStop(1, 'rgba(200, 50, 0, 0)');
    ctx.fillStyle = outerFlash;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
    ctx.fill();

    // Bright core flash
    const coreFlash = ctx.createRadialGradient(
      flashX,
      flashY,
      0,
      flashX,
      flashY,
      flashSize * 0.3
    );
    coreFlash.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
    coreFlash.addColorStop(0.5, `rgba(255, 240, 200, ${flashIntensity * 0.8})`);
    coreFlash.addColorStop(1, 'rgba(255, 200, 100, 0)');
    ctx.fillStyle = coreFlash;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashSize * 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Shell casing ejection particles (visual effect)
    const casingCount = 2;
    for (let i = 0; i < casingCount; i++) {
      const casingAge = ((time * 0.01 + i * 0.3) % 1);
      const casingX = centerX + Math.cos(aimAngle + Math.PI / 2) * cellSize * 0.2 * casingAge;
      const casingY = centerY - cellSize * 0.1 + casingAge * cellSize * 0.15;
      const casingAlpha = (1 - casingAge) * 0.6;

      ctx.fillStyle = `rgba(200, 180, 100, ${casingAlpha})`;
      ctx.beginPath();
      ctx.ellipse(casingX, casingY, 2, 4, aimAngle, 0, Math.PI * 2);
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

    // Range circle fill (orange/brass tint)
    ctx.fillStyle = `rgba(255, 180, 80, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(255, 180, 80, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

// Helper: Draw ammo drum
function drawAmmoDrum(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  colors: { base: string; accent: string; highlight: string },
  level: number,
  _time: number
): void {
  const drumX = centerX + cellSize * 0.28;
  const drumY = centerY + cellSize * 0.1;
  const drumRadius = cellSize * (0.08 + (level - 2) * 0.01);

  // Drum body
  const drumGradient = ctx.createLinearGradient(
    drumX - drumRadius,
    drumY,
    drumX + drumRadius,
    drumY
  );
  drumGradient.addColorStop(0, '#3a3530');
  drumGradient.addColorStop(0.3, '#5a5550');
  drumGradient.addColorStop(0.5, '#6a6560');
  drumGradient.addColorStop(0.7, '#5a5550');
  drumGradient.addColorStop(1, '#3a3530');
  ctx.fillStyle = drumGradient;
  ctx.beginPath();
  ctx.arc(drumX, drumY, drumRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = colors.highlight;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Drum connection line
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(drumX - drumRadius, drumY);
  ctx.lineTo(centerX + cellSize * 0.15, centerY);
  ctx.stroke();

  // Level 4+: Second drum
  if (level >= 4) {
    const drum2X = centerX - cellSize * 0.28;
    ctx.fillStyle = drumGradient;
    ctx.beginPath();
    ctx.arc(drum2X, drumY, drumRadius * 0.9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(drum2X + drumRadius * 0.9, drumY);
    ctx.lineTo(centerX - cellSize * 0.15, centerY);
    ctx.stroke();
  }
}

// Helper: Draw rivets
function drawRivets(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  colors: { highlight: string },
  level: number
): void {
  const rivetSize = cellSize * 0.02;
  const rivetPositions = [
    { x: centerX - cellSize * 0.32, y: centerY + cellSize * 0.2 },
    { x: centerX + cellSize * 0.32, y: centerY + cellSize * 0.2 },
    { x: centerX - cellSize * 0.32, y: centerY + cellSize * 0.3 },
    { x: centerX + cellSize * 0.32, y: centerY + cellSize * 0.3 },
  ];

  if (level >= 3) {
    rivetPositions.push(
      { x: centerX, y: centerY + cellSize * 0.32 }
    );
  }

  for (const rivet of rivetPositions) {
    ctx.fillStyle = colors.highlight;
    ctx.beginPath();
    ctx.arc(rivet.x, rivet.y, rivetSize, 0, Math.PI * 2);
    ctx.fill();
    // Rivet highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(rivet.x - rivetSize * 0.3, rivet.y - rivetSize * 0.3, rivetSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Helper: Draw spin-up indicator
function drawSpinIndicator(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  spinProgress: number,
  colors: { glow: string }
): void {
  // Arc showing spin-up progress
  const indicatorRadius = cellSize * 0.4;
  const startAngle = -Math.PI / 2;
  const endAngle = startAngle + spinProgress * Math.PI * 2;

  ctx.strokeStyle = colors.glow;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.5 + spinProgress * 0.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, indicatorRadius, startAngle, endAngle);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Spin indicator dots at full spin
  if (spinProgress > 0.8) {
    const dotCount = 4;
    for (let i = 0; i < dotCount; i++) {
      const dotAngle = startAngle + (i / dotCount) * Math.PI * 2;
      const dotX = centerX + Math.cos(dotAngle) * indicatorRadius;
      const dotY = centerY + Math.sin(dotAngle) * indicatorRadius;
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(dotX, dotY, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default GatlingTowerSprite;
