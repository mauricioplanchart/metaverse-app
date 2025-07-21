import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { 
  Sky, 
  Environment, 
  Html, 
  Text, 
  Stars,
  Cloud,
  Sparkles,
  MeshDistortMaterial,
  MeshWobbleMaterial,
  MeshReflectorMaterial
} from '@react-three/drei';
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
  Vignette,
  Noise,
  BrightnessContrast,
  HueSaturation
} from '@react-three/postprocessing';
import { AdditiveBlending } from 'three';
import { useMetaverseStore } from '../stores/metaverseStore';
import * as THREE from 'three';
import { 
  FireShaderMaterial, 
  SmokeShaderMaterial, 
  MagicShaderMaterial, 
  HolographicShaderMaterial 
} from './AdvancedShaders';
import { 
  FireParticles, 
  SmokeParticles, 
  MagicParticles, 
  SparkleParticles 
} from './AdvancedParticles';

// Configuration constants
const WORLD_CONFIG = {
  GROUND_SIZE: 200,
  PATH_WIDTH: 6,
  ZONE_SIZE: 40,
  CENTRAL_PLAZA_SIZE: 20,
  CAMERA: {
    FOV: 75,
    MIN_DISTANCE: 2,
    MAX_DISTANCE: 50,
    INITIAL_POSITION: [0, 5, 10] as [number, number, number],
  },
  LIGHTING: {
    AMBIENT_INTENSITY: 0.6,
    DIRECTIONAL_INTENSITY: 1.5,
    SHADOW_MAP_SIZE: 4096,
    SHADOW_CAMERA_FAR: 50,
    SHADOW_CAMERA_LEFT: -20,
    SHADOW_CAMERA_RIGHT: 20,
    SHADOW_CAMERA_TOP: 20,
    SHADOW_CAMERA_BOTTOM: -20,
  },
  POST_PROCESSING: {
    BLOOM_INTENSITY: 1.5,
    BLOOM_THRESHOLD: 0.7,
    BLOOM_SMOOTHING: 0.9,
    CHROMATIC_OFFSET: [0.002, 0.002] as [number, number],
    VIGNETTE_OFFSET: 0.1,
    VIGNETTE_DARKNESS: 0.8,
    BRIGHTNESS: 0.1,
    CONTRAST: 0.1,
    SATURATION: 0.1,
  },
  MOVEMENT: {
    SPEED: 0.5,
    CAMERA_OFFSET_Y: 5,
    CAMERA_OFFSET_Z: 10,
  },
  CONNECTION: {
    TIMEOUT: 2000,
    SERVER_URL: 'http://localhost:3001',
  },
} as const;

// Enhanced Avatar Component with better materials and effects
const Avatar: React.FC<{ position: [number, number, number]; color: string; username: string }> = ({ 
  position, 
  color, 
  username 
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const headRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime) * 0.1;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
    }
  });

  return (
    <group position={position}>
      {/* Avatar body with enhanced material */}
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 2, 16]} />
        <MeshWobbleMaterial 
          color={color} 
          factor={0.1} 
          speed={2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>
      
      {/* Avatar head with distortion effect */}
      <mesh ref={headRef} position={[0, 1.5, 0]} castShadow>
        <sphereGeometry args={[0.4, 32, 32]} />
        <MeshDistortMaterial 
          color={color} 
          distort={0.1} 
          speed={1}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Username label with enhanced styling */}
      <Html position={[0, 2.5, 0]} center>
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-2 rounded-full text-sm whitespace-nowrap backdrop-blur-md shadow-lg border border-white/20">
          {username}
        </div>
      </Html>
      
      {/* Sparkle effect around avatar */}
      <Sparkles 
        count={20} 
        scale={4} 
        size={2} 
        speed={0.3} 
        color={color}
        opacity={0.6}
      />
    </group>
  );
};

