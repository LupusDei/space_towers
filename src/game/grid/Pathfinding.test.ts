import { describe, it, expect } from 'vitest';
import { findPath, wouldBlockPath, findSpawnAndExit } from './Pathfinding';
import { CellState } from '../types';

const E = CellState.EMPTY;
const P = CellState.PATH;
const B = CellState.BLOCKED;
const T = CellState.TOWER;
const S = CellState.SPAWN;
const X = CellState.EXIT;

describe('findPath', () => {
  it('finds a straight path', () => {
    const grid = [[S, E, E, X]];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 });
    expect(path).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
    ]);
  });

  it('finds a path around obstacles', () => {
    const grid = [
      [S, B, E],
      [E, B, E],
      [E, E, X],
    ];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 2 });
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 2, y: 2 });
  });

  it('returns empty array when no path exists', () => {
    const grid = [
      [S, B, X],
      [B, B, B],
    ];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path).toEqual([]);
  });

  it('returns single point when start equals end', () => {
    const grid = [[S, E, X]];
    const path = findPath(grid, { x: 1, y: 0 }, { x: 1, y: 0 });
    expect(path).toEqual([{ x: 1, y: 0 }]);
  });

  it('returns empty array for empty grid', () => {
    const path = findPath([], { x: 0, y: 0 }, { x: 1, y: 0 });
    expect(path).toEqual([]);
  });

  it('returns empty array when start is out of bounds', () => {
    const grid = [[S, E, X]];
    const path = findPath(grid, { x: -1, y: 0 }, { x: 2, y: 0 });
    expect(path).toEqual([]);
  });

  it('returns empty array when end is out of bounds', () => {
    const grid = [[S, E, X]];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 5, y: 0 });
    expect(path).toEqual([]);
  });

  it('returns empty array when start is on blocked cell', () => {
    const grid = [[B, E, X]];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path).toEqual([]);
  });

  it('returns empty array when end is on blocked cell', () => {
    const grid = [[S, E, B]];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path).toEqual([]);
  });

  it('can path through PATH cells', () => {
    const grid = [[S, P, P, X]];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 });
    expect(path.length).toBe(4);
  });

  it('avoids TOWER cells', () => {
    const grid = [
      [S, T, X],
      [E, E, E],
    ];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 2, y: 0 });
    expect(path.length).toBeGreaterThan(0);
    // Path should go around the tower
    expect(path).not.toContainEqual({ x: 1, y: 0 });
  });

  it('finds optimal path in a maze', () => {
    const grid = [
      [S, E, B, E, E],
      [B, E, B, E, B],
      [E, E, E, E, E],
      [E, B, B, B, E],
      [E, E, E, E, X],
    ];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 4, y: 4 });
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 4, y: 4 });
  });
});

