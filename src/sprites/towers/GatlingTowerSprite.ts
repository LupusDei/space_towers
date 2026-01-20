// Gatling Tower Sprite - Multi-barrel rotating turret
// Classic gatling gun design with barrel spin animation
// Military/industrial aesthetic with 5 visual tiers

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// ============================================================================
// Barrel Spin Tracking - Tracks barrel rotation speed per tower
// ============================================================================

interface BarrelSpinState {
  currentAngle: number;
  targetSpeed: number;
  currentSpeed: number;
  lastUpdateTime: number;
}

class BarrelSpinManager {
  private states: Map<string, BarrelSpinState> = new Map();

  private readonly IDLE_SPEED = 0.5; // radians per second when idle
  private readonly FIRING_SPEED = 15; // radians per second when firing
  private readonly SPIN_UP_RATE = 8; // how fast to accelerate
  private readonly SPIN_DOWN_RATE = 3; // how fast to decelerate

  getBarrelAngle(towerId: string, time: number, isFiring: boolean): number {
    let state = this.states.get(towerId);

    if (!state) {
      state = {
        currentAngle: 0,
        targetSpeed: this.IDLE_SPEED,
        currentSpeed: this.IDLE_SPEED,
        lastUpdateTime: time,
      };
      this.states.set(towerId, state);
    }

    const deltaTime = Math.max(0, Math.min(0.1, (time - state.lastUpdateTime) / 1000));
    state.lastUpdateTime = time;

    state.targetSpeed = isFiring ? this.FIRING_SPEED : this.IDLE_SPEED;

    if (state.currentSpeed < state.targetSpeed) {
      state.currentSpeed = Math.min(
        state.targetSpeed,
        state.currentSpeed + this.SPIN_UP_RATE * deltaTime
      );
    } else if (state.currentSpeed > state.targetSpeed) {
      state.currentSpeed = Math.max(
        state.targetSpeed,
        state.currentSpeed - this.SPIN_DOWN_RATE * deltaTime
      );
    }

    state.currentAngle += state.currentSpeed * deltaTime;
    state.currentAngle %= Math.PI * 2;

    return state.currentAngle;
  }

  getSpinSpeed(towerId: string): number {
    return this.states.get(towerId)?.currentSpeed ?? this.IDLE_SPEED;
  }

  clear(): void {
    this.states.clear();
  }
}

export const barrelSpinManager = new BarrelSpinManager();

// ============================================================================
// Level Color Schemes
// ============================================================================

const LEVEL_COLORS = [
  // Level 1 - Basic gunmetal
  {
    primary: '#4a4a52',
    secondary: '#3a3a42',
    accent: '#6a6a72',
    barrel: '#5a5a62',
    glow: 'rgba(255, 200, 100, 0.3)',
    muzzle: '#ffcc66',
  },
  // Level 2 - Reinforced steel
  {
    primary: '#525258',
    secondary: '#424248',
    accent: '#72727a',
    barrel: '#626268',
    glow: 'rgba(255, 180, 80, 0.35)',
    muzzle: '#ffbb55',
  },
  // Level 3 - Military grade
  {
    primary: '#4a5050',
    secondary: '#3a4040',
    accent: '#6a7a7a',
    barrel: '#5a6666',
    glow: 'rgba(255, 160, 60, 0.4)',
    muzzle: '#ffaa44',
  },
  // Level 4 - Heavy duty
  {
    primary: '#3a4248',
    secondary: '#2a3238',
    accent: '#5a6a70',
    barrel: '#4a5a60',
    glow: 'rgba(255, 140, 40, 0.45)',
    muzzle: '#ff9933',
  },
  // Level 5 - Elite black ops
  {
    primary: '#2a3035',
    secondary: '#1a2025',
    accent: '#4a5560',
    barrel: '#3a4550',
    glow: 'rgba(255, 120, 20, 0.5)',
    muzzle: '#ff8822',
  },
];

// ============================================================================
// Level Parameters
// ============================================================================

