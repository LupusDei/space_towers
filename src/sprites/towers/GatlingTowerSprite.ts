// Gatling Tower Sprite - Multi-barrel rotating turret with rapid fire
// Military/industrial aesthetic with rotating barrel assembly
// Supports 5 visual tiers based on tower level
// Features barrel spin animation that accelerates when firing

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// ============================================================================
// Barrel Spin Manager - Tracks rotation speed for smooth acceleration
// ============================================================================

const SPIN_ACCELERATION = 0.015; // How fast barrels accelerate when firing
const SPIN_DECELERATION = 0.005; // How fast barrels slow down when idle
const MAX_SPIN_SPEED = 0.4; // Maximum barrel rotation speed
const MIN_SPIN_SPEED = 0.02; // Minimum idle rotation speed

interface BarrelSpinState {
  currentSpeed: number;
  rotation: number;
  lastUpdateTime: number;
  isFiring: boolean;
}

class GatlingSpinManager {
  private states: Map<string, BarrelSpinState> = new Map();

  getState(towerId: string, time: number): BarrelSpinState {
    let state = this.states.get(towerId);
    if (!state) {
      state = {
        currentSpeed: MIN_SPIN_SPEED,
        rotation: 0,
        lastUpdateTime: time,
        isFiring: false,
      };
      this.states.set(towerId, state);
    }

    // Update rotation based on elapsed time
    const deltaTime = time - state.lastUpdateTime;
    state.rotation += state.currentSpeed * deltaTime;
    state.lastUpdateTime = time;

    // Accelerate or decelerate based on firing state
    if (state.isFiring) {
      state.currentSpeed = Math.min(MAX_SPIN_SPEED, state.currentSpeed + SPIN_ACCELERATION);
    } else {
      state.currentSpeed = Math.max(MIN_SPIN_SPEED, state.currentSpeed - SPIN_DECELERATION);
    }

    return state;
  }

  setFiring(towerId: string, isFiring: boolean): void {
    const state = this.states.get(towerId);
    if (state) {
      state.isFiring = isFiring;
    }
  }

  clear(): void {
    this.states.clear();
  }
}

export const gatlingSpinManager = new GatlingSpinManager();

// ============================================================================
// Level-based color schemes (military/industrial - brass and gunmetal)
// ============================================================================

const LEVEL_COLORS = [
  // Level 1 - Basic gunmetal
  { primary: '#4a4a50', secondary: '#3a3a40', accent: '#b8860b', glow: 'rgba(184, 134, 11, 0.3)', muzzle: '#ffaa44' },
  // Level 2 - Polished steel
  { primary: '#5a5a60', secondary: '#4a4a50', accent: '#c9a227', glow: 'rgba(201, 162, 39, 0.4)', muzzle: '#ffbb55' },
  // Level 3 - Tactical black
  { primary: '#3a3a40', secondary: '#2a2a30', accent: '#d4af37', glow: 'rgba(212, 175, 55, 0.5)', muzzle: '#ffcc66' },
  // Level 4 - Elite chrome
  { primary: '#5a5a65', secondary: '#4a4a55', accent: '#ffd700', glow: 'rgba(255, 215, 0, 0.6)', muzzle: '#ffdd77' },
  // Level 5 - Legendary gold-trimmed
  { primary: '#4a4a55', secondary: '#3a3a45', accent: '#ffd700', glow: 'rgba(255, 215, 0, 0.7)', muzzle: '#ffee88' },
];

// ============================================================================
// Level-based parameters
// ============================================================================

function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    barrelCount: 4 + Math.floor(clampedLevel / 2), // 4, 4, 5, 5, 6
    barrelLength: 0.35 + (clampedLevel - 1) * 0.02,
    barrelWidth: 0.025 + (clampedLevel - 1) * 0.002,
    housingRadius: 0.12 + (clampedLevel - 1) * 0.008,
    hasAmmoFeed: clampedLevel >= 2,
    hasHeatSink: clampedLevel >= 3,
    hasShieldPlate: clampedLevel >= 4,
    hasEnergyCore: clampedLevel >= 5,
    muzzleFlashIntensity: 0.6 + (clampedLevel - 1) * 0.1,
  };
}

