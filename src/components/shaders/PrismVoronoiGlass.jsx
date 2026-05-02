import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

const PrismMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0x00ffcc),
    uLows: 0,
    uMids: 0,
    uHighs: 0,
    uOpacity: 0.0,
    uScroll: 0.0,
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
  uniform float uScroll;
  varying vec2 vUv;

  vec2 hash(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  void main() {
    vec2 uv = vUv * 5.0; // scale
    uv.x *= 1.5; // aspect
    
    vec2 p = floor(uv);
    vec2 f = fract(uv);
    
    float minDist = 1.0;
    vec2 closestCell = vec2(0.0);
    
    // Use uScroll instead of uTime so it stops when quiet
    float timeVar = uScroll * 20.0;
    
    // Find closest voronoi point
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash(p + neighbor);
            
            // Animate point
            float speed = timeVar * 0.5 + uLows * 2.0; // Bass speeds up shift
            point = 0.5 + 0.5 * sin(speed + 6.2831 * point);
            
            vec2 diff = neighbor + point - f;
            float dist = length(diff);
            
            if (dist < minDist) {
                minDist = dist;
                closestCell = p + neighbor;
            }
        }
    }
    
    // Calculate distance to borders for glass effect
    float minBorderDist = 1.0;
    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 neighbor = vec2(float(x), float(y));
            vec2 point = hash(p + neighbor);
            point = 0.5 + 0.5 * sin((timeVar * 0.5 + uLows * 2.0) + 6.2831 * point);
            
            vec2 diff = neighbor + point - f;
            
            if (length(closestCell - (p + neighbor)) > 0.1) {
                // border distance
                vec2 closestDiff = hash(closestCell) - f;
                closestDiff = 0.5 + 0.5 * sin((timeVar * 0.5 + uLows * 2.0) + 6.2831 * hash(closestCell)) + closestCell - p - f;
                
                vec2 dir = normalize(diff - closestDiff);
                float d = dot(0.5 * (diff + closestDiff), dir);
                minBorderDist = min(minBorderDist, d);
            }
        }
    }
    
    // Glass facet color based on cell ID
    float cellHash = hash(closestCell).x;
    
    // Shift hue slightly per cell
    vec3 facetColor = uColor;
    if (cellHash > 0.6) facetColor = mix(uColor, vec3(1.0), 0.3); // add white highlights
    if (cellHash < 0.3) facetColor *= 0.5; // darken some facets
    
    // Audio reaction
    float audioIntensity = uMids + uHighs * 2.0;
    
    // Brighten faces on beat more dramatically
    facetColor += vec3(0.5) * cellHash * audioIntensity * 4.0;
    
    // Dark borders
    float borderThickness = 0.05 + uHighs * 0.05;
    float border = smoothstep(0.0, borderThickness, minBorderDist);
    
    // Add specular highlight based on distance to cell center
    float specular = smoothstep(0.4, 0.0, minDist) * uHighs * 2.0;
    
    vec3 color = facetColor * border + vec3(specular);
    
    // Vignette
    float screenDist = length(vUv - 0.5);
    color *= smoothstep(0.8, 0.2, screenDist);

    gl_FragColor = vec4(color, uOpacity);
  }
  `
);

extend({ PrismMaterial });

export const PrismVoronoiGlass = ({ active }) => {
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

    // Dynamic scroll based entirely on volume (no volume = no movement)
    materialRef.current.uScroll += audio.volume * 0.02;

    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    materialRef.current.uOpacity += (targetOpacity - materialRef.current.uOpacity) * 0.005;
    materialRef.current.visible = materialRef.current.uOpacity > 0.005;
  });

  return (
    <mesh>
      <planeGeometry args={[15, 15]} />
      <prismMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};
