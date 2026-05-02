import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

const KaleidoscopeMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0x00aaff),
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

  vec2 rot(vec2 p, float a) {
    float s = sin(a), c = cos(a);
    return mat2(c, -s, s, c) * p;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    
    // Kaleidoscope effect
    float angle = atan(uv.y, uv.x);
    float radius = length(uv);
    
    // Determine symmetry segments based on mids
    float segments = 6.0 + floor(uMids * 4.0) * 2.0; 
    angle = mod(angle, 3.14159 * 2.0 / segments);
    angle = abs(angle - 3.14159 / segments);
    
    uv = radius * vec2(cos(angle), sin(angle));
    
    // Zoom in with bass
    uv *= 1.0 - uLows * 0.8;
    
    // Fractal math (Julia set style iteration)
    vec2 z = uv;
    float iter = 0.0;
    float maxIter = 20.0;
    
    // Animate the C constant
    vec2 c = vec2(sin(uTime * 0.2) * 0.5, cos(uTime * 0.3) * 0.5);
    
    for(float i = 0.0; i < 20.0; i++) {
        if(length(z) > 4.0) break;
        z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
        // Perturb with audio
        z = rot(z, uHighs * 0.3);
        iter++;
    }
    
    float f = iter / maxIter;
    
    // Color mapping
    vec3 color = uColor * f * (1.0 + uHighs * 3.0);
    
    // Glow in center
    color += uColor * smoothstep(0.3, 0.0, radius) * uLows;
    
    // Vignette
    color *= smoothstep(1.2, 0.5, radius);

    gl_FragColor = vec4(color, uOpacity);
  }
  `
);

extend({ KaleidoscopeMaterial });

export const KaleidoscopeFractal = ({ active }) => {
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
      <kaleidoscopeMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};
