// Gatling Tower Sprite - Multi-barrel rotating gatling gun
// Industrial military aesthetic with rotating barrel assembly
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes
const LEVEL_COLORS = [
  // Level 1 - Basic gunmetal
  { primary: '#5a5a5a', secondary: '#3a3a3a', accent: '#8a7a5a', glow: 'rgba(255, 200, 100, 0.3)' },
  // Level 2 - Polished steel
  { primary: '#6a6a6a', secondary: '#4a4a4a', accent: '#aa9a6a', glow: 'rgba(255, 210, 120, 0.4)' },
  // Level 3 - Brass accents
  { primary: '#7a7a7a', secondary: '#5a5a5a', accent: '#ccaa55', glow: 'rgba(255, 220, 140, 0.5)' },
  // Level 4 - Gold trim
  { primary: '#8a8a8a', secondary: '#6a6a6a', accent: '#ddbb66', glow: 'rgba(255, 230, 160, 0.6)' },
  // Level 5 - Elite chrome with gold
  { primary: '#9a9a9a', secondary: '#7a7a7a', accent: '#eedd88', glow: 'rgba(255, 240, 180, 0.7)' },
];

// Number of barrels in the gatling assembly
const BARREL_COUNT = 6;

/**
 * Calculate barrel rotation based on time and level.
 * Higher levels spin faster.
 */
function getBarrelRotation(time: number, level: number, isFiring: boolean): number {
  const baseSpeed = isFiring ? 8 : 0.3;
  const levelBonus = level * (isFiring ? 1.5 : 0.1);
  return time * (baseSpeed + levelBonus);
}

/**
 * Calculate turret rotation toward target.
 */
