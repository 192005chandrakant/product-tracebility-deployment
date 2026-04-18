import React, { memo, useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import { 
  FaEdit, 
  FaBox, 
  FaSearch, 
  FaCheck, 
  FaSpinner,
  FaImage,
  FaChartBar,
  FaCube,
  FaEye,
  FaHistory,
  FaArrowLeft,
  FaSync,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaRobot,
  FaPaperPlane,
  FaLightbulb
} from 'react-icons/fa';
import ParticleBackground from '../components/UI/ParticleBackground';
import GlowingButton from '../components/UI/GlowingButton';
import AnimatedCard from '../components/UI/AnimatedCard';
import Scene3D from '../components/3D/Scene3D';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';
import useRealTimeStats from '../hooks/useRealTimeStats';
import { aiChat, isAIEnabled } from '../utils/aiApi';
import { SETTINGS_CHANGED_EVENT } from '../utils/appSettings';
import StageDocumentationForm from '../components/StageDocumentationForm';
import AIStructuredResponse from '../components/AIStructuredResponse';
import VerificationResultPanel from '../components/VerificationResultPanel';

const STAGE_OPTIONS = [
  { value: 'Harvested', label: 'Harvested', color: 'from-green-500 to-green-600', icon: FaBox },
  { value: 'Processed', label: 'Processed', color: 'from-yellow-500 to-yellow-600', icon: FaCube },
  { value: 'Packaged', label: 'Packaged', color: 'from-blue-500 to-blue-600', icon: FaBox },
  { value: 'Shipped', label: 'Shipped', color: 'from-purple-500 to-purple-600', icon: FaArrowLeft },
  { value: 'Delivered', label: 'Delivered', color: 'from-cyan-500 to-cyan-600', icon: FaCheckCircle },
  { value: 'Sold', label: 'Sold', color: 'from-red-500 to-red-600', icon: FaCheck },
];

const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg'
]);
const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024;

function hasDocumentMetadata(doc = {}) {
  return [
    doc.title,
    doc.standardCode,
    doc.documentReference,
    doc.issuingAuthority,
    doc.issuerCountry,
    doc.complianceScope,
    doc.documentVersion,
    doc.certificateNumber,
    doc.batchNumber,
    doc.lotNumber,
    doc.issueDate,
    doc.expiryDate,
    doc.notes,
    doc.verificationNotes
  ].some((value) => String(value || '').trim().length > 0);
}

function validateStageDocuments(documents = []) {
  const issues = [];
  const docsWithFiles = documents.filter((doc) => doc && doc.file);

  documents.forEach((doc, index) => {
    if (!doc) {
      return;
    }

    const row = index + 1;
    const hasMetadata = hasDocumentMetadata(doc);

    if (!doc.file && hasMetadata) {
      issues.push(`Document ${row}: upload a file or clear the draft fields.`);
      return;
    }

    if (!doc.file) {
      return;
    }

    if (!String(doc.title || '').trim()) {
      issues.push(`Document ${row}: title is required.`);
    }

    if (!String(doc.documentReference || '').trim()) {
      issues.push(`Document ${row}: document reference is required.`);
    }

    if (!String(doc.issuingAuthority || '').trim()) {
      issues.push(`Document ${row}: issuing authority is required.`);
    }

    const mimeType = String(doc.file.type || '').toLowerCase();
    if (!ALLOWED_DOCUMENT_MIME_TYPES.has(mimeType)) {
      issues.push(`Document ${row}: unsupported file type. Use PDF, PNG, or JPG.`);
    }

    if (Number(doc.file.size || 0) > MAX_DOCUMENT_SIZE_BYTES) {
      issues.push(`Document ${row}: file size exceeds 10 MB.`);
    }

    if (doc.issueDate && doc.expiryDate && new Date(doc.issueDate) > new Date(doc.expiryDate)) {
      issues.push(`Document ${row}: expiry date must be on or after issue date.`);
    }
  });

  return {
    issues,
    docsWithFiles
  };
}

