import React from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft, FaUpload } from 'react-icons/fa';
// We'll use jsqr for image QR extraction
// You need to install jsqr: npm install jsqr
import jsQR from 'jsqr';

function QRScan() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = React.useState(null);
  const [error, setError] = React.useState(null);
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
          navigate(`/product/${code.data}`);
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4">
      <motion.div
        className="card p-10 w-full max-w-md text-gray-900 dark:text-gray-100 flex flex-col items-center"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Scan QR Code</h2>
        <div className="w-72 h-72 mb-4 overflow-hidden rounded-lg border border-gray-300 dark:border-slate-600 shadow-lg">
          <QrReader
            constraints={{ facingMode: 'environment' }}
            onResult={(result, error) => {
              if (!!result) {
                setScanResult(result?.text);
                navigate(`/product/${result?.text}`);
              }
            }}
            scanDelay={500}
            style={{ width: '100%' }}
          />
        </div>
        <div className="w-full flex flex-col items-center gap-2 mb-2">
          <span className="text-gray-500 text-sm">or</span>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-colors"
            onClick={() => fileInputRef.current.click()}
          >
            <FaUpload /> Upload QR Image
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            className="hidden"
            onChange={handleImageUpload}
          />
        </div>
        {scanResult && <p className="mt-2 text-sm text-center">Scanned: <span className="font-semibold break-all">{scanResult}</span></p>}
        {error && <p className="mt-2 text-sm text-red-500 text-center">{error}</p>}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary mt-6 w-full py-3 text-lg btn-icon"
          onClick={() => navigate('/')}
        >
          <FaArrowLeft />
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
}

export default QRScan; 