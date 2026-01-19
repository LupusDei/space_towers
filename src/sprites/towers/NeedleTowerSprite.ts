// Needle Tower Sprite - Steel needle with glowing red tip
// Sharp pointed design with industrial/medical aesthetic
// Supports 5 visual tiers based on tower level
// Includes hit pulse animation that triggers on each successful hit

import type { Tower, Point } from '../../game/types';
import type { TowerSprite, SpriteRenderContext } from '../types';

// ============================================================================
// Hit Pulse Manager - Tracks active hit pulses for needle tip animation
// ============================================================================

const HIT_PULSE_DURATION = 150; // ms - brief flash on hit

interface ActiveHitPulse {
  towerId: string;
  startTime: number;
}

class NeedleHitPulseManager {
  private pulses: Map<string, ActiveHitPulse> = new Map();

  /**
   * Trigger a hit pulse for a needle tower.
   * Called when the tower successfully damages an enemy.
   * @param towerId - The tower's unique ID
   * @param time - Current game time in ms
   */
  triggerHit(towerId: string, time: number): void {
    this.pulses.set(towerId, {
      towerId,
      startTime: time,
    });
  }

  /**
   * Get the current pulse intensity for a tower (0-1).
   * Returns 0 if no active pulse.
   * @param towerId - The tower's unique ID
   * @param currentTime - Current game time in ms
   */
  getPulseIntensity(towerId: string, currentTime: number): number {
    const pulse = this.pulses.get(towerId);
    if (!pulse) return 0;

    const elapsed = currentTime - pulse.startTime;
    if (elapsed >= HIT_PULSE_DURATION) {
      this.pulses.delete(towerId);
      return 0;
    }

    // Quick flash that fades out
    const progress = elapsed / HIT_PULSE_DURATION;
    // Sharp attack, smooth decay
    return Math.pow(1 - progress, 2);
  }

  /**
   * Clear all active pulses (e.g., on game reset)
   */
  clear(): void {
    this.pulses.clear();
  }

  /**
   * Get count of active pulses (for testing)
   */
  getActiveCount(): number {
    return this.pulses.size;
  }
}

// Singleton instance for global access
export const needleHitPulseManager = new NeedleHitPulseManager();

// Seeded random for deterministic effects (consistent frame-to-frame)
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Level-based visual parameters
function getLevelParams(level: number) {
  const clampedLevel = Math.max(1, Math.min(5, level));
  return {
    needleLength: 0.6 + (clampedLevel - 1) * 0.05, // taller at higher levels
    needleWidth: 0.08 + (clampedLevel - 1) * 0.01, // slightly thicker
    tipGlowRadius: 1.5 + (clampedLevel - 1) * 0.3, // larger glow
    tipGlowIntensity: 0.4 + (clampedLevel - 1) * 0.1, // brighter glow
    hasSecondaryNeedles: clampedLevel >= 3, // side needles at level 3+
    hasCoolantRings: clampedLevel >= 2, // cooling rings at level 2+
    coolantRingCount: Math.floor((clampedLevel + 1) / 2), // 1, 1, 2, 2, 3
    hasEnergyField: clampedLevel >= 4, // ambient energy at level 4+
    hasPlasmaCore: clampedLevel >= 5, // plasma core at level 5
    steelBrightness: 1 + (clampedLevel - 1) * 0.08, // shinier steel
    hazardStripes: clampedLevel >= 2, // warning stripes at level 2+
  };
}

