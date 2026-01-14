// Targeting System for Space Towers
// Target selection using QueryInterface

import type { Tower, Enemy, Point, QueryInterface } from '../types';
import { GAME_CONFIG } from '../config';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate distance between two points
 */
function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Convert cells to pixels
 */
function cellsToPixels(cells: number): number {
  return cells * GAME_CONFIG.CELL_SIZE;
}

// ============================================================================
// Core Targeting Functions
// ============================================================================

/**
 * Find the best target for a tower - the enemy furthest along path within range.
 * Prioritizes enemies that are closest to escaping.
 */
export function findTarget(tower: Tower, query: QueryInterface): Enemy | null {
  const enemiesInRange = query.getEnemiesInRange(tower.position, tower.range);

  if (enemiesInRange.length === 0) {
    return null;
  }

  // Find enemy with highest pathIndex (furthest along path)
  let bestTarget: Enemy | null = null;
  let highestPathIndex = -1;

  for (const enemy of enemiesInRange) {
    if (enemy.pathIndex > highestPathIndex) {
      highestPathIndex = enemy.pathIndex;
      bestTarget = enemy;
    }
  }

  return bestTarget;
}

/**
 * Find chain targets for Tesla tower.
 * Returns additional targets near the primary target for chain lightning.
 * @param primary - The primary target enemy
 * @param query - Query interface for game state
 * @param maxChain - Maximum number of chain targets (default: 2)
 * @param chainRangeCells - Range in cells to find chain targets (default: 2)
 */
export function findChainTargets(
  primary: Enemy,
  query: QueryInterface,
  maxChain: number = 2,
  chainRangeCells: number = 2
): Enemy[] {
  const chainRangePixels = cellsToPixels(chainRangeCells);
  const allEnemies = query.getEnemies();

  // Find enemies within chain range of primary (excluding primary)
  const nearbyEnemies = allEnemies.filter(
    (enemy) =>
      enemy.id !== primary.id && distance(enemy.position, primary.position) <= chainRangePixels
  );

  // Sort by distance from primary (closest first for chain effect)
  nearbyEnemies.sort(
    (a, b) => distance(a.position, primary.position) - distance(b.position, primary.position)
  );

  // Return up to maxChain targets
  return nearbyEnemies.slice(0, maxChain);
}

/**
 * Get enemies within splash radius for Missile tower.
 * Used to calculate splash damage area of effect.
 * @param position - Center position of the splash
 * @param splashRadiusCells - Splash radius in cells (default: 1.5)
 * @param query - Query interface for game state
 */
export function getEnemiesInSplash(
  position: Point,
  query: QueryInterface,
  splashRadiusCells: number = 1.5
): Enemy[] {
  const splashRadiusPixels = cellsToPixels(splashRadiusCells);
  const allEnemies = query.getEnemies();

  return allEnemies.filter((enemy) => distance(enemy.position, position) <= splashRadiusPixels);
}
