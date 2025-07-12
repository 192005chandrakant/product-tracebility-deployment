import React, { Suspense, memo, useCallback, useMemo, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import FloatingCube from './FloatingCube';

const FloatingCubeWrapper = memo(({ 
  size = 1, 
  position = [0, 0, 0], 
  color = "#4F46E5", 
  className = "w-16 h-16",
  enableAnimation = true
}) => {
  const [webGLFailed, setWebGLFailed] = useState(false);

  // Check WebGL availability on mount
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setWebGLFailed(!gl);
    } catch (e) {
      console.warn('WebGL not available:', e.message);
      setWebGLFailed(true);
    }
  }, []);
  // Memoize camera configuration for performance
  const cameraConfig = useMemo(() => ({
    position: [0, 0, 4],
    fov: 50
  }), []);

  // Memoize canvas props for performance
  const canvasProps = useMemo(() => ({
    camera: cameraConfig,
    style: { background: 'transparent' },
    dpr: Math.min(window.devicePixelRatio, 2), // Limit DPR for performance
    performance: { min: 0.5, max: 1 }, // Adaptive performance
    frameloop: enableAnimation ? 'always' : 'demand', // Only animate when needed
    shadows: false, // Disable shadows for better performance
    flat: true, // Disable tone mapping for performance
    legacy: false, // Use modern rendering pipeline
    onCreated: (state) => {
      // Setup error handling for WebGL context loss
      if (state && state.gl && state.gl.domElement) {
        const canvas = state.gl.domElement;
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          console.warn('WebGL context lost, switching to fallback rendering');
          // Prevent console flooding with warnings
          if (!webGLFailed) {
            setWebGLFailed(true);
          }
        });
        
        // Try to restore context when possible
        canvas.addEventListener('webglcontextrestored', (e) => {
          console.log('WebGL context restored');
          setWebGLFailed(false);
        });
      }
    }
  }), [cameraConfig, enableAnimation, webGLFailed]);

  // Error boundary fallback
  const ErrorFallback = useCallback(() => (
    <div className={`${className} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
  ), [className]);

  return (
    <div className={className}>
      {webGLFailed ? (
        <ErrorFallback />
      ) : (
        <Canvas {...canvasProps}>
          <Suspense fallback={null}>
            {/* Optimized lighting setup */}
            <ambientLight intensity={0.4} />
            <directionalLight 
              position={[2, 2, 2]} 
              intensity={0.6}
              castShadow={false} // Disable shadows for performance
            />
            <FloatingCube 
              position={position} 
              color={color} 
              scale={size}
              enableAnimation={enableAnimation}
            />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
});

FloatingCubeWrapper.displayName = 'FloatingCubeWrapper';

export default FloatingCubeWrapper;
