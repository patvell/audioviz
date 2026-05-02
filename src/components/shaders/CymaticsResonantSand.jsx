import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

const CymaticsMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0xffaa00),
    uLows: 0,
    uMids: 0,
    uHighs: 0,
    uOpacity: 0.0,
  },
  // vertex shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader
  `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uLows;
  uniform float uMids;
  uniform float uHighs;
  uniform float uOpacity;
  varying vec2 vUv;

  // Pseudo-random noise for sand particles
  float hash(vec2 p) {
    p = fract(p * vec2(234.34, 435.345));
    p += dot(p, p + 34.23);
    return fract(p.x * p.y);
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.5; // aspect ratio approximation for a typical screen
    
    // Chladni plate math parameters based on audio
    // The resonant frequencies change the geometric patterns
    float m = 3.0 + floor(uMids * 10.0); // mode m
    float n = 2.0 + floor(uLows * 6.0); // mode n
    
    // Add continuous slow shifting
    float t = uTime * 0.2;
    float pi = 3.14159265;
    
    // The Chladni equation
    float chladni = cos(n * pi * uv.x / 2.0) * cos(m * pi * uv.y / 2.0) - 
                    cos(m * pi * uv.x / 2.0) * cos(n * pi * uv.y / 2.0);
    
    // Nodes are where the equation is near zero (sand collects here)
    // Audio highs scatter the sand
    float scatter = uHighs * 0.5;
    float nodeThickness = 0.05 + uHighs * 0.05;
    
    // Add noise to simulate granular sand
    float noise = hash(uv * 500.0 + uTime);
    
    // Distance from node lines
    float dist = abs(chladni);
    
    // Create the sand effect
    float sand = smoothstep(nodeThickness + scatter * noise, nodeThickness * 0.5, dist);
    
    // Background plate
    float distCenter = length(uv);
    float plate = smoothstep(1.5, 1.4, distCenter);
    
    // Dark metallic plate color
    vec3 plateColor = vec3(0.05) * (1.0 - distCenter * 0.5);
    
    // Glowing sand color
    vec3 sandColor = uColor * (1.0 + uHighs * 4.0) * (0.5 + noise * 0.5);
    
    // Mix them
    vec3 color = mix(plateColor, sandColor, sand);
    
    // Vignette
    color *= smoothstep(1.5, 0.5, distCenter);

    gl_FragColor = vec4(color, uOpacity * plate);
  }
  `
);

extend({ CymaticsMaterial });

export const CymaticsResonantSand = ({ active }) => {
  const materialRef = useRef();
  const color = useAppStore(state => state.color);
  
  useFrame((state) => {
    if (!materialRef.current) return;
    const audio = getAudioData();
    materialRef.current.uTime = state.clock.elapsedTime;
    
    // Slower interpolation for modes to prevent flickering
    materialRef.current.uLows += (audio.lows - materialRef.current.uLows) * 0.05;
    materialRef.current.uMids += (audio.mids - materialRef.current.uMids) * 0.05;
    materialRef.current.uHighs += (audio.highs - materialRef.current.uHighs) * 0.1;
    
    materialRef.current.uColor.lerp(new THREE.Color(color), 0.05);

    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    materialRef.current.uOpacity += (targetOpacity - materialRef.current.uOpacity) * 0.005;
    materialRef.current.visible = materialRef.current.uOpacity > 0.005;
  });

  return (
    <mesh>
      <planeGeometry args={[15, 15]} />
      <cymaticsMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};
