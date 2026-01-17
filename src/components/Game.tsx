import { useRef, useEffect, useCallback, useState } from 'react';
import { engine } from '../game/Engine';
import { GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_STATS } from '../game/config';
import { TowerType, CellState } from '../game/types';
import type { Tower, Enemy, Projectile, Point } from '../game/types';
import type { SpriteRenderContext } from '../sprites/types';

// Import sprites
import { drawCachedGrid } from '../sprites/environment/GridCache';
import { PathVisualizationSprite } from '../sprites/environment/PathVisualizationSprite';
import { getTowerSprite, getEnemySprite } from '../sprites/SpriteRegistry';

// Import effects
import { drawAllDamageNumbers, spawnDamageNumber } from '../sprites/effects/DamageNumberSprite';
import { drawAllGoldNumbers, spawnGoldNumber } from '../sprites/effects/GoldNumberSprite';
import { explosionManager } from '../sprites/effects/ExplosionSprite';

// Import projectile sprites
import { MissileSprite } from '../sprites/projectiles/MissileSprite';

// Import event bus for effect subscriptions
import { eventBus } from '../game/events';

// Import combat module for hitscan effects
import { combatModule } from '../game/combat/CombatModule';

// Import input handler
import { inputHandler } from '../game/input';

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<Point | null>(null);
  const [hoveredTower, setHoveredTower] = useState<Tower | null>(null);
  const timeRef = useRef(0);

  // Use refs for values that the render loop needs without causing effect re-runs
  const hoveredCellRef = useRef<Point | null>(null);
  const hoveredTowerRef = useRef<Tower | null>(null);

  // Keep refs in sync with state
  useEffect(() => {
    hoveredCellRef.current = hoveredCell;
    hoveredTowerRef.current = hoveredTower;
  }, [hoveredCell, hoveredTower]);


  // Handle mouse move for hover effect - delegates to InputHandler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    inputHandler.handleMouseMove(e.clientX, e.clientY);
  }, []);

  // Handle mouse leave - delegates to InputHandler
  const handleMouseLeave = useCallback(() => {
    inputHandler.handleMouseLeave();
  }, []);

  // Handle click for tower placement or selection - delegates to InputHandler
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    inputHandler.handleClick(e.clientX, e.clientY);
  }, []);

  // Handle right-click for tower selling - delegates to InputHandler
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    inputHandler.handleContextMenu(e.clientX, e.clientY);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize engine with canvas (only once on mount)
    engine.init(canvas);

    // Initialize input handler with canvas and hover state callbacks
    inputHandler.init(canvas, {
      onHoveredCellChange: setHoveredCell,
      onHoveredTowerChange: setHoveredTower,
    });

    // Subscribe to visual effect events (rendering layer handles effects triggered by game logic)
    const unsubDamageNumber = eventBus.on('DAMAGE_NUMBER_REQUESTED', (event) => {
      spawnDamageNumber(event.payload.damage, event.payload.position, event.payload.time);
    });
    const unsubExplosion = eventBus.on('EXPLOSION_REQUESTED', (event) => {
      explosionManager.spawn(event.payload.position, event.payload.enemyType, event.payload.time);
    });
    const unsubGoldNumber = eventBus.on('GOLD_NUMBER_REQUESTED', (event) => {
      spawnGoldNumber(event.payload.amount, event.payload.position, event.payload.time);
    });

    // Start the game automatically for now
    engine.startGame();

    let animationFrameId: number;
    let lastTime = performance.now();

    function render(currentTime: number) {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timeRef.current += dt;

      // Get current game state
      const state = engine.getSnapshot();
      const renderContext: SpriteRenderContext = {
        ctx: ctx!,
        cellSize: GAME_CONFIG.CELL_SIZE,
        time: timeRef.current,
      };

      // Clear canvas with dark background
      ctx!.fillStyle = '#0a0a1a';
      ctx!.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Render grid cells using cached renderer
      const canPlaceAtHover = hoveredCellRef.current !== null &&
        state.selectedTowerType !== null &&
        state.grid[hoveredCellRef.current.y]?.[hoveredCellRef.current.x] === CellState.EMPTY &&
        !engine.wouldBlockPath(hoveredCellRef.current);
      drawCachedGrid(renderContext, state.grid, hoveredCellRef.current, canPlaceAtHover);

      // Render path visualization
      if (state.path.length > 0) {
        PathVisualizationSprite.draw(renderContext, state.path);
      }

      // Render tower preview when placing
      renderTowerPreview(renderContext, hoveredCellRef.current, state.selectedTowerType);

      // Render towers
      const towersArray = Array.from(state.towers.values());
      const hoveredTowerNow = hoveredTowerRef.current;
      for (const tower of towersArray) {
        const isSelected = state.selectedTower === tower.id;
        const isHovered = hoveredTowerNow?.id === tower.id;
        renderTower(renderContext, tower, isSelected, isHovered);
      }

      // Render enemies
      const enemiesArray = Array.from(state.enemies.values());
      for (const enemy of enemiesArray) {
        renderEnemy(renderContext, enemy);
      }

      // Render projectiles
      const projectilesArray = Array.from(state.projectiles.values());
      for (const projectile of projectilesArray) {
        renderProjectile(renderContext, projectile);
      }

      // Render tower firing effects (hitscan beams)
      renderHitscanEffects(renderContext, towersArray);

      // Render explosions
      explosionManager.drawAll(renderContext);

      // Render damage numbers
      drawAllDamageNumbers(renderContext);

      // Render gold numbers (kill rewards)
      drawAllGoldNumbers(renderContext);

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      unsubDamageNumber();
      unsubExplosion();
      unsubGoldNumber();
    };
  }, []); // Empty deps - only run once on mount

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{ display: 'block', border: '2px solid #333' }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    />
  );
}

