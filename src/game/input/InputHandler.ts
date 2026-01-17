// Input Handler - Manages mouse input and dispatches commands
// Separates input handling from UI component

import { engine } from '../Engine';
import { GAME_CONFIG } from '../config';
import type { Point, Tower } from '../types';
import {
  PlaceTowerCommand,
  SellTowerCommand,
  SelectTowerCommand,
  ToggleTowerSelectionCommand,
} from './commands';

/**
 * Callbacks for input state changes
 */
export interface InputHandlerCallbacks {
  onHoveredCellChange: (cell: Point | null) => void;
  onHoveredTowerChange: (tower: Tower | null) => void;
}

/**
 * Handles mouse input and dispatches game commands
 */
export class InputHandler {
  private canvas: HTMLCanvasElement | null = null;
  private callbacks: InputHandlerCallbacks | null = null;

  /**
   * Initialize the input handler with a canvas and callbacks
   */
  init(canvas: HTMLCanvasElement, callbacks: InputHandlerCallbacks): void {
    this.canvas = canvas;
    this.callbacks = callbacks;
  }

  /**
   * Convert mouse event coordinates to grid cell position
   */
  getGridCell(clientX: number, clientY: number): Point | null {
    if (!this.canvas) return null;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;

    const x = Math.floor(((clientX - rect.left) * scaleX) / GAME_CONFIG.CELL_SIZE);
    const y = Math.floor(((clientY - rect.top) * scaleY) / GAME_CONFIG.CELL_SIZE);

    if (x >= 0 && x < GAME_CONFIG.GRID_WIDTH && y >= 0 && y < GAME_CONFIG.GRID_HEIGHT) {
      return { x, y };
    }
    return null;
  }

  /**
   * Handle mouse move - updates hover state
   */
  handleMouseMove(clientX: number, clientY: number): void {
    if (!this.callbacks) return;

    const cell = this.getGridCell(clientX, clientY);
    this.callbacks.onHoveredCellChange(cell);

    // Check if hovering over a tower
    if (cell) {
      const tower = engine.getTowerAt(cell);
      this.callbacks.onHoveredTowerChange(tower ?? null);
    } else {
      this.callbacks.onHoveredTowerChange(null);
    }
  }

  /**
   * Handle mouse leave - clears hover state
   */
  handleMouseLeave(): void {
    if (!this.callbacks) return;

    this.callbacks.onHoveredCellChange(null);
    this.callbacks.onHoveredTowerChange(null);
  }

  /**
   * Handle click - tower placement or selection
   */
  handleClick(clientX: number, clientY: number): void {
    const cell = this.getGridCell(clientX, clientY);
    if (!cell) return;

    const state = engine.getSnapshot();
    const selectedTowerType = state.selectedTowerType;

    // If we have a tower type selected, try to place it
    if (selectedTowerType) {
      const command = new PlaceTowerCommand(selectedTowerType, cell);
      command.execute();
      return;
    }

    // No tower type selected - check if clicking on a tower to select it
    const clickedTower = engine.getTowerAt(cell);
    if (clickedTower) {
      const command = new ToggleTowerSelectionCommand(
        clickedTower.id,
        state.selectedTower
      );
      command.execute();
    } else {
      // Clicked on empty space - deselect any selected tower
      const command = new SelectTowerCommand(null);
      command.execute();
    }
  }

  /**
   * Handle right-click - tower selling or cancel placement
   */
  handleContextMenu(clientX: number, clientY: number): void {
    const cell = this.getGridCell(clientX, clientY);
    if (!cell) return;

    const tower = engine.getTowerAt(cell);
    if (tower) {
      const command = new SellTowerCommand(tower.id);
      command.execute();
    } else {
      // Right-click on empty cell - deselect tower type (cancel placement mode)
      engine.setSelectedTowerType(null);
    }
  }
}

// Export singleton instance
export const inputHandler = new InputHandler();