describe('wouldBlockPath', () => {
  it('returns false when tower placement leaves path open', () => {
    const grid = [
      [S, E, E, X],
      [E, E, E, E],
    ];
    const result = wouldBlockPath(grid, { x: 1, y: 1 });
    expect(result).toBe(false);
  });

  it('returns true when tower placement blocks only path', () => {
    const grid = [[S, E, X]];
    const result = wouldBlockPath(grid, { x: 1, y: 0 });
    expect(result).toBe(true);
  });

  it('returns true when placing on spawn', () => {
    const grid = [[S, E, X]];
    const result = wouldBlockPath(grid, { x: 0, y: 0 });
    expect(result).toBe(true);
  });

  it('returns true when placing on exit', () => {
    const grid = [[S, E, X]];
    const result = wouldBlockPath(grid, { x: 2, y: 0 });
    expect(result).toBe(true);
  });

  it('returns true for out of bounds position', () => {
    const grid = [[S, E, X]];
    const result = wouldBlockPath(grid, { x: -1, y: 0 });
    expect(result).toBe(true);
  });

  it('returns true for empty grid', () => {
    const result = wouldBlockPath([], { x: 0, y: 0 });
    expect(result).toBe(true);
  });

  it('returns true when no spawn exists', () => {
    const grid = [[E, E, X]];
    const result = wouldBlockPath(grid, { x: 1, y: 0 });
    expect(result).toBe(true);
  });

  it('returns true when no exit exists', () => {
    const grid = [[S, E, E]];
    const result = wouldBlockPath(grid, { x: 1, y: 0 });
    expect(result).toBe(true);
  });

  it('allows placement that leaves alternate path', () => {
    const grid = [
      [S, E, X],
      [E, E, E],
    ];
    // Blocking top middle still leaves path through bottom
    const result = wouldBlockPath(grid, { x: 1, y: 0 });
    expect(result).toBe(false);
  });

  it('detects blocked path in complex grid', () => {
    const grid = [
      [S, E, B],
      [B, E, B],
      [B, E, X],
    ];
    // The only path is through the middle column
    // Blocking any middle cell should block the path
    const result = wouldBlockPath(grid, { x: 1, y: 1 });
    expect(result).toBe(true);
  });

  it('works with cached spawn and exit positions', () => {
    const grid = [
      [S, E, E, X],
      [E, E, E, E],
    ];
    // Cache the spawn/exit positions
    const endpoints = findSpawnAndExit(grid);
    expect(endpoints).not.toBeNull();

    // Use cached positions - avoids grid scan
    const result1 = wouldBlockPath(grid, { x: 1, y: 1 }, endpoints!.spawn, endpoints!.exit);
    expect(result1).toBe(false);

    // Another check with same cached positions
    const result2 = wouldBlockPath(grid, { x: 1, y: 0 }, endpoints!.spawn, endpoints!.exit);
    expect(result2).toBe(false);
  });
});

describe('findSpawnAndExit', () => {
  it('finds spawn and exit in simple grid', () => {
    const grid = [[S, E, X]];
    const result = findSpawnAndExit(grid);
    expect(result).toEqual({
      spawn: { x: 0, y: 0 },
      exit: { x: 2, y: 0 },
    });
  });

  it('finds spawn and exit in multi-row grid', () => {
    const grid = [
      [E, E, E],
      [S, E, E],
      [E, E, X],
    ];
    const result = findSpawnAndExit(grid);
    expect(result).toEqual({
      spawn: { x: 0, y: 1 },
      exit: { x: 2, y: 2 },
    });
  });

  it('returns null when no spawn exists', () => {
    const grid = [[E, E, X]];
    const result = findSpawnAndExit(grid);
    expect(result).toBeNull();
  });

  it('returns null when no exit exists', () => {
    const grid = [[S, E, E]];
    const result = findSpawnAndExit(grid);
    expect(result).toBeNull();
  });

  it('returns null for empty grid', () => {
    const result = findSpawnAndExit([]);
    expect(result).toBeNull();
  });
});

describe('findPath with blockedCells', () => {
  it('avoids cells in blockedCells set', () => {
    const grid = [[S, E, E, X]];
    // Block the middle path
    const blockedCells = new Set(['1,0']);
    const path = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 }, blockedCells);
    // Should fail since there's no alternate path
    expect(path).toEqual([]);
  });

  it('finds path when blockedCells doesnt block the route', () => {
    const grid = [
      [S, E, E, X],
      [E, E, E, E],
    ];
    // Block top-middle cell
    const blockedCells = new Set(['1,0']);
    const path = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 }, blockedCells);
    // Should find alternate path through bottom row
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual({ x: 0, y: 0 });
    expect(path[path.length - 1]).toEqual({ x: 3, y: 0 });
    // Should not include the blocked cell
    expect(path).not.toContainEqual({ x: 1, y: 0 });
  });

  it('works with empty blockedCells set', () => {
    const grid = [[S, E, E, X]];
    const blockedCells = new Set<string>();
    const path = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 }, blockedCells);
    expect(path.length).toBe(4);
  });

  it('works without blockedCells parameter', () => {
    const grid = [[S, E, E, X]];
    const path = findPath(grid, { x: 0, y: 0 }, { x: 3, y: 0 });
    expect(path.length).toBe(4);
  });
});
