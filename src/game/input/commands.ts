// Game Commands - Command pattern for game actions
// Decouples input handling from game logic execution

import { engine } from '../Engine';
import { GamePhase } from '../types';
import type { Point, TowerType } from '../types';

/**
 * Command interface for game actions
 */
export interface GameCommand {
  execute(): void;
}

/**
 * Command to place a tower at a grid position
 */
export class PlaceTowerCommand implements GameCommand {
  private towerType: TowerType;
  private position: Point;

  constructor(towerType: TowerType, position: Point) {
    this.towerType = towerType;
    this.position = position;
  }

  execute(): void {
    // Only allow placement during planning phase
    if (engine.getPhase() !== GamePhase.PLANNING) return;

    const tower = engine.placeTower(this.towerType, this.position);
    if (tower) {
      console.log(`Placed ${this.towerType} tower at (${this.position.x}, ${this.position.y})`);
    }
  }
}

/**
 * Command to sell a tower
 */
export class SellTowerCommand implements GameCommand {
  private towerId: string;

  constructor(towerId: string) {
    this.towerId = towerId;
  }

  execute(): void {
    const refund = engine.sellTower(this.towerId);
    console.log(`Sold tower for ${refund} credits`);
  }
}

/**
 * Command to select or deselect a tower
 */
export class SelectTowerCommand implements GameCommand {
  private towerId: string | null;

  constructor(towerId: string | null) {
    this.towerId = towerId;
  }

  execute(): void {
    engine.setSelectedTower(this.towerId);
  }
}

/**
 * Command to toggle tower selection (select if not selected, deselect if selected)
 */
export class ToggleTowerSelectionCommand implements GameCommand {
  private towerId: string;
  private currentlySelectedId: string | null;

  constructor(towerId: string, currentlySelectedId: string | null) {
    this.towerId = towerId;
    this.currentlySelectedId = currentlySelectedId;
  }

  execute(): void {
    if (this.currentlySelectedId === this.towerId) {
      engine.setSelectedTower(null);
    } else {
      engine.setSelectedTower(this.towerId);
    }
  }
}
