// Sniper Tower Sprite - Long-range rifle with scope visual
// Features tracer line effect when firing

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (progressively more intense)
const LEVEL_COLORS = [
  // Level 1 - Muted olive/military
  { primary: '#4a5a3a', secondary: '#3a4a2a', accent: '#8a9a6a', glow: 'rgba(200, 220, 150, 0.3)', tracer: '#ffcc44' },
  // Level 2 - Enhanced green
  { primary: '#5a6a4a', secondary: '#4a5a3a', accent: '#9aaa7a', glow: 'rgba(210, 230, 160, 0.4)', tracer: '#ffdd55' },
  // Level 3 - Tactical gray-green
  { primary: '#6a7a5a', secondary: '#5a6a4a', accent: '#aabb8a', glow: 'rgba(220, 240, 170, 0.5)', tracer: '#ffee66' },
  // Level 4 - Chrome accent
  { primary: '#7a8a6a', secondary: '#6a7a5a', accent: '#bbcc9a', glow: 'rgba(230, 250, 180, 0.6)', tracer: '#ffff77' },
  // Level 5 - Elite gold trim
  { primary: '#8a9a7a', secondary: '#7a8a6a', accent: '#ccddaa', glow: 'rgba(255, 255, 200, 0.7)', tracer: '#ffffaa' },
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

    // Level 3+ get ambient glow
    if (level >= 3) {
      drawScopeGlint(ctx, centerX, centerY, cellSize, time, level, colors);
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    // Calculate positions
    const startX = x * cellSize + cellSize / 2;
    const startY = y * cellSize + cellSize / 2 - cellSize * 0.3; // Fire from barrel tip
    const endX = target.x * cellSize + cellSize / 2;
    const endY = target.y * cellSize + cellSize / 2;

    // Tracer thickness scales with level
    const tracerScale = 0.8 + level * 0.1;

    // ========================================
    // SNIPER TRACER EFFECT
    // Brief, bright line showing bullet path
    // ========================================

    // Outer glow (wide, soft yellow)
    ctx.strokeStyle = `rgba(255, 220, 100, ${0.3 + level * 0.05})`;
    ctx.lineWidth = cellSize * 0.08 * tracerScale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Middle glow (brighter)
    ctx.strokeStyle = `rgba(255, 240, 150, ${0.5 + level * 0.08})`;
    ctx.lineWidth = cellSize * 0.04 * tracerScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Inner core (bright white-yellow)
    const flicker = 0.9 + Math.sin(time * 30) * 0.1;
    ctx.strokeStyle = `rgba(255, 255, 220, ${flicker})`;
    ctx.lineWidth = cellSize * 0.015 * tracerScale;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Level 4+ get secondary tracer line (double-tap visual)
    if (level >= 4) {
      const offset = cellSize * 0.02;
      ctx.strokeStyle = `rgba(255, 200, 100, ${flicker * 0.5})`;
      ctx.lineWidth = cellSize * 0.01;
      ctx.beginPath();
      ctx.moveTo(startX + offset, startY + offset);
      ctx.lineTo(endX + offset, endY + offset);
      ctx.stroke();
    }

    // Muzzle flash at barrel
    const muzzleSize = cellSize * (0.15 + level * 0.02);
    const muzzleGradient = ctx.createRadialGradient(startX, startY, 0, startX, startY, muzzleSize);
    muzzleGradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    muzzleGradient.addColorStop(0.3, `rgba(255, 200, 100, ${0.6 + level * 0.08})`);
    muzzleGradient.addColorStop(0.6, colors.glow);
    muzzleGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = muzzleGradient;
    ctx.beginPath();
    ctx.arc(startX, startY, muzzleSize, 0, Math.PI * 2);
    ctx.fill();

    // Impact flash at target (scales with level)
    const impactSize = cellSize * (0.12 + level * 0.025);
    const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactSize);
    impactGradient.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    impactGradient.addColorStop(0.25, `rgba(255, 220, 150, ${0.7 + level * 0.06})`);
    impactGradient.addColorStop(0.5, `rgba(255, 180, 100, ${0.4 + level * 0.05})`);
    impactGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(endX, endY, impactSize, 0, Math.PI * 2);
    ctx.fill();

    // Impact sparks for level 5
    if (level === 5) {
      const sparkCount = 4;
      for (let i = 0; i < sparkCount; i++) {
        const angle = (i / sparkCount) * Math.PI * 2 + time * 3;
        const sparkLength = cellSize * 0.08;
        ctx.strokeStyle = 'rgba(255, 255, 200, 0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX + Math.cos(angle) * sparkLength,
          endY + Math.sin(angle) * sparkLength
        );
        ctx.stroke();
      }
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

    // Range circle fill (olive/yellow tint)
    ctx.fillStyle = `rgba(180, 200, 100, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(200, 220, 120, ${strokeAlpha})`;
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
  // Sandbag/fortified base platform
  const baseRadius = cellSize * (0.36 + level * 0.01);

  // Base platform with metallic gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#5a5a4a');
  baseGradient.addColorStop(0.5, '#4a4a3a');
  baseGradient.addColorStop(1, '#3a3a2a');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1 + level * 0.2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Sandbag texture (level 2+)
  if (level >= 2) {
    const bagCount = 4 + level;
    for (let i = 0; i < bagCount; i++) {
      const angle = (i / bagCount) * Math.PI * 2;
      const bagX = centerX + Math.cos(angle) * baseRadius * 0.7;
      const bagY = centerY + Math.sin(angle) * baseRadius * 0.7;
      ctx.fillStyle = '#4a4a3a';
      ctx.beginPath();
      ctx.ellipse(bagX, bagY, cellSize * 0.06, cellSize * 0.04, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRifle(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  _time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  ctx.save();
  ctx.translate(centerX, centerY);

  // Rifle body (horizontal, pointing up-right)
  const rifleLength = cellSize * (0.4 + level * 0.02);
  const rifleWidth = cellSize * (0.1 + level * 0.005);

  // Barrel
  const barrelGradient = ctx.createLinearGradient(-rifleWidth / 2, 0, rifleWidth / 2, 0);
  barrelGradient.addColorStop(0, '#3a3a3a');
  barrelGradient.addColorStop(0.3, '#5a5a5a');
  barrelGradient.addColorStop(0.5, '#6a6a6a');
  barrelGradient.addColorStop(0.7, '#5a5a5a');
  barrelGradient.addColorStop(1, '#3a3a3a');

  ctx.fillStyle = barrelGradient;
  ctx.fillRect(-rifleWidth / 2, -rifleLength, rifleWidth, rifleLength * 0.6);

  // Stock (lower part)
  const stockGradient = ctx.createLinearGradient(-rifleWidth, 0, rifleWidth, 0);
  stockGradient.addColorStop(0, colors.secondary);
  stockGradient.addColorStop(0.5, colors.primary);
  stockGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = stockGradient;
  ctx.fillRect(-rifleWidth * 0.8, -rifleLength * 0.4, rifleWidth * 1.6, rifleLength * 0.5);

  // Barrel tip (muzzle)
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(-rifleWidth * 0.4, -rifleLength - cellSize * 0.03, rifleWidth * 0.8, cellSize * 0.05);

  // Muzzle brake (level 3+)
  if (level >= 3) {
    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(-rifleWidth * 0.5, -rifleLength - cellSize * 0.06, rifleWidth, cellSize * 0.04);
  }

  // Trigger guard
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -rifleLength * 0.2, cellSize * 0.04, 0, Math.PI);
  ctx.stroke();

  // Magazine (level 2+)
  if (level >= 2) {
    ctx.fillStyle = colors.accent;
    ctx.fillRect(-rifleWidth * 0.3, -rifleLength * 0.15, rifleWidth * 0.6, cellSize * 0.12);
  }

  ctx.restore();
}

function drawScope(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  _time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  ctx.save();
  ctx.translate(centerX, centerY);

  // Scope mount
  const scopeY = -cellSize * 0.25;
  const scopeLength = cellSize * (0.18 + level * 0.015);
  const scopeRadius = cellSize * (0.04 + level * 0.003);

  // Scope tube
  const scopeGradient = ctx.createLinearGradient(0, scopeY - scopeRadius, 0, scopeY + scopeRadius);
  scopeGradient.addColorStop(0, '#2a2a2a');
  scopeGradient.addColorStop(0.3, '#4a4a4a');
  scopeGradient.addColorStop(0.7, '#4a4a4a');
  scopeGradient.addColorStop(1, '#2a2a2a');

  ctx.fillStyle = scopeGradient;
  ctx.beginPath();
  ctx.ellipse(0, scopeY, scopeLength, scopeRadius, 0, 0, Math.PI * 2);
  ctx.fill();

  // Scope rings
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-scopeLength * 0.4, scopeY, scopeRadius * 0.8, scopeRadius * 1.2, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(scopeLength * 0.4, scopeY, scopeRadius * 0.8, scopeRadius * 1.2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Scope lens (front)
  const lensGradient = ctx.createRadialGradient(
    scopeLength, scopeY, 0,
    scopeLength, scopeY, scopeRadius
  );
  lensGradient.addColorStop(0, colors.accent);
  lensGradient.addColorStop(0.5, '#4a6a8a');
  lensGradient.addColorStop(1, '#2a4a6a');

  ctx.fillStyle = lensGradient;
  ctx.beginPath();
  ctx.arc(scopeLength, scopeY, scopeRadius * 0.9, 0, Math.PI * 2);
  ctx.fill();

  // Scope lens highlight
  ctx.fillStyle = 'rgba(200, 220, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(scopeLength - scopeRadius * 0.2, scopeY - scopeRadius * 0.2, scopeRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawScopeGlint(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  // Scope glint effect - pulsing light reflection
  const scopeY = centerY - cellSize * 0.25;
  const scopeLength = cellSize * (0.18 + level * 0.015);
  const glintX = centerX + scopeLength;
  const glintY = scopeY;

  // Pulsing glint
  const pulseSpeed = 1.5 + level * 0.3;
  const baseIntensity = 0.2 + (level - 3) * 0.1;
  const pulseRange = 0.15 + (level - 3) * 0.05;
  const intensity = baseIntensity + pulseRange * Math.sin(time * pulseSpeed);

  const glintSize = cellSize * (0.06 + (level - 3) * 0.015);

  // Glint glow
  const glintGradient = ctx.createRadialGradient(glintX, glintY, 0, glintX, glintY, glintSize);
  glintGradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
  glintGradient.addColorStop(0.5, `rgba(200, 220, 255, ${intensity * 0.5})`);
  glintGradient.addColorStop(1, 'rgba(150, 200, 255, 0)');

  ctx.fillStyle = glintGradient;
  ctx.beginPath();
  ctx.arc(glintX, glintY, glintSize, 0, Math.PI * 2);
  ctx.fill();

  // Level 5 gets star-burst glint
  if (level === 5) {
    const starSize = glintSize * 1.5;
    ctx.strokeStyle = `rgba(255, 255, 255, ${intensity * 0.6})`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
      ctx.beginPath();
      ctx.moveTo(glintX, glintY);
      ctx.lineTo(
        glintX + Math.cos(angle) * starSize,
        glintY + Math.sin(angle) * starSize
      );
      ctx.stroke();
    }
  }
}

export default SniperTowerSprite;