// Enhanced Building Component with advanced materials
const Building: React.FC<{ position: [number, number, number]; model: string; size?: number }> = ({ 
  position, 
  size = 1
}) => {
  const buildingRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (buildingRef.current && hovered) {
      buildingRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  return (
    <group 
      ref={buildingRef}
      position={position} 
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Main building structure with reflective material */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[4 * size, 6 * size, 4 * size]} />
        <MeshReflectorMaterial 
          color={hovered ? "#A0522D" : "#8B4513"} 
          roughness={0.1}
          metalness={0.8}
          mirror={0.5}
        />
      </mesh>
      
      {/* Windows with emissive glow */}
      <mesh position={[0, 0, 2.1]} castShadow>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          emissive="#87CEEB" 
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      <mesh position={[0, 2, 2.1]} castShadow>
        <boxGeometry args={[2, 1, 0.1]} />
        <meshStandardMaterial 
          color="#87CEEB" 
          emissive="#87CEEB" 
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {/* Door with enhanced material */}
      <mesh position={[0, -1.5, 2.1]} castShadow>
        <boxGeometry args={[1, 2, 0.1]} />
        <meshStandardMaterial 
          color="#654321" 
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>
      
      {/* Roof with wobble effect */}
      <mesh position={[0, 3.5, 0]} castShadow>
        <coneGeometry args={[3 * size, 1 * size, 8]} />
        <MeshWobbleMaterial 
          color="#654321" 
          factor={0.05}
          speed={1}
        />
      </mesh>
      
      {/* Hover glow effect */}
      {hovered && (
        <Sparkles 
          count={15} 
          scale={6} 
          size={1} 
          speed={0.5} 
          color="#FFD700"
          opacity={0.8}
        />
      )}
    </group>
  );
};

// Enhanced Tree Component with better materials and effects
const Tree: React.FC<{ position: [number, number, number]; model: string; size?: number }> = ({ 
  position, 
  size = 1
}) => {
  const trunkRef = useRef<THREE.Mesh>(null);
  const leavesRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (leavesRef.current) {
      leavesRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      leavesRef.current.position.x = Math.sin(state.clock.elapsedTime * 0.3) * 0.1;
    }
    if (trunkRef.current && hovered) {
      trunkRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  return (
    <group 
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Tree trunk with enhanced material */}
      <mesh ref={trunkRef} castShadow>
        <cylinderGeometry args={[0.3 * size, 0.4 * size, 3 * size, 16]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Tree leaves with distortion effect */}
      <mesh ref={leavesRef} position={[0, 2.5 * size, 0]} castShadow>
        <sphereGeometry args={[1.5 * size, 32, 32]} />
        <MeshDistortMaterial 
          color={hovered ? "#32CD32" : "#228B22"} 
          distort={0.1}
          speed={0.5}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Ambient sparkles around tree */}
      <Sparkles 
        count={10} 
        scale={3} 
        size={1} 
        speed={0.2} 
        color="#90EE90"
        opacity={0.4}
      />
    </group>
  );
};

// Enhanced Fountain Component with particle effects
const Fountain: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const fountainRef = useRef<THREE.Group>(null);
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (fountainRef.current) {
      fountainRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
    if (waterRef.current) {
      waterRef.current.position.y = Math.sin(state.clock.elapsedTime * 3) * 0.1 + 0.5;
    }
  });

  return (
    <group ref={fountainRef} position={position}>
      {/* Base with reflective material */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[2, 2, 0.5, 32]} />
        <MeshReflectorMaterial 
          color="#C0C0C0" 
          roughness={0.1}
          metalness={0.9}
          mirror={0.8}
        />
      </mesh>
      
      {/* Water with enhanced transparency */}
      <mesh ref={waterRef} position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[1.5, 1.5, 0.3, 32]} />
        <meshStandardMaterial 
          color="#4169E1" 
          transparent 
          opacity={0.6}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      {/* Center pillar with wobble effect */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 2, 16]} />
        <MeshWobbleMaterial 
          color="#C0C0C0" 
          factor={0.05}
          speed={1}
        />
      </mesh>
      
      {/* Top decoration with distortion */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[0.5, 32, 32]} />
        <MeshDistortMaterial 
          color="#FFD700" 
          distort={0.1}
          speed={0.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Water particle effects */}
      <Sparkles 
        count={30} 
        scale={4} 
        size={1} 
        speed={0.8} 
        color="#4169E1"
        opacity={0.7}
      />
    </group>
  );
};

