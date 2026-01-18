// Rapid Fire Effect Sprite - Visual effect for rapid firing weapons
// Shows heat shimmer, beam flicker, and spark particles

import type { Point } from '../../game/types';
import type { SpriteRenderContext } from '../types';

// Color configuration for rapid fire effect
const RAPID_FIRE_COLORS = {
  heat: '255, 200, 100',
  heatCore: '255, 255, 200',
  spark: '#ffdd44',
  sparkCore: '#ffffff',
  beam: '255, 180, 80',
  beamCore: '255, 240, 200',
};

// Seeded random for deterministic effects
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Spark particle data
interface Spark {
  angle: number;
  speed: number;
  size: number;
  lifetime: number;
  delay: number;
}

// Beam trace data
interface BeamTrace {
  offsetAngle: number;
  intensity: number;
  flickerPhase: number;
}

function generateSparks(count: number, seed: number): Spark[] {
  const sparks: Spark[] = [];
  for (let i = 0; i < count; i++) {
    // Sparks primarily go forward/upward with some spread
    const baseAngle = -Math.PI / 2; // Upward direction
    const spread = (seededRandom(seed + i * 100) - 0.5) * Math.PI * 0.8;
    sparks.push({
      angle: baseAngle + spread,
      speed: 0.5 + seededRandom(seed + i * 200) * 1.0,
      size: 1 + seededRandom(seed + i * 300) * 2,
      lifetime: 0.3 + seededRandom(seed + i * 400) * 0.4,
      delay: seededRandom(seed + i * 500) * 0.5,
    });
  }
  return sparks;
}

function generateBeamTraces(count: number, seed: number): BeamTrace[] {
  const traces: BeamTrace[] = [];
  for (let i = 0; i < count; i++) {
    traces.push({
      offsetAngle: (seededRandom(seed + i * 100) - 0.5) * 0.1,
      intensity: 0.4 + seededRandom(seed + i * 200) * 0.6,
      flickerPhase: seededRandom(seed + i * 300) * Math.PI * 2,
    });
  }
  return traces;
}

export interface RapidFireEffectSprite {
  draw(
    context: SpriteRenderContext,
    origin: Point,
    target: Point,
    intensity: number // 0-1, how intense the rapid fire is
  ): void;
}

export const RapidFireEffectSprite: RapidFireEffectSprite = {
  draw(
    context: SpriteRenderContext,
    origin: Point,
    target: Point,
    intensity: number
  ): void {
    const { ctx, cellSize, time } = context;

    const originX = origin.x * cellSize + cellSize / 2;
    const originY = origin.y * cellSize + cellSize / 2;
    const targetX = target.x * cellSize + cellSize / 2;
    const targetY = target.y * cellSize + cellSize / 2;

    // Calculate direction to target
    const dx = targetX - originX;
    const dy = targetY - originY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const dirX = distance > 0 ? dx / distance : 0;
    const dirY = distance > 0 ? dy / distance : -1;

    // Clamp intensity
    const clampedIntensity = Math.max(0, Math.min(1, intensity));
    if (clampedIntensity <= 0) return;

    // Generate effects based on time seed
    const seed = Math.floor(time * 10);
    const sparks = generateSparks(12, seed);
    const beamTraces = generateBeamTraces(3, seed);

    ctx.save();

    // ========================================
    // 1. Heat shimmer effect around origin
    // ========================================
    drawHeatShimmer(ctx, originX, originY, cellSize, time, clampedIntensity);

    // ========================================
    // 2. Beam flicker traces to target
    // ========================================
    drawBeamFlicker(
      ctx,
      originX,
      originY,
      targetX,
      targetY,
      dirX,
      dirY,
      distance,
      time,
      clampedIntensity,
      beamTraces
    );

    // ========================================
    // 3. Spark particles
    // ========================================
    drawSparks(ctx, originX, originY, cellSize, time, clampedIntensity, sparks, dirX, dirY);

    // ========================================
    // 4. Muzzle flash
    // ========================================
    drawMuzzleFlash(ctx, originX, originY, cellSize, time, clampedIntensity, dirX, dirY);

    ctx.restore();
  },
};

