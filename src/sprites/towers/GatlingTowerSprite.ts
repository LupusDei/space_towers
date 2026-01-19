// Gatling Tower Sprite - Multi-barrel rotating turret
// Military/industrial aesthetic with classic gatling gun look
// Features: barrel spin animation, muzzle flash, smooth target tracking
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (military/industrial - progressively more elite)
const LEVEL_COLORS = [
  // Level 1 - Basic military steel
  { primary: '#5a5a5a', secondary: '#4a4a4a', accent: '#8a8a8a', glow: 'rgba(200, 180, 100, 0.3)', muzzleFlash: '#ffdd44' },
  // Level 2 - Enhanced gunmetal
  { primary: '#5a5a6a', secondary: '#4a4a5a', accent: '#9a9aaa', glow: 'rgba(220, 200, 120, 0.4)', muzzleFlash: '#ffee55' },
  // Level 3 - Tactical dark steel
  { primary: '#4a5a5a', secondary: '#3a4a4a', accent: '#7a9a9a', glow: 'rgba(240, 220, 140, 0.5)', muzzleFlash: '#ffff66' },
  // Level 4 - Elite black chrome
  { primary: '#3a4a4a', secondary: '#2a3a3a', accent: '#6a8a8a', glow: 'rgba(255, 240, 160, 0.6)', muzzleFlash: '#ffffaa' },
  // Level 5 - Ultimate carbon
  { primary: '#2a3a3a', secondary: '#1a2a2a', accent: '#5a7a7a', glow: 'rgba(255, 250, 180, 0.7)', muzzleFlash: '#ffffff' },
];

// Number of barrels in the gatling gun
const BARREL_COUNT = 6;

// Barrel spin tracking for smooth animation
const barrelSpinState = new Map<string, { angle: number; spinSpeed: number; lastTime: number }>();

function getBarrelSpinState(towerId: string, time: number): { angle: number; spinSpeed: number; lastTime: number } {
  let state = barrelSpinState.get(towerId);
  if (!state) {
    state = { angle: 0, spinSpeed: 0, lastTime: time };
    barrelSpinState.set(towerId, state);
  }
  return state;
}

