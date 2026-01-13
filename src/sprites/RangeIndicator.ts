// Range Indicator - Tower range circle visualization
// Semi-transparent circle, different color when enemies in range

import type { Point } from '../types';
import type { SpriteRenderContext } from './types';

export interface RangeIndicatorOptions {
  position: Point;
  range: number;
  hasEnemiesInRange: boolean;
}

export interface RangeIndicatorSprite {
  draw(context: SpriteRenderContext, options: RangeIndicatorOptions): void;
}

// Colors from theme
const COLOR_NORMAL = { r: 0, g: 255, b: 255 };    // accent cyan
const COLOR_ENEMIES = { r: 255, g: 51, b: 102 };  // danger red

export const RangeIndicator: RangeIndicatorSprite = {
  draw(context: SpriteRenderContext, options: RangeIndicatorOptions): void {
    const { ctx, cellSize } = context;
    const { position, range, hasEnemiesInRange } = options;

    const centerX = position.x * cellSize + cellSize / 2;
    const centerY = position.y * cellSize + cellSize / 2;
    const radiusPixels = range * cellSize;

    const color = hasEnemiesInRange ? COLOR_ENEMIES : COLOR_NORMAL;

    // Fill - very transparent
    const fillGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, radiusPixels
    );
    fillGradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.05)`);
    fillGradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, 0.08)`);
    fillGradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.15)`);

    ctx.fillStyle = fillGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radiusPixels, 0, Math.PI * 2);
    ctx.fill();

    // Border - slightly more visible
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.4)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radiusPixels, 0, Math.PI * 2);
    ctx.stroke();

    // Inner glow ring
    ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.2)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radiusPixels * 0.95, 0, Math.PI * 2);
    ctx.stroke();
  },
};

export default RangeIndicator;