// Utility function for debouncing
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  
  return debouncedValue;
};

const UpdateProductDecorativeBackground = memo(function UpdateProductDecorativeBackground() {
  return (
    <>
      {/* 3D Background */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <Scene3D />
      </div>

      {/* Particle Background */}
      <div className="pointer-events-none" aria-hidden="true">
        <ParticleBackground />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20 z-10 pointer-events-none" aria-hidden="true"></div>
    </>
  );
});

function UpdateProduct() {
  // Real-time statistics hook
  const { statistics, loading: statsLoading, error: statsError, refreshStats } = useRealTimeStats(5000); // Refresh every 5 seconds
  
  // Main state
  const [productId, setProductId] = useState('');
  const [stage, setStage] = useState('');
  const [password, setPassword] = useState(''); // Add password for secondary authentication
  const [message, setMessage] = useState('');
  const [verificationFeedback, setVerificationFeedback] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Product search and details
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // File uploads
  // Stage history
  const [stageHistory, setStageHistory] = useState([]);
  const [stageDocuments, setStageDocuments] = useState([]);
  const [documentValidationErrors, setDocumentValidationErrors] = useState([]);

  // AI update assistant
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiReply, setAiReply] = useState('');
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [enableAI, setEnableAI] = useState(isAIEnabled());
  
  const navigate = useNavigate();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const syncAISetting = () => setEnableAI(isAIEnabled());
    window.addEventListener('storage', syncAISetting);
    window.addEventListener(SETTINGS_CHANGED_EVENT, syncAISetting);

    return () => {
      window.removeEventListener('storage', syncAISetting);
      window.removeEventListener(SETTINGS_CHANGED_EVENT, syncAISetting);
    };
  }, []);

  // Search products when search query changes
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchProducts(debouncedSearchQuery);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearchQuery]);

  useEffect(() => {
    if (documentValidationErrors.length > 0) {
      setDocumentValidationErrors([]);
    }
  }, [stageDocuments]);

  // Search products by ID or name
  const searchProducts = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }
      
      // Import the API config utility
      const apiConfig = await import('../utils/apiConfig');
      const apiUrl = apiConfig.buildAPIURL('/api/products');
      
      const response = await fetch(apiUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const products = await response.json();
        const filtered = products.filter(product => 
          product.productId?.toLowerCase().includes(query.toLowerCase()) ||
          product.name?.toLowerCase().includes(query.toLowerCase()) ||
          product.certificationHash?.toLowerCase().includes(query.toLowerCase()) ||
          product.blockchainRefHash?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 8); // Show up to 8 results
        
        setSearchResults(filtered);
        
        // If we found exactly one result matching the exact ID, auto-select it
        const exactMatch = filtered.find(p => p.productId.toLowerCase() === query.toLowerCase());
        if (exactMatch && filtered.length === 1) {
          selectProduct(exactMatch);
        }
      } else {
        toast.error('Failed to fetch products. Please try again.');
      }
    } catch (error) {
      console.error('Error searching products:', error);
      toast.error('Error searching products: ' + (error.message || 'Unknown error'));
    } finally {
      setSearchLoading(false);
    }
  }, [navigate]);

  // Select a product from search results
  const selectProduct = useCallback((product) => {
    setSelectedProduct(product);
    setProductId(product.productId);
    setSearchQuery(product.productId);
    setSearchResults([]);
    setStageHistory(product.stages || []);
  }, []);

  // Main update handler with file uploads
  const handleUpdate = async e => {
    e.preventDefault();
    setMessage('');
    setIsSuccess(false);
    setLoading(true);
    setDocumentValidationErrors([]);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Import the API config utility
      const apiConfig = await import('../utils/apiConfig');
      const apiUrl = apiConfig.buildAPIURL(`/api/update-product/${productId}`);
      
      if (!password) {
        throw new Error('Password confirmation is required.');
      }

      const formData = new FormData();
      formData.append('stage', stage);
      formData.append('password', password);

      const documentValidation = validateStageDocuments(stageDocuments);
      if (documentValidation.issues.length > 0) {
        setDocumentValidationErrors(documentValidation.issues);
        throw new Error(documentValidation.issues[0]);
      }

      const documentsWithFiles = documentValidation.docsWithFiles.map((doc) => ({ ...doc }));

      const stageDocumentsMeta = documentsWithFiles.map((doc, index) => ({
        stage,
        documentType: doc.documentType,
        title: doc.title,
        standardCode: doc.standardCode,
        documentReference: doc.documentReference,
        issuingAuthority: doc.issuingAuthority,
        issuerCountry: doc.issuerCountry,
        complianceScope: doc.complianceScope,
        documentVersion: doc.documentVersion,
        certificateNumber: doc.certificateNumber,
        batchNumber: doc.batchNumber,
        lotNumber: doc.lotNumber,
        issueDate: doc.issueDate,
        expiryDate: doc.expiryDate,
        notes: doc.notes,
        verificationNotes: doc.verificationNotes,
        requiresVerification: !!doc.requiresVerification,
        fileIndex: index
      }));

      formData.append('stageDocumentsMeta', JSON.stringify(stageDocumentsMeta));
      documentsWithFiles.forEach((doc) => {
        formData.append('stageDocumentFiles', doc.file);
      });

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setVerificationFeedback(data.verification || null);
        throw new Error(data.message || data.error || 'Failed to update product');
      }

      setVerificationFeedback(data.verification || null);

      // Show success message with transaction hash if available
      if (data.txHash) {
        setMessage(`Product stage updated successfully! Transaction hash: ${data.txHash}`);
        setIsSuccess(true);
        toast.success('Stage updated successfully!', {
          autoClose: 5000,
          onClick: () => {
            // Copy transaction hash to clipboard when toast is clicked
            navigator.clipboard.writeText(data.txHash);
            toast.info('Transaction hash copied to clipboard!', { autoClose: 2000 });
          }
        });
      } else {
        setMessage('Product stage updated successfully!');
        setIsSuccess(true);
        toast.success('Stage updated successfully!');
      }

      setStageDocuments([]);

      // Navigate to product detail page after delay
      setTimeout(() => {
        navigate(`/product/${productId}`, { state: { txHash: data.txHash } });
      }, 1500);
      
    } catch (err) {
      console.error('Update error:', err);
      const errorMessage = err.message || 'Failed to update product stage';
      setMessage(errorMessage);
      setIsSuccess(false);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAskAI = useCallback(async () => {
    setAiError('');
    setAiReply('');

    const activeProductId = (productId || selectedProduct?.productId || '').trim();
    if (!activeProductId) {
      setAiError('Select a product or enter a product ID first.');
      return;
    }

    const prompt = aiQuestion.trim() || `Review this planned update. Current stage history: ${stageHistory.join(' -> ') || 'none'}. Planned new stage: ${stage || 'not selected'}. Highlight any operational risks or checks before updating.`;

    setAiLoading(true);
    try {
      const response = await aiChat({
        productId: activeProductId,
        question: prompt
      });

      if (response && response.success && response.data) {
        setAiReply(response.data.reply || 'No AI response received.');
      } else {
        setAiError((response && response.message) || 'Unable to get AI guidance at the moment.');
      }
    } catch (requestError) {
      setAiError(requestError.message || 'Unable to get AI guidance at the moment.');
    } finally {
      setAiLoading(false);
    }
  }, [aiQuestion, productId, selectedProduct, stage, stageHistory]);

  const selectedStage = useMemo(() => {
    return STAGE_OPTIONS.find(option => option.value === stage);
  }, [stage]);

  const getStageIcon = useCallback((stageName) => {
    const stageOption = STAGE_OPTIONS.find(opt => opt.value === stageName);
    return stageOption?.icon || FaBox;
  }, []);

  const getStageColor = useCallback((stageName) => {
    const stageOption = STAGE_OPTIONS.find(opt => opt.value === stageName);
    return stageOption?.color || 'from-gray-500 to-gray-600';
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <UpdateProductDecorativeBackground />
      
      <div className="relative z-20 min-h-screen p-4 flex flex-col items-center">
        <ToastContainer position="top-center" />
        
        <div className="max-w-7xl w-full">
          {/* Header */}
          <div className="text-center mb-8 pt-8">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl">
                <FaEdit className="text-white text-4xl" />
              </div>
              <div className="absolute -top-3 -right-3">
                <FloatingCubeWrapper>
                  <mesh>
                    <boxGeometry args={[0.5, 0.5, 0.5]} />
                    <meshStandardMaterial color="#ff6b35" />
                  </mesh>
                </FloatingCubeWrapper>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
              Update Product
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
              Search for products, update stages, upload files, and track your progress with real-time statistics
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto w-full">
            {/* Statistics Panel */}
            <div className="lg:col-span-1">
              <AnimatedCard className="h-fit">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                      Statistics
                    </h3>
                    <button
                      onClick={refreshStats}
                      disabled={statsLoading}
                      className="p-2 text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-50"
                      title="Refresh Statistics"
                    >
                      <FaSync className={statsLoading ? 'animate-spin' : ''} />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-blue-100 text-sm">Total Products</p>
                          <p className="text-2xl font-bold">{statistics.totalProducts}</p>
                        </div>
                        <FaBox className="text-3xl text-blue-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-green-100 text-sm">Total Scans</p>
                          <p className="text-2xl font-bold">{statistics.totalScans}</p>
                        </div>
                        <FaEye className="text-3xl text-green-200" />
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 rounded-lg text-white">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-purple-100 text-sm">Total Updates</p>
                          <p className="text-2xl font-bold">{statistics.totalUpdates}</p>
                        </div>
                        <FaEdit className="text-3xl text-purple-200" />
                      </div>
                    </div>
                  </div>

                  {/* Recent Updates */}
                  {statistics.recentProducts && statistics.recentProducts.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                        Recent Products
                      </h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {statistics.recentProducts.slice(0, 5).map((product, index) => (
                          <div 
                            key={product._id || index}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-gray-800 dark:text-gray-200">
                                  {product.name || product.productId}
                                </p>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">
                                  {product.productId}
                                </p>
                              </div>
                              <FaClock className="text-gray-400" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AnimatedCard>
            </div>

            {/* Main Update Form */}
            <div className="lg:col-span-2">
              <AnimatedCard>
                <div className="p-8">
                  <form onSubmit={handleUpdate} className="space-y-6">
                    {/* Product Search */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                        Search Product
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <FaSearch className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search by Product ID, Name, or Certificate Hash..."
                          className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-lg"
                        />
                        {searchLoading && (
                          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                            <FaSpinner className="animate-spin text-orange-500" />
                          </div>
                        )}
                      </div>

                      {/* Search Results */}
                      <AnimatePresence>
                        {searchResults.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                          >
                            {searchResults.map((product) => (
                              <button
                                key={product._id}
                                type="button"
                                onClick={() => selectProduct(product)}
                                className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium text-gray-800 dark:text-gray-200">
                                      {product.name}
                                    </p>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                      ID: {product.productId}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                      {product.origin} • {product.manufacturer}
                                    </p>
                                  </div>
                                  {product.stages && product.stages.length > 0 && (
                                    <div className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStageColor(product.stages[product.stages.length - 1])} text-white`}>
                                      {product.stages[product.stages.length - 1]}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Selected Product Details */}
                    {selectedProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            Selected Product
                          </h4>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(null);
                              setProductId('');
                              setSearchQuery('');
                              setStageHistory([]);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <FaTimes />
                          </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Name:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.name}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">ID:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.productId}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Origin:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.origin}</p>
                          </div>
                          <div>
                            <p className="text-gray-600 dark:text-gray-400">Manufacturer:</p>
                            <p className="font-medium text-gray-800 dark:text-gray-200">{selectedProduct.manufacturer}</p>
                          </div>
                        </div>

                        {/* Stage History */}
                        {stageHistory.length > 0 && (
                          <div className="mt-4">
                            <p className="text-gray-600 dark:text-gray-400 mb-2">Current Stages:</p>
                            <div className="flex flex-wrap gap-2">
                              {stageHistory.map((stageName, index) => {
                                const StageIcon = getStageIcon(stageName);
                                return (
                                  <div
                                    key={index}
                                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${getStageColor(stageName)} text-white shadow-sm`}
                                  >
                                    <StageIcon className="w-3 h-3" />
                                    {stageName}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Manual Product ID Input */}
                    {!selectedProduct && (
                      <div className="space-y-2">
                        <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                          Or Enter Product ID Manually
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <FaBox className="h-5 w-5 text-gray-400" />
                          </div>
                          <input
                            type="text"
                            value={productId}
                            onChange={(e) => setProductId(e.target.value)}
                            placeholder="Enter product ID"
                            className="w-full pl-12 pr-4 py-4 bg-white/70 dark:bg-gray-700/70 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent backdrop-blur-sm transition-all duration-200 text-lg"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Stage Selection */}
                    <div className="space-y-4">
                      <label className="block text-lg font-semibold text-gray-700 dark:text-gray-300">
                        New Stage
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {STAGE_OPTIONS.map((option) => {
                          const OptionIcon = option.icon;
                          return (
                            <motion.button
                              key={option.value}
                              type="button"
                              onClick={() => setStage(option.value)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                                stage === option.value
                                  ? `bg-gradient-to-r ${option.color} text-white border-transparent shadow-lg`
                                  : 'bg-white/70 dark:bg-gray-700/70 border-gray-300 dark:border-gray-600 hover:border-orange-400 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              <div className="flex items-center justify-center space-x-2">
                                <OptionIcon className="w-4 h-4" />
                                <span className="font-medium text-sm">{option.label}</span>
                              </div>
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage Preview */}
                    {selectedStage && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${selectedStage.color} flex items-center justify-center`}>
                            <selectedStage.icon className="text-white text-xl" />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Selected Stage:</p>
                            <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                              {selectedStage.label}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <StageDocumentationForm
                      stage={stage || 'Pending Stage'}
                      title="Detailed Stage Documentation"
                      subtitle="Attach optional compliance and audit documents for this stage. Add files only when this update requires documentation or verification."
                      validationErrors={documentValidationErrors}
                      documents={stageDocuments}
                      setDocuments={setStageDocuments}
                    />

                    {/* AI Stage Advisor */}
                    {enableAI ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 rounded-lg border border-cyan-200 dark:border-cyan-900/60 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30"
                      >
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-500/15 flex items-center justify-center">
                              <FaRobot className="text-cyan-600 dark:text-cyan-300" />
                            </div>
                            <div>
                              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                                AI Stage Advisor
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-300">
                                Ask for a quick review before you submit the update.
                              </p>
                            </div>
                          </div>
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-white/80 dark:bg-slate-900/70 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800">
                            <FaLightbulb />
                            Live AI guidance
                          </div>
                        </div>

                        <div className="space-y-3">
                          <textarea
                            value={aiQuestion}
                            onChange={(event) => setAiQuestion(event.target.value)}
                            placeholder={`Example: Should I move ${productId || 'this product'} to ${stage || 'the selected stage'} now?`}
                            rows={4}
                            maxLength={1000}
                            className="w-full px-4 py-3 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-white/80 dark:bg-slate-900/80 text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          />

                          <div className="flex flex-wrap gap-2">
                            {[
                              'Is this stage transition appropriate?',
                              'What checks should I verify first?',
                              'Summarize the operational risk of this update.'
                            ].map((suggestion) => (
                              <button
                                key={suggestion}
                                type="button"
                                onClick={() => setAiQuestion(suggestion)}
                                className="px-3 py-2 rounded-full text-xs font-medium border border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/40 transition-colors"
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>

                          <div className="flex flex-col sm:flex-row gap-3">
                            <GlowingButton
                              type="button"
                              onClick={handleAskAI}
                              disabled={aiLoading || (!productId && !selectedProduct)}
                              className="flex-1 py-3 font-semibold"
                              glowColor="blue"
                            >
                              {aiLoading ? (
                                <>
                                  <FaSpinner className="mr-2 animate-spin" />
                                  Getting AI guidance...
                                </>
                              ) : (
                                <>
                                  <FaPaperPlane className="mr-2" />
                                  Ask AI
                                </>
                              )}
                            </GlowingButton>
                          </div>

                          <AnimatePresence>
                            {aiError && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                              >
                                <p className="text-sm text-red-700 dark:text-red-200">{aiError}</p>
                              </motion.div>
                            )}
                            {aiReply && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="p-4 rounded-lg border border-cyan-200 dark:border-cyan-800 bg-white/90 dark:bg-slate-900/80"
                              >
                                <div className="flex items-center gap-2 mb-2 text-cyan-700 dark:text-cyan-300 text-sm font-semibold">
                                  <FaRobot />
                                  AI Guidance
                                </div>
                                <AIStructuredResponse
                                  content={aiReply}
                                  fallbackTitle="Operational Guidance"
                                  titleClassName="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300"
                                  bodyClassName="text-sm leading-6 text-gray-700 dark:text-gray-200"
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </motion.div>
                    ) : null}

                    {/* Success/Error Messages */}
                    <AnimatePresence>
                      {message && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className={`p-4 rounded-lg border-2 ${
                            isSuccess
                              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {isSuccess ? (
                              <FaCheckCircle className="text-green-600 dark:text-green-400 text-xl" />
                            ) : (
                              <FaExclamationTriangle className="text-red-600 dark:text-red-400 text-xl" />
                            )}
                            <span className={`font-medium ${
                              isSuccess 
                                ? 'text-green-800 dark:text-green-200' 
                                : 'text-red-800 dark:text-red-200'
                            }`}>
                              {message}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {verificationFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <VerificationResultPanel
                          verification={verificationFeedback}
                          title="Verification Feedback"
                        />
                        {Array.isArray(verificationFeedback.stageDocumentation?.details) && verificationFeedback.stageDocumentation.details.length > 0 && (
                          <div className="mt-4 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-cyan-50 dark:bg-cyan-900/20 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300 mb-2">
                              Document Checks
                            </p>
                            <ul className="list-disc ml-5 text-sm text-cyan-800 dark:text-cyan-100 space-y-1">
                              {verificationFeedback.stageDocumentation.details.slice(0, 4).map((item, index) => (
                                <li key={index}>
                                  {item.title || item.documentType || 'Document'}: {item.reason || item.decision?.reason || 'verified'}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* Password Confirmation */}
                    <div className="relative group mb-6 border-2 border-amber-100 dark:border-amber-900/30 bg-amber-50 dark:bg-amber-900/10 p-6 rounded-lg">
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
                          placeholder="Enter your password to confirm"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
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
                        Password confirmation is required for security purposes when updating product information
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 pt-6">
                      <GlowingButton
                        type="submit"
                        disabled={loading || !productId || !stage}
                        className="flex-1 py-4 font-semibold text-lg"
                        glowColor="green"
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="mr-2 animate-spin" />
                            Updating Product...
                          </>
                        ) : (
                          <>
                            <FaEdit className="mr-2" />
                            Update Product
                          </>
                        )}
                      </GlowingButton>
                      
                      <GlowingButton
                        type="button"
                        onClick={() => navigate(-1)}
                        variant="secondary"
                        className="flex-1 py-4 font-semibold text-lg"
                        glowColor="red"
                      >
                        <FaArrowLeft className="mr-2" />
                        Back
                      </GlowingButton>
                    </div>
                  </form>
                </div>
              </AnimatedCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UpdateProduct;