function updateBarrelSpin(towerId: string, time: number, isFiring: boolean, level: number): number {
  const state = getBarrelSpinState(towerId, time);
  const deltaTime = Math.min(time - state.lastTime, 100); // Cap delta to prevent jumps

  // Target spin speed depends on firing state and level
  const idleSpinSpeed = 0.2 + level * 0.05; // Slow idle rotation
  const firingSpinSpeed = 8 + level * 2; // Fast spin when firing
  const targetSpeed = isFiring ? firingSpinSpeed : idleSpinSpeed;

  // Smoothly interpolate spin speed (spins up and down)
  const spinAcceleration = isFiring ? 0.15 : 0.05;
  state.spinSpeed += (targetSpeed - state.spinSpeed) * spinAcceleration;

  // Update angle
  state.angle += state.spinSpeed * deltaTime * 0.001;
  state.angle = state.angle % (Math.PI * 2);
  state.lastTime = time;

  return state.angle;
}

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Update barrel spin (idle state)
    const barrelAngle = updateBarrelSpin(tower.id, time, false, level);

    // Draw based on level
    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurret(ctx, centerX, centerY, cellSize, time, level, colors, tower.targetPosition, barrelAngle);

    // Level 3+ get ambient glow
    if (level >= 3) {
      drawAmbientGlow(ctx, centerX, centerY, cellSize, time, level, colors);
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

    // Update barrel spin (firing state - faster)
    const barrelAngle = updateBarrelSpin(tower.id, time, true, level);

    // Convert target to pixel position for turret aiming
    const targetPixels = { x: target.x * cellSize, y: target.y * cellSize };

    // Redraw turret pointing at target with spinning barrels
    drawTurret(ctx, startX, startY, cellSize, time, level, colors, targetPixels, barrelAngle);

    // Draw muzzle flash
    drawMuzzleFlash(ctx, startX, startY, cellSize, time, level, colors, targetPixels, barrelAngle);

    // Draw bullet stream
    drawBulletStream(ctx, startX, startY, endX, endY, cellSize, time, level, colors);

    // Draw impact effect
    drawImpact(ctx, endX, endY, cellSize, time, level, colors);
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    ctx.fillStyle = `rgba(200, 180, 100, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(200, 180, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([8, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawBase(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  // Military platform base - solid and industrial
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.36 * sizeMultiplier;

  // Base shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY + 2, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base platform with industrial metal gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#5a6a6a');
  baseGradient.addColorStop(0.5, '#4a5a5a');
  baseGradient.addColorStop(1, '#3a4a4a');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim
  const rimIntensity = 0.3 + level * 0.1;
  ctx.strokeStyle = `rgba(120, 140, 140, ${rimIntensity + 0.5})`;
  ctx.lineWidth = 1 + level * 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Ammo belt details (level 2+)
  if (level >= 2) {
    drawAmmoBelt(ctx, centerX, centerY, baseRadius, level, colors);
  }

  // Level 3+ gets decorative bolts
  if (level >= 3) {
    drawBaseBolts(ctx, centerX, centerY, baseRadius, level);
  }

  // Level 4+ gets outer accent ring
  if (level >= 4) {
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.05, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Level 5 gets hazard stripes
  if (level >= 5) {
    drawHazardStripes(ctx, centerX, centerY, baseRadius);
  }
}

function drawAmmoBelt(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  baseRadius: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  // Draw ammo belt feeding into the base
  const beltWidth = baseRadius * 0.12;
  const beltLength = baseRadius * 0.6;
  const bulletCount = 3 + level;

  ctx.save();

  // Belt background
  ctx.fillStyle = '#3a3a3a';
  ctx.fillRect(
    centerX + baseRadius * 0.5,
    centerY - beltWidth / 2,
    beltLength,
    beltWidth
  );

  // Individual bullets on the belt
  ctx.fillStyle = '#c4a040';
  const bulletSpacing = beltLength / (bulletCount + 1);
  for (let i = 1; i <= bulletCount; i++) {
    const bulletX = centerX + baseRadius * 0.5 + i * bulletSpacing;
    ctx.beginPath();
    ctx.ellipse(bulletX, centerY, beltWidth * 0.3, beltWidth * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawTurret(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  targetPosition: Point | null,
  barrelAngle: number
): void {
  // Calculate aim angle
  let aimAngle: number;
  if (targetPosition) {
    const targetX = targetPosition.x + cellSize / 2;
    const targetY = targetPosition.y + cellSize / 2;
    aimAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
  } else {
    // Slow scanning when idle
    const scanSpeed = 0.15 + level * 0.03;
    aimAngle = time * scanSpeed;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(aimAngle);

  // Central turret housing
  const housingRadius = cellSize * (0.16 + level * 0.01);
  const housingGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, housingRadius);
  housingGradient.addColorStop(0, colors.primary);
  housingGradient.addColorStop(0.7, colors.secondary);
  housingGradient.addColorStop(1, '#1a2a2a');

  ctx.fillStyle = housingGradient;
  ctx.beginPath();
  ctx.arc(0, 0, housingRadius, 0, Math.PI * 2);
  ctx.fill();

  // Turret rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, housingRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw the gatling barrels
  drawBarrels(ctx, cellSize, level, colors, barrelAngle);

  // Barrel shroud/housing
  drawBarrelShroud(ctx, cellSize, level, colors);

  ctx.restore();
}

function drawBarrels(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  barrelAngle: number
): void {
  const barrelLength = cellSize * (0.32 + level * 0.02);
  const barrelRadius = cellSize * (0.018 + level * 0.002);
  const barrelRingRadius = cellSize * (0.08 + level * 0.005);

  ctx.save();
  ctx.rotate(barrelAngle);

  // Draw each barrel (positioned radially around center, all pointing up)
  for (let i = 0; i < BARREL_COUNT; i++) {
    const angle = (i / BARREL_COUNT) * Math.PI * 2;
    const barrelX = Math.cos(angle) * barrelRingRadius;

    // Barrel gradient
    const barrelGradient = ctx.createLinearGradient(
      barrelX - barrelRadius,
      -barrelLength,
      barrelX + barrelRadius,
      -barrelLength
    );
    barrelGradient.addColorStop(0, '#2a3a3a');
    barrelGradient.addColorStop(0.3, colors.secondary);
    barrelGradient.addColorStop(0.5, colors.primary);
    barrelGradient.addColorStop(0.7, colors.secondary);
    barrelGradient.addColorStop(1, '#2a3a3a');

    ctx.fillStyle = barrelGradient;
    ctx.beginPath();
    ctx.roundRect(
      barrelX - barrelRadius,
      -barrelLength,
      barrelRadius * 2,
      barrelLength - barrelRingRadius * 0.5,
      barrelRadius
    );
    ctx.fill();

    // Barrel bore (dark hole at end)
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath();
    ctx.arc(barrelX, -barrelLength + barrelRadius * 0.5, barrelRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Barrel highlight
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + level * 0.02})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(barrelX - barrelRadius * 0.7, -barrelLength * 0.3);
    ctx.lineTo(barrelX - barrelRadius * 0.7, -barrelLength * 0.9);
    ctx.stroke();
  }

  // Central spindle
  const spindleGradient = ctx.createLinearGradient(0, -barrelLength * 0.3, 0, -barrelLength);
  spindleGradient.addColorStop(0, colors.secondary);
  spindleGradient.addColorStop(0.5, colors.primary);
  spindleGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = spindleGradient;
  ctx.beginPath();
  ctx.roundRect(
    -barrelRadius * 0.8,
    -barrelLength,
    barrelRadius * 1.6,
    barrelLength * 0.7,
    barrelRadius * 0.5
  );
  ctx.fill();

  ctx.restore();
}

function drawBarrelShroud(
  ctx: CanvasRenderingContext2D,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  const shroudRadius = cellSize * (0.12 + level * 0.008);
  const shroudHeight = cellSize * 0.08;

  // Shroud body
  const shroudGradient = ctx.createLinearGradient(-shroudRadius, 0, shroudRadius, 0);
  shroudGradient.addColorStop(0, '#2a3a3a');
  shroudGradient.addColorStop(0.3, colors.secondary);
  shroudGradient.addColorStop(0.5, colors.primary);
  shroudGradient.addColorStop(0.7, colors.secondary);
  shroudGradient.addColorStop(1, '#2a3a3a');

  ctx.fillStyle = shroudGradient;
  ctx.beginPath();
  ctx.arc(0, 0, shroudRadius, Math.PI, Math.PI * 2);
  ctx.lineTo(shroudRadius, -shroudHeight);
  ctx.arc(0, -shroudHeight, shroudRadius, 0, Math.PI, true);
  ctx.closePath();
  ctx.fill();

  // Shroud rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(0, -shroudHeight, shroudRadius, 0, Math.PI, true);
  ctx.stroke();

  // Vent holes (level 2+)
  if (level >= 2) {
    ctx.fillStyle = '#1a1a1a';
    const ventCount = 2 + Math.floor(level / 2);
    for (let i = 0; i < ventCount; i++) {
      const ventAngle = Math.PI + (i + 0.5) * (Math.PI / (ventCount));
      const ventX = Math.cos(ventAngle) * shroudRadius * 0.85;
      const ventY = Math.sin(ventAngle) * shroudRadius * 0.5 - shroudHeight * 0.5;
      ctx.beginPath();
      ctx.ellipse(ventX, ventY, cellSize * 0.015, cellSize * 0.008, ventAngle, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  targetPosition: Point,
  barrelAngle: number
): void {
  // Calculate which barrel is at the "top" (firing position)
  const activeBarrelIndex = Math.floor(((barrelAngle % (Math.PI * 2)) / (Math.PI * 2)) * BARREL_COUNT) % BARREL_COUNT;

  // Calculate aim angle
  const targetX = targetPosition.x + cellSize / 2;
  const targetY = targetPosition.y + cellSize / 2;
  const aimAngle = Math.atan2(targetY - centerY, targetX - centerX);

  const barrelLength = cellSize * (0.32 + level * 0.02);
  const barrelRingRadius = cellSize * (0.08 + level * 0.005);

  // Calculate barrel position relative to rotation
  const activeBarrelAngle = (activeBarrelIndex / BARREL_COUNT) * Math.PI * 2 + barrelAngle - Math.PI / 2;
  const barrelOffsetX = Math.cos(activeBarrelAngle + aimAngle + Math.PI / 2) * barrelRingRadius;
  const barrelOffsetY = Math.sin(activeBarrelAngle + aimAngle + Math.PI / 2) * barrelRingRadius;

  // Muzzle position
  const muzzleX = centerX + Math.cos(aimAngle) * barrelLength + barrelOffsetX;
  const muzzleY = centerY + Math.sin(aimAngle) * barrelLength + barrelOffsetY;

  // Flicker effect
  const flicker = 0.7 + Math.sin(time * 50) * 0.3;
  const flashSize = cellSize * (0.08 + level * 0.015) * flicker;

  // Outer flash glow
  const flashGradient = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, flashSize * 1.5);
  flashGradient.addColorStop(0, `rgba(255, 255, 200, ${0.9 * flicker})`);
  flashGradient.addColorStop(0.3, `rgba(255, 200, 100, ${0.6 * flicker})`);
  flashGradient.addColorStop(0.6, `rgba(255, 150, 50, ${0.3 * flicker})`);
  flashGradient.addColorStop(1, 'rgba(255, 100, 20, 0)');

  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(muzzleX, muzzleY, flashSize * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Bright core flash
  ctx.fillStyle = colors.muzzleFlash;
  ctx.beginPath();
  ctx.arc(muzzleX, muzzleY, flashSize * 0.4, 0, Math.PI * 2);
  ctx.fill();

  // Directional flash spikes (level 3+)
  if (level >= 3) {
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.6 * flicker})`;
    ctx.lineWidth = 1.5;
    const spikeLength = flashSize * (1 + level * 0.2);

    // Main spike in firing direction
    ctx.beginPath();
    ctx.moveTo(muzzleX, muzzleY);
    ctx.lineTo(
      muzzleX + Math.cos(aimAngle) * spikeLength,
      muzzleY + Math.sin(aimAngle) * spikeLength
    );
    ctx.stroke();

    // Side spikes
    for (const offset of [-0.3, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(muzzleX, muzzleY);
      ctx.lineTo(
        muzzleX + Math.cos(aimAngle + offset) * spikeLength * 0.6,
        muzzleY + Math.sin(aimAngle + offset) * spikeLength * 0.6
      );
      ctx.stroke();
    }
  }
}