// =============================================================================
// Render Functions
// =============================================================================

function renderTowerPreview(
  context: SpriteRenderContext,
  hoveredCell: Point | null,
  selectedTowerType: TowerType | null
): void {
  // Only show preview if we have a hovered cell and selected tower type
  if (!hoveredCell || !selectedTowerType) return;

  const sprite = getTowerSprite(selectedTowerType);
  if (!sprite) return;

  const { ctx, cellSize } = context;
  const canPlace = engine.canPlaceTower(hoveredCell);

  // Get tower stats for range preview
  const stats = TOWER_STATS[selectedTowerType];

  // Create a preview tower object with actual range for preview
  const previewTower: Tower = {
    id: 'preview',
    type: selectedTowerType,
    position: hoveredCell,
    level: 1,
    damage: stats.damage,
    range: stats.range,
    fireRate: stats.fireRate,
    lastFired: 0,
    target: null,
  };

  // Draw range preview (always show, dimmer if invalid)
  if (sprite.drawRange) {
    ctx.globalAlpha = canPlace ? 0.4 : 0.2;
    sprite.drawRange(context, previewTower, false);
    ctx.globalAlpha = 1.0;
  }

  // Draw valid/invalid indicator around the cell
  const cellX = hoveredCell.x * cellSize;
  const cellY = hoveredCell.y * cellSize;

  if (canPlace) {
    // Valid placement - green border
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);
  } else {
    // Invalid placement - red border and X
    ctx.strokeStyle = 'rgba(255, 50, 50, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4);

    // Draw X mark
    ctx.beginPath();
    ctx.moveTo(cellX + 8, cellY + 8);
    ctx.lineTo(cellX + cellSize - 8, cellY + cellSize - 8);
    ctx.moveTo(cellX + cellSize - 8, cellY + 8);
    ctx.lineTo(cellX + 8, cellY + cellSize - 8);
    ctx.stroke();
  }

  // Draw tower preview with appropriate tint
  if (canPlace) {
    // Valid - normal preview with green tint
    ctx.globalAlpha = 0.6;
    sprite.draw(context, previewTower);
    ctx.globalAlpha = 1.0;
  } else {
    // Invalid - red tinted preview
    ctx.globalAlpha = 0.4;
    sprite.draw(context, previewTower);
    ctx.globalAlpha = 1.0;

    // Overlay red tint
    ctx.fillStyle = 'rgba(255, 0, 0, 0.2)';
    ctx.fillRect(cellX, cellY, cellSize, cellSize);
  }
}

