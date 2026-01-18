// Sniper Tower Sprite - 5 visual tiers based on tower level
// Rifle with scope visual, long barrel, scope glint, military/industrial aesthetic

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (military/industrial - progressively more elite)
const LEVEL_COLORS = [
  // Level 1 - Basic military olive
  { primary: '#556b2f', secondary: '#3d4f22', accent: '#8fbc8f', glow: 'rgba(143, 188, 143, 0.3)', scopeGlint: '#ffff88' },
  // Level 2 - Enhanced olive-gray
  { primary: '#5a6b3a', secondary: '#404d2d', accent: '#a0c090', glow: 'rgba(160, 192, 144, 0.4)', scopeGlint: '#ffffaa' },
  // Level 3 - Tactical gunmetal
  { primary: '#4a5a4a', secondary: '#3a4a3a', accent: '#8aa08a', glow: 'rgba(138, 160, 138, 0.5)', scopeGlint: '#ffffcc' },
  // Level 4 - Elite dark steel
  { primary: '#3d4d3d', secondary: '#2d3d2d', accent: '#70a070', glow: 'rgba(112, 160, 112, 0.6)', scopeGlint: '#ffffff' },
  // Level 5 - Ultimate black ops
  { primary: '#2a3a2a', secondary: '#1a2a1a', accent: '#50c050', glow: 'rgba(80, 192, 80, 0.7)', scopeGlint: '#ffffff' },
];

