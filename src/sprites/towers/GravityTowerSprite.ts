// Gravity Tower Sprite - Black hole/singularity visual
// Dark center with swirling accretion disk effect
// Supports 5 visual tiers based on tower level

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    coreRadius: 0.12 + (clampedLevel - 1) * 0.015, // larger core at higher levels
    diskRadius: 0.35 + (clampedLevel - 1) * 0.03, // larger accretion disk
    diskRings: 2 + Math.floor((clampedLevel - 1) / 2), // more rings at higher levels
    rotationSpeed: 0.002 + (clampedLevel - 1) * 0.0005, // faster rotation
    particleCount: 8 + (clampedLevel - 1) * 4, // more particles
    hasEventHorizon: clampedLevel >= 2, // visible event horizon at level 2+
    hasGravityWaves: clampedLevel >= 3, // distortion waves at level 3+
    hasJets: clampedLevel >= 4, // relativistic jets at level 4+
    hasQuantumFlicker: clampedLevel >= 5, // quantum effects at level 5
    glowIntensity: 0.5 + (clampedLevel - 1) * 0.1, // brighter glow
    diskColors: getDiskColors(clampedLevel),
  };
}

function getDiskColors(level: number) {
  // Accretion disk colors progress from orange-red to blue-white at higher levels
  if (level <= 2) {
    return { inner: '#ff6600', mid: '#ff3300', outer: '#990000' };
  } else if (level <= 3) {
    return { inner: '#ff8800', mid: '#ff4400', outer: '#aa2200' };
  } else if (level <= 4) {
    return { inner: '#ffaa44', mid: '#ff6622', outer: '#cc3300' };
  } else {
    return { inner: '#ffffff', mid: '#aaccff', outer: '#6688ff' };
  }
}