function drawHeatShimmer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  time: number,
  intensity: number
): void {
  const shimmerRadius = cellSize * 0.3;
  const layers = 4;

  for (let i = 0; i < layers; i++) {
    const layerProgress = i / layers;
    const layerRadius = shimmerRadius * (0.5 + layerProgress * 0.5);

    // Animated distortion
    const wobbleX = Math.sin(time * 15 + i * 2) * cellSize * 0.02 * intensity;
    const wobbleY = Math.cos(time * 12 + i * 1.5) * cellSize * 0.02 * intensity;

    const alpha = (1 - layerProgress) * 0.3 * intensity;

    const gradient = ctx.createRadialGradient(
      x + wobbleX,
      y + wobbleY,
      0,
      x + wobbleX,
      y + wobbleY,
      layerRadius
    );
    gradient.addColorStop(0, `rgba(${RAPID_FIRE_COLORS.heatCore}, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(${RAPID_FIRE_COLORS.heat}, ${alpha * 0.5})`);
    gradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x + wobbleX, y + wobbleY, layerRadius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBeamFlicker(
  ctx: CanvasRenderingContext2D,
  originX: number,
  originY: number,
  targetX: number,
  targetY: number,
  dirX: number,
  dirY: number,
  distance: number,
  time: number,
  intensity: number,
  traces: BeamTrace[]
): void {
  if (distance < 1) return;

  // Perpendicular direction for offset
  const perpX = -dirY;
  const perpY = dirX;

  for (const trace of traces) {
    // Flickering visibility
    const flicker = Math.sin(time * 30 + trace.flickerPhase);
    if (flicker < 0.3) continue; // Skip some frames for flicker effect

    const traceAlpha = trace.intensity * intensity * (0.5 + flicker * 0.5);

    // Offset beam slightly
    const offset = trace.offsetAngle * distance * 0.1;
    const startX = originX + perpX * offset;
    const startY = originY + perpY * offset;
    const endX = targetX + perpX * offset;
    const endY = targetY + perpY * offset;

    // Draw beam layers
    const beamLayers = [
      { width: 4, alpha: 0.2, color: RAPID_FIRE_COLORS.beam },
      { width: 2, alpha: 0.5, color: RAPID_FIRE_COLORS.beam },
      { width: 1, alpha: 1.0, color: RAPID_FIRE_COLORS.beamCore },
    ];

    for (const layer of beamLayers) {
      ctx.strokeStyle = `rgba(${layer.color}, ${traceAlpha * layer.alpha})`;
      ctx.lineWidth = layer.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  // Impact point glow
  const impactFlicker = 0.7 + Math.sin(time * 25) * 0.3;
  const impactRadius = 6 * intensity * impactFlicker;
  const impactGradient = ctx.createRadialGradient(targetX, targetY, 0, targetX, targetY, impactRadius);
  impactGradient.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.8})`);
  impactGradient.addColorStop(0.5, `rgba(${RAPID_FIRE_COLORS.heat}, ${intensity * 0.4})`);
  impactGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

  ctx.fillStyle = impactGradient;
  ctx.beginPath();
  ctx.arc(targetX, targetY, impactRadius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSparks(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  time: number,
  intensity: number,
  sparks: Spark[],
  dirX: number,
  dirY: number
): void {
  const maxDistance = cellSize * 0.5;

  for (const spark of sparks) {
    // Continuous spark emission - cycle based on time
    const cycleTime = ((time * 3 + spark.delay) % spark.lifetime) / spark.lifetime;

    if (cycleTime >= 1) continue;

    // Fade out as spark ages
    const fadeOut = 1 - cycleTime;
    const sparkAlpha = fadeOut * intensity;

    // Move spark in its direction, biased towards firing direction
    const sparkDirX = Math.cos(spark.angle) * 0.7 + dirX * 0.3;
    const sparkDirY = Math.sin(spark.angle) * 0.7 + dirY * 0.3;
    const dist = cycleTime * maxDistance * spark.speed;

    const sparkX = x + sparkDirX * dist;
    const sparkY = y + sparkDirY * dist;
    const sparkSize = spark.size * fadeOut;

    // Spark glow
    const glowGradient = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkSize * 2);
    glowGradient.addColorStop(0, `rgba(255, 255, 200, ${sparkAlpha})`);
    glowGradient.addColorStop(0.5, `rgba(255, 200, 100, ${sparkAlpha * 0.5})`);
    glowGradient.addColorStop(1, 'rgba(255, 150, 50, 0)');

    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, sparkSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Spark core
    ctx.fillStyle = RAPID_FIRE_COLORS.sparkCore;
    ctx.globalAlpha = sparkAlpha;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, sparkSize * 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function drawMuzzleFlash(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  time: number,
  intensity: number,
  dirX: number,
  dirY: number
): void {
  // Rapid flashing muzzle flash
  const flashCycle = (time * 20) % 1;
  const flashIntensity = flashCycle < 0.3 ? (0.3 - flashCycle) / 0.3 : 0;

  if (flashIntensity <= 0) return;

  const flashAlpha = flashIntensity * intensity;
  const flashSize = cellSize * 0.15 * (1 + flashIntensity * 0.5);

  // Position flash slightly in firing direction
  const flashX = x + dirX * cellSize * 0.1;
  const flashY = y + dirY * cellSize * 0.1;

  // Flash glow
  const flashGradient = ctx.createRadialGradient(flashX, flashY, 0, flashX, flashY, flashSize);
  flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
  flashGradient.addColorStop(0.3, `rgba(${RAPID_FIRE_COLORS.heatCore}, ${flashAlpha * 0.8})`);
  flashGradient.addColorStop(0.6, `rgba(${RAPID_FIRE_COLORS.heat}, ${flashAlpha * 0.4})`);
  flashGradient.addColorStop(1, 'rgba(255, 100, 0, 0)');

  ctx.fillStyle = flashGradient;
  ctx.beginPath();
  ctx.arc(flashX, flashY, flashSize, 0, Math.PI * 2);
  ctx.fill();

  // Directional flash burst
  ctx.save();
  ctx.translate(flashX, flashY);
  ctx.rotate(Math.atan2(dirY, dirX));

  const burstLength = flashSize * 1.5;
  const burstWidth = flashSize * 0.3;

  ctx.fillStyle = `rgba(255, 240, 200, ${flashAlpha * 0.6})`;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(burstLength, -burstWidth);
  ctx.lineTo(burstLength * 0.8, 0);
  ctx.lineTo(burstLength, burstWidth);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// ============================================================================
// Rapid Fire Effect Manager - Track active rapid fire states
// ============================================================================

export interface ActiveRapidFireEffect {
  id: string;
  origin: Point;
  target: Point;
  intensity: number;
  lastUpdateTime: number;
}

class RapidFireEffectManager {
  private effects: Map<string, ActiveRapidFireEffect> = new Map();
  private decayRate = 3; // Intensity decay per second when not updated

  /**
   * Update or create a rapid fire effect for an entity.
   * Call this every frame while the entity is rapid firing.
   * @param id - Unique identifier for the firing entity (e.g., tower id)
   * @param origin - Origin position in grid coordinates
   * @param target - Target position in grid coordinates
   * @param intensity - Current firing intensity (0-1)
   * @param time - Current game time in seconds
   */
  update(id: string, origin: Point, target: Point, intensity: number, time: number): void {
    this.effects.set(id, {
      id,
      origin: { x: origin.x, y: origin.y },
      target: { x: target.x, y: target.y },
      intensity: Math.max(0, Math.min(1, intensity)),
      lastUpdateTime: time,
    });
  }

  /**
   * Draw all active rapid fire effects.
   * Automatically decays and removes stale effects.
   */
  drawAll(context: SpriteRenderContext): void {
    const currentTime = context.time;

    for (const [id, effect] of this.effects) {
      const timeSinceUpdate = currentTime - effect.lastUpdateTime;

      // Decay intensity over time if not updated
      const decayedIntensity = effect.intensity - timeSinceUpdate * this.decayRate;

      if (decayedIntensity <= 0) {
        this.effects.delete(id);
        continue;
      }

      RapidFireEffectSprite.draw(context, effect.origin, effect.target, decayedIntensity);
    }
  }

  /**
   * Remove a specific effect.
   */
  remove(id: string): void {
    this.effects.delete(id);
  }

  /**
   * Clear all effects.
   */
  clear(): void {
    this.effects.clear();
  }

  /**
   * Get all active effects.
   */
  getActive(): ActiveRapidFireEffect[] {
    return Array.from(this.effects.values());
  }
}

// Singleton instance
export const rapidFireEffectManager = new RapidFireEffectManager();

export default RapidFireEffectSprite;
