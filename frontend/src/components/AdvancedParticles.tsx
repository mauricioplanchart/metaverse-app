import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Fire Particle System
export const FireParticles: React.FC<{ position: [number, number, number]; count?: number }> = ({ 
  position, 
  count = 100 
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(null);
  const velocitiesRef = useRef<Float32Array>(null);
  const lifetimesRef = useRef<Float32Array>(null);

  const { positions, velocities, lifetimes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Random position around the fire source
      positions[i * 3] = (Math.random() - 0.5) * 2;
      positions[i * 3 + 1] = Math.random() * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 2;

      // Upward velocity with some randomness
      velocities[i * 3] = (Math.random() - 0.5) * 0.5;
      velocities[i * 3 + 1] = Math.random() * 2 + 1;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

      // Random lifetime
      lifetimes[i] = Math.random();
    }

    return { positions, velocities, lifetimes };
  }, [count]);

  positionsRef.current = positions;
  velocitiesRef.current = velocities;
  lifetimesRef.current = lifetimes;

  useFrame((state) => {
    if (!particlesRef.current || !positionsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      // Update lifetime
      lifetimes[i] += 0.016; // 60fps

      // Reset particle if it's dead
      if (lifetimes[i] > 1.0) {
        positions[i3] = (Math.random() - 0.5) * 2;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = (Math.random() - 0.5) * 2;
        velocities[i3] = (Math.random() - 0.5) * 0.5;
        velocities[i3 + 1] = Math.random() * 2 + 1;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.5;
        lifetimes[i] = 0;
      }

      // Update position
      positions[i3] += velocities[i3] * 0.016;
      positions[i3 + 1] += velocities[i3 + 1] * 0.016;
      positions[i3 + 2] += velocities[i3 + 2] * 0.016;

      // Add some turbulence
      positions[i3] += Math.sin(time * 2 + i) * 0.01;
      positions[i3 + 2] += Math.cos(time * 2 + i) * 0.01;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#ff4400"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

// Smoke Particle System
export const SmokeParticles: React.FC<{ position: [number, number, number]; count?: number }> = ({ 
  position, 
  count = 50 
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(null);
  const velocitiesRef = useRef<Float32Array>(null);
  const lifetimesRef = useRef<Float32Array>(null);

  const { positions, velocities, lifetimes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 3;
      positions[i * 3 + 1] = Math.random() * 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 3;

      velocities[i * 3] = (Math.random() - 0.5) * 0.3;
      velocities[i * 3 + 1] = Math.random() * 0.5 + 0.2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.3;

      lifetimes[i] = Math.random();
    }

    return { positions, velocities, lifetimes };
  }, [count]);

  positionsRef.current = positions;
  velocitiesRef.current = velocities;
  lifetimesRef.current = lifetimes;

  useFrame(() => {
    if (!particlesRef.current || !positionsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      lifetimes[i] += 0.01;

      if (lifetimes[i] > 1.0) {
        positions[i3] = (Math.random() - 0.5) * 3;
        positions[i3 + 1] = 0;
        positions[i3 + 2] = (Math.random() - 0.5) * 3;
        velocities[i3] = (Math.random() - 0.5) * 0.3;
        velocities[i3 + 1] = Math.random() * 0.5 + 0.2;
        velocities[i3 + 2] = (Math.random() - 0.5) * 0.3;
        lifetimes[i] = 0;
      }

      positions[i3] += velocities[i3] * 0.016;
      positions[i3 + 1] += velocities[i3 + 1] * 0.016;
      positions[i3 + 2] += velocities[i3 + 2] * 0.016;

      // Smoke expands as it rises
      const expansion = lifetimes[i] * 0.5;
      positions[i3] += (Math.random() - 0.5) * expansion * 0.01;
      positions[i3 + 2] += (Math.random() - 0.5) * expansion * 0.01;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.2}
        color="#666666"
        transparent
        opacity={0.4}
        blending={THREE.NormalBlending}
        sizeAttenuation
      />
    </points>
  );
};

// Magic Particle System
export const MagicParticles: React.FC<{ position: [number, number, number]; count?: number }> = ({ 
  position, 
  count = 80 
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(null);
  const velocitiesRef = useRef<Float32Array>(null);
  const lifetimesRef = useRef<Float32Array>(null);
  const colorsRef = useRef<Float32Array>(null);

  const { positions, velocities, lifetimes, colors } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;

      velocities[i * 3] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 2;
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 2;

      lifetimes[i] = Math.random();

      // Random magic colors
      const colorChoices = [
        [1, 0, 1],   // Magenta
        [0, 1, 1],   // Cyan
        [1, 1, 0],   // Yellow
        [1, 1, 1],   // White
      ];
      const color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
      colors[i * 3] = color[0];
      colors[i * 3 + 1] = color[1];
      colors[i * 3 + 2] = color[2];
    }

    return { positions, velocities, lifetimes, colors };
  }, [count]);

  positionsRef.current = positions;
  velocitiesRef.current = velocities;
  lifetimesRef.current = lifetimes;
  colorsRef.current = colors;

  useFrame((state) => {
    if (!particlesRef.current || !positionsRef.current || !velocitiesRef.current || !lifetimesRef.current) return;

    const positions = positionsRef.current;
    const velocities = velocitiesRef.current;
    const lifetimes = lifetimesRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      lifetimes[i] += 0.02;

      if (lifetimes[i] > 1.0) {
        positions[i3] = (Math.random() - 0.5) * 4;
        positions[i3 + 1] = (Math.random() - 0.5) * 4;
        positions[i3 + 2] = (Math.random() - 0.5) * 4;
        velocities[i3] = (Math.random() - 0.5) * 2;
        velocities[i3 + 1] = (Math.random() - 0.5) * 2;
        velocities[i3 + 2] = (Math.random() - 0.5) * 2;
        lifetimes[i] = 0;
      }

      // Update position
      positions[i3] += velocities[i3] * 0.016;
      positions[i3 + 1] += velocities[i3 + 1] * 0.016;
      positions[i3 + 2] += velocities[i3 + 2] * 0.016;

      // Add magical spiral motion
      const angle = time * 2 + i * 0.1;
      const radius = 0.5;
      positions[i3] += Math.cos(angle) * radius * 0.01;
      positions[i3 + 2] += Math.sin(angle) * radius * 0.01;

      // Add pulsing effect
      const pulse = Math.sin(time * 3 + i) * 0.1;
      positions[i3 + 1] += pulse;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
};

// Sparkle Particle System
export const SparkleParticles: React.FC<{ position: [number, number, number]; count?: number }> = ({ 
  position, 
  count = 60 
}) => {
  const particlesRef = useRef<THREE.Points>(null);
  const positionsRef = useRef<Float32Array>(null);
  const lifetimesRef = useRef<Float32Array>(null);

  const { positions, lifetimes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const lifetimes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
      lifetimes[i] = Math.random();
    }

    return { positions, lifetimes };
  }, [count]);

  positionsRef.current = positions;
  lifetimesRef.current = lifetimes;

  useFrame((state) => {
    if (!particlesRef.current || !positionsRef.current || !lifetimesRef.current) return;

    const positions = positionsRef.current;
    const lifetimes = lifetimesRef.current;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;

      lifetimes[i] += 0.03;

      if (lifetimes[i] > 1.0) {
        positions[i3] = (Math.random() - 0.5) * 6;
        positions[i3 + 1] = (Math.random() - 0.5) * 6;
        positions[i3 + 2] = (Math.random() - 0.5) * 6;
        lifetimes[i] = 0;
      }

      // Add twinkling effect
      const twinkle = Math.sin(time * 5 + i * 10) * 0.5 + 0.5;
      positions[i3 + 1] += twinkle * 0.01;
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef} position={position}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.9}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}; 