function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    barrelCount: 6,
    barrelLength: 0.35 + (clampedLevel - 1) * 0.02,
    barrelWidth: 0.025 + (clampedLevel - 1) * 0.002,
    turretRadius: 0.18 + (clampedLevel - 1) * 0.01,
    hasAmmoFeed: clampedLevel >= 2,
    hasHeatSink: clampedLevel >= 3,
    hasTargetingLaser: clampedLevel >= 4,
    hasEliteFinish: clampedLevel >= 5,
    muzzleFlashIntensity: 0.6 + (clampedLevel - 1) * 0.1,
  };
}

// ============================================================================
// Gatling Tower Sprite
// ============================================================================

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurret(ctx, centerX, centerY, cellSize, time, level, colors, params, tower);

    if (level >= 3) {
      drawAmbientGlow(ctx, centerX, centerY, cellSize, time, level, colors);
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurret(ctx, centerX, centerY, cellSize, time, level, colors, params, tower, true);
    drawMuzzleFlash(ctx, centerX, centerY, cellSize, time, level, colors, params, tower);
    drawBulletTrails(ctx, centerX, centerY, targetX, targetY, cellSize, time, level, colors);
    drawImpactEffect(ctx, targetX, targetY, cellSize, time, level, colors);
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    ctx.fillStyle = `rgba(255, 180, 100, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = `rgba(255, 180, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

// ============================================================================
// Drawing Functions
// ============================================================================

function drawBase(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: (typeof LEVEL_COLORS)[0]
): void {
  const baseRadius = cellSize * (0.34 + level * 0.01);

  // Base shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY + 2, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base platform gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, colors.accent);
  baseGradient.addColorStop(0.5, colors.primary);
  baseGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5 + level * 0.2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = colors.secondary;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
  ctx.stroke();

  // Base bolts
  const boltCount = 4 + Math.floor(level / 2);
  const boltRadius = baseRadius * 0.05;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bx = centerX + Math.cos(angle) * baseRadius * 0.85;
    const by = centerY + Math.sin(angle) * baseRadius * 0.85;

    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius * 1.2, 0, Math.PI * 2);
    ctx.fill();

    const boltGradient = ctx.createRadialGradient(
      bx - boltRadius * 0.3,
      by - boltRadius * 0.3,
      0,
      bx,
      by,
      boltRadius
    );
    boltGradient.addColorStop(0, '#7a7a82');
    boltGradient.addColorStop(1, '#4a4a52');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ammo belt feed (level 2+)
  if (level >= 2) {
    const feedWidth = baseRadius * 0.15;
    const feedLength = baseRadius * 0.6;

    ctx.fillStyle = colors.secondary;
    ctx.fillRect(
      centerX + baseRadius * 0.5 - feedWidth / 2,
      centerY - feedLength / 2,
      feedWidth,
      feedLength
    );

    // Feed cover
    ctx.fillStyle = colors.primary;
    ctx.fillRect(
      centerX + baseRadius * 0.5 - feedWidth * 0.4,
      centerY - feedLength * 0.4,
      feedWidth * 0.8,
      feedLength * 0.8
    );
  }
}

function drawTurret(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: (typeof LEVEL_COLORS)[0],
  params: ReturnType<typeof getLevelParams>,
  tower: Tower,
  isFiring: boolean = false
): void {
  // Calculate turret rotation toward target
  let turretAngle = 0;
  if (tower.targetPosition) {
    const targetX = tower.targetPosition.x + cellSize / 2;
    const targetY = tower.targetPosition.y + cellSize / 2;
    turretAngle = Math.atan2(targetY - centerY, targetX - centerX);
  } else {
    // Slow idle scan
    turretAngle = time * 0.0003;
  }

  // Get barrel spin angle
  const barrelAngle = barrelSpinManager.getBarrelAngle(tower.id, time, isFiring);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(turretAngle);

  // Turret housing
  const turretRadius = cellSize * params.turretRadius;
  const turretGradient = ctx.createRadialGradient(
    -turretRadius * 0.2,
    -turretRadius * 0.2,
    0,
    0,
    0,
    turretRadius
  );
  turretGradient.addColorStop(0, colors.accent);
  turretGradient.addColorStop(0.6, colors.primary);
  turretGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = turretGradient;
  ctx.beginPath();
  ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, turretRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Barrel shroud/housing
  const shroudLength = cellSize * 0.12;
  const shroudWidth = cellSize * 0.16;

  const shroudGradient = ctx.createLinearGradient(0, -shroudWidth, 0, shroudWidth);
  shroudGradient.addColorStop(0, colors.secondary);
  shroudGradient.addColorStop(0.3, colors.primary);
  shroudGradient.addColorStop(0.7, colors.primary);
  shroudGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = shroudGradient;
  ctx.fillRect(turretRadius * 0.5, -shroudWidth / 2, shroudLength, shroudWidth);

  // Barrel cluster
  const barrelLength = cellSize * params.barrelLength;
  const barrelWidth = cellSize * params.barrelWidth;
  const barrelClusterRadius = cellSize * 0.06;
  const barrelStartX = turretRadius * 0.5 + shroudLength;

  // Draw each barrel
  for (let i = 0; i < params.barrelCount; i++) {
    const angle = barrelAngle + (i / params.barrelCount) * Math.PI * 2;
    const offsetY = Math.sin(angle) * barrelClusterRadius;
    const offsetZ = Math.cos(angle); // Simulated depth

    // Barrel position with perspective
    const barrelY = offsetY;
    const depthScale = 0.7 + offsetZ * 0.3;

    // Barrel gradient for metallic look
    const barrelGradient = ctx.createLinearGradient(
      barrelStartX,
      barrelY - barrelWidth * depthScale,
      barrelStartX,
      barrelY + barrelWidth * depthScale
    );

    // Vary brightness based on simulated depth
    const brightness = 0.6 + offsetZ * 0.4;
    const r = Math.floor(parseInt(colors.barrel.slice(1, 3), 16) * brightness);
    const g = Math.floor(parseInt(colors.barrel.slice(3, 5), 16) * brightness);
    const b = Math.floor(parseInt(colors.barrel.slice(5, 7), 16) * brightness);

    barrelGradient.addColorStop(0, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);
    barrelGradient.addColorStop(0.3, `rgb(${r}, ${g}, ${b})`);
    barrelGradient.addColorStop(0.7, `rgb(${r}, ${g}, ${b})`);
    barrelGradient.addColorStop(1, `rgb(${Math.floor(r * 0.7)}, ${Math.floor(g * 0.7)}, ${Math.floor(b * 0.7)})`);

    ctx.fillStyle = barrelGradient;
    ctx.fillRect(
      barrelStartX,
      barrelY - barrelWidth * depthScale,
      barrelLength * depthScale,
      barrelWidth * 2 * depthScale
    );

    // Muzzle
    ctx.fillStyle = offsetZ > 0 ? '#2a2a32' : '#1a1a22';
    ctx.beginPath();
    ctx.arc(
      barrelStartX + barrelLength * depthScale,
      barrelY,
      barrelWidth * depthScale * 0.8,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Barrel cluster center hub
  const hubGradient = ctx.createRadialGradient(
    barrelStartX + barrelClusterRadius * 0.3,
    -barrelClusterRadius * 0.3,
    0,
    barrelStartX + barrelClusterRadius,
    0,
    barrelClusterRadius * 1.2
  );
  hubGradient.addColorStop(0, colors.accent);
  hubGradient.addColorStop(0.7, colors.primary);
  hubGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = hubGradient;
  ctx.beginPath();
  ctx.arc(barrelStartX + barrelClusterRadius, 0, barrelClusterRadius, 0, Math.PI * 2);
  ctx.fill();

  // Heat sink fins (level 3+)
  if (params.hasHeatSink) {
    const finCount = 3 + Math.floor((level - 3) * 1.5);
    const finLength = cellSize * 0.04;

    ctx.fillStyle = colors.secondary;
    for (let i = 0; i < finCount; i++) {
      const finX = barrelStartX - shroudLength * 0.3 + (i / finCount) * shroudLength * 0.8;
      ctx.fillRect(finX, -shroudWidth / 2 - finLength, cellSize * 0.01, finLength);
      ctx.fillRect(finX, shroudWidth / 2, cellSize * 0.01, finLength);
    }
  }

  // Targeting laser (level 4+)
  if (params.hasTargetingLaser && tower.targetPosition) {
    const laserAlpha = 0.3 + Math.sin(time * 0.008) * 0.15;
    ctx.strokeStyle = `rgba(255, 50, 50, ${laserAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(barrelStartX + barrelLength * 0.8, 0);

    // Calculate distance to target in local coordinates
    const dx = tower.targetPosition.x + cellSize / 2 - centerX;
    const dy = tower.targetPosition.y + cellSize / 2 - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    ctx.lineTo(dist, 0);
    ctx.stroke();

    // Laser dot
    ctx.fillStyle = `rgba(255, 100, 100, ${laserAlpha + 0.2})`;
    ctx.beginPath();
    ctx.arc(dist, 0, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Elite finish glow (level 5)
  if (params.hasEliteFinish) {
    const glowAlpha = 0.15 + Math.sin(time * 0.003) * 0.05;
    ctx.strokeStyle = `rgba(255, 180, 100, ${glowAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, turretRadius + 2, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: (typeof LEVEL_COLORS)[0],
  params: ReturnType<typeof getLevelParams>,
  tower: Tower
): void {
  if (!tower.targetPosition) return;

  const targetX = tower.targetPosition.x + cellSize / 2;
  const targetY = tower.targetPosition.y + cellSize / 2;
  const turretAngle = Math.atan2(targetY - centerY, targetX - centerX);

  const barrelLength = cellSize * params.barrelLength;
  const turretRadius = cellSize * params.turretRadius;
  const shroudLength = cellSize * 0.12;
  const muzzleDistance = turretRadius * 0.5 + shroudLength + barrelLength * 0.9;

  const muzzleX = centerX + Math.cos(turretAngle) * muzzleDistance;
  const muzzleY = centerY + Math.sin(turretAngle) * muzzleDistance;

  // Rapid flash variation
  const flashPhase = (time * 0.05) % 1;
  const flashIntensity = params.muzzleFlashIntensity * (0.5 + flashPhase * 0.5);

  // Outer muzzle flash
  const flashSize = cellSize * (0.08 + level * 0.01) * (0.8 + flashPhase * 0.4);
  const outerFlash = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, flashSize * 2);
  outerFlash.addColorStop(0, `rgba(255, 220, 150, ${flashIntensity})`);
  outerFlash.addColorStop(0.3, `rgba(255, 180, 80, ${flashIntensity * 0.6})`);
  outerFlash.addColorStop(0.6, `rgba(255, 120, 40, ${flashIntensity * 0.3})`);
  outerFlash.addColorStop(1, 'rgba(255, 80, 20, 0)');

  ctx.fillStyle = outerFlash;
  ctx.beginPath();
  ctx.arc(muzzleX, muzzleY, flashSize * 2, 0, Math.PI * 2);
  ctx.fill();

  // Inner bright core
  const innerFlash = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, flashSize);
  innerFlash.addColorStop(0, '#ffffff');
  innerFlash.addColorStop(0.3, colors.muzzle);
  innerFlash.addColorStop(1, 'rgba(255, 150, 50, 0)');

  ctx.fillStyle = innerFlash;
  ctx.beginPath();
  ctx.arc(muzzleX, muzzleY, flashSize, 0, Math.PI * 2);
  ctx.fill();

  // Muzzle flash spikes
  const spikeCount = 4 + level;
  ctx.strokeStyle = `rgba(255, 220, 150, ${flashIntensity * 0.7})`;
  ctx.lineWidth = 1.5;

  for (let i = 0; i < spikeCount; i++) {
    const spikeAngle = turretAngle + ((i / spikeCount) - 0.5) * 0.8;
    const spikeLength = flashSize * (1.5 + Math.random() * 0.5);

    ctx.beginPath();
    ctx.moveTo(muzzleX, muzzleY);
    ctx.lineTo(
      muzzleX + Math.cos(spikeAngle) * spikeLength,
      muzzleY + Math.sin(spikeAngle) * spikeLength
    );
    ctx.stroke();
  }
}

function drawBulletTrails(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: (typeof LEVEL_COLORS)[0]
): void {
  const dx = endX - startX;
  const dy = endY - startY;
  const angle = Math.atan2(dy, dx);

  // Multiple bullet trails for gatling effect
  const trailCount = 2 + Math.floor(level / 2);

  for (let i = 0; i < trailCount; i++) {
    // Staggered bullets along the path
    const bulletProgress = ((time * 0.015 + i * 0.3) % 1);
    const bulletX = startX + dx * bulletProgress;
    const bulletY = startY + dy * bulletProgress;

    // Bullet trail
    const trailLength = cellSize * 0.15;
    const trailStartX = bulletX - Math.cos(angle) * trailLength;
    const trailStartY = bulletY - Math.sin(angle) * trailLength;

    // Trail gradient
    const trailGradient = ctx.createLinearGradient(trailStartX, trailStartY, bulletX, bulletY);
    trailGradient.addColorStop(0, 'rgba(255, 200, 100, 0)');
    trailGradient.addColorStop(0.5, `rgba(255, 180, 80, ${0.3 + level * 0.05})`);
    trailGradient.addColorStop(1, `rgba(255, 220, 150, ${0.6 + level * 0.08})`);

    ctx.strokeStyle = trailGradient;
    ctx.lineWidth = 2 + level * 0.3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(trailStartX, trailStartY);
    ctx.lineTo(bulletX, bulletY);
    ctx.stroke();

    // Bullet head glow
    ctx.fillStyle = `rgba(255, 255, 200, ${0.8 + level * 0.04})`;
    ctx.beginPath();
    ctx.arc(bulletX, bulletY, 1.5 + level * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main tracer line (thin, continuous)
  ctx.strokeStyle = `rgba(255, 200, 100, ${0.15 + level * 0.03})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();
}

function drawImpactEffect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: (typeof LEVEL_COLORS)[0]
): void {
  const impactRadius = cellSize * (0.06 + level * 0.01);
  const flashPhase = (time * 0.03) % 1;

  // Impact flash
  const impactGradient = ctx.createRadialGradient(x, y, 0, x, y, impactRadius * 2);
  impactGradient.addColorStop(0, `rgba(255, 220, 150, ${0.6 + flashPhase * 0.3})`);
  impactGradient.addColorStop(0.4, `rgba(255, 150, 80, ${0.3 + flashPhase * 0.2})`);
  impactGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(x, y, impactRadius * 2, 0, Math.PI * 2);
  ctx.fill();

  // Sparks
  const sparkCount = 3 + level;
  for (let i = 0; i < sparkCount; i++) {
    const sparkAngle = (time * 0.01 + i * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
    const sparkDist = impactRadius * (0.5 + Math.sin(time * 0.02 + i) * 0.3);
    const sparkX = x + Math.cos(sparkAngle) * sparkDist;
    const sparkY = y + Math.sin(sparkAngle) * sparkDist;

    ctx.fillStyle = `rgba(255, 220, 150, ${0.6 + Math.random() * 0.4})`;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawAmbientGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: (typeof LEVEL_COLORS)[0]
): void {
  const pulseSpeed = 0.8 + level * 0.15;
  const baseSize = cellSize * (0.32 + (level - 3) * 0.03);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed * 0.003) * cellSize * 0.015;
  const intensity = 0.06 + (level - 3) * 0.03;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(255, 180, 100, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(255, 150, 80, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(255, 120, 60, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
