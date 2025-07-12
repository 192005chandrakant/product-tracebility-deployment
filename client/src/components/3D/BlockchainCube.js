import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const BlockchainCube = ({ position }) => {
  const meshRef = useRef();
  
  // Use try-catch in animation frame to prevent crashes
  useFrame((state) => {
    if (meshRef.current) {
      try {
        // Reduce animation frequency for better performance
        const time = state.clock.elapsedTime * 0.3;
        meshRef.current.rotation.x += 0.003;
        meshRef.current.rotation.y += 0.003;
        
        // Simpler position animation with less computation
        if (position && position.length === 3) {
          meshRef.current.position.y = position[1] + Math.sin(time) * 0.1;
        }
      } catch (error) {
        // Silently handle any animation errors
        console.warn('Animation error in BlockchainCube:', error.message);
      }
    }
  });

  return (
    <mesh ref={meshRef} position={position}>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial 
        color="#4F46E5" 
        metalness={0.7} 
        roughness={0.3}
        transparent
        opacity={0.8}
      />
      {/* Inner glowing core */}
      <mesh>
        <boxGeometry args={[0.8, 0.8, 0.8]} />
        <meshStandardMaterial 
          color="#06B6D4" 
          emissive="#06B6D4"
          emissiveIntensity={0.5}
        />
      </mesh>
    </mesh>
  );
};

export default React.memo(BlockchainCube);