// Enhanced Portal Component with advanced effects
const Portal: React.FC<{ position: [number, number, number]; destination: string; color: string }> = ({ 
  position, 
  destination, 
  color 
}) => {
  const portalRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (portalRef.current) {
      portalRef.current.rotation.y = state.clock.elapsedTime * 0.5;
      if (hovered) {
        portalRef.current.scale.setScalar(1.2);
      } else {
        portalRef.current.scale.setScalar(1);
      }
    }
  });

  return (
    <group 
      ref={portalRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Portal ring with enhanced material */}
      <mesh castShadow>
        <torusGeometry args={[2, 0.3, 32, 64]} />
        <MeshDistortMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.8}
          distort={0.2}
          speed={2}
        />
      </mesh>
      
      {/* Portal effect with transparency */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[1.8, 1.8, 0.1, 64]} />
        <meshStandardMaterial 
          color={color} 
          transparent 
          opacity={0.4}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Destination text with enhanced styling */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.3}
        color="#FFFFFF"
        anchorX="center"
        anchorY="middle"
        strokeWidth={0.02}
        strokeColor="#000000"
      >
        {destination}
      </Text>
      
      {/* Portal particle effects */}
      <Sparkles 
        count={50} 
        scale={6} 
        size={2} 
        speed={1} 
        color={color}
        opacity={0.8}
      />
    </group>
  );
};

// Enhanced Crystal Formation with advanced materials
const CrystalFormation: React.FC<{ position: [number, number, number]; color: string }> = ({ 
  position, 
  color 
}) => {
  const crystalRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (crystalRef.current) {
      crystalRef.current.rotation.y = state.clock.elapsedTime * 0.2;
    }
  });

  return (
    <group ref={crystalRef} position={position}>
      {/* Main crystal with distortion */}
      <mesh castShadow>
        <octahedronGeometry args={[1, 0]} />
        <MeshDistortMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.8} 
          transparent 
          opacity={0.9}
          distort={0.3}
          speed={1}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Smaller crystals with wobble */}
      <mesh position={[1.5, 0, 0]} castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        <MeshWobbleMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.5} 
          transparent 
          opacity={0.8}
          factor={0.1}
          speed={2}
        />
      </mesh>
      
      <mesh position={[-1.5, 0, 0]} castShadow>
        <octahedronGeometry args={[0.5, 0]} />
        <MeshWobbleMaterial 
          color={color} 
          emissive={color} 
          emissiveIntensity={0.5} 
          transparent 
          opacity={0.8}
          factor={0.1}
          speed={2}
        />
      </mesh>
      
      {/* Crystal sparkles */}
      <Sparkles 
        count={25} 
        scale={4} 
        size={1.5} 
        speed={0.6} 
        color={color}
        opacity={0.9}
      />
    </group>
  );
};