function renderTower(context: SpriteRenderContext, tower: Tower, isSelected: boolean, isHovered: boolean): void {
  const sprite = getTowerSprite(tower.type);
  if (sprite) {
    sprite.draw(context, tower);

    // Draw range indicator if selected or hovered
    if ((isSelected || isHovered) && sprite.drawRange) {
      sprite.drawRange(context, tower, isSelected);
    }
  }
}

function renderEnemy(context: SpriteRenderContext, enemy: Enemy): void {
  const sprite = getEnemySprite(enemy.type);
  if (sprite) {
    sprite.draw(context, enemy);
  }
}

function renderProjectile(context: SpriteRenderContext, projectile: Projectile): void {
  const { ctx, cellSize } = context;

  // Use appropriate sprite based on tower type
  if (projectile.towerType === TowerType.MISSILE) {
    MissileSprite.draw(context, projectile);
    return;
  }

  // Default: draw a simple glowing orb for cannon/other projectiles
  const { x, y } = projectile.position;

  ctx.fillStyle = 'rgba(255, 200, 100, 0.8)';
  ctx.beginPath();
  ctx.arc(x + cellSize / 2, y + cellSize / 2, 4, 0, Math.PI * 2);
  ctx.fill();

  // Glow effect
  ctx.fillStyle = 'rgba(255, 200, 100, 0.3)';
  ctx.beginPath();
  ctx.arc(x + cellSize / 2, y + cellSize / 2, 8, 0, Math.PI * 2);
  ctx.fill();
}

function renderHitscanEffects(context: SpriteRenderContext, towers: Tower[]): void {
  // Get active hitscan effects from combat module
  const hitscanEffects = combatModule.getHitscanEffects();

  // Create a map of towers by ID for quick lookup
  const towerMap = new Map<string, Tower>();
  for (const tower of towers) {
    towerMap.set(tower.id, tower);
  }

  // Render each active hitscan effect
  for (const effect of hitscanEffects) {
    const tower = towerMap.get(effect.towerId);
    if (!tower) continue;

    // Get the sprite for this tower type
    const sprite = getTowerSprite(tower.type);
    if (!sprite || !sprite.drawFiring) continue;

    // Convert target position to grid coordinates for drawFiring
    // Effect target positions are in pixels (enemy positions)
    const targetGridPos: Point = {
      x: effect.targetPosition.x / context.cellSize,
      y: effect.targetPosition.y / context.cellSize,
    };

    sprite.drawFiring(context, tower, targetGridPos);
  }

  // Also render chain lightning effects
  const chainEffects = combatModule.getChainEffects();
  for (const effect of chainEffects) {
    const tower = towerMap.get(effect.towerId);
    if (!tower || tower.type !== TowerType.TESLA) continue;

    const sprite = getTowerSprite(tower.type);
    if (!sprite || !sprite.drawFiring) continue;

    // Draw chain to each target in sequence
    for (let i = 0; i < effect.targets.length; i++) {
      const targetPos = effect.targets[i];
      // Chain targets are in pixels
      const targetGridPos: Point = {
        x: targetPos.x / context.cellSize,
        y: targetPos.y / context.cellSize,
      };

      // For first target, draw from tower
      if (i === 0) {
        sprite.drawFiring(context, tower, targetGridPos);
      }
      // For subsequent targets, draw chain from previous target
      // (The TeslaCoilSprite already handles multi-target in some way)
    }
  }
}
