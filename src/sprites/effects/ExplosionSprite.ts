// Explosion Effect Sprite - Enemy death explosion with expanding ring and particles

import type { Point } from '../../game/types';
import { EnemyType } from '../../game/types';
import type { EffectSprite, SpriteRenderContext } from '../types';

// Color schemes per enemy type (core, glow, particle colors)
const EXPLOSION_COLORS: Record<string, { core: string; glow: string; particle: string }> = {
  [EnemyType.SCOUT]: { core: '#64b4ff', glow: '100, 180, 255', particle: '#8ad4ff' },
  [EnemyType.FIGHTER]: { core: '#ff6444', glow: '255, 100, 68', particle: '#ff9474' },
  [EnemyType.TANK]: { core: '#44ff64', glow: '68, 255, 100', particle: '#84ff94' },
  [EnemyType.SWARM]: { core: '#b464ff', glow: '180, 100, 255', particle: '#d494ff' },
  [EnemyType.BOSS]: { core: '#ffd464', glow: '255, 212, 100', particle: '#ffe494' },
};

const DEFAULT_COLORS = { core: '#ffffff', glow: '255, 255, 255', particle: '#dddddd' };

// Seeded random for deterministic particle positions
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Particle data for a single explosion instance
interface Particle {
  angle: number;
  speed: number;
  size: number;
  delay: number;
}

function generateParticles(count: number, seed: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      angle: seededRandom(seed + i * 100) * Math.PI * 2,
      speed: 0.5 + seededRandom(seed + i * 200) * 0.8,
      size: 2 + seededRandom(seed + i * 300) * 3,
      delay: seededRandom(seed + i * 400) * 0.15,
    });
  }
  return particles;
}

/**
 * Creates an explosion effect sprite for a specific enemy type.
 * Duration is controlled by the caller via progress (0-1).
 * Designed for ~300ms duration.
 */
export function createExplosionSprite(enemyType: string): EffectSprite {
  const colors = EXPLOSION_COLORS[enemyType] || DEFAULT_COLORS;
  const particleCount = 12;
  // Use a consistent seed per instance for deterministic particles
  let particleSeed = 0;

  return {
    draw(context: SpriteRenderContext, position: Point, progress: number): void {
      const { ctx, cellSize } = context;
      const centerX = position.x * cellSize + cellSize / 2;
      const centerY = position.y * cellSize + cellSize / 2;

      // Generate particles on first frame
      if (progress < 0.01) {
        particleSeed = Math.floor(context.time);
      }
      const particles = generateParticles(particleCount, particleSeed);

      // Easing for smooth expansion
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const fadeOut = 1 - progress;

      const maxRadius = cellSize * 0.6;
      const ringRadius = Math.max(0, easeOut * maxRadius);
      const ringWidth = Math.max(1, (1 - progress) * 4);

      // Outer glow
      if (progress < 0.7) {
        const glowAlpha = (0.7 - progress) * 0.6;
        const glowRadius = ringRadius * 1.5;
        const gradient = ctx.createRadialGradient(
          centerX,
          centerY,
          ringRadius * 0.5,
          centerX,
          centerY,
          glowRadius
        );
        gradient.addColorStop(0, `rgba(${colors.glow}, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Expanding ring
      ctx.strokeStyle = colors.core;
      ctx.globalAlpha = fadeOut;
      ctx.lineWidth = ringWidth;
      ctx.beginPath();
      ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner flash (brief, at start)
      if (progress < 0.3) {
        const flashAlpha = (0.3 - progress) * 2;
        const flashRadius = ringRadius * 0.4;
        const flashGradient = ctx.createRadialGradient(
          centerX,
          centerY,
          0,
          centerX,
          centerY,
          flashRadius
        );
        flashGradient.addColorStop(0, `rgba(255, 255, 255, ${flashAlpha})`);
        flashGradient.addColorStop(0.5, `rgba(${colors.glow}, ${flashAlpha * 0.5})`);
        flashGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flashGradient;
        ctx.beginPath();
        ctx.arc(centerX, centerY, flashRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles flying outward
      ctx.fillStyle = colors.particle;
      for (const particle of particles) {
        // Delay particle appearance
        const particleProgress = Math.max(0, (progress - particle.delay) / (1 - particle.delay));
        if (particleProgress <= 0 || particleProgress >= 1) continue;

        const particleEase = 1 - Math.pow(1 - particleProgress, 2);
        const particleFade = 1 - particleProgress;
        const distance = particleEase * maxRadius * particle.speed;
        const size = particle.size * particleFade;

        const px = centerX + Math.cos(particle.angle) * distance;
        const py = centerY + Math.sin(particle.angle) * distance;

        ctx.globalAlpha = particleFade * fadeOut;
        ctx.beginPath();
        ctx.arc(px, py, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Reset global alpha
      ctx.globalAlpha = 1;
    },
  };
}

// Pre-built explosion sprites for each enemy type
export const ScoutExplosion = createExplosionSprite(EnemyType.SCOUT);
export const FighterExplosion = createExplosionSprite(EnemyType.FIGHTER);
export const TankExplosion = createExplosionSprite(EnemyType.TANK);
export const SwarmExplosion = createExplosionSprite(EnemyType.SWARM);
export const BossExplosion = createExplosionSprite(EnemyType.BOSS);

// Convenience function to get explosion by enemy type
export function getExplosionForEnemy(enemyType: string): EffectSprite {
  return createExplosionSprite(enemyType);
}

// ============================================================================
// Explosion Manager - Track and render active explosions
// ============================================================================

const EXPLOSION_DURATION = 300; // ms

export interface ActiveExplosion {
  id: number;
  position: Point; // In pixels
  enemyType: string;
  startTime: number;
  sprite: EffectSprite;
}

class ExplosionManager {
  private explosions: ActiveExplosion[] = [];
  private nextId = 0;

  /**
   * Spawn an explosion at a position.
   * @param position - Position in pixels (not grid coordinates)
   * @param enemyType - Enemy type for color scheme
   * @param time - Current game time in ms
   */
  spawn(position: Point, enemyType: string, time: number): void {
    this.explosions.push({
      id: this.nextId++,
      position: { x: position.x, y: position.y },
      enemyType,
      startTime: time,
      sprite: createExplosionSprite(enemyType),
    });
  }

  /**
   * Update and draw all active explosions.
   * Removes expired explosions automatically.
   */
  drawAll(context: SpriteRenderContext): void {
    const currentTime = context.time * 1000; // Convert to ms

    // Remove expired explosions and draw active ones
    this.explosions = this.explosions.filter((explosion) => {
      const elapsed = currentTime - explosion.startTime;
      const progress = elapsed / EXPLOSION_DURATION;

      if (progress >= 1) {
        return false; // Remove expired
      }

      // Convert pixel position to grid position for sprite
      const gridPos: Point = {
        x: explosion.position.x / context.cellSize,
        y: explosion.position.y / context.cellSize,
      };

      explosion.sprite.draw(context, gridPos, progress);
      return true;
    });
  }

  clear(): void {
    this.explosions = [];
  }

  getActive(): ActiveExplosion[] {
    return this.explosions;
  }
}

// Singleton instance
export const explosionManager = new ExplosionManager();

export default createExplosionSprite;
