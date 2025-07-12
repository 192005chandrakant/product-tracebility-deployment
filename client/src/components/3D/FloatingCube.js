import React, { useRef, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';

const FloatingCube = ({ 
  position, 
  color = "#4F46E5", 
  scale = 1, 
  enableAnimation = true 
}) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  // Memoize geometry to prevent recreation
  const geometry = useMemo(() => [1, 1, 1], []);
  
  // Memoize colors to prevent recreation
  const { baseColor, hoverColor } = useMemo(() => ({
    baseColor: color,
    hoverColor: "#06B6D4"
  }), [color]);

  // Use lower frequency animation to improve performance
  useFrame((state) => {
    if (meshRef.current && enableAnimation) {
      try {
        // Use a simpler animation pattern for better performance
        const time = state.clock.elapsedTime * 0.3; // Reduced animation speed
        meshRef.current.rotation.x = time * 0.5;
        meshRef.current.rotation.y = time * 0.5;
        
        // Simpler position animation with less computation
        if (position && position.length === 3) {
          meshRef.current.position.y = position[1] + Math.sin(time) * 0.05;
        }
      } catch (error) {
        // Silently handle any animation errors to prevent crashes
        console.warn('Animation error in FloatingCube:', error.message);
      }
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={hovered ? scale * 1.05 : scale} // Reduced scale change for smoother animation
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={geometry} />
      <meshStandardMaterial 
        color={hovered ? hoverColor : baseColor}
        metalness={0.1}
        roughness={0.6}
      />
    </mesh>
  );
};

export default React.memo(FloatingCube);
