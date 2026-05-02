import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

const AuroraMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0x00ff88),
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

  // Generic 2D noise
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0,0.0)), hash(i + vec2(1.0,0.0)), u.x),
               mix(hash(i + vec2(0.0,1.0)), hash(i + vec2(1.0,1.0)), u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
    for (int i = 0; i < 4; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.5;
    
    vec3 color = vec3(0.0);
    
    // Create multiple overlapping ribbons
    for(float i = 0.0; i < 3.0; i++) {
        // Offset each ribbon in time and space
        float t = uTime * 0.2 + i * 10.0;
        
        // Ribbon base curve
        float curve = sin(uv.x * 2.0 + t) * 0.5;
        
        // Add noise to curve based on audio mids
        float ribbonNoise = fbm(vec2(uv.x * 3.0 + t, t)) * (0.2 + uMids * 1.5);
        curve += ribbonNoise;
        
        // Distance from current pixel to the curve
        float dist = abs(uv.y - curve);
        
        // Thickness reacts to bass
        float thickness = 0.05 + uLows * 0.3 + i * 0.02;
        
        // Ribbon intensity
        float intensity = smoothstep(thickness + 0.1, 0.0, dist);
        
        // Add vertical streaks to ribbons (aurora rays)
        float rays = noise(vec2(uv.x * 10.0 + uv.y * 5.0 - uTime * 2.0, t));
        rays = pow(rays, 3.0) * (0.5 + uHighs * 3.0);
        
        // Shift colors slightly per ribbon
        vec3 ribbonColor = uColor;
        if(i == 1.0) ribbonColor = vec3(uColor.y, uColor.z, uColor.x); // simple shift
        if(i == 2.0) ribbonColor = mix(uColor, vec3(1.0), 0.2); // whiter
        
        // Combine ribbon base and rays
        color += ribbonColor * intensity * (0.5 + rays * 2.0);
    }
    
    // Vignette
    float screenDist = length(vUv - 0.5);
    color *= smoothstep(0.8, 0.2, screenDist);

    gl_FragColor = vec4(color, uOpacity);
  }
  `
);

extend({ AuroraMaterial });

export const AuroraLightRibbons = ({ active }) => {
  const materialRef = useRef();
  const color = useAppStore(state => state.color);
  
  useFrame((state) => {
    if (!materialRef.current) return;
    const audio = getAudioData();
    materialRef.current.uTime = state.clock.elapsedTime;
    
    materialRef.current.uLows += (audio.lows - materialRef.current.uLows) * 0.1;
    materialRef.current.uMids += (audio.mids - materialRef.current.uMids) * 0.1;
    materialRef.current.uHighs += (audio.highs - materialRef.current.uHighs) * 0.1;
    
    materialRef.current.uColor.lerp(new THREE.Color(color), 0.05);

    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    materialRef.current.uOpacity += (targetOpacity - materialRef.current.uOpacity) * 0.005;
    materialRef.current.visible = materialRef.current.uOpacity > 0.005;
  });

  return (
    <mesh>
      <planeGeometry args={[15, 15]} />
      <auroraMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};
