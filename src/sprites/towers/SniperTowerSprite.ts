// Sniper Tower Sprite - Long-range rifle with scope and glint animation

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (military/tactical theme)
const LEVEL_COLORS = [
  // Level 1 - Basic military green
  { primary: '#4a6a4a', secondary: '#3a5a3a', accent: '#6a8a6a', glow: 'rgba(100, 150, 100, 0.3)', scope: '#88ff88' },
  // Level 2 - Enhanced olive
  { primary: '#5a7a5a', secondary: '#4a6a4a', accent: '#7a9a7a', glow: 'rgba(120, 170, 120, 0.4)', scope: '#99ff99' },
  // Level 3 - Tactical gray-green
  { primary: '#6a8a6a', secondary: '#5a7a5a', accent: '#8aaa8a', glow: 'rgba(140, 190, 140, 0.5)', scope: '#aaffaa' },
  // Level 4 - Elite gunmetal
  { primary: '#7a9a8a', secondary: '#6a8a7a', accent: '#9abaa0', glow: 'rgba(160, 210, 180, 0.6)', scope: '#bbffbb' },
  // Level 5 - Legendary chrome
  { primary: '#9abaa0', secondary: '#8aaa90', accent: '#badac0', glow: 'rgba(180, 230, 200, 0.7)', scope: '#ccffcc' },
];

