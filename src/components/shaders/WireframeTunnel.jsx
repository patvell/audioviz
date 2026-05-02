import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { getAudioData } from '../../hooks/useAudio';
import { useAppStore } from '../../store/useAppStore';
import * as THREE from 'three';

export const WireframeTunnel = ({ active }) => {
  const groupRef = useRef();
  const opacityMultiplierRef = useRef(0);
  const color = useAppStore(state => state.color);

  const ringCount = 40;
  
  useFrame((state) => {
    const audio = getAudioData();
    if (!groupRef.current) return;

    // Smoothly interpolate the master opacity multiplier for fading in/out
    const targetOpacity = active ? (0.05 + audio.volume * 0.95) : 0.0;
    opacityMultiplierRef.current += (targetOpacity - opacityMultiplierRef.current) * 0.005;
    
    groupRef.current.visible = opacityMultiplierRef.current > 0.005;

    if (!groupRef.current.visible) return; // Skip updating if hidden

    groupRef.current.children.forEach((ring, i) => {
      // Time variable offset by index for a wave effect
      const t = state.clock.elapsedTime * 3.0 - i * 0.15;
      
      // Move rings towards the camera continuously
      // Speed increases with bass (lows)
      ring.position.z += 0.05 + audio.lows * 0.3;
      if (ring.position.z > 2) {
        ring.position.z -= (ringCount * 0.5); // Reset to back of tunnel
      }

      // React to audio - Mids cause scale spikes
      const scaleBase = 1 + Math.sin(t) * 0.05;
      const spike = audio.mids * 1.5;
      
      // Calculate overall loudness
      const loudness = Math.min(1.0, (audio.lows + audio.mids + audio.highs) / 1.5);
      
      // Reduce scale overall if it's very quiet
      const targetScale = (scaleBase + spike) * (0.8 + loudness * 0.2);
      
      // Smooth interpolation
      ring.scale.setScalar(ring.scale.x + (targetScale - ring.scale.x) * 0.1);
      
      // Rotation jitter based on highs
      ring.rotation.z += 0.02 + audio.highs * 0.3;
      ring.rotation.x = Math.sin(t * 0.5) * 0.2 + (Math.random() - 0.5) * audio.highs * 0.5;
      ring.rotation.y = Math.cos(t * 0.5) * 0.2 + (Math.random() - 0.5) * audio.highs * 0.5;
      
      // Update color dynamicly based on global color and audio
      // Lerp to the target color for smooth transitions (slower for Auto Color effect)
      ring.material.color.lerp(new THREE.Color(color), 0.01);
      
      // Dynamic opacity: weak when quiet, strong when loud, multiplied by active fade
      const baseOpacity = Math.max(0.01, 1 - i / ringCount);
      ring.material.opacity = baseOpacity * (0.1 + loudness * 0.9) * opacityMultiplierRef.current;

      // Brighten on highs
      if (audio.highs > 0.4) {
        ring.material.color.lerp(new THREE.Color(0xffffff), audio.highs * 0.5);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: ringCount }).map((_, i) => (
        <mesh key={i} position={[0, 0, -i * 0.5]}>
          {/* Jagged geometry: using few tubular segments and radial segments */}
          <torusGeometry args={[2, 0.02, 4, 16]} />
          <meshBasicMaterial 
            transparent 
            opacity={Math.max(0.05, 1 - i / ringCount)} 
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
};
