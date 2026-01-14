// A* Pathfinding implementation for Space Towers

import type { Point, CellState } from '../types';
import { CellState as CS } from '../types';

// Cells that can be walked through
const WALKABLE_CELLS: Set<CellState> = new Set([CS.EMPTY, CS.PATH, CS.SPAWN, CS.EXIT]);

interface PathNode {
  x: number;
  y: number;
  g: number; // Cost from start to this node
  h: number; // Heuristic estimate to end
  f: number; // Total cost (g + h)
  parent: PathNode | null;
}

function heuristic(a: Point, b: Point): number {
  // Manhattan distance
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function getNeighbors(grid: CellState[][], node: PathNode): Point[] {
  const neighbors: Point[] = [];
  const directions = [
    { x: 0, y: -1 }, // up
    { x: 0, y: 1 }, // down
    { x: -1, y: 0 }, // left
    { x: 1, y: 0 }, // right
  ];

  for (const dir of directions) {
    const nx = node.x + dir.x;
    const ny = node.y + dir.y;

    // Check bounds
    if (ny >= 0 && ny < grid.length && nx >= 0 && nx < grid[ny].length) {
      const cell = grid[ny][nx];
      if (WALKABLE_CELLS.has(cell)) {
        neighbors.push({ x: nx, y: ny });
      }
    }
  }

  return neighbors;
}

function nodeKey(point: Point): string {
  return `${point.x},${point.y}`;
}

function reconstructPath(endNode: PathNode): Point[] {
  const path: Point[] = [];
  let current: PathNode | null = endNode;

  while (current !== null) {
    path.unshift({ x: current.x, y: current.y });
    current = current.parent;
  }

  return path;
}

/**
 * A* pathfinding algorithm to find the shortest path between two points on a grid.
 * @param grid - 2D array of CellState representing the game grid
 * @param start - Starting point
 * @param end - Destination point
 * @returns Array of Points representing the path, or empty array if no path exists
 */
export function findPath(grid: CellState[][], start: Point, end: Point): Point[] {
  // Validate inputs
  if (grid.length === 0 || grid[0].length === 0) {
    return [];
  }

  // Check if start and end are within bounds
  if (
    start.y < 0 ||
    start.y >= grid.length ||
    start.x < 0 ||
    start.x >= grid[start.y].length ||
    end.y < 0 ||
    end.y >= grid.length ||
    end.x < 0 ||
    end.x >= grid[end.y].length
  ) {
    return [];
  }

  // Check if start equals end
  if (start.x === end.x && start.y === end.y) {
    return [{ x: start.x, y: start.y }];
  }

  // Check if start or end cells are walkable
  const startCell = grid[start.y][start.x];
  const endCell = grid[end.y][end.x];
  if (!WALKABLE_CELLS.has(startCell) || !WALKABLE_CELLS.has(endCell)) {
    return [];
  }

  const openSet: Map<string, PathNode> = new Map();
  const closedSet: Set<string> = new Set();

  const startNode: PathNode = {
    x: start.x,
    y: start.y,
    g: 0,
    h: heuristic(start, end),
    f: heuristic(start, end),
    parent: null,
  };

  openSet.set(nodeKey(start), startNode);

  while (openSet.size > 0) {
    // Find node with lowest f-score
    let current: PathNode | null = null;
    let lowestF = Infinity;

    for (const node of openSet.values()) {
      if (node.f < lowestF) {
        lowestF = node.f;
        current = node;
      }
    }

    if (current === null) {
      break;
    }

    // Check if we reached the end
    if (current.x === end.x && current.y === end.y) {
      return reconstructPath(current);
    }

    // Move current from open to closed set
    openSet.delete(nodeKey(current));
    closedSet.add(nodeKey(current));

    // Process neighbors
    for (const neighbor of getNeighbors(grid, current)) {
      const neighborKey = nodeKey(neighbor);

      if (closedSet.has(neighborKey)) {
        continue;
      }

      const tentativeG = current.g + 1;

      const existingNode = openSet.get(neighborKey);
      if (existingNode) {
        if (tentativeG < existingNode.g) {
          existingNode.g = tentativeG;
          existingNode.f = tentativeG + existingNode.h;
          existingNode.parent = current;
        }
      } else {
        const newNode: PathNode = {
          x: neighbor.x,
          y: neighbor.y,
          g: tentativeG,
          h: heuristic(neighbor, end),
          f: tentativeG + heuristic(neighbor, end),
          parent: current,
        };
        openSet.set(neighborKey, newNode);
      }
    }
  }

  // No path found
  return [];
}

/**
 * Check if placing a tower at the proposed position would block the path.
 * @param grid - 2D array of CellState representing the game grid
 * @param proposedTower - Position where the tower would be placed
 * @returns true if placing the tower would block the path, false otherwise
 */
export function wouldBlockPath(grid: CellState[][], proposedTower: Point): boolean {
  // Validate inputs
  if (grid.length === 0 || grid[0].length === 0) {
    return true;
  }

  if (
    proposedTower.y < 0 ||
    proposedTower.y >= grid.length ||
    proposedTower.x < 0 ||
    proposedTower.x >= grid[proposedTower.y].length
  ) {
    return true;
  }

  // Find spawn and exit points
  let spawn: Point | null = null;
  let exit: Point | null = null;

  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      if (grid[y][x] === CS.SPAWN) {
        spawn = { x, y };
      } else if (grid[y][x] === CS.EXIT) {
        exit = { x, y };
      }
    }
  }

  // If no spawn or exit, can't determine path blocking
  if (!spawn || !exit) {
    return true;
  }

  // Don't allow placing on spawn or exit
  if (
    (proposedTower.x === spawn.x && proposedTower.y === spawn.y) ||
    (proposedTower.x === exit.x && proposedTower.y === exit.y)
  ) {
    return true;
  }

  // Create a copy of the grid with the proposed tower
  const testGrid: CellState[][] = grid.map((row) => [...row]);
  testGrid[proposedTower.y][proposedTower.x] = CS.TOWER;

  // Check if a path still exists
  const path = findPath(testGrid, spawn, exit);
  return path.length === 0;
}
