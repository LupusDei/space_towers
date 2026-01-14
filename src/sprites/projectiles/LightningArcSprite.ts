// Lightning Arc Sprite - Branching chain lightning effect
// Draws arc from tower through chain targets with brief flash duration

import type { Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';

export interface LightningArcSprite {
  draw(context: SpriteRenderContext, origin: Point, targets: Point[], progress: number): void;
}

export const LightningArcSprite: LightningArcSprite = {
  draw(context: SpriteRenderContext, origin: Point, targets: Point[], progress: number): void {
    if (targets.length === 0) return;

    const { ctx, cellSize, time } = context;

    // Brief flash: fade out as progress increases
    const alpha = 1 - progress;
    if (alpha <= 0) return;

    const originX = origin.x * cellSize + cellSize / 2;
    const originY = origin.y * cellSize + cellSize / 2;

    // Draw arc from origin to first target
    const firstTarget = targets[0];
    const firstTargetX = firstTarget.x * cellSize + cellSize / 2;
    const firstTargetY = firstTarget.y * cellSize + cellSize / 2;

    drawArc(ctx, originX, originY, firstTargetX, firstTargetY, time, alpha);

    // Chain through remaining targets
    for (let i = 1; i < targets.length; i++) {
      const prevTarget = targets[i - 1];
      const currTarget = targets[i];

      const prevX = prevTarget.x * cellSize + cellSize / 2;
      const prevY = prevTarget.y * cellSize + cellSize / 2;
      const currX = currTarget.x * cellSize + cellSize / 2;
      const currY = currTarget.y * cellSize + cellSize / 2;

      // Each chain link is slightly dimmer
      const chainAlpha = alpha * (1 - i * 0.15);
      if (chainAlpha > 0) {
        drawArc(ctx, prevX, prevY, currX, currY, time, chainAlpha);
      }
    }

    // Draw impact glow at each target
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const targetX = target.x * cellSize + cellSize / 2;
      const targetY = target.y * cellSize + cellSize / 2;

      const impactAlpha = alpha * (1 - i * 0.1);
      if (impactAlpha > 0) {
        drawImpactGlow(ctx, targetX, targetY, impactAlpha);
      }
    }

    // Draw origin glow (tower electrode flash)
    drawOriginGlow(ctx, originX, originY, alpha);
  },
};

function drawArc(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  alpha: number
): void {
  const segments = 8;
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);

  if (length < 1) return;

  const perpX = -dy / length;
  const perpY = dx / length;

  // Multiple layers for glow effect
  const arcLayers = [
    { width: 6, alphaMult: 0.2, color: '80, 160, 255' },
    { width: 3, alphaMult: 0.5, color: '120, 200, 255' },
    { width: 1.5, alphaMult: 1.0, color: '200, 230, 255' },
  ];

  for (const layer of arcLayers) {
    const layerAlpha = alpha * layer.alphaMult;
    ctx.strokeStyle = `rgba(${layer.color}, ${layerAlpha})`;
    ctx.lineWidth = layer.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(startX, startY);

    // Generate jagged lightning path
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const baseX = startX + dx * t;
      const baseY = startY + dy * t;

      // Displacement varies with time and segment for animation
      const jitter = Math.sin(time * 0.03 + i * 2.3) * length * 0.1;
      const offsetX = perpX * jitter;
      const offsetY = perpY * jitter;

      ctx.lineTo(baseX + offsetX, baseY + offsetY);
    }

    ctx.lineTo(endX, endY);
    ctx.stroke();
  }
}

function drawImpactGlow(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  const radius = 12;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(180, 220, 255, ${alpha * 0.8})`);
  gradient.addColorStop(0.5, `rgba(100, 180, 255, ${alpha * 0.4})`);
  gradient.addColorStop(1, 'rgba(100, 180, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawOriginGlow(ctx: CanvasRenderingContext2D, x: number, y: number, alpha: number): void {
  const radius = 18;
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(200, 240, 255, ${alpha * 0.9})`);
  gradient.addColorStop(0.4, `rgba(120, 200, 255, ${alpha * 0.5})`);
  gradient.addColorStop(1, 'rgba(80, 160, 255, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

export default LightningArcSprite;
