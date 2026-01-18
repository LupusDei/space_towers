// Storm Effect Sprite - Lightning cloud animation with crackling electricity and rain
// Used for area-of-effect storm abilities

import type { Point } from '../../game/types';
import type { EffectSprite, SpriteRenderContext } from '../types';

// Storm color configuration
const STORM_COLORS = {
  cloudDark: 'rgba(30, 35, 50, 0.9)',
  cloudMid: 'rgba(50, 55, 70, 0.8)',
  cloudLight: 'rgba(70, 75, 90, 0.7)',
  lightning: '180, 200, 255',
  lightningCore: '220, 240, 255',
  rain: 'rgba(150, 180, 220, 0.6)',
};

// Seeded random for deterministic effects
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Rain drop data
interface RainDrop {
  x: number; // Offset from center (-0.5 to 0.5)
  speed: number; // Fall speed multiplier
  length: number; // Drop length
  delay: number; // Start delay
}

// Lightning bolt segment
interface LightningBolt {
  startX: number;
  segments: { x: number; y: number }[];
  intensity: number;
  flashTime: number; // When to flash (0-1 in cycle)
}

function generateRainDrops(count: number, seed: number): RainDrop[] {
  const drops: RainDrop[] = [];
  for (let i = 0; i < count; i++) {
    drops.push({
      x: (seededRandom(seed + i * 100) - 0.5) * 0.9,
      speed: 0.7 + seededRandom(seed + i * 200) * 0.6,
      length: 4 + seededRandom(seed + i * 300) * 6,
      delay: seededRandom(seed + i * 400),
    });
  }
  return drops;
}

function generateLightningBolt(seed: number, startX: number): LightningBolt {
  const segments: { x: number; y: number }[] = [];
  const segmentCount = 4 + Math.floor(seededRandom(seed) * 3);

  let x = startX;
  for (let i = 0; i <= segmentCount; i++) {
    const y = i / segmentCount;
    // Add horizontal jitter, more towards the end
    const jitter = (seededRandom(seed + i * 50) - 0.5) * 0.15 * (1 + i * 0.3);
    x += jitter;
    segments.push({ x, y });
  }

  return {
    startX,
    segments,
    intensity: 0.6 + seededRandom(seed + 1000) * 0.4,
    flashTime: seededRandom(seed + 2000),
  };
}

/**
 * Creates a storm effect sprite with lightning cloud, electricity, and rain.
 * Duration is controlled by the caller via progress (0-1).
 */
