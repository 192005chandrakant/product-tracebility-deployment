import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaPlusCircle, FaTimes } from 'react-icons/fa';

function AddProduct() {
  const [form, setForm] = useState({
    productId: '',
    name: '',
    origin: '',
    manufacturer: '',
    description: '',
    blockchainRefHash: '',
  });
  const [certFile, setCertFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFile = e => {
    setCertFile(e.target.files[0]);
  };

  const handleImage = e => {
    const file = e.target.files[0];
    setImageFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => data.append(k, v));
      if (certFile) data.append('certFile', certFile);
      if (imageFile) data.append('imageFile', imageFile);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/add-product', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: data,
      });
      if (!res.ok) throw new Error('Failed to add product');
      toast.success('Product added!');
      setTimeout(() => navigate('/admin/dashboard'), 1200);
    } catch (err) {
      setError(err.message);
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
        <h2 className="text-3xl font-bold mb-6 text-center">Add Product</h2>
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="productId" placeholder="Product ID" value={form.productId} onChange={handleChange} required />
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="origin" placeholder="Origin" value={form.origin} onChange={handleChange} required />
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="manufacturer" placeholder="Manufacturer" value={form.manufacturer} onChange={handleChange} required />
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="description" placeholder="Description" value={form.description} onChange={handleChange} />
        <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" name="blockchainRefHash" placeholder="Certification Hash (optional)" value={form.blockchainRefHash} onChange={handleChange} />
        <div>
          <label className="block mb-1 font-semibold">Product Image</label>
          <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" type="file" accept="image/*" onChange={handleImage} />
          {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-h-40 mx-auto" />}
        </div>
        <div>
          <label className="block mb-1 font-semibold">Certificate File</label>
          <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" type="file" accept="image/*,.pdf" onChange={handleFile} />
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary w-full mb-4 py-3 text-lg btn-icon"
          type="submit"
          disabled={loading}
        >
          <FaPlusCircle />
          {loading ? 'Adding...' : 'Add Product'}
        </motion.button>
        {error && <div className="text-red-600">{error}</div>}
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

export default AddProduct; 