export const NeedleTowerSprite: TowerSprite = {
  draw(context: SpriteRenderContext, tower: Tower): void {
    const { ctx, cellSize, time } = context;
    const { x, y } = tower.position;
    const level = tower.level || 1;
    const params = getLevelParams(level);

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const baseRadius = cellSize * 0.32;

    // === AMBIENT ENERGY FIELD (Level 4+) ===
    if (params.hasEnergyField) {
      const fieldIntensity = 0.08 + 0.04 * Math.sin(time * 0.003);
      const fieldGradient = ctx.createRadialGradient(
        centerX,
        centerY - cellSize * 0.2,
        0,
        centerX,
        centerY - cellSize * 0.2,
        cellSize * 0.5
      );
      fieldGradient.addColorStop(
        0,
        `rgba(255, 80, 80, ${fieldIntensity * (level - 3) * 0.25})`
      );
      fieldGradient.addColorStop(
        0.7,
        `rgba(200, 50, 50, ${fieldIntensity * (level - 3) * 0.12})`
      );
      fieldGradient.addColorStop(1, 'rgba(150, 30, 30, 0)');
      ctx.fillStyle = fieldGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY - cellSize * 0.2, cellSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // === METALLIC BASE PLATFORM ===
    // Base shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(
      centerX + 2,
      centerY + baseRadius * 0.7,
      baseRadius * 1.05,
      baseRadius * 0.35,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Base platform with industrial metallic gradient
    const baseGradient = ctx.createLinearGradient(
      centerX - baseRadius,
      centerY,
      centerX + baseRadius,
      centerY + baseRadius * 0.6
    );
    baseGradient.addColorStop(0, '#5a5a6a');
    baseGradient.addColorStop(0.3, '#4a4a5a');
    baseGradient.addColorStop(0.7, '#3a3a4a');
    baseGradient.addColorStop(1, '#2a2a3a');
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

    // Base rim highlight
    ctx.strokeStyle = '#7a7a8a';
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

    // Hazard stripes on base (Level 2+)
    if (params.hazardStripes) {
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(
        centerX,
        centerY + baseRadius * 0.6,
        baseRadius * 0.85,
        baseRadius * 0.25,
        0,
        0,
        Math.PI * 2
      );
      ctx.clip();

      const stripeWidth = baseRadius * 0.15;
      ctx.fillStyle = '#cc3333';
      for (let i = -4; i <= 4; i += 2) {
        ctx.fillRect(
          centerX + i * stripeWidth - stripeWidth / 2,
          centerY + baseRadius * 0.3,
          stripeWidth,
          baseRadius * 0.3
        );
      }
      ctx.restore();
    }

    // === ROTATION TOWARD TARGET ===
    // Calculate rotation angle if we have a target
    let rotationAngle = 0;
    if (tower.targetPosition) {
      const targetX = tower.targetPosition.x * cellSize + cellSize / 2;
      const targetY = tower.targetPosition.y * cellSize + cellSize / 2;
      // Offset by PI/2 because needle is drawn pointing up (negative Y direction)
      rotationAngle = Math.atan2(targetY - centerY, targetX - centerX) + Math.PI / 2;
    }

    // Save context and apply rotation for everything above the base
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);
    ctx.translate(-centerX, -centerY);

    // === NEEDLE MOUNTING CYLINDER ===
    const cylinderHeight = cellSize * 0.12;
    const cylinderWidth = baseRadius * 0.5;
    const cylinderTop = centerY + baseRadius * 0.25;

    // Cylinder body
    const cylGradient = ctx.createLinearGradient(
      centerX - cylinderWidth,
      cylinderTop,
      centerX + cylinderWidth,
      cylinderTop
    );
    cylGradient.addColorStop(0, '#3a3a4a');
    cylGradient.addColorStop(0.3, '#5a5a6a');
    cylGradient.addColorStop(0.5, '#6a6a7a');
    cylGradient.addColorStop(0.7, '#5a5a6a');
    cylGradient.addColorStop(1, '#3a3a4a');
    ctx.fillStyle = cylGradient;
    ctx.fillRect(
      centerX - cylinderWidth,
      cylinderTop - cylinderHeight,
      cylinderWidth * 2,
      cylinderHeight
    );

    // Cylinder top ellipse
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.ellipse(
      centerX,
      cylinderTop - cylinderHeight,
      cylinderWidth,
      cylinderWidth * 0.25,
      0,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.strokeStyle = '#7a7a8a';
    ctx.lineWidth = 1;
    ctx.stroke();

    // === SECONDARY NEEDLES (Level 3+) ===
    if (params.hasSecondaryNeedles) {
      const secondaryLength = cellSize * params.needleLength * 0.5;
      const secondaryWidth = cellSize * params.needleWidth * 0.6;
      const angleSpread = 0.25;

      [-1, 1].forEach((side) => {
        const offsetX = side * baseRadius * 0.35;
        const baseY = cylinderTop - cylinderHeight;
        const tipY = baseY - secondaryLength;
        const tipX = centerX + offsetX + side * secondaryLength * Math.sin(angleSpread);

        // Secondary needle shaft gradient
        const secGradient = ctx.createLinearGradient(
          centerX + offsetX - secondaryWidth,
          baseY,
          centerX + offsetX + secondaryWidth,
          baseY
        );
        const brightness = params.steelBrightness;
        const r1 = Math.min(255, Math.floor(140 * brightness));
        const r2 = Math.min(255, Math.floor(180 * brightness));
        const r3 = Math.min(255, Math.floor(200 * brightness));
        secGradient.addColorStop(0, `rgb(${r1}, ${r1}, ${r1 + 10})`);
        secGradient.addColorStop(0.4, `rgb(${r2}, ${r2}, ${r2 + 10})`);
        secGradient.addColorStop(0.6, `rgb(${r3}, ${r3}, ${r3 + 10})`);
        secGradient.addColorStop(1, `rgb(${r1}, ${r1}, ${r1 + 10})`);

        ctx.fillStyle = secGradient;
        ctx.beginPath();
        ctx.moveTo(centerX + offsetX - secondaryWidth, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.lineTo(centerX + offsetX + secondaryWidth, baseY);
        ctx.closePath();
        ctx.fill();

        // Secondary tip glow
        const secGlowGradient = ctx.createRadialGradient(
          tipX,
          tipY,
          0,
          tipX,
          tipY,
          cellSize * 0.08
        );
        secGlowGradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
        secGlowGradient.addColorStop(0.5, 'rgba(255, 50, 50, 0.3)');
        secGlowGradient.addColorStop(1, 'rgba(200, 30, 30, 0)');
        ctx.fillStyle = secGlowGradient;
        ctx.beginPath();
        ctx.arc(tipX, tipY, cellSize * 0.08, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // === MAIN NEEDLE SHAFT ===
    const needleLength = cellSize * params.needleLength;
    const needleWidthBase = cellSize * params.needleWidth;
    const needleBase = cylinderTop - cylinderHeight;
    const needleTip = needleBase - needleLength;

    // Steel needle gradient
    const brightness = params.steelBrightness;
    const needleGradient = ctx.createLinearGradient(
      centerX - needleWidthBase,
      needleBase,
      centerX + needleWidthBase,
      needleBase
    );
    const s1 = Math.min(255, Math.floor(150 * brightness));
    const s2 = Math.min(255, Math.floor(190 * brightness));
    const s3 = Math.min(255, Math.floor(220 * brightness));
    needleGradient.addColorStop(0, `rgb(${s1}, ${s1}, ${s1 + 15})`);
    needleGradient.addColorStop(0.3, `rgb(${s2}, ${s2}, ${s2 + 10})`);
    needleGradient.addColorStop(0.5, `rgb(${s3}, ${s3}, ${s3 + 5})`);
    needleGradient.addColorStop(0.7, `rgb(${s2}, ${s2}, ${s2 + 10})`);
    needleGradient.addColorStop(1, `rgb(${s1}, ${s1}, ${s1 + 15})`);

    // Draw needle as sharp triangle
    ctx.fillStyle = needleGradient;
    ctx.beginPath();
    ctx.moveTo(centerX - needleWidthBase, needleBase);
    ctx.lineTo(centerX, needleTip);
    ctx.lineTo(centerX + needleWidthBase, needleBase);
    ctx.closePath();
    ctx.fill();

    // Needle edge highlight
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + (level - 1) * 0.05})`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(centerX - needleWidthBase + 1, needleBase);
    ctx.lineTo(centerX, needleTip);
    ctx.stroke();

    // === COOLANT RINGS (Level 2+) ===
    if (params.hasCoolantRings) {
      for (let i = 0; i < params.coolantRingCount; i++) {
        const ringT = 0.25 + (i * 0.25) / params.coolantRingCount;
        const ringY = needleBase - needleLength * ringT;
        const ringWidth = needleWidthBase * (1 - ringT * 0.8);

        // Ring glow
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.4)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerX - ringWidth - 2, ringY);
        ctx.lineTo(centerX + ringWidth + 2, ringY);
        ctx.stroke();

        // Ring metal
        ctx.strokeStyle = '#8ac0d0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - ringWidth - 1, ringY);
        ctx.lineTo(centerX + ringWidth + 1, ringY);
        ctx.stroke();
      }
    }

    // === PLASMA CORE (Level 5) ===
    if (params.hasPlasmaCore) {
      const coreY = needleBase - needleLength * 0.15;
      const coreRadius = needleWidthBase * 1.5;
      const pulseIntensity = 0.6 + 0.2 * Math.sin(time * 0.006);

      // Core glow
      const coreGlow = ctx.createRadialGradient(
        centerX,
        coreY,
        0,
        centerX,
        coreY,
        coreRadius * 2
      );
      coreGlow.addColorStop(0, `rgba(255, 100, 100, ${pulseIntensity})`);
      coreGlow.addColorStop(0.5, `rgba(200, 50, 50, ${pulseIntensity * 0.4})`);
      coreGlow.addColorStop(1, 'rgba(150, 30, 30, 0)');
      ctx.fillStyle = coreGlow;
      ctx.beginPath();
      ctx.arc(centerX, coreY, coreRadius * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core orb
      const coreOrb = ctx.createRadialGradient(
        centerX - coreRadius * 0.2,
        coreY - coreRadius * 0.2,
        0,
        centerX,
        coreY,
        coreRadius
      );
      coreOrb.addColorStop(0, '#ffaaaa');
      coreOrb.addColorStop(0.5, '#ff5555');
      coreOrb.addColorStop(1, '#cc2222');
      ctx.fillStyle = coreOrb;
      ctx.beginPath();
      ctx.arc(centerX, coreY, coreRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    // === GLOWING RED TIP (Upgraded) ===
    // Get hit pulse intensity (0-1) for additional glow on successful hits
    const hitPulseIntensity = needleHitPulseManager.getPulseIntensity(
      tower.id,
      time * 1000
    );

    // Base tip glow size, enhanced by hit pulse and level
    const baseTipGlowSize = cellSize * 0.1 * params.tipGlowRadius;
    const tipGlowSize = baseTipGlowSize * (1 + hitPulseIntensity * 0.8);

    // Base pulse from ambient animation, enhanced by hit pulse
    const baseTipPulse = params.tipGlowIntensity + 0.15 * Math.sin(time * 0.004);
    const tipPulse = Math.min(1, baseTipPulse + hitPulseIntensity * 0.5);
    const hitBoost = hitPulseIntensity * 80;

    // === OUTER HEAT HAZE (subtle distortion effect) ===
    const hazeRadius = tipGlowSize * 1.8;
    const hazePulse = 0.06 + 0.03 * Math.sin(time * 0.003);
    const hazeGradient = ctx.createRadialGradient(
      centerX,
      needleTip,
      tipGlowSize * 0.5,
      centerX,
      needleTip,
      hazeRadius
    );
    hazeGradient.addColorStop(0, `rgba(255, 100, 80, ${hazePulse * (1 + level * 0.1)})`);
    hazeGradient.addColorStop(0.5, `rgba(255, 60, 40, ${hazePulse * 0.5})`);
    hazeGradient.addColorStop(1, 'rgba(200, 40, 20, 0)');
    ctx.fillStyle = hazeGradient;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, hazeRadius, 0, Math.PI * 2);
    ctx.fill();

    // === MAIN OUTER GLOW (multi-layered) ===
    // Layer 1: Diffuse red aura
    const outerGlow1 = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      tipGlowSize * 1.3
    );
    outerGlow1.addColorStop(0, `rgba(255, ${120 + hitBoost}, ${100 + hitBoost}, ${tipPulse * 0.8})`);
    outerGlow1.addColorStop(0.3, `rgba(255, ${80 + hitBoost * 0.7}, ${60 + hitBoost * 0.5}, ${tipPulse * 0.5})`);
    outerGlow1.addColorStop(0.6, `rgba(220, 40, 30, ${tipPulse * 0.25})`);
    outerGlow1.addColorStop(1, 'rgba(180, 20, 15, 0)');
    ctx.fillStyle = outerGlow1;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, tipGlowSize * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Layer 2: Hot orange-red core glow
    const outerGlow2 = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      tipGlowSize
    );
    outerGlow2.addColorStop(0, `rgba(255, ${180 + hitBoost * 0.5}, ${100 + hitBoost}, ${tipPulse})`);
    outerGlow2.addColorStop(0.4, `rgba(255, ${100 + hitBoost * 0.3}, ${50 + hitBoost * 0.2}, ${tipPulse * 0.7})`);
    outerGlow2.addColorStop(0.7, `rgba(230, 50, 30, ${tipPulse * 0.3})`);
    outerGlow2.addColorStop(1, 'rgba(200, 30, 20, 0)');
    ctx.fillStyle = outerGlow2;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, tipGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // === ENERGY ARCS / CRACKLING (Level 2+) ===
    if (level >= 2) {
      const arcCount = 2 + Math.floor((level - 1) / 2); // 2, 2, 3, 3, 4
      const arcBaseIntensity = 0.4 + (level - 2) * 0.1 + hitPulseIntensity * 0.3;

      for (let i = 0; i < arcCount; i++) {
        // Each arc has its own timing cycle
        const arcCycle = (time * 0.004 + i * 1.3) % 1;
        if (arcCycle > 0.25) continue; // Short flashes

        const arcIntensity = arcBaseIntensity * (0.25 - arcCycle) / 0.25;
        const arcAngle = seededRandom(Math.floor(time * 0.015) + i * 47) * Math.PI * 2;
        const arcLength = cellSize * 0.06 * (1 + level * 0.15);

        const arcStartX = centerX + Math.cos(arcAngle) * cellSize * 0.015;
        const arcStartY = needleTip + Math.sin(arcAngle) * cellSize * 0.01;
        const arcMidAngle = arcAngle + (seededRandom(i * 73 + Math.floor(time * 0.02)) - 0.5) * 0.8;
        const arcMidX = centerX + Math.cos(arcMidAngle) * arcLength * 0.6;
        const arcMidY = needleTip - arcLength * 0.3 + Math.sin(arcMidAngle) * arcLength * 0.4;
        const arcEndX = centerX + Math.cos(arcAngle + 0.3) * arcLength;
        const arcEndY = needleTip - arcLength * 0.5;

        // Arc glow layer
        ctx.strokeStyle = `rgba(255, 150, 100, ${arcIntensity * 0.4})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(arcStartX, arcStartY);
        ctx.lineTo(arcMidX, arcMidY);
        ctx.lineTo(arcEndX, arcEndY);
        ctx.stroke();

        // Arc core
        ctx.strokeStyle = `rgba(255, 220, 180, ${arcIntensity})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(arcStartX, arcStartY);
        ctx.lineTo(arcMidX, arcMidY);
        ctx.lineTo(arcEndX, arcEndY);
        ctx.stroke();
      }
    }

    // === HIT PULSE RING EFFECT (expanding ring on hit) ===
    if (hitPulseIntensity > 0) {
      const ringRadius = baseTipGlowSize * (1 + (1 - hitPulseIntensity) * 1.5);
      const ringAlpha = hitPulseIntensity * 0.6;
      ctx.strokeStyle = `rgba(255, 200, 200, ${ringAlpha})`;
      ctx.lineWidth = 2 * hitPulseIntensity;
      ctx.beginPath();
      ctx.arc(centerX, needleTip, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary inner ring
      const innerRingRadius = baseTipGlowSize * (0.5 + (1 - hitPulseIntensity) * 0.8);
      ctx.strokeStyle = `rgba(255, 255, 220, ${ringAlpha * 0.7})`;
      ctx.lineWidth = 1.5 * hitPulseIntensity;
      ctx.beginPath();
      ctx.arc(centerX, needleTip, innerRingRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // === INNER BRIGHT CORE (intensified) ===
    const coreSize = cellSize * 0.035 * (1 + hitPulseIntensity * 0.5) * (1 + (level - 1) * 0.05);
    const innerGlow = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      coreSize
    );
    // Whiter, hotter core
    const coreWhiteness = hitPulseIntensity * 0.3;
    innerGlow.addColorStop(0, '#ffffff');
    innerGlow.addColorStop(0.2, `rgb(255, ${240 + 15 * coreWhiteness}, ${220 + 35 * coreWhiteness})`);
    innerGlow.addColorStop(0.4, `rgb(255, ${200 + 30 * coreWhiteness}, ${150 + 50 * coreWhiteness})`);
    innerGlow.addColorStop(0.7, `rgb(255, ${120 + 50 * coreWhiteness}, ${80 + 50 * coreWhiteness})`);
    innerGlow.addColorStop(1, '#ff4422');
    ctx.fillStyle = innerGlow;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // === FLOATING EMBER PARTICLES (Level 3+) ===
    if (level >= 3) {
      const emberCount = 2 + Math.floor((level - 2) * 1.5); // 2, 3, 5
      for (let i = 0; i < emberCount; i++) {
        const emberCycle = ((time * 0.002 + i * 0.37) % 1);
        const emberY = needleTip - emberCycle * cellSize * 0.15;
        const emberX = centerX + Math.sin(time * 0.005 + i * 2.1) * cellSize * 0.04;
        const emberAlpha = Math.sin(emberCycle * Math.PI) * (0.6 + hitPulseIntensity * 0.3);
        const emberSize = 1 + (1 - emberCycle) * 1.5;

        if (emberAlpha > 0.1) {
          ctx.fillStyle = `rgba(255, ${180 + Math.floor(emberCycle * 75)}, ${100 + Math.floor(emberCycle * 50)}, ${emberAlpha})`;
          ctx.beginPath();
          ctx.arc(emberX, emberY, emberSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // === TIP HIGHLIGHT SPARKS (multiple, more dynamic) ===
    const sparkCount = 1 + Math.floor(level / 3); // 1, 1, 2, 2, 2
    for (let i = 0; i < sparkCount; i++) {
      const sparkThreshold = hitPulseIntensity > 0 ? 0.3 : 0.55;
      const sparkPhase = (time * 0.006 + i * 0.4) % 1;
      if (sparkPhase > sparkThreshold) {
        const sparkAlpha = hitPulseIntensity > 0 ? 1.0 : 0.85;
        const sparkOffsetX = Math.sin(time * 0.01 + i * 1.5) * 2;
        const sparkOffsetY = -2 - i * 1.5;
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkAlpha})`;
        ctx.beginPath();
        ctx.arc(centerX + sparkOffsetX, needleTip + sparkOffsetY, 1.5 + hitPulseIntensity * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Restore context after rotation
    ctx.restore();
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
    const baseRadius = cellSize * 0.32;
    const needleLength = cellSize * params.needleLength;
    const cylinderHeight = cellSize * 0.12;
    const needleBase = centerY + baseRadius * 0.25 - cylinderHeight;
    const needleTip = needleBase - needleLength;

    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Draw precision beam (thin, focused)
    drawNeedleBeam(ctx, centerX, needleTip, targetX, targetY, time, level);

    // === ENHANCED TIP GLOW WHEN FIRING (Upgraded) ===
    const firingPulse = 0.85 + 0.15 * Math.sin(time * 0.015);
    const firingGlowRadius = cellSize * 0.18 * (1.5 + (level - 1) * 0.25);

    // Outer heat bloom
    const outerBloom = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      firingGlowRadius * 1.5
    );
    outerBloom.addColorStop(0, `rgba(255, 200, 150, ${firingPulse * 0.4})`);
    outerBloom.addColorStop(0.4, `rgba(255, 120, 80, ${firingPulse * 0.25})`);
    outerBloom.addColorStop(0.7, `rgba(220, 60, 40, ${firingPulse * 0.12})`);
    outerBloom.addColorStop(1, 'rgba(180, 30, 20, 0)');
    ctx.fillStyle = outerBloom;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, firingGlowRadius * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Main firing glow
    const firingGlow = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      firingGlowRadius
    );
    firingGlow.addColorStop(0, `rgba(255, 220, 200, ${firingPulse})`);
    firingGlow.addColorStop(0.2, `rgba(255, 150, 120, ${firingPulse * 0.85})`);
    firingGlow.addColorStop(0.5, `rgba(255, 80, 60, ${firingPulse * 0.5})`);
    firingGlow.addColorStop(0.75, `rgba(200, 50, 40, ${firingPulse * 0.25})`);
    firingGlow.addColorStop(1, 'rgba(150, 30, 25, 0)');
    ctx.fillStyle = firingGlow;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, firingGlowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Intense white-hot core when firing
    const coreRadius = cellSize * 0.04 * (1 + (level - 1) * 0.1);
    const firingCore = ctx.createRadialGradient(
      centerX,
      needleTip,
      0,
      centerX,
      needleTip,
      coreRadius
    );
    firingCore.addColorStop(0, '#ffffff');
    firingCore.addColorStop(0.3, '#ffffee');
    firingCore.addColorStop(0.5, '#ffddaa');
    firingCore.addColorStop(0.8, '#ff8855');
    firingCore.addColorStop(1, '#ff4422');
    ctx.fillStyle = firingCore;
    ctx.beginPath();
    ctx.arc(centerX, needleTip, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    // Energy discharge sparks when firing (radiating from tip)
    const sparkCount = 3 + level;
    for (let i = 0; i < sparkCount; i++) {
      const sparkAngle = (time * 0.008 + i * (Math.PI * 2 / sparkCount)) % (Math.PI * 2);
      const sparkDist = cellSize * 0.03 + Math.sin(time * 0.02 + i) * cellSize * 0.015;
      const sparkX = centerX + Math.cos(sparkAngle) * sparkDist;
      const sparkY = needleTip + Math.sin(sparkAngle) * sparkDist * 0.5 - cellSize * 0.01;
      const sparkAlpha = 0.7 + 0.3 * Math.sin(time * 0.025 + i * 1.2);

      ctx.fillStyle = `rgba(255, 255, 220, ${sparkAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  },

  drawRange(context: SpriteRenderContext, tower: Tower, isSelected?: boolean): void {
    const { ctx, cellSize } = context;
    const { x, y } = tower.position;

    const centerX = x * cellSize + cellSize / 2;
    const centerY = y * cellSize + cellSize / 2;
    const rangePixels = tower.range;

    const fillAlpha = isSelected ? 0.12 : 0.06;
    const strokeAlpha = isSelected ? 0.45 : 0.25;

    // Range circle fill (red tint for needle)
    ctx.fillStyle = `rgba(255, 80, 80, ${fillAlpha})`;
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.fill();

    // Range circle border
    ctx.strokeStyle = `rgba(255, 100, 100, ${strokeAlpha})`;
    ctx.lineWidth = isSelected ? 2 : 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.arc(centerX, centerY, rangePixels, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  },
};

function drawNeedleBeam(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  time: number,
  level: number = 1
): void {
  const dx = endX - startX;
  const dy = endY - startY;

  // Scale width with level
  const baseWidth = 1 + (level - 1) * 0.3;
  const alphaBoost = (level - 1) * 0.05;

  // Draw beam layers (thin, precise)
  const beamLayers = [
    { width: 6 * baseWidth, alpha: 0.15 + alphaBoost, color: '255, 80, 80' },
    { width: 3 * baseWidth, alpha: 0.35 + alphaBoost, color: '255, 120, 120' },
    { width: 1.5 * baseWidth, alpha: 0.7 + alphaBoost, color: '255, 180, 180' },
    { width: 0.5 * baseWidth, alpha: 1.0, color: '255, 255, 255' },
  ];

  for (const layer of beamLayers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${Math.min(1, layer.alpha)})`;
    ctx.lineWidth = layer.width;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
  }

  // Draw traveling pulse along beam
  const pulseT = ((time * 0.01) % 1);
  const pulseX = startX + dx * pulseT;
  const pulseY = startY + dy * pulseT;
  const pulseRadius = 4 + level;

  const pulseGradient = ctx.createRadialGradient(
    pulseX,
    pulseY,
    0,
    pulseX,
    pulseY,
    pulseRadius
  );
  pulseGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  pulseGradient.addColorStop(0.5, 'rgba(255, 150, 150, 0.4)');
  pulseGradient.addColorStop(1, 'rgba(255, 100, 100, 0)');
  ctx.fillStyle = pulseGradient;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, pulseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Impact glow at target (scales with level)
  const impactRadius = 12 + (level - 1) * 2;
  const impactGradient = ctx.createRadialGradient(
    endX,
    endY,
    0,
    endX,
    endY,
    impactRadius
  );
  impactGradient.addColorStop(0, 'rgba(255, 150, 150, 0.7)');
  impactGradient.addColorStop(0.5, 'rgba(255, 80, 80, 0.3)');
  impactGradient.addColorStop(1, 'rgba(200, 50, 50, 0)');
  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(endX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

export default NeedleTowerSprite;
