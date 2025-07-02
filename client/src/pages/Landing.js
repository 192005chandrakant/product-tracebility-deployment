import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const features = [
  {
    title: 'Blockchain-Powered Trust',
    desc: 'Every product lifecycle event is immutably recorded on the blockchain, ensuring transparency and authenticity.',
    icon: '🔗',
  },
  {
    title: 'QR Code Traceability',
    desc: "Scan a QR code to instantly view a product's verified history, certifications, and logistics.",
    icon: '📱',
  },
  {
    title: 'Role-Based Security',
    desc: 'Only verified producers and admins can add or update product data, keeping your supply chain secure.',
    icon: '🛡️',
  },
  {
    title: 'Modern, User-Friendly UI',
    desc: 'Enjoy a seamless, beautiful experience on any device with dark mode, animations, and glassmorphic design.',
    icon: '✨',
  },
];

const testimonials = [
  {
    name: 'Alice, Organic Producer',
    text: '"This platform gives my customers confidence in our supply chain. The blockchain verification is a game changer!"',
    avatar: 'A',
  },
  {
    name: 'Bob, Retailer',
    text: '"I can instantly verify product authenticity and logistics. The UI is beautiful and easy to use."',
    avatar: 'B',
  },
  {
    name: 'Carol, Customer',
    text: '"I love being able to scan a QR code and see the real story behind my purchases. Super transparent!"',
    avatar: 'C',
  },
];

const trustBadges = [
  { label: 'Secured by Blockchain', icon: '🔒' },
  { label: 'GDPR Compliant', icon: '✅' },
  { label: 'Trusted by Producers', icon: '🏆' },
  { label: 'Open Source', icon: '🌐' },
];

function Landing() {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('token');
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Hero Section */}
      <section className="flex flex-col md:flex-row items-center justify-between gap-10 px-6 py-16 md:py-24 max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 text-gray-900 dark:text-gray-100 leading-tight">
            Trace Every Product.<br />
            <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Trust Every Step.</span>
          </h1>
          <p className="text-lg md:text-2xl mb-8 text-gray-700 dark:text-gray-300 max-w-xl">
            The next-generation blockchain-based product traceability platform for producers, retailers, and customers.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            className="btn-primary px-8 py-4 text-lg mb-4"
            onClick={() => isLoggedIn ? navigate('/home') : navigate('/auth/register')}
          >
            Get Started
          </motion.button>
          <button
            className="ml-4 text-blue-600 dark:text-blue-400 underline font-semibold"
            onClick={() => navigate('/scan')}
          >
            Try QR Scan
          </button>
          <div className="flex flex-wrap gap-4 mt-8">
            {trustBadges.map(badge => (
              <div key={badge.label} className="flex items-center gap-2 px-4 py-2 card text-sm font-semibold text-gray-800 dark:text-gray-100">
                <span className="text-xl">{badge.icon}</span> {badge.label}
              </div>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1 flex justify-center"
        >
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"
            alt="Product Traceability"
            className="rounded-2xl shadow-xl max-w-xs md:max-w-md card border-2 border-white/30"
          />
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-12 px-6 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">Why Choose Us?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map(f => (
            <motion.div
              key={f.title}
              className="card p-6 flex flex-col items-center text-center shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="font-bold text-lg mb-2">{f.title}</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 px-6 max-w-5xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-10 text-gray-900 dark:text-gray-100">What Our Users Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(t => (
            <motion.div
              key={t.name}
              className="card p-6 flex flex-col items-center text-center shadow-lg"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
            >
              <div className="avatar-ring mb-3">
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-2xl">
                  {t.avatar}
                </div>
              </div>
              <p className="italic text-gray-700 dark:text-gray-300 mb-3">{t.text}</p>
              <span className="font-semibold text-gray-900 dark:text-gray-100">{t.name}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 px-6 max-w-3xl mx-auto text-center">
        <motion.h3
          className="text-2xl md:text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Ready to build trust in your supply chain?
        </motion.h3>
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.97 }}
          className="btn-primary px-10 py-4 text-lg"
          onClick={() => isLoggedIn ? navigate('/home') : navigate('/auth/register')}
        >
          Get Started Now
        </motion.button>
      </section>
    </div>
  );
}

export default Landing; 