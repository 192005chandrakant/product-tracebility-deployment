import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { VerticalTimeline, VerticalTimelineElement } from 'react-vertical-timeline-component';
import 'react-vertical-timeline-component/style.min.css';
import { useNavigate } from 'react-router-dom';
import { FaPlusCircle } from 'react-icons/fa';

function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // TODO: Add authentication and filtering
    fetch('/api/products')
      .then(res => res.json())
      .then(data => setProducts(data));
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center bg-transparent p-4">
      <motion.div
        className="card p-8 w-full max-w-4xl text-gray-900 dark:text-gray-100"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-6xl mx-auto p-4 mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {products.map((p, idx) => (
            <motion.div
              key={p.productId}
              className="rounded-2xl bg-glass dark:bg-glassDark shadow-glass dark:shadow-neuDark p-6 backdrop-blur-md border border-white/20"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">{p.name}</h3>
              <div className="mb-2 text-gray-700 dark:text-gray-300">Product ID: {p.productId}</div>
              <div className="mb-2 text-gray-700 dark:text-gray-300">Status: {p.stages && p.stages[p.stages.length-1]}</div>
              <div className="mb-4">
                <VerticalTimeline layout="1-column" lineColor="#3b82f6">
                  {(p.stages || []).map((stage, i) => (
                    <VerticalTimelineElement
                      key={i}
                      contentStyle={{ background: 'rgba(59,130,246,0.1)', color: '#1e293b', boxShadow: 'none' }}
                      contentArrowStyle={{ borderRight: '7px solid #3b82f6' }}
                      iconStyle={{ background: '#3b82f6', color: '#fff' }}
                      icon={<span>{i+1}</span>}
                      date={null}
                    >
                      <div className="font-semibold">{stage}</div>
                    </VerticalTimelineElement>
                  ))}
                </VerticalTimeline>
              </div>
            </motion.div>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary mt-6 w-full py-3 text-lg btn-icon"
          onClick={() => navigate('/add-product')}
        >
          <FaPlusCircle />
          Add Product
        </motion.button>
      </motion.div>
    </div>
  );
}

export default AdminDashboard; 