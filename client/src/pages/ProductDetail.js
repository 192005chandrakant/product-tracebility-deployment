import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { toast, ToastContainer } from 'react-toastify';
import { FaArrowLeft, FaEdit, FaBoxOpen, FaShieldAlt, FaMapMarkerAlt, FaIndustry, FaCertificate, FaClock, FaUser, FaQrcode, FaLock } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import CertificateViewer from '../components/CertificateViewer'; // Import the new component
import Scene3D from '../components/3D/Scene3D';
import AnimatedCard from '../components/UI/AnimatedCard';
import GlowingButton from '../components/UI/GlowingButton';
import ParticleBackground from '../components/UI/ParticleBackground';
import { getAPIBaseURL, buildAPIURL } from '../utils/apiConfig';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x300?text=No+Image';
const STATUS_OPTIONS = [
  'Harvested',
  'Processed',
  'Packaged',
  'Shipped',
  'Delivered',
  'Sold',
];

function getImageUrl(fileData) {
  if (!fileData) return null;
  
  // If it's an object with publicUrl (Cloudinary or other storage)
  if (typeof fileData === 'object' && fileData.publicUrl) {
    return fileData.publicUrl;
  }
  
  // Legacy format - local file path
  if (typeof fileData === 'string' && fileData) {
    // Use API config utility for resolving file URLs
    const { resolveFileURL } = require('../utils/apiConfig');
    return resolveFileURL(fileData);
  }
  
  return null;
}

function getDownloadUrl(fileData) {
  if (!fileData) {
    console.log('No file data provided');
    return null;
  }
  
  // If it's an object with downloadUrl (Cloudinary or other storage)
  if (typeof fileData === 'object') {
    let url = null;
    
    if (fileData.downloadUrl) {
      console.log('Using downloadUrl from file data:', fileData.downloadUrl);
      url = fileData.downloadUrl;
    } else if (fileData.shareUrl) {
      console.log('Using shareUrl from file data:', fileData.shareUrl);
      url = fileData.shareUrl;
    } else if (fileData.publicUrl) {
      console.log('Using publicUrl from file data:', fileData.publicUrl);
      url = fileData.publicUrl;
    } else if (fileData.url) {
      console.log('Using url from file data:', fileData.url);
      url = fileData.url;
    } else if (fileData.secure_url) {
      // Cloudinary sometimes uses secure_url
      console.log('Using secure_url from file data:', fileData.secure_url);
      url = fileData.secure_url;
    } else {
      console.log('File data object has no URL:', fileData);
      return null;
    }
    
    // Fix malformed Cloudinary URLs
    if (url && url.includes('cloudinary.com') && url.includes('/fl_attachment:') && url.includes('pdf')) {
      const originalFileName = fileData.originalFileName || fileData.fileName || 'certificate.pdf';
      url = fixCloudinaryDownloadUrl(url, originalFileName);
    }
    
    return url;
  }
  
  // Legacy format - string URL or path
  if (typeof fileData === 'string' && fileData) {
    console.log('Using string URL/path:', fileData);
    return fileData.startsWith('/uploads') ? `${getAPIBaseURL()}${fileData}` : fileData;
  }
  
  console.log('Unknown file data format:', fileData);
  return null;
}

