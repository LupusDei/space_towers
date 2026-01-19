// Assault Bot Sprite - Medium humanoid robot with walking animation

import type { Enemy } from '../../game/types';
import type { EnemySprite, SpriteRenderContext } from '../types';
import { drawHealthBar } from '../effects/HealthBar';
import { drawSlowIndicator } from '../effects/SlowIndicator';

export const AssaultBotSprite: EnemySprite = {
  draw(context: SpriteRenderContext, enemy: Enemy): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = enemy.position;

    // Enemy position is already in pixels, just add half cell to get center
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;

    // Medium-sized robot - about 60% of cell
    const bodyWidth = cellSize * 0.5;
    const bodyHeight = cellSize * 0.4;

    // Walking animation cycle
    const walkCycle = (time / 250) % (Math.PI * 2);
    const leftLegOffset = Math.sin(walkCycle) * 4;
    const rightLegOffset = Math.sin(walkCycle + Math.PI) * 4;
    const armSwing = Math.sin(walkCycle) * 0.3;

    ctx.save();

    // Yellow/orange color scheme
    const bodyColor = '#FF8C00'; // Dark orange
    const accentColor = '#FFD700'; // Gold
    const darkColor = '#B8860B'; // Dark goldenrod
    const metalColor = '#555555';

    // Draw legs (behind body)
    ctx.fillStyle = metalColor;

    // Left leg
    ctx.fillRect(
      centerX - bodyWidth / 4 - 3,
      centerY + bodyHeight / 3 + leftLegOffset,
      6,
      cellSize * 0.25
    );

    // Right leg
    ctx.fillRect(
      centerX + bodyWidth / 4 - 3,
      centerY + bodyHeight / 3 + rightLegOffset,
      6,
      cellSize * 0.25
    );

    // Draw feet
    ctx.fillStyle = darkColor;
    ctx.fillRect(
      centerX - bodyWidth / 4 - 4,
      centerY + bodyHeight / 3 + cellSize * 0.2 + leftLegOffset,
      8,
      5
    );
    ctx.fillRect(
      centerX + bodyWidth / 4 - 4,
      centerY + bodyHeight / 3 + cellSize * 0.2 + rightLegOffset,
      8,
      5
    );

    // Draw arms (swing with walk)
    ctx.save();
    ctx.translate(centerX - bodyWidth / 2 - 2, centerY - bodyHeight / 6);
    ctx.rotate(armSwing);
    ctx.fillStyle = metalColor;
    ctx.fillRect(-2, 0, 4, cellSize * 0.2);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-3, cellSize * 0.18, 6, 4); // Hand/weapon
    ctx.restore();

    ctx.save();
    ctx.translate(centerX + bodyWidth / 2 + 2, centerY - bodyHeight / 6);
    ctx.rotate(-armSwing);
    ctx.fillStyle = metalColor;
    ctx.fillRect(-2, 0, 4, cellSize * 0.2);
    ctx.fillStyle = accentColor;
    ctx.fillRect(-3, cellSize * 0.18, 6, 4); // Hand/weapon
    ctx.restore();

    // Draw main body (torso)
    ctx.fillStyle = bodyColor;
    ctx.beginPath();
    ctx.moveTo(centerX - bodyWidth / 2, centerY - bodyHeight / 3);
    ctx.lineTo(centerX - bodyWidth / 3, centerY - bodyHeight / 2);
    ctx.lineTo(centerX + bodyWidth / 3, centerY - bodyHeight / 2);
    ctx.lineTo(centerX + bodyWidth / 2, centerY - bodyHeight / 3);
    ctx.lineTo(centerX + bodyWidth / 2, centerY + bodyHeight / 3);
    ctx.lineTo(centerX + bodyWidth / 4, centerY + bodyHeight / 2);
    ctx.lineTo(centerX - bodyWidth / 4, centerY + bodyHeight / 2);
    ctx.lineTo(centerX - bodyWidth / 2, centerY + bodyHeight / 3);
    ctx.closePath();
    ctx.fill();

    // Body accent stripe
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Chest plate detail
    ctx.fillStyle = darkColor;
    ctx.fillRect(centerX - bodyWidth / 4, centerY - bodyHeight / 4, bodyWidth / 2, bodyHeight / 3);

    // Draw head
    ctx.fillStyle = bodyColor;
    ctx.fillRect(
      centerX - bodyWidth / 5,
      centerY - bodyHeight / 2 - cellSize * 0.15,
      bodyWidth * 0.4,
      cellSize * 0.15
    );

    // Visor (glowing yellow eye slit)
    ctx.fillStyle = '#FFFF00';
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 4;
    ctx.fillRect(
      centerX - bodyWidth / 6,
      centerY - bodyHeight / 2 - cellSize * 0.1,
      bodyWidth / 3,
      4
    );
    ctx.shadowBlur = 0;

    // Antenna
    ctx.strokeStyle = metalColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - bodyHeight / 2 - cellSize * 0.15);
    ctx.lineTo(centerX, centerY - bodyHeight / 2 - cellSize * 0.22);
    ctx.stroke();

    // Antenna tip (blinking)
    const blink = Math.sin(time * 6) > 0;
    ctx.fillStyle = blink ? '#FF0000' : '#880000';
    ctx.beginPath();
    ctx.arc(centerX, centerY - bodyHeight / 2 - cellSize * 0.22, 2, 0, Math.PI * 2);
    ctx.fill();

    // Health bar with smooth animation (always visible for assault bots)
    drawHealthBar(ctx, enemy.id, centerX, centerY, enemy.health, enemy.maxHealth, time, {
      offsetY: -bodyHeight / 2 - cellSize * 0.28,
      showOnlyWhenDamaged: false,
      style: {
        width: bodyWidth * 1.2,
        height: 5,
        borderColor: '#666666',
        getHealthColor: (healthPercent: number) =>
          healthPercent > 0.5 ? '#FFD700' : healthPercent > 0.25 ? '#FFA500' : '#FF4500',
      },
    });

    // Draw slow indicator if slowed
    drawSlowIndicator(ctx, enemy, centerX, centerY, bodyWidth * 0.6, time);

    ctx.restore();
  },
};