// Enhanced Waterfall with particle effects
const Waterfall: React.FC<{ position: [number, number, number]; height?: number }> = ({ 
  position, 
  height = 8 
}) => {
  const waterRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (waterRef.current) {
      waterRef.current.position.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group position={position}>
      {/* Waterfall stream with enhanced material */}
      <mesh ref={waterRef} castShadow>
        <boxGeometry args={[2, height, 0.5]} />
        <meshStandardMaterial 
          color="#4169E1" 
          transparent 
          opacity={0.7}
          roughness={0.1}
          metalness={0.8}
        />
      </mesh>
      
      {/* Pool at bottom with reflective material */}
      <mesh position={[0, -height/2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[3, 3, 0.5, 32]} />
        <MeshReflectorMaterial 
          color="#4169E1" 
          transparent 
          opacity={0.5}
          roughness={0.1}
          metalness={0.9}
          mirror={0.6}
        />
      </mesh>
      
      {/* Rocks with enhanced materials */}
      <mesh position={[2, 0, 0]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#696969" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      <mesh position={[-2, 0, 0]} castShadow>
        <dodecahedronGeometry args={[1, 0]} />
        <meshStandardMaterial 
          color="#696969" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      {/* Water particle effects */}
      <Sparkles 
        count={40} 
        scale={6} 
        size={1} 
        speed={1.2} 
        color="#4169E1"
        opacity={0.6}
      />
    </group>
  );
};

// Enhanced Bench Component with advanced materials
const Bench: React.FC<{ position: [number, number, number]; rotation?: number }> = ({ 
  position, 
  rotation = 0 
}) => {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Bench seat with enhanced material */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3, 0.3, 1]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      
      {/* Bench back with distortion effect */}
      <mesh position={[0, 0.8, -0.4]} castShadow>
        <boxGeometry args={[3, 1.6, 0.2]} />
        <MeshDistortMaterial 
          color="#8B4513" 
          distort={0.05}
          speed={0.5}
          roughness={0.6}
          metalness={0.1}
        />
      </mesh>
      
      {/* Bench legs with enhanced materials */}
      <mesh position={[-1.2, -0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.8, 1]} />
        <meshStandardMaterial 
          color="#654321" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
      
      <mesh position={[1.2, -0.4, 0]} castShadow>
        <boxGeometry args={[0.2, 0.8, 1]} />
        <meshStandardMaterial 
          color="#654321" 
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};

// Enhanced Lamp Post Component with advanced effects
const LampPost: React.FC<{ position: [number, number, number] }> = ({ position }) => {
  const lampRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (lampRef.current && lampRef.current.material instanceof THREE.MeshStandardMaterial) {
      lampRef.current.material.emissiveIntensity = Math.sin(state.clock.elapsedTime) * 0.3 + 0.7;
    }
  });

  return (
    <group position={position}>
      {/* Post with enhanced material */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 4, 16]} />
        <meshStandardMaterial 
          color="#696969" 
          roughness={0.7}
          metalness={0.3}
        />
      </mesh>
      
      {/* Lamp with distortion effect */}
      <mesh ref={lampRef} position={[0, 2.5, 0]} castShadow>
        <sphereGeometry args={[0.3, 32, 32]} />
        <MeshDistortMaterial 
          color="#FFD700" 
          emissive="#FFD700" 
          emissiveIntensity={0.7}
          distort={0.1}
          speed={1}
        />
      </mesh>
      
      {/* Light source */}
      <pointLight position={[0, 2.5, 0]} intensity={1} distance={10} color="#FFD700" />
      
      {/* Lamp sparkles */}
      <Sparkles 
        count={15} 
        scale={3} 
        size={1} 
        speed={0.3} 
        color="#FFD700"
        opacity={0.6}
      />
    </group>
  );
};

