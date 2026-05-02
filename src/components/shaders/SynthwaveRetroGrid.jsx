import { useRef } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

const SynthwaveMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color(0xff00aa),
    uLows: 0,
    uMids: 0,
    uHighs: 0,
    uOpacity: 0.0,
    uScroll: 0.0,
  },
  // vertex shader
  `
  uniform float uTime;
  uniform float uLows;
  uniform float uMids;
  uniform float uScroll;
  varying vec2 vUv;
  varying vec3 vPos;
  
  // basic noise function
  vec3 permute(vec3 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
  float snoise(vec2 v){
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
             -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy) );
    vec2 x0 = v -   i + dot(i, C.xx);
    vec2 i1;
    i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod(i, 289.0);
    vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
    + i.x + vec3(0.0, i1.x, 1.0 ));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
      dot(x12.zw,x12.zw)), 0.0);
    m = m*m ;
    m = m*m ;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;
    
    // Scroll terrain based on the JS-driven scroll uniform
    float scrollSpeed = uScroll * 10.0;
    
    // Create mountain-like height from noise
    float noise1 = snoise(vec2(pos.x * 0.1, pos.y * 0.1 + scrollSpeed));
    float noise2 = snoise(vec2(pos.x * 0.2, pos.y * 0.2 + scrollSpeed * 1.5));
    
    // Create a path down the middle by zeroing out the noise in the center
    float pathDist = abs(pos.x);
    float mountainMask = smoothstep(1.5, 6.0, pathDist);
    
    // Height reacts entirely to bass and mids (becomes flat grid when quiet)
    pos.z = (max(0.0, noise1 * 4.0) + max(0.0, noise2 * 2.0)) * mountainMask * (uLows * 5.0 + uMids * 2.0);
    vPos = pos;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
  `,
  // fragment shader
  `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uHighs;
  uniform float uMids;
  uniform float uScroll;
  varying vec2 vUv;
  varying vec3 vPos;
  
  void main() {
    // Generate grid lines
    float gridLines = 40.0;
    float grid1 = abs(fract(vUv.x * gridLines) - 0.5) * 2.0;
    
    // Scrolling effect on y grid
    float grid2 = abs(fract(vUv.y * gridLines + uScroll * 3.0) - 0.5) * 2.0;
    
    // Line thickness
    float thickness = 0.05 + uHighs * 0.1;
    float line = step(1.0 - thickness, grid1) + step(1.0 - thickness, grid2);
    
    // Make grid glow and fade in distance
    float distanceFade = smoothstep(20.0, 0.0, abs(vPos.y));
    
    // Color vibrance spikes with loud audio
    vec3 color = uColor * line * distanceFade * (1.0 + uHighs * 5.0 + uMids * 3.0);
    
    gl_FragColor = vec4(color, clamp(line * distanceFade * uOpacity, 0.0, uOpacity));
  }
  `
);

extend({ SynthwaveMaterial });

export const SynthwaveRetroGrid = ({ active }) => {
  const materialRef = useRef();
  const color = useAppStore(state => state.color);
  const groupRef = useRef();
  const sunMaterialRef = useRef();

  useFrame((state) => {
    if (!materialRef.current || !sunMaterialRef.current) return;
    const audio = getAudioData();
    materialRef.current.uTime = state.clock.elapsedTime;
    
    materialRef.current.uLows += (audio.lows - materialRef.current.uLows) * 0.1;
    materialRef.current.uMids += (audio.mids - materialRef.current.uMids) * 0.1;
    materialRef.current.uHighs += (audio.highs - materialRef.current.uHighs) * 0.1;
    
    const targetColor = new THREE.Color(color);
    materialRef.current.uColor.lerp(targetColor, 0.05);
    sunMaterialRef.current.color.lerp(targetColor, 0.05);

    // Update dynamic scrolling (hard stop when noise is too low)
    if (audio.volume > 0.005) {
      materialRef.current.uScroll += audio.volume * 0.02;
    }

    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    materialRef.current.uOpacity += (targetOpacity - materialRef.current.uOpacity) * 0.005;
    groupRef.current.visible = materialRef.current.uOpacity > 0.005;
    
    // Pulse the sun with bass more vibrantly
    const sunScale = 1 + (audio.lows * 0.5);
    sunMaterialRef.current.opacity += (targetOpacity * (0.8 + audio.lows * 0.2) - sunMaterialRef.current.opacity) * 0.1;
    
    if (groupRef.current) {
        groupRef.current.children[1].scale.set(sunScale, sunScale, sunScale);
    }
  });

  return (
    <group ref={groupRef} position={[0, -2, -5]} rotation={[-Math.PI / 2.2, 0, 0]}>
      {/* Floor */}
      <mesh position={[0, -10, 0]}>
        <planeGeometry args={[60, 60, 128, 128]} />
        <synthwaveMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Sun */}
      <mesh position={[0, 30, 2]} rotation={[Math.PI / 2.2, 0, 0]}>
        <circleGeometry args={[8, 64]} />
        <meshBasicMaterial ref={sunMaterialRef} color={color} transparent={true} opacity={0} depthWrite={false} />
      </mesh>
    </group>
  );
};