// ============================================================================
// GatlingTowerSprite Implementation
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

    // Get barrel spin state
    const spinState = gatlingSpinManager.getState(tower.id, time);

    // Draw components
    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawBarrelAssembly(ctx, centerX, centerY, cellSize, level, colors, params, spinState.rotation, tower.targetPosition);

    // Level 4+ get ambient glow
    if (level >= 4) {
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

    // Mark as firing for spin acceleration
    gatlingSpinManager.setFiring(tower.id, true);
    const spinState = gatlingSpinManager.getState(tower.id, time);

    // Draw base tower
    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawBarrelAssembly(ctx, centerX, centerY, cellSize, level, colors, params, spinState.rotation, { x: target.x * cellSize, y: target.y * cellSize });

    // Draw muzzle flash from the active barrel (top barrel)
    drawMuzzleFlash(ctx, centerX, centerY, cellSize, level, colors, params, spinState.rotation, tower.targetPosition);

    // Draw bullet tracer
    drawBulletTracer(ctx, centerX, centerY, targetX, targetY, cellSize, level, colors, time);

    // Draw impact effect
    drawImpactEffect(ctx, targetX, targetY, cellSize, level, colors, time);

    // Reset firing state (will be set again next frame if still firing)
    setTimeout(() => gatlingSpinManager.setFiring(tower.id, false), 50);
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    // Range circle fill (golden tint for gatling)
    ctx.fillStyle = `rgba(184, 134, 11, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(212, 175, 55, ${strokeAlpha})`;
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
  colors: typeof LEVEL_COLORS[0]
): void {
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.34 * sizeMultiplier;

  // Base platform shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY + 2, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base platform with metallic gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#5a5a60');
  baseGradient.addColorStop(0.5, colors.primary);
  baseGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1 + level * 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Mounting bolts
  const boltCount = 4 + level;
  const boltRadius = baseRadius * 0.06;
  const boltDistance = baseRadius * 0.75;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const bx = centerX + Math.cos(angle) * boltDistance;
    const by = centerY + Math.sin(angle) * boltDistance;

    // Bolt recess
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Bolt head
    const boltGradient = ctx.createRadialGradient(
      bx - boltRadius * 0.3, by - boltRadius * 0.3, 0,
      bx, by, boltRadius
    );
    boltGradient.addColorStop(0, '#7a7a80');
    boltGradient.addColorStop(1, '#4a4a50');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 2+ ammo feed indicator
  if (level >= 2) {
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(centerX + baseRadius * 0.5, centerY + baseRadius * 0.3, baseRadius * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#2a2a30';
    ctx.beginPath();
    ctx.arc(centerX + baseRadius * 0.5, centerY + baseRadius * 0.3, baseRadius * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 3+ heat sink vents
  if (level >= 3) {
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const ventAngle = Math.PI * 0.7 + i * 0.15;
      const ventStartX = centerX + Math.cos(ventAngle) * baseRadius * 0.5;
      const ventStartY = centerY + Math.sin(ventAngle) * baseRadius * 0.5;
      const ventEndX = centerX + Math.cos(ventAngle) * baseRadius * 0.85;
      const ventEndY = centerY + Math.sin(ventAngle) * baseRadius * 0.85;
      ctx.beginPath();
      ctx.moveTo(ventStartX, ventStartY);
      ctx.lineTo(ventEndX, ventEndY);
      ctx.stroke();
    }
  }
}

function drawBarrelAssembly(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  params: ReturnType<typeof getLevelParams>,
  barrelRotation: number,
  targetPosition: Point | null
): void {
  // Calculate turret rotation toward target
  let turretAngle = 0;
  if (targetPosition) {
    const targetX = targetPosition.x + cellSize / 2;
    const targetY = targetPosition.y + cellSize / 2;
    turretAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(turretAngle);

  // Central housing
  const housingRadius = cellSize * params.housingRadius;
  const housingGradient = ctx.createRadialGradient(
    -housingRadius * 0.2, -housingRadius * 0.2, 0,
    0, 0, housingRadius
  );
  housingGradient.addColorStop(0, '#6a6a70');
  housingGradient.addColorStop(0.5, colors.primary);
  housingGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = housingGradient;
  ctx.beginPath();
  ctx.arc(0, 0, housingRadius, 0, Math.PI * 2);
  ctx.fill();

  // Housing rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(0, 0, housingRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw rotating barrels
  const barrelLength = cellSize * params.barrelLength;
  const barrelWidth = cellSize * params.barrelWidth;

  for (let i = 0; i < params.barrelCount; i++) {
    const angle = barrelRotation + (i / params.barrelCount) * Math.PI * 2;
    const barrelOffsetX = Math.cos(angle) * housingRadius * 0.6;
    const barrelOffsetY = Math.sin(angle) * housingRadius * 0.6;

    ctx.save();
    ctx.translate(barrelOffsetX, barrelOffsetY);

    // Barrel body
    const barrelGradient = ctx.createLinearGradient(-barrelWidth, 0, barrelWidth, 0);
    barrelGradient.addColorStop(0, '#2a2a30');
    barrelGradient.addColorStop(0.3, colors.primary);
    barrelGradient.addColorStop(0.5, '#6a6a70');
    barrelGradient.addColorStop(0.7, colors.primary);
    barrelGradient.addColorStop(1, '#2a2a30');

    ctx.fillStyle = barrelGradient;
    ctx.fillRect(-barrelWidth / 2, -barrelLength, barrelWidth, barrelLength);

    // Barrel muzzle
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.arc(0, -barrelLength, barrelWidth * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Barrel highlight
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + level * 0.05})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(-barrelWidth / 2, -barrelLength * 0.2);
    ctx.lineTo(-barrelWidth / 2, -barrelLength * 0.9);
    ctx.stroke();

    ctx.restore();
  }

  // Level 4+ shield plate
  if (params.hasShieldPlate) {
    ctx.fillStyle = `rgba(${parseInt(colors.accent.slice(1, 3), 16)}, ${parseInt(colors.accent.slice(3, 5), 16)}, ${parseInt(colors.accent.slice(5, 7), 16)}, 0.3)`;
    ctx.beginPath();
    ctx.arc(0, -barrelLength * 0.5, housingRadius * 1.3, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.fill();
  }

  // Level 5 energy core
  if (params.hasEnergyCore) {
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, housingRadius * 0.5);
    coreGlow.addColorStop(0, 'rgba(255, 215, 0, 0.8)');
    coreGlow.addColorStop(0.5, 'rgba(255, 180, 0, 0.4)');
    coreGlow.addColorStop(1, 'rgba(255, 150, 0, 0)');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, housingRadius * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central hub cap
  ctx.fillStyle = colors.secondary;
  ctx.beginPath();
  ctx.arc(0, 0, housingRadius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, housingRadius * 0.35, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  params: ReturnType<typeof getLevelParams>,
  barrelRotation: number,
  targetPosition: Point | null
): void {
  // Calculate turret rotation toward target
  let turretAngle = 0;
  if (targetPosition) {
    const targetX = targetPosition.x + cellSize / 2;
    const targetY = targetPosition.y + cellSize / 2;
    turretAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
  }

  const housingRadius = cellSize * params.housingRadius;
  const barrelLength = cellSize * params.barrelLength;

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(turretAngle);

  // Flash from multiple barrels (top 2-3 depending on level)
  const flashCount = Math.min(3, 1 + Math.floor(level / 2));
  for (let f = 0; f < flashCount; f++) {
    const barrelIndex = Math.floor(barrelRotation * params.barrelCount / (Math.PI * 2) + f) % params.barrelCount;
    const angle = barrelRotation + (barrelIndex / params.barrelCount) * Math.PI * 2;
    const barrelOffsetX = Math.cos(angle) * housingRadius * 0.6;
    const barrelOffsetY = Math.sin(angle) * housingRadius * 0.6;

    const flashX = barrelOffsetX;
    const flashY = barrelOffsetY - barrelLength;

    // Muzzle flash
    const flashSize = cellSize * (0.08 + level * 0.015) * params.muzzleFlashIntensity;
    const flashGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize);
    flashGradient.addColorStop(0, 'rgba(255, 255, 200, 0.95)');
    flashGradient.addColorStop(0.3, colors.muzzle);
    flashGradient.addColorStop(0.6, 'rgba(255, 150, 50, 0.5)');
    flashGradient.addColorStop(1, 'rgba(255, 100, 20, 0)');

    ctx.fillStyle = flashGradient;
    ctx.beginPath();
    ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
    ctx.fill();

    // Flash spike
    ctx.strokeStyle = 'rgba(255, 255, 200, 0.8)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(flashX, flashY);
    ctx.lineTo(flashX, flashY - flashSize * 1.5);
    ctx.stroke();
  }

  ctx.restore();
}

function drawBulletTracer(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  cellSize: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0],
  time: number
): void {
  const dx = endX - startX;
  const dy = endY - startY;

  // Multiple tracer rounds (gatling fires rapidly)
  const tracerCount = 2 + Math.floor(level / 2);
  const tracerSpacing = 0.15;

  for (let t = 0; t < tracerCount; t++) {
    const offset = ((time * 0.02 + t * tracerSpacing) % 1);
    const tracerX = startX + dx * offset;
    const tracerY = startY + dy * offset;

    // Tracer glow
    const glowSize = cellSize * 0.04;
    const glowGradient = ctx.createRadialGradient(tracerX, tracerY, 0, tracerX, tracerY, glowSize);
    glowGradient.addColorStop(0, 'rgba(255, 220, 150, 0.9)');
    glowGradient.addColorStop(0.5, 'rgba(255, 180, 100, 0.5)');
    glowGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(tracerX, tracerY, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Tracer core
    ctx.fillStyle = 'rgba(255, 255, 200, 0.9)';
    ctx.beginPath();
    ctx.arc(tracerX, tracerY, glowSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bullet stream line
  ctx.strokeStyle = `rgba(255, 200, 100, ${0.15 + level * 0.05})`;
  ctx.lineWidth = 1 + level * 0.3;
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
  level: number,
  _colors: typeof LEVEL_COLORS[0],
  time: number
): void {
  // Impact sparks
  const sparkCount = 3 + level;
  const sparkRadius = cellSize * 0.12;

  for (let i = 0; i < sparkCount; i++) {
    const sparkAngle = (time * 0.03 + i * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
    const sparkDist = sparkRadius * (0.5 + Math.sin(time * 0.02 + i) * 0.3);
    const sparkX = x + Math.cos(sparkAngle) * sparkDist;
    const sparkY = y + Math.sin(sparkAngle) * sparkDist;

    ctx.fillStyle = `rgba(255, 220, 100, ${0.6 + Math.sin(time * 0.05 + i) * 0.3})`;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Impact glow
  const impactSize = cellSize * (0.1 + level * 0.02);
  const impactGradient = ctx.createRadialGradient(x, y, 0, x, y, impactSize);
  impactGradient.addColorStop(0, 'rgba(255, 200, 100, 0.6)');
  impactGradient.addColorStop(0.5, 'rgba(255, 150, 50, 0.3)');
  impactGradient.addColorStop(1, 'rgba(200, 100, 30, 0)');

  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(x, y, impactSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawAmbientGlow(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  _colors: typeof LEVEL_COLORS[0]
): void {
  const pulseSpeed = 1.0 + level * 0.2;
  const baseSize = cellSize * (0.35 + (level - 4) * 0.05);
  const pulseSize = baseSize + Math.sin(time * 0.003 * pulseSpeed) * cellSize * 0.02;
  const intensity = 0.1 + (level - 4) * 0.05;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(212, 175, 55, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(184, 134, 11, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(184, 134, 11, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
