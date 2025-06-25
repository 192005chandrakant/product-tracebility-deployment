import React from 'react';
import { QrReader } from 'react-qr-reader';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaArrowLeft } from 'react-icons/fa';

function QRScan() {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = React.useState(null);

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
        {scanResult && <p className="mt-2 text-sm text-center">Scanned: <span className="font-semibold break-all">{scanResult}</span></p>}
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