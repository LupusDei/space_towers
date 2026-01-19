import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DottedSurfaceProps {
  width?: number;
  height?: number;
  color?: string;
  particleCount?: number;
}

export default function DottedSurface({
  width = 400,
  height = 100,
  color = '#00ffff',
  particleCount = 2000,
}: DottedSurfaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animationIdRef = useRef<number>(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 50;
    camera.position.y = 20;
    camera.lookAt(0, 0, 0);

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const originalPositions = new Float32Array(particleCount * 3);

    // Grid of particles
    const gridWidth = 80;
    const gridDepth = 40;
    const cols = Math.ceil(Math.sqrt(particleCount * (gridWidth / gridDepth)));
    const rows = Math.ceil(particleCount / cols);

    for (let i = 0; i < particleCount; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);

      const x = (col / cols - 0.5) * gridWidth;
      const z = (row / rows - 0.5) * gridDepth;
      const y = 0;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      originalPositions[i * 3] = x;
      originalPositions[i * 3 + 1] = y;
      originalPositions[i * 3 + 2] = z;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Parse color
    const threeColor = new THREE.Color(color);

    // Material
    const material = new THREE.PointsMaterial({
      color: threeColor,
      size: 0.5,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true,
    });

    // Points mesh
    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // Animation
    let time = 0;
    const animate = () => {
      time += 0.016;

      const positionAttr = geometry.getAttribute('position');
      const positions = positionAttr.array as Float32Array;

      for (let i = 0; i < particleCount; i++) {
        const x = originalPositions[i * 3];
        const z = originalPositions[i * 3 + 2];

        // Sine wave animation
        const wave1 = Math.sin(x * 0.1 + time * 2) * 2;
        const wave2 = Math.sin(z * 0.15 + time * 1.5) * 1.5;
        const wave3 = Math.sin((x + z) * 0.08 + time * 1.2) * 1;

        positions[i * 3 + 1] = wave1 + wave2 + wave3;
      }

      positionAttr.needsUpdate = true;

      renderer.render(scene, camera);
      animationIdRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      cancelAnimationFrame(animationIdRef.current);
      if (rendererRef.current && container) {
        container.removeChild(rendererRef.current.domElement);
      }
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [width, height, color, particleCount]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        overflow: 'hidden',
      }}
    />
  );
}
