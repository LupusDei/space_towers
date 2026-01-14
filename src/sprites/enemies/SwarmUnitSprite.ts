// Swarm Unit Sprite - Tiny purple swarming enemies with jittery movement

import type { Enemy } from '../../game/types';
import type { EnemySprite, SpriteRenderContext } from '../types';

export const SwarmUnitSprite: EnemySprite = {
  draw(context: SpriteRenderContext, enemy: Enemy): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = enemy.position;

    // Enemy position is already in pixels, just add half cell to get center
    const baseX = x + cellSize / 2;
    const baseY = y + cellSize / 2;

    // Jittery movement - unique per enemy using id hash
    const idHash = enemy.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const jitterSpeed = 15 + (idHash % 10);
    const jitterAmount = cellSize * 0.05;
    const jitterX = Math.sin(time * jitterSpeed + idHash) * jitterAmount;
    const jitterY = Math.cos(time * jitterSpeed * 1.3 + idHash * 0.7) * jitterAmount;

    const centerX = baseX + jitterX;
    const centerY = baseY + jitterY;

    // Tiny size - swarm units are small
    const size = cellSize * 0.15;

    // Purple body with slight pulsing
    const pulse = 0.8 + Math.sin(time * 8 + idHash) * 0.2;
    ctx.fillStyle = `rgba(180, 100, 220, ${pulse})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.fill();

    // Darker purple outline
    ctx.strokeStyle = '#6B238E';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, size, 0, Math.PI * 2);
    ctx.stroke();

    // Bright core
    ctx.fillStyle = '#E0B0FF';
    ctx.beginPath();
    ctx.arc(centerX, centerY, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Minimal health bar - only show if damaged
    if (enemy.health < enemy.maxHealth) {
      const healthPercent = enemy.health / enemy.maxHealth;
      const barWidth = cellSize * 0.25;
      const barHeight = 2;
      const barX = centerX - barWidth / 2;
      const barY = centerY - size - 4;

      // Background
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(barX, barY, barWidth, barHeight);

      // Health fill - changes color based on health
      const healthColor =
        healthPercent > 0.5 ? '#88FF88' : healthPercent > 0.25 ? '#FFFF00' : '#FF4444';
      ctx.fillStyle = healthColor;
      ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
    }

    // Death flash effect when very low health
    if (enemy.health / enemy.maxHealth < 0.2) {
      const flashIntensity = Math.sin(time * 20) * 0.3 + 0.3;
      ctx.fillStyle = `rgba(255, 255, 255, ${flashIntensity})`;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },
};
