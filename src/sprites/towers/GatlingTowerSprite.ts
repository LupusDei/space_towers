// Gatling Tower Sprite - Multi-barrel rotating turret
// Military/industrial aesthetic with spinning barrel animation

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (progressively more intense orange/red)
const LEVEL_COLORS = [
  { primary: '#cc6600', secondary: '#994400', accent: '#ff8800', glow: 'rgba(255, 136, 0, 0.3)' },
  { primary: '#dd7700', secondary: '#aa5500', accent: '#ffaa00', glow: 'rgba(255, 170, 0, 0.4)' },
  { primary: '#ee8800', secondary: '#bb6600', accent: '#ffbb33', glow: 'rgba(255, 187, 51, 0.5)' },
  { primary: '#ff9900', secondary: '#cc7700', accent: '#ffcc44', glow: 'rgba(255, 204, 68, 0.6)' },
  { primary: '#ffaa00', secondary: '#dd8800', accent: '#ffdd66', glow: 'rgba(255, 221, 102, 0.7)' },
];

function calculateTurretAngle(
  tower: Tower,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number
): number {
  if (tower.targetPosition) {
    const targetCenterX = tower.targetPosition.x + cellSize / 2;
    const targetCenterY = tower.targetPosition.y + cellSize / 2;
    const dx = targetCenterX - centerX;
    const dy = targetCenterY - centerY;
    return Math.atan2(dy, dx) + Math.PI / 2;
  }
  // Idle: slow rotation
  return time * 0.3;
}

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.35;

    const turretAngle = calculateTurretAngle(tower, centerX, centerY, cellSize, time);

    // Barrel spin animation (faster when firing)
    const spinSpeed = tower.targetPosition ? 15 : 2;
    const barrelRotation = time * spinSpeed;

    // === BASE SHADOW ===
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(centerX + 2, centerY + baseRadius * 0.3, baseRadius * 1.1, baseRadius * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // === OCTAGONAL BASE ===
    ctx.fillStyle = '#3a3a3a';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = centerX + Math.cos(angle) * baseRadius;
      const py = centerY + Math.sin(angle) * baseRadius * 0.8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // Base highlight
    ctx.fillStyle = '#555555';
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const px = centerX + Math.cos(angle) * baseRadius * 0.85;
      const py = centerY + Math.sin(angle) * baseRadius * 0.65;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // === TURRET MOUNT (rotates toward target) ===
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(turretAngle);

    // Turret housing
    const turretWidth = cellSize * 0.25;
    const turretLength = cellSize * 0.45;

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(-turretWidth / 2, -turretLength, turretWidth, turretLength);

    // Housing highlight
    ctx.fillStyle = '#666666';
    ctx.fillRect(-turretWidth / 2 + 2, -turretLength, turretWidth / 3, turretLength);

    // === ROTATING BARREL ASSEMBLY ===
    ctx.save();
    ctx.translate(0, -turretLength * 0.7);
    ctx.rotate(barrelRotation);

    // Draw 6 barrels in a circle
    const barrelCount = 6;
    const barrelRadius = cellSize * 0.12;
    const barrelLength = cellSize * 0.3;

    for (let i = 0; i < barrelCount; i++) {
      const angle = (i * Math.PI * 2) / barrelCount;
      const bx = Math.cos(angle) * barrelRadius;
      const by = Math.sin(angle) * barrelRadius;

      // Barrel
      ctx.fillStyle = '#2a2a2a';
      ctx.beginPath();
      ctx.arc(bx, by - barrelLength / 2, cellSize * 0.04, 0, Math.PI * 2);
      ctx.fill();

      // Barrel tube
      ctx.strokeStyle = '#3a3a3a';
      ctx.lineWidth = cellSize * 0.06;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx, by - barrelLength);
      ctx.stroke();

      // Barrel bore (dark center)
      ctx.fillStyle = '#1a1a1a';
      ctx.beginPath();
      ctx.arc(bx, by - barrelLength, cellSize * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }

    // Center hub
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore(); // End barrel assembly rotation

    // === MUZZLE FLASH (when targeting) ===
    if (tower.targetPosition) {
      const flashIntensity = 0.5 + 0.5 * Math.sin(time * 30);
      const flashGradient = ctx.createRadialGradient(
        0, -turretLength - cellSize * 0.1, 0,
        0, -turretLength - cellSize * 0.1, cellSize * 0.15
      );
      flashGradient.addColorStop(0, `rgba(255, 200, 100, ${flashIntensity * 0.8})`);
      flashGradient.addColorStop(0.5, `rgba(255, 150, 50, ${flashIntensity * 0.4})`);
      flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(0, -turretLength - cellSize * 0.1, cellSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // End turret rotation

    // === STATUS LIGHT ===
    const lightPulse = 0.5 + 0.5 * Math.sin(time * 3);
    ctx.fillStyle = tower.targetPosition
      ? `rgba(255, 50, 50, ${0.6 + lightPulse * 0.4})`
      : `rgba(50, 255, 50, ${0.4 + lightPulse * 0.2})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY + baseRadius * 0.5, cellSize * 0.04, 0, Math.PI * 2);
    ctx.fill();

    // === LEVEL INDICATORS ===
    if (level > 1) {
      const indicatorRadius = cellSize * 0.03;
      for (let i = 0; i < level - 1; i++) {
        const angle = ((i - (level - 2) / 2) * 0.3) - Math.PI / 2;
        const ix = centerX + Math.cos(angle) * baseRadius * 0.6;
        const iy = centerY + baseRadius * 0.65 + Math.sin(angle) * cellSize * 0.1;
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(ix, iy, indicatorRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const startX = x * cellSize + cellSize / 2;
    const startY = y * cellSize + cellSize / 2;
    const endX = target.x * cellSize + cellSize / 2;
    const endY = target.y * cellSize + cellSize / 2;

    // Calculate bullet trail offset for rapid fire effect
    const trailOffset = (time * 50) % 20;

    // Multiple bullet tracers for gatling effect
    for (let i = 0; i < 3; i++) {
      const offset = (i * 7 + trailOffset) % 20;
      const dx = endX - startX;
      const dy = endY - startY;
      const len = Math.sqrt(dx * dx + dy * dy);

      if (len > 0) {
        const progress = offset / 20;
        const bulletX = startX + dx * progress;
        const bulletY = startY + dy * progress;

        // Bullet tracer
        ctx.fillStyle = colors.accent;
        ctx.beginPath();
        ctx.arc(bulletX, bulletY, cellSize * 0.03, 0, Math.PI * 2);
        ctx.fill();

        // Tracer glow
        ctx.fillStyle = colors.glow;
        ctx.beginPath();
        ctx.arc(bulletX, bulletY, cellSize * 0.06, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Impact flash at target
    const impactIntensity = 0.3 + 0.3 * Math.sin(time * 25);
    ctx.fillStyle = `rgba(255, 200, 100, ${impactIntensity})`;
    ctx.beginPath();
    ctx.arc(endX, endY, cellSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
  },
};
