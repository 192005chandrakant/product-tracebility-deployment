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
  const [contextLostCount, setContextLostCount] = useState(0);
  const [renderQuality, setRenderQuality] = useState('high');
  
  // Check WebGL availability with improved detection
  useEffect(() => {
    const checkWebGL = () => {
      try {
        const canvas = document.createElement('canvas');
        // Try to get WebGL2 context first (better performance)
        let gl = canvas.getContext('webgl2');
        
        // Fall back to WebGL1
        if (!gl) {
          gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        }
        
        const available = !!gl;
        setWebGLAvailable(available);
        
        // If WebGL is available but potentially weak, use lower quality
        if (available) {
          // Check if device is likely mobile or low-power
          const isMobileBrowser = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
          const isLowMemoryDevice = navigator.deviceMemory && navigator.deviceMemory < 4;
          
          if (isMobileBrowser || isLowMemoryDevice) {
            setRenderQuality('low');
            console.log('Setting lower render quality for mobile/low-power device');
          }
        } else {
          console.warn('WebGL not available on this device or browser');
        }
        
        // Clean up WebGL context
        if (gl && gl.getExtension('WEBGL_lose_context')) {
          gl.getExtension('WEBGL_lose_context').loseContext();
        }
      } catch (e) {
        console.warn('WebGL detection failed:', e);
        setWebGLAvailable(false);
      }
    };
    
    checkWebGL();
    
    // Add listener for context lost events
    const handleContextLost = (e) => {
      e.preventDefault(); // This allows the context to be restored
      setContextLostCount(prev => prev + 1);
      console.warn('WebGL context lost, attempting to recover');
      
      // Only fall back to 2D if we've lost context multiple times
      if (contextLostCount > 1) {
        console.warn('Multiple WebGL context losses detected, falling back to 2D version');
        setWebGLAvailable(false);
      } else {
        // Try reducing quality first before giving up
        setRenderQuality('low');
      }
    };
    
    // Add listener for context restored events
    const handleContextRestored = () => {
      console.log('WebGL context restored successfully');
    };
    
    window.addEventListener('webglcontextlost', handleContextLost, false);
    window.addEventListener('webglcontextrestored', handleContextRestored, false);
    
    return () => {
      window.removeEventListener('webglcontextlost', handleContextLost);
      window.removeEventListener('webglcontextrestored', handleContextRestored);
    };
  }, [contextLostCount]);
  
  // Render 2D fallback if WebGL is not available
  if (!webGLAvailable) {
    return <FallbackScene3D variant={variant} />;
  }
  
  // Adjust rendering settings based on quality
  const renderSettings = {
    dpr: renderQuality === 'low' ? 1 : Math.min(window.devicePixelRatio, 2),
    frameloop: renderQuality === 'low' ? 'demand' : 'always',
    shadows: renderQuality !== 'low',
    performance: { min: renderQuality === 'low' ? 0.1 : 0.5 }
  };

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
            {...renderSettings}
            gl={{ 
              antialias: webGLAvailable,
              alpha: true,
              preserveDrawingBuffer: false,
              powerPreference: "high-performance"
            }}
            onCreated={(state) => {
              // Setup WebGL context loss handling
              if (state && state.gl && state.gl.domElement) {
                const canvas = state.gl.domElement;
                
                canvas.addEventListener('webglcontextlost', (e) => {
                  e.preventDefault(); // Important: This allows the context to be restored
                  console.warn('WebGL context lost in Canvas, attempting to recover');
                  
                  // Only fall back to 2D after multiple failures
                  if (contextLostCount > 2) {
                    console.warn('Multiple WebGL context losses, falling back to 2D version');
                    setWebGLAvailable(false);
                  } else {
                    setContextLostCount(prev => prev + 1);
                  }
                });
                
                canvas.addEventListener('webglcontextrestored', () => {
                  console.log('WebGL context restored in Canvas');
                  // Reset context lost count on successful restore
                  setContextLostCount(0);
                });
              }
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
