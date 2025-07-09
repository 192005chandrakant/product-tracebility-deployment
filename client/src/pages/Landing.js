import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Scene3D from '../components/3D/Scene3D';
import AnimatedCard from '../components/UI/AnimatedCard';
import GlowingButton from '../components/UI/GlowingButton';
import ParticleBackground from '../components/UI/ParticleBackground';

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
  
  const handleGetStarted = () => {
    console.log('Get Started clicked, isLoggedIn:', isLoggedIn);
    if (isLoggedIn) {
      console.log('Navigating to /home');
      navigate('/home');
    } else {
      console.log('Navigating to /auth/login');
      navigate('/auth/login');
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      <ParticleBackground count={80} />
      
      {/* Hero Section */}
      <section className="flex flex-col lg:flex-row items-center justify-between gap-10 px-6 py-16 md:py-24 max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7 }}
          className="flex-1"
        >
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-extrabold mb-6 text-white leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Trace Every Product.<br />
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Trust Every Step.
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-2xl mb-8 text-gray-300 max-w-xl leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The next-generation blockchain-based product traceability platform for producers, retailers, and customers.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-wrap gap-4 mb-8"
          >
            <GlowingButton
              variant="primary"
              size="lg"
              onClick={handleGetStarted}
            >
              Get Started
            </GlowingButton>
            <GlowingButton
              variant="ghost"
              size="lg"
              onClick={() => navigate('/scan')}
            >
              Try QR Scan
            </GlowingButton>
          </motion.div>
          
          <motion.div 
            className="flex flex-wrap gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {trustBadges.map((badge, index) => (
              <AnimatedCard
                key={badge.label}
                delay={0.1 * index}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm font-semibold text-white"
                hover={false}
              >
                <span className="text-xl">{badge.icon}</span> {badge.label}
              </AnimatedCard>
            ))}
          </motion.div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex-1 max-w-lg h-96 lg:h-[500px]"
        >
          <Scene3D variant="hero" />
        </motion.div>
      </section>
      
      {/* Features Section */}
      <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Why Choose <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">TraceChain?</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Experience the future of supply chain transparency with cutting-edge blockchain technology
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <AnimatedCard
              key={feature.title}
              delay={0.1 * index}
              className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl hover:bg-white/20 transition-all duration-300"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-300">{feature.desc}</p>
            </AnimatedCard>
          ))}
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            What Our Users Say
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Join thousands of satisfied users who trust TraceChain
          </p>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <AnimatedCard
              key={testimonial.name}
              delay={0.1 * index}
              className="p-6 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan-400 to-blue-400 flex items-center justify-center text-white font-bold text-xl">
                {testimonial.avatar}
              </div>
              <p className="italic text-gray-300 mb-4 text-lg">{testimonial.text}</p>
              <span className="font-semibold text-white">{testimonial.name}</span>
            </AnimatedCard>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 md:py-24 px-6 max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-3xl p-8 md:p-12"
        >
          <h3 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to build trust in your 
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> supply chain?</span>
          </h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the revolution and experience transparent, secure product traceability
          </p>
          <GlowingButton
            variant="primary"
            size="xl"
            onClick={handleGetStarted}
          >
            Get Started Now
          </GlowingButton>
        </motion.div>
      </section>
    </div>
  );
}

export default Landing;