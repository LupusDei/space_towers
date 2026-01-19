import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import TowerIcon from './TowerIcon';
import { TowerType } from '../game/types';

// Mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  createRadialGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  fillRect: vi.fn(),
  fillStyle: '',
  beginPath: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  strokeStyle: '',
  lineWidth: 0,
  lineCap: 'butt',
  lineJoin: 'miter',
  globalAlpha: 1,
  shadowColor: '',
  shadowBlur: 0,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  createLinearGradient: vi.fn(() => ({
    addColorStop: vi.fn(),
  })),
  quadraticCurveTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),
  roundRect: vi.fn(),
  clip: vi.fn(),
  strokeRect: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 10 })),
  getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4) })),
  putImageData: vi.fn(),
  drawImage: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as unknown as typeof HTMLCanvasElement.prototype.getContext;

describe('TowerIcon', () => {
  let animationFrameId = 0;
  const animationFrameCallbacks: Map<number, FrameRequestCallback> = new Map();

  beforeEach(() => {
    vi.useFakeTimers();
    animationFrameId = 0;
    animationFrameCallbacks.clear();

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      const id = ++animationFrameId;
      animationFrameCallbacks.set(id, callback);
      return id;
    });

    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
      animationFrameCallbacks.delete(id);
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const runAnimationFrame = () => {
    const callbacks = [...animationFrameCallbacks.entries()];
    animationFrameCallbacks.clear();
    callbacks.forEach(([, callback]) => callback(performance.now()));
  };

  it('should render canvas element', () => {
    const { container } = render(<TowerIcon type={TowerType.LASER} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });

  it('should render with default size of 40', () => {
    const { container } = render(<TowerIcon type={TowerType.LASER} />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.width).toBe(40);
    expect(canvas?.height).toBe(40);
  });

  it('should render with custom size', () => {
    const { container } = render(<TowerIcon type={TowerType.LASER} size={28} />);
    const canvas = container.querySelector('canvas');
    expect(canvas?.width).toBe(28);
    expect(canvas?.height).toBe(28);
  });

  describe('renders all tower types without errors', () => {
    const allTowerTypes = Object.values(TowerType) as TowerType[];

    allTowerTypes.forEach((type) => {
      it(`should render ${type} tower icon`, () => {
        const { container } = render(<TowerIcon type={type} />);
        const canvas = container.querySelector('canvas');
        expect(canvas).toBeTruthy();

        // Trigger animation frame to ensure sprite rendering code runs
        runAnimationFrame();

        // Verify canvas context methods were called (sprite rendering occurred)
        expect(mockContext.clearRect).toHaveBeenCalled();
        expect(mockContext.createRadialGradient).toHaveBeenCalled();
      });
    });
  });

  it('should clean up animation frame on unmount', () => {
    const { unmount } = render(<TowerIcon type={TowerType.LASER} />);

    // Trigger animation frame
    runAnimationFrame();

    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    unmount();

    expect(cancelSpy).toHaveBeenCalled();
  });
});