// Enhanced Interactive Sign Component with advanced effects
const Sign: React.FC<{ position: [number, number, number]; text: string }> = ({ position, text }) => {
  const [hovered, setHovered] = useState(false);
  const signRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (signRef.current && hovered) {
      signRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  return (
    <group 
      ref={signRef}
      position={position}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* Sign post with enhanced material */}
      <mesh castShadow>
        <cylinderGeometry args={[0.1, 0.1, 2, 16]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.6}
          metalness={0.2}
        />
      </mesh>
      
      {/* Sign board with distortion effect */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <boxGeometry args={[2, 1, 0.1]} />
        <MeshDistortMaterial 
          color={hovered ? "#FFD700" : "#F5DEB3"} 
          distort={0.05}
          speed={0.5}
        />
      </mesh>
      
      {/* Text with enhanced styling */}
      <Text
        position={[0, 1.5, 0.06]}
        fontSize={0.2}
        color="#000000"
        anchorX="center"
        anchorY="middle"
        strokeWidth={0.01}
        strokeColor="#FFFFFF"
      >
        {text}
      </Text>
      
      {/* Sign sparkles on hover */}
      {hovered && (
        <Sparkles 
          count={10} 
          scale={3} 
          size={1} 
          speed={0.4} 
          color="#FFD700"
          opacity={0.7}
        />
      )}
    </group>
  );
};

// Enhanced Floating Island Component with advanced effects
const FloatingIsland: React.FC<{ position: [number, number, number]; size?: number }> = ({ 
  position, 
  size = 1 
}) => {
  const islandRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (islandRef.current) {
      islandRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.5 + position[1];
    }
  });

  return (
    <group ref={islandRef} position={position}>
      {/* Island base with enhanced material */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[5 * size, 7 * size, 2, 32]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Grass top with distortion effect */}
      <mesh position={[0, 1, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.5 * size, 4.5 * size, 0.5, 32]} />
        <MeshDistortMaterial 
          color="#90EE90" 
          distort={0.1}
          speed={0.3}
          roughness={0.3}
          metalness={0.1}
        />
      </mesh>
      
      {/* Trees on island */}
      <Tree position={[2, 1, 2]} model="island-tree1" size={0.8} />
      <Tree position={[-2, 1, -2]} model="island-tree2" size={0.6} />
      <Tree position={[0, 1, 3]} model="island-tree3" size={0.7} />
      
      {/* Island sparkles */}
      <Sparkles 
        count={15} 
        scale={8} 
        size={1} 
        speed={0.2} 
        color="#90EE90"
        opacity={0.4}
      />
    </group>
  );
};

// Enhanced Floating Platform with advanced effects
const FloatingPlatform: React.FC<{ position: [number, number, number]; size?: number }> = ({ 
  position, 
  size = 1 
}) => {
  const platformRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (platformRef.current) {
      platformRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.4) * 0.3 + position[1];
    }
  });

  return (
    <group ref={platformRef} position={position}>
      {/* Platform base with reflective material */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[3 * size, 3 * size, 0.5, 16]} />
        <MeshReflectorMaterial 
          color="#C0C0C0" 
          roughness={0.1}
          metalness={0.9}
          mirror={0.7}
        />
      </mesh>
      
      {/* Platform edge with distortion */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <ringGeometry args={[2.5 * size, 3 * size, 16]} />
        <MeshDistortMaterial 
          color="#FFD700" 
          distort={0.1}
          speed={0.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>
      
      {/* Central crystal */}
      <CrystalFormation position={[0, 1, 0]} color="#FF69B4" />
      
      {/* Platform sparkles */}
      <Sparkles 
        count={20} 
        scale={6} 
        size={1} 
        speed={0.4} 
        color="#FFD700"
        opacity={0.7}
      />
    </group>
  );
};

// Enhanced Ground Component with multiple zones and better materials
const Ground: React.FC = () => {
  return (
    <group>
      {/* Main ground - much larger with enhanced material */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.GROUND_SIZE, WORLD_CONFIG.GROUND_SIZE]} />
        <meshStandardMaterial 
          color="#90EE90" 
          roughness={0.8}
          metalness={0.1}
        />
      </mesh>
      
      {/* Central plaza with reflective material */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.CENTRAL_PLAZA_SIZE, WORLD_CONFIG.CENTRAL_PLAZA_SIZE]} />
        <MeshReflectorMaterial 
          color="#D2B48C" 
          roughness={0.3}
          metalness={0.5}
          mirror={0.3}
        />
      </mesh>
      
      {/* Main paths with enhanced materials */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.PATH_WIDTH, WORLD_CONFIG.GROUND_SIZE]} />
        <meshStandardMaterial 
          color="#D2B48C" 
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.GROUND_SIZE, WORLD_CONFIG.PATH_WIDTH]} />
        <meshStandardMaterial 
          color="#D2B48C" 
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      
      {/* Zone areas with enhanced materials */}
      {/* Forest zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WORLD_CONFIG.ZONE_SIZE, -0.4, WORLD_CONFIG.ZONE_SIZE]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.ZONE_SIZE, WORLD_CONFIG.ZONE_SIZE]} />
        <meshStandardMaterial 
          color="#228B22" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Crystal zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-WORLD_CONFIG.ZONE_SIZE, -0.4, WORLD_CONFIG.ZONE_SIZE]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.ZONE_SIZE, WORLD_CONFIG.ZONE_SIZE]} />
        <meshStandardMaterial 
          color="#9370DB" 
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      
      {/* Water zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[WORLD_CONFIG.ZONE_SIZE, -0.4, -WORLD_CONFIG.ZONE_SIZE]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.ZONE_SIZE, WORLD_CONFIG.ZONE_SIZE]} />
        <meshStandardMaterial 
          color="#4169E1" 
          roughness={0.1}
          metalness={0.9}
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Mountain zone */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-WORLD_CONFIG.ZONE_SIZE, -0.4, -WORLD_CONFIG.ZONE_SIZE]} receiveShadow>
        <planeGeometry args={[WORLD_CONFIG.ZONE_SIZE, WORLD_CONFIG.ZONE_SIZE]} />
        <meshStandardMaterial 
          color="#8B4513" 
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
    </group>
  );
};

