import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaArrowLeft } from 'react-icons/fa';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

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
        // Optionally redirect if product is not found
        // setTimeout(() => navigate('/'), 2000);
      });
  }, [id, navigate]);

  if (loading) return <div className="flex justify-center items-center min-h-screen text-gray-800 dark:text-gray-200">Loading product details...</div>;
  if (!product) return <div className="flex justify-center items-center min-h-screen text-red-600 dark:text-red-400">Product not found.</div>;

  const onChain = product.onChain;

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-4">
      <ToastContainer position="top-center" />
      <motion.div
        className="card p-8 w-full max-w-2xl text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-secondary mt-6 w-full py-3 text-lg btn-icon"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
          Back
        </motion.button>

        <h2 className="text-3xl font-bold mb-4 text-center">{product.name}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="text-gray-700 dark:text-gray-300"><strong>Product ID:</strong> {product.productId}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong>Origin:</strong> {product.origin}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong>Manufacturer:</strong> {product.manufacturer}</div>
          <div className="text-gray-700 dark:text-gray-300"><strong>Cert Hash:</strong> {product.blockchainRefHash}</div>
          {product.description && <div className="col-span-2 text-gray-700 dark:text-gray-300"><strong>Description:</strong> {product.description}</div>}
          {product.certFile && (
            <div className="col-span-2 text-gray-700 dark:text-gray-300">
              <strong>Certificate:</strong> <a href={product.certFile} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">View Certificate</a>
            </div>
          )}
        </div>

        <h3 className="text-2xl font-bold mb-4 text-center">Product Lifecycle</h3>
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
              <p className="text-sm text-gray-600 dark:text-gray-400">{new Date(product.createdAt).toLocaleString()}</p>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>

        {product.blockchainTx && (
          <div className="mt-6 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-slate-600">
            <strong>Blockchain Transaction:</strong> <a href={`https://sepolia.etherscan.io/tx/${product.blockchainTx}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline break-all">{product.blockchainTx}</a>
          </div>
        )}
        {onChain && (
          <div className="mt-4 p-4 bg-gray-100 dark:bg-slate-700 rounded-lg border border-gray-200 dark:border-slate-600">
            <h4 className="font-semibold mb-2 text-lg text-gray-900 dark:text-gray-100">On-Chain Data:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-700 dark:text-gray-300">
              <div><strong>Product ID:</strong> {onChain[0]}</div>
              <div><strong>Name:</strong> {onChain[1]}</div>
              <div><strong>Origin:</strong> {onChain[2]}</div>
              <div><strong>Manufacturer:</strong> {onChain[3]}</div>
              <div className="col-span-2"><strong>Stages:</strong> {onChain[4] && onChain[4].join(', ')}</div>
              <div className="col-span-2"><strong>Cert Hash:</strong> {onChain[5]}</div>
              <div><strong>Timestamp:</strong> {new Date(parseInt(onChain[6]) * 1000).toLocaleString()}</div>
              <div><strong>Creator:</strong> {onChain[7]}</div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default ProductDetail; 