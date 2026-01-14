// Grid System - Grid state management for Space Towers

import { CellState, type Point } from '../types';
import { GAME_CONFIG } from '../config';

export interface Grid {
  readonly width: number;
  readonly height: number;
  getCell(position: Point): CellState;
  setCell(position: Point, state: CellState): void;
  canPlaceTower(position: Point): boolean;
  isInBounds(position: Point): boolean;
  getCells(): CellState[][];
  reset(): void;
}

export function createGrid(
  width: number = GAME_CONFIG.GRID_WIDTH,
  height: number = GAME_CONFIG.GRID_HEIGHT
): Grid {
  let cells: CellState[][] = initializeCells(width, height);

  function initializeCells(w: number, h: number): CellState[][] {
    const grid: CellState[][] = [];
    for (let y = 0; y < h; y++) {
      const row: CellState[] = [];
      for (let x = 0; x < w; x++) {
        row.push(CellState.EMPTY);
      }
      grid.push(row);
    }
    return grid;
  }

  function isInBounds(position: Point): boolean {
    const { x, y } = position;
    return x >= 0 && x < width && y >= 0 && y < height;
  }

  function getCell(position: Point): CellState {
    if (!isInBounds(position)) {
      return CellState.BLOCKED;
    }
    return cells[position.y][position.x];
  }

  function setCell(position: Point, state: CellState): void {
    if (!isInBounds(position)) {
      return;
    }
    cells[position.y][position.x] = state;
  }

  function canPlaceTower(position: Point): boolean {
    if (!isInBounds(position)) {
      return false;
    }
    const cellState = getCell(position);
    return cellState === CellState.EMPTY;
  }

  function getCells(): CellState[][] {
    return cells;
  }

  function reset(): void {
    cells = initializeCells(width, height);
  }

  return {
    width,
    height,
    getCell,
    setCell,
    canPlaceTower,
    isInBounds,
    getCells,
    reset,
  };
}

export default createGrid;
