import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';

// Mock Three.js before importing the component
vi.mock('three', () => ({
  Scene: class {
    add() {}
  },
  PerspectiveCamera: class {
    position = { z: 0, y: 0 };
    lookAt() {}
  },
  WebGLRenderer: class {
    domElement = document.createElement('canvas');
    setSize() {}
    setPixelRatio() {}
    setClearColor() {}
    render() {}
    dispose() {}
  },
  BufferGeometry: class {
    setAttribute() {}
    getAttribute() {
      return { array: new Float32Array(6000), needsUpdate: false };
    }
    dispose() {}
  },
  BufferAttribute: class {},
  PointsMaterial: class {
    dispose() {}
  },
  Points: class {},
  Color: class {},
}));

// Import component after mock is set up
import DottedSurface from './DottedSurface';

describe('DottedSurface', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders without crashing', () => {
    const { container } = render(<DottedSurface />);
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with default dimensions', () => {
    const { container } = render(<DottedSurface />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('400px');
    expect(div.style.height).toBe('100px');
  });

  it('renders with custom dimensions', () => {
    const { container } = render(<DottedSurface width={500} height={150} />);
    const div = container.firstChild as HTMLElement;
    expect(div.style.width).toBe('500px');
    expect(div.style.height).toBe('150px');
  });

  it('accepts custom color prop', () => {
    expect(() => render(<DottedSurface color="#ff0000" />)).not.toThrow();
  });

  it('accepts custom particleCount prop', () => {
    expect(() => render(<DottedSurface particleCount={1000} />)).not.toThrow();
  });

  it('cleans up on unmount', () => {
    const { unmount } = render(<DottedSurface />);
    expect(() => unmount()).not.toThrow();
  });
});
