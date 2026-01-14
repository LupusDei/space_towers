// Scout Drone Sprite - Small triangular drone with fast animation

import type { Enemy } from '../../game/types';
import type { EnemySprite, SpriteRenderContext } from '../types';

// Scout drone colors
const DRONE_GREEN = '#00ff88';
const DRONE_GREEN_DARK = '#00aa55';
const DRONE_ACCENT = '#88ffcc';
const HEALTH_BAR_BG = '#333333';
const HEALTH_BAR_FILL = '#00ff00';
const DAMAGE_FLASH_COLOR = '#ffffff';

// Animation constants
const ROTATION_SPEED = 4; // radians per second
const PULSE_SPEED = 8; // pulses per second
const PULSE_AMPLITUDE = 0.15; // size variation

export class ScoutDroneSprite implements EnemySprite {
  private damageFlashMap = new Map<string, number>();

  /**
   * Trigger damage flash for an enemy
   */
  triggerDamageFlash(enemyId: string): void {
    this.damageFlashMap.set(enemyId, performance.now());
  }

  draw(context: SpriteRenderContext, enemy: Enemy): void {
    const { ctx, cellSize, time } = context;
    const { position, health, maxHealth, id } = enemy;

    // Enemy position is already in pixels, just add half cell to get center
    const centerX = position.x + cellSize / 2;
    const centerY = position.y + cellSize / 2;

    // Base size (small drone - about 60% of cell)
    const baseSize = cellSize * 0.3;

    // Fast pulsing animation
    const pulse = Math.sin(time * PULSE_SPEED) * PULSE_AMPLITUDE;
    const size = baseSize * (1 + pulse);

    // Rotation animation
    const rotation = time * ROTATION_SPEED;

    // Check for damage flash
    const flashTime = this.damageFlashMap.get(id);
    const isFlashing = flashTime !== undefined && performance.now() - flashTime < 100;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Draw triangular drone body
    this.drawTriangle(ctx, size, isFlashing);

    // Draw center accent
    this.drawCenterAccent(ctx, size * 0.3);

    ctx.restore();

    // Draw health bar if damaged (drawn without rotation)
    if (health < maxHealth) {
      this.drawHealthBar(ctx, centerX, centerY, cellSize, health, maxHealth);
    }

    // Clean up old flash entries
    if (flashTime !== undefined && performance.now() - flashTime > 100) {
      this.damageFlashMap.delete(id);
    }
  }

  private drawTriangle(ctx: CanvasRenderingContext2D, size: number, isFlashing: boolean): void {
    ctx.beginPath();

    // Triangular shape pointing up (before rotation)
    const tipY = -size;
    const baseY = size * 0.7;
    const baseX = size * 0.8;

    ctx.moveTo(0, tipY); // Top point
    ctx.lineTo(-baseX, baseY); // Bottom left
    ctx.lineTo(baseX, baseY); // Bottom right
    ctx.closePath();

    // Fill with gradient or flash color
    if (isFlashing) {
      ctx.fillStyle = DAMAGE_FLASH_COLOR;
    } else {
      const gradient = ctx.createLinearGradient(0, tipY, 0, baseY);
      gradient.addColorStop(0, DRONE_GREEN);
      gradient.addColorStop(1, DRONE_GREEN_DARK);
      ctx.fillStyle = gradient;
    }
    ctx.fill();

    // Outline
    ctx.strokeStyle = isFlashing ? DAMAGE_FLASH_COLOR : DRONE_ACCENT;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawCenterAccent(ctx: CanvasRenderingContext2D, radius: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = DRONE_ACCENT;
    ctx.fill();
  }

  private drawHealthBar(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    cellSize: number,
    health: number,
    maxHealth: number
  ): void {
    const barWidth = cellSize * 0.6;
    const barHeight = 4;
    const barY = y - cellSize * 0.5; // Above the drone

    const healthPercent = health / maxHealth;

    // Background
    ctx.fillStyle = HEALTH_BAR_BG;
    ctx.fillRect(x - barWidth / 2, barY, barWidth, barHeight);

    // Health fill
    ctx.fillStyle = HEALTH_BAR_FILL;
    ctx.fillRect(x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

    // Border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.strokeRect(x - barWidth / 2, barY, barWidth, barHeight);
  }
}

// Default export for convenience
export default ScoutDroneSprite;