// Enhanced World Scene with post-processing effects
const WorldScene: React.FC = () => {
  const { worldState, currentUser, updateUserPosition } = useMetaverseStore();
  const { camera } = useThree();

  // Memoize user position updates to prevent unnecessary re-renders
  const handleUserPositionUpdate = useCallback((newPosition: { x: number; y: number; z: number; rotation: number }) => {
    updateUserPosition(newPosition);
  }, [updateUserPosition]);

  // Memoize keyboard handler to prevent recreation on every render
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!currentUser) return;

    const speed = WORLD_CONFIG.MOVEMENT.SPEED;
    const newPosition = { ...currentUser.position };

    switch (event.key) {
      case 'w':
      case 'ArrowUp':
        newPosition.z -= speed;
        break;
      case 's':
      case 'ArrowDown':
        newPosition.z += speed;
        break;
      case 'a':
      case 'ArrowLeft':
        newPosition.x -= speed;
        break;
      case 'd':
      case 'ArrowRight':
        newPosition.x += speed;
        break;
      default:
        return;
    }

    handleUserPositionUpdate(newPosition);
  }, [currentUser, handleUserPositionUpdate]);

  // Follow current user with camera
  useEffect(() => {
    if (currentUser) {
      camera.position.set(
        currentUser.position.x,
        currentUser.position.y + WORLD_CONFIG.MOVEMENT.CAMERA_OFFSET_Y,
        currentUser.position.z + WORLD_CONFIG.MOVEMENT.CAMERA_OFFSET_Z
      );
      camera.lookAt(currentUser.position.x, currentUser.position.y, currentUser.position.z);
    }
  }, [currentUser, camera]);

  // Handle keyboard movement
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Memoize world objects to prevent unnecessary re-renders
  const worldObjects = useMemo(() => {
    return worldState.objects.map((obj) => {
      const key = `${obj.type}-${obj.id}`;
      const position: [number, number, number] = [obj.position.x, obj.position.y, obj.position.z];
      
      switch (obj.type) {
        case 'building':
          return <Building key={key} position={position} model={obj.model || 'default'} size={obj.size} />;
        case 'tree':
          return <Tree key={key} position={position} model={obj.model || 'default'} size={obj.size} />;
        case 'fountain':
          return <Fountain key={key} position={position} />;
        case 'bench':
          return <Bench key={key} position={position} rotation={obj.rotation} />;
        case 'lamp':
          return <LampPost key={key} position={position} />;
        case 'sign':
          return <Sign key={key} position={position} text={obj.text || ''} />;
        case 'portal':
          return <Portal key={key} position={position} destination={obj.destination || ''} color={obj.color || '#3b82f6'} />;
        case 'floatingIsland':
          return <FloatingIsland key={key} position={position} size={obj.size} />;
        case 'crystalFormation':
          return <CrystalFormation key={key} position={position} color={obj.color || '#FF69B4'} />;
        case 'waterfall':
          return <Waterfall key={key} position={position} height={obj.height} />;
        case 'floatingPlatform':
          return <FloatingPlatform key={key} position={position} size={obj.size} />;
        default:
          return null;
      }
    });
  }, [worldState.objects]);

  // Memoize users to prevent unnecessary re-renders
  const users = useMemo(() => {
    return worldState.users.map((user) => (
      <Avatar
        key={user.id}
        position={[user.position.x, user.position.y, user.position.z]}
        color={user.avatar.color}
        username={user.username}
      />
    ));
  }, [worldState.users]);

  return (
    <>
      {/* Enhanced Lighting */}
      <ambientLight intensity={WORLD_CONFIG.LIGHTING.AMBIENT_INTENSITY} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={WORLD_CONFIG.LIGHTING.DIRECTIONAL_INTENSITY}
        castShadow
        shadow-mapSize-width={WORLD_CONFIG.LIGHTING.SHADOW_MAP_SIZE}
        shadow-mapSize-height={WORLD_CONFIG.LIGHTING.SHADOW_MAP_SIZE}
        shadow-camera-far={WORLD_CONFIG.LIGHTING.SHADOW_CAMERA_FAR}
        shadow-camera-left={WORLD_CONFIG.LIGHTING.SHADOW_CAMERA_LEFT}
        shadow-camera-right={WORLD_CONFIG.LIGHTING.SHADOW_CAMERA_RIGHT}
        shadow-camera-top={WORLD_CONFIG.LIGHTING.SHADOW_CAMERA_TOP}
        shadow-camera-bottom={WORLD_CONFIG.LIGHTING.SHADOW_CAMERA_BOTTOM}
      />
      
      {/* Additional point lights for dramatic effect */}
      <pointLight position={[0, 20, 0]} intensity={0.5} color="#FFD700" />
      <pointLight position={[50, 10, 50]} intensity={0.3} color="#FF69B4" />
      <pointLight position={[-50, 10, 50]} intensity={0.3} color="#00CED1" />
      <pointLight position={[50, 10, -50]} intensity={0.3} color="#4169E1" />
      <pointLight position={[-50, 10, -50]} intensity={0.3} color="#9370DB" />
      
      {/* Advanced Particle Effects */}
      <FireParticles position={[0, 0, 0]} count={150} />
      <SmokeParticles position={[0, 0, 0]} count={80} />
      <MagicParticles position={[30, 0, 0]} count={120} />
      <MagicParticles position={[-30, 0, 0]} count={120} />
      <SparkleParticles position={[0, 0, 30]} count={100} />
      <SparkleParticles position={[0, 0, -30]} count={100} />
      
      {/* Advanced Shader Objects */}
      <mesh position={[20, 0, 20]} castShadow>
        <sphereGeometry args={[2, 32, 32]} />
        <FireShaderMaterial />
      </mesh>
      
      <mesh position={[-20, 0, 20]} castShadow>
        <torusGeometry args={[1.5, 0.5, 16, 32]} />
        <MagicShaderMaterial />
      </mesh>
      
      <mesh position={[20, 0, -20]} castShadow>
        <octahedronGeometry args={[1.5, 0]} />
        <HolographicShaderMaterial />
      </mesh>
      
      <mesh position={[-20, 0, -20]} castShadow>
        <cylinderGeometry args={[1, 1, 3, 16]} />
        <SmokeShaderMaterial />
      </mesh>

      {/* Environment */}
      <Sky sunPosition={[100, 20, 100]} />
      <Environment preset="sunset" background={false} />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
      
      {/* Multiple clouds for more realistic sky */}
      <Cloud opacity={0.5} speed={0.4} segments={20} />
      <Cloud opacity={0.3} speed={0.2} segments={15} />
      <Cloud opacity={0.4} speed={0.3} segments={18} />

      {/* Ground and World Objects */}
      <Ground />
      {worldObjects}
      {users}
    </>
  );
};

