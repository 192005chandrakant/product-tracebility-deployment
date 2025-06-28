import React, { useState, useEffect } from 'react';
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
  const [qrCode, setQrCode] = useState(null);
  const [registeredProduct, setRegisteredProduct] = useState(null);
  const navigate = useNavigate();

  // Test server connectivity on mount
  useEffect(() => {
    const testServer = async () => {
      try {
        console.log('Testing server connectivity...');
        const res = await fetch('http://localhost:5000/test');
        console.log('Server test response:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Server is running:', data);
        } else {
          console.error('Server test failed');
        }
        
        // Test the simple route
        console.log('Testing simple route...');
        const simpleRes = await fetch('http://localhost:5000/api/add-product-simple', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ test: 'data' })
        });
        console.log('Simple route response:', simpleRes.status);
        if (simpleRes.ok) {
          const simpleData = await simpleRes.json();
          console.log('Simple route working:', simpleData);
        } else {
          console.error('Simple route failed');
        }
      } catch (err) {
        console.error('Server connectivity error:', err);
      }
    };
    testServer();
  }, []);

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
    
    console.log('Submitting form with data:', form);
    console.log('Certificate file:', certFile);
    console.log('Image file:', imageFile);
    
    try {
      const data = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        data.append(k, v);
        console.log(`Adding to FormData: ${k} = ${v}`);
      });
      
      // Add files to FormData
      if (certFile) {
        data.append('certFile', certFile);
        console.log('Added certFile to FormData:', certFile.name);
      }
      if (imageFile) {
        data.append('imageFile', imageFile);
        console.log('Added imageFile to FormData:', imageFile.name);
      }
      
      // Debug: Log all FormData entries
      console.log('=== FORMDATA DEBUG ===');
      for (let [key, value] of data.entries()) {
        console.log(`${key}:`, value instanceof File ? `File: ${value.name}` : value);
      }
      console.log('=== END FORMDATA DEBUG ===');
      
      const token = localStorage.getItem('token');
      console.log('Token:', token ? 'exists' : 'not found');
      
      console.log('Making request to: http://localhost:5000/api/add-product');
      const res = await fetch('http://localhost:5000/api/add-product', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`
        },
        body: data,
      });
      
      console.log('Response status:', res.status);
      
      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      console.log('Content-Type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      const responseData = await res.json();
      console.log('Response data:', responseData);
      
      if (!res.ok) throw new Error(responseData.error || 'Failed to add product');
      
      // Show QR code and product details
      setQrCode(responseData.qrCode);
      setRegisteredProduct(responseData.product);
      toast.success('Product added successfully!');
      // Optionally, do not redirect immediately
      // setTimeout(() => navigate('/admin/dashboard'), 1200);
    } catch (err) {
      console.error('Error adding product:', err);
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
        {qrCode ? (
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Product Registered!</h3>
            <p className="mb-2">Scan or download your product QR code:</p>
            <img src={qrCode} alt="Product QR Code" className="mx-auto mb-4 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg max-w-xs" />
            <a
              href={qrCode}
              download={`product-qr-${registeredProduct?.productId || 'qr'}.png`}
              className="inline-block px-6 py-3 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-200 mb-2"
            >
              Download QR
            </a>
            <button
              className="block w-full mt-4 px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200"
              onClick={() => navigate('/admin/dashboard')}
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 mb-4" name="productId" placeholder="Product ID" value={form.productId} onChange={handleChange} required />
            <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 mb-4" name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
            <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 mb-4" name="origin" placeholder="Origin" value={form.origin} onChange={handleChange} required />
            <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 mb-4" name="manufacturer" placeholder="Manufacturer" value={form.manufacturer} onChange={handleChange} required />
            <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 mb-4" name="description" placeholder="Description" value={form.description} onChange={handleChange} />
            <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 mb-4" name="blockchainRefHash" placeholder="Certification Hash (optional)" value={form.blockchainRefHash} onChange={handleChange} />
            <div className="mb-4">
              <label className="block mb-1 font-semibold">Product Image</label>
              <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" type="file" name="imageFile" accept="image/*" onChange={handleImage} />
              {imagePreview && <img src={imagePreview} alt="Preview" className="mt-2 rounded-lg max-h-40 mx-auto" />}
            </div>
            <div className="mb-6">
              <label className="block mb-1 font-semibold">Certificate File</label>
              <input className="w-full px-4 py-2 rounded-lg bg-white/80 dark:bg-slate-700 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-slate-600 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" type="file" name="certFile" accept="image/*,.pdf" onChange={handleFile} />
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
            {error && <div className="text-red-600 mb-4">{error}</div>}
          </form>
        )}
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