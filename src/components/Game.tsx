import { useRef, useEffect, useCallback, useState } from 'react';
import { engine } from '../game/Engine';
import { GAME_CONFIG, CANVAS_WIDTH, CANVAS_HEIGHT } from '../game/config';
import { GamePhase, TowerType, CellState, EnemyType } from '../game/types';
import type { Tower, Enemy, Projectile, Point } from '../game/types';
import type { SpriteRenderContext } from '../sprites/types';

// Import sprites
import { drawCell } from '../sprites/environment/GridCellSprites';
import { PathVisualizationSprite } from '../sprites/environment/PathVisualizationSprite';
import { LaserTurretSprite } from '../sprites/towers/LaserTurretSprite';
import { MissileBatterySprite } from '../sprites/towers/MissileBatterySprite';
import { TeslaCoilSprite } from '../sprites/towers/TeslaCoilSprite';
import { PlasmaCannonSprite } from '../sprites/towers/PlasmaCannonSprite';
import { ScoutDroneSprite } from '../sprites/enemies/ScoutDroneSprite';
import { AssaultBotSprite } from '../sprites/enemies/AssaultBotSprite';
import { HeavyMechSprite } from '../sprites/enemies/HeavyMechSprite';
import { SwarmUnitSprite } from '../sprites/enemies/SwarmUnitSprite';
import { BossSprite } from '../sprites/enemies/BossSprite';

// Sprite instances for stateful sprites (classes)
const scoutSprite = new ScoutDroneSprite();

// Map tower types to sprites
const towerSprites: Record<TowerType, typeof LaserTurretSprite> = {
  [TowerType.LASER]: LaserTurretSprite,
  [TowerType.MISSILE]: MissileBatterySprite,
  [TowerType.TESLA]: TeslaCoilSprite,
  [TowerType.CANNON]: PlasmaCannonSprite,
};

// Map enemy types to sprites
const enemySprites: Record<EnemyType, { draw: (ctx: SpriteRenderContext, enemy: Enemy) => void }> = {
  [EnemyType.SCOUT]: scoutSprite,
  [EnemyType.FIGHTER]: AssaultBotSprite,
  [EnemyType.TANK]: HeavyMechSprite,
  [EnemyType.SWARM]: SwarmUnitSprite,
  [EnemyType.BOSS]: BossSprite,
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredCell, setHoveredCell] = useState<Point | null>(null);
  const timeRef = useRef(0);

  // Use refs for values that the render loop needs without causing effect re-runs
  const hoveredCellRef = useRef<Point | null>(null);

  // Keep refs in sync with state
  hoveredCellRef.current = hoveredCell;

  // Convert mouse position to grid cell
  const getGridCell = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / GAME_CONFIG.CELL_SIZE);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / GAME_CONFIG.CELL_SIZE);

    if (x >= 0 && x < GAME_CONFIG.GRID_WIDTH && y >= 0 && y < GAME_CONFIG.GRID_HEIGHT) {
      return { x, y };
    }
    return null;
  }, []);

  // Handle mouse move for hover effect
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getGridCell(e);
    setHoveredCell(cell);
  }, [getGridCell]);

  // Handle mouse leave
  const handleMouseLeave = useCallback(() => {
    setHoveredCell(null);
  }, []);

  // Handle click for tower placement
  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getGridCell(e);
    const towerType = engine.getSnapshot().selectedTowerType;
    if (!cell || !towerType) return;

    const phase = engine.getPhase();
    if (phase !== GamePhase.PLANNING) return;

    // Try to place tower
    const tower = engine.placeTower(towerType, cell);
    if (tower) {
      console.log(`Placed ${towerType} tower at (${cell.x}, ${cell.y})`);
    }
  }, [getGridCell]);

  // Handle right-click for tower selling
  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const cell = getGridCell(e);
    if (!cell) return;

    const tower = engine.getTowerAt(cell);
    if (tower) {
      const refund = engine.sellTower(tower.id);
      console.log(`Sold tower for ${refund} credits`);
    }
  }, [getGridCell]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize engine with canvas (only once on mount)
    engine.init(canvas);

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

      // Render grid cells (use ref for hovered, get selectedTowerType from state)
      renderGrid(renderContext, state.grid, hoveredCellRef.current, state.selectedTowerType);

      // Render path visualization
      if (state.path.length > 0) {
        PathVisualizationSprite.draw(renderContext, state.path);
      }

      // Render towers
      for (const tower of state.towers.values()) {
        renderTower(renderContext, tower, state.selectedTower === tower.id);
      }

      // Render enemies
      for (const enemy of state.enemies.values()) {
        renderEnemy(renderContext, enemy);
      }

      // Render projectiles
      for (const projectile of state.projectiles.values()) {
        renderProjectile(renderContext, projectile);
      }

      // Render HUD overlay
      renderHUD(ctx!, state);

      animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
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

function renderGrid(
  context: SpriteRenderContext,
  grid: CellState[][],
  hoveredCell: Point | null,
  selectedTowerType: TowerType | null
): void {
  for (let y = 0; y < grid.length; y++) {
    for (let x = 0; x < grid[y].length; x++) {
      const cellState = grid[y][x];
      const position = { x, y };
      const isHovered = hoveredCell?.x === x && hoveredCell?.y === y;

      // Check if this cell can have a tower placed (for hover effect)
      const canPlace = isHovered &&
        selectedTowerType !== null &&
        cellState === CellState.EMPTY &&
        !engine.wouldBlockPath(position);

      drawCell(context, position, cellState, canPlace);
    }
  }
}

function renderTower(context: SpriteRenderContext, tower: Tower, isSelected: boolean): void {
  const sprite = towerSprites[tower.type];
  if (sprite) {
    sprite.draw(context, tower);

    // Draw range indicator if selected
    if (isSelected && sprite.drawRange) {
      sprite.drawRange(context, tower);
    }
  }
}

function renderEnemy(context: SpriteRenderContext, enemy: Enemy): void {
  const sprite = enemySprites[enemy.type];
  if (sprite) {
    sprite.draw(context, enemy);
  }
}

function renderProjectile(context: SpriteRenderContext, projectile: Projectile): void {
  // Simple projectile rendering - could be expanded with sprite types based on source tower
  const { ctx, cellSize } = context;
  const { x, y } = projectile.position;

  // Draw a simple glowing orb
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

function renderHUD(ctx: CanvasRenderingContext2D, state: ReturnType<typeof engine.getSnapshot>): void {
  const padding = 10;
  const fontSize = 16;

  ctx.font = `${fontSize}px monospace`;
  ctx.textBaseline = 'top';

  // Background for HUD (smaller since credits moved to TowerPanel)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(padding - 5, padding - 5, 200, 65);

  // Lives
  ctx.fillStyle = '#FF6666';
  ctx.fillText(`Lives: ${state.lives}`, padding, padding);

  // Wave
  ctx.fillStyle = '#66FF66';
  ctx.fillText(`Wave: ${state.wave}`, padding, padding + fontSize + 5);

  // Phase
  ctx.fillStyle = '#6666FF';
  ctx.fillText(`Phase: ${state.phase}`, padding, padding + (fontSize + 5) * 2);
}
