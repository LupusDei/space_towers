// Missile Battery Sprite - Sleek metallic multi-launcher with textured detail

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const MissileBatterySprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Base platform with metallic finish
    drawMetallicBase(ctx, centerX, centerY, cellSize);

    // Sleek launcher housing
    drawLauncherHousing(ctx, centerX, centerY, cellSize, time);

    // Status indicators
    drawStatusIndicators(ctx, centerX, centerY, cellSize, time);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Calculate angle to target
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;
    const angle = Math.atan2(targetY - centerY, targetX - centerX);

    // Draw base platform
    drawMetallicBase(ctx, centerX, centerY, cellSize);

    // Draw launcher with firing effects
    drawLauncherHousingFiring(ctx, centerX, centerY, cellSize, time, angle);

    // Launch effects
    drawLaunchEffects(ctx, centerX, centerY, cellSize, time, angle);

    // Status indicators (alert mode)
    drawStatusIndicators(ctx, centerX, centerY, cellSize, time, true);
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

function drawMetallicBase(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number
): void {
  const baseRadius = cellSize * 0.4;

  // Outer ring with metallic gradient
  const outerGradient = ctx.createRadialGradient(
    centerX - baseRadius * 0.3,
    centerY - baseRadius * 0.3,
    0,
    centerX,
    centerY,
    baseRadius
  );
  outerGradient.addColorStop(0, '#5a5a65');
  outerGradient.addColorStop(0.4, '#3a3a42');
  outerGradient.addColorStop(0.8, '#2a2a30');
  outerGradient.addColorStop(1, '#1a1a20');

  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Metallic rim highlight
  ctx.strokeStyle = '#6a6a75';
  ctx.lineWidth = 1.5;
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
  innerGradient.addColorStop(0, '#4a4a52');
  innerGradient.addColorStop(0.3, '#3a3a42');
  innerGradient.addColorStop(0.5, '#454550');
  innerGradient.addColorStop(0.7, '#3a3a42');
  innerGradient.addColorStop(1, '#4a4a52');

  ctx.fillStyle = innerGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
  ctx.fill();

  // Panel line details (concentric rings)
  ctx.strokeStyle = '#2a2a30';
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.arc(centerX, centerY, innerRadius * 0.85, 0, Math.PI * 2);
  ctx.stroke();

  // Mounting bolts
  const boltCount = 6;
  const boltRadius = cellSize * 0.015;
  const boltDistance = baseRadius * 0.88;

  for (let i = 0; i < boltCount; i++) {
    const angle = (i / boltCount) * Math.PI * 2;
    const boltX = centerX + Math.cos(angle) * boltDistance;
    const boltY = centerY + Math.sin(angle) * boltDistance;

    // Bolt recess
    ctx.fillStyle = '#1a1a20';
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
    boltGradient.addColorStop(0, '#6a6a72');
    boltGradient.addColorStop(1, '#3a3a42');
    ctx.fillStyle = boltGradient;
    ctx.beginPath();
    ctx.arc(boltX, boltY, boltRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLauncherHousing(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number
): void {
  const housingSize = cellSize * 0.28;
  const tubeRadius = cellSize * 0.065;
  const tubeSpacing = cellSize * 0.1;

  // Main housing with beveled metallic look
  ctx.save();

  // Housing shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(
    centerX - housingSize + 2,
    centerY - housingSize + 2,
    housingSize * 2,
    housingSize * 2
  );

  // Housing body with metallic gradient
  const housingGradient = ctx.createLinearGradient(
    centerX - housingSize,
    centerY - housingSize,
    centerX + housingSize,
    centerY + housingSize
  );
  housingGradient.addColorStop(0, '#5a5a62');
  housingGradient.addColorStop(0.2, '#4a4a52');
  housingGradient.addColorStop(0.5, '#3a3a42');
  housingGradient.addColorStop(0.8, '#4a4a52');
  housingGradient.addColorStop(1, '#5a5a62');

  ctx.fillStyle = housingGradient;
  ctx.fillRect(centerX - housingSize, centerY - housingSize, housingSize * 2, housingSize * 2);

  // Top edge highlight
  ctx.strokeStyle = '#7a7a85';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - housingSize, centerY - housingSize);
  ctx.lineTo(centerX + housingSize, centerY - housingSize);
  ctx.stroke();

  // Left edge highlight
  ctx.beginPath();
  ctx.moveTo(centerX - housingSize, centerY - housingSize);
  ctx.lineTo(centerX - housingSize, centerY + housingSize);
  ctx.stroke();

  // Bottom/right shadow edge
  ctx.strokeStyle = '#2a2a30';
  ctx.beginPath();
  ctx.moveTo(centerX + housingSize, centerY - housingSize);
  ctx.lineTo(centerX + housingSize, centerY + housingSize);
  ctx.lineTo(centerX - housingSize, centerY + housingSize);
  ctx.stroke();

  // Panel line details
  ctx.strokeStyle = '#2a2a32';
  ctx.lineWidth = 0.5;
  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - housingSize * 0.9, centerY);
  ctx.lineTo(centerX + housingSize * 0.9, centerY);
  ctx.stroke();
  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - housingSize * 0.9);
  ctx.lineTo(centerX, centerY + housingSize * 0.9);
  ctx.stroke();

  ctx.restore();

  // 2x2 missile tube arrangement
  const tubePositions = [
    { x: -tubeSpacing, y: -tubeSpacing },
    { x: tubeSpacing, y: -tubeSpacing },
    { x: -tubeSpacing, y: tubeSpacing },
    { x: tubeSpacing, y: tubeSpacing },
  ];

  for (const pos of tubePositions) {
    const tubeX = centerX + pos.x;
    const tubeY = centerY + pos.y;

    drawMissileTube(ctx, tubeX, tubeY, tubeRadius, false);
  }

  // Central targeting sensor with pulsing glow
  const sensorPulse = 0.5 + 0.5 * Math.sin(time * 3);
  const sensorRadius = cellSize * 0.025;

  // Sensor housing
  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Sensor glow
  ctx.fillStyle = `rgba(80, 200, 120, ${sensorPulse * 0.4})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Sensor core
  ctx.fillStyle = `rgba(100, 255, 150, ${0.6 + sensorPulse * 0.4})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawMissileTube(
  ctx: CanvasRenderingContext2D,
  tubeX: number,
  tubeY: number,
  tubeRadius: number,
  isFiring: boolean,
  flashIntensity: number = 0
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
  outerGradient.addColorStop(0, '#5a5a65');
  outerGradient.addColorStop(0.5, '#3a3a42');
  outerGradient.addColorStop(1, '#2a2a30');

  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(tubeX, tubeY, tubeRadius * 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Tube rim highlight
  ctx.strokeStyle = '#6a6a72';
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
    // Missile body gradient
    const missileGradient = ctx.createRadialGradient(
      tubeX - tubeRadius * 0.2,
      tubeY - tubeRadius * 0.2,
      0,
      tubeX,
      tubeY,
      tubeRadius * 0.65
    );
    missileGradient.addColorStop(0, '#dd5555');
    missileGradient.addColorStop(0.5, '#bb3535');
    missileGradient.addColorStop(1, '#992525');

    ctx.fillStyle = missileGradient;
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Missile tip highlight
    ctx.fillStyle = '#ff7070';
    ctx.beginPath();
    ctx.arc(tubeX - tubeRadius * 0.15, tubeY - tubeRadius * 0.15, tubeRadius * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLauncherHousingFiring(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  _angle: number
): void {
  const housingSize = cellSize * 0.28;
  const tubeRadius = cellSize * 0.065;
  const tubeSpacing = cellSize * 0.1;

  // Housing with same metallic styling
  ctx.save();

  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.fillRect(
    centerX - housingSize + 2,
    centerY - housingSize + 2,
    housingSize * 2,
    housingSize * 2
  );

  const housingGradient = ctx.createLinearGradient(
    centerX - housingSize,
    centerY - housingSize,
    centerX + housingSize,
    centerY + housingSize
  );
  housingGradient.addColorStop(0, '#5a5a62');
  housingGradient.addColorStop(0.2, '#4a4a52');
  housingGradient.addColorStop(0.5, '#3a3a42');
  housingGradient.addColorStop(0.8, '#4a4a52');
  housingGradient.addColorStop(1, '#5a5a62');

  ctx.fillStyle = housingGradient;
  ctx.fillRect(centerX - housingSize, centerY - housingSize, housingSize * 2, housingSize * 2);

  // Edge highlights and shadows
  ctx.strokeStyle = '#7a7a85';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - housingSize, centerY - housingSize);
  ctx.lineTo(centerX + housingSize, centerY - housingSize);
  ctx.moveTo(centerX - housingSize, centerY - housingSize);
  ctx.lineTo(centerX - housingSize, centerY + housingSize);
  ctx.stroke();

  ctx.strokeStyle = '#2a2a30';
  ctx.beginPath();
  ctx.moveTo(centerX + housingSize, centerY - housingSize);
  ctx.lineTo(centerX + housingSize, centerY + housingSize);
  ctx.lineTo(centerX - housingSize, centerY + housingSize);
  ctx.stroke();

  ctx.restore();

  // Determine which tube is firing
  const firingTube = Math.floor(time * 3) % 4;
  const flashIntensity = 0.6 + 0.4 * Math.sin(time * 50);

  const tubePositions = [
    { x: -tubeSpacing, y: -tubeSpacing },
    { x: tubeSpacing, y: -tubeSpacing },
    { x: -tubeSpacing, y: tubeSpacing },
    { x: tubeSpacing, y: tubeSpacing },
  ];

  for (let i = 0; i < tubePositions.length; i++) {
    const pos = tubePositions[i];
    const tubeX = centerX + pos.x;
    const tubeY = centerY + pos.y;
    const isFiring = i === firingTube;

    drawMissileTube(ctx, tubeX, tubeY, tubeRadius, isFiring, flashIntensity);
  }

  // Central sensor (alert red when firing)
  const sensorPulse = 0.5 + 0.5 * Math.sin(time * 8);
  const sensorRadius = cellSize * 0.025;

  ctx.fillStyle = '#2a2a30';
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius * 1.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 80, 80, ${sensorPulse * 0.5})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = `rgba(255, 100, 100, ${0.7 + sensorPulse * 0.3})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, sensorRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawLaunchEffects(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  angle: number
): void {
  const tubeSpacing = cellSize * 0.1;
  const firingTube = Math.floor(time * 3) % 4;

  const tubePositions = [
    { x: -tubeSpacing, y: -tubeSpacing },
    { x: tubeSpacing, y: -tubeSpacing },
    { x: -tubeSpacing, y: tubeSpacing },
    { x: tubeSpacing, y: tubeSpacing },
  ];

  const firingPos = tubePositions[firingTube];
  const tubeX = centerX + firingPos.x;
  const tubeY = centerY + firingPos.y;

  // Smoke trail from firing tube
  const smokeCount = 5;
  for (let i = 0; i < smokeCount; i++) {
    const smokeOffset = (time * 2.5 + i * 0.25) % 1;
    const smokeX = tubeX + Math.cos(angle + Math.PI) * smokeOffset * cellSize * 0.25;
    const smokeY = tubeY + Math.sin(angle + Math.PI) * smokeOffset * cellSize * 0.25;
    const smokeAlpha = 0.35 * (1 - smokeOffset);
    const smokeSize = cellSize * 0.025 + smokeOffset * cellSize * 0.05;

    const spreadX = Math.sin(time * 12 + i * 2.5) * cellSize * 0.015;
    const spreadY = Math.cos(time * 12 + i * 2.5) * cellSize * 0.015;

    ctx.fillStyle = `rgba(140, 140, 150, ${smokeAlpha})`;
    ctx.beginPath();
    ctx.arc(smokeX + spreadX, smokeY + spreadY, smokeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Launch flash
  const flashIntensity = 0.7 + 0.3 * Math.sin(time * 45);
  const flashX = tubeX + Math.cos(angle) * cellSize * 0.08;
  const flashY = tubeY + Math.sin(angle) * cellSize * 0.08;

  const flashGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, cellSize * 0.12);
  flashGradient.addColorStop(0, `rgba(255, 230, 180, ${flashIntensity})`);
  flashGradient.addColorStop(0.4, `rgba(255, 160, 80, ${flashIntensity * 0.6})`);
  flashGradient.addColorStop(1, 'rgba(255, 100, 40, 0)');

  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(flashX, flashY, cellSize * 0.12, 0, Math.PI * 2);
  ctx.fill();
}

function drawStatusIndicators(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  alert: boolean = false
): void {
  const indicatorRadius = cellSize * 0.018;
  const indicatorDistance = cellSize * 0.35;

  // Four corner indicators
  const positions = [
    { angle: Math.PI * 0.25 },
    { angle: Math.PI * 0.75 },
    { angle: Math.PI * 1.25 },
    { angle: Math.PI * 1.75 },
  ];

  for (let i = 0; i < positions.length; i++) {
    const { angle } = positions[i];
    const indX = centerX + Math.cos(angle) * indicatorDistance;
    const indY = centerY + Math.sin(angle) * indicatorDistance;

    // Staggered blink pattern
    const blinkPhase = (time * 2.5 + i * 0.4) % 2;
    const isOn = blinkPhase < 1.4;

    // Indicator housing
    ctx.fillStyle = '#1a1a22';
    ctx.beginPath();
    ctx.arc(indX, indY, indicatorRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    if (alert) {
      // Red alert mode
      ctx.fillStyle = isOn ? '#ff4545' : '#3a1515';
      if (isOn) {
        ctx.fillStyle = 'rgba(255, 70, 70, 0.25)';
        ctx.beginPath();
        ctx.arc(indX, indY, indicatorRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ff4545';
      }
    } else {
      // Normal green mode
      ctx.fillStyle = isOn ? '#45ff55' : '#153a18';
      if (isOn) {
        ctx.fillStyle = 'rgba(70, 255, 85, 0.2)';
        ctx.beginPath();
        ctx.arc(indX, indY, indicatorRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#45ff55';
      }
    }

    ctx.beginPath();
    ctx.arc(indX, indY, indicatorRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default MissileBatterySprite;
