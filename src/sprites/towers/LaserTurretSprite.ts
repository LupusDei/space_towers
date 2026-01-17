// Laser Turret Sprite - 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (progressively more intense)
const LEVEL_COLORS = [
  // Level 1 - Basic teal
  { primary: '#00cccc', secondary: '#00a0a0', accent: '#00ffff', glow: 'rgba(0, 255, 255, 0.3)' },
  // Level 2 - Enhanced cyan
  { primary: '#00dddd', secondary: '#00bbbb', accent: '#44ffff', glow: 'rgba(50, 255, 255, 0.4)' },
  // Level 3 - Bright aqua
  { primary: '#00eeff', secondary: '#00ccdd', accent: '#77ffff', glow: 'rgba(100, 255, 255, 0.5)' },
  // Level 4 - Electric blue-cyan
  { primary: '#00ffff', secondary: '#00ddff', accent: '#aaffff', glow: 'rgba(150, 255, 255, 0.6)' },
  // Level 5 - Ultimate white-cyan
  { primary: '#55ffff', secondary: '#00ffff', accent: '#ffffff', glow: 'rgba(200, 255, 255, 0.7)' },
];

export const LaserTurretSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Draw based on level
    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurret(ctx, centerX, centerY, cellSize, time, level, colors);
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

    // Beam thickness and intensity scales with level
    const beamScale = 0.8 + level * 0.1;

    // Outer glow (wide, soft)
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = cellSize * 0.2 * beamScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Middle glow
    ctx.strokeStyle = `rgba(0, 255, 255, ${0.4 + level * 0.1})`;
    ctx.lineWidth = cellSize * 0.1 * beamScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = `rgba(100, 255, 255, ${0.7 + level * 0.05})`;
    ctx.lineWidth = cellSize * 0.05 * beamScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Core beam with flicker
    const flicker = 0.85 + Math.sin(time * 25) * 0.15;
    ctx.strokeStyle = `rgba(200, 255, 255, ${flicker})`;
    ctx.lineWidth = cellSize * 0.025 * beamScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Level 4+ get secondary beam
    if (level >= 4) {
      const offset = cellSize * 0.03;
      ctx.strokeStyle = `rgba(150, 255, 255, ${flicker * 0.6})`;
      ctx.lineWidth = cellSize * 0.015;
      ctx.beginPath();
      ctx.moveTo(startX + offset, startY + offset);
      ctx.lineTo(endX + offset, endY + offset);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(startX - offset, startY - offset);
      ctx.lineTo(endX - offset, endY - offset);
      ctx.stroke();
    }

    // Impact flash at target (scales with level)
    const impactSize = cellSize * (0.12 + level * 0.02);
    const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactSize);
    impactGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    impactGradient.addColorStop(0.3, `rgba(150, 255, 255, ${0.5 + level * 0.1})`);
    impactGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(endX, endY, impactSize, 0, Math.PI * 2);
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

    ctx.fillStyle = `rgba(0, 255, 255, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(0, 255, 255, ${strokeAlpha})`;
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
  // Base size increases slightly with level
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.38 * sizeMultiplier;

  // Base platform with metallic gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#1a4a4a');
  baseGradient.addColorStop(0.5, '#0d3333');
  baseGradient.addColorStop(1, '#082222');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim - color intensifies with level
  const rimIntensity = 0.3 + level * 0.1;
  ctx.strokeStyle = `rgba(42, 102, 102, ${rimIntensity + 0.5})`;
  ctx.lineWidth = 1 + level * 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Level 2+ gets inner ring detail
  if (level >= 2) {
    ctx.strokeStyle = '#1a4a4a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.75, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Panel lines - more with higher levels
  const panelCount = 4 + level;
  drawPanelLines(ctx, centerX, centerY, baseRadius, panelCount);

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

  // Level 5 gets glowing outer ring
  if (level >= 5) {
    ctx.strokeStyle = colors.glow;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.1, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawTurret(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  // Rotation speed increases with level
  const rotationSpeed = 0.4 + level * 0.1;
  const angle = time * rotationSpeed;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Turret mount - larger at higher levels
  const mountSize = cellSize * (0.18 + level * 0.01);
  const mountGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, mountSize);
  mountGradient.addColorStop(0, '#2a5a5a');
  mountGradient.addColorStop(0.7, '#1a4040');
  mountGradient.addColorStop(1, '#0d2a2a');

  ctx.fillStyle = mountGradient;
  ctx.beginPath();
  ctx.arc(0, 0, mountSize, 0, Math.PI * 2);
  ctx.fill();

  // Draw barrels based on level
  if (level <= 2) {
    // Single barrel
    drawBarrel(ctx, cellSize, 0, level, colors);
  } else if (level <= 4) {
    // Dual barrels
    drawBarrel(ctx, cellSize, -cellSize * 0.05, level, colors);
    drawBarrel(ctx, cellSize, cellSize * 0.05, level, colors);
  } else {
    // Triple barrels for level 5
    drawBarrel(ctx, cellSize, -cellSize * 0.07, level, colors);
    drawBarrel(ctx, cellSize, 0, level, colors);
    drawBarrel(ctx, cellSize, cellSize * 0.07, level, colors);
  }

  // Turret body
  const bodySize = cellSize * (0.12 + level * 0.01);
  const bodyGradient = ctx.createRadialGradient(
    -cellSize * 0.03,
    -cellSize * 0.03,
    0,
    0,
    0,
    bodySize
  );
  bodyGradient.addColorStop(0, colors.accent);
  bodyGradient.addColorStop(0.4, colors.primary);
  bodyGradient.addColorStop(0.8, colors.secondary);
  bodyGradient.addColorStop(1, '#007a7a');

  ctx.fillStyle = bodyGradient;
  ctx.beginPath();
  ctx.arc(0, 0, bodySize, 0, Math.PI * 2);
  ctx.fill();

  // Body edge highlight - brighter at higher levels
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 0.5 + level * 0.2;
  ctx.beginPath();
  ctx.arc(0, 0, bodySize, -Math.PI * 0.7, Math.PI * 0.3);
  ctx.stroke();

  // Center lens/emitter - larger and brighter at higher levels
  const lensSize = cellSize * (0.05 + level * 0.008);
  const lensGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, lensSize);
  lensGradient.addColorStop(0, '#ffffff');
  lensGradient.addColorStop(0.3, colors.accent);
  lensGradient.addColorStop(0.7, colors.primary);
  lensGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = lensGradient;
  ctx.beginPath();
  ctx.arc(0, 0, lensSize, 0, Math.PI * 2);
  ctx.fill();

  // Pulsing glow effect - more intense at higher levels
  const pulseSpeed = 2.5 + level * 0.5;
  const baseIntensity = 0.2 + level * 0.05;
  const pulseRange = 0.15 + level * 0.03;
  const pulseIntensity = baseIntensity + pulseRange * Math.sin(time * pulseSpeed);
  ctx.fillStyle = `rgba(0, 255, 255, ${pulseIntensity})`;
  ctx.beginPath();
  ctx.arc(0, 0, cellSize * (0.08 + level * 0.01), 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawBarrel(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  offsetX: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  // Barrel dimensions scale with level
  const lengthMultiplier = 0.9 + level * 0.05;
  const barrelLength = cellSize * 0.26 * lengthMultiplier;
  const barrelWidth = cellSize * (0.06 + level * 0.005);

  ctx.save();
  ctx.translate(offsetX, 0);

  // Barrel base (wider section)
  const baseGradient = ctx.createLinearGradient(-barrelWidth, 0, barrelWidth, 0);
  baseGradient.addColorStop(0, '#006666');
  baseGradient.addColorStop(0.3, colors.secondary);
  baseGradient.addColorStop(0.5, colors.primary);
  baseGradient.addColorStop(0.7, colors.secondary);
  baseGradient.addColorStop(1, '#006666');

  ctx.fillStyle = baseGradient;
  ctx.fillRect(-barrelWidth * 0.7, -barrelLength * 0.5, barrelWidth * 1.4, barrelLength * 0.35);

  // Main barrel
  const barrelGradient = ctx.createLinearGradient(-barrelWidth / 2, 0, barrelWidth / 2, 0);
  barrelGradient.addColorStop(0, '#005555');
  barrelGradient.addColorStop(0.2, colors.secondary);
  barrelGradient.addColorStop(0.5, colors.primary);
  barrelGradient.addColorStop(0.8, colors.secondary);
  barrelGradient.addColorStop(1, '#005555');

  ctx.fillStyle = barrelGradient;
  ctx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength * 0.85);

  // Barrel tip (emitter) - brighter at higher levels
  ctx.fillStyle = colors.accent;
  ctx.fillRect(-barrelWidth * 0.4, -barrelLength - cellSize * 0.02, barrelWidth * 0.8, cellSize * 0.035);

  // Level 3+ get barrel highlight line
  if (level >= 3) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 0.5 + level * 0.1;
    ctx.beginPath();
    ctx.moveTo(0, -cellSize * 0.1);
    ctx.lineTo(0, -barrelLength);
    ctx.stroke();
  }

  // Level 5 gets glowing barrel tip
  if (level >= 5) {
    ctx.fillStyle = colors.glow;
    ctx.beginPath();
    ctx.arc(0, -barrelLength - cellSize * 0.01, cellSize * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawPanelLines(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  count: number
): void {
  ctx.strokeStyle = '#0a2a2a';
  ctx.lineWidth = 1;

  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const innerR = radius * 0.5;
    const outerR = radius * 0.9;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.stroke();
  }
}

function drawBaseBolts(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  level: number
): void {
  const boltCount = 4 + (level - 3) * 2;
  const boltRadius = radius * 0.06;
  const boltDistance = radius * 0.65;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2 + Math.PI / boltCount;
    const bx = centerX + Math.cos(angle) * boltDistance;
    const by = centerY + Math.sin(angle) * boltDistance;

    // Bolt recess
    ctx.fillStyle = '#0a1a1a';
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
    boltGradient.addColorStop(0, '#4a6a6a');
    boltGradient.addColorStop(1, '#2a4a4a');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fill();
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
  const baseRadius = cellSize * 0.38;
  const indicatorRadius = baseRadius * (0.07 + level * 0.01);
  const indicatorDistance = baseRadius * 0.85;

  // Indicator count increases with level
  const indicatorCount = 2 + level;
  const positions: { angle: number }[] = [];
  for (let i = 0; i < indicatorCount; i++) {
    positions.push({ angle: (i / indicatorCount) * Math.PI * 2 + Math.PI / 4 });
  }

  for (let i = 0; i < positions.length; i++) {
    const { angle } = positions[i];
    const ix = centerX + Math.cos(angle) * indicatorDistance;
    const iy = centerY + Math.sin(angle) * indicatorDistance;

    // Blinking pattern - faster at higher levels
    const blinkSpeed = 1.2 + level * 0.2;
    const blinkPhase = (time * blinkSpeed + i * 0.3) % 2;
    const isOn = blinkPhase < 1.5;

    // Housing
    ctx.fillStyle = '#0a2020';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isOn ? colors.primary : '#004422';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glow when on - brighter at higher levels
    if (isOn) {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(ix, iy, indicatorRadius * (1.8 + level * 0.2), 0, Math.PI * 2);
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
  const pulseSpeed = 1.5 + level * 0.3;
  const baseSize = cellSize * (0.4 + (level - 3) * 0.05);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed) * cellSize * 0.03;
  const intensity = 0.1 + (level - 3) * 0.05;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(0, 255, 255, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(0, 255, 255, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default LaserTurretSprite;