// Helper function to fix malformed Cloudinary download URLs
function fixCloudinaryDownloadUrl(malformedUrl, originalFileName) {
  if (!malformedUrl || !malformedUrl.includes('cloudinary.com')) {
    return malformedUrl;
  }

  try {
    // Check if URL has fl_attachment in wrong position
    if (malformedUrl.includes('/fl_attachment:')) {
      // Extract the base URL and the file path
      const beforeAttachment = malformedUrl.split('/fl_attachment:')[0];
      const afterAttachment = malformedUrl.split('/fl_attachment:')[1];
      
      // Find where the actual file path starts (after the filename parameter)
      const filePathMatch = afterAttachment.match(/\/v\d+\/(.+)$/);
      if (filePathMatch) {
        const filePath = filePathMatch[0]; // includes the /v1234567890/...
        
        // Reconstruct URL correctly - fl_attachment should be right after /upload/
        const uploadIndex = beforeAttachment.lastIndexOf('/upload');
        if (uploadIndex !== -1) {
          const baseUrl = beforeAttachment.substring(0, uploadIndex);
          const cleanFileName = originalFileName ? originalFileName.replace(/[^a-zA-Z0-9.-]/g, '_') : 'file';
          const fixedUrl = `${baseUrl}/upload/fl_attachment:${cleanFileName}${filePath}`;
          console.log('🔧 Fixed download URL:', {
            original: malformedUrl,
            fixed: fixedUrl
          });
          return fixedUrl;
        }
      }
    }
  } catch (error) {
    console.error('❌ Error fixing download URL:', error);
  }
  
  return malformedUrl;
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [user, setUser] = useState(null);
  const [confirmPassword, setConfirmPassword] = useState(''); // Add password state for confirmation
  const [qrCode, setQrCode] = useState(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [txHash, setTxHash] = useState(null);

  // Function to fetch QR code
  const fetchQrCode = async () => {
    try {
      if (!product || !product.productId) return;
      
      setLoadingQR(true);
      const res = await fetch(buildAPIURL(`/api/product/${product.productId}/qr`));
      
      if (!res.ok) {
        throw new Error('Failed to fetch QR code');
      }
      
      const data = await res.json();
      
      if (data.success && data.qrCode) {
        setQrCode(data.qrCode);
        // Also update the product object with the QR code
        setProduct(prev => ({
          ...prev,
          qrCode: data.qrCode
        }));
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      toast.error('Failed to load QR code');
    } finally {
      setLoadingQR(false);
    }
  };

  // Function to handle QR code download
  const handleQrDownload = () => {
    if (!product?.qrCode?.publicUrl && !product?.qrCode?.downloadUrl) {
      toast.error('No QR code available to download');
      return;
    }
    
    const fileName = `qr_${product.productId}.png`;
    
    try {
      const qrUrl = product.qrCode.publicUrl;
      
      if (qrUrl.startsWith('data:')) {
        // Handle base64 data
        const link = document.createElement('a');
        link.href = qrUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('QR code downloaded successfully!');
      } else {
        // Handle URL (Cloudinary or other)
        let downloadUrl = product.qrCode.downloadUrl || qrUrl;
        
        // Fix Cloudinary URL if needed (same fix as for certificates)
        if (downloadUrl.includes('cloudinary.com') && downloadUrl.includes('/fl_attachment:')) {
          // Extract parts of the URL
          const urlParts = downloadUrl.split('/fl_attachment:');
          if (urlParts.length === 2) {
            // Find the version and path
            const pathMatch = urlParts[1].match(/\/v\d+\/.+$/);
            if (pathMatch) {
              // Fix the URL by using a query parameter instead
              downloadUrl = `${urlParts[0]}${pathMatch[0]}?fl_attachment=${fileName}`;
              console.log('Fixed broken QR download URL:', downloadUrl);
            }
          }
        }
        
        // Add fl_attachment parameter if not already present
        if (downloadUrl.includes('cloudinary.com') && !downloadUrl.includes('fl_attachment')) {
          downloadUrl = `${downloadUrl}${downloadUrl.includes('?') ? '&' : '?'}fl_attachment=${fileName}`;
        }
        
        console.log('QR download URL:', downloadUrl);
        
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
      console.error('QR download error:', error);
      toast.error('Failed to download QR code');
    }
  };

  useEffect(() => {
    // Get user info from token (for role-based status update)
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser(decoded);
      } catch (e) {
        setUser(null);
      }
    }
    
    // Check for transaction hash passed in location state
    const locationState = window.history.state?.usr;
    if (locationState?.txHash) {
      setTxHash(locationState.txHash);
      console.log('Transaction hash detected:', locationState.txHash);
    }
  }, []);

  useEffect(() => {
    fetch(buildAPIURL(`/api/product/${id}`))
      .then(res => {
        if (!res.ok) {
          throw new Error('Product not found or API error');
        }
        return res.json();
      })
      .then(data => {
        setProduct(data);
        setLoading(false);
      })
      .catch(err => {
        toast.error(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setStatusUpdating(true);
    try {
      const res = await fetch(buildAPIURL(`/api/update-product/${product.productId}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ stage: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');
      
      // Save transaction hash if available
      if (data.txHash) {
        setTxHash(data.txHash);
      }
      
      // Update the product state with the returned data
      setProduct(prevProduct => ({ 
        ...prevProduct, 
        stages: [...(prevProduct.stages || []), newStatus],
        blockchainTx: data.blockchainTx 
      }));
      
      toast.success('Status updated successfully!');
      setNewStatus('');
    } catch (e) {
      console.error('Status update error:', e);
      toast.error(e.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  useEffect(() => {
    if (product && product.productId && !product.qrCode) {
      fetchQrCode();
    }
  }, [product]);

  if (loading) {
    return (
      <div className="min-h-screen transition-all duration-300
        bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="min-h-screen transition-all duration-300
        bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
        dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <p className="text-red-500 dark:text-red-400 text-xl mb-4">Product not found.</p>
            <GlowingButton
              variant="ghost"
              className="mt-4"
            onClick={() => navigate('/')}
          >
            <FaArrowLeft className="mr-2" />
            Go Back
          </GlowingButton>
          </div>
        </div>
      </div>
    );
  }

  const status = product.stages && product.stages.length > 0 ? product.stages[product.stages.length - 1] : null;
  const canUpdateStatus = user && (user.role === 'producer' || user.role === 'admin') && 
                          product && product.createdByWallet === user.email;

  return (
    <div className="min-h-screen transition-all duration-300
      bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 
      dark:bg-gradient-to-br dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 
      flex flex-col justify-center items-center py-8 px-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card w-full max-w-3xl p-0 sm:p-0 rounded-2xl 
          bg-white dark:bg-gray-800 
          text-gray-900 dark:text-gray-100 
          shadow-xl border border-gray-200 dark:border-gray-700 
          overflow-hidden mx-auto"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Product Image */}
        <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center overflow-hidden">
          {getImageUrl(product.imageFile) ? (
            <img
              src={getImageUrl(product.imageFile)}
              alt={product.name}
              className="object-cover w-full h-full"
              onError={e => { e.target.onerror = null; e.target.src = PLACEHOLDER_IMG; }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full text-blue-400">
              <FaBoxOpen className="text-6xl mb-2" />
              <span className="text-xs">No Image</span>
            </div>
          )}
        </div>
        <div className="p-4 sm:p-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="mb-6 px-6 py-2 rounded-xl border border-blue-400 text-blue-500 font-semibold flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Back
          </motion.button>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 text-center break-words">{product.name}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4">
            <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"><strong>Product ID:</strong> {product.productId}</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"><strong>Origin:</strong> {product.origin}</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base"><strong>Manufacturer:</strong> {product.manufacturer}</div>
            <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base overflow-x-auto"><strong>Cert Hash:</strong> <span className="break-all">{product.blockchainRefHash}</span></div>
            {txHash && (
              <div className="col-span-1 sm:col-span-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base overflow-x-auto bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg border border-blue-200 dark:border-blue-800 mt-2">
                <strong>Last Transaction Hash:</strong> 
                <div className="flex items-center gap-2 mt-1">
                  <span className="break-all font-mono text-xs">{txHash}</span>
                  <button 
                    className="text-blue-500 hover:text-blue-700"
                    onClick={() => {
                      navigator.clipboard.writeText(txHash);
                      toast.info('Transaction hash copied!', { autoClose: 1500 });
                    }}
                    title="Copy hash"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
            {product.description && <div className="col-span-1 sm:col-span-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base"><strong>Description:</strong> {product.description}</div>}
            
            {/* Use the new CertificateViewer component */}
            <CertificateViewer product={product} getDownloadUrl={getDownloadUrl} />
            
            {/* QR Code Display */}
            <div className="col-span-1 sm:col-span-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base flex flex-col items-center gap-2 mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <strong>Product QR Code:</strong>
              
              {loadingQR ? (
                <div className="w-32 h-32 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : product.qrCode && product.qrCode.publicUrl ? (
                <>
                  <img 
                    src={product.qrCode.publicUrl} 
                    alt="Product QR Code" 
                    className="w-32 h-32 object-contain bg-white p-2 rounded-lg"
                  />
                  <button
                    onClick={handleQrDownload}
                    className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <FaQrcode className="w-4 h-4" />
                    Download QR Code
                  </button>
                </>
              ) : (
                <button
                  onClick={fetchQrCode}
                  className="mt-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <FaQrcode className="w-4 h-4" />
                  Generate QR Code
                </button>
              )}
            </div>
          </div>

          {/* Product Status */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-gray-100">Status:</span>
            {status ? (
              <span className="inline-block px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold">{status}</span>
            ) : (
              <span className="inline-block px-3 py-1 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 text-xs font-semibold">No Status</span>
            )}
            {canUpdateStatus && (
              <>
                <select
                  className="ml-0 sm:ml-4 px-3 py-1 rounded-lg border border-blue-300 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  value={newStatus}
                  onChange={e => setNewStatus(e.target.value)}
                  disabled={statusUpdating}
                >
                  <option value="">Update Status...</option>
                  {STATUS_OPTIONS.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
                <div className="flex flex-col mt-2 sm:mt-0">
                  <div className="flex items-center gap-1 ml-0 sm:ml-2 mb-1">
                    <FaLock className="text-amber-500 text-xs" />
                    <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">Password required</span>
                  </div>
                  <input
                    type="password"
                    className="ml-0 sm:ml-2 px-3 py-1 rounded-lg border border-amber-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none bg-amber-50 dark:bg-amber-900/20"
                    placeholder="Enter password to confirm"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    disabled={statusUpdating}
                    required
                  />
                </div>
                <button
                  className="ml-0 sm:ml-2 px-4 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-colors text-sm disabled:opacity-50"
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || !confirmPassword || statusUpdating}
                >
                  {statusUpdating ? 'Updating...' : <><FaEdit className="inline mr-1" />Update</>}
                </button>
              </>
            )}
          </div>

          <h3 className="text-xl sm:text-2xl font-bold mb-4 text-center">Product Lifecycle</h3>
          <VerticalTimeline layout="1-column" lineColor="#3b82f6">
            {(product.stages || []).map((stage, i) => (
              <VerticalTimelineElement
                key={i}
                contentStyle={{ background: 'rgba(59, 130, 246, 0.1)', color: '#1e293b', boxShadow: 'none', borderRadius: '0.75rem' }}
                contentArrowStyle={{ borderRight: '7px solid #3b82f6' }}
                iconStyle={{ background: '#3b82f6', color: '#fff', boxShadow: '0 0 0 4px #3b82f6, inset 0 2px 0 rgba(0,0,0,.08), 0 3px 0 rgba(0,0,0,.05)' }}
                icon={<span>{i + 1}</span>}
                date={null}
              >
                <h4 className="vertical-timeline-element-title font-semibold text-gray-900 dark:text-gray-100">{stage}</h4>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{new Date(product.createdAt).toLocaleString()}</p>
              </VerticalTimelineElement>
            ))}
          </VerticalTimeline>

          {product.blockchainTx && (
            <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg text-xs sm:text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600 overflow-x-auto">
              <strong>Blockchain Transaction:</strong> <a href={`https://sepolia.etherscan.io/tx/${product.blockchainTx}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{product.blockchainTx}</a>
            </div>
          )}
          {product.onChain && (
            <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
              <h4 className="font-semibold mb-2 text-lg text-gray-900 dark:text-gray-100">On-Chain Data:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
  <div className="truncate"><strong>Product ID:</strong> <span className="break-all">{product.onChain[0]}</span></div>
  <div className="truncate"><strong>Name:</strong> <span className="break-all">{product.onChain[1]}</span></div>
  <div className="truncate"><strong>Origin:</strong> <span className="break-all">{product.onChain[2]}</span></div>
  <div className="truncate"><strong>Manufacturer:</strong> <span className="break-all">{product.onChain[3]}</span></div>
  <div className="col-span-2 truncate"><strong>Stages:</strong> <span className="break-all">{product.onChain[4] && product.onChain[4].join(', ')}</span></div>
  <div className="col-span-2 truncate"><strong>Cert Hash:</strong> <span className="break-all">{product.onChain[5]}</span></div>
  <div className="truncate"><strong>Timestamp:</strong> <span className="break-all">{new Date(parseInt(product.onChain[6]) * 1000).toLocaleString()}</span></div>
  <div className="truncate"><strong>Creator:</strong> <span className="break-all">{product.onChain[7]}</span></div>
</div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetail;