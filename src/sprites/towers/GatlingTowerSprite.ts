// Gatling Tower Sprite - 5 visual tiers based on tower level
// Multi-barrel rotating turret with classic gatling/minigun aesthetic
// Features barrel spin animation, muzzle flash, and smooth target tracking

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based color schemes (military/industrial - progressively more elite)
const LEVEL_COLORS = [
  // Level 1 - Basic gunmetal
  { primary: '#4a4a50', secondary: '#3a3a40', accent: '#6a6a70', glow: 'rgba(255, 200, 100, 0.3)', muzzleFlash: '#ffcc44' },
  // Level 2 - Enhanced steel
  { primary: '#505058', secondary: '#404048', accent: '#707080', glow: 'rgba(255, 180, 80, 0.4)', muzzleFlash: '#ffdd66' },
  // Level 3 - Tactical dark
  { primary: '#3a3a42', secondary: '#2a2a32', accent: '#5a5a68', glow: 'rgba(255, 160, 60, 0.5)', muzzleFlash: '#ffee88' },
  // Level 4 - Elite black steel
  { primary: '#2d2d35', secondary: '#1d1d25', accent: '#4d4d5d', glow: 'rgba(255, 140, 40, 0.6)', muzzleFlash: '#ffffaa' },
  // Level 5 - Ultimate dark ops
  { primary: '#202028', secondary: '#15151d', accent: '#404050', glow: 'rgba(255, 120, 20, 0.7)', muzzleFlash: '#ffffff' },
];

// Number of barrels in the gatling assembly
const BARREL_COUNT = 6;

// Barrel spin state manager - tracks spinning for each tower
interface BarrelSpinState {
  currentAngle: number;
  spinSpeed: number;
  lastUpdateTime: number;
}

class GatlingBarrelSpinManager {
  private spinStates: Map<string, BarrelSpinState> = new Map();

  getOrCreateState(towerId: string, time: number): BarrelSpinState {
    let state = this.spinStates.get(towerId);
    if (!state) {
      state = {
        currentAngle: 0,
        spinSpeed: 0,
        lastUpdateTime: time,
      };
      this.spinStates.set(towerId, state);
    }
    return state;
  }

  updateSpin(towerId: string, time: number, isFiring: boolean, level: number): number {
    const state = this.getOrCreateState(towerId, time);
    const deltaTime = (time - state.lastUpdateTime) / 1000; // Convert to seconds
    state.lastUpdateTime = time;

    // Target spin speed based on firing state and level
    const maxSpinSpeed = 8 + level * 2; // Radians per second
    const idleSpinSpeed = 0.5 + level * 0.1; // Slow rotation when idle
    const targetSpeed = isFiring ? maxSpinSpeed : idleSpinSpeed;

    // Smoothly interpolate spin speed
    const acceleration = isFiring ? 15 : 5; // Speed up faster than slow down
    if (state.spinSpeed < targetSpeed) {
      state.spinSpeed = Math.min(targetSpeed, state.spinSpeed + acceleration * deltaTime);
    } else {
      state.spinSpeed = Math.max(targetSpeed, state.spinSpeed - acceleration * deltaTime);
    }

    // Update angle
    state.currentAngle += state.spinSpeed * deltaTime;
    state.currentAngle = state.currentAngle % (Math.PI * 2);

    return state.currentAngle;
  }

  getSpinSpeed(towerId: string): number {
    const state = this.spinStates.get(towerId);
    return state ? state.spinSpeed : 0;
  }

  clear(): void {
    this.spinStates.clear();
  }
}

// Singleton instance for global access
export const gatlingBarrelSpinManager = new GatlingBarrelSpinManager();

