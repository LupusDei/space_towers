// Heavy Mech Sprite - Large armored walker with stomping animation

import type { Enemy } from '../../types';
import type { EnemySprite, SpriteRenderContext } from '../types';

// Track health for damage flash detection
const lastHealthMap = new Map<string, number>();
const damageFlashMap = new Map<string, number>();

const FLASH_DURATION = 150; // ms

export const HeavyMechSprite: EnemySprite = {
  draw(context: SpriteRenderContext, enemy: Enemy): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = enemy.position;

    // Convert grid position to pixel coordinates (center of cell)
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Mech is large - takes up most of a cell
    const bodyWidth = cellSize * 0.7;
    const bodyHeight = cellSize * 0.5;

    // Slow stomping animation (slower than normal enemies)
    const stompCycle = (time / 400) % (Math.PI * 2); // Slow cycle
    const leftLegOffset = Math.sin(stompCycle) * 3;
    const rightLegOffset = Math.sin(stompCycle + Math.PI) * 3;

    // Check for damage flash
    const lastHealth = lastHealthMap.get(enemy.id);
    if (lastHealth !== undefined && enemy.health < lastHealth) {
      damageFlashMap.set(enemy.id, time);
    }
    lastHealthMap.set(enemy.id, enemy.health);

    const flashTime = damageFlashMap.get(enemy.id) || 0;
    const isFlashing = time - flashTime < FLASH_DURATION;

    ctx.save();

    // Base colors (red color scheme)
    const bodyColor = isFlashing ? '#FFFFFF' : '#8B0000'; // Dark red, white when flashing
    const accentColor = isFlashing ? '#FFFFFF' : '#FF4444'; // Lighter red accent
    const metalColor = isFlashing ? '#FFFFFF' : '#444444'; // Metal gray

    // Draw legs (behind body)
    ctx.fillStyle = metalColor;

    // Left leg
    ctx.fillRect(
      centerX - bodyWidth / 3 - 4,
      centerY + bodyHeight / 4 + leftLegOffset,
      8,
      cellSize * 0.3
    );

    // Right leg
    ctx.fillRect(
      centerX + bodyWidth / 3 - 4,
      centerY + bodyHeight / 4 + rightLegOffset,
      8,
      cellSize * 0.3
    );

    // Draw feet (armored boots)
    ctx.fillStyle = bodyColor;
    ctx.fillRect(
      centerX - bodyWidth / 3 - 6,
      centerY + bodyHeight / 4 + cellSize * 0.25 + leftLegOffset,
      12,
      6
    );
    ctx.fillRect(
      centerX + bodyWidth / 3 - 6,
      centerY + bodyHeight / 4 + cellSize * 0.25 + rightLegOffset,
      12,
      6
    );

    // Draw main body (hexagonal armored chassis)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX - bodyWidth / 2, centerY - bodyHeight / 4);
    ctx.lineTo(centerX - bodyWidth / 3, centerY - bodyHeight / 2);
    ctx.lineTo(centerX + bodyWidth / 3, centerY - bodyHeight / 2);
    ctx.lineTo(centerX + bodyWidth / 2, centerY - bodyHeight / 4);
    ctx.lineTo(centerX + bodyWidth / 2, centerY + bodyHeight / 4);
    ctx.lineTo(centerX + bodyWidth / 3, centerY + bodyHeight / 2);
    ctx.lineTo(centerX - bodyWidth / 3, centerY + bodyHeight / 2);
    ctx.lineTo(centerX - bodyWidth / 2, centerY + bodyHeight / 4);
    ctx.closePath();
    ctx.fill();

    // Body outline
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw cockpit/head (small rectangle on top)
    ctx.fillStyle = metalColor;
    ctx.fillRect(
      centerX - bodyWidth / 6,
      centerY - bodyHeight / 2 - 8,
      bodyWidth / 3,
      10
    );

    // Cockpit visor (glowing red eye)
    ctx.fillStyle = isFlashing ? '#FFFFFF' : '#FF0000';
    ctx.fillRect(
      centerX - bodyWidth / 8,
      centerY - bodyHeight / 2 - 6,
      bodyWidth / 4,
      4
    );

    // Draw shoulder armor
    ctx.fillStyle = accentColor;
    ctx.fillRect(centerX - bodyWidth / 2 - 4, centerY - bodyHeight / 4, 8, bodyHeight / 2);
    ctx.fillRect(centerX + bodyWidth / 2 - 4, centerY - bodyHeight / 4, 8, bodyHeight / 2);

    // Draw weapon mounts (small cannons on shoulders)
    ctx.fillStyle = metalColor;
    ctx.fillRect(centerX - bodyWidth / 2 - 8, centerY - bodyHeight / 6, 6, 4);
    ctx.fillRect(centerX + bodyWidth / 2 + 2, centerY - bodyHeight / 6, 6, 4);

    // Always-visible health bar (positioned above the mech)
    const healthBarWidth = bodyWidth;
    const healthBarHeight = 6;
    const healthBarX = centerX - healthBarWidth / 2;
    const healthBarY = centerY - bodyHeight / 2 - 20;
    const healthPercent = enemy.health / enemy.maxHealth;

    // Health bar background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health bar fill (red to dark red based on health)
    const healthColor = healthPercent > 0.5 ? '#FF4444' : healthPercent > 0.25 ? '#FF8800' : '#FF0000';
    ctx.fillStyle = healthColor;
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

    // Health bar border
    ctx.strokeStyle = '#666666';
    ctx.lineWidth = 1;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    ctx.restore();
  },
};
