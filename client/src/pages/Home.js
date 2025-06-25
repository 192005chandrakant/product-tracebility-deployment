import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaQrcode, FaEye } from 'react-icons/fa';

function Home() {
  const navigate = useNavigate();
  const [productId, setProductId] = React.useState('');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-transparent p-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card p-10 w-full max-w-md text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Product Traceability</h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary w-full mb-4 py-3 text-lg btn-icon"
          onClick={() => navigate('/scan')}
        >
          <FaQrcode />
          Scan QR Code
        </motion.button>
        <div className="flex items-center gap-2">
          <input
            className="flex-1 px-4 py-2"
            type="text"
            placeholder="Enter Product ID"
            value={productId}
            onChange={e => setProductId(e.target.value)}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary px-5 py-2.5 btn-icon"
            onClick={() => {
              if (productId) {
                navigate(`/product/${productId}`);
              } else {
                toast.error('Please enter a Product ID');
              }
            }}
          >
            <FaEye />
            View
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

export default Home; 