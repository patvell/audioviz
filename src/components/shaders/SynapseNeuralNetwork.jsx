import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAppStore } from '../../store/useAppStore';
import { getAudioData } from '../../hooks/useAudio';

export const SynapseNeuralNetwork = ({ active }) => {
  const pointsRef = useRef();
  const linesRef = useRef();
  const groupRef = useRef();
  const color = useAppStore(state => state.color);

  // Generate random nodes and connect close ones
  const { positions, linePositions } = useMemo(() => {
    const nodeCount = 300;
    const pos = new Float32Array(nodeCount * 3);
    const nodes = [];

    for (let i = 0; i < nodeCount; i++) {
      const x = (Math.random() - 0.5) * 15;
      const y = (Math.random() - 0.5) * 15;
      const z = (Math.random() - 0.5) * 15;
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
      nodes.push(new THREE.Vector3(x, y, z));
    }

    // Connect nodes within a certain distance
    const lPos = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 3.0) {
          lPos.push(
            nodes[i].x, nodes[i].y, nodes[i].z,
            nodes[j].x, nodes[j].y, nodes[j].z
          );
        }
      }
    }

    return { 
      positions: pos, 
      linePositions: new Float32Array(lPos) 
    };
  }, []);

  const uniforms = useRef({
    uTime: { value: 0 },
    uColor: { value: new THREE.Color(0x00ff88) },
    uLows: { value: 0 },
    uMids: { value: 0 },
    uHighs: { value: 0 },
    uOpacity: { value: 0.0 }
  });

  useFrame((state) => {
    if (!pointsRef.current || !linesRef.current) return;
    const audio = getAudioData();
    const time = state.clock.elapsedTime;
    
    uniforms.current.uTime.value = time;
    uniforms.current.uLows.value += (audio.lows - uniforms.current.uLows.value) * 0.1;
    uniforms.current.uMids.value += (audio.mids - uniforms.current.uMids.value) * 0.1;
    uniforms.current.uHighs.value += (audio.highs - uniforms.current.uHighs.value) * 0.1;
    
    uniforms.current.uColor.value.lerp(new THREE.Color(color), 0.05);

    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    uniforms.current.uOpacity.value += (targetOpacity - uniforms.current.uOpacity.value) * 0.005;
    if (groupRef.current) {
      groupRef.current.visible = uniforms.current.uOpacity.value > 0.005;
    }

    // Slowly rotate the whole network
    if (groupRef.current) {
        groupRef.current.rotation.y = time * 0.05;
        groupRef.current.rotation.z = time * 0.02;
    }
  });

  // Custom shader for points to make them pulse
  const pointShader = useMemo(() => new THREE.ShaderMaterial({
    uniforms: uniforms.current,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      uniform float uLows;
      uniform float uHighs;
      varying float vActivity;
      
      void main() {
        vec3 pos = position;
        // Nodes pulse based on their position and time
        vActivity = sin(pos.x * 2.0 + uTime * 5.0) * cos(pos.y * 2.0 + uTime * 4.0);
        
        // Push outwards on bass
        vec3 dir = normalize(pos);
        pos += dir * uLows * 0.5 * max(0.0, vActivity);

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        
        // Size reacts to highs and activity
        gl_PointSize = (15.0 + uHighs * 20.0 * max(0.0, vActivity)) * (1.0 / -mvPosition.z);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      varying float vActivity;
      
      void main() {
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        
        float alpha = smoothstep(0.5, 0.1, d);
        // Brighten active nodes
        vec3 col = uColor * (1.0 + max(0.0, vActivity) * 2.0);
        
        gl_FragColor = vec4(col, alpha * uOpacity);
      }
    `
  }), []);

  // Custom shader for lines to make "signals" travel along them
  const lineShader = useMemo(() => new THREE.ShaderMaterial({
    uniforms: uniforms.current,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      uniform float uTime;
      uniform float uLows;
      varying vec3 vPos;
      
      void main() {
        vec3 pos = position;
        vPos = pos;
        
        // Bulge lines on bass
        vec3 dir = normalize(pos);
        pos += dir * uLows * 0.5 * sin(pos.x * 2.0 + uTime * 5.0);

        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform float uTime;
      uniform float uMids;
      varying vec3 vPos;
      
      void main() {
        // Create pulses of light traveling along the lines
        float pulse = sin(vPos.x * 4.0 + vPos.y * 4.0 - uTime * 10.0);
        float intensity = 0.2 + (max(0.0, pulse) * uMids * 2.0);
        
        gl_FragColor = vec4(uColor * intensity, intensity * uOpacity * 0.5);
      }
    `
  }), []);

  return (
    <group ref={groupRef}>
      <points ref={pointsRef} material={pointShader}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
        </bufferGeometry>
      </points>
      <lineSegments ref={linesRef} material={lineShader}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={linePositions.length / 3} array={linePositions} itemSize={3} />
        </bufferGeometry>
      </lineSegments>
    </group>
  );
};