export const SniperTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Draw based on level
    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawRifle(ctx, centerX, centerY, cellSize, time, level, colors);
    drawScope(ctx, centerX, centerY, cellSize, time, level, colors);
    drawStatusIndicators(ctx, centerX, centerY, cellSize, time, level, colors);

    // Level 3+ get ambient glow
    if (level >= 3) {
      drawAmbientGlow(ctx, centerX, centerY, cellSize, time, level, colors);
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const startX = x * cellSize + cellSize / 2;
    const startY = y * cellSize + cellSize / 2;
    const endX = target.x * cellSize + cellSize / 2;
    const endY = target.y * cellSize + cellSize / 2;

    // Sniper bullet trail - thin, fast, precise
    const trailScale = 0.8 + level * 0.1;

    // Muzzle flash
    const flashSize = cellSize * (0.1 + level * 0.02);
    const flashGradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, flashSize);
    flashGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    flashGradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.6)');
    flashGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(startX, startY, flashSize, 0, Math.PI * 2);
    ctx.fill();

    // Bullet trail - very thin and fast
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.6 + level * 0.08})`;
    ctx.lineWidth = cellSize * 0.015 * trailScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Inner bright trail
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 + level * 0.04})`;
    ctx.lineWidth = cellSize * 0.008 * trailScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Level 4+ get tracer effect
    if (level >= 4) {
      const tracerLength = 0.15;
      const dx = endX - startX;
      const dy = endY - startY;
      const tracerStartX = endX - dx * tracerLength;
      const tracerStartY = endY - dy * tracerLength;

      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = cellSize * 0.02;
      ctx.beginPath();
      ctx.moveTo(tracerStartX, tracerStartY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    // Impact flash at target - small and precise
    const impactSize = cellSize * (0.08 + level * 0.015);
    const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactSize);
    impactGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    impactGradient.addColorStop(0.4, `rgba(255, 200, 100, ${0.4 + level * 0.1})`);
    impactGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(endX, endY, impactSize, 0, Math.PI * 2);
    ctx.fill();

    // Scope glint during firing
    const glintIntensity = 0.5 + Math.sin(time * 30) * 0.5;
    ctx.fillStyle = `rgba(255, 255, 200, ${glintIntensity * 0.3})`;
    ctx.beginPath();
    ctx.arc(startX, startY - cellSize * 0.08, cellSize * 0.04, 0, Math.PI * 2);
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

    ctx.fillStyle = `rgba(143, 188, 143, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(143, 188, 143, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([8, 4]);
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
  // Military tripod base - slightly larger with level
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.36 * sizeMultiplier;

  // Base platform with military metal gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#4a5a4a');
  baseGradient.addColorStop(0.5, '#3a4a3a');
  baseGradient.addColorStop(1, '#2a3a2a');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim
  const rimIntensity = 0.3 + level * 0.1;
  ctx.strokeStyle = `rgba(90, 110, 90, ${rimIntensity + 0.5})`;
  ctx.lineWidth = 1 + level * 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Tripod legs - 3 legs extending from center
  drawTripodLegs(ctx, centerX, centerY, baseRadius, level, colors);

  // Level 2+ gets inner ring detail
  if (level >= 2) {
    ctx.strokeStyle = '#3a4a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Level 3+ gets decorative bolts
  if (level >= 3) {
    drawBaseBolts(ctx, centerX, centerY, baseRadius, level);
  }

  // Level 4+ gets outer accent ring
  if (level >= 4) {
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Level 5 gets tactical markings
  if (level >= 5) {
    drawTacticalMarkings(ctx, centerX, centerY, baseRadius, colors);
  }
}

function drawTripodLegs(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  baseRadius: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  const legWidth = baseRadius * (0.12 + level * 0.01);
  const legLength = baseRadius * 0.8;

  ctx.fillStyle = '#3a4a3a';
  ctx.strokeStyle = '#4a5a4a';
  ctx.lineWidth = 1;

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const legEndX = centerX + Math.cos(angle) * legLength;
    const legEndY = centerY + Math.sin(angle) * legLength;

    // Draw leg
    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle + 0.15) * baseRadius * 0.3, centerY + Math.sin(angle + 0.15) * baseRadius * 0.3);
    ctx.lineTo(legEndX + Math.cos(angle + Math.PI / 2) * legWidth / 2, legEndY + Math.sin(angle + Math.PI / 2) * legWidth / 2);
    ctx.lineTo(legEndX - Math.cos(angle + Math.PI / 2) * legWidth / 2, legEndY - Math.sin(angle + Math.PI / 2) * legWidth / 2);
    ctx.lineTo(centerX + Math.cos(angle - 0.15) * baseRadius * 0.3, centerY + Math.sin(angle - 0.15) * baseRadius * 0.3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Leg foot
    ctx.beginPath();
    ctx.arc(legEndX, legEndY, legWidth * 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawRifle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  // Slow rotation for scanning effect
  const rotationSpeed = 0.2 + level * 0.05;
  const angle = time * rotationSpeed;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Rifle body mount
  const mountSize = cellSize * (0.14 + level * 0.01);
  const mountGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, mountSize);
  mountGradient.addColorStop(0, colors.primary);
  mountGradient.addColorStop(0.7, colors.secondary);
  mountGradient.addColorStop(1, '#1a2a1a');

  ctx.fillStyle = mountGradient;
  ctx.beginPath();
  ctx.arc(0, 0, mountSize, 0, Math.PI * 2);
  ctx.fill();

  // Long sniper barrel - longer than other towers
  const barrelLength = cellSize * (0.38 + level * 0.03);
  const barrelWidth = cellSize * (0.045 + level * 0.003);

  // Barrel
  const barrelGradient = ctx.createLinearGradient(-barrelWidth, 0, barrelWidth, 0);
  barrelGradient.addColorStop(0, '#2a3a2a');
  barrelGradient.addColorStop(0.2, colors.secondary);
  barrelGradient.addColorStop(0.5, colors.primary);
  barrelGradient.addColorStop(0.8, colors.secondary);
  barrelGradient.addColorStop(1, '#2a3a2a');

  ctx.fillStyle = barrelGradient;
  ctx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength * 0.9);

  // Barrel shroud/heat sink
  const shroudWidth = barrelWidth * 1.3;
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(-shroudWidth / 2, -barrelLength * 0.4, shroudWidth, barrelLength * 0.25);

  // Barrel heat vents (level 2+)
  if (level >= 2) {
    const ventCount = 2 + level;
    ctx.strokeStyle = '#1a2a1a';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < ventCount; i++) {
      const ventY = -barrelLength * 0.2 - (i * barrelLength * 0.15 / ventCount);
      ctx.beginPath();
      ctx.moveTo(-shroudWidth / 2, ventY);
      ctx.lineTo(shroudWidth / 2, ventY);
      ctx.stroke();
    }
  }

  // Muzzle brake
  const muzzleWidth = barrelWidth * 1.5;
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(-muzzleWidth / 2, -barrelLength - cellSize * 0.02, muzzleWidth, cellSize * 0.04);

  // Muzzle hole
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(0, -barrelLength - cellSize * 0.01, barrelWidth * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Stock (back of rifle)
  const stockLength = cellSize * 0.15;
  const stockWidth = cellSize * 0.07;
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(-stockWidth / 2, 0, stockWidth, stockLength);

  // Stock butt
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(-stockWidth * 0.7, stockLength - cellSize * 0.02, stockWidth * 1.4, cellSize * 0.04);

  // Trigger guard
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = cellSize * 0.015;
  ctx.beginPath();
  ctx.arc(barrelWidth * 0.8, cellSize * 0.02, cellSize * 0.025, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Bipod attachment point (level 3+)
  if (level >= 3) {
    ctx.fillStyle = '#4a5a4a';
    ctx.beginPath();
    ctx.arc(0, -barrelLength * 0.3, cellSize * 0.02, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 4+ gets barrel rifling detail
  if (level >= 4) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -barrelLength * 0.5);
    ctx.lineTo(0, -barrelLength * 0.95);
    ctx.stroke();
  }

  // Level 5 gets elite barrel finish
  if (level >= 5) {
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-barrelWidth / 2, -barrelLength * 0.6);
    ctx.lineTo(-barrelWidth / 2, -barrelLength * 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(barrelWidth / 2, -barrelLength * 0.6);
    ctx.lineTo(barrelWidth / 2, -barrelLength * 0.9);
    ctx.stroke();
  }

  ctx.restore();
}

function drawScope(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  // Scope rotates with rifle
  const rotationSpeed = 0.2 + level * 0.05;
  const angle = time * rotationSpeed;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Scope dimensions scale with level
  const scopeLength = cellSize * (0.12 + level * 0.01);
  const scopeRadius = cellSize * (0.025 + level * 0.003);
  const scopeOffset = -cellSize * 0.08; // Position above barrel

  // Scope mount rails
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(-cellSize * 0.01, scopeOffset - scopeRadius * 1.5, cellSize * 0.02, scopeRadius);
  ctx.fillRect(-cellSize * 0.01, scopeOffset - scopeRadius * 0.5 - scopeLength, cellSize * 0.02, scopeRadius);

  // Scope tube
  const scopeGradient = ctx.createLinearGradient(
    -scopeRadius, scopeOffset - scopeLength / 2,
    scopeRadius, scopeOffset - scopeLength / 2
  );
  scopeGradient.addColorStop(0, '#2a2a2a');
  scopeGradient.addColorStop(0.3, '#4a4a4a');
  scopeGradient.addColorStop(0.5, '#5a5a5a');
  scopeGradient.addColorStop(0.7, '#4a4a4a');
  scopeGradient.addColorStop(1, '#2a2a2a');

  ctx.fillStyle = scopeGradient;
  ctx.beginPath();
  ctx.roundRect(-scopeRadius, scopeOffset - scopeLength, scopeRadius * 2, scopeLength, scopeRadius);
  ctx.fill();

  // Scope objective lens (front)
  const objectiveRadius = scopeRadius * 1.2;
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(0, scopeOffset - scopeLength, objectiveRadius, 0, Math.PI * 2);
  ctx.fill();

  // Lens reflection/glint
  const glintPulse = 0.3 + Math.sin(time * 2) * 0.2;
  const glintGradient = ctx.createRadialGradient(
    -objectiveRadius * 0.3, scopeOffset - scopeLength - objectiveRadius * 0.3,
    0,
    0, scopeOffset - scopeLength,
    objectiveRadius
  );
  glintGradient.addColorStop(0, `rgba(255, 255, 200, ${glintPulse})`);
  glintGradient.addColorStop(0.3, `rgba(200, 200, 150, ${glintPulse * 0.5})`);
  glintGradient.addColorStop(1, 'rgba(100, 100, 80, 0)');

  ctx.fillStyle = glintGradient;
  ctx.beginPath();
  ctx.arc(0, scopeOffset - scopeLength, objectiveRadius * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Scope eyepiece (back)
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath();
  ctx.arc(0, scopeOffset, scopeRadius * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Elevation/windage turrets (level 2+)
  if (level >= 2) {
    // Top turret (elevation)
    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.arc(0, scopeOffset - scopeLength * 0.6 - scopeRadius * 1.5, scopeRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Side turret (windage)
    ctx.beginPath();
    ctx.arc(scopeRadius * 1.5, scopeOffset - scopeLength * 0.6, scopeRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 3+ gets scope rings
  if (level >= 3) {
    ctx.strokeStyle = '#5a5a5a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, scopeOffset - scopeLength * 0.3, scopeRadius * 1.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, scopeOffset - scopeLength * 0.7, scopeRadius * 1.1, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Level 4+ gets illuminated reticle glow
  if (level >= 4) {
    const reticleGlow = ctx.createRadialGradient(
      0, scopeOffset - scopeLength,
      0,
      0, scopeOffset - scopeLength,
      objectiveRadius * 0.5
    );
    reticleGlow.addColorStop(0, `rgba(80, 192, 80, ${0.2 + Math.sin(time * 3) * 0.1})`);
    reticleGlow.addColorStop(1, 'rgba(80, 192, 80, 0)');
    ctx.fillStyle = reticleGlow;
    ctx.beginPath();
    ctx.arc(0, scopeOffset - scopeLength, objectiveRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 5 gets enhanced scope glint
  if (level >= 5) {
    const eliteGlint = 0.5 + Math.sin(time * 4) * 0.3;
    ctx.fillStyle = `rgba(255, 255, 255, ${eliteGlint})`;
    ctx.beginPath();
    ctx.arc(-objectiveRadius * 0.3, scopeOffset - scopeLength - objectiveRadius * 0.3, objectiveRadius * 0.15, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawBaseBolts(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  level: number
): void {
  const boltCount = 3 + (level - 3);
  const boltRadius = radius * 0.05;
  const boltDistance = radius * 0.75;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2 + Math.PI / 6;
    const bx = centerX + Math.cos(angle) * boltDistance;
    const by = centerY + Math.sin(angle) * boltDistance;

    // Bolt recess
    ctx.fillStyle = '#1a2a1a';
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Bolt head
    const boltGradient = ctx.createRadialGradient(
      bx - boltRadius * 0.3,
      by - boltRadius * 0.3,
      0,
      bx,
      by,
      boltRadius
    );
    boltGradient.addColorStop(0, '#6a7a6a');
    boltGradient.addColorStop(1, '#4a5a4a');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTacticalMarkings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  // Small tactical hash marks around the base
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 0.5;

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const innerR = radius * 0.9;
    const outerR = radius * 0.98;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.stroke();
  }
}

function drawStatusIndicators(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  const baseRadius = cellSize * 0.36;
  const indicatorRadius = baseRadius * (0.06 + level * 0.008);
  const indicatorDistance = baseRadius * 0.5;

  // Fewer indicators for sniper - precision look
  const indicatorCount = 1 + Math.floor(level / 2);

  for (let i = 0; i < indicatorCount; i++) {
    const angle = (i / indicatorCount) * Math.PI * 2 + Math.PI / 2;
    const ix = centerX + Math.cos(angle) * indicatorDistance;
    const iy = centerY + Math.sin(angle) * indicatorDistance;

    // Slow blink for targeting system
    const blinkSpeed = 0.8 + level * 0.1;
    const blinkPhase = (time * blinkSpeed + i * 0.5) % 2;
    const isOn = blinkPhase < 1.7;

    // Housing
    ctx.fillStyle = '#1a2a1a';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isOn ? colors.accent : '#1a3a1a';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glow when on
    if (isOn) {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(ix, iy, indicatorRadius * (1.6 + level * 0.15), 0, Math.PI * 2);
      ctx.fill();
    }
  }
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
  const pulseSpeed = 1.0 + level * 0.2;
  const baseSize = cellSize * (0.35 + (level - 3) * 0.04);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed) * cellSize * 0.02;
  const intensity = 0.08 + (level - 3) * 0.04;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(143, 188, 143, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(143, 188, 143, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(143, 188, 143, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default SniperTowerSprite;
