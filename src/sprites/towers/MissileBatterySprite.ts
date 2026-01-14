// Missile Battery Sprite - Multi-launcher rack with military/industrial aesthetic

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

export const MissileBatterySprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Base platform (military dark gray with hazard stripes)
    drawBasePlatform(ctx, centerX, centerY, cellSize);

    // Launcher rack (2x2 missile tubes)
    drawLauncherRack(ctx, centerX, centerY, cellSize, time);

    // Status lights
    drawStatusLights(ctx, centerX, centerY, cellSize, time);
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;

    // Calculate angle to target for launcher orientation
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;
    const angle = Math.atan2(targetY - centerY, targetX - centerX);

    // Draw base platform
    drawBasePlatform(ctx, centerX, centerY, cellSize);

    // Draw launcher rack with firing effects
    drawLauncherRackFiring(ctx, centerX, centerY, cellSize, time, angle);

    // Muzzle flash and smoke
    drawLaunchEffects(ctx, centerX, centerY, cellSize, time, angle);

    // Status lights (red when firing)
    drawStatusLights(ctx, centerX, centerY, cellSize, time, true);
  },

  drawRange(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range * cellSize;

    // Range circle fill (orange tint for missiles)
    ctx.fillStyle = 'rgba(255, 120, 50, 0.1)';
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = 'rgba(255, 120, 50, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawBasePlatform(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number
): void {
  const baseRadius = cellSize * 0.38;

  // Main base (dark industrial gray)
  ctx.fillStyle = '#2a2a2e';
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Base edge highlight
  ctx.strokeStyle = '#3a3a3e';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hazard stripes around edge
  const stripeCount = 8;
  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
  ctx.clip();

  for (let i = 0; i < stripeCount; i++) {
    const angle = (i / stripeCount) * Math.PI * 2;
    const stripeWidth = (Math.PI * 2) / (stripeCount * 2);

    if (i % 2 === 0) {
      ctx.fillStyle = '#4a4a20';
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, baseRadius, angle, angle + stripeWidth);
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();

  // Inner ring
  ctx.strokeStyle = '#4a4a4e';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(centerX, centerY, baseRadius * 0.7, 0, Math.PI * 2);
  ctx.stroke();
}

function drawLauncherRack(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number
): void {
  const tubeRadius = cellSize * 0.08;
  const tubeSpacing = cellSize * 0.12;
  const rackSize = cellSize * 0.25;

  // Launcher housing (dark metal box)
  ctx.fillStyle = '#3a3a40';
  ctx.fillRect(centerX - rackSize, centerY - rackSize, rackSize * 2, rackSize * 2);

  // Housing border
  ctx.strokeStyle = '#5a5a60';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - rackSize, centerY - rackSize, rackSize * 2, rackSize * 2);

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

    // Tube outer ring (dark metal)
    ctx.fillStyle = '#2a2a30';
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Tube interior (deep shadow)
    ctx.fillStyle = '#0a0a10';
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Missile visible inside tube (red nose cone)
    ctx.fillStyle = '#aa3030';
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Highlight on missile tip
    ctx.fillStyle = '#cc5050';
    ctx.beginPath();
    ctx.arc(tubeX - tubeRadius * 0.2, tubeY - tubeRadius * 0.2, tubeRadius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central targeting sensor
  const sensorPulse = 0.6 + 0.4 * Math.sin(time * 2);
  ctx.fillStyle = `rgba(100, 200, 100, ${sensorPulse})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.04, 0, Math.PI * 2);
  ctx.fill();
}

function drawLauncherRackFiring(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  _angle: number
): void {
  const tubeRadius = cellSize * 0.08;
  const tubeSpacing = cellSize * 0.12;
  const rackSize = cellSize * 0.25;

  // Launcher housing
  ctx.fillStyle = '#3a3a40';
  ctx.fillRect(centerX - rackSize, centerY - rackSize, rackSize * 2, rackSize * 2);

  ctx.strokeStyle = '#5a5a60';
  ctx.lineWidth = 2;
  ctx.strokeRect(centerX - rackSize, centerY - rackSize, rackSize * 2, rackSize * 2);

  // 2x2 missile tubes - one firing (rotating which tube based on time)
  const tubePositions = [
    { x: -tubeSpacing, y: -tubeSpacing },
    { x: tubeSpacing, y: -tubeSpacing },
    { x: -tubeSpacing, y: tubeSpacing },
    { x: tubeSpacing, y: tubeSpacing },
  ];

  const firingTube = Math.floor(time * 3) % 4;

  for (let i = 0; i < tubePositions.length; i++) {
    const pos = tubePositions[i];
    const tubeX = centerX + pos.x;
    const tubeY = centerY + pos.y;
    const isFiring = i === firingTube;

    // Tube outer ring
    ctx.fillStyle = isFiring ? '#4a3a30' : '#2a2a30';
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Tube interior
    if (isFiring) {
      // Muzzle flash inside tube
      const flashIntensity = 0.5 + 0.5 * Math.sin(time * 50);
      const flashGradient = ctx.createRadialGradient(tubeX, tubeY, 0, tubeX, tubeY, tubeRadius);
      flashGradient.addColorStop(0, `rgba(255, 200, 100, ${flashIntensity})`);
      flashGradient.addColorStop(0.5, `rgba(255, 150, 50, ${flashIntensity * 0.5})`);
      flashGradient.addColorStop(1, 'rgba(100, 50, 20, 0.3)');
      ctx.fillStyle = flashGradient;
    } else {
      ctx.fillStyle = '#0a0a10';
    }
    ctx.beginPath();
    ctx.arc(tubeX, tubeY, tubeRadius, 0, Math.PI * 2);
    ctx.fill();

    // Missile visible (only in non-firing tubes)
    if (!isFiring) {
      ctx.fillStyle = '#aa3030';
      ctx.beginPath();
      ctx.arc(tubeX, tubeY, tubeRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#cc5050';
      ctx.beginPath();
      ctx.arc(
        tubeX - tubeRadius * 0.2,
        tubeY - tubeRadius * 0.2,
        tubeRadius * 0.25,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }

  // Central sensor (red when firing)
  const sensorPulse = 0.6 + 0.4 * Math.sin(time * 10);
  ctx.fillStyle = `rgba(255, 100, 100, ${sensorPulse})`;
  ctx.beginPath();
  ctx.arc(centerX, centerY, cellSize * 0.04, 0, Math.PI * 2);
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
  const tubeSpacing = cellSize * 0.12;
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

  // Smoke exhaust from firing tube
  const smokeCount = 6;
  for (let i = 0; i < smokeCount; i++) {
    const smokeOffset = (time * 2 + i * 0.3) % 1;
    const smokeX = tubeX + Math.cos(angle + Math.PI) * smokeOffset * cellSize * 0.3;
    const smokeY = tubeY + Math.sin(angle + Math.PI) * smokeOffset * cellSize * 0.3;
    const smokeAlpha = 0.4 * (1 - smokeOffset);
    const smokeSize = cellSize * 0.03 + smokeOffset * cellSize * 0.06;

    // Add slight random spread
    const spreadX = Math.sin(time * 10 + i * 2) * cellSize * 0.02;
    const spreadY = Math.cos(time * 10 + i * 2) * cellSize * 0.02;

    ctx.fillStyle = `rgba(150, 150, 160, ${smokeAlpha})`;
    ctx.beginPath();
    ctx.arc(smokeX + spreadX, smokeY + spreadY, smokeSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Launch flash in direction of target
  const flashIntensity = 0.7 + 0.3 * Math.sin(time * 40);
  const flashX = tubeX + Math.cos(angle) * cellSize * 0.1;
  const flashY = tubeY + Math.sin(angle) * cellSize * 0.1;

  const flashGradient = ctx.createRadialGradient(
    flashX,
    flashY,
    0,
    flashX,
    flashY,
    cellSize * 0.15
  );
  flashGradient.addColorStop(0, `rgba(255, 220, 150, ${flashIntensity})`);
  flashGradient.addColorStop(0.5, `rgba(255, 150, 50, ${flashIntensity * 0.5})`);
  flashGradient.addColorStop(1, 'rgba(255, 100, 30, 0)');

  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(flashX, flashY, cellSize * 0.15, 0, Math.PI * 2);
  ctx.fill();
}

function drawStatusLights(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  time: number,
  firing: boolean = false
): void {
  const lightRadius = cellSize * 0.02;
  const lightDistance = cellSize * 0.32;

  // Four status lights at corners
  const lightPositions = [
    { angle: Math.PI * 0.25 },
    { angle: Math.PI * 0.75 },
    { angle: Math.PI * 1.25 },
    { angle: Math.PI * 1.75 },
  ];

  for (let i = 0; i < lightPositions.length; i++) {
    const { angle } = lightPositions[i];
    const lightX = centerX + Math.cos(angle) * lightDistance;
    const lightY = centerY + Math.sin(angle) * lightDistance;

    // Blink pattern
    const blinkPhase = (time * 2 + i * 0.5) % 2;
    const isOn = blinkPhase < 1.5;

    if (firing) {
      // Red lights when firing
      ctx.fillStyle = isOn ? '#ff4040' : '#401010';
    } else {
      // Green lights when idle
      ctx.fillStyle = isOn ? '#40ff40' : '#104010';
    }

    ctx.beginPath();
    ctx.arc(lightX, lightY, lightRadius, 0, Math.PI * 2);
    ctx.fill();

    // Glow effect when on
    if (isOn) {
      const glowColor = firing ? 'rgba(255, 64, 64, 0.3)' : 'rgba(64, 255, 64, 0.3)';
      ctx.fillStyle = glowColor;
      ctx.beginPath();
      ctx.arc(lightX, lightY, lightRadius * 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

export default MissileBatterySprite;
