import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTimes } from 'react-icons/fa';

function UpdateProduct() {
  const [productId, setProductId] = useState('');
  const [stage, setStage] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async e => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/update-product/${productId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stage }),
      });
      if (!res.ok) throw new Error('Failed to update product');
      setMessage('Stage updated!');
      toast.success('Stage updated!');
    } catch (err) {
      setMessage(err.message);
      toast.error(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card p-8 w-full max-w-xl text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-3xl font-bold mb-6 text-center">Update Product</h2>
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="productId" placeholder="Product ID" value={productId} onChange={e => setProductId(e.target.value)} required />
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="stage" placeholder="New Stage" value={stage} onChange={e => setStage(e.target.value)} required />
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary w-full mb-4 py-3 text-lg btn-icon"
          type="submit"
          disabled={loading}
        >
          <FaEdit />
          {loading ? 'Updating...' : 'Update Stage'}
        </motion.button>
        {message && <div className="mt-2 text-blue-600 dark:text-blue-400 text-center">{message}</div>}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary w-full py-3 text-lg btn-icon"
          onClick={() => navigate(-1)}
        >
          <FaTimes />
          Cancel
        </motion.button>
      </motion.div>
    </div>
  );
}

export default UpdateProduct; 