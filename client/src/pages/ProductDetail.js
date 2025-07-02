import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft, FaEdit, FaBoxOpen } from 'react-icons/fa';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/600x300?text=No+Image';
const STATUS_OPTIONS = [
  'Harvested',
  'Processed',
  'Packaged',
  'Shipped',
  'Delivered',
  'Sold',
];

function getFullUrl(url) {
  return url && url.startsWith('/uploads') ? `http://localhost:5000${url}` : url;
}

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [user, setUser] = useState(null);

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
  }, []);

  useEffect(() => {
    fetch(`/api/product/${id}`)
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
      const res = await fetch(`/api/update-product/${product.productId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ stage: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updated = await res.json();
      setProduct({ ...product, ...updated });
      toast.success('Status updated!');
      setNewStatus('');
    } catch (e) {
      toast.error(e.message);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen text-gray-800 dark:text-gray-200">Loading product details...</div>;
  if (!product) return <div className="flex justify-center items-center min-h-screen text-red-600 dark:text-red-400">Product not found.</div>;

  const status = product.stages && product.stages.length > 0 ? product.stages[product.stages.length - 1] : null;
  const canUpdateStatus = user && (user.role === 'producer' || user.role === 'admin');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900 px-2 sm:px-4 md:px-8 py-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card w-full max-w-2xl p-0 sm:p-0 rounded-2xl bg-white/90 dark:bg-gray-900/90 text-gray-900 dark:text-gray-100 shadow-xl border border-blue-500/10 overflow-hidden"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Product Image */}
        <div className="w-full h-48 sm:h-64 bg-gradient-to-br from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900 flex items-center justify-center overflow-hidden">
          {product.imageFile ? (
            <img
              src={getFullUrl(product.imageFile)}
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
            {product.description && <div className="col-span-1 sm:col-span-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base"><strong>Description:</strong> {product.description}</div>}
            {product.certFile && typeof product.certFile === 'string' && product.certFile.trim() !== '' ? (
              <div className="col-span-1 sm:col-span-2 text-gray-700 dark:text-gray-300 text-sm sm:text-base flex items-center gap-2 mt-1">
                <strong>Certificate:</strong>
                <a
                  href={getFullUrl(product.certFile)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-400 text-blue-500 font-semibold bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shadow-sm text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{ textDecoration: 'none' }}
                >
                  View Certificate
                </a>
              </div>
            ) : (
              <div className="col-span-1 sm:col-span-2 text-gray-500 text-sm sm:text-base mt-1">
                <strong>Certificate:</strong> <span>No certificate uploaded</span>
              </div>
            )}
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
                <button
                  className="ml-0 sm:ml-2 px-4 py-1 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold hover:from-blue-600 hover:to-cyan-600 transition-colors text-sm disabled:opacity-50"
                  onClick={handleStatusUpdate}
                  disabled={!newStatus || statusUpdating}
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
                <div><strong>Product ID:</strong> {product.onChain[0]}</div>
                <div><strong>Name:</strong> {product.onChain[1]}</div>
                <div><strong>Origin:</strong> {product.onChain[2]}</div>
                <div><strong>Manufacturer:</strong> {product.onChain[3]}</div>
                <div className="col-span-2"><strong>Stages:</strong> {product.onChain[4] && product.onChain[4].join(', ')}</div>
                <div className="col-span-2"><strong>Cert Hash:</strong> {product.onChain[5]}</div>
                <div><strong>Timestamp:</strong> {new Date(parseInt(product.onChain[6]) * 1000).toLocaleString()}</div>
                <div><strong>Creator:</strong> {product.onChain[7]}</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default ProductDetail; 