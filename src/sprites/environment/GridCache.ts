// Grid Cache - Caches static grid elements in an OffscreenCanvas
// Only animated elements (spawn/exit pulse, hover) are drawn each frame

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../../game/config';
import type { CellState, Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';
import {
  drawEmptyCell,
  drawPathCell,
  drawBlockedCell,
  drawTowerOccupied,
  drawSpawnMarker,
  drawExitMarker,
  drawBuildableHover,
} from './GridCellSprites';

let staticGridCanvas: OffscreenCanvas | null = null;
let cachedGridState: CellState[][] | null = null;

function arraysEqual(a: CellState[][], b: CellState[][]): boolean {
  if (a.length !== b.length) return false;
  for (let y = 0; y < a.length; y++) {
    if (a[y].length !== b[y].length) return false;
    for (let x = 0; x < a[y].length; x++) {
      if (a[y][x] !== b[y][x]) return false;
    }
  }
  return true;
}

function deepCopyGrid(grid: CellState[][]): CellState[][] {
  return grid.map((row) => [...row]);
}

function rebuildCache(grid: CellState[][], context: SpriteRenderContext): void {
  if (!staticGridCanvas) {
    staticGridCanvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  const offCtx = staticGridCanvas.getContext('2d');
  if (!offCtx) return;

  // Clear canvas (transparent - we'll draw over background)
  offCtx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Create render context for the offscreen canvas (time=0 for static elements)
  // Cast to CanvasRenderingContext2D since we only use the common subset of methods
  const offContext: SpriteRenderContext = {
    ctx: offCtx as unknown as CanvasRenderingContext2D,
    cellSize: context.cellSize,
    time: 0,
  };

  // Draw only static grid elements
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cellState = grid[y][x];
      const position = { x, y };

      // Only cache static cells - spawn/exit have animations
      switch (cellState) {
        case 'empty':
          drawEmptyCell(offContext, position);
          break;
        case 'path':
          drawPathCell(offContext, position);
          break;
        case 'blocked':
          drawBlockedCell(offContext, position);
          break;
        case 'tower':
          drawTowerOccupied(offContext, position);
          break;
        // Skip spawn/exit - they have animations
      }
    }
  }

  cachedGridState = deepCopyGrid(grid);
}

export function drawCachedGrid(
  context: SpriteRenderContext,
  grid: CellState[][],
  hoveredCell: Point | null,
  canPlace: boolean
): void {
  // Check if we need to rebuild the cache
  if (!staticGridCanvas || !cachedGridState || !arraysEqual(cachedGridState, grid)) {
    rebuildCache(grid, context);
  }

  // Draw cached static grid
  if (staticGridCanvas) {
    context.ctx.drawImage(staticGridCanvas, 0, 0);
  }

  // Draw animated elements on top
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cellState = grid[y][x];
      const position = { x, y };

      // Draw spawn/exit with animation
      if (cellState === 'spawn') {
        drawSpawnMarker(context, position);
      } else if (cellState === 'exit') {
        drawExitMarker(context, position);
      }
    }
  }

  // Draw hover effect
  if (hoveredCell && canPlace) {
    drawBuildableHover(context, hoveredCell);
  }
}

export function resetGridCache(): void {
  staticGridCanvas = null;
  cachedGridState = null;
}
