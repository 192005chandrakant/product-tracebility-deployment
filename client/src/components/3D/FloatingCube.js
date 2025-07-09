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

  useFrame((state) => {
    if (meshRef.current && enableAnimation) {
      // Reduced animation frequency for better performance
      const time = state.clock.elapsedTime;
      meshRef.current.rotation.x = time * 0.5;
      meshRef.current.rotation.y = time * 0.5;
      meshRef.current.position.y = position[1] + Math.sin(time * 2) * 0.05;
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={hovered ? scale * 1.1 : scale} // Reduced scale change for smoother animation
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