function drawBulletStream(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Multiple bullets along the path (rapid fire effect)
  const bulletCount = 3 + level;
  const bulletSpeed = 0.02;

  for (let i = 0; i < bulletCount; i++) {
    const progress = ((time * bulletSpeed + i * 0.15) % 1);
    const bulletX = startX + dx * progress;
    const bulletY = startY + dy * progress;

    // Bullet trail
    const trailLength = cellSize * 0.06;
    const trailEndX = bulletX - (dx / distance) * trailLength;
    const trailEndY = bulletY - (dy / distance) * trailLength;

    // Trail glow
    ctx.strokeStyle = `rgba(255, 200, 100, ${0.4 - progress * 0.3})`;
    ctx.lineWidth = cellSize * 0.02;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(trailEndX, trailEndY);
    ctx.lineTo(bulletX, bulletY);
    ctx.stroke();

    // Bullet core
    ctx.strokeStyle = `rgba(255, 255, 200, ${0.8 - progress * 0.5})`;
    ctx.lineWidth = cellSize * 0.01;
    ctx.beginPath();
    ctx.moveTo(trailEndX, trailEndY);
    ctx.lineTo(bulletX, bulletY);
    ctx.stroke();
  }

  // Tracer rounds (level 4+)
  if (level >= 4) {
    const tracerProgress = ((time * bulletSpeed * 0.5) % 1);
    const tracerX = startX + dx * tracerProgress;
    const tracerY = startY + dy * tracerProgress;

    ctx.fillStyle = `rgba(255, 100, 50, ${0.8 - tracerProgress * 0.6})`;
    ctx.beginPath();
    ctx.arc(tracerX, tracerY, cellSize * 0.025, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawImpact(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  targetY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  // Impact sparks
  const sparkCount = 3 + level;
  const sparkRadius = cellSize * (0.06 + level * 0.01);

  for (let i = 0; i < sparkCount; i++) {
    const angle = (time * 10 + i * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
    const distance = sparkRadius * (0.5 + Math.sin(time * 20 + i) * 0.5);
    const sparkX = targetX + Math.cos(angle) * distance;
    const sparkY = targetY + Math.sin(angle) * distance;

    ctx.fillStyle = `rgba(255, 200, 100, ${0.6 + Math.sin(time * 30 + i) * 0.4})`;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, cellSize * 0.012, 0, Math.PI * 2);
    ctx.fill();
  }

  // Impact glow
  const impactSize = cellSize * (0.08 + level * 0.01);
  const impactGradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, impactSize);
  impactGradient.addColorStop(0, 'rgba(255, 200, 150, 0.6)');
  impactGradient.addColorStop(0.5, 'rgba(255, 150, 100, 0.3)');
  impactGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(targetX, targetY, impactSize, 0, Math.PI * 2);
  ctx.fill();

  // Metal fragments (level 3+)
  if (level >= 3) {
    const fragmentCount = 2 + Math.floor(level / 2);
    for (let i = 0; i < fragmentCount; i++) {
      const fragAngle = time * 5 + i * 1.5;
      const fragDist = sparkRadius * 0.8;
      const fragX = targetX + Math.cos(fragAngle) * fragDist;
      const fragY = targetY + Math.sin(fragAngle) * fragDist;

      ctx.fillStyle = `rgba(150, 150, 150, ${0.5 + Math.sin(time * 15 + i) * 0.3})`;
      ctx.beginPath();
      ctx.arc(fragX, fragY, cellSize * 0.008, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawBaseBolts(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  level: number
): void {
  const boltCount = 4 + (level - 3);
  const boltRadius = radius * 0.05;
  const boltDistance = radius * 0.75;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bx = centerX + Math.cos(angle) * boltDistance;
    const by = centerY + Math.sin(angle) * boltDistance;

    // Bolt recess
    ctx.fillStyle = '#1a2a2a';
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Bolt head
    const boltGradient = ctx.createRadialGradient(
      bx - boltRadius * 0.3,
      by - boltRadius * 0.3,
      0,
      bx,
      by,
      boltRadius
    );
    boltGradient.addColorStop(0, '#7a8a8a');
    boltGradient.addColorStop(1, '#5a6a6a');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHazardStripes(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number
): void {
  ctx.save();

  // Clip to a ring on the base
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.95, 0, Math.PI * 2);
  ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2, true);
  ctx.clip();

  // Draw diagonal stripes
  ctx.fillStyle = '#cc8800';
  const stripeCount = 12;

  for (let i = 0; i < stripeCount; i += 2) {
    const angle = (i / stripeCount) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, angle, angle + Math.PI / stripeCount);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

function drawAmbientGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  const pulseSpeed = 1.0 + level * 0.2;
  const baseSize = cellSize * (0.35 + (level - 3) * 0.04);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed) * cellSize * 0.02;
  const intensity = 0.08 + (level - 3) * 0.04;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, colors.glow);
  glowGradient.addColorStop(0.5, colors.glow.replace(/[\d.]+\)$/, `${intensity * 0.5})`));
  glowGradient.addColorStop(1, 'rgba(200, 180, 100, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