export const SniperTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Draw base platform
    drawBase(ctx, centerX, centerY, cellSize, level, colors);

    // Draw sniper rifle
    drawRifle(ctx, centerX, centerY, cellSize, time, level, colors);

    // Draw scope with glint animation
    drawScope(ctx, centerX, centerY, cellSize, time, level, colors, tower.target !== null);

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

    // Sniper tracer - thin, fast, precise line
    const beamScale = 0.7 + level * 0.1;

    // Outer glow (narrow)
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.3 + level * 0.05})`;
    ctx.lineWidth = cellSize * 0.08 * beamScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Core tracer with flicker
    const flicker = 0.85 + Math.sin(time * 30) * 0.15;
    ctx.strokeStyle = `rgba(255, 255, 255, ${flicker})`;
    ctx.lineWidth = cellSize * 0.02 * beamScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Muzzle flash at start
    const muzzleSize = cellSize * (0.15 + level * 0.02);
    const muzzleGradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, muzzleSize);
    muzzleGradient.addColorStop(0, 'rgba(255, 255, 200, 0.9)');
    muzzleGradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.6)');
    muzzleGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = muzzleGradient;
    ctx.beginPath();
    ctx.arc(startX, startY, muzzleSize, 0, Math.PI * 2);
    ctx.fill();

    // Impact flash at target
    const impactSize = cellSize * (0.12 + level * 0.02);
    const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactSize);
    impactGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    impactGradient.addColorStop(0.3, `rgba(200, 255, 200, ${0.5 + level * 0.1})`);
    impactGradient.addColorStop(1, 'rgba(100, 200, 100, 0)');

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(endX, endY, impactSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw scope glint during firing (intense)
    drawScopeGlint(ctx, startX, startY - cellSize * 0.1, cellSize, time, level, colors, true);
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.4 : 0.25;

    ctx.fillStyle = `rgba(100, 200, 100, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(100, 200, 100, ${strokeAlpha})`;
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
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.36 * sizeMultiplier;

  // Hexagonal base platform
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#3a4a3a');
  baseGradient.addColorStop(0.5, '#2a3a2a');
  baseGradient.addColorStop(1, '#1a2a1a');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
    const px = centerX + Math.cos(angle) * baseRadius;
    const py = centerY + Math.sin(angle) * baseRadius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Base rim
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1 + level * 0.3;
  ctx.stroke();

  // Level 4+ gets accent ring
  if (level >= 4) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
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
  // Slow rotation (snipers are steady)
  const rotationSpeed = 0.15 + level * 0.02;
  const angle = time * rotationSpeed;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Rifle dimensions scale with level
  const rifleLength = cellSize * (0.42 + level * 0.02);
  const rifleWidth = cellSize * (0.08 + level * 0.005);

  // Rifle body
  const rifleGradient = ctx.createLinearGradient(-rifleWidth, 0, rifleWidth, 0);
  rifleGradient.addColorStop(0, '#2a3a2a');
  rifleGradient.addColorStop(0.3, colors.primary);
  rifleGradient.addColorStop(0.5, colors.accent);
  rifleGradient.addColorStop(0.7, colors.primary);
  rifleGradient.addColorStop(1, '#2a3a2a');

  ctx.fillStyle = rifleGradient;
  ctx.fillRect(-rifleWidth / 2, -rifleLength, rifleWidth, rifleLength * 1.2);

  // Barrel (longer, thinner)
  const barrelWidth = rifleWidth * 0.5;
  ctx.fillStyle = '#4a5a4a';
  ctx.fillRect(-barrelWidth / 2, -rifleLength - cellSize * 0.15, barrelWidth, cellSize * 0.2);

  // Barrel tip
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(-barrelWidth * 0.7, -rifleLength - cellSize * 0.17, barrelWidth * 1.4, cellSize * 0.03);

  // Stock (back of rifle)
  ctx.fillStyle = colors.secondary;
  ctx.fillRect(-rifleWidth * 0.6, cellSize * 0.05, rifleWidth * 1.2, cellSize * 0.12);

  // Trigger guard
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, cellSize * 0.02, cellSize * 0.04, 0, Math.PI);
  ctx.stroke();

  ctx.restore();
}

function drawScope(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  isTargeting: boolean
): void {
  // Scope rotation matches rifle
  const rotationSpeed = 0.15 + level * 0.02;
  const angle = time * rotationSpeed;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Scope body (on top of rifle)
  const scopeLength = cellSize * (0.18 + level * 0.01);
  const scopeRadius = cellSize * (0.04 + level * 0.003);
  const scopeY = -cellSize * 0.15;

  // Scope mount
  ctx.fillStyle = '#3a4a3a';
  ctx.fillRect(-cellSize * 0.02, scopeY - scopeLength / 2, cellSize * 0.04, scopeLength);

  // Scope tube
  const scopeGradient = ctx.createLinearGradient(0, scopeY - scopeLength / 2, 0, scopeY + scopeLength / 2);
  scopeGradient.addColorStop(0, '#2a3a2a');
  scopeGradient.addColorStop(0.5, '#4a5a4a');
  scopeGradient.addColorStop(1, '#2a3a2a');

  ctx.fillStyle = scopeGradient;
  ctx.beginPath();
  ctx.ellipse(0, scopeY, scopeRadius, scopeLength / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scope lens (front)
  const lensY = scopeY - scopeLength / 2;
  ctx.fillStyle = '#1a2a2a';
  ctx.beginPath();
  ctx.arc(0, lensY, scopeRadius * 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Lens reflection
  ctx.fillStyle = 'rgba(100, 200, 150, 0.3)';
  ctx.beginPath();
  ctx.arc(-scopeRadius * 0.2, lensY - scopeRadius * 0.2, scopeRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  // Draw scope glint when targeting (in world space, not rotated)
  if (isTargeting) {
    // Calculate scope position in world space
    const scopeWorldX = centerX + Math.cos(angle - Math.PI / 2) * cellSize * 0.15;
    const scopeWorldY = centerY + Math.sin(angle - Math.PI / 2) * cellSize * 0.15;
    drawScopeGlint(ctx, scopeWorldX, scopeWorldY, cellSize, time, level, colors, false);
  }
}

function drawScopeGlint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  intense: boolean
): void {
  // Glint pulse - brief flash pattern
  const glintSpeed = 3.0 + level * 0.5;
  const glintPhase = (time * glintSpeed) % 1;

  // Only show glint during brief moments (20% of cycle for subtle effect)
  const glintWindow = intense ? 0.4 : 0.2;
  if (glintPhase > glintWindow) return;

  // Glint intensity peaks at start and fades
  const glintIntensity = intense
    ? 1.0 - (glintPhase / glintWindow) * 0.3
    : Math.sin((glintPhase / glintWindow) * Math.PI);

  const glintSize = cellSize * (0.08 + level * 0.015) * (intense ? 1.5 : 1.0);

  // Main glint glow
  const glintGradient = ctx.createRadialGradient(x, y, 0, x, y, glintSize);
  glintGradient.addColorStop(0, `rgba(255, 255, 255, ${glintIntensity * 0.9})`);
  glintGradient.addColorStop(0.2, `rgba(200, 255, 200, ${glintIntensity * 0.7})`);
  glintGradient.addColorStop(0.5, colors.glow.replace('0.', `${glintIntensity * 0.5}`));
  glintGradient.addColorStop(1, 'rgba(100, 200, 100, 0)');

  ctx.fillStyle = glintGradient;
  ctx.beginPath();
  ctx.arc(x, y, glintSize, 0, Math.PI * 2);
  ctx.fill();

  // Lens flare spikes (4-pointed star)
  if (glintIntensity > 0.3) {
    const spikeLength = glintSize * 2 * glintIntensity;
    const spikeWidth = cellSize * 0.015;

    ctx.fillStyle = `rgba(255, 255, 255, ${glintIntensity * 0.6})`;

    // Horizontal spike
    ctx.fillRect(x - spikeLength, y - spikeWidth / 2, spikeLength * 2, spikeWidth);

    // Vertical spike
    ctx.fillRect(x - spikeWidth / 2, y - spikeLength, spikeWidth, spikeLength * 2);

    // Diagonal spikes for higher levels
    if (level >= 3) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = `rgba(255, 255, 255, ${glintIntensity * 0.4})`;
      ctx.fillRect(-spikeLength * 0.7, -spikeWidth / 2, spikeLength * 1.4, spikeWidth);
      ctx.fillRect(-spikeWidth / 2, -spikeLength * 0.7, spikeWidth, spikeLength * 1.4);
      ctx.restore();
    }
  }

  // Center bright point
  ctx.fillStyle = `rgba(255, 255, 255, ${glintIntensity})`;
  ctx.beginPath();
  ctx.arc(x, y, cellSize * 0.02, 0, Math.PI * 2);
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
  const pulseSpeed = 1.0 + level * 0.2;
  const baseSize = cellSize * (0.35 + (level - 3) * 0.04);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed) * cellSize * 0.02;
  const intensity = 0.08 + (level - 3) * 0.04;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(100, 200, 100, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(100, 200, 100, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(100, 200, 100, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default SniperTowerSprite;
