// Grid Cell Sprites - Rendering for different cell states

import type { CellState, Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// Draw subtle grid lines for an empty cell
export function drawEmptyCell(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize } = context;
  const x = position.x * cellSize;
  const y = position.y * cellSize;

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(100, 100, 120, 0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, cellSize, cellSize);
}

// Draw buildable hover state (highlighted cell)
export function drawBuildableHover(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize, time } = context;
  const x = position.x * cellSize;
  const y = position.y * cellSize;

  // Pulsing highlight
  const pulse = 0.3 + Math.sin(time * 4) * 0.1;

  // Fill with highlight color
  ctx.fillStyle = `rgba(100, 200, 100, ${pulse})`;
  ctx.fillRect(x, y, cellSize, cellSize);

  // Border
  ctx.strokeStyle = 'rgba(100, 255, 100, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
}

// Draw tower occupied state (darker cell indicating placement)
export function drawTowerOccupied(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize } = context;
  const x = position.x * cellSize;
  const y = position.y * cellSize;

  // Darker base indicating tower foundation
  ctx.fillStyle = 'rgba(40, 40, 50, 0.5)';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Subtle border
  ctx.strokeStyle = 'rgba(80, 80, 100, 0.4)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, cellSize, cellSize);
}

// Draw spawn marker with glow
export function drawSpawnMarker(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize, time } = context;
  const centerX = position.x * cellSize + cellSize / 2;
  const centerY = position.y * cellSize + cellSize / 2;

  // Pulsing glow effect
  const pulse = 0.5 + Math.sin(time * 3) * 0.3;

  // Outer glow
  ctx.fillStyle = `rgba(255, 100, 100, ${pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow
  ctx.fillStyle = `rgba(255, 150, 150, ${pulse * 0.5})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Core marker
  ctx.fillStyle = '#FF6666';
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Arrow pointing inward (spawn direction)
  ctx.fillStyle = '#FFAAAA';
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - cellSize * 0.08);
  ctx.lineTo(centerX - cellSize * 0.06, centerY + cellSize * 0.06);
  ctx.lineTo(centerX + cellSize * 0.06, centerY + cellSize * 0.06);
  ctx.closePath();
  ctx.fill();
}

// Draw exit marker with glow
export function drawExitMarker(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize, time } = context;
  const centerX = position.x * cellSize + cellSize / 2;
  const centerY = position.y * cellSize + cellSize / 2;

  // Pulsing glow effect
  const pulse = 0.5 + Math.sin(time * 3 + Math.PI) * 0.3;

  // Outer glow
  ctx.fillStyle = `rgba(100, 100, 255, ${pulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // Inner glow
  ctx.fillStyle = `rgba(150, 150, 255, ${pulse * 0.5})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Core marker
  ctx.fillStyle = '#6666FF';
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // X mark for exit
  ctx.strokeStyle = '#AAAAFF';
  ctx.lineWidth = cellSize * 0.04;
  ctx.lineCap = 'round';
  const offset = cellSize * 0.06;
  ctx.beginPath();
  ctx.moveTo(centerX - offset, centerY - offset);
  ctx.lineTo(centerX + offset, centerY + offset);
  ctx.moveTo(centerX + offset, centerY - offset);
  ctx.lineTo(centerX - offset, centerY + offset);
  ctx.stroke();
}

// Draw path cell (subtle indication of enemy path)
export function drawPathCell(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize } = context;
  const x = position.x * cellSize;
  const y = position.y * cellSize;

  // Subtle path indication
  ctx.fillStyle = 'rgba(80, 80, 100, 0.2)';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Grid lines
  ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, cellSize, cellSize);
}

// Draw blocked cell (cannot build or traverse)
export function drawBlockedCell(context: SpriteRenderContext, position: Point): void {
  const { ctx, cellSize } = context;
  const x = position.x * cellSize;
  const y = position.y * cellSize;

  // Dark blocked indication
  ctx.fillStyle = 'rgba(30, 30, 40, 0.6)';
  ctx.fillRect(x, y, cellSize, cellSize);

  // Diagonal lines pattern
  ctx.strokeStyle = 'rgba(60, 60, 80, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + cellSize, y + cellSize);
  ctx.moveTo(x + cellSize, y);
  ctx.lineTo(x, y + cellSize);
  ctx.stroke();
}

// Main draw function that handles all cell states
export function drawCell(
  context: SpriteRenderContext,
  position: Point,
  state: CellState,
  isHovered: boolean = false
): void {
  switch (state) {
    case 'empty':
      drawEmptyCell(context, position);
      if (isHovered) {
        drawBuildableHover(context, position);
      }
      break;
    case 'path':
      drawPathCell(context, position);
      break;
    case 'blocked':
      drawBlockedCell(context, position);
      break;
    case 'tower':
      drawTowerOccupied(context, position);
      break;
    case 'spawn':
      drawSpawnMarker(context, position);
      break;
    case 'exit':
      drawExitMarker(context, position);
      break;
  }
}
