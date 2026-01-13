// Boss Sprite - Large 2x scaled boss with glowing aura and pulsing animation

import type { Enemy } from '../../types';
import type { EnemySprite, SpriteRenderContext } from '../types';

// Track health for damage flash detection
const lastHealthMap = new Map<string, number>();
const damageFlashMap = new Map<string, number>();

const FLASH_DURATION = 150; // ms

// Boss color scheme - menacing purple/magenta
const BOSS_PRIMARY = '#9B30FF'; // Purple
const BOSS_SECONDARY = '#FF00FF'; // Magenta
const BOSS_DARK = '#4B0082'; // Indigo
const BOSS_GLOW = '#FF00FF'; // Magenta glow
const BOSS_EYE = '#FF0000'; // Red eyes

export const BossSprite: EnemySprite = {
  draw(context: SpriteRenderContext, enemy: Enemy): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = enemy.position;

    // Convert grid position to pixel coordinates (center of cell)
    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Boss is 2x scaled - much larger than normal enemies
    const scale = 2.0;
    const bodyWidth = cellSize * 0.6 * scale;
    const bodyHeight = cellSize * 0.5 * scale;

    // Pulsing animation
    const pulseCycle = (time / 200) % (Math.PI * 2);
    const pulseScale = 1 + Math.sin(pulseCycle) * 0.05;
    const glowIntensity = 15 + Math.sin(pulseCycle) * 10;

    // Slow movement animation
    const bobOffset = Math.sin(time / 300) * 3;

    // Check for damage flash
    const lastHealth = lastHealthMap.get(enemy.id);
    if (lastHealth !== undefined && enemy.health < lastHealth) {
      damageFlashMap.set(enemy.id, time);
    }
    lastHealthMap.set(enemy.id, enemy.health);

    const flashTime = damageFlashMap.get(enemy.id) || 0;
    const isFlashing = time - flashTime < FLASH_DURATION;

    ctx.save();

    // Apply pulsing scale
    const scaledWidth = bodyWidth * pulseScale;
    const scaledHeight = bodyHeight * pulseScale;

    // Colors (white when flashing)
    const primaryColor = isFlashing ? '#FFFFFF' : BOSS_PRIMARY;
    const secondaryColor = isFlashing ? '#FFFFFF' : BOSS_SECONDARY;
    const darkColor = isFlashing ? '#FFFFFF' : BOSS_DARK;
    const eyeColor = isFlashing ? '#FFFFFF' : BOSS_EYE;

    // Draw glowing aura effect (multiple layers for intensity)
    if (!isFlashing) {
      ctx.shadowBlur = glowIntensity;
      ctx.shadowColor = BOSS_GLOW;
    }

    // Outer aura ring
    ctx.beginPath();
    ctx.arc(centerX, centerY + bobOffset, scaledWidth * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = isFlashing ? '#FFFFFF' : `rgba(255, 0, 255, ${0.3 + Math.sin(pulseCycle) * 0.2})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Second aura ring
    ctx.beginPath();
    ctx.arc(centerX, centerY + bobOffset, scaledWidth * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = isFlashing ? '#FFFFFF' : `rgba(155, 48, 255, ${0.4 + Math.sin(pulseCycle + Math.PI / 2) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Reset shadow for main body
    ctx.shadowBlur = isFlashing ? 0 : glowIntensity * 0.5;

    // Draw main body (large hexagonal armored form)
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    ctx.moveTo(centerX - scaledWidth / 2, centerY - scaledHeight / 4 + bobOffset);
    ctx.lineTo(centerX - scaledWidth / 3, centerY - scaledHeight / 2 + bobOffset);
    ctx.lineTo(centerX + scaledWidth / 3, centerY - scaledHeight / 2 + bobOffset);
    ctx.lineTo(centerX + scaledWidth / 2, centerY - scaledHeight / 4 + bobOffset);
    ctx.lineTo(centerX + scaledWidth / 2, centerY + scaledHeight / 4 + bobOffset);
    ctx.lineTo(centerX + scaledWidth / 3, centerY + scaledHeight / 2 + bobOffset);
    ctx.lineTo(centerX - scaledWidth / 3, centerY + scaledHeight / 2 + bobOffset);
    ctx.lineTo(centerX - scaledWidth / 2, centerY + scaledHeight / 4 + bobOffset);
    ctx.closePath();
    ctx.fill();

    // Body outline with glow
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Inner body detail (darker core)
    ctx.fillStyle = darkColor;
    ctx.beginPath();
    const innerScale = 0.6;
    ctx.moveTo(centerX - scaledWidth * innerScale / 2, centerY - scaledHeight * innerScale / 4 + bobOffset);
    ctx.lineTo(centerX - scaledWidth * innerScale / 3, centerY - scaledHeight * innerScale / 2 + bobOffset);
    ctx.lineTo(centerX + scaledWidth * innerScale / 3, centerY - scaledHeight * innerScale / 2 + bobOffset);
    ctx.lineTo(centerX + scaledWidth * innerScale / 2, centerY - scaledHeight * innerScale / 4 + bobOffset);
    ctx.lineTo(centerX + scaledWidth * innerScale / 2, centerY + scaledHeight * innerScale / 4 + bobOffset);
    ctx.lineTo(centerX + scaledWidth * innerScale / 3, centerY + scaledHeight * innerScale / 2 + bobOffset);
    ctx.lineTo(centerX - scaledWidth * innerScale / 3, centerY + scaledHeight * innerScale / 2 + bobOffset);
    ctx.lineTo(centerX - scaledWidth * innerScale / 2, centerY + scaledHeight * innerScale / 4 + bobOffset);
    ctx.closePath();
    ctx.fill();

    // Draw menacing head/cockpit (larger than HeavyMech)
    ctx.shadowBlur = 0;
    ctx.fillStyle = darkColor;
    const headWidth = scaledWidth * 0.5;
    const headHeight = scaledHeight * 0.3;
    ctx.fillRect(
      centerX - headWidth / 2,
      centerY - scaledHeight / 2 - headHeight + bobOffset,
      headWidth,
      headHeight
    );

    // Head outline
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - headWidth / 2,
      centerY - scaledHeight / 2 - headHeight + bobOffset,
      headWidth,
      headHeight
    );

    // Multiple glowing eyes (three eyes for boss)
    const eyeY = centerY - scaledHeight / 2 - headHeight * 0.5 + bobOffset;
    const eyeSpacing = headWidth * 0.25;
    const eyeWidth = headWidth * 0.15;
    const eyeHeight = headHeight * 0.3;

    // Eye glow effect
    if (!isFlashing) {
      ctx.shadowBlur = 10;
      ctx.shadowColor = eyeColor;
    }

    // Left eye
    ctx.fillStyle = eyeColor;
    ctx.fillRect(centerX - eyeSpacing - eyeWidth / 2, eyeY - eyeHeight / 2, eyeWidth, eyeHeight);

    // Center eye (larger)
    ctx.fillRect(centerX - eyeWidth * 0.7, eyeY - eyeHeight * 0.7, eyeWidth * 1.4, eyeHeight * 1.4);

    // Right eye
    ctx.fillRect(centerX + eyeSpacing - eyeWidth / 2, eyeY - eyeHeight / 2, eyeWidth, eyeHeight);

    ctx.shadowBlur = 0;

    // Draw shoulder armor/weapons
    ctx.fillStyle = primaryColor;
    const shoulderWidth = scaledWidth * 0.15;
    const shoulderHeight = scaledHeight * 0.6;

    // Left shoulder
    ctx.fillRect(
      centerX - scaledWidth / 2 - shoulderWidth,
      centerY - shoulderHeight / 2 + bobOffset,
      shoulderWidth,
      shoulderHeight
    );

    // Right shoulder
    ctx.fillRect(
      centerX + scaledWidth / 2,
      centerY - shoulderHeight / 2 + bobOffset,
      shoulderWidth,
      shoulderHeight
    );

    // Shoulder accents
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      centerX - scaledWidth / 2 - shoulderWidth,
      centerY - shoulderHeight / 2 + bobOffset,
      shoulderWidth,
      shoulderHeight
    );
    ctx.strokeRect(
      centerX + scaledWidth / 2,
      centerY - shoulderHeight / 2 + bobOffset,
      shoulderWidth,
      shoulderHeight
    );

    // Weapon barrels on shoulders
    ctx.fillStyle = darkColor;
    const barrelLength = scaledWidth * 0.2;
    const barrelHeight = shoulderHeight * 0.15;

    // Left weapon barrel
    ctx.fillRect(
      centerX - scaledWidth / 2 - shoulderWidth - barrelLength,
      centerY - barrelHeight / 2 + bobOffset,
      barrelLength,
      barrelHeight
    );

    // Right weapon barrel
    ctx.fillRect(
      centerX + scaledWidth / 2 + shoulderWidth,
      centerY - barrelHeight / 2 + bobOffset,
      barrelLength,
      barrelHeight
    );

    // Large prominent health bar (much bigger than regular enemies)
    const healthBarWidth = scaledWidth * 1.2;
    const healthBarHeight = 10;
    const healthBarX = centerX - healthBarWidth / 2;
    const healthBarY = centerY - scaledHeight / 2 - headHeight - 25 + bobOffset;
    const healthPercent = enemy.health / enemy.maxHealth;

    // Health bar background with border
    ctx.fillStyle = '#111111';
    ctx.fillRect(healthBarX - 2, healthBarY - 2, healthBarWidth + 4, healthBarHeight + 4);

    // Health bar inner background
    ctx.fillStyle = '#333333';
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health bar fill with gradient
    const healthGradient = ctx.createLinearGradient(healthBarX, healthBarY, healthBarX + healthBarWidth * healthPercent, healthBarY);
    if (healthPercent > 0.5) {
      healthGradient.addColorStop(0, '#FF00FF');
      healthGradient.addColorStop(1, '#9B30FF');
    } else if (healthPercent > 0.25) {
      healthGradient.addColorStop(0, '#FF8800');
      healthGradient.addColorStop(1, '#FF4400');
    } else {
      healthGradient.addColorStop(0, '#FF0000');
      healthGradient.addColorStop(1, '#AA0000');
    }
    ctx.fillStyle = healthGradient;
    ctx.fillRect(healthBarX, healthBarY, healthBarWidth * healthPercent, healthBarHeight);

    // Health bar border with glow
    if (!isFlashing) {
      ctx.shadowBlur = 5;
      ctx.shadowColor = BOSS_GLOW;
    }
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

    // Health bar segments (to show scale)
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const segmentX = healthBarX + (healthBarWidth / 10) * i;
      ctx.beginPath();
      ctx.moveTo(segmentX, healthBarY);
      ctx.lineTo(segmentX, healthBarY + healthBarHeight);
      ctx.stroke();
    }

    ctx.restore();
  },
};