function calculateTurretAngle(
  tower: Tower,
  centerX: number,
  centerY: number,
  cellSize: number
): number {
  if (tower.targetPosition) {
    const targetCenterX = tower.targetPosition.x * cellSize + cellSize / 2;
    const targetCenterY = tower.targetPosition.y * cellSize + cellSize / 2;
    const dx = targetCenterX - centerX;
    const dy = targetCenterY - centerY;
    return Math.atan2(dy, dx) + Math.PI / 2;
  }
  return 0;
}

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    const turretAngle = calculateTurretAngle(tower, centerX, centerY, cellSize);
    const barrelRotation = getBarrelRotation(time, level, false);

    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurretAssembly(ctx, centerX, centerY, cellSize, level, colors, turretAngle, barrelRotation);

    if (level >= 3) {
      drawAmbientGlow(ctx, centerX, centerY, cellSize, time, level, colors);
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    const turretAngle = calculateTurretAngle(tower, centerX, centerY, cellSize);
    const barrelRotation = getBarrelRotation(time, level, true);

    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurretAssembly(ctx, centerX, centerY, cellSize, level, colors, turretAngle, barrelRotation);
    drawMuzzleFlash(ctx, centerX, centerY, cellSize, level, colors, turretAngle, time);
    drawBulletTracer(ctx, centerX, centerY, target, cellSize, level, colors, turretAngle, time);

    if (level >= 3) {
      drawAmbientGlow(ctx, centerX, centerY, cellSize, time, level, colors);
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

    ctx.fillStyle = `rgba(255, 200, 100, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 200, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawBase(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.36 * sizeMultiplier;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(centerX + 2, centerY + 2, baseRadius, baseRadius * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Base platform - industrial metal
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#4a4a4a');
  baseGradient.addColorStop(0.5, '#3a3a3a');
  baseGradient.addColorStop(1, '#2a2a2a');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1 + level * 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Ammunition belt decoration (level 2+)
  if (level >= 2) {
    const beltRadius = baseRadius * 0.75;
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, beltRadius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Rivets
  const rivetCount = 6 + level;
  const rivetRadius = baseRadius * 0.06;
  const rivetDistance = baseRadius * 0.85;

  for (let i = 0; i < rivetCount; i++) {
    const angle = (i / rivetCount) * Math.PI * 2;
    const rx = centerX + Math.cos(angle) * rivetDistance;
    const ry = centerY + Math.sin(angle) * rivetDistance;

    // Rivet shadow
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(rx, ry, rivetRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Rivet head
    const rivetGradient = ctx.createRadialGradient(
      rx - rivetRadius * 0.3,
      ry - rivetRadius * 0.3,
      0,
      rx,
      ry,
      rivetRadius
    );
    rivetGradient.addColorStop(0, '#6a6a6a');
    rivetGradient.addColorStop(1, '#3a3a3a');
    ctx.fillStyle = rivetGradient;
    ctx.beginPath();
    ctx.arc(rx, ry, rivetRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 4+ accent ring
  if (level >= 4) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTurretAssembly(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  turretAngle: number,
  barrelRotation: number
): void {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(turretAngle);

  // Turret housing
  const housingSize = cellSize * (0.22 + level * 0.01);
  const housingGradient = ctx.createRadialGradient(
    -housingSize * 0.2,
    -housingSize * 0.2,
    0,
    0,
    0,
    housingSize
  );
  housingGradient.addColorStop(0, colors.primary);
  housingGradient.addColorStop(0.6, colors.secondary);
  housingGradient.addColorStop(1, '#2a2a2a');

  ctx.fillStyle = housingGradient;
  ctx.beginPath();
  ctx.arc(0, 0, housingSize, 0, Math.PI * 2);
  ctx.fill();

  // Housing rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1 + level * 0.2;
  ctx.beginPath();
  ctx.arc(0, 0, housingSize, 0, Math.PI * 2);
  ctx.stroke();

  // Draw rotating barrel assembly
  drawBarrelAssembly(ctx, cellSize, level, colors, barrelRotation);

  // Central hub
  const hubSize = cellSize * (0.06 + level * 0.005);
  const hubGradient = ctx.createRadialGradient(
    -hubSize * 0.3,
    -hubSize * 0.3,
    0,
    0,
    0,
    hubSize
  );
  hubGradient.addColorStop(0, colors.accent);
  hubGradient.addColorStop(0.5, '#8a7a5a');
  hubGradient.addColorStop(1, '#5a4a3a');

  ctx.fillStyle = hubGradient;
  ctx.beginPath();
  ctx.arc(0, 0, hubSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBarrelAssembly(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  rotation: number
): void {
  const barrelLength = cellSize * (0.3 + level * 0.02);
  const barrelRadius = cellSize * (0.025 + level * 0.002);
  const assemblyRadius = cellSize * (0.08 + level * 0.005);

  ctx.save();
  ctx.rotate(rotation);

  for (let i = 0; i < BARREL_COUNT; i++) {
    const angle = (i / BARREL_COUNT) * Math.PI * 2;
    const bx = Math.cos(angle) * assemblyRadius;
    const by = Math.sin(angle) * assemblyRadius;

    ctx.save();
    ctx.translate(bx, by);

    // Barrel body
    const barrelGradient = ctx.createLinearGradient(
      -barrelRadius,
      0,
      barrelRadius,
      0
    );
    barrelGradient.addColorStop(0, '#3a3a3a');
    barrelGradient.addColorStop(0.3, colors.primary);
    barrelGradient.addColorStop(0.5, '#7a7a7a');
    barrelGradient.addColorStop(0.7, colors.primary);
    barrelGradient.addColorStop(1, '#3a3a3a');

    ctx.fillStyle = barrelGradient;
    ctx.fillRect(-barrelRadius, -barrelLength, barrelRadius * 2, barrelLength);

    // Barrel tip (darker interior)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(0, -barrelLength, barrelRadius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Level 3+ barrel rings
    if (level >= 3) {
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-barrelRadius * 1.2, -barrelLength * 0.3);
      ctx.lineTo(barrelRadius * 1.2, -barrelLength * 0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-barrelRadius * 1.2, -barrelLength * 0.6);
      ctx.lineTo(barrelRadius * 1.2, -barrelLength * 0.6);
      ctx.stroke();
    }

    ctx.restore();
  }

  // Central barrel shroud
  const shroudRadius = assemblyRadius + barrelRadius * 1.5;
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, -barrelLength * 0.15, shroudRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Level 5 heat vents
  if (level >= 5) {
    for (let i = 0; i < 3; i++) {
      const ventAngle = (i / 3) * Math.PI * 2 + rotation * 0.5;
      const ventX = Math.cos(ventAngle) * shroudRadius * 1.3;
      const ventY = Math.sin(ventAngle) * shroudRadius * 1.3 - barrelLength * 0.15;

      ctx.fillStyle = '#ff6622';
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(ventX, ventY, cellSize * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0],
  turretAngle: number,
  time: number
): void {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(turretAngle);

  const barrelLength = cellSize * (0.3 + level * 0.02);
  const flashSize = cellSize * (0.12 + level * 0.02);
  const flashY = -barrelLength - flashSize * 0.5;

  // Flickering flash effect
  const flicker = 0.7 + Math.sin(time * 30) * 0.3;

  // Outer flash glow
  const flashGradient = ctx.createRadialGradient(0, flashY, 0, 0, flashY, flashSize);
  flashGradient.addColorStop(0, `rgba(255, 255, 200, ${flicker})`);
  flashGradient.addColorStop(0.3, `rgba(255, 200, 100, ${flicker * 0.7})`);
  flashGradient.addColorStop(0.6, `rgba(255, 150, 50, ${flicker * 0.4})`);
  flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(0, flashY, flashSize, 0, Math.PI * 2);
  ctx.fill();

  // Core flash
  const coreSize = flashSize * 0.4;
  ctx.fillStyle = `rgba(255, 255, 255, ${flicker})`;
  ctx.beginPath();
  ctx.arc(0, flashY, coreSize, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBulletTracer(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  target: Point,
  cellSize: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0],
  turretAngle: number,
  time: number
): void {
  const barrelLength = cellSize * (0.3 + level * 0.02);

  // Calculate muzzle position
  const muzzleX = centerX + Math.sin(turretAngle) * barrelLength;
  const muzzleY = centerY - Math.cos(turretAngle) * barrelLength;

  const targetX = target.x * cellSize + cellSize / 2;
  const targetY = target.y * cellSize + cellSize / 2;

  // Tracer line
  const tracerWidth = 1 + level * 0.3;
  const flicker = 0.8 + Math.sin(time * 25) * 0.2;

  // Outer glow
  ctx.strokeStyle = `rgba(255, 200, 100, ${flicker * 0.3})`;
  ctx.lineWidth = tracerWidth * 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(muzzleX, muzzleY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // Inner tracer
  ctx.strokeStyle = `rgba(255, 255, 200, ${flicker * 0.7})`;
  ctx.lineWidth = tracerWidth * 2;
  ctx.beginPath();
  ctx.moveTo(muzzleX, muzzleY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // Core
  ctx.strokeStyle = `rgba(255, 255, 255, ${flicker})`;
  ctx.lineWidth = tracerWidth;
  ctx.beginPath();
  ctx.moveTo(muzzleX, muzzleY);
  ctx.lineTo(targetX, targetY);
  ctx.stroke();

  // Impact spark
  const impactSize = cellSize * (0.08 + level * 0.01);
  const impactGradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, impactSize);
  impactGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
  impactGradient.addColorStop(0.4, `rgba(255, 200, 100, ${flicker * 0.5})`);
  impactGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(targetX, targetY, impactSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawAmbientGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  const pulseSpeed = 1.5 + level * 0.3;
  const baseSize = cellSize * (0.35 + (level - 3) * 0.05);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed) * cellSize * 0.02;
  const intensity = 0.08 + (level - 3) * 0.04;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(255, 200, 100, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(255, 180, 80, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
