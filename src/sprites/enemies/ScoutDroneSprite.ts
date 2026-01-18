// Scout Drone Sprite - Small triangular drone with fast animation

import type { Enemy } from '../../game/types';
import type { EnemySprite, SpriteRenderContext } from '../types';
import { drawHealthBar } from '../effects/HealthBar';
import { drawSlowIndicator } from '../effects/SlowIndicator';

// Scout drone colors
const DRONE_GREEN = '#00ff88';
const DRONE_GREEN_DARK = '#00aa55';
const DRONE_ACCENT = '#88ffcc';

// Animation constants
const ROTATION_SPEED = 4; // radians per second
const PULSE_SPEED = 8; // pulses per second
const PULSE_AMPLITUDE = 0.15; // size variation

export class ScoutDroneSprite implements EnemySprite {
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

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotation);

    // Draw triangular drone body
    this.drawTriangle(ctx, size);

    // Draw center accent
    this.drawCenterAccent(ctx, size * 0.3);

    ctx.restore();

    // Draw health bar if damaged (drawn without rotation, with smooth animation)
    drawHealthBar(ctx, id, centerX, centerY, health, maxHealth, time, {
      offsetY: -cellSize * 0.5,
      showOnlyWhenDamaged: true,
      style: {
        width: cellSize * 0.6,
        height: 4,
      },
    });

    // Draw slow indicator if slowed
    drawSlowIndicator(ctx, enemy, centerX, centerY, time, {
      radius: baseSize * 1.5,
    });
  }

  private drawTriangle(ctx: CanvasRenderingContext2D, size: number): void {
    ctx.beginPath();

    // Triangular shape pointing up (before rotation)
    const tipY = -size;
    const baseY = size * 0.7;
    const baseX = size * 0.8;

    ctx.moveTo(0, tipY); // Top point
    ctx.lineTo(-baseX, baseY); // Bottom left
    ctx.lineTo(baseX, baseY); // Bottom right
    ctx.closePath();

    // Fill with gradient
    const gradient = ctx.createLinearGradient(0, tipY, 0, baseY);
    gradient.addColorStop(0, DRONE_GREEN);
    gradient.addColorStop(1, DRONE_GREEN_DARK);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Outline
    ctx.strokeStyle = DRONE_ACCENT;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  private drawCenterAccent(ctx: CanvasRenderingContext2D, radius: number): void {
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = DRONE_ACCENT;
    ctx.fill();
  }
}

// Default export for convenience
export default ScoutDroneSprite;