export const GravityTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const coreRadius = cellSize * params.coreRadius;
    const diskRadius = cellSize * params.diskRadius;

    // === GRAVITY WAVES (Level 3+) ===
    if (params.hasGravityWaves) {
      const waveCount = 3;
      for (let i = 0; i < waveCount; i++) {
        const wavePhase = (time * 0.001 + (i * Math.PI * 2) / waveCount) % (Math.PI * 2);
        const waveRadius = diskRadius * (1.2 + 0.4 * Math.sin(wavePhase));
        const waveAlpha = 0.1 * (1 - Math.sin(wavePhase) * 0.5) * (level - 2) * 0.3;

        ctx.strokeStyle = `rgba(100, 80, 180, ${waveAlpha})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // === BASE PLATFORM ===
    const baseRadius = cellSize * 0.3;

    // Platform shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + 2,
      centerY + baseRadius * 0.8,
      baseRadius * 1.1,
      baseRadius * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Platform base with dark metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY,
      centerX + baseRadius,
      centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#3a3a4a');
    baseGradient.addColorStop(0.3, '#2a2a3a');
    baseGradient.addColorStop(0.7, '#1a1a2a');
    baseGradient.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = baseGradient;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.6,
      baseRadius,
      baseRadius * 0.3,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Platform rim with purple tint
    ctx.strokeStyle = '#6a5a8a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      centerY + baseRadius * 0.6,
      baseRadius,
      baseRadius * 0.3,
      0,
      Math.PI,
      Math.PI * 2
    );
    ctx.stroke();

    // === RELATIVISTIC JETS (Level 4+) ===
    if (params.hasJets) {
      const jetLength = cellSize * 0.4 * (1 + (level - 4) * 0.2);
      const jetWidth = cellSize * 0.06;
      const jetFlicker = 0.7 + 0.3 * Math.sin(time * 0.008);

      // Upper jet
      const upperJetGradient = ctx.createLinearGradient(
        centerX,
        centerY - coreRadius,
        centerX,
        centerY - coreRadius - jetLength
      );
      upperJetGradient.addColorStop(0, `rgba(180, 140, 255, ${jetFlicker})`);
      upperJetGradient.addColorStop(0.5, `rgba(140, 100, 220, ${jetFlicker * 0.5})`);
      upperJetGradient.addColorStop(1, 'rgba(100, 60, 180, 0)');
      ctx.fillStyle = upperJetGradient;
      ctx.beginPath();
      ctx.moveTo(centerX - jetWidth, centerY - coreRadius);
      ctx.lineTo(centerX, centerY - coreRadius - jetLength);
      ctx.lineTo(centerX + jetWidth, centerY - coreRadius);
      ctx.closePath();
      ctx.fill();

      // Lower jet (smaller)
      const lowerJetGradient = ctx.createLinearGradient(
        centerX,
        centerY + coreRadius,
        centerX,
        centerY + coreRadius + jetLength * 0.6
      );
      lowerJetGradient.addColorStop(0, `rgba(180, 140, 255, ${jetFlicker * 0.6})`);
      lowerJetGradient.addColorStop(0.5, `rgba(140, 100, 220, ${jetFlicker * 0.3})`);
      lowerJetGradient.addColorStop(1, 'rgba(100, 60, 180, 0)');
      ctx.fillStyle = lowerJetGradient;
      ctx.beginPath();
      ctx.moveTo(centerX - jetWidth * 0.7, centerY + coreRadius);
      ctx.lineTo(centerX, centerY + coreRadius + jetLength * 0.6);
      ctx.lineTo(centerX + jetWidth * 0.7, centerY + coreRadius);
      ctx.closePath();
      ctx.fill();
    }

    // === SWIRLING ACCRETION DISK ===
    const rotation = time * params.rotationSpeed;

    // Draw disk rings (back half first for 3D effect)
    for (let ring = params.diskRings - 1; ring >= 0; ring--) {
      const ringT = ring / params.diskRings;
      const ringRadius = coreRadius + (diskRadius - coreRadius) * (1 - ringT * 0.7);
      const ringHeight = ringRadius * 0.25 * (1 - ringT * 0.3);

      // Ring color interpolation
      const colors = params.diskColors;
      const r1 = parseInt(colors.inner.slice(1, 3), 16);
      const g1 = parseInt(colors.inner.slice(3, 5), 16);
      const b1 = parseInt(colors.inner.slice(5, 7), 16);
      const r2 = parseInt(colors.outer.slice(1, 3), 16);
      const g2 = parseInt(colors.outer.slice(3, 5), 16);
      const b2 = parseInt(colors.outer.slice(5, 7), 16);

      const r = Math.floor(r1 + (r2 - r1) * ringT);
      const g = Math.floor(g1 + (g2 - g1) * ringT);
      const b = Math.floor(b1 + (b2 - b1) * ringT);
      const alpha = params.glowIntensity * (1 - ringT * 0.5);

      // Back half of ring
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, ringRadius, ringHeight, rotation, Math.PI, Math.PI * 2);
      ctx.fill();
    }

    // === SWIRLING PARTICLES ===
    for (let i = 0; i < params.particleCount; i++) {
      const particleAngle = rotation + (i * Math.PI * 2) / params.particleCount;
      const particleOrbit = coreRadius + (diskRadius - coreRadius) * (0.3 + 0.6 * ((i % 3) / 3));
      const particleX = centerX + Math.cos(particleAngle) * particleOrbit;
      const particleY = centerY + Math.sin(particleAngle) * particleOrbit * 0.25;
      const particleSize = 2 + (level - 1) * 0.5;

      // Only draw particles on front half
      if (Math.sin(particleAngle) > -0.3) {
        const particleAlpha = 0.6 + 0.4 * Math.sin(particleAngle);
        ctx.fillStyle = `rgba(255, 200, 100, ${particleAlpha})`;
        ctx.beginPath();
        ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // === EVENT HORIZON (Level 2+) ===
    if (params.hasEventHorizon) {
      const horizonGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        coreRadius * 0.5,
        centerX,
        centerY,
        coreRadius * 1.3
      );
      horizonGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      horizonGradient.addColorStop(0.6, 'rgba(60, 40, 100, 0.3)');
      horizonGradient.addColorStop(0.85, 'rgba(100, 60, 160, 0.5)');
      horizonGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = horizonGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius * 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // === DARK SINGULARITY CORE ===
    // Outer glow (purple/violet)
    const outerGlowRadius = coreRadius * 1.8;
    const outerGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      coreRadius,
      centerX,
      centerY,
      outerGlowRadius
    );
    outerGlow.addColorStop(0, `rgba(80, 40, 120, ${params.glowIntensity})`);
    outerGlow.addColorStop(0.5, `rgba(60, 20, 100, ${params.glowIntensity * 0.5})`);
    outerGlow.addColorStop(1, 'rgba(40, 10, 80, 0)');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, outerGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Core - absolute black with sharp edge
    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      coreRadius
    );
    coreGradient.addColorStop(0, '#000000');
    coreGradient.addColorStop(0.7, '#000000');
    coreGradient.addColorStop(0.9, '#0a0515');
    coreGradient.addColorStop(1, '#150a25');
    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // === QUANTUM FLICKER (Level 5) ===
    if (params.hasQuantumFlicker) {
      const flickerPhase = (time * 0.01) % 1;
      if (flickerPhase > 0.85) {
        const flickerRadius = coreRadius * (0.3 + 0.4 * Math.random());
        const flickerAngle = Math.random() * Math.PI * 2;
        const flickerX = centerX + Math.cos(flickerAngle) * flickerRadius;
        const flickerY = centerY + Math.sin(flickerAngle) * flickerRadius;

        ctx.fillStyle = 'rgba(200, 180, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(flickerX, flickerY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw front half of disk rings (for 3D layering)
    for (let ring = 0; ring < params.diskRings; ring++) {
      const ringT = ring / params.diskRings;
      const ringRadius = coreRadius + (diskRadius - coreRadius) * (1 - ringT * 0.7);
      const ringHeight = ringRadius * 0.25 * (1 - ringT * 0.3);

      const colors = params.diskColors;
      const r1 = parseInt(colors.inner.slice(1, 3), 16);
      const g1 = parseInt(colors.inner.slice(3, 5), 16);
      const b1 = parseInt(colors.inner.slice(5, 7), 16);
      const r2 = parseInt(colors.outer.slice(1, 3), 16);
      const g2 = parseInt(colors.outer.slice(3, 5), 16);
      const b2 = parseInt(colors.outer.slice(5, 7), 16);

      const r = Math.floor(r1 + (r2 - r1) * ringT);
      const g = Math.floor(g1 + (g2 - g1) * ringT);
      const b = Math.floor(b1 + (b2 - b1) * ringT);
      const alpha = params.glowIntensity * (1 - ringT * 0.5);

      // Front half of ring
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, ringRadius, ringHeight, rotation, 0, Math.PI);
      ctx.fill();
    }
  },

  drawFiring(context: SpriteRenderContext, tower: Tower, target: Point): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    // Draw base tower first
    this.draw(context, tower);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw gravity pull effect (distortion beam)
    drawGravityBeam(ctx, centerX, centerY, targetX, targetY, time, level, params);

    // Enhanced core glow when firing
    const firingGlowRadius = cellSize * params.coreRadius * 2.5;
    const firingGlow = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      firingGlowRadius
    );
    firingGlow.addColorStop(0, 'rgba(120, 80, 180, 0.8)');
    firingGlow.addColorStop(0.4, 'rgba(80, 40, 140, 0.4)');
    firingGlow.addColorStop(0.7, 'rgba(60, 20, 120, 0.2)');
    firingGlow.addColorStop(1, 'rgba(40, 10, 100, 0)');
    ctx.fillStyle = firingGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, firingGlowRadius, 0, Math.PI * 2);
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

    // Range circle fill (purple tint for gravity)
    ctx.fillStyle = `rgba(120, 80, 180, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(140, 100, 200, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawGravityBeam(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  level: number,
  params: ReturnType<typeof getLevelParams>
): void {
  const dx = endX - startX;
  const dy = endY - startY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);

  // Draw warped space effect (curved lines converging on target)
  const warpLineCount = 6 + level * 2;
  const warpPhase = time * 0.003;

  for (let i = 0; i < warpLineCount; i++) {
    const lineAngle = angle + Math.PI / 2 + ((i / warpLineCount - 0.5) * Math.PI) / 3;
    const offsetDist = distance * 0.3 * (1 - i / warpLineCount);

    const ctrlX = (startX + endX) / 2 + Math.cos(lineAngle + warpPhase) * offsetDist;
    const ctrlY = (startY + endY) / 2 + Math.sin(lineAngle + warpPhase) * offsetDist;

    const alpha = 0.3 * (1 - Math.abs(i / warpLineCount - 0.5) * 2) * params.glowIntensity;
    ctx.strokeStyle = `rgba(140, 100, 200, ${alpha})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  }

  // Draw gravitational lens effect at target
  const lensRadius = 15 + level * 3;
  const lensPulse = 0.6 + 0.4 * Math.sin(time * 0.006);

  // Outer distortion ring
  ctx.strokeStyle = `rgba(100, 60, 160, ${lensPulse * 0.4})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(endX, endY, lensRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Inner pull gradient
  const pullGradient = ctx.createRadialGradient(endX, endY, 0, endX, endY, lensRadius);
  pullGradient.addColorStop(0, `rgba(60, 20, 100, ${lensPulse * 0.6})`);
  pullGradient.addColorStop(0.5, `rgba(80, 40, 140, ${lensPulse * 0.3})`);
  pullGradient.addColorStop(1, 'rgba(100, 60, 160, 0)');
  ctx.fillStyle = pullGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, lensRadius, 0, Math.PI * 2);
  ctx.fill();

  // Swirling particles being pulled
  const pulledParticles = 4 + level;
  for (let i = 0; i < pulledParticles; i++) {
    const particleT = ((time * 0.002 + i / pulledParticles) % 1);
    const spiralAngle = particleT * Math.PI * 4 + (i * Math.PI * 2) / pulledParticles;
    const spiralRadius = lensRadius * (1 - particleT);
    const particleX = endX + Math.cos(spiralAngle) * spiralRadius;
    const particleY = endY + Math.sin(spiralAngle) * spiralRadius;
    const particleAlpha = particleT * 0.8;

    ctx.fillStyle = `rgba(200, 150, 255, ${particleAlpha})`;
    ctx.beginPath();
    ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

export default GravityTowerSprite;
