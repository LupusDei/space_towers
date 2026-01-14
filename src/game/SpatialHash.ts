// Spatial Hash Grid for efficient spatial queries
// Divides the game area into cells for O(1) average-case enemy lookups

import type { Point, Enemy } from './types';
import { GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from './config';

// Cell size should be roughly the size of the largest tower range
// This ensures we check at most 9 cells for any range query
const SPATIAL_CELL_SIZE = GAME_CONFIG.CELL_SIZE * 4; // ~4 tiles = typical tower range

export interface SpatialHash {
  insert(enemy: Enemy): void;
  remove(enemy: Enemy): void;
  update(enemy: Enemy): void;
  query(position: Point, range: number): Enemy[];
  clear(): void;
  rebuild(enemies: Iterable<Enemy>): void;
}

interface SpatialCell {
  enemies: Set<Enemy>;
}

export function createSpatialHash(): SpatialHash {
  const cols = Math.ceil(CANVAS_WIDTH / SPATIAL_CELL_SIZE);
  const rows = Math.ceil(CANVAS_HEIGHT / SPATIAL_CELL_SIZE);
  const cells: SpatialCell[][] = [];

  // Track which cell each enemy is in for efficient updates
  const enemyCells = new Map<string, { col: number; row: number }>();

  // Initialize grid
  for (let row = 0; row < rows; row++) {
    cells[row] = [];
    for (let col = 0; col < cols; col++) {
      cells[row][col] = { enemies: new Set() };
    }
  }

  function getCellCoords(x: number, y: number): { col: number; row: number } {
    const col = Math.floor(x / SPATIAL_CELL_SIZE);
    const row = Math.floor(y / SPATIAL_CELL_SIZE);
    return {
      col: Math.max(0, Math.min(cols - 1, col)),
      row: Math.max(0, Math.min(rows - 1, row)),
    };
  }

  function insert(enemy: Enemy): void {
    const { col, row } = getCellCoords(enemy.position.x, enemy.position.y);
    cells[row][col].enemies.add(enemy);
    enemyCells.set(enemy.id, { col, row });
  }

  function remove(enemy: Enemy): void {
    const cellCoords = enemyCells.get(enemy.id);
    if (cellCoords) {
      cells[cellCoords.row][cellCoords.col].enemies.delete(enemy);
      enemyCells.delete(enemy.id);
    }
  }

  function update(enemy: Enemy): void {
    const oldCoords = enemyCells.get(enemy.id);
    const newCoords = getCellCoords(enemy.position.x, enemy.position.y);

    // Only update if cell changed
    if (oldCoords && (oldCoords.col !== newCoords.col || oldCoords.row !== newCoords.row)) {
      cells[oldCoords.row][oldCoords.col].enemies.delete(enemy);
      cells[newCoords.row][newCoords.col].enemies.add(enemy);
      enemyCells.set(enemy.id, newCoords);
    } else if (!oldCoords) {
      // Enemy not in grid, insert it
      insert(enemy);
    }
  }

  function query(position: Point, range: number): Enemy[] {
    // Convert grid position to pixel position for comparison
    const centerX = position.x * GAME_CONFIG.CELL_SIZE;
    const centerY = position.y * GAME_CONFIG.CELL_SIZE;
    const rangeSquared = range * range;

    // Calculate cell range to check
    const minCol = Math.max(0, Math.floor((centerX - range) / SPATIAL_CELL_SIZE));
    const maxCol = Math.min(cols - 1, Math.floor((centerX + range) / SPATIAL_CELL_SIZE));
    const minRow = Math.max(0, Math.floor((centerY - range) / SPATIAL_CELL_SIZE));
    const maxRow = Math.min(rows - 1, Math.floor((centerY + range) / SPATIAL_CELL_SIZE));

    const result: Enemy[] = [];

    // Check all cells that could contain enemies in range
    for (let row = minRow; row <= maxRow; row++) {
      for (let col = minCol; col <= maxCol; col++) {
        for (const enemy of cells[row][col].enemies) {
          const dx = enemy.position.x - centerX;
          const dy = enemy.position.y - centerY;
          const distSquared = dx * dx + dy * dy;

          if (distSquared <= rangeSquared) {
            result.push(enemy);
          }
        }
      }
    }

    return result;
  }

  function clear(): void {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        cells[row][col].enemies.clear();
      }
    }
    enemyCells.clear();
  }

  function rebuild(enemies: Iterable<Enemy>): void {
    clear();
    for (const enemy of enemies) {
      insert(enemy);
    }
  }

  return {
    insert,
    remove,
    update,
    query,
    clear,
    rebuild,
  };
}
