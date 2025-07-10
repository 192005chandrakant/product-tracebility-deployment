import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { 
  FaPlusCircle, 
  FaTimes, 
  FaBox, 
  FaUser, 
  FaMapMarker, 
  FaIndustry, 
  FaClipboard, 
  FaImage, 
  FaCertificate, 
  FaQrcode, 
  FaDownload,
  FaArrowLeft,
  FaCheck,
  FaLock
} from 'react-icons/fa';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import { buildAPIURL } from '../utils/apiConfig';

function AddProduct() {
  const [form, setForm] = useState({
    productId: '',
    name: '',
    origin: '',
    manufacturer: '',
    description: '',
    blockchainRefHash: '',
    password: '', // Add password field for secondary authentication
  });
  const [certFile, setCertFile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState(null);
  const [qrCodeDownloadUrl, setQrCodeDownloadUrl] = useState(null); // Add QR download URL state
  const [registeredProduct, setRegisteredProduct] = useState(null);
  const navigate = useNavigate();

  // Test server connectivity on mount
  useEffect(() => {
    const testServer = async () => {
      try {
        console.log('Testing server connectivity...');
        const res = await fetch(buildAPIURL('/api/test'));
        console.log('Server test response:', res.status);
        if (res.ok) {
          const data = await res.json();
          console.log('Server is running:', data);
        } else {
          console.error('Server test failed');
        }
        
        // Test the simple route
        console.log('Testing simple route...');
        const simpleRes = await fetch(buildAPIURL('/api/add-product-simple'), {
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
    
    // Validate form data
    if (!form.password) {
      setError('Password confirmation is required for security purposes');
      toast.error('Password confirmation is required');
      return;
    }
    
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
      
      console.log('Making request to:', buildAPIURL('/api/add-product'));
      const res = await fetch(buildAPIURL('/api/add-product'), {
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
      
      // Dispatch custom event to refresh statistics
      window.dispatchEvent(new Event('productAdded'));
      
      // Handle QR code data properly
      const qrCodeData = responseData.qrCode;
      console.log('QR Code data received:', qrCodeData);
      
      if (qrCodeData) {
        console.log('QR Code data type:', typeof qrCodeData);
        console.log('QR Code data keys:', Object.keys(qrCodeData));
        
        if (qrCodeData.publicUrl) {
          // Cloudinary or other storage service URL
          console.log('Using publicUrl for QR code');
          setQrCode(qrCodeData.publicUrl);
          setQrCodeDownloadUrl(qrCodeData.downloadUrl || qrCodeData.publicUrl);
        } else if (qrCodeData.base64Data) {
          // Base64 encoded QR code (for mock/local storage)
          console.log('Using base64Data for QR code');
          setQrCode(qrCodeData.base64Data);
          setQrCodeDownloadUrl(qrCodeData.base64Data);
        } else if (typeof qrCodeData === 'string') {
          // Direct URL string
          console.log('Using string URL for QR code');
          setQrCode(qrCodeData);
          setQrCodeDownloadUrl(qrCodeData);
        } else {
          console.error('Unknown QR code format:', qrCodeData);
          toast.error('QR code generated but format not recognized');
          setQrCode(null);
        }
      } else {
        console.warn('No QR code data received from server');
        toast.warning('Product created but QR code generation failed');
      }
      
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

  // Function to handle QR code download
  const handleQrDownload = () => {
    if (!qrCode) {
      toast.error('No QR code available to download');
      return;
    }
    
    const fileName = `product-qr-${registeredProduct?.productId || 'qr'}.png`;
    
    try {
      if (qrCode.startsWith('data:')) {
        // Handle base64 data
        const link = document.createElement('a');
        link.href = qrCode;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR code downloaded successfully!');
      } else {
        // Handle URL (Cloudinary or other)
        const downloadUrl = qrCodeDownloadUrl || qrCode;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = fileName;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR code download started!');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden transition-all duration-1000
      bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 
      dark:bg-gradient-to-br dark:from-slate-900 dark:via-emerald-950 dark:to-teal-950">
      
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 opacity-20 dark:opacity-40 transition-opacity duration-1000">
        <Scene3D />
      </div>
      
      {/* Particle Background */}
      <div className="opacity-30 dark:opacity-60 transition-opacity duration-1000">
        <ParticleBackground />
      </div>
      
      {/* Light Mode: Emerald gradient overlay */}
      <div className="absolute inset-0 z-10 opacity-100 dark:opacity-0 transition-opacity duration-1000
        bg-gradient-to-br from-emerald-100/30 via-teal-100/20 to-cyan-100/30"></div>
      
      {/* Dark Mode: Tech grid pattern */}
      <div className="absolute inset-0 z-10 opacity-0 dark:opacity-30 transition-opacity duration-1000"
        style={{
          backgroundImage: `
            linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}>
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-teal-900/20 to-cyan-900/30"></div>
      </div>
      
      <div className="relative z-20 min-h-screen flex items-center justify-center p-4">
        <ToastContainer position="top-center" theme="auto" />
        
        <AnimatedCard className="w-full max-w-2xl backdrop-blur-xl border shadow-2xl transition-all duration-500
          bg-white/95 border-emerald-200/60 shadow-emerald-300/20
          dark:bg-slate-800/95 dark:border-emerald-400/30 dark:shadow-emerald-500/20
          hover:shadow-3xl hover:border-emerald-300/70 dark:hover:border-emerald-300/50">
          <div className="p-8">{qrCode ? (
              // Success State - QR Code Display
              <motion.div
                className="text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
              >
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center">
                    <FaCheck className="text-white text-3xl" />
                  </div>
                </div>
                
                <h3 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mb-4">
                  Product Registered Successfully!
                </h3>
                
                <p className="text-gray-600 dark:text-gray-300 mb-8">
                  Your product has been added to the blockchain. Scan or download the QR code below:
                </p>
                
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-xl mb-6">
                  <img 
                    src={qrCode} 
                    alt="Product QR Code" 
                    className="mx-auto mb-4 rounded-lg border-4 border-gray-200 dark:border-gray-700 shadow-lg max-w-xs w-full"
                    onError={(e) => {
                      console.error('QR code image failed to load:', qrCode);
                      e.target.style.display = 'none';
                    }}
                    onLoad={() => {
                      console.log('QR code image loaded successfully');
                    }}
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <GlowingButton
                      onClick={handleQrDownload}
                      className="px-6 py-3 font-semibold"
                      glowColor="blue"
                    >
                      <FaDownload className="mr-2" />
                      Download QR Code
                    </GlowingButton>
                    
                    <GlowingButton
                      onClick={() => navigate('/admin/dashboard')}
                      variant="secondary"
                      className="px-6 py-3 font-semibold"
                      glowColor="green"
                    >
                      <FaArrowLeft className="mr-2" />
                      Go to Dashboard
                    </GlowingButton>
                  </div>
                </div>
                
                {registeredProduct && (
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-xl p-4 text-left mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Product Details:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <div><strong>ID:</strong> {registeredProduct.productId}</div>
                      <div><strong>Name:</strong> {registeredProduct.name}</div>
                      <div><strong>Origin:</strong> {registeredProduct.origin}</div>
                      <div><strong>Manufacturer:</strong> {registeredProduct.manufacturer}</div>
                      {registeredProduct.description && (
                        <div className="col-span-full"><strong>Description:</strong> {registeredProduct.description}</div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="flex justify-center">
                  <GlowingButton
                    onClick={() => {
                      setQrCode(null);
                      setQrCodeDownloadUrl(null);
                      setRegisteredProduct(null);
                      setForm({
                        productId: '',
                        name: '',
                        origin: '',
                        manufacturer: '',
                        description: '',
                        blockchainRefHash: '',
                        password: ''
                      });
                      setCertFile(null);
                      setImageFile(null);
                      setImagePreview(null);
                      setError('');
                    }}
                    variant="ghost"
                    className="px-6 py-3 font-semibold"
                    glowColor="purple"
                  >
                    <FaPlusCircle className="mr-2" />
                    Add Another Product
                  </GlowingButton>
                </div>
              </motion.div>
            ) : (
              // Form State
              <>
                {/* Header */}
                <motion.div
                  className="text-center mb-8"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex justify-center mb-6">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl transition-all duration-500
                      bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500
                      dark:bg-gradient-to-br dark:from-emerald-400 dark:via-teal-400 dark:to-cyan-400
                      dark:shadow-[0_0_30px_rgba(16,185,129,0.4)]
                      hover:scale-110 hover:rotate-6 hover:shadow-2xl">
                      <FaPlusCircle className="text-white text-3xl drop-shadow-lg" />
                    </div>
                  </div>
                  <h2 className="text-4xl font-bold mb-3 transition-all duration-500
                    bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 
                    dark:from-emerald-300 dark:via-teal-300 dark:to-cyan-300 
                    bg-clip-text text-transparent
                    dark:drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                    Add New Product
                  </h2>
                  <p className="text-lg transition-all duration-500
                    text-gray-600 dark:text-emerald-100/80 
                    dark:drop-shadow-[0_0_5px_rgba(16,185,129,0.3)]">
                    Register your product on the blockchain
                  </p>
                </motion.div>

                {/* Product Form */}
                <motion.form
                  onSubmit={handleSubmit}
                  className="space-y-6"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product ID */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold mb-3 transition-all duration-300
                        text-gray-700 group-focus-within:text-emerald-600 
                        dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                        Product ID
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                          text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                          <FaBox className="text-lg" />
                        </div>
                        <input
                          name="productId"
                          placeholder="Enter unique product ID"
                          value={form.productId}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                            bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                            focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                            hover:border-gray-300 hover:bg-gray-50/80
                            dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                            dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                            dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                            shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                            dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* Product Name */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold mb-3 transition-all duration-300
                        text-gray-700 group-focus-within:text-emerald-600 
                        dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                        Product Name
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                          text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                          <FaClipboard className="text-lg" />
                        </div>
                        <input
                          name="name"
                          placeholder="Enter product name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                            bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                            focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                            hover:border-gray-300 hover:bg-gray-50/80
                            dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                            dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                            dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                            shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                            dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* Origin */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold mb-3 transition-all duration-300
                        text-gray-700 group-focus-within:text-emerald-600 
                        dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                        Origin
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                          text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                          <FaMapMarker className="text-lg" />
                        </div>
                        <input
                          name="origin"
                          placeholder="Enter origin location"
                          value={form.origin}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                            bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                            focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                            hover:border-gray-300 hover:bg-gray-50/80
                            dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                            dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                            dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                            shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                            dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20"
                        />
                      </div>
                    </div>

                    {/* Manufacturer */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold mb-3 transition-all duration-300
                        text-gray-700 group-focus-within:text-emerald-600 
                        dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                        Manufacturer
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                          text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                          <FaIndustry className="text-lg" />
                        </div>
                        <input
                          name="manufacturer"
                          placeholder="Enter manufacturer name"
                          value={form.manufacturer}
                          onChange={handleChange}
                          required
                          className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                            bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                            focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                            hover:border-gray-300 hover:bg-gray-50/80
                            dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                            dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                            dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                            shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                            dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="relative group">
                    <label className="block text-sm font-semibold mb-3 transition-all duration-300
                      text-gray-700 group-focus-within:text-emerald-600 
                      dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                      Description
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-4 transition-all duration-300
                        text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                        <FaClipboard className="text-lg" />
                      </div>
                      <textarea
                        name="description"
                        placeholder="Enter product description"
                        value={form.description}
                        onChange={handleChange}
                        rows={4}
                        className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium resize-none
                          bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                          focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                          hover:border-gray-300 hover:bg-gray-50/80
                          dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                          dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                          dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                          shadow-sm hover:shadow-md focus:shadow-lg
                          dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* Blockchain Reference Hash */}
                  <div className="relative group">
                    <label className="block text-sm font-semibold mb-3 transition-all duration-300
                      text-gray-700 group-focus-within:text-emerald-600 
                      dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                      Certification Hash 
                      <span className="text-xs font-normal text-gray-500 dark:text-gray-400 ml-2">(Optional)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                        text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                        <FaCertificate className="text-lg" />
                      </div>
                      <input
                        name="blockchainRefHash"
                        placeholder="Enter certification hash"
                        value={form.blockchainRefHash}
                        onChange={handleChange}
                        className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium input-enhanced
                          bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                          focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                          hover:border-gray-300 hover:bg-gray-50/80
                          dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100 dark:placeholder-slate-400
                          dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                          dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                          shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                          dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20"
                      />
                    </div>
                  </div>

                  {/* File Uploads */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Product Image */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold mb-3 transition-all duration-300
                        text-gray-700 group-focus-within:text-emerald-600 
                        dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                        Product Image
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10
                          text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                          <FaImage className="text-lg" />
                        </div>
                        <input
                          type="file"
                          name="imageFile"
                          accept="image/*"
                          onChange={handleImage}
                          className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium
                            bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                            focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                            hover:border-gray-300 hover:bg-gray-50/80
                            dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100
                            dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                            dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                            shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                            dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20
                            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                            file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 file:transition-all
                            dark:file:bg-emerald-900/50 dark:file:text-emerald-300 dark:hover:file:bg-emerald-900/70"
                        />
                      </div>
                      {imagePreview && (
                        <motion.div 
                          className="mt-4"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <img 
                            src={imagePreview} 
                            alt="Preview" 
                            className="w-full h-40 object-cover rounded-xl border-2 border-emerald-200 dark:border-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300" 
                          />
                        </motion.div>
                      )}
                    </div>

                    {/* Certificate File */}
                    <div className="relative group">
                      <label className="block text-sm font-semibold mb-3 transition-all duration-300
                        text-gray-700 group-focus-within:text-emerald-600 
                        dark:text-slate-300 dark:group-focus-within:text-emerald-400">
                        Certificate File
                      </label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300 z-10
                          text-gray-400 group-focus-within:text-emerald-500 dark:group-focus-within:text-emerald-400">
                          <FaCertificate className="text-lg" />
                        </div>
                        <input
                          type="file"
                          name="certFile"
                          accept="image/*,.pdf"
                          onChange={handleFile}
                          className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium
                            bg-gray-50 border-2 border-gray-200 text-gray-900 placeholder-gray-500
                            focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/50
                            hover:border-gray-300 hover:bg-gray-50/80
                            dark:bg-slate-700/50 dark:border-slate-600 dark:text-slate-100
                            dark:focus:bg-slate-700/80 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30
                            dark:hover:border-slate-500 dark:hover:bg-slate-700/70
                            shadow-sm hover:shadow-md focus:shadow-lg hover-lift
                            dark:shadow-slate-800/50 dark:focus:shadow-emerald-500/20
                            file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                            file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 file:transition-all
                            dark:file:bg-blue-900/50 dark:file:text-blue-300 dark:hover:file:bg-blue-900/70"
                        />
                      </div>
                      {certFile && (
                        <motion.div 
                          className="mt-4 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.3 }}
                        >
                          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                            📄 {certFile.name}
                          </p>
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            {(certFile.size / 1024).toFixed(1)} KB
                          </p>
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Password Confirmation */}
                  <div className="relative group border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-6 rounded-lg">
                    <div className="flex items-center mb-3">
                      <FaLock className="text-amber-500 dark:text-amber-400 mr-2" />
                      <label className="block text-sm font-semibold transition-all duration-300
                        text-amber-700 dark:text-amber-300">
                        Password Confirmation (Required)
                      </label>
                    </div>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 transition-all duration-300
                        text-gray-400 group-focus-within:text-amber-500 dark:group-focus-within:text-amber-400">
                        <FaLock className="text-lg" />
                      </div>
                      <input
                        type="password"
                        name="password"
                        placeholder="Enter your password to confirm"
                        value={form.password}
                        onChange={handleChange}
                        required
                        className="w-full pl-12 pr-4 py-4 rounded-xl transition-all duration-300 font-medium
                          bg-white border-2 border-amber-200 text-gray-900 placeholder-gray-500
                          focus:bg-white focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50
                          hover:border-amber-300 hover:bg-white
                          dark:bg-slate-700 dark:border-amber-700 dark:text-slate-100
                          dark:focus:bg-slate-700 dark:focus:border-amber-500 dark:focus:ring-amber-500/30
                          dark:hover:border-amber-600 dark:hover:bg-slate-700
                          shadow-sm hover:shadow-md focus:shadow-lg"
                      />
                    </div>
                    <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
                      Password confirmation is required for security purposes when adding new products
                    </p>
                  </div>

                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 text-red-700 dark:text-red-300"
                    >
                      {error}
                    </motion.div>
                  )}

                  {/* Submit Button */}
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <GlowingButton
                      type="submit"
                      disabled={loading}
                      variant="primary"
                      size="lg"
                      className="flex-1 font-bold tracking-wide"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                          <span>Adding Product...</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <FaPlusCircle className="mr-3 text-lg" />
                          <span>Add Product</span>
                        </div>
                      )}
                    </GlowingButton>

                    <GlowingButton
                      onClick={() => navigate(-1)}
                      variant="outline"
                      size="lg"
                      className="flex-1 sm:flex-initial px-8 font-bold tracking-wide"
                    >
                      <div className="flex items-center justify-center">
                        <FaTimes className="mr-3 text-lg" />
                        <span>Cancel</span>
                      </div>
                    </GlowingButton>
                  </div>
                </motion.form>
              </>
            )}
          </div>
        </AnimatedCard>
      </div>
    </div>
  );
}

export default AddProduct;