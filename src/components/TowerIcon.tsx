import { useRef, useEffect } from 'react';
import { TowerType, type Tower } from '../game/types';
import type { SpriteRenderContext } from '../sprites/types';
import { LaserTurretSprite } from '../sprites/towers/LaserTurretSprite';
import { MissileBatterySprite } from '../sprites/towers/MissileBatterySprite';
import { TeslaCoilSprite } from '../sprites/towers/TeslaCoilSprite';
import { PlasmaCannonSprite } from '../sprites/towers/PlasmaCannonSprite';
import { GravityTowerSprite } from '../sprites/towers/GravityTowerSprite';
import { StormTowerSprite } from '../sprites/towers/StormTowerSprite';
import { SniperTowerSprite } from '../sprites/towers/SniperTowerSprite';
import { NeedleTowerSprite } from '../sprites/towers/NeedleTowerSprite';
import { GatlingTowerSprite } from '../sprites/towers/GatlingTowerSprite';

// Map tower types to their sprites
const towerSprites: Record<TowerType, typeof LaserTurretSprite> = {
  [TowerType.LASER]: LaserTurretSprite,
  [TowerType.MISSILE]: MissileBatterySprite,
  [TowerType.TESLA]: TeslaCoilSprite,
  [TowerType.CANNON]: PlasmaCannonSprite,
  [TowerType.GRAVITY]: GravityTowerSprite,
  [TowerType.STORM]: StormTowerSprite,
  [TowerType.SNIPER]: SniperTowerSprite,
  [TowerType.NEEDLE]: NeedleTowerSprite,
  [TowerType.GATLING]: GatlingTowerSprite,
};

// Tower type to color mapping for background glow
const towerColors: Record<TowerType, string> = {
  [TowerType.LASER]: '#00FFFF',
  [TowerType.MISSILE]: '#FF6644',
  [TowerType.TESLA]: '#FFFF00',
  [TowerType.CANNON]: '#FF44FF',
  [TowerType.GRAVITY]: '#9944FF',
  [TowerType.STORM]: '#44AAFF',
  [TowerType.SNIPER]: '#44FF44', // Green for sniper
  [TowerType.NEEDLE]: '#FF8800', // Orange glow for rapid-fire needle
  [TowerType.GATLING]: '#FFC864', // Brass/gold glow for gatling
};

interface TowerIconProps {
  type: TowerType;
  size?: number;
}

export default function TowerIcon({ type, size = 40 }: TowerIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create a fake tower for rendering
    const fakeTower: Tower = {
      id: 'icon',
      type,
      position: { x: 0, y: 0 },
      level: 1,
      damage: 0,
      range: 0,
      fireRate: 0,
      lastFired: 0,
      target: null,
      targetPosition: null,
      kills: 0,
      totalDamage: 0,
    };

    let lastTime = performance.now();

    function render(currentTime: number) {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      timeRef.current += dt;

      // Clear canvas with transparent background
      ctx!.clearRect(0, 0, size, size);

      // Add subtle background glow
      const gradient = ctx!.createRadialGradient(
        size / 2, size / 2, 0,
        size / 2, size / 2, size / 2
      );
      gradient.addColorStop(0, `${towerColors[type]}22`);
      gradient.addColorStop(1, 'transparent');
      ctx!.fillStyle = gradient;
      ctx!.fillRect(0, 0, size, size);

      // Create render context
      const renderContext: SpriteRenderContext = {
        ctx: ctx!,
        cellSize: size,
        time: timeRef.current,
      };

      // Draw the tower sprite
      const sprite = towerSprites[type];
      if (sprite) {
        sprite.draw(renderContext, fakeTower);
      }

      animationRef.current = requestAnimationFrame(render);
    }

    animationRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [type, size]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        display: 'block',
      }}
    />
  );
}
