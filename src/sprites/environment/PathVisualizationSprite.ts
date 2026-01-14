// Path Visualization Sprite - Animated dashed line with flowing particles

import type { Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// Number of particles flowing along the path
const PARTICLE_COUNT = 8;

// Speed at which particles flow (units per second)
const PARTICLE_SPEED = 2;

// Path colors (cyan accent)
const PATH_COLOR = '#00ffff';
const PATH_GLOW_COLOR = 'rgba(0, 255, 255, 0.3)';
const PARTICLE_COLOR = '#aaffff';

export interface PathVisualizationSprite {
  draw(context: SpriteRenderContext, path: Point[]): void;
}

/**
 * Calculate total path length in grid units
 */
function getPathLength(path: Point[]): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    length += Math.sqrt(dx * dx + dy * dy);
  }
  return length;
}

/**
 * Get position along path at a given distance from start
 */
function getPositionAlongPath(path: Point[], distance: number): Point | null {
  if (path.length < 2) return null;

  let traveled = 0;
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    if (traveled + segmentLength >= distance) {
      // Interpolate within this segment
      const t = (distance - traveled) / segmentLength;
      return {
        x: path[i - 1].x + dx * t,
        y: path[i - 1].y + dy * t,
      };
    }
    traveled += segmentLength;
  }

  // Past end of path, return last point
  return path[path.length - 1];
}

export const PathVisualizationSprite: PathVisualizationSprite = {
  draw(context: SpriteRenderContext, path: Point[]): void {
    if (path.length < 2) return;

    const { ctx, cellSize, time } = context;

    // Draw glow layer
    ctx.strokeStyle = PATH_GLOW_COLOR;
    ctx.lineWidth = cellSize * 0.4;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x * cellSize + cellSize / 2, path[0].y * cellSize + cellSize / 2);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
    }
    ctx.stroke();

    // Draw animated dashed line
    const dashLength = cellSize * 0.3;
    const gapLength = cellSize * 0.2;
    const dashOffset = (time * cellSize * PARTICLE_SPEED) % (dashLength + gapLength);

    ctx.strokeStyle = PATH_COLOR;
    ctx.lineWidth = cellSize * 0.08;
    ctx.setLineDash([dashLength, gapLength]);
    ctx.lineDashOffset = -dashOffset;
    ctx.beginPath();
    ctx.moveTo(path[0].x * cellSize + cellSize / 2, path[0].y * cellSize + cellSize / 2);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * cellSize + cellSize / 2, path[i].y * cellSize + cellSize / 2);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw flowing particles
    const pathLength = getPathLength(path);
    if (pathLength <= 0) return;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      // Each particle is evenly spaced and flows along the path
      const baseOffset = (i / PARTICLE_COUNT) * pathLength;
      const animOffset = (time * PARTICLE_SPEED) % pathLength;
      const distance = (baseOffset + animOffset) % pathLength;

      const pos = getPositionAlongPath(path, distance);
      if (!pos) continue;

      const pixelX = pos.x * cellSize + cellSize / 2;
      const pixelY = pos.y * cellSize + cellSize / 2;

      // Particle glow
      ctx.fillStyle = PATH_GLOW_COLOR;
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, cellSize * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Particle core
      ctx.fillStyle = PARTICLE_COLOR;
      ctx.beginPath();
      ctx.arc(pixelX, pixelY, cellSize * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw arrow at end to indicate direction
    if (path.length >= 2) {
      const end = path[path.length - 1];
      const prev = path[path.length - 2];

      const endX = end.x * cellSize + cellSize / 2;
      const endY = end.y * cellSize + cellSize / 2;

      const dx = end.x - prev.x;
      const dy = end.y - prev.y;
      const angle = Math.atan2(dy, dx);

      const arrowSize = cellSize * 0.25;

      ctx.fillStyle = PATH_COLOR;
      ctx.save();
      ctx.translate(endX, endY);
      ctx.rotate(angle);

      ctx.beginPath();
      ctx.moveTo(arrowSize, 0);
      ctx.lineTo(-arrowSize * 0.5, -arrowSize * 0.6);
      ctx.lineTo(-arrowSize * 0.5, arrowSize * 0.6);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }
  },
};
