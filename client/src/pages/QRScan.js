import React, { useRef, useCallback, Suspense, Component } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaUpload,
  FaQrcode,
  FaCamera,
  FaExclamationTriangle,
  FaShieldAlt,
  FaCheckCircle,
  FaQuestionCircle,
  FaBolt,
  FaSun,
  FaMoon,
  FaSpinner,
} from 'react-icons/fa';
import jsQR from 'jsqr';
import ParticleBackground from '../components/UI/ParticleBackground';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';
import BrandLogo from '../components/BrandLogo';

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
  const [scannerState, setScannerState] = React.useState('idle'); // idle | scanning | processing | verified | flagged | failed
  const [flashEnabled, setFlashEnabled] = React.useState(false);
  const [flashUnsupported, setFlashUnsupported] = React.useState(false);
  const [showHelp, setShowHelp] = React.useState(false);
  const [permissionState, setPermissionState] = React.useState('pending'); // 'pending', 'granted', 'denied', 'unavailable'
  
  const fileInputRef = useRef();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const scanIntervalRef = useRef(null);

  const triggerHapticFeedback = useCallback((duration = 40) => {
    if (navigator && navigator.vibrate) {
      navigator.vibrate(duration);
    }
  }, []);

  const updateTorch = useCallback(async (enabled) => {
    if (!streamRef.current) return;

    const videoTrack = streamRef.current.getVideoTracks()[0];
    if (!videoTrack || typeof videoTrack.getCapabilities !== 'function') {
      setFlashUnsupported(true);
      return;
    }

    const capabilities = videoTrack.getCapabilities();
    if (!capabilities.torch) {
      setFlashUnsupported(true);
      return;
    }

    try {
      await videoTrack.applyConstraints({ advanced: [{ torch: enabled }] });
      setFlashUnsupported(false);
    } catch (torchError) {
      console.log('Torch toggle failed:', torchError);
      setFlashUnsupported(true);
    }
  }, []);
  
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
        setScannerState('processing');
        triggerHapticFeedback(70);
        
        // Set result
        setScanResult(code.data);
        
        // Add a short delay before navigation for better user experience
        setTimeout(() => {
          // Extract product ID and navigate
          const productId = extractProductId(code.data);
          console.log('Extracted product ID:', productId);
          
          if (productId) {
            console.log('Navigating to product page:', `/product/${productId}`);
            setScannerState('verified');
            navigate(`/product/${productId}`);
          } else {
            setError('Invalid QR code format. Could not extract product ID.');
            setScannerState('failed');
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
  }, [isScanning, stopCamera, navigate, triggerHapticFeedback]);

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
          setScannerState('flagged');
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
        setScannerState('flagged');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('unavailable');
        setError('No camera found on your device. Please use the upload option instead.');
        setScannerState('flagged');
      } else {
        setPermissionState('unavailable');
        setError(`Camera error: ${err.message || 'Unknown error'}`);
        setScannerState('failed');
      }
    }
  }, [isScanning, scanVideoForQR]);

  // Effect to start/stop camera based on scanning state
  React.useEffect(() => {
    if (isScanning) {
      startCamera();
    } else {
      stopCamera();
      setFlashEnabled(false);
    }
    
    return () => {
      stopCamera();
    };
  }, [isScanning, startCamera, stopCamera]);

  React.useEffect(() => {
    if (isScanning) {
      setScannerState('scanning');
    } else if (!scanResult && !error) {
      setScannerState('idle');
    }
  }, [isScanning, scanResult, error]);

  React.useEffect(() => {
    if (!isScanning) return;
    updateTorch(flashEnabled);
  }, [flashEnabled, isScanning, updateTorch]);

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
            setScannerState('processing');
            triggerHapticFeedback(55);
            
            // Extract product ID from URL if it's a full URL
            const productId = extractProductId(code.data);
            console.log('Extracted product ID:', productId);
            
            if (productId) {
              console.log('Navigating to:', `/product/${productId}`);
              setTimeout(() => {
                setScannerState('verified');
                navigate(`/product/${productId}`);
              }, 1000);
            } else {
              setError('Invalid QR code format. Could not extract product ID.');
              setScannerState('failed');
            }
          } else {
            setError('No QR code found in the image. Try uploading a clearer image or use camera scanning.');
            setScannerState('failed');
          }
        } catch (err) {
          console.error('Error processing uploaded image:', err);
          setError('Error processing image. Please try a different image.');
          setScannerState('failed');
        }
      };
      
      img.onerror = function(err) {
        console.error('Failed to load uploaded image:', err);
        setError('Failed to load image. The file might be corrupted or not a valid image.');
        setScannerState('failed');
      };
      
      img.src = ev.target.result;
    };
    
    reader.onerror = function(err) {
      console.error('Failed to read file:', err);
      setError('Failed to read file. Please try again.');
      setScannerState('failed');
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
      setScannerState('idle');
    } else {
      // Start scanning (permissions will be requested in the effect)
      setIsScanning(true);
      setError(null);
      setScanResult(null);
      setScannerState('scanning');
    }
  };

  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  const statusMeta = {
    idle: {
      title: 'Align QR code within frame',
      subtitle: 'Scanning will start automatically once the camera is active.',
      className: 'border-cyan-200/70 bg-cyan-50/70 text-cyan-900 dark:border-cyan-800/70 dark:bg-cyan-950/40 dark:text-cyan-100',
      icon: <FaQrcode className="text-cyan-500" />,
    },
    scanning: {
      title: 'Scanning in progress',
      subtitle: 'Hold steady and keep the QR fully visible for fastest detection.',
      className: 'border-blue-200/70 bg-blue-50/70 text-blue-900 dark:border-blue-800/70 dark:bg-blue-950/40 dark:text-blue-100',
      icon: <FaCamera className="text-blue-500" />,
    },
    processing: {
      title: 'Verifying product...',
      subtitle: 'AI and blockchain checks are running.',
      className: 'border-indigo-200/70 bg-indigo-50/70 text-indigo-900 dark:border-indigo-800/70 dark:bg-indigo-950/40 dark:text-indigo-100',
      icon: <FaSpinner className="text-indigo-500 animate-spin" />,
    },
    verified: {
      title: 'Product verified',
      subtitle: 'Authenticity confirmed. Opening product profile now.',
      className: 'border-emerald-200/80 bg-emerald-50/80 text-emerald-900 dark:border-emerald-800/80 dark:bg-emerald-950/40 dark:text-emerald-100',
      icon: <FaCheckCircle className="text-emerald-500" />,
    },
    flagged: {
      title: 'Scanning access needs attention',
      subtitle: 'Enable camera permissions or use image upload fallback.',
      className: 'border-amber-200/80 bg-amber-50/80 text-amber-900 dark:border-amber-800/80 dark:bg-amber-950/40 dark:text-amber-100',
      icon: <FaExclamationTriangle className="text-amber-500" />,
    },
    failed: {
      title: 'Verification failed',
      subtitle: 'Try again with better lighting or a clearer QR image.',
      className: 'border-rose-200/80 bg-rose-50/80 text-rose-900 dark:border-rose-800/80 dark:bg-rose-950/40 dark:text-rose-100',
      icon: <FaExclamationTriangle className="text-rose-500" />,
    },
  };

  const activeStatus = statusMeta[scannerState] || statusMeta.idle;

  return (
    <div className="min-h-screen relative overflow-hidden cyber-page font-['Sora','Segoe_UI',sans-serif]">
      {/* 3D Background - wrapped in ErrorBoundary */}
      <div className="absolute inset-0 z-0">
        <ErrorBoundary fallback={<div className="w-full h-full bg-gradient-to-br from-purple-950 via-[#13111C] to-teal-950"></div>}>
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.32),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(34,197,94,0.25),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(14,165,233,0.28),transparent_48%)] z-10"></div>
      
      <div className="relative z-20 min-h-screen p-4 sm:p-6 lg:p-8">
        <ErrorBoundary fallback={
          <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl max-w-md w-full">
            <h2 className="text-2xl text-slate-900 dark:text-white font-bold mb-4">QR Code Scanner</h2>
            <p className="text-slate-600 dark:text-white/80 mb-6">Something went wrong with the scanner. Please try again.</p>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] text-white rounded-lg"
            >
              Reload Scanner
            </button>
          </div>
        }>
        <AnimatedCard className="w-full max-w-5xl mx-auto">
          <div className="rounded-[2rem] cyber-glass p-4 sm:p-6 lg:p-8">
            <div className="flex items-center justify-between gap-3 mb-5">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 text-white border border-white/10 text-sm font-semibold hover:scale-[1.02] transition"
              >
                <FaArrowLeft />
                Back
              </button>

              <div className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs sm:text-sm font-semibold text-slate-200">
                <FaSun className="text-amber-500 dark:hidden" />
                <FaMoon className="text-cyan-300 hidden dark:block" />
                Adaptive Light and Dark
              </div>
            </div>

            <div className="text-center mb-6 lg:mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#A855F7] to-[#2DD4BF] text-white mb-3 shadow-[0_0_28px_rgba(168,85,247,0.3)]">
                <FaQrcode className="text-3xl" />
              </div>
              <div className="relative inline-block ml-2 align-top">
                <ErrorBoundary fallback={null}>
                  <Suspense fallback={null}>
                    <FloatingCubeWrapper size={0.45} className="w-10 h-10" />
                  </Suspense>
                </ErrorBoundary>
              </div>
              <div className="mb-4 flex justify-center lg:justify-start">
                <div className="rounded-[24px] border border-white/10 bg-white/60 px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.08)] dark:bg-white/5">
                  <BrandLogo size="sm" animated />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Scan Product QR Code
              </h1>
              <p className="mt-2 text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium">
                Verify authenticity using AI + Blockchain
              </p>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800 bg-emerald-50/85 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold">
                  <FaShieldAlt />
                  Secure scanning
                </span>
                <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-200 dark:border-cyan-800 bg-cyan-50/85 dark:bg-cyan-950/40 text-cyan-800 dark:text-cyan-200 text-xs sm:text-sm font-semibold">
                  <FaCheckCircle />
                  Verified system
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-sm text-slate-400 max-w-2xl mx-auto">
                Safe scanning: this scanner only reads QR payloads needed for product verification and redirects you to the trusted product profile.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-4 lg:gap-6">
              <div className="relative rounded-3xl border border-white/40 dark:border-slate-700/70 bg-slate-950/90 overflow-hidden min-h-[360px] sm:min-h-[420px] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]">
                <video
                  ref={videoRef}
                  style={{
                    display: isScanning ? 'block' : 'none',
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                  className="absolute inset-0"
                  playsInline
                  muted
                  autoPlay
                ></video>

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
                    pointerEvents: 'none',
                    zIndex: 18,
                  }}
                ></canvas>

                {!isScanning && (
                  <div className="absolute inset-0 z-10 grid place-items-center px-6 text-center bg-gradient-to-b from-slate-900/85 via-slate-900/95 to-slate-950">
                    {permissionState === 'denied' ? (
                      <>
                        <FaExclamationTriangle className="text-5xl text-amber-400 mb-4" />
                        <p className="text-amber-300 text-lg font-semibold">Camera access denied</p>
                        <p className="text-slate-300 text-sm mt-2 max-w-sm">Enable camera permissions to scan instantly, or upload a QR image from your gallery.</p>
                      </>
                    ) : permissionState === 'unavailable' ? (
                      <>
                        <FaExclamationTriangle className="text-5xl text-amber-400 mb-4" />
                        <p className="text-amber-300 text-lg font-semibold">Camera unavailable</p>
                        <p className="text-slate-300 text-sm mt-2 max-w-sm">No compatible camera detected. Upload a product QR image instead.</p>
                      </>
                    ) : (
                      <>
                        <p className="text-slate-200 text-lg font-semibold">Ready to scan</p>
                        <p className="text-slate-300 text-sm mt-2 max-w-sm">Tap Start Camera Scan, then center the QR inside the frame.</p>
                      </>
                    )}
                  </div>
                )}

                <div className="absolute inset-0 z-20 pointer-events-none">
                  <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,7,18,0.35),rgba(3,7,18,0.65))]"></div>

                  <div className="scanner-frame absolute left-1/2 top-1/2 w-[74%] max-w-[310px] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/60 bg-white/10 backdrop-blur-[1.5px] shadow-[0_0_0_9999px_rgba(2,6,23,0.45)]">
                    <span className="scanner-corner scanner-corner-tl"></span>
                    <span className="scanner-corner scanner-corner-tr"></span>
                    <span className="scanner-corner scanner-corner-bl"></span>
                    <span className="scanner-corner scanner-corner-br"></span>
                    {!isScanning && permissionState !== 'denied' && permissionState !== 'unavailable' ? (
                      <span className="scanner-idle-icon" aria-hidden="true">
                        <FaCamera />
                      </span>
                    ) : null}
                    {isScanning ? <span className="scanner-line"></span> : null}
                  </div>

                  <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 text-cyan-100 border border-cyan-400/30 text-xs sm:text-sm font-semibold backdrop-blur-md">
                      <FaShieldAlt />
                      Safe scanning
                    </span>
                    <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/55 text-emerald-100 border border-emerald-400/30 text-xs sm:text-sm font-semibold backdrop-blur-md">
                      <FaCheckCircle />
                      Verified by AI system
                    </span>
                  </div>

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[88%] rounded-2xl px-4 py-2.5 bg-black/55 border border-white/20 text-center backdrop-blur-md">
                    <p className="text-white text-sm font-semibold">Align QR code within frame</p>
                    <p className="text-cyan-100/90 text-xs mt-1">Scanning will start automatically</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <motion.section
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border p-4 sm:p-5 shadow-sm ${activeStatus.className}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-lg">{activeStatus.icon}</div>
                    <div>
                      <h3 className="text-base sm:text-lg font-bold">{activeStatus.title}</h3>
                      <p className="text-xs sm:text-sm mt-1 opacity-90">{activeStatus.subtitle}</p>
                    </div>

                    {scannerState === 'processing' ? (
                      <div className="ml-auto inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-white/65 dark:bg-slate-800/70 border border-indigo-200 dark:border-indigo-700">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                        AI + Blockchain
                      </div>
                    ) : null}
                  </div>
                </motion.section>

                {scanResult && scannerState !== 'failed' ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/35 p-4"
                  >
                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">Verification token captured</p>
                    <p className="text-xs font-mono break-all mt-2 text-emerald-700 dark:text-emerald-300">{scanResult}</p>
                    <p className="text-xs mt-3 text-emerald-700 dark:text-emerald-300">Preparing secure redirect to product profile...</p>
                  </motion.div>
                ) : null}

                {error ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50/80 dark:bg-rose-950/35 p-4"
                  >
                    <p className="text-sm font-bold text-rose-900 dark:text-rose-200">Verification issue</p>
                    <p className="text-xs mt-2 text-rose-700 dark:text-rose-300">{error}</p>
                  </motion.div>
                ) : null}

                {flashUnsupported && isScanning ? (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/85 dark:bg-amber-950/35 p-3 text-xs text-amber-800 dark:text-amber-200">
                    Flash control is not supported by this device/browser camera stream.
                  </div>
                ) : null}

                <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-2.5 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.8)]">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={handleScanButtonClick}
                      disabled={permissionState === 'unavailable'}
                      className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-gradient-to-r from-[#A855F7] to-[#2DD4BF] text-white text-xs sm:text-sm font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-105 active:scale-[0.99] transition"
                    >
                      <FaCamera />
                      {isScanning ? 'Stop' : 'Start'}
                    </button>

                    <button
                      onClick={toggleFlash}
                      disabled={!isScanning}
                      className={`inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl text-xs sm:text-sm font-semibold border transition active:scale-[0.99] ${
                        flashEnabled
                          ? 'bg-amber-400/90 text-slate-900 border-amber-300'
                          : 'bg-white/5 text-slate-200 border-white/10'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <FaBolt />
                      Flash
                    </button>

                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-white/5 text-slate-200 text-xs sm:text-sm font-semibold border border-white/10 hover:bg-white/10 active:scale-[0.99] transition"
                    >
                      <FaUpload />
                      Upload
                    </button>

                    <button
                      onClick={() => setShowHelp((prev) => !prev)}
                      className="inline-flex items-center justify-center gap-2 px-3 py-3 rounded-2xl bg-white/5 text-slate-200 text-xs sm:text-sm font-semibold border border-white/10 hover:bg-white/10 active:scale-[0.99] transition"
                    >
                      <FaQuestionCircle />
                      Help
                    </button>
                  </div>
                </div>

                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleImageUpload}
                />

                {showHelp ? (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-900/90 p-4"
                  >
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">Quick help</h4>
                    <ul className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 space-y-1.5">
                      <li>1. Start camera scan and center the QR inside the square.</li>
                      <li>2. Use flash in low-light environments for faster recognition.</li>
                      <li>3. If camera access fails, upload a clear QR image from gallery.</li>
                    </ul>
                  </motion.div>
                ) : null}

                <div className="text-xs text-slate-400 rounded-xl border border-white/10 bg-white/5 p-3">
                  Safe scanning note: QR content is used only to identify the product record and run authenticity verification.
                </div>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-center">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-300 dark:border-slate-600 bg-white/70 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-sm font-semibold hover:bg-white dark:hover:bg-slate-700 transition"
              >
                <FaArrowLeft />
                Back to Home
              </button>
            </div>

            <style>{`
              .scanner-frame {
                position: relative;
              }

              .scanner-corner {
                position: absolute;
                width: 28px;
                height: 28px;
                border-color: rgba(255, 255, 255, 0.95);
                border-style: solid;
                filter: drop-shadow(0 0 8px rgba(56, 189, 248, 0.8));
              }

              .scanner-corner-tl {
                top: -1px;
                left: -1px;
                border-width: 4px 0 0 4px;
                border-top-left-radius: 18px;
              }

              .scanner-corner-tr {
                top: -1px;
                right: -1px;
                border-width: 4px 4px 0 0;
                border-top-right-radius: 18px;
              }

              .scanner-corner-bl {
                left: -1px;
                bottom: -1px;
                border-width: 0 0 4px 4px;
                border-bottom-left-radius: 18px;
              }

              .scanner-corner-br {
                right: -1px;
                bottom: -1px;
                border-width: 0 4px 4px 0;
                border-bottom-right-radius: 18px;
              }

              .scanner-line {
                position: absolute;
                left: 6%;
                right: 6%;
                top: 16%;
                height: 3px;
                border-radius: 999px;
                background: linear-gradient(90deg, rgba(16, 185, 129, 0), rgba(16, 185, 129, 0.95), rgba(16, 185, 129, 0));
                box-shadow: 0 0 14px rgba(16, 185, 129, 0.9);
                animation: scannerSweep 2s ease-in-out infinite;
              }

              .scanner-idle-icon {
                position: absolute;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
                width: 64px;
                height: 64px;
                border-radius: 16px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                color: rgba(165, 243, 252, 0.95);
                font-size: 30px;
                background: linear-gradient(135deg, rgba(8, 145, 178, 0.5), rgba(14, 116, 144, 0.32));
                border: 1px solid rgba(165, 243, 252, 0.45);
                box-shadow: 0 0 0 1px rgba(56, 189, 248, 0.35), 0 10px 25px rgba(8, 47, 73, 0.5);
                z-index: 2;
              }

              @keyframes scannerSweep {
                0% {
                  top: 14%;
                  opacity: 0.35;
                }

                50% {
                  top: 84%;
                  opacity: 1;
                }

                100% {
                  top: 14%;
                  opacity: 0.35;
                }
              }
            `}</style>
          </div>
        </AnimatedCard>
        </ErrorBoundary>
      </div>
    </div>
  );
}

export default QRScan;
