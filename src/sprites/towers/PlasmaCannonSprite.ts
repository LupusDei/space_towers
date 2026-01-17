// Plasma Cannon Sprite - Heavy cannon with purple/pink glow
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color palettes (progressively more vibrant)
const LEVEL_COLORS = {
  1: { base: '#3d2d45', accent: '#5a4068', glow: '#ff66ff', highlight: '#9a78b8' },
  2: { base: '#4a3555', accent: '#6a5078', glow: '#ff77ff', highlight: '#aa88c8' },
  3: { base: '#553d65', accent: '#7a6088', glow: '#ff88ff', highlight: '#bb99d8' },
  4: { base: '#604575', accent: '#8a7098', glow: '#ff99ff', highlight: '#ccaae8' },
  5: { base: '#6b4d85', accent: '#9a80a8', glow: '#ffaaff', highlight: '#ddbcf8' },
};

function getLevelColors(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level)) as 1 | 2 | 3 | 4 | 5;
  return LEVEL_COLORS[clampedLevel];
}

export const PlasmaCannonSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level;
    const colors = getLevelColors(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Level-based size scaling (subtle increase)
    const sizeScale = 1 + (level - 1) * 0.02;

    // Heavy industrial base platform with metallic gradient
    const baseWidth = cellSize * 0.4 * sizeScale;
    const baseGradient = ctx.createLinearGradient(
      centerX - baseWidth,
      centerY + cellSize * 0.1,
      centerX - baseWidth,
      centerY + cellSize * 0.35
    );
    baseGradient.addColorStop(0, colors.base);
    baseGradient.addColorStop(0.3, '#2a2030');
    baseGradient.addColorStop(0.7, '#1a1520');
    baseGradient.addColorStop(1, '#2a2030');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.rect(centerX - baseWidth, centerY + cellSize * 0.1, baseWidth * 2, cellSize * 0.25);
    ctx.fill();
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Base platform highlight edge
    ctx.strokeStyle = 'rgba(150, 120, 170, 0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - baseWidth, centerY + cellSize * 0.1);
    ctx.lineTo(centerX + baseWidth, centerY + cellSize * 0.1);
    ctx.stroke();

    // Level 3+: Side armor plates
    if (level >= 3) {
      drawArmorPlates(ctx, centerX, centerY, cellSize, colors, level);
    }

    // Side supports with metallic sheen
    const supportGradient = ctx.createLinearGradient(
      centerX - cellSize * 0.35,
      0,
      centerX - cellSize * 0.23,
      0
    );
    supportGradient.addColorStop(0, '#4a3858');
    supportGradient.addColorStop(0.4, '#5a4868');
    supportGradient.addColorStop(0.6, '#4a3858');
    supportGradient.addColorStop(1, '#3a2840');
    ctx.fillStyle = supportGradient;
    ctx.fillRect(
      centerX - cellSize * 0.35,
      centerY - cellSize * 0.1,
      cellSize * 0.12,
      cellSize * 0.25
    );

    const supportGradient2 = ctx.createLinearGradient(
      centerX + cellSize * 0.23,
      0,
      centerX + cellSize * 0.35,
      0
    );
    supportGradient2.addColorStop(0, '#3a2840');
    supportGradient2.addColorStop(0.4, '#5a4868');
    supportGradient2.addColorStop(0.6, '#4a3858');
    supportGradient2.addColorStop(1, '#4a3858');
    ctx.fillStyle = supportGradient2;
    ctx.fillRect(
      centerX + cellSize * 0.23,
      centerY - cellSize * 0.1,
      cellSize * 0.12,
      cellSize * 0.25
    );

    // Main cannon housing with metallic gradient
    const housingGradient = ctx.createLinearGradient(
      centerX - cellSize * 0.25,
      0,
      centerX + cellSize * 0.25,
      0
    );
    housingGradient.addColorStop(0, '#3a2848');
    housingGradient.addColorStop(0.2, '#5a4878');
    housingGradient.addColorStop(0.5, '#6a5888');
    housingGradient.addColorStop(0.8, '#5a4878');
    housingGradient.addColorStop(1, '#3a2848');
    ctx.fillStyle = housingGradient;
    ctx.beginPath();
    ctx.rect(centerX - cellSize * 0.25, centerY - cellSize * 0.25, cellSize * 0.5, cellSize * 0.4);
    ctx.fill();
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1;
    ctx.stroke();

    // Housing panel lines (texture detail)
    ctx.strokeStyle = 'rgba(90, 60, 100, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - cellSize * 0.1, centerY - cellSize * 0.25);
    ctx.lineTo(centerX - cellSize * 0.1, centerY + cellSize * 0.15);
    ctx.moveTo(centerX + cellSize * 0.1, centerY - cellSize * 0.25);
    ctx.lineTo(centerX + cellSize * 0.1, centerY + cellSize * 0.15);
    ctx.stroke();

    // Housing highlight
    ctx.strokeStyle = 'rgba(180, 150, 200, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(centerX - cellSize * 0.25, centerY - cellSize * 0.25);
    ctx.lineTo(centerX + cellSize * 0.25, centerY - cellSize * 0.25);
    ctx.stroke();

    // Heavy barrel with metallic gradient (scales with level)
    const barrelLength = cellSize * (0.35 + (level - 1) * 0.02);
    const barrelWidth = cellSize * (0.18 + (level - 1) * 0.01);

    // Level 4+: Draw dual barrel
    if (level >= 4) {
      drawDualBarrel(ctx, centerX, centerY, cellSize, barrelLength, barrelWidth, colors, level);
    } else {
      drawSingleBarrel(ctx, centerX, centerY, cellSize, barrelLength, barrelWidth, colors, level);
    }

    // Rivets/bolts for texture (more rivets at higher levels)
    drawRivets(ctx, centerX, centerY, cellSize, level);

    // Plasma core glow (pulsing) - intensity scales with level
    const baseGlowIntensity = 0.4 + (level - 1) * 0.05;
    const glowIntensity = baseGlowIntensity + 0.2 * Math.sin(time * 3);
    const coreY = centerY - cellSize * 0.05;

    // Level 5: Triple glow cores
    if (level === 5) {
      drawTripleCore(ctx, centerX, coreY, cellSize, glowIntensity, colors);
    } else {
      drawSingleCore(ctx, centerX, coreY, cellSize, glowIntensity, colors);
    }

    // Level 2+: Additional energy vents
    if (level >= 2) {
      drawEnergyVents(ctx, centerX, centerY, cellSize, time, colors, level);
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    // Draw base tower first
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const barrelLength = cellSize * 0.35;
    const muzzleY = centerY - cellSize * 0.25 - barrelLength;

    // Muzzle flash - large plasma burst
    const flashSize = cellSize * 0.4;
    const flashIntensity = 0.8 + 0.2 * Math.sin(time * 30);

    // Outer flash glow
    const outerFlash = ctx.createRadialGradient(
      centerX,
      muzzleY,
      0,
      centerX,
      muzzleY,
      flashSize * 1.5
    );
    outerFlash.addColorStop(0, `rgba(255, 150, 255, ${flashIntensity * 0.6})`);
    outerFlash.addColorStop(0.4, `rgba(200, 50, 200, ${flashIntensity * 0.3})`);
    outerFlash.addColorStop(1, 'rgba(150, 0, 150, 0)');
    ctx.fillStyle = outerFlash;
    ctx.beginPath();
    ctx.arc(centerX, muzzleY, flashSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core flash (bright white-pink)
    const coreFlash = ctx.createRadialGradient(
      centerX,
      muzzleY,
      0,
      centerX,
      muzzleY,
      flashSize * 0.5
    );
    coreFlash.addColorStop(0, `rgba(255, 255, 255, ${flashIntensity})`);
    coreFlash.addColorStop(0.3, `rgba(255, 200, 255, ${flashIntensity * 0.8})`);
    coreFlash.addColorStop(1, 'rgba(255, 100, 255, 0)');
    ctx.fillStyle = coreFlash;
    ctx.beginPath();
    ctx.arc(centerX, muzzleY, flashSize * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Energy tendrils from muzzle
    ctx.strokeStyle = `rgba(255, 150, 255, ${flashIntensity * 0.7})`;
    ctx.lineWidth = 2;
    const tendrilCount = 6;
    for (let i = 0; i < tendrilCount; i++) {
      const angle = (i / tendrilCount) * Math.PI * 2 + time * 5;
      const length = flashSize * (0.8 + 0.3 * Math.sin(time * 20 + i));
      ctx.beginPath();
      ctx.moveTo(centerX, muzzleY);
      ctx.lineTo(centerX + Math.cos(angle) * length, muzzleY + Math.sin(angle) * length);
      ctx.stroke();
    }

    // Draw projectile trail toward target
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Plasma trail
    ctx.strokeStyle = 'rgba(255, 100, 255, 0.4)';
    ctx.lineWidth = cellSize * 0.1;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(centerX, muzzleY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 200, 255, 0.6)';
    ctx.lineWidth = cellSize * 0.05;
    ctx.beginPath();
    ctx.moveTo(centerX, muzzleY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();

    // Impact glow at target
    const impactGradient = ctx.createRadialGradient(
      targetX,
      targetY,
      0,
      targetX,
      targetY,
      cellSize * 0.25
    );
    impactGradient.addColorStop(0, 'rgba(255, 200, 255, 0.8)');
    impactGradient.addColorStop(0.5, 'rgba(200, 100, 200, 0.4)');
    impactGradient.addColorStop(1, 'rgba(150, 50, 150, 0)');
    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(targetX, targetY, cellSize * 0.25, 0, Math.PI * 2);
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

    // Range circle fill (purple tint)
    ctx.fillStyle = `rgba(200, 100, 200, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(200, 100, 200, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

// Helper function: Draw single barrel (levels 1-3)
function drawSingleBarrel(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  barrelLength: number,
  barrelWidth: number,
  colors: { highlight: string },
  level: number
): void {
  const barrelGradient = ctx.createLinearGradient(
    centerX - barrelWidth / 2,
    0,
    centerX + barrelWidth / 2,
    0
  );
  barrelGradient.addColorStop(0, '#4a3858');
  barrelGradient.addColorStop(0.25, '#6a5888');
  barrelGradient.addColorStop(0.5, '#7a68a8');
  barrelGradient.addColorStop(0.75, '#6a5888');
  barrelGradient.addColorStop(1, '#4a3858');
  ctx.fillStyle = barrelGradient;
  ctx.fillRect(
    centerX - barrelWidth / 2,
    centerY - cellSize * 0.25 - barrelLength,
    barrelWidth,
    barrelLength
  );
  ctx.strokeStyle = colors.highlight;
  ctx.lineWidth = 1;
  ctx.strokeRect(
    centerX - barrelWidth / 2,
    centerY - cellSize * 0.25 - barrelLength,
    barrelWidth,
    barrelLength
  );

  // Barrel rings (more rings at higher levels)
  const ringCount = Math.min(level + 1, 3);
  for (let i = 0; i < ringCount; i++) {
    const ringY = centerY - cellSize * (0.3 + i * 0.12);
    // Ring shadow
    ctx.strokeStyle = '#3a2848';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY + 1);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY + 1);
    ctx.stroke();
    // Ring highlight
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(centerX - barrelWidth / 2 - 2, ringY);
    ctx.lineTo(centerX + barrelWidth / 2 + 2, ringY);
    ctx.stroke();
  }

  // Barrel tip glow
  const tipY = centerY - cellSize * 0.25 - barrelLength;
  ctx.strokeStyle = colors.highlight;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, tipY, barrelWidth / 2 + 1, Math.PI, 0);
  ctx.stroke();
}

// Helper function: Draw dual barrel (levels 4-5)
function drawDualBarrel(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  barrelLength: number,
  barrelWidth: number,
  colors: { highlight: string; glow: string },
  level: number
): void {
  const separation = cellSize * 0.08;
  const singleWidth = barrelWidth * 0.6;

  // Draw two barrels
  for (const offset of [-separation, separation]) {
    const bx = centerX + offset;
    const barrelGradient = ctx.createLinearGradient(
      bx - singleWidth / 2,
      0,
      bx + singleWidth / 2,
      0
    );
    barrelGradient.addColorStop(0, '#4a3858');
    barrelGradient.addColorStop(0.25, '#6a5888');
    barrelGradient.addColorStop(0.5, '#7a68a8');
    barrelGradient.addColorStop(0.75, '#6a5888');
    barrelGradient.addColorStop(1, '#4a3858');
    ctx.fillStyle = barrelGradient;
    ctx.fillRect(
      bx - singleWidth / 2,
      centerY - cellSize * 0.25 - barrelLength,
      singleWidth,
      barrelLength
    );
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 1;
    ctx.strokeRect(
      bx - singleWidth / 2,
      centerY - cellSize * 0.25 - barrelLength,
      singleWidth,
      barrelLength
    );

    // Barrel rings
    const ringCount = level >= 5 ? 3 : 2;
    for (let i = 0; i < ringCount; i++) {
      const ringY = centerY - cellSize * (0.3 + i * 0.1);
      ctx.strokeStyle = colors.highlight;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bx - singleWidth / 2 - 1, ringY);
      ctx.lineTo(bx + singleWidth / 2 + 1, ringY);
      ctx.stroke();
    }

    // Barrel tip
    const tipY = centerY - cellSize * 0.25 - barrelLength;
    ctx.strokeStyle = colors.highlight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, tipY, singleWidth / 2 + 1, Math.PI, 0);
    ctx.stroke();
  }

  // Connecting bridge between barrels
  ctx.fillStyle = '#5a4868';
  ctx.fillRect(
    centerX - separation - singleWidth / 2,
    centerY - cellSize * 0.28,
    separation * 2 + singleWidth,
    cellSize * 0.06
  );
}

// Helper function: Draw rivets
function drawRivets(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number
): void {
  const rivetSize = cellSize * 0.025;
  const baseRivets = [
    { x: centerX - cellSize * 0.2, y: centerY - cellSize * 0.2 },
    { x: centerX + cellSize * 0.2, y: centerY - cellSize * 0.2 },
    { x: centerX - cellSize * 0.2, y: centerY + cellSize * 0.1 },
    { x: centerX + cellSize * 0.2, y: centerY + cellSize * 0.1 },
  ];

  // Add more rivets at higher levels
  const extraRivets =
    level >= 3
      ? [
          { x: centerX, y: centerY - cellSize * 0.2 },
          { x: centerX, y: centerY + cellSize * 0.1 },
        ]
      : [];

  const allRivets = [...baseRivets, ...extraRivets];

  for (const rivet of allRivets) {
    ctx.fillStyle = '#7a5898';
    ctx.beginPath();
    ctx.arc(rivet.x, rivet.y, rivetSize, 0, Math.PI * 2);
    ctx.fill();
    // Rivet highlight
    ctx.fillStyle = 'rgba(180, 150, 200, 0.5)';
    ctx.beginPath();
    ctx.arc(rivet.x - rivetSize * 0.3, rivet.y - rivetSize * 0.3, rivetSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Helper function: Draw single plasma core
function drawSingleCore(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  coreY: number,
  cellSize: number,
  glowIntensity: number,
  colors: { glow: string }
): void {
  // Outer glow
  const gradient = ctx.createRadialGradient(centerX, coreY, 0, centerX, coreY, cellSize * 0.3);
  gradient.addColorStop(0, `rgba(255, 100, 255, ${glowIntensity})`);
  gradient.addColorStop(0.5, `rgba(200, 50, 200, ${glowIntensity * 0.5})`);
  gradient.addColorStop(1, 'rgba(150, 0, 150, 0)');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(centerX, coreY, cellSize * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Bright center
  const coreGradient = ctx.createRadialGradient(centerX, coreY, 0, centerX, coreY, cellSize * 0.1);
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.4, '#ff88ff');
  coreGradient.addColorStop(1, colors.glow);
  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, coreY, cellSize * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

// Helper function: Draw triple plasma cores (level 5)
function drawTripleCore(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  coreY: number,
  cellSize: number,
  glowIntensity: number,
  colors: { glow: string }
): void {
  const corePositions = [
    { x: centerX, y: coreY },
    { x: centerX - cellSize * 0.12, y: coreY + cellSize * 0.08 },
    { x: centerX + cellSize * 0.12, y: coreY + cellSize * 0.08 },
  ];

  // Combined outer glow
  const outerGradient = ctx.createRadialGradient(centerX, coreY, 0, centerX, coreY, cellSize * 0.4);
  outerGradient.addColorStop(0, `rgba(255, 150, 255, ${glowIntensity * 0.8})`);
  outerGradient.addColorStop(0.5, `rgba(200, 80, 200, ${glowIntensity * 0.4})`);
  outerGradient.addColorStop(1, 'rgba(150, 0, 150, 0)');
  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(centerX, coreY, cellSize * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Individual cores
  for (const pos of corePositions) {
    const coreGradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, cellSize * 0.07);
    coreGradient.addColorStop(0, '#ffffff');
    coreGradient.addColorStop(0.4, '#ffaaff');
    coreGradient.addColorStop(1, colors.glow);
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, cellSize * 0.055, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Helper function: Draw armor plates (level 3+)
function drawArmorPlates(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  colors: { accent: string; highlight: string },
  level: number
): void {
  const plateWidth = cellSize * 0.08;
  const plateHeight = cellSize * 0.2;
  const plateOffset = cellSize * 0.42;

  // Left plate
  ctx.fillStyle = colors.accent;
  ctx.fillRect(centerX - plateOffset - plateWidth, centerY - cellSize * 0.15, plateWidth, plateHeight);
  ctx.strokeStyle = colors.highlight;
  ctx.lineWidth = 1;
  ctx.strokeRect(centerX - plateOffset - plateWidth, centerY - cellSize * 0.15, plateWidth, plateHeight);

  // Right plate
  ctx.fillRect(centerX + plateOffset, centerY - cellSize * 0.15, plateWidth, plateHeight);
  ctx.strokeRect(centerX + plateOffset, centerY - cellSize * 0.15, plateWidth, plateHeight);

  // Level 5: Additional top armor
  if (level === 5) {
    const topPlateWidth = cellSize * 0.3;
    const topPlateHeight = cellSize * 0.05;
    ctx.fillStyle = colors.accent;
    ctx.fillRect(centerX - topPlateWidth / 2, centerY - cellSize * 0.28, topPlateWidth, topPlateHeight);
    ctx.strokeStyle = colors.highlight;
    ctx.strokeRect(centerX - topPlateWidth / 2, centerY - cellSize * 0.28, topPlateWidth, topPlateHeight);
  }
}

// Helper function: Draw energy vents (level 2+)
function drawEnergyVents(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  _colors: { glow: string },
  level: number
): void {
  const ventPulse = 0.3 + 0.3 * Math.sin(time * 4);
  const ventPositions = [
    { x: centerX - cellSize * 0.3, y: centerY + cellSize * 0.05 },
    { x: centerX + cellSize * 0.3, y: centerY + cellSize * 0.05 },
  ];

  // Level 4+: Add extra vents
  if (level >= 4) {
    ventPositions.push(
      { x: centerX - cellSize * 0.35, y: centerY - cellSize * 0.1 },
      { x: centerX + cellSize * 0.35, y: centerY - cellSize * 0.1 }
    );
  }

  for (const vent of ventPositions) {
    const ventGradient = ctx.createRadialGradient(vent.x, vent.y, 0, vent.x, vent.y, cellSize * 0.06);
    ventGradient.addColorStop(0, `rgba(255, 150, 255, ${ventPulse})`);
    ventGradient.addColorStop(1, 'rgba(200, 50, 200, 0)');
    ctx.fillStyle = ventGradient;
    ctx.beginPath();
    ctx.arc(vent.x, vent.y, cellSize * 0.06, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default PlasmaCannonSprite;