export const GatlingTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level || 1, 1), 5);
    const colors = LEVEL_COLORS[level - 1];

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Update barrel spin (idle rotation)
    const barrelAngle = gatlingBarrelSpinManager.updateSpin(tower.id, time, false, level);

    // Draw based on level
    drawBase(ctx, centerX, centerY, cellSize, level, colors);
    drawTurretMount(ctx, centerX, centerY, cellSize, level, colors, tower.targetPosition);
    drawBarrelAssembly(ctx, centerX, centerY, cellSize, time, level, colors, tower.targetPosition, barrelAngle);
    drawStatusIndicators(ctx, centerX, centerY, cellSize, time, level, colors);

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

    // Update barrel spin (firing - fast rotation)
    const barrelAngle = gatlingBarrelSpinManager.updateSpin(tower.id, time, true, level);
    const spinSpeed = gatlingBarrelSpinManager.getSpinSpeed(tower.id);

    // Convert target from grid to pixel coordinates
    const targetPixels = { x: target.x * cellSize, y: target.y * cellSize };

    // Redraw turret and barrels pointing at target
    drawTurretMount(ctx, startX, startY, cellSize, level, colors, targetPixels);
    drawBarrelAssembly(ctx, startX, startY, cellSize, time, level, colors, targetPixels, barrelAngle);

    // Calculate angle to target for muzzle flash positioning
    const angle = Math.atan2(endY - startY, endX - startX);
    const barrelLength = cellSize * (0.32 + level * 0.02);
    const muzzleX = startX + Math.cos(angle) * barrelLength;
    const muzzleY = startY + Math.sin(angle) * barrelLength;

    // Muzzle flash - intensity based on spin speed
    const flashIntensity = Math.min(1, spinSpeed / 10);
    const flashSize = cellSize * (0.12 + level * 0.02) * flashIntensity;

    if (flashIntensity > 0.3) {
      // Outer flash glow
      const flashGradient = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, flashSize * 1.5);
      flashGradient.addColorStop(0, `rgba(255, 255, 200, ${flashIntensity})`);
      flashGradient.addColorStop(0.3, `rgba(255, 200, 100, ${flashIntensity * 0.7})`);
      flashGradient.addColorStop(0.6, `rgba(255, 150, 50, ${flashIntensity * 0.3})`);
      flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY, flashSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Inner bright core
      const coreGradient = ctx.createRadialGradient(muzzleX, muzzleY, 0, muzzleX, muzzleY, flashSize * 0.5);
      coreGradient.addColorStop(0, '#ffffff');
      coreGradient.addColorStop(0.5, colors.muzzleFlash);
      coreGradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(muzzleX, muzzleY, flashSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bullet tracers - multiple rapid fire lines
    const tracerCount = 2 + Math.floor(level / 2);
    for (let i = 0; i < tracerCount; i++) {
      const tracerOffset = (i - (tracerCount - 1) / 2) * cellSize * 0.02;
      const perpX = -Math.sin(angle) * tracerOffset;
      const perpY = Math.cos(angle) * tracerOffset;

      // Tracer glow
      ctx.strokeStyle = `rgba(255, 200, 100, ${0.3 + level * 0.05})`;
      ctx.lineWidth = cellSize * 0.025;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(muzzleX + perpX, muzzleY + perpY);
      ctx.lineTo(endX + perpX, endY + perpY);
      ctx.stroke();

      // Tracer core
      ctx.strokeStyle = `rgba(255, 255, 200, ${0.5 + level * 0.1})`;
      ctx.lineWidth = cellSize * 0.012;
      ctx.beginPath();
      ctx.moveTo(muzzleX + perpX, muzzleY + perpY);
      ctx.lineTo(endX + perpX, endY + perpY);
      ctx.stroke();
    }

    // Impact sparks at target
    const impactSize = cellSize * (0.1 + level * 0.02);
    const sparkCount = 3 + level;
    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = (time * 0.02 + i * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
      const sparkDist = impactSize * (0.5 + Math.random() * 0.5);
      const sparkX = endX + Math.cos(sparkAngle) * sparkDist;
      const sparkY = endY + Math.sin(sparkAngle) * sparkDist;

      ctx.fillStyle = `rgba(255, ${200 + Math.floor(Math.random() * 55)}, ${100 + Math.floor(Math.random() * 100)}, ${0.6 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 1 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Impact flash
    const impactGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, impactSize);
    impactGradient.addColorStop(0, 'rgba(255, 255, 200, 0.8)');
    impactGradient.addColorStop(0.4, `rgba(255, 180, 100, ${0.4 + level * 0.1})`);
    impactGradient.addColorStop(1, 'rgba(255, 100, 50, 0)');

    ctx.fillStyle = impactGradient;
    ctx.beginPath();
    ctx.arc(endX, endY, impactSize, 0, Math.PI * 2);
    ctx.fill();
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    // Range circle fill (orange tint for gatling)
    ctx.fillStyle = `rgba(255, 180, 100, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(255, 160, 80, ${strokeAlpha})`;
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
  // Heavy military platform base - slightly larger with level
  const sizeMultiplier = 0.95 + level * 0.02;
  const baseRadius = cellSize * 0.38 * sizeMultiplier;

  // Base shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY + 2, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base platform with military metal gradient
  const baseGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  baseGradient.addColorStop(0, '#5a5a60');
  baseGradient.addColorStop(0.5, '#4a4a50');
  baseGradient.addColorStop(1, '#3a3a40');

  ctx.fillStyle = baseGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base rim highlight
  const rimIntensity = 0.3 + level * 0.1;
  ctx.strokeStyle = `rgba(100, 100, 110, ${rimIntensity + 0.5})`;
  ctx.lineWidth = 1.5 + level * 0.3;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Ammo belt housing (level 2+)
  if (level >= 2) {
    const housingWidth = baseRadius * 0.4;
    const housingHeight = baseRadius * 0.25;
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(
      centerX - baseRadius - housingWidth * 0.3,
      centerY - housingHeight / 2,
      housingWidth,
      housingHeight
    );

    // Ammo belt detail
    ctx.strokeStyle = '#2a2a30';
    ctx.lineWidth = 1;
    const beltSegments = 3 + level;
    for (let i = 0; i < beltSegments; i++) {
      const segX = centerX - baseRadius - housingWidth * 0.2 + (i * housingWidth * 0.8 / beltSegments);
      ctx.beginPath();
      ctx.moveTo(segX, centerY - housingHeight / 2);
      ctx.lineTo(segX, centerY + housingHeight / 2);
      ctx.stroke();
    }
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

  // Level 5 gets tactical markings
  if (level >= 5) {
    drawTacticalMarkings(ctx, centerX, centerY, baseRadius, colors);
  }
}

function drawTurretMount(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  targetPosition: Point | null
): void {
  // Calculate angle to target
  let angle: number;
  if (targetPosition) {
    const targetX = targetPosition.x + cellSize / 2;
    const targetY = targetPosition.y + cellSize / 2;
    angle = Math.atan2(targetY - centerY, targetX - centerX);
  } else {
    angle = 0; // Default pointing right
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Turret mount - the rotating housing
  const mountRadius = cellSize * (0.16 + level * 0.01);
  const mountGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, mountRadius);
  mountGradient.addColorStop(0, colors.accent);
  mountGradient.addColorStop(0.6, colors.primary);
  mountGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = mountGradient;
  ctx.beginPath();
  ctx.arc(0, 0, mountRadius, 0, Math.PI * 2);
  ctx.fill();

  // Mount rim
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, mountRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Barrel housing extending forward
  const housingLength = cellSize * (0.12 + level * 0.01);
  const housingWidth = mountRadius * 0.8;

  const housingGradient = ctx.createLinearGradient(0, -housingWidth, 0, housingWidth);
  housingGradient.addColorStop(0, colors.secondary);
  housingGradient.addColorStop(0.3, colors.primary);
  housingGradient.addColorStop(0.5, colors.accent);
  housingGradient.addColorStop(0.7, colors.primary);
  housingGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = housingGradient;
  ctx.fillRect(mountRadius * 0.3, -housingWidth / 2, housingLength, housingWidth);

  ctx.restore();
}

function drawBarrelAssembly(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  _time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0],
  targetPosition: Point | null,
  barrelSpinAngle: number
): void {
  // Calculate angle to target for turret rotation
  let turretAngle: number;
  if (targetPosition) {
    const targetX = targetPosition.x + cellSize / 2;
    const targetY = targetPosition.y + cellSize / 2;
    turretAngle = Math.atan2(targetY - centerY, targetX - centerX);
  } else {
    turretAngle = 0;
  }

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(turretAngle);

  // Position for barrel assembly (forward from mount center)
  const barrelAssemblyX = cellSize * (0.15 + level * 0.01);

  // Draw each barrel
  const barrelLength = cellSize * (0.2 + level * 0.015);
  const barrelRadius = cellSize * (0.015 + level * 0.002);
  const assemblyRadius = cellSize * (0.06 + level * 0.005);

  // Central barrel hub
  const hubGradient = ctx.createRadialGradient(
    barrelAssemblyX,
    0,
    0,
    barrelAssemblyX,
    0,
    assemblyRadius * 1.2
  );
  hubGradient.addColorStop(0, colors.accent);
  hubGradient.addColorStop(0.7, colors.primary);
  hubGradient.addColorStop(1, colors.secondary);

  ctx.fillStyle = hubGradient;
  ctx.beginPath();
  ctx.arc(barrelAssemblyX, 0, assemblyRadius * 1.2, 0, Math.PI * 2);
  ctx.fill();

  // Draw barrels with spin
  for (let i = 0; i < BARREL_COUNT; i++) {
    const barrelAngle = barrelSpinAngle + (i * Math.PI * 2 / BARREL_COUNT);
    const offsetX = Math.cos(barrelAngle) * assemblyRadius;
    const offsetY = Math.sin(barrelAngle) * assemblyRadius;

    const barrelStartX = barrelAssemblyX + offsetX * 0.5;
    const barrelStartY = offsetY * 0.5;
    const barrelEndX = barrelAssemblyX + barrelLength + offsetX;
    const barrelEndY = offsetY;

    // Barrel shadow/depth
    ctx.strokeStyle = colors.secondary;
    ctx.lineWidth = barrelRadius * 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(barrelStartX, barrelStartY);
    ctx.lineTo(barrelEndX, barrelEndY);
    ctx.stroke();

    // Barrel body
    const barrelGradient = ctx.createLinearGradient(
      barrelStartX,
      barrelStartY - barrelRadius,
      barrelStartX,
      barrelStartY + barrelRadius
    );
    barrelGradient.addColorStop(0, colors.secondary);
    barrelGradient.addColorStop(0.3, colors.accent);
    barrelGradient.addColorStop(0.5, '#8a8a90');
    barrelGradient.addColorStop(0.7, colors.accent);
    barrelGradient.addColorStop(1, colors.secondary);

    ctx.strokeStyle = barrelGradient;
    ctx.lineWidth = barrelRadius * 2;
    ctx.beginPath();
    ctx.moveTo(barrelStartX, barrelStartY);
    ctx.lineTo(barrelEndX, barrelEndY);
    ctx.stroke();

    // Barrel bore (dark center)
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath();
    ctx.arc(barrelEndX, barrelEndY, barrelRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Level 3+ barrel cooling rings
    if (level >= 3) {
      const ringCount = level - 2;
      ctx.strokeStyle = '#2a2a30';
      ctx.lineWidth = 0.5;
      for (let r = 0; r < ringCount; r++) {
        const ringT = 0.3 + (r * 0.3 / ringCount);
        const ringX = barrelStartX + (barrelEndX - barrelStartX) * ringT;
        const ringY = barrelStartY + (barrelEndY - barrelStartY) * ringT;
        ctx.beginPath();
        ctx.arc(ringX, ringY, barrelRadius * 1.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  // Front barrel cap/flash hider
  const capRadius = assemblyRadius * 1.4;
  const capX = barrelAssemblyX + barrelLength * 0.85;

  ctx.fillStyle = colors.primary;
  ctx.beginPath();
  ctx.arc(capX, 0, capRadius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(capX, 0, capRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Level 4+ muzzle brake vents
  if (level >= 4) {
    ctx.strokeStyle = '#1a1a1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) {
      const ventAngle = (i * Math.PI / 2) + Math.PI / 4;
      const ventInnerR = capRadius * 0.5;
      const ventOuterR = capRadius * 0.9;
      ctx.beginPath();
      ctx.moveTo(
        capX + Math.cos(ventAngle) * ventInnerR,
        Math.sin(ventAngle) * ventInnerR
      );
      ctx.lineTo(
        capX + Math.cos(ventAngle) * ventOuterR,
        Math.sin(ventAngle) * ventOuterR
      );
      ctx.stroke();
    }
  }

  ctx.restore();
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
    ctx.fillStyle = '#1a1a20';
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
    boltGradient.addColorStop(0, '#7a7a80');
    boltGradient.addColorStop(1, '#5a5a60');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(bx, by, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTacticalMarkings(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  radius: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  // Small tactical hash marks around the base
  ctx.strokeStyle = colors.accent;
  ctx.lineWidth = 0.5;

  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2;
    const innerR = radius * 0.9;
    const outerR = radius * 0.98;

    ctx.beginPath();
    ctx.moveTo(centerX + Math.cos(angle) * innerR, centerY + Math.sin(angle) * innerR);
    ctx.lineTo(centerX + Math.cos(angle) * outerR, centerY + Math.sin(angle) * outerR);
    ctx.stroke();
  }

  // Warning stripe on one side
  ctx.strokeStyle = '#cc8800';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius * 0.92, -0.3, 0.3);
  ctx.stroke();
}

function drawStatusIndicators(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number,
  colors: typeof LEVEL_COLORS[0]
): void {
  const baseRadius = cellSize * 0.38;
  const indicatorRadius = baseRadius * (0.05 + level * 0.008);
  const indicatorDistance = baseRadius * 0.55;

  // Status indicators - ammo/ready lights
  const indicatorCount = 2 + Math.floor(level / 2);

  for (let i = 0; i < indicatorCount; i++) {
    const angle = Math.PI + (i / (indicatorCount - 1)) * Math.PI * 0.6 - Math.PI * 0.3;
    const ix = centerX + Math.cos(angle) * indicatorDistance;
    const iy = centerY + Math.sin(angle) * indicatorDistance;

    // Rapid blink for ready status
    const blinkSpeed = 2 + level * 0.5;
    const blinkPhase = (time * blinkSpeed / 1000 + i * 0.3) % 1;
    const isOn = blinkPhase < 0.7;

    // Housing
    ctx.fillStyle = '#1a1a20';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Light - orange/amber for gatling
    ctx.fillStyle = isOn ? '#ffaa33' : '#332200';
    ctx.beginPath();
    ctx.arc(ix, iy, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glow when on
    if (isOn) {
      ctx.fillStyle = colors.glow;
      ctx.beginPath();
      ctx.arc(ix, iy, indicatorRadius * (1.5 + level * 0.1), 0, Math.PI * 2);
      ctx.fill();
    }
  }
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
  const pulseSpeed = 1.5 + level * 0.3;
  const baseSize = cellSize * (0.35 + (level - 3) * 0.04);
  const pulseSize = baseSize + Math.sin(time * pulseSpeed / 1000) * cellSize * 0.02;
  const intensity = 0.06 + (level - 3) * 0.03;

  const glowGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, pulseSize);
  glowGradient.addColorStop(0, `rgba(255, 180, 100, ${intensity})`);
  glowGradient.addColorStop(0.5, `rgba(255, 150, 80, ${intensity * 0.5})`);
  glowGradient.addColorStop(1, 'rgba(255, 120, 50, 0)');

  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, pulseSize, 0, Math.PI * 2);
  ctx.fill();
}

export default GatlingTowerSprite;
