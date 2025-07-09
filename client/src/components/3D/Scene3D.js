import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Stars } from '@react-three/drei';
import FloatingCube from './FloatingCube';
import BlockchainCube from './BlockchainCube';
import FallbackScene3D from './FallbackScene3D';

// Error boundary component
class Scene3DErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('React Three Fiber error, falling back to 2D version:', error);
  }

  render() {
    if (this.state.hasError) {
      return <FallbackScene3D variant={this.props.variant} />;
    }

    return this.props.children;
  }
}

const Scene3D = ({ variant = "hero" }) => {
  const [webGLAvailable, setWebGLAvailable] = useState(true);
  
  // Check WebGL availability
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        setWebGLAvailable(!!gl);
      } catch (e) {
        console.warn('WebGL detection failed:', e);
        setWebGLAvailable(false);
      }
    };
    
    checkWebGL();
    
    // Add listener for context lost events
    const handleContextLost = () => {
      console.warn('WebGL context lost, falling back to 2D version');
      setWebGLAvailable(false);
    };
    
    window.addEventListener('webglcontextlost', handleContextLost, false);
    
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
    };
  }, []);
  
  // Render 2D fallback if WebGL is not available
  if (!webGLAvailable) {
    return <FallbackScene3D variant={variant} />;
  }
  
  const renderContent = () => {
    switch (variant) {
      case "hero":
        return (
          <>
            <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade />
            <BlockchainCube position={[0, 0, 0]} />
            <FloatingCube position={[-3, 1, -2]} color="#10B981" scale={0.7} />
            <FloatingCube position={[3, -1, -2]} color="#F59E0B" scale={0.8} />
            <FloatingCube position={[0, 2, -3]} color="#EF4444" scale={0.6} />
            <FloatingCube position={[-2, -2, -1]} color="#8B5CF6" scale={0.9} />
          </>
        );
      case "blockchain":
        return (
          <>
            <BlockchainCube position={[0, 0, 0]} />
            <FloatingCube position={[-2, 0, -1]} color="#4F46E5" scale={0.5} />
            <FloatingCube position={[2, 0, -1]} color="#06B6D4" scale={0.5} />
            <FloatingCube position={[0, 2, -1]} color="#10B981" scale={0.5} />
            <FloatingCube position={[0, -2, -1]} color="#F59E0B" scale={0.5} />
          </>
        );
      default:
        return <FloatingCube position={[0, 0, 0]} />;
    }
  };

  return (
    <Scene3DErrorBoundary variant={variant}>
      <div className="w-full h-full">
        <Suspense fallback={<FallbackScene3D variant={variant} />}>
          <Canvas
            camera={{ position: [0, 0, 8], fov: 75 }}
            style={{ background: 'transparent' }}
            onContextLost={(e) => {
              e.preventDefault();
              console.warn('WebGL context lost in Canvas, falling back to 2D');
              setWebGLAvailable(false);
            }}
          >
            <ambientLight intensity={0.3} />
            <directionalLight position={[10, 10, 5]} intensity={1} />
            <pointLight position={[-10, -10, -10]} intensity={0.5} />
            
            {renderContent()}
            
            <Environment preset="night" />
            <OrbitControls 
              enableZoom={false} 
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
            />
          </Canvas>
        </Suspense>
      </div>
    </Scene3DErrorBoundary>
  );
};

export default Scene3D;
