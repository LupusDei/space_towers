// Missile Battery Sprite - Sleek metallic multi-launcher with 5 visual tiers

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const MissileBatterySprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level, 1), 5);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Base platform with metallic finish (scales with level)
    drawMetallicBase(ctx, centerX, centerY, cellSize, level);

    // Sleek launcher housing (varies by level)
    drawLauncherHousing(ctx, centerX, centerY, cellSize, time, level);

    // Status indicators (more at higher levels)
    drawStatusIndicators(ctx, centerX, centerY, cellSize, time, false, level);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = Math.min(Math.max(tower.level, 1), 5);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Calculate angle to target
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;
    const angle = Math.atan2(targetY - centerY, targetX - centerX);

    // Draw base platform
    drawMetallicBase(ctx, centerX, centerY, cellSize, level);

    // Draw launcher with firing effects
    drawLauncherHousingFiring(ctx, centerX, centerY, cellSize, time, angle, level);

    // Launch effects
    drawLaunchEffects(ctx, centerX, centerY, cellSize, time, angle, level);

    // Status indicators (alert mode)
    drawStatusIndicators(ctx, centerX, centerY, cellSize, time, true, level);
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.15 : 0.08;
    const strokeAlpha = isSelected ? 0.5 : 0.3;

    // Range circle fill (orange tint for missiles)
    ctx.fillStyle = `rgba(255, 120, 50, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(255, 120, 50, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

// Get tube configuration based on level
function getTubeConfig(level: number): { rows: number; cols: number; spacing: number } {
  switch (level) {
    case 1:
      return { rows: 2, cols: 2, spacing: 0.1 }; // 4 tubes
    case 2:
      return { rows: 2, cols: 2, spacing: 0.1 }; // 4 tubes, enhanced
    case 3:
      return { rows: 2, cols: 3, spacing: 0.085 }; // 6 tubes
    case 4:
      return { rows: 2, cols: 4, spacing: 0.07 }; // 8 tubes
    case 5:
      return { rows: 3, cols: 3, spacing: 0.08 }; // 9 tubes
    default:
      return { rows: 2, cols: 2, spacing: 0.1 };
  }
}

function drawMetallicBase(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  level: number
): void {
  // Base radius increases slightly with level
  const baseRadius = cellSize * (0.36 + level * 0.008);

  // Level 5: Add outer glow ring
  if (level >= 5) {
    const glowGradient = ctx.createRadialGradient(
      centerX, centerY, baseRadius * 0.9,
      centerX, centerY, baseRadius * 1.3
    );
    glowGradient.addColorStop(0, 'rgba(255, 100, 50, 0.2)');
    glowGradient.addColorStop(1, 'rgba(255, 80, 30, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer ring with metallic gradient (more polished at higher levels)
  const outerGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );

  // Color intensity based on level
  outerGradient.addColorStop(0, `hsl(240, 5%, ${35 + level * 3}%)`);
  outerGradient.addColorStop(0.4, `hsl(240, 5%, ${25 + level * 2}%)`);
  outerGradient.addColorStop(0.8, `hsl(240, 5%, ${18 + level * 2}%)`);
  outerGradient.addColorStop(1, `hsl(240, 5%, ${12 + level}%)`);

  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Metallic rim highlight (brighter at higher levels)
  ctx.strokeStyle = `hsl(240, 5%, ${45 + level * 4}%)`;
  ctx.lineWidth = 1 + level * 0.2;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius - 1, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();

  // Inner platform with brushed metal texture
  const innerRadius = baseRadius * 0.75;
  const innerGradient = ctx.createLinearGradient(
    centerX - innerRadius,
    centerY - innerRadius,
    centerX + innerRadius,
    centerY + innerRadius
  );
  innerGradient.addColorStop(0, `hsl(240, 5%, ${32 + level * 2}%)`);
  innerGradient.addColorStop(0.3, `hsl(240, 5%, ${24 + level * 2}%)`);
  innerGradient.addColorStop(0.5, `hsl(240, 5%, ${29 + level * 2}%)`);
  innerGradient.addColorStop(0.7, `hsl(240, 5%, ${24 + level * 2}%)`);
  innerGradient.addColorStop(1, `hsl(240, 5%, ${32 + level * 2}%)`);

  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // Panel line details (more rings at higher levels)
  ctx.strokeStyle = `hsl(240, 5%, ${18 + level}%)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  if (level >= 3) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius * 0.6, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Mounting bolts (more at higher levels)
  const boltCount = 4 + level;
  const boltRadius = cellSize * (0.012 + level * 0.001);
  const boltDistance = baseRadius * 0.88;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const boltX = centerX + Math.cos(angle) * boltDistance;
    const boltY = centerY + Math.sin(angle) * boltDistance;

    // Bolt recess
    ctx.fillStyle = `hsl(240, 5%, ${12 + level}%)`;
    ctx.beginPath();
    ctx.arc(boltX, boltY, boltRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Bolt head with highlight
    const boltGradient = ctx.createRadialGradient(
      boltX - boltRadius * 0.3,
      boltY - boltRadius * 0.3,
      0,
      boltX,
      boltY,
      boltRadius
    );
    boltGradient.addColorStop(0, `hsl(240, 5%, ${45 + level * 3}%)`);
    boltGradient.addColorStop(1, `hsl(240, 5%, ${25 + level * 2}%)`);
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(boltX, boltY, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Level 4+: Add accent lights on base
  if (level >= 4) {
    const accentCount = level >= 5 ? 8 : 4;
    const accentDistance = baseRadius * 0.65;
    for (let i = 0; i < accentCount; i++) {
      const angle = (i / accentCount) * Math.PI * 2 + Math.PI / accentCount;
      const accentX = centerX + Math.cos(angle) * accentDistance;
      const accentY = centerY + Math.sin(angle) * accentDistance;

      ctx.fillStyle = level >= 5 ? 'rgba(255, 120, 60, 0.6)' : 'rgba(255, 150, 80, 0.4)';
      ctx.beginPath();
      ctx.arc(accentX, accentY, cellSize * 0.015, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawLauncherHousing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  level: number
): void {
  const config = getTubeConfig(level);
  const housingWidth = cellSize * (0.24 + config.cols * 0.04);
  const housingHeight = cellSize * (0.24 + config.rows * 0.04);
  const tubeRadius = cellSize * (0.055 + level * 0.003);

  // Main housing with beveled metallic look
  ctx.save();

  // Housing shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(
    centerX - housingWidth + 2,
    centerY - housingHeight + 2,
    housingWidth * 2,
    housingHeight * 2
  );

  // Housing body with metallic gradient (more polished at higher levels)
  const housingGradient = ctx.createLinearGradient(
    centerX - housingWidth,
    centerY - housingHeight,
    centerX + housingWidth,
    centerY + housingHeight
  );
  housingGradient.addColorStop(0, `hsl(240, 5%, ${38 + level * 2}%)`);
  housingGradient.addColorStop(0.2, `hsl(240, 5%, ${32 + level * 2}%)`);
  housingGradient.addColorStop(0.5, `hsl(240, 5%, ${26 + level * 2}%)`);
  housingGradient.addColorStop(0.8, `hsl(240, 5%, ${32 + level * 2}%)`);
  housingGradient.addColorStop(1, `hsl(240, 5%, ${38 + level * 2}%)`);

  ctx.fillStyle = housingGradient;
  ctx.fillRect(centerX - housingWidth, centerY - housingHeight, housingWidth * 2, housingHeight * 2);

  // Top edge highlight
  ctx.strokeStyle = `hsl(240, 5%, ${50 + level * 3}%)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - housingWidth, centerY - housingHeight);
  ctx.lineTo(centerX + housingWidth, centerY - housingHeight);
  ctx.stroke();

  // Left edge highlight
  ctx.beginPath();
  ctx.moveTo(centerX - housingWidth, centerY - housingHeight);
  ctx.lineTo(centerX - housingWidth, centerY + housingHeight);
  ctx.stroke();

  // Bottom/right shadow edge
  ctx.strokeStyle = `hsl(240, 5%, ${18 + level}%)`;
  ctx.beginPath();
  ctx.moveTo(centerX + housingWidth, centerY - housingHeight);
  ctx.lineTo(centerX + housingWidth, centerY + housingHeight);
  ctx.lineTo(centerX - housingWidth, centerY + housingHeight);
  ctx.stroke();

  // Panel line details
  ctx.strokeStyle = `hsl(240, 5%, ${18 + level}%)`;
  ctx.lineWidth = 0.5;

  // Horizontal lines
  if (level >= 2) {
    ctx.beginPath();
    ctx.moveTo(centerX - housingWidth * 0.9, centerY);
    ctx.lineTo(centerX + housingWidth * 0.9, centerY);
    ctx.stroke();
  }

  // Vertical lines (more at higher levels)
  if (level >= 3) {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - housingHeight * 0.9);
    ctx.lineTo(centerX, centerY + housingHeight * 0.9);
    ctx.stroke();
  }

  // Level 4+: Corner reinforcement plates
  if (level >= 4) {
    const plateSize = cellSize * 0.04;
    const corners = [
      { x: -housingWidth + plateSize, y: -housingHeight + plateSize },
      { x: housingWidth - plateSize, y: -housingHeight + plateSize },
      { x: -housingWidth + plateSize, y: housingHeight - plateSize },
      { x: housingWidth - plateSize, y: housingHeight - plateSize },
    ];

    for (const corner of corners) {
      ctx.fillStyle = `hsl(240, 5%, ${35 + level * 2}%)`;
      ctx.beginPath();
      ctx.arc(centerX + corner.x, centerY + corner.y, plateSize * 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `hsl(240, 5%, ${45 + level * 2}%)`;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.arc(centerX + corner.x, centerY + corner.y, plateSize * 0.8, Math.PI, Math.PI * 1.5);
      ctx.stroke();
    }
  }

  ctx.restore();

  // Draw missile tubes in grid
  const tubePositions = getTubePositions(config, cellSize);

  for (const pos of tubePositions) {
    const tubeX = centerX + pos.x;
    const tubeY = centerY + pos.y;
    drawMissileTube(ctx, tubeX, tubeY, tubeRadius, false, 0, level);
  }

  // Central targeting sensor (more advanced at higher levels)
  drawTargetingSensor(ctx, centerX, centerY, cellSize, time, false, level);
}

function getTubePositions(
  config: { rows: number; cols: number; spacing: number },
  cellSize: number
): { x: number; y: number }[] {
  const positions: { x: number; y: number }[] = [];
  const spacing = cellSize * config.spacing;

  const startX = -((config.cols - 1) / 2) * spacing;
  const startY = -((config.rows - 1) / 2) * spacing;

  for (let row = 0; row < config.rows; row++) {
    for (let col = 0; col < config.cols; col++) {
      positions.push({
        x: startX + col * spacing,
        y: startY + row * spacing,
      });
    }
  }

  return positions;
}

function drawMissileTube(
  ctx: CanvasRenderingContext2D,
  tubeX: number,
  tubeY: number,
  tubeRadius: number,
  isFiring: boolean,
  flashIntensity: number = 0,
  level: number = 1
): void {
  // Tube outer ring with metallic gradient
  const outerGradient = ctx.createRadialGradient(
    tubeX - tubeRadius * 0.3,
    tubeY - tubeRadius * 0.3,
    0,
    tubeX,
    tubeY,
    tubeRadius * 1.4
  );
  outerGradient.addColorStop(0, `hsl(240, 5%, ${38 + level * 3}%)`);
  outerGradient.addColorStop(0.5, `hsl(240, 5%, ${26 + level * 2}%)`);
  outerGradient.addColorStop(1, `hsl(240, 5%, ${18 + level}%)`);

  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(tubeX, tubeY, tubeRadius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Tube rim highlight
  ctx.strokeStyle = `hsl(240, 5%, ${45 + level * 3}%)`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(tubeX, tubeY, tubeRadius * 1.35, Math.PI * 1.2, Math.PI * 1.8);
  ctx.stroke();

  // Tube interior
  if (isFiring) {
    // Muzzle flash gradient
    const flashGradient = ctx.createRadialGradient(tubeX, tubeY, 0, tubeX, tubeY, tubeRadius);
    flashGradient.addColorStop(0, `rgba(255, 220, 150, ${flashIntensity})`);
    flashGradient.addColorStop(0.4, `rgba(255, 150, 80, ${flashIntensity * 0.7})`);
    flashGradient.addColorStop(1, `rgba(180, 80, 30, ${flashIntensity * 0.3})`);
    ctx.fillStyle = flashGradient;
  } else {
    // Deep shadow interior
    const interiorGradient = ctx.createRadialGradient(
      tubeX + tubeRadius * 0.2,
      tubeY + tubeRadius * 0.2,
      0,
      tubeX,
      tubeY,
      tubeRadius
    );
    interiorGradient.addColorStop(0, '#0a0a12');
    interiorGradient.addColorStop(1, '#151520');
    ctx.fillStyle = interiorGradient;
  }
  ctx.beginPath();
  ctx.arc(tubeX, tubeY, tubeRadius, 0, Math.PI * 2);
  ctx.fill();

  // Missile visible inside tube (only when not firing)
  if (!isFiring) {
    // Missile body gradient (more intense red at higher levels)
    const missileGradient = ctx.createRadialGradient(
      tubeX - tubeRadius * 0.2,
      tubeY - tubeRadius * 0.2,
      0,
      tubeX,
      tubeY,
      tubeRadius * 0.65
    );

    const redIntensity = 180 + level * 15;
    missileGradient.addColorStop(0, `rgb(${redIntensity + 40}, ${55 + level * 5}, ${55 + level * 5})`);
    missileGradient.addColorStop(0.5, `rgb(${redIntensity}, ${35 + level * 3}, ${35 + level * 3})`);
    missileGradient.addColorStop(1, `rgb(${redIntensity - 30}, ${25 + level * 2}, ${25 + level * 2})`);

    ctx.fillStyle = missileGradient;
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Missile tip highlight
    ctx.fillStyle = `rgb(255, ${100 + level * 8}, ${100 + level * 8})`;
    ctx.beginPath();
    ctx.arc(tubeX - tubeRadius * 0.15, tubeY - tubeRadius * 0.15, tubeRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawTargetingSensor(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  alert: boolean,
  level: number
): void {
  const sensorPulse = 0.5 + 0.5 * Math.sin(time * (2 + level * 0.5));
  const sensorRadius = cellSize * (0.02 + level * 0.003);

  // Level 5: Multi-sensor array
  if (level >= 5) {
    const subSensorPositions = [
      { x: -cellSize * 0.06, y: 0 },
      { x: cellSize * 0.06, y: 0 },
      { x: 0, y: -cellSize * 0.06 },
      { x: 0, y: cellSize * 0.06 },
    ];

    for (const pos of subSensorPositions) {
      const subX = centerX + pos.x;
      const subY = centerY + pos.y;

      ctx.fillStyle = '#1a1a22';
      ctx.beginPath();
      ctx.arc(subX, subY, sensorRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = alert
        ? `rgba(255, 80, 80, ${sensorPulse * 0.6})`
        : `rgba(80, 200, 120, ${sensorPulse * 0.5})`;
      ctx.beginPath();
      ctx.arc(subX, subY, sensorRadius * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Main sensor housing
  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Sensor glow
  const glowColor = alert ? '255, 80, 80' : '80, 200, 120';
  ctx.fillStyle = `rgba(${glowColor}, ${sensorPulse * (0.3 + level * 0.05)})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius * (2 + level * 0.3), 0, Math.PI * 2);
  ctx.fill();

  // Sensor core
  const coreColor = alert
    ? `rgba(255, 100, 100, ${0.6 + sensorPulse * 0.4})`
    : `rgba(100, 255, 150, ${0.6 + sensorPulse * 0.4})`;
  ctx.fillStyle = coreColor;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius, 0, Math.PI * 2);
  ctx.fill();

  // Level 3+: Sensor ring
  if (level >= 3) {
    ctx.strokeStyle = alert ? 'rgba(255, 100, 100, 0.5)' : 'rgba(100, 255, 150, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(centerX, centerY, sensorRadius * 1.5, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawLauncherHousingFiring(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  _angle: number,
  level: number
): void {
  const config = getTubeConfig(level);
  const housingWidth = cellSize * (0.24 + config.cols * 0.04);
  const housingHeight = cellSize * (0.24 + config.rows * 0.04);
  const tubeRadius = cellSize * (0.055 + level * 0.003);

  // Housing with same metallic styling
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(
    centerX - housingWidth + 2,
    centerY - housingHeight + 2,
    housingWidth * 2,
    housingHeight * 2
  );

  const housingGradient = ctx.createLinearGradient(
    centerX - housingWidth,
    centerY - housingHeight,
    centerX + housingWidth,
    centerY + housingHeight
  );
  housingGradient.addColorStop(0, `hsl(240, 5%, ${38 + level * 2}%)`);
  housingGradient.addColorStop(0.2, `hsl(240, 5%, ${32 + level * 2}%)`);
  housingGradient.addColorStop(0.5, `hsl(240, 5%, ${26 + level * 2}%)`);
  housingGradient.addColorStop(0.8, `hsl(240, 5%, ${32 + level * 2}%)`);
  housingGradient.addColorStop(1, `hsl(240, 5%, ${38 + level * 2}%)`);

  ctx.fillStyle = housingGradient;
  ctx.fillRect(centerX - housingWidth, centerY - housingHeight, housingWidth * 2, housingHeight * 2);

  // Edge highlights and shadows
  ctx.strokeStyle = `hsl(240, 5%, ${50 + level * 3}%)`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - housingWidth, centerY - housingHeight);
  ctx.lineTo(centerX + housingWidth, centerY - housingHeight);
  ctx.moveTo(centerX - housingWidth, centerY - housingHeight);
  ctx.lineTo(centerX - housingWidth, centerY + housingHeight);
  ctx.stroke();

  ctx.strokeStyle = `hsl(240, 5%, ${18 + level}%)`;
  ctx.beginPath();
  ctx.moveTo(centerX + housingWidth, centerY - housingHeight);
  ctx.lineTo(centerX + housingWidth, centerY + housingHeight);
  ctx.lineTo(centerX - housingWidth, centerY + housingHeight);
  ctx.stroke();

  ctx.restore();

  // Determine which tube is firing
  const tubePositions = getTubePositions(config, cellSize);
  const firingTube = Math.floor(time * (2 + level * 0.5)) % tubePositions.length;
  const flashIntensity = 0.6 + 0.4 * Math.sin(time * 50);

  for (let i = 0; i < tubePositions.length; i++) {
    const pos = tubePositions[i];
    const tubeX = centerX + pos.x;
    const tubeY = centerY + pos.y;
    const isFiring = i === firingTube;

    drawMissileTube(ctx, tubeX, tubeY, tubeRadius, isFiring, flashIntensity, level);
  }

  // Central sensor (alert red when firing)
  drawTargetingSensor(ctx, centerX, centerY, cellSize, time, true, level);
}

function drawLaunchEffects(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  angle: number,
  level: number
): void {
  const config = getTubeConfig(level);
  const tubePositions = getTubePositions(config, cellSize);
  const firingTube = Math.floor(time * (2 + level * 0.5)) % tubePositions.length;

  const firingPos = tubePositions[firingTube];
  const tubeX = centerX + firingPos.x;
  const tubeY = centerY + firingPos.y;

  // Smoke trail from firing tube (more smoke at higher levels)
  const smokeCount = 4 + level;
  for (let i = 0; i < smokeCount; i++) {
    const smokeOffset = (time * 2.5 + i * 0.25) % 1;
    const smokeX = tubeX + Math.cos(angle + Math.PI) * smokeOffset * cellSize * 0.25;
    const smokeY = tubeY + Math.sin(angle + Math.PI) * smokeOffset * cellSize * 0.25;
    const smokeAlpha = (0.3 + level * 0.02) * (1 - smokeOffset);
    const smokeSize = cellSize * (0.02 + level * 0.003) + smokeOffset * cellSize * 0.05;

    const spreadX = Math.sin(time * 12 + i * 2.5) * cellSize * 0.015;
    const spreadY = Math.cos(time * 12 + i * 2.5) * cellSize * 0.015;

    ctx.fillStyle = `rgba(140, 140, 150, ${smokeAlpha})`;
    ctx.beginPath();
    ctx.arc(smokeX + spreadX, smokeY + spreadY, smokeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Launch flash (bigger at higher levels)
  const flashIntensity = 0.7 + 0.3 * Math.sin(time * 45);
  const flashX = tubeX + Math.cos(angle) * cellSize * 0.08;
  const flashY = tubeY + Math.sin(angle) * cellSize * 0.08;
  const flashSize = cellSize * (0.1 + level * 0.01);

  const flashGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize);
  flashGradient.addColorStop(0, `rgba(255, 230, 180, ${flashIntensity})`);
  flashGradient.addColorStop(0.4, `rgba(255, 160, 80, ${flashIntensity * 0.6})`);
  flashGradient.addColorStop(1, 'rgba(255, 100, 40, 0)');

  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
  ctx.fill();
}

function drawStatusIndicators(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  alert: boolean = false,
  level: number = 1
): void {
  const indicatorRadius = cellSize * (0.015 + level * 0.001);
  const indicatorDistance = cellSize * (0.33 + level * 0.01);

  // Indicator count increases with level
  const indicatorCount = Math.min(4 + level, 8);

  for (let i = 0; i < indicatorCount; i++) {
    const angle = (i / indicatorCount) * Math.PI * 2 + Math.PI / 4;
    const indX = centerX + Math.cos(angle) * indicatorDistance;
    const indY = centerY + Math.sin(angle) * indicatorDistance;

    // Staggered blink pattern (faster at higher levels)
    const blinkPhase = (time * (2 + level * 0.3) + i * 0.4) % 2;
    const isOn = blinkPhase < 1.4;

    // Indicator housing
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.arc(indX, indY, indicatorRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (alert) {
      // Red alert mode
      ctx.fillStyle = isOn ? `rgb(255, ${60 + level * 5}, ${60 + level * 5})` : '#3a1515';
      if (isOn) {
        ctx.fillStyle = `rgba(255, 70, 70, ${0.2 + level * 0.02})`;
        ctx.beginPath();
        ctx.arc(indX, indY, indicatorRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(255, ${60 + level * 5}, ${60 + level * 5})`;
      }
    } else {
      // Normal green mode (brighter at higher levels)
      ctx.fillStyle = isOn ? `rgb(${60 + level * 8}, 255, ${70 + level * 8})` : '#153a18';
      if (isOn) {
        ctx.fillStyle = `rgba(70, 255, 85, ${0.15 + level * 0.02})`;
        ctx.beginPath();
        ctx.arc(indX, indY, indicatorRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgb(${60 + level * 8}, 255, ${70 + level * 8})`;
      }
    }

    ctx.beginPath();
    ctx.arc(indX, indY, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default MissileBatterySprite;
