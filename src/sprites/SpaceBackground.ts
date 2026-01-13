// Space Background - Starfield with twinkling stars and nebula effects

import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../config';

interface Star {
  x: number;
  y: number;
  size: number;
  brightness: number;
  twinkleSpeed: number;
  twinkleOffset: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
}

const BACKGROUND_COLOR = '#0a0a1a';
const STAR_COUNT = 150;
const TWINKLE_STAR_COUNT = 30;
const NEBULA_COUNT = 3;

let staticCanvas: OffscreenCanvas | null = null;
let twinkleStars: Star[] = [];
let nebulae: Nebula[] = [];
let initialized = false;

function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
}

function initBackground(): void {
  if (initialized) return;

  const random = seededRandom(42);

  // Create static background canvas
  staticCanvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
  const ctx = staticCanvas.getContext('2d');
  if (!ctx) return;

  // Fill background
  ctx.fillStyle = BACKGROUND_COLOR;
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Generate nebulae (drawn first, behind stars)
  nebulae = [];
  for (let i = 0; i < NEBULA_COUNT; i++) {
    nebulae.push({
      x: random() * CANVAS_WIDTH,
      y: random() * CANVAS_HEIGHT,
      radius: 80 + random() * 120,
      color: getNebulaColor(i),
      alpha: 0.03 + random() * 0.04,
    });
  }

  // Draw nebulae to static canvas
  for (const nebula of nebulae) {
    drawNebula(ctx, nebula);
  }

  // Generate and draw static stars
  for (let i = 0; i < STAR_COUNT; i++) {
    const star: Star = {
      x: random() * CANVAS_WIDTH,
      y: random() * CANVAS_HEIGHT,
      size: 0.5 + random() * 1.5,
      brightness: 0.3 + random() * 0.7,
      twinkleSpeed: 0,
      twinkleOffset: 0,
    };
    drawStar(ctx, star, star.brightness);
  }

  // Generate twinkling stars (drawn dynamically)
  twinkleStars = [];
  for (let i = 0; i < TWINKLE_STAR_COUNT; i++) {
    twinkleStars.push({
      x: random() * CANVAS_WIDTH,
      y: random() * CANVAS_HEIGHT,
      size: 1 + random() * 2,
      brightness: 0.5 + random() * 0.5,
      twinkleSpeed: 1 + random() * 3,
      twinkleOffset: random() * Math.PI * 2,
    });
  }

  initialized = true;
}

function getNebulaColor(index: number): string {
  const colors = [
    '80, 60, 120',   // Purple
    '60, 80, 120',   // Blue
    '100, 60, 80',   // Magenta
  ];
  return colors[index % colors.length];
}

function drawNebula(ctx: OffscreenCanvasRenderingContext2D, nebula: Nebula): void {
  const gradient = ctx.createRadialGradient(
    nebula.x, nebula.y, 0,
    nebula.x, nebula.y, nebula.radius
  );
  gradient.addColorStop(0, `rgba(${nebula.color}, ${nebula.alpha})`);
  gradient.addColorStop(0.5, `rgba(${nebula.color}, ${nebula.alpha * 0.5})`);
  gradient.addColorStop(1, `rgba(${nebula.color}, 0)`);

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(nebula.x, nebula.y, nebula.radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(
  ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
  star: Star,
  brightness: number
): void {
  const alpha = Math.max(0.1, Math.min(1, brightness));

  // Star glow
  if (star.size > 1) {
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Star core
  ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
  ctx.fill();

  // Bright center for larger stars
  if (star.size > 1.2) {
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawBackground(ctx: CanvasRenderingContext2D, time: number): void {
  initBackground();

  // Draw static background (stars + nebulae)
  if (staticCanvas) {
    ctx.drawImage(staticCanvas, 0, 0);
  }

  // Draw twinkling stars with animated brightness
  for (const star of twinkleStars) {
    const twinkle = Math.sin(time * star.twinkleSpeed + star.twinkleOffset);
    const brightness = star.brightness * (0.5 + twinkle * 0.5);
    drawStar(ctx, star, brightness);
  }
}

export function resetBackground(): void {
  staticCanvas = null;
  twinkleStars = [];
  nebulae = [];
  initialized = false;
}

export default { drawBackground, resetBackground };
