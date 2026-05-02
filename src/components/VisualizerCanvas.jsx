import { useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

import { useAppStore } from '../store/useAppStore';
import { updateAudioData, getAudioData } from '../hooks/useAudio';

// Shaders
import { LiquidShaderMaterial } from './shaders/LiquidShaderMaterial';
import { WireframeTunnel } from './shaders/WireframeTunnel';
import { NebulaParticleSwarm } from './shaders/NebulaParticleSwarm';
import { SynthwaveRetroGrid } from './shaders/SynthwaveRetroGrid';
import { KaleidoscopeFractal } from './shaders/KaleidoscopeFractal';
import { SynapseNeuralNetwork } from './shaders/SynapseNeuralNetwork';
import { CymaticsResonantSand } from './shaders/CymaticsResonantSand';
import { SingularityBlackHole } from './shaders/SingularityBlackHole';
import { PrismVoronoiGlass } from './shaders/PrismVoronoiGlass';
import { AuroraLightRibbons } from './shaders/AuroraLightRibbons';

// Register the custom shader material for React Three Fiber
extend({ LiquidShaderMaterial });

// Simple component to update the global audio data inside the requestAnimationFrame loop
const AudioUpdater = () => {
  useFrame(() => {
    updateAudioData();
  });
  return null;
};

const LiquidPlane = ({ active }) => {
  const materialRef = useRef();
  const color = useAppStore(state => state.color);
  
  useFrame((state) => {
    if (!materialRef.current) return;
    const audio = getAudioData();
    materialRef.current.uTime = state.clock.elapsedTime;
    
    // Smoothly interpolate audio uniforms
    materialRef.current.uLows += (audio.lows - materialRef.current.uLows) * 0.1;
    materialRef.current.uMids += (audio.mids - materialRef.current.uMids) * 0.1;
    materialRef.current.uHighs += (audio.highs - materialRef.current.uHighs) * 0.1;
    
    // Slower, smoother interpolation for color transitions
    materialRef.current.uColor.lerp(new THREE.Color(color), 0.01);

    // Smoothly crossfade opacity based on active preset and master volume
    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    materialRef.current.uOpacity += (targetOpacity - materialRef.current.uOpacity) * 0.005;
    materialRef.current.visible = materialRef.current.uOpacity > 0.005;
  });

  return (
    <mesh>
      {/* Plane that covers the screen. A 10x10 is large enough to cover fov 75 at z=3 */}
      <planeGeometry args={[15, 15]} />
      <liquidShaderMaterial ref={materialRef} transparent={true} blending={THREE.AdditiveBlending} depthWrite={false} />
    </mesh>
  );
};

export const VisualizerCanvas = () => {
  const preset = useAppStore(state => state.preset);

  return (
    <Canvas
      camera={{ position: [0, 0, 3], fov: 75 }}
      style={{ position: 'absolute', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}
      gl={{ antialias: true, alpha: false }}
    >
      <color attach="background" args={['#020202']} />
      <AudioUpdater />
      
      {/* Render all components, they internally handle their opacity based on active state */}
      <LiquidPlane active={preset === 'liquid'} />
      <WireframeTunnel active={preset === 'wireframe'} />
      <NebulaParticleSwarm active={preset === 'nebula'} />
      <SynthwaveRetroGrid active={preset === 'synthwave'} />
      <KaleidoscopeFractal active={preset === 'kaleidoscope'} />
      <SynapseNeuralNetwork active={preset === 'synapse'} />
      <CymaticsResonantSand active={preset === 'cymatics'} />
      <SingularityBlackHole active={preset === 'singularity'} />
      <PrismVoronoiGlass active={preset === 'prism'} />
      <AuroraLightRibbons active={preset === 'aurora'} />

      <EffectComposer>
        <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} intensity={1.5} />
      </EffectComposer>
    </Canvas>
  );
};
