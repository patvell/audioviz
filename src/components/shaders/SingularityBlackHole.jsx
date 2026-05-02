import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

const SingularityMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0xaa00ff),
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

  // Noise function
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
    for (int i = 0; i < 5; ++i) {
      v += a * noise(p);
      p = rot * p * 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    uv.x *= 1.5; // aspect ratio
    
    float dist = length(uv);
    float angle = atan(uv.y, uv.x);
    
    // Black hole event horizon (size reacts to bass) - smoothed multiplier
    float horizonSize = 0.3 + uLows * 0.05;
    
    // Gravitational lensing distortion
    vec2 distortedUv = uv;
    if (dist > horizonSize) {
        // Bend space around the hole
        float bend = horizonSize / dist;
        distortedUv = uv * (1.0 - bend * 0.5 * uLows);
    }
    
    // Accretion disk
    float diskSpeed = uTime * (0.5 + uHighs * 0.5);
    
    // Create swirling gas effect using a continuous spiral transformation
    // This avoids the seam created by atan() wrapping from -pi to pi
    float spiralTwist = 1.5 / (dist + 0.1) - diskSpeed * 2.0;
    float s = sin(spiralTwist);
    float c = cos(spiralTwist);
    mat2 rot = mat2(c, -s, s, c);
    
    vec2 spiralUv = rot * uv * 3.0;
    float gasNoise = fbm(spiralUv);
    
    // The disk is visible just outside the horizon
    float diskShape = smoothstep(horizonSize, horizonSize + 0.1, dist) * 
                      smoothstep(horizonSize + 0.8, horizonSize + 0.2, dist);
                      
    // Brightness reacts to highs and mids heavily
    float diskBrightness = diskShape * gasNoise * (1.0 + uHighs * 5.0 + uMids * 2.0) * 1.5;
    
    // Event horizon is completely black, and the edge is extremely sharp
    float isHole = step(dist, horizonSize);
    
    // Background starfield (distorted by lensing)
    float starNoise = noise(distortedUv * 50.0);
    float stars = pow(starNoise, 20.0) * (1.0 - diskShape);
    
    // Final color with white hot center
    vec3 diskCol = mix(uColor, vec3(1.0), diskBrightness * 0.4);
    vec3 color = mix(vec3(stars), diskCol * diskBrightness, diskBrightness);
    
    // Inner glow (photon sphere)
    float photonSphere = smoothstep(horizonSize - 0.01, horizonSize + 0.04, dist) * 
                         smoothstep(horizonSize + 0.08, horizonSize, dist);
    color += uColor * photonSphere * (1.0 + uHighs * 5.0) * 2.0;
    
    // Deep black inside
    color *= smoothstep(horizonSize, horizonSize + 0.01, dist);

    gl_FragColor = vec4(color, uOpacity);
  }
  `
);

extend({ SingularityMaterial });

export const SingularityBlackHole = ({ active }) => {
  const materialRef = useRef();
  const color = useAppStore(state => state.color);
  
  useFrame((state) => {
    if (!materialRef.current) return;
    const audio = getAudioData();
    materialRef.current.uTime = state.clock.elapsedTime;
    
    // Slower interpolation for lows to prevent jittery bouncing
    materialRef.current.uLows += (audio.lows - materialRef.current.uLows) * 0.05;
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
      <singularityMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};
