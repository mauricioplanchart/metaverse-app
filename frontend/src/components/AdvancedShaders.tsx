import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, ShaderMaterial, AdditiveBlending, NormalBlending } from 'three';

// Fire Shader Material
export const FireShaderMaterial = React.forwardRef<ShaderMaterial, Record<string, unknown>>((props, ref) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const fireShader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 color1;
      uniform vec3 color2;
      uniform vec3 color3;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // Noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Smooth noise
      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Fractal noise
      float fractalNoise(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
          value += amplitude * smoothNoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        vec2 uv = vUv;
        vec2 p = uv * 4.0 + time * 0.5;
        
        float noise1 = fractalNoise(p);
        float noise2 = fractalNoise(p * 2.0 + time * 0.3);
        float noise3 = fractalNoise(p * 4.0 + time * 0.1);
        
        float fire = noise1 * noise2 * noise3;
        fire = pow(fire, 2.0);
        
        // Fire gradient
        float gradient = 1.0 - uv.y;
        fire *= gradient;
        
        // Color mixing
        vec3 color = mix(color1, color2, fire);
        color = mix(color, color3, fire * 0.5);
        
        // Add glow
        float glow = fire * 0.3;
        color += glow * color3;
        
        gl_FragColor = vec4(color, fire);
      }
    `,
    uniforms: {
      time: { value: 0 },
      color1: { value: new Color(0xff4400) }, // Orange
      color2: { value: new Color(0xff8800) }, // Bright orange
      color3: { value: new Color(0xffff00) }, // Yellow
    },
    transparent: true,
    blending: AdditiveBlending,
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={ref || materialRef}
      attach="material"
      args={[fireShader]}
      {...props}
    />
  );
});

// Smoke Shader Material
export const SmokeShaderMaterial = React.forwardRef<ShaderMaterial, Record<string, unknown>>((props, ref) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const smokeShader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      
      void main() {
        vUv = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 smokeColor;
      varying vec2 vUv;
      varying vec3 vPosition;
      
      // Noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Smooth noise
      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Fractal noise
      float fractalNoise(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 3; i++) {
          value += amplitude * smoothNoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        vec2 uv = vUv;
        vec2 p = uv * 3.0 + time * 0.2;
        
        float noise1 = fractalNoise(p);
        float noise2 = fractalNoise(p * 1.5 + time * 0.1);
        
        float smoke = noise1 * noise2;
        smoke = pow(smoke, 1.5);
        
        // Smoke gradient
        float gradient = 1.0 - uv.y;
        smoke *= gradient;
        
        // Add some variation
        smoke *= 0.8 + 0.2 * sin(time + uv.x * 10.0);
        
        vec3 color = smokeColor * smoke;
        float alpha = smoke * 0.6;
        
        gl_FragColor = vec4(color, alpha);
      }
    `,
    uniforms: {
      time: { value: 0 },
      smokeColor: { value: new Color(0x666666) },
    },
    transparent: true,
    blending: NormalBlending,
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={ref || materialRef}
      attach="material"
      args={[smokeShader]}
      {...props}
    />
  );
});

// Magic Shader Material
export const MagicShaderMaterial = React.forwardRef<ShaderMaterial, Record<string, unknown>>((props, ref) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const magicShader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 magicColor1;
      uniform vec3 magicColor2;
      uniform vec3 magicColor3;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      // Noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      // Smooth noise
      float smoothNoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = noise(i);
        float b = noise(i + vec2(1.0, 0.0));
        float c = noise(i + vec2(0.0, 1.0));
        float d = noise(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }
      
      // Fractal noise
      float fractalNoise(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        float frequency = 1.0;
        
        for(int i = 0; i < 4; i++) {
          value += amplitude * smoothNoise(p * frequency);
          amplitude *= 0.5;
          frequency *= 2.0;
        }
        
        return value;
      }
      
      void main() {
        vec2 uv = vUv;
        vec2 p = uv * 5.0 + time * 0.3;
        
        float noise1 = fractalNoise(p);
        float noise2 = fractalNoise(p * 2.0 + time * 0.2);
        float noise3 = fractalNoise(p * 4.0 + time * 0.1);
        
        float magic = noise1 * noise2 * noise3;
        magic = pow(magic, 1.5);
        
        // Add pulsing effect
        float pulse = 0.5 + 0.5 * sin(time * 2.0);
        magic *= pulse;
        
        // Add wave effect
        float wave = sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time * 0.5);
        magic += wave * 0.2;
        
        // Color mixing
        vec3 color = mix(magicColor1, magicColor2, magic);
        color = mix(color, magicColor3, magic * 0.7);
        
        // Add glow
        float glow = magic * 0.4;
        color += glow * magicColor3;
        
        gl_FragColor = vec4(color, magic);
      }
    `,
    uniforms: {
      time: { value: 0 },
      magicColor1: { value: new Color(0x00ffff) }, // Cyan
      magicColor2: { value: new Color(0xff00ff) }, // Magenta
      magicColor3: { value: new Color(0xffffff) }, // White
    },
    transparent: true,
    blending: AdditiveBlending,
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={ref || materialRef}
      attach="material"
      args={[magicShader]}
      {...props}
    />
  );
});

// Holographic Shader Material
export const HolographicShaderMaterial = React.forwardRef<ShaderMaterial, Record<string, unknown>>((props, ref) => {
  const materialRef = useRef<ShaderMaterial>(null);

  const holographicShader = useMemo(() => ({
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      void main() {
        vUv = uv;
        vPosition = position;
        vNormal = normal;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time;
      uniform vec3 holographicColor;
      varying vec2 vUv;
      varying vec3 vPosition;
      varying vec3 vNormal;
      
      // Noise function
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      void main() {
        vec2 uv = vUv;
        
        // Create scan lines
        float scanLine = sin(uv.y * 100.0 + time * 2.0) * 0.5 + 0.5;
        scanLine = pow(scanLine, 2.0);
        
        // Create interference pattern
        float interference = sin(uv.x * 50.0 + time) * sin(uv.y * 30.0 + time * 0.5);
        interference = interference * 0.5 + 0.5;
        
        // Add noise
        float noiseValue = noise(uv * 10.0 + time * 0.1);
        
        // Combine effects
        float hologram = scanLine * interference * noiseValue;
        hologram = pow(hologram, 1.5);
        
        // Add flicker
        float flicker = 0.8 + 0.2 * sin(time * 10.0);
        hologram *= flicker;
        
        vec3 color = holographicColor * hologram;
        
        // Add edge glow
        float edge = 1.0 - abs(uv.x - 0.5) * 2.0;
        edge = pow(edge, 3.0);
        color += holographicColor * edge * 0.3;
        
        gl_FragColor = vec4(color, hologram * 0.7);
      }
    `,
    uniforms: {
      time: { value: 0 },
      holographicColor: { value: new Color(0x00ffff) },
    },
    transparent: true,
    blending: AdditiveBlending,
  }), []);

  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  return (
    <shaderMaterial
      ref={ref || materialRef}
      attach="material"
      args={[holographicShader]}
      {...props}
    />
  );
}); 