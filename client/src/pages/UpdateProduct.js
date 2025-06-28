import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTimes } from 'react-icons/fa';

const STAGE_OPTIONS = [
  'Harvested',
  'Processed',
  'Packaged',
  'Shipped',
  'Delivered',
  'Sold',
];

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 px-2 sm:px-4 md:px-8 py-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card w-full max-w-md p-0 sm:p-0 rounded-2xl bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-xl border border-blue-500/10 overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <form onSubmit={handleUpdate} className="p-4 sm:p-8 flex flex-col gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2 text-center">Update Product</h2>
          <input
            className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            name="productId"
            placeholder="Product ID"
            value={productId}
            onChange={e => setProductId(e.target.value)}
            required
          />
          <select
            className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200"
            name="stage"
            value={stage}
            onChange={e => setStage(e.target.value)}
            required
          >
            <option value="">Select New Stage</option>
            {STAGE_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary w-full mb-2 py-3 text-lg btn-icon flex items-center justify-center gap-2 disabled:opacity-50"
            type="submit"
            disabled={loading}
          >
            <FaEdit />
            {loading ? 'Updating...' : 'Update Stage'}
          </motion.button>
          {message && <div className={`mt-2 text-center ${message.includes('updated') ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>{message}</div>}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-secondary w-full py-3 text-lg btn-icon flex items-center justify-center gap-2"
            type="button"
            onClick={() => navigate(-1)}
          >
            <FaTimes />
            Cancel
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

export default UpdateProduct; 