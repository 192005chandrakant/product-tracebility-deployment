import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const BlockchainCube = ({ position }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.005;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.2;
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

export default BlockchainCube;
