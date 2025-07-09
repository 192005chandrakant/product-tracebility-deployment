import React from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaUpload, FaQrcode, FaCamera } from 'react-icons/fa';
import jsQR from 'jsqr';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';

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
  const fileInputRef = React.useRef();

  // Handle image upload and QR extraction
  const handleImageUpload = (e) => {
    setError(null);
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(ev) {
      const img = new window.Image();
      img.onload = function() {
        // Create a canvas to draw the image
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, img.width, img.height);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && code.data) {
          setScanResult(code.data);
          // Extract product ID from URL if it's a full URL
          const productId = extractProductId(code.data);
          console.log('QR Code scanned. Original data:', code.data);
          console.log('Extracted product ID:', productId);
          console.log('Navigating to:', `/product/${productId}`);
          navigate(`/product/${productId}`);
        } else {
          setError('No QR code found in the image.');
        }
      };
      img.onerror = function() {
        setError('Failed to load image.');
      };
      img.src = ev.target.result;
    };
    reader.onerror = function() {
      setError('Failed to read file.');
    };
    reader.readAsDataURL(file);
  };

  const handleScanResult = (result, error) => {
    if (!!result) {
      setScanResult(result?.text);
      setIsScanning(false);
      // Add a small delay for better UX
      setTimeout(() => {
        // Extract product ID from URL if it's a full URL
        const productId = extractProductId(result?.text);
        console.log('Camera QR scan result. Original data:', result?.text);
        console.log('Extracted product ID:', productId);
        console.log('Navigating to:', `/product/${productId}`);
        navigate(`/product/${productId}`);
      }, 1000);
    }
    if (!!error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <Scene3D />
      </div>
      
      {/* Particle Background */}
      <ParticleBackground />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20 z-10"></div>
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <AnimatedCard className="w-full max-w-md">
          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="relative inline-block mb-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaQrcode className="text-white text-3xl" />
                </div>
                <div className="absolute -top-2 -right-2">
                  <FloatingCubeWrapper size={0.5} className="w-12 h-12" />
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
                  <QrReader
                    constraints={{ facingMode: 'environment' }}
                    onResult={handleScanResult}
                    scanDelay={500}
                    style={{ width: '100%', height: '100%' }}
                    ViewFinder={() => (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-48 h-48 border-2 border-blue-400 rounded-lg bg-transparent">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-blue-400"></div>
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-blue-400"></div>
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-blue-400"></div>
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-blue-400"></div>
                        </div>
                      </div>
                    )}
                  />
                </div>
                
                {/* Scanning overlay */}
                {isScanning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-blue-500/20 rounded-2xl flex items-center justify-center"
                  >
                    <div className="text-white font-semibold bg-blue-600 px-4 py-2 rounded-lg">
                      Scanning...
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
                  onClick={() => {
                    setIsScanning(!isScanning);
                    setError(null);
                    setScanResult(null);
                  }}
                  className="flex-1 py-3 font-semibold"
                  glowColor="green"
                >
                  <FaCamera className="mr-2" />
                  {isScanning ? 'Stop Scan' : 'Start Scan'}
                </GlowingButton>
              </div>
            </div>
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

export default QRScan; 