export function createStormEffectSprite(): EffectSprite {
  const rainCount = 24;
  const lightningCount = 3;
  let rainSeed = 0;
  let lightningBolts: LightningBolt[] = [];

  return {
    draw(context: SpriteRenderContext, position: Point, progress: number): void {
      const { ctx, cellSize, time } = context;
      const centerX = position.x * cellSize + cellSize / 2;
      const centerY = position.y * cellSize + cellSize / 2;

      // Effect dimensions
      const cloudWidth = cellSize * 0.9;
      const cloudHeight = cellSize * 0.25;
      const cloudY = centerY - cellSize * 0.3;
      const groundY = centerY + cellSize * 0.4;

      // Generate effects on first frame
      if (progress < 0.01) {
        rainSeed = Math.floor(time * 1000);
        lightningBolts = [];
        for (let i = 0; i < lightningCount; i++) {
          const startX = (seededRandom(rainSeed + i * 500) - 0.5) * 0.6;
          lightningBolts.push(generateLightningBolt(rainSeed + i * 1000, startX));
        }
      }

      const rainDrops = generateRainDrops(rainCount, rainSeed);

      // Fade in/out
      const fadeIn = Math.min(1, progress * 5);
      const fadeOut = Math.min(1, (1 - progress) * 5);
      const alpha = fadeIn * fadeOut;

      // ========================================
      // Draw dark storm cloud
      // ========================================
      ctx.save();
      ctx.globalAlpha = alpha;

      // Cloud layers (darker in center, lighter at edges)
      const cloudLayers = [
        { yOffset: 0, width: 1.0, height: 1.0, color: STORM_COLORS.cloudDark },
        { yOffset: -3, width: 0.85, height: 0.8, color: STORM_COLORS.cloudMid },
        { yOffset: -6, width: 0.65, height: 0.6, color: STORM_COLORS.cloudLight },
      ];

      for (const layer of cloudLayers) {
        const layerWidth = cloudWidth * layer.width;
        const layerHeight = cloudHeight * layer.height;

        // Animate cloud slightly with time
        const wobble = Math.sin(time * 1.5) * 2;

        ctx.fillStyle = layer.color;
        ctx.beginPath();
        ctx.ellipse(
          centerX + wobble,
          cloudY + layer.yOffset,
          layerWidth / 2,
          layerHeight / 2,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }

      // Cloud glow/ambient light from lightning
      const lightningGlow = Math.sin(time * 15) * 0.3 + 0.3;
      const glowGradient = ctx.createRadialGradient(
        centerX,
        cloudY,
        0,
        centerX,
        cloudY,
        cloudWidth * 0.6
      );
      glowGradient.addColorStop(0, `rgba(${STORM_COLORS.lightning}, ${lightningGlow * alpha * 0.3})`);
      glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = glowGradient;
      ctx.beginPath();
      ctx.ellipse(centerX, cloudY, cloudWidth * 0.6, cloudHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      // ========================================
      // Draw lightning bolts
      // ========================================
      const cycleTime = (time * 2) % 1; // 0.5 second cycle

      for (const bolt of lightningBolts) {
        // Each bolt flashes at a different time in the cycle
        const flashDelta = Math.abs(cycleTime - bolt.flashTime);
        const flashIntensity = flashDelta < 0.1 ? (0.1 - flashDelta) / 0.1 : 0;

        if (flashIntensity > 0) {
          const boltAlpha = flashIntensity * bolt.intensity * alpha;
          drawLightningBolt(ctx, bolt, centerX, cloudY + cloudHeight * 0.3, groundY, cloudWidth, boltAlpha);
        }
      }

      // ========================================
      // Draw rain
      // ========================================
      const rainStartY = cloudY + cloudHeight * 0.4;
      const rainEndY = groundY;
      const rainHeight = rainEndY - rainStartY;

      ctx.strokeStyle = STORM_COLORS.rain;
      ctx.lineWidth = 1;
      ctx.lineCap = 'round';

      for (const drop of rainDrops) {
        // Animate rain falling continuously
        const dropTime = ((time * drop.speed * 3 + drop.delay) % 1);
        const dropY = rainStartY + dropTime * rainHeight;
        const dropX = centerX + drop.x * cloudWidth;

        // Fade at top and bottom
        const verticalFade = Math.min(
          (dropY - rainStartY) / (rainHeight * 0.2),
          (rainEndY - dropY) / (rainHeight * 0.2),
          1
        );

        ctx.globalAlpha = alpha * verticalFade * 0.7;
        ctx.beginPath();
        ctx.moveTo(dropX, dropY);
        ctx.lineTo(dropX, dropY + drop.length);
        ctx.stroke();
      }

      // ========================================
      // Draw ground splash effects
      // ========================================
      ctx.globalAlpha = alpha * 0.4;
      for (let i = 0; i < 6; i++) {
        const splashX = centerX + (seededRandom(rainSeed + i * 600) - 0.5) * cloudWidth * 0.8;
        const splashTime = ((time * 2 + seededRandom(rainSeed + i * 700)) % 1);
        const splashRadius = splashTime * 4;
        const splashAlpha = (1 - splashTime) * 0.5;

        ctx.strokeStyle = `rgba(150, 180, 220, ${splashAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(splashX, groundY, splashRadius, Math.PI, 0);
        ctx.stroke();
      }

      ctx.restore();
    },
  };
}

function drawLightningBolt(
  ctx: CanvasRenderingContext2D,
  bolt: LightningBolt,
  centerX: number,
  startY: number,
  endY: number,
  width: number,
  alpha: number
): void {
  const height = endY - startY;

  // Draw multiple layers for glow effect
  const layers = [
    { lineWidth: 6, alphaMult: 0.2, color: STORM_COLORS.lightning },
    { lineWidth: 3, alphaMult: 0.5, color: STORM_COLORS.lightning },
    { lineWidth: 1.5, alphaMult: 1.0, color: STORM_COLORS.lightningCore },
  ];

  for (const layer of layers) {
    ctx.strokeStyle = `rgba(${layer.color}, ${alpha * layer.alphaMult})`;
    ctx.lineWidth = layer.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();

    for (let i = 0; i < bolt.segments.length; i++) {
      const seg = bolt.segments[i];
      const x = centerX + seg.x * width;
      const y = startY + seg.y * height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }

    ctx.stroke();
  }

  // Draw impact glow at ground level
  const lastSeg = bolt.segments[bolt.segments.length - 1];
  const impactX = centerX + lastSeg.x * width;
  const impactRadius = 8;
  const gradient = ctx.createRadialGradient(impactX, endY, 0, impactX, endY, impactRadius);
  gradient.addColorStop(0, `rgba(${STORM_COLORS.lightningCore}, ${alpha * 0.8})`);
  gradient.addColorStop(0.5, `rgba(${STORM_COLORS.lightning}, ${alpha * 0.4})`);
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(impactX, endY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

// Pre-built storm effect sprite
export const StormEffectSprite = createStormEffectSprite();

// ============================================================================
// Storm Effect Manager - Track and render active storm effects
// ============================================================================

const DEFAULT_STORM_DURATION = 2000; // ms

export interface ActiveStormEffect {
  id: number;
  position: Point; // In pixels
  startTime: number;
  duration: number;
  sprite: EffectSprite;
}

class StormEffectManager {
  private effects: ActiveStormEffect[] = [];
  private nextId = 0;

  /**
   * Spawn a storm effect at a position.
   * @param position - Position in pixels (not grid coordinates)
   * @param time - Current game time in ms
   * @param duration - Effect duration in ms (default 2000)
   */
  spawn(position: Point, time: number, duration: number = DEFAULT_STORM_DURATION): void {
    this.effects.push({
      id: this.nextId++,
      position: { x: position.x, y: position.y },
      startTime: time,
      duration,
      sprite: createStormEffectSprite(),
    });
  }

  /**
   * Update and draw all active storm effects.
   * Removes expired effects automatically.
   */
  drawAll(context: SpriteRenderContext): void {
    const currentTime = context.time * 1000; // Convert to ms

    this.effects = this.effects.filter((effect) => {
      const elapsed = currentTime - effect.startTime;
      const progress = elapsed / effect.duration;

      if (progress >= 1) {
        return false; // Remove expired
      }

      // Convert pixel position to grid position for sprite
      const gridPos: Point = {
        x: effect.position.x / context.cellSize,
        y: effect.position.y / context.cellSize,
      };

      effect.sprite.draw(context, gridPos, progress);
      return true;
    });
  }

  clear(): void {
    this.effects = [];
  }

  getActive(): ActiveStormEffect[] {
    return this.effects;
  }
}

// Singleton instance
export const stormEffectManager = new StormEffectManager();

// ============================================================================
// Storm Charging Manager - Track and render charging animations on towers
// ============================================================================

const CHARGE_DURATION = 800; // ms - time to fully charge before storm spawns

interface ChargingTower {
  towerId: string;
  position: Point; // Tower position in grid coordinates
  startTime: number;
  duration: number;
}

class StormChargingManager {
  private chargingTowers: Map<string, ChargingTower> = new Map();

  /**
   * Start or update charging for a tower.
   * @param towerId - The tower's unique ID
   * @param position - Tower position in grid coordinates
   * @param time - Current game time in ms
   * @param duration - Charge duration in ms (default 800)
   */
  startCharging(
    towerId: string,
    position: Point,
    time: number,
    duration: number = CHARGE_DURATION
  ): void {
    this.chargingTowers.set(towerId, {
      towerId,
      position: { x: position.x, y: position.y },
      startTime: time,
      duration,
    });
  }

  /**
   * Stop charging for a tower (called when storm spawns or cancelled).
   */
  stopCharging(towerId: string): void {
    this.chargingTowers.delete(towerId);
  }

  /**
   * Get charging progress for a tower (0-1).
   * Returns 0 if not charging or expired.
   */
  getChargeProgress(towerId: string, currentTime: number): number {
    const tower = this.chargingTowers.get(towerId);
    if (!tower) return 0;

    const elapsed = currentTime - tower.startTime;
    if (elapsed >= tower.duration) {
      return 1;
    }

    return elapsed / tower.duration;
  }

  /**
   * Check if a tower is currently charging.
   */
  isCharging(towerId: string): boolean {
    return this.chargingTowers.has(towerId);
  }

  /**
   * Draw charging effects for all charging towers.
   * Should be called during the render loop.
   */
  drawAll(context: SpriteRenderContext): void {
    const currentTime = context.time * 1000;
    const { ctx, cellSize } = context;

    for (const [towerId, tower] of this.chargingTowers) {
      const elapsed = currentTime - tower.startTime;
      const progress = Math.min(1, elapsed / tower.duration);

      // Remove expired charges
      if (progress >= 1) {
        this.chargingTowers.delete(towerId);
        continue;
      }

      // Draw charging effect at tower position
      const centerX = tower.position.x * cellSize + cellSize / 2;
      const centerY = tower.position.y * cellSize + cellSize / 2;

      drawChargingEffect(ctx, centerX, centerY, cellSize, progress, context.time);
    }
  }

  /**
   * Draw charging effect for a specific tower (can be called from tower sprite).
   */
  drawForTower(
    context: SpriteRenderContext,
    towerId: string,
    centerX: number,
    centerY: number
  ): void {
    const currentTime = context.time * 1000;
    const progress = this.getChargeProgress(towerId, currentTime);

    if (progress > 0 && progress < 1) {
      drawChargingEffect(
        context.ctx,
        centerX,
        centerY,
        context.cellSize,
        progress,
        context.time
      );
    }
  }

  /**
   * Clear all charging states.
   */
  clear(): void {
    this.chargingTowers.clear();
  }

  /**
   * Get count of charging towers (for testing).
   */
  getActiveCount(): number {
    return this.chargingTowers.size;
  }
}

/**
 * Draw the charging effect at a tower position.
 * Shows energy arcs traveling up, intensifying glow, and electrical buildup.
 */
function drawChargingEffect(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  cellSize: number,
  progress: number,
  time: number
): void {
  const baseRadius = cellSize * 0.35;
  const coilHeight = cellSize * 0.55;
  const coilTop = centerY - coilHeight * 0.55;

  // Intensity increases with progress
  const intensity = progress * progress; // Quadratic for dramatic buildup

  // === ENERGY FIELD AROUND TOWER ===
  const fieldAlpha = intensity * 0.3;
  const fieldRadius = cellSize * 0.5 * (1 + progress * 0.3);
  const fieldGradient = ctx.createRadialGradient(
    centerX,
    centerY - cellSize * 0.1,
    0,
    centerX,
    centerY - cellSize * 0.1,
    fieldRadius
  );
  fieldGradient.addColorStop(0, `rgba(100, 150, 255, ${fieldAlpha})`);
  fieldGradient.addColorStop(0.5, `rgba(80, 120, 220, ${fieldAlpha * 0.5})`);
  fieldGradient.addColorStop(1, 'rgba(60, 100, 200, 0)');
  ctx.fillStyle = fieldGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY - cellSize * 0.1, fieldRadius, 0, Math.PI * 2);
  ctx.fill();

  // === RISING ENERGY ARCS ===
  const arcCount = 3 + Math.floor(progress * 3);
  for (let i = 0; i < arcCount; i++) {
    // Each arc rises at different speeds
    const arcSpeed = 0.8 + (i % 3) * 0.2;
    const arcPhase = ((time * arcSpeed * 3 + i * 0.33) % 1);
    const arcY = centerY + baseRadius * 0.3 - arcPhase * coilHeight * 1.2;

    // Only draw if arc is in visible range
    if (arcY > coilTop - cellSize * 0.1 && arcY < centerY + baseRadius * 0.3) {
      const arcAlpha = intensity * (1 - arcPhase) * 0.8;
      const arcWidth = cellSize * 0.15 * (1 + i * 0.1);

      // Arc glow
      ctx.strokeStyle = `rgba(150, 200, 255, ${arcAlpha * 0.5})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(centerX - arcWidth, arcY);
      ctx.quadraticCurveTo(
        centerX,
        arcY - 5 * Math.sin(time * 10 + i),
        centerX + arcWidth,
        arcY
      );
      ctx.stroke();

      // Arc core
      ctx.strokeStyle = `rgba(200, 230, 255, ${arcAlpha})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // === CRACKLING ELECTRICITY AT TOP ===
  if (progress > 0.3) {
    const crackleCount = Math.floor(progress * 5);
    const crackleIntensity = (progress - 0.3) / 0.7;

    for (let i = 0; i < crackleCount; i++) {
      const angle = ((time * 5 + i * 1.5) % (Math.PI * 2));
      const crackleLength = cellSize * 0.1 * (0.5 + seededRandom(time * 100 + i) * 0.5);

      const startX = centerX + Math.cos(angle) * baseRadius * 0.2;
      const startY = coilTop;
      const endX = startX + Math.cos(angle + Math.PI / 4) * crackleLength;
      const endY = startY + Math.sin(angle + Math.PI / 4) * crackleLength - crackleLength * 0.5;

      const crackleAlpha = crackleIntensity * 0.7 * seededRandom(time * 50 + i * 100);

      ctx.strokeStyle = `rgba(180, 220, 255, ${crackleAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  // === BUILDING GLOW AT TOP ===
  const topGlowAlpha = intensity * 0.6;
  const topGlowRadius = cellSize * 0.15 * (1 + progress * 0.5);
  const topGlow = ctx.createRadialGradient(
    centerX,
    coilTop,
    0,
    centerX,
    coilTop,
    topGlowRadius
  );
  topGlow.addColorStop(0, `rgba(180, 220, 255, ${topGlowAlpha})`);
  topGlow.addColorStop(0.5, `rgba(100, 160, 255, ${topGlowAlpha * 0.5})`);
  topGlow.addColorStop(1, 'rgba(60, 120, 220, 0)');
  ctx.fillStyle = topGlow;
  ctx.beginPath();
  ctx.arc(centerX, coilTop, topGlowRadius, 0, Math.PI * 2);
  ctx.fill();

  // === PULSING RINGS (at higher charge levels) ===
  if (progress > 0.5) {
    const ringProgress = (progress - 0.5) / 0.5;
    const ringCount = 2;

    for (let i = 0; i < ringCount; i++) {
      const ringPhase = ((time * 2 + i * 0.5) % 1);
      const ringRadius = cellSize * 0.2 * (1 + ringPhase * 0.5);
      const ringAlpha = ringProgress * (1 - ringPhase) * 0.4;

      ctx.strokeStyle = `rgba(150, 200, 255, ${ringAlpha})`;
      ctx.lineWidth = 2 * (1 - ringPhase);
      ctx.beginPath();
      ctx.arc(centerX, coilTop - cellSize * 0.05, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

// Singleton instance for global access
export const stormChargingManager = new StormChargingManager();

export default createStormEffectSprite;
