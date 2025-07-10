import React, { useRef, useCallback, Suspense, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaUpload, FaQrcode, FaCamera, FaExclamationTriangle } from 'react-icons/fa';
import jsQR from 'jsqr';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';

// Simple error boundary to prevent crashes from 3D components
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.log('Component error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// Helper function to extract product ID from QR code data
const extractProductId = (qrData) => {
  if (!qrData) return '';
  
  console.log('Extracting product ID from QR data:', qrData);
  
  // If it's a full URL, extract the product ID from the end
  const urlPattern = /\/product\/([^\/\?#]+)/;
  const match = qrData.match(urlPattern);
  
  if (match) {
    const productId = match[1];
    console.log('Extracted product ID from URL:', productId);
    return productId;
  }
  
  // If it's just a product ID (no URL), return as is
  console.log('Using QR data as direct product ID:', qrData);
  return qrData;
};

function QRScan() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [isScanning, setIsScanning] = React.useState(false);
  const [permissionState, setPermissionState] = React.useState('pending'); // 'pending', 'granted', 'denied', 'unavailable'
  
  const fileInputRef = useRef();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);
  
  // Function to stop the camera
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    
    // Clear any scanning animation frame
    if (scanIntervalRef.current) {
      cancelAnimationFrame(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  }, []);
  
  // Function to scan video feed for QR codes - defined before startCamera to avoid circular reference
  const scanVideoForQR = useCallback(() => {
    // Guard clauses to prevent errors
    if (!isScanning) return;
    if (!videoRef.current) {
      console.log('Video reference is null, cannot scan');
      return;
    }
    if (!canvasRef.current) {
      console.log('Canvas reference is null, cannot scan');
      return;
    }
    if (!streamRef.current) {
      console.log('Stream reference is null, cannot scan');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    // Make sure video is playing and has dimensions
    if (!video.readyState || video.readyState < video.HAVE_CURRENT_DATA || !video.videoWidth) {
      // Not ready yet, wait for next frame
      scanIntervalRef.current = requestAnimationFrame(scanVideoForQR);
      return;
    }

    try {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        console.error('Could not get canvas context');
        return;
      }
      
      // Match canvas size to video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Clear canvas for new frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw current video frame to canvas for QR detection
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Get image data for QR processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Try to find QR code in frame with multiple inversion attempts for better detection
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth", // Try both inverted and non-inverted
      });
      
      // Clear canvas again for overlay drawing
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (code && code.data) {
        console.log('QR code found in video:', code.data);
        
        // Draw the found QR code location for visual confirmation
        ctx.beginPath();
        ctx.moveTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        ctx.lineTo(code.location.topRightCorner.x, code.location.topRightCorner.y);
        ctx.lineTo(code.location.bottomRightCorner.x, code.location.bottomRightCorner.y);
        ctx.lineTo(code.location.bottomLeftCorner.x, code.location.bottomLeftCorner.y);
        ctx.lineTo(code.location.topLeftCorner.x, code.location.topLeftCorner.y);
        ctx.lineWidth = 4;
        ctx.strokeStyle = "#00FF00";
        ctx.stroke();
        
        // Add success text
        ctx.font = "24px Arial";
        ctx.fillStyle = "#00FF00";
        ctx.textAlign = "center";
        ctx.fillText("QR Code Detected!", canvas.width / 2, 50);
        
        // Stop scanning
        setIsScanning(false);
        
        // Set result
        setScanResult(code.data);
        
        // Add a short delay before navigation for better user experience
        setTimeout(() => {
          // Extract product ID and navigate
          const productId = extractProductId(code.data);
          console.log('Extracted product ID:', productId);
          
          if (productId) {
            console.log('Navigating to product page:', `/product/${productId}`);
            navigate(`/product/${productId}`);
          } else {
            setError('Invalid QR code format. Could not extract product ID.');
            stopCamera();
          }
        }, 1500);
        
        return;
      } else {
        // Draw scan area guide when no QR is detected
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const size = Math.min(canvas.width, canvas.height) * 0.6;
        
        // Draw scanning frame
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 10]);
        ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
        ctx.setLineDash([]);
        
        // Draw corner markers
        const cornerLength = 30;
        ctx.strokeStyle = "#00BFFF";
        ctx.lineWidth = 4;
        
        // Top-left corner
        ctx.beginPath();
        ctx.moveTo(centerX - size/2, centerY - size/2 + cornerLength);
        ctx.lineTo(centerX - size/2, centerY - size/2);
        ctx.lineTo(centerX - size/2 + cornerLength, centerY - size/2);
        ctx.stroke();
        
        // Top-right corner
        ctx.beginPath();
        ctx.moveTo(centerX + size/2 - cornerLength, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY - size/2);
        ctx.lineTo(centerX + size/2, centerY - size/2 + cornerLength);
        ctx.stroke();
        
        // Bottom-left corner
        ctx.beginPath();
        ctx.moveTo(centerX - size/2, centerY + size/2 - cornerLength);
        ctx.lineTo(centerX - size/2, centerY + size/2);
        ctx.lineTo(centerX - size/2 + cornerLength, centerY + size/2);
        ctx.stroke();
        
        // Bottom-right corner
        ctx.beginPath();
        ctx.moveTo(centerX + size/2 - cornerLength, centerY + size/2);
        ctx.lineTo(centerX + size/2, centerY + size/2);
        ctx.lineTo(centerX + size/2, centerY + size/2 - cornerLength);
        ctx.stroke();
        
        // Add guiding text
        ctx.font = "18px Arial";
        ctx.fillStyle = "#FFFFFF";
        ctx.textAlign = "center";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 4;
        ctx.fillText("Position QR code in frame", centerX, centerY + size/2 + 40);
        ctx.shadowBlur = 0;
      }
      
      // Continue scanning if still in scanning state
      if (isScanning && videoRef.current) {
        scanIntervalRef.current = requestAnimationFrame(scanVideoForQR);
      }
      
    } catch (e) {
      console.error('Error processing video frame:', e);
      // Continue scanning even if there's an error
      if (isScanning && videoRef.current) {
        scanIntervalRef.current = requestAnimationFrame(scanVideoForQR);
      }
    }
  }, [isScanning, stopCamera, navigate]);

  // Function to start the camera - defined after scanVideoForQR to avoid circular reference
  const startCamera = useCallback(async () => {
    try {
      console.log('Starting camera...');
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.error('MediaDevices API or getUserMedia not supported in this browser');
        setPermissionState('unavailable');
        setError('Camera access is not available in this browser. Please use the upload option instead.');
        return;
      }

      // Reset any previous error
      setError(null);
      
      // Ensure we have a video element before proceeding
      if (!videoRef.current) {
        console.error('Video element not available');
        setError('Camera initialization failed - video element not available');
        return;
      }
      
      // Make sure previous streams are properly stopped
      if (streamRef.current) {
        try {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        } catch (err) {
          console.error('Error stopping previous stream:', err);
        }
      }
      
      // First try mobile/rear camera (environment)
      console.log('Attempting to access rear camera first...');
      const constraints = { 
        video: { 
          facingMode: { ideal: 'environment' }, // Use 'ideal' instead of 'exact' for better compatibility
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      };
      
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('Successfully accessed rear/environment camera');
      } catch (mobileErr) {
        console.log('Could not access environment camera, falling back to any camera:', mobileErr);
        // Fallback to any available camera
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 }
            },
            audio: false
          });
          console.log('Successfully accessed fallback camera');
        } catch (fallbackErr) {
          console.error('Both camera access attempts failed:', fallbackErr);
          setPermissionState('denied');
          setError('Camera access was denied. Please check your browser settings and try again.');
          return;
        }
      }
      
      // Store stream reference to stop it later
      streamRef.current = stream;
      
      // Set permission state to granted
      setPermissionState('granted');
      
      // Connect stream to video element if we have a video reference
      if (videoRef.current) {
        console.log('Setting video source...');
        
        try {
          videoRef.current.srcObject = stream;
          
          // Add event listeners to ensure video is playing and scanning starts
          videoRef.current.onloadedmetadata = () => {
            console.log('Video metadata loaded, playing video...');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('Video playing, starting QR scan...');
                  // Start scanning for QR codes immediately
                  if (isScanning && !scanIntervalRef.current) {
                    scanIntervalRef.current = requestAnimationFrame(scanVideoForQR);
                  }
                })
                .catch(err => {
                  console.error('Error starting video playback:', err);
                  setError('Could not start camera playback. Please try again.');
                });
            }
          };
          
          // Add play success handler
          videoRef.current.onplaying = () => {
            console.log('Video playing event triggered');
            // Also start scanning here as a backup
            if (isScanning && !scanIntervalRef.current) {
              scanIntervalRef.current = requestAnimationFrame(scanVideoForQR);
            }
          };
          
          // Add error handler
          videoRef.current.onerror = (err) => {
            console.error('Video error:', err);
            setError('Video playback error. Please try again.');
          };
          
        } catch (streamErr) {
          console.error('Error setting video source:', streamErr);
          setError('Failed to connect to camera. Please try again.');
        }
      } else {
        console.error('Video reference not available');
        setError('Camera element not available. Please reload the page.');
      }
    } catch (err) {
      console.error('Camera access error:', err);
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setError('Camera access was denied. Please enable camera permissions and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('unavailable');
        setError('No camera found on your device. Please use the upload option instead.');
      } else {
        setPermissionState('unavailable');
        setError(`Camera error: ${err.message || 'Unknown error'}`);
      }
    }
  }, [isScanning, scanVideoForQR]);

  // Effect to start/stop camera based on scanning state
  React.useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
    }
    
    return () => {
      stopCamera();
    };
  }, [isScanning, startCamera, stopCamera]);

  // Handle image upload and QR extraction
  const handleImageUpload = (e) => {
    setError(null);
    setScanResult(null);
    
    const file = e.target.files[0];
    if (!file) return;
    
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    
    console.log('Processing uploaded file:', file.name, file.type, file.size);
    
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = new window.Image();
      img.onload = function() {
        console.log('Image loaded, dimensions:', img.width, 'x', img.height);
        
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        try {
          // Try multiple strategies to read QR codes
          const imageData = ctx.getImageData(0, 0, img.width, img.height);
          
          // Try regular scan first
          let code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "attemptBoth"
          });
          
          if (!code || !code.data) {
            console.log('First QR scan attempt failed, trying different resolutions...');
            
            // If not found, try with a scaled version of the image
            const scaledCanvas = document.createElement('canvas');
            const scaledCtx = scaledCanvas.getContext('2d');
            
            // Try with a fixed size that's good for QR scanning
            scaledCanvas.width = 1024;
            scaledCanvas.height = 1024 * (img.height / img.width);
            
            scaledCtx.drawImage(img, 0, 0, scaledCanvas.width, scaledCanvas.height);
            const scaledImageData = scaledCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
            
            code = jsQR(scaledImageData.data, scaledImageData.width, scaledImageData.height, {
              inversionAttempts: "attemptBoth"
            });
          }
          
          if (code && code.data) {
            console.log('QR code found in uploaded image:', code.data);
            setScanResult(code.data);
            
            // Extract product ID from URL if it's a full URL
            const productId = extractProductId(code.data);
            console.log('Extracted product ID:', productId);
            
            if (productId) {
              console.log('Navigating to:', `/product/${productId}`);
              setTimeout(() => {
                navigate(`/product/${productId}`);
              }, 1000);
            } else {
              setError('Invalid QR code format. Could not extract product ID.');
            }
          } else {
            setError('No QR code found in the image. Try uploading a clearer image or use camera scanning.');
          }
        } catch (err) {
          console.error('Error processing uploaded image:', err);
          setError('Error processing image. Please try a different image.');
        }
      };
      
      img.onerror = function(err) {
        console.error('Failed to load uploaded image:', err);
        setError('Failed to load image. The file might be corrupted or not a valid image.');
      };
      
      img.src = ev.target.result;
    };
    
    reader.onerror = function(err) {
      console.error('Failed to read file:', err);
      setError('Failed to read file. Please try again.');
    };
    
    reader.readAsDataURL(file);
  };

  // Function to handle scan button click
  const handleScanButtonClick = () => {
    if (isScanning) {
      // If already scanning, stop
      setIsScanning(false);
      setError(null);
      setScanResult(null);
    } else {
      // Start scanning (permissions will be requested in the effect)
      setIsScanning(true);
      setError(null);
      setScanResult(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background - wrapped in ErrorBoundary */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary fallback={<div className="w-full h-full bg-gradient-to-br from-blue-900 to-purple-900"></div>}>
          <Suspense fallback={<div>Loading 3D scene...</div>}>
            <Scene3D suppressErrors={true} />
          </Suspense>
        </ErrorBoundary>
      </div>
      
      {/* Particle Background - also wrapped in ErrorBoundary */}
      <ErrorBoundary fallback={null}>
        <Suspense fallback={null}>
          <ParticleBackground density={30} />
        </Suspense>
      </ErrorBoundary>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20 z-10"></div>
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <ErrorBoundary fallback={
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-2xl text-white font-bold mb-4">QR Code Scanner</h2>
            <p className="text-white/80 mb-6">Something went wrong with the scanner. Please try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
            >
              Reload Scanner
            </button>
          </div>
        }>
        <AnimatedCard className="w-full max-w-md">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaQrcode className="text-white text-3xl" />
                </div>
                {/* FloatingCubeWrapper - wrapped in ErrorBoundary */}
                <div className="absolute -top-2 -right-2">
                  <ErrorBoundary fallback={null}>
                    <Suspense fallback={null}>
                      <FloatingCubeWrapper size={0.5} className="w-12 h-12" />
                    </Suspense>
                  </ErrorBoundary>
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                QR Code Scanner
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Scan a QR code to view product details
              </p>
            </div>

            {/* QR Scanner */}
            <div className="space-y-6">
              <div className="relative">
                <div className="w-full h-72 rounded-2xl overflow-hidden border-2 border-blue-200 dark:border-blue-800 shadow-lg bg-gray-900">
                  <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Video element for camera feed - visible when scanning */}
                    <video
                      ref={videoRef}
                      style={{ 
                        display: isScanning ? 'block' : 'none',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      playsInline
                      muted
                      autoPlay
                    ></video>
                    
                    {/* Canvas for QR detection overlay - positioned over video */}
                    <canvas 
                      ref={canvasRef}
                      style={{ 
                        display: isScanning ? 'block' : 'none',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%', 
                        height: '100%',
                        objectFit: 'cover',
                        pointerEvents: 'none', // Allow clicks to pass through
                        zIndex: 10
                      }}
                    ></canvas>
                    
                    {/* Placeholder when not scanning */}
                    {!isScanning && (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-gray-800">
                        <div className="text-center">
                          {permissionState === 'denied' ? (
                            <>
                              <FaExclamationTriangle className="mx-auto text-4xl text-yellow-500 mb-4" />
                              <p className="text-yellow-400">Camera access denied</p>
                              <p className="text-gray-400 text-sm mt-2">Please enable camera access in your browser settings</p>
                            </>
                          ) : permissionState === 'unavailable' ? (
                            <>
                              <FaExclamationTriangle className="mx-auto text-4xl text-yellow-500 mb-4" />
                              <p className="text-yellow-400">Camera not available</p>
                              <p className="text-gray-400 text-sm mt-2">Please use the upload option below</p>
                            </>
                          ) : (
                            <>
                              <FaCamera className="mx-auto text-4xl text-gray-500 mb-4" />
                              <p className="text-gray-400">Camera will appear here when scanning</p>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Scanning overlay */}
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute top-2 left-2 right-2 z-20 flex justify-between items-center"
                  >
                    <div className="bg-green-600/90 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      🔍 Scanning for QR Code...
                    </div>
                    <div className="bg-blue-600/90 text-white px-3 py-1 rounded-lg text-sm font-medium">
                      📱 Position QR in frame
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Upload Option */}
              <div className="text-center">
                <div className="flex items-center justify-center space-x-4 mb-4">
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
                  <div className="flex-1 h-px bg-gray-300 dark:bg-gray-600"></div>
                </div>
                
                <GlowingButton
                  onClick={() => fileInputRef.current.click()}
                  className="w-full py-3 font-semibold"
                  glowColor="purple"
                >
                  <FaUpload className="mr-2" />
                  Upload QR Image
                </GlowingButton>
                
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Results */}
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                >
                  <p className="text-green-800 dark:text-green-200 text-sm">
                    <strong>Scanned Successfully:</strong>
                  </p>
                  <p className="text-green-600 dark:text-green-300 font-mono text-xs break-all mt-1">
                    {scanResult}
                  </p>
                  <div className="mt-3 flex items-center text-green-600 dark:text-green-400 text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Redirecting to product page...
                  </div>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
                >
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    <strong>Error:</strong> {error}
                  </p>
                </motion.div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <GlowingButton
                  onClick={() => navigate('/')}
                  variant="secondary"
                  className="flex-1 py-3 font-semibold"
                  glowColor="blue"
                >
                  <FaArrowLeft className="mr-2" />
                  Back to Home
                </GlowingButton>
                
                <GlowingButton
                  onClick={handleScanButtonClick}
                  className="flex-1 py-3 font-semibold"
                  glowColor="green"
                  disabled={permissionState === 'unavailable'}
                >
                  <FaCamera className="mr-2" />
                  {isScanning ? 'Stop Scan' : 'Start Camera Scan'}
                </GlowingButton>
              </div>
            </div>
          </div>
        </AnimatedCard>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default QRScan;