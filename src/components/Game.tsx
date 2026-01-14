import { useRef, useEffect } from 'react';

const FIXED_TIMESTEP = 1000 / 60; // 60 updates per second
const MAX_FRAME_TIME = 250; // Prevent spiral of death

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    let accumulator = 0;

    function update(dt: number) {
      void dt; // Will be used for game state updates
    }

    function render(interpolation: number) {
      void interpolation; // Will be used for smooth rendering
      void ctx; // Canvas context captured from closure
    }

    function gameLoop(currentTime: number) {
      let frameTime = currentTime - lastTime;
      lastTime = currentTime;

      // Clamp frame time to prevent spiral of death
      if (frameTime > MAX_FRAME_TIME) {
        frameTime = MAX_FRAME_TIME;
      }

      accumulator += frameTime;

      // Fixed timestep updates
      while (accumulator >= FIXED_TIMESTEP) {
        update(FIXED_TIMESTEP);
        accumulator -= FIXED_TIMESTEP;
      }

      // Interpolation factor for smooth rendering
      const interpolation = accumulator / FIXED_TIMESTEP;
      render(interpolation);

      animationFrameId = requestAnimationFrame(gameLoop);
    }

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} width={800} height={600} style={{ display: 'block' }} />;
}