// Enhanced World3D Component with post-processing effects
const World3D: React.FC = () => {
  const { 
    isConnected, 
    isLoading, 
    error
  } = useMetaverseStore();

  // Remove unused state
  // const [isInitializing, setIsInitializing] = useState(true);

  // Remove duplicate connection logic - Login component handles this
  // useEffect(() => {
  //   const initializeConnection = async () => {
  //     try {
  //       setIsInitializing(true);
  //       connectSocket(WORLD_CONFIG.CONNECTION.SERVER_URL);
  //       // Give some time for connection to establish
  //       setTimeout(() => setIsInitializing(false), WORLD_CONFIG.CONNECTION.TIMEOUT);
  //     } catch (error) {
  //       console.error('Failed to initialize connection:', error);
  //       setIsInitializing(false);
  //     }
  //   };

  //   if (!isConnected) {
  //     initializeConnection();
  //   } else {
  //     setIsInitializing(false);
  //   }
  // }, [isConnected, connectSocket]);

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 z-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <h2 className="text-white text-xl font-bold mb-2">Loading Metaverse</h2>
          <p className="text-blue-200">Initializing 3D world...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <Canvas
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        }}
        shadows
        camera={{ position: WORLD_CONFIG.CAMERA.INITIAL_POSITION, fov: WORLD_CONFIG.CAMERA.FOV }}
      >
        <EffectComposer>
          <Bloom 
            intensity={WORLD_CONFIG.POST_PROCESSING.BLOOM_INTENSITY}
            luminanceThreshold={WORLD_CONFIG.POST_PROCESSING.BLOOM_THRESHOLD}
            luminanceSmoothing={WORLD_CONFIG.POST_PROCESSING.BLOOM_SMOOTHING}
          />
          <ChromaticAberration offset={WORLD_CONFIG.POST_PROCESSING.CHROMATIC_OFFSET} />
          <Vignette eskil={false} offset={WORLD_CONFIG.POST_PROCESSING.VIGNETTE_OFFSET} darkness={WORLD_CONFIG.POST_PROCESSING.VIGNETTE_DARKNESS} />
          <Noise premultiply blendFunction={AdditiveBlending} />
          <BrightnessContrast brightness={WORLD_CONFIG.POST_PROCESSING.BRIGHTNESS} contrast={WORLD_CONFIG.POST_PROCESSING.CONTRAST} />
          <HueSaturation hue={0} saturation={WORLD_CONFIG.POST_PROCESSING.SATURATION} />
        </EffectComposer>

        <WorldScene />

        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={WORLD_CONFIG.CAMERA.MIN_DISTANCE}
          maxDistance={WORLD_CONFIG.CAMERA.MAX_DISTANCE}
        />
      </Canvas>

      {/* Connection Status */}
      <div className="absolute top-4 left-4 z-10">
        <div className={`px-3 py-2 rounded-lg text-sm font-medium ${
          isConnected 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 right-4 z-10 bg-red-500 text-white px-4 py-2 rounded-lg max-w-md">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span className="text-sm">{error}</span>
            <button 
              onClick={() => useMetaverseStore.getState().setError(null)}
              className="ml-2 text-white hover:text-red-200"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default World3D; 