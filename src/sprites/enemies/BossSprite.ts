// Boss Sprite - Large 2x scaled boss with glowing aura and pulsing animation

import type { Enemy } from '../../game/types';
import type { EnemySprite, SpriteRenderContext } from '../types';
import { drawBossHealthBar } from '../effects/HealthBar';
import { drawSlowIndicator } from '../effects/SlowIndicator';

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

    // Enemy position is already in pixels, just add half cell to get center
    const centerX = x + cellSize / 2;
    const centerY = y + cellSize / 2;

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

    ctx.save();

    // Apply pulsing scale
    const scaledWidth = bodyWidth * pulseScale;
    const scaledHeight = bodyHeight * pulseScale;

    // Colors
    const primaryColor = BOSS_PRIMARY;
    const secondaryColor = BOSS_SECONDARY;
    const darkColor = BOSS_DARK;
    const eyeColor = BOSS_EYE;

    // Draw glowing aura effect (multiple layers for intensity)
    ctx.shadowBlur = glowIntensity;
    ctx.shadowColor = BOSS_GLOW;

    // Outer aura ring
    ctx.beginPath();
    ctx.arc(centerX, centerY + bobOffset, scaledWidth * 0.7, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(pulseCycle) * 0.2})`;
    ctx.lineWidth = 4;
    ctx.stroke();

    // Second aura ring
    ctx.beginPath();
    ctx.arc(centerX, centerY + bobOffset, scaledWidth * 0.6, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(155, 48, 255, ${0.4 + Math.sin(pulseCycle + Math.PI / 2) * 0.2})`;
    ctx.lineWidth = 3;
    ctx.stroke();

    // Reset shadow for main body
    ctx.shadowBlur = glowIntensity * 0.5;

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
    ctx.moveTo(
      centerX - (scaledWidth * innerScale) / 2,
      centerY - (scaledHeight * innerScale) / 4 + bobOffset
    );
    ctx.lineTo(
      centerX - (scaledWidth * innerScale) / 3,
      centerY - (scaledHeight * innerScale) / 2 + bobOffset
    );
    ctx.lineTo(
      centerX + (scaledWidth * innerScale) / 3,
      centerY - (scaledHeight * innerScale) / 2 + bobOffset
    );
    ctx.lineTo(
      centerX + (scaledWidth * innerScale) / 2,
      centerY - (scaledHeight * innerScale) / 4 + bobOffset
    );
    ctx.lineTo(
      centerX + (scaledWidth * innerScale) / 2,
      centerY + (scaledHeight * innerScale) / 4 + bobOffset
    );
    ctx.lineTo(
      centerX + (scaledWidth * innerScale) / 3,
      centerY + (scaledHeight * innerScale) / 2 + bobOffset
    );
    ctx.lineTo(
      centerX - (scaledWidth * innerScale) / 3,
      centerY + (scaledHeight * innerScale) / 2 + bobOffset
    );
    ctx.lineTo(
      centerX - (scaledWidth * innerScale) / 2,
      centerY + (scaledHeight * innerScale) / 4 + bobOffset
    );
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
    ctx.shadowBlur = 10;
    ctx.shadowColor = eyeColor;

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

    // Large prominent health bar with smooth animation (always visible for boss)
    drawBossHealthBar(ctx, enemy.id, centerX, centerY, enemy.health, enemy.maxHealth, time, {
      width: scaledWidth * 1.2,
      height: 10,
      offsetY: -scaledHeight / 2 - headHeight - 25 + bobOffset,
      segments: 10,
      glowColor: BOSS_GLOW,
    });

    // Draw slow indicator if slowed
    drawSlowIndicator(ctx, enemy, centerX, centerY + bobOffset, scaledWidth * 0.7, time);

    ctx.restore();
  },
};
