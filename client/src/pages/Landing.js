import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowRight,
  FaBars,
  FaBolt,
  FaBrain,
  FaCheckCircle,
  FaChartLine,
  FaCloud,
  FaCodeBranch,
  FaDatabase,
  FaLink,
  FaMoon,
  FaPlay,
  FaQrcode,
  FaRobot,
  FaShieldAlt,
  FaStar,
  FaSun,
  FaTimes,
  FaUsers,
} from 'react-icons/fa';
import BrandLogo from '../components/BrandLogo';
import '../styles/landing.css';

const LazyScene3D = lazy(() => import('../components/3D/Scene3D'));

const SectionReveal = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.6, delay }}
  >
    {children}
  </motion.div>
);

const logos = ['Walmart', 'Nestle', 'PepsiCo', 'Unilever', 'DHL', 'Maersk'];

const coreFeatures = [
  {
    title: 'Full Product Provenance',
    text: 'Track every handoff with immutable blockchain-backed records from origin to shelf.',
    bullets: ['Source-level event history', 'Tamper-resistant checkpoints', 'Exportable compliance trails'],
  },
  {
    title: 'Operational Intelligence',
    text: 'Detect bottlenecks and quality risks with structured analytics layered over your supply network.',
    bullets: ['Live throughput metrics', 'Anomaly highlights', 'Region-level risk scoring'],
  },
];

const howItWorks = [
  { title: 'Create Product Twin', desc: 'Register product metadata and certification records.', icon: FaDatabase },
  { title: 'Capture Chain Events', desc: 'Producers and partners append verified lifecycle steps.', icon: FaCodeBranch },
  { title: 'Verify via QR', desc: 'Stakeholders scan to validate authenticity in seconds.', icon: FaQrcode },
  { title: 'Act on Insights', desc: 'Use AI summaries to resolve issues faster.', icon: FaBrain },
];

const featureGrid = [
  { title: 'Smart Alerts', desc: 'Get quality and delay alerts before they escalate.', icon: FaBolt },
  { title: 'Role Governance', desc: 'Built-in producer, admin, and consumer access models.', icon: FaUsers },
  { title: 'Audit Exports', desc: 'Generate trusted reports for regulators and partners.', icon: FaShieldAlt },
  { title: 'Realtime Dashboards', desc: 'Visual KPI boards for supply and compliance teams.', icon: FaChartLine },
  { title: 'AI Explanations', desc: 'Understand anomalies with natural-language summaries.', icon: FaRobot },
  { title: 'Open APIs', desc: 'Integrate with ERP, WMS, and quality systems.', icon: FaCloud },
];

const platformModules = [
  {
    title: 'Producer Operations',
    desc: 'Register product identity, upload proof documents, generate printable QR codes, and update lifecycle stages without leaving the command center.',
    icon: FaDatabase,
  },
  {
    title: 'AI Evidence Review',
    desc: 'Gemini-assisted verification checks certificate fields, document consistency, stage evidence, and risk signals before records are trusted.',
    icon: FaBrain,
  },
  {
    title: 'Public Verification',
    desc: 'Consumers scan a QR code and see product origin, certification status, lifecycle events, transaction hashes, and trust indicators in one readable profile.',
    icon: FaQrcode,
  },
  {
    title: 'Admin Moderation',
    desc: 'Admins review flagged products, inspect risk scores, approve or reject records, and export transparent audit activity.',
    icon: FaShieldAlt,
  },
];

const integrations = ['SAP', 'Oracle', 'Salesforce', 'Shopify', 'Snowflake', 'MongoDB', 'Slack', 'Power BI'];
const securityBadges = ['ISO 27001', 'SOC 2 Ready', 'GDPR Aligned', 'Blockchain Verified'];

const outcomeMetrics = [
  { value: '42%', label: 'Less Manual Audit Work', detail: 'Automated proof trails reduce weekly compliance effort.' },
  { value: '99.98%', label: 'Ledger Integrity', detail: 'Immutable checkpoints secure chain-of-custody events.' },
  { value: '1.2s', label: 'Avg Verification Time', detail: 'Fast QR validation at warehouse and retail touchpoints.' },
  { value: '+31%', label: 'Consumer Trust Lift', detail: 'Transparent product stories improve confidence at purchase.' },
];

const trustPillars = [
  {
    title: 'Cryptographic Anchoring',
    text: 'Each lifecycle step is hashed and anchored to blockchain records for tamper evidence.',
    icon: FaLink,
  },
  {
    title: 'Role-Based Governance',
    text: 'Producer, admin, and verifier workflows enforce least-privilege access across teams.',
    icon: FaUsers,
  },
  {
    title: 'Continuous Validation',
    text: 'AI and rule pipelines evaluate stage evidence in near real time and flag anomalies.',
    icon: FaBrain,
  },
  {
    title: 'Audit-Ready Exports',
    text: 'Generate complete verification evidence packets for regulators and partners.',
    icon: FaShieldAlt,
  },
];

const pricingPlans = [
  {
    name: 'Starter',
    price: '$0',
    cycle: '/month',
    tagline: 'For pilots and small product lines',
    features: ['Up to 1,000 verifications', 'QR trace pages', 'Basic dashboard'],
    cta: 'Start Free',
    featured: false,
  },
  {
    name: 'Growth',
    price: '$149',
    cycle: '/month',
    tagline: 'For scaling supply operations',
    features: ['Up to 25,000 verifications', 'AI verification insights', 'Role-based controls'],
    cta: 'Choose Growth',
    featured: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    cycle: '',
    tagline: 'For global, multi-region networks',
    features: ['Unlimited verifications', 'Dedicated onboarding', 'SLA and compliance exports'],
    cta: 'Talk to Sales',
    featured: false,
  },
];

function Landing() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') {
      return false;
    }
    return document.documentElement.classList.contains('dark');
  });

  const navItems = useMemo(
    () => [
      { label: 'Features', href: '#features' },
      { label: 'Platform', href: '#platform' },
      { label: 'How It Works', href: '#how-it-works' },
      { label: 'Security', href: '#security' },
      { label: 'Pricing', href: '#pricing' },
    ],
    []
  );

  const handleGetStarted = () => {
    const isLoggedIn = !!localStorage.getItem('token');
    navigate(isLoggedIn ? '/home' : '/auth/login');
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { dark: next } }));
  };

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 640) {
        setMobileOpen(false);
      }
    };

    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className="landing-shell min-h-screen overflow-x-clip">
      <header className="sticky top-0 z-50 border-b border-slate-200/50 dark:border-slate-700/50 bg-white/75 dark:bg-slate-950/65 backdrop-blur-xl">
        <div className="lp-container flex h-16 items-center justify-between gap-4">
          <button className="flex items-center gap-2" onClick={() => navigate('/')}>
            <BrandLogo size="sm" animated />
          </button>

          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="hover:text-slate-900 dark:hover:text-white transition-colors">
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden sm:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="h-10 w-10 rounded-xl lp-glass flex items-center justify-center text-slate-700 dark:text-slate-100"
              aria-label="Toggle theme"
            >
              {isDark ? <FaSun /> : <FaMoon />}
            </button>
            <button
              onClick={handleGetStarted}
              className="lp-gradient-btn h-10 px-5 rounded-xl text-sm font-semibold inline-flex items-center gap-2"
            >
              Start Free <FaArrowRight className="text-xs" />
            </button>
          </div>

          <button
            onClick={() => setMobileOpen((prev) => !prev)}
            className="sm:hidden h-10 w-10 rounded-xl lp-glass flex items-center justify-center"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {mobileOpen && (
          <div className="sm:hidden border-t border-slate-200/50 dark:border-slate-700/50 pb-4">
            <div className="lp-container pt-3 flex flex-col gap-3">
              {navItems.map((item) => (
                <a key={item.href} href={item.href} className="px-3 py-2 rounded-lg lp-glass" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </a>
              ))}
              <div className="grid grid-cols-2 gap-3 mt-2">
                <button onClick={toggleTheme} className="h-10 rounded-xl lp-glass font-medium inline-flex items-center justify-center gap-2">
                  {isDark ? <FaSun /> : <FaMoon />} Theme
                </button>
                <button onClick={handleGetStarted} className="h-10 rounded-xl lp-gradient-btn font-semibold">
                  Start
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="lp-section lp-hero-section pt-12 sm:pt-16 lg:pt-24">
          <div className="lp-container grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-16 items-start lg:items-center">
            <motion.div initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold tracking-wide uppercase text-purple-700 dark:text-purple-200 bg-purple-500/15 border border-purple-300/20 rounded-full px-3 py-1.5 mb-6">
                <FaStar className="text-teal-300" /> Blockchain + AI Traceability Platform
              </p>
              <h1 className="lp-display text-[clamp(2rem,9vw,4rem)] lg:text-[clamp(3.75rem,5vw,4.75rem)] font-semibold leading-[1.05] tracking-tight">
                Turn every product into a
                <span className="lp-gradient-text"> transparent growth engine.</span>
              </h1>
              <p className="lp-lead mt-6 text-base sm:text-lg leading-relaxed text-slate-600 dark:text-slate-300 max-w-xl">
                Register products, validate certification evidence with Gemini, anchor lifecycle events to blockchain, and let consumers verify authenticity instantly from a QR scan.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <motion.button
                  whileHover={{ y: -2, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleGetStarted}
                  className="lp-gradient-btn h-12 px-6 rounded-xl font-semibold inline-flex items-center justify-center gap-2"
                >
                  Get Started <FaArrowRight className="text-xs" />
                </motion.button>
                <motion.button
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/scan')}
                  className="h-12 px-6 rounded-xl border border-slate-300/80 dark:border-slate-600 text-slate-700 dark:text-slate-100 font-semibold inline-flex items-center justify-center gap-2"
                >
                  <FaPlay className="text-xs" /> Live Demo
                </motion.button>
              </div>
              <div className="mt-7 flex flex-wrap gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                {['On-chain proof trails', 'Gemini evidence review', 'QR consumer verification', 'Producer command center'].map((item) => (
                  <span key={item} className="lp-chip px-3 py-1.5 rounded-full border border-slate-300/80 dark:border-slate-600/90">
                    {item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="relative"
            >
              <div className="relative lp-card rounded-3xl p-4 sm:p-6 overflow-hidden">
                <div className="lp-blob lp-blob-a" />
                <div className="lp-blob lp-blob-b" />
                <motion.div
                  animate={{ y: [0, 8, 0], x: [0, 6, 0] }}
                  transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
                  className="lp-grid-pattern absolute inset-0 opacity-40"
                />
                <div className="relative z-10 h-[280px] sm:h-[360px] lg:h-[420px] rounded-2xl border border-slate-200/60 dark:border-slate-700/60 overflow-hidden bg-slate-100/80 dark:bg-slate-900/60">
                  <Suspense fallback={<div className="h-full w-full animate-pulse bg-slate-200 dark:bg-slate-800" />}>
                    <LazyScene3D variant="hero" />
                  </Suspense>
                </div>
                <motion.div
                  animate={{ y: [0, -7, 0] }}
                  transition={{ repeat: Infinity, duration: 3.4 }}
                  className="absolute right-6 bottom-6 lp-glass rounded-xl px-4 py-3 text-sm"
                >
                  99.98% trace event integrity
                </motion.div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="pb-10 sm:pb-14">
          <div className="lp-container">
            <SectionReveal>
              <p className="text-center text-xs sm:text-sm uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400 mb-6">
                Trusted by global supply chain leaders
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {logos.map((logo) => (
                  <div key={logo} className="lp-logo lp-glass rounded-xl py-3 text-center text-sm font-semibold">
                    {logo}
                  </div>
                ))}
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="outcomes">
          <div className="lp-container">
            <SectionReveal>
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                  <p className="lp-kicker">Outcome Snapshot</p>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Operational impact teams can measure</h2>
                </div>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl">
                  From verification speed to consumer confidence, TraceChain aligns trust outcomes with business KPIs.
                </p>
              </div>
            </SectionReveal>
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {outcomeMetrics.map((metric, index) => (
                <SectionReveal key={metric.label} delay={index * 0.05}>
                  <motion.article whileHover={{ y: -5 }} className="lp-stat-card rounded-2xl p-5 h-full">
                    <p className="text-3xl sm:text-4xl font-semibold lp-metric-value">{metric.value}</p>
                    <h3 className="mt-3 text-base font-semibold">{metric.label}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{metric.detail}</p>
                  </motion.article>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="lp-section scroll-mt-24">
          <div className="lp-container space-y-8">
            {coreFeatures.map((feature, idx) => (
              <SectionReveal key={feature.title}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                  <div className={idx % 2 ? 'lg:order-2' : ''}>
                    <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">{feature.title}</h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600 dark:text-slate-300">{feature.text}</p>
                    <ul className="mt-6 space-y-3 text-sm sm:text-base">
                      {feature.bullets.map((point) => (
                        <li key={point} className="flex items-start gap-3">
                          <FaCheckCircle className="mt-1 text-indigo-500" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className="mt-7 h-11 px-5 rounded-xl lp-gradient-btn font-semibold inline-flex items-center gap-2"
                    >
                      Explore Platform <FaArrowRight className="text-xs" />
                    </button>
                  </div>
                  <div className={idx % 2 ? 'lg:order-1' : ''}>
                    <div className="lp-card rounded-2xl p-6 min-h-[260px] sm:min-h-[300px] relative overflow-hidden">
                      <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-500/20 blur-3xl" />
                      <div className="absolute -left-8 -bottom-10 h-40 w-40 rounded-full bg-pink-500/20 blur-3xl" />
                      <div className="relative z-10 h-full grid grid-cols-2 gap-4">
                        <div className="lp-glass rounded-xl p-4 flex flex-col justify-between">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Checkpoint</span>
                          <span className="text-xl font-semibold">+184</span>
                        </div>
                        <div className="lp-glass rounded-xl p-4 flex flex-col justify-between">
                          <span className="text-xs uppercase tracking-wide text-slate-500">Integrity</span>
                          <span className="text-xl font-semibold">99.98%</span>
                        </div>
                        <div className="lp-glass rounded-xl p-4 col-span-2">
                          <div className="text-xs uppercase tracking-wide text-slate-500 mb-3">Flow Pulse</div>
                          <div className="h-20 rounded-lg bg-gradient-to-r from-indigo-500/30 via-blue-500/30 to-pink-500/30" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionReveal>
            ))}
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="analytics">
          <div className="lp-container">
            <SectionReveal>
              <div className="lp-card rounded-3xl p-6 sm:p-8">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Analytics built for high-velocity decisions</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-300 max-w-2xl">
                  Visual insight boards combine ledger events, logistics, and AI recommendations into one command center.
                </p>
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="lp-glass rounded-xl p-5">
                    <div className="text-sm text-slate-500">On-time Events</div>
                    <div className="text-3xl font-semibold mt-2">93.4%</div>
                  </div>
                  <div className="lp-glass rounded-xl p-5">
                    <div className="text-sm text-slate-500">Risk Delta</div>
                    <div className="text-3xl font-semibold mt-2">-28%</div>
                  </div>
                  <div className="lp-glass rounded-xl p-5">
                    <div className="text-sm text-slate-500">Cert Validation</div>
                    <div className="text-3xl font-semibold mt-2">1.2s</div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="platform">
          <div className="lp-container">
            <SectionReveal>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="lp-kicker">Platform Depth</p>
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Built around the real traceability workflow</h2>
                </div>
                <p className="max-w-xl text-sm sm:text-base text-slate-600 dark:text-slate-300">
                  TraceChain connects product onboarding, proof validation, blockchain transparency, and consumer trust into one operating layer.
                </p>
              </div>
            </SectionReveal>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
              {platformModules.map((module, index) => (
                <SectionReveal key={module.title} delay={index * 0.05}>
                  <motion.article
                    whileHover={{ y: -5, boxShadow: '0 18px 48px rgba(168,85,247,0.18)' }}
                    className="lp-card rounded-2xl p-5 h-full"
                  >
                    <div className="flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl lp-gradient-btn flex items-center justify-center flex-shrink-0">
                        <module.icon />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{module.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{module.desc}</p>
                      </div>
                    </div>
                  </motion.article>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="lp-section scroll-mt-24">
          <div className="lp-container">
            <SectionReveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">How It Works</h2>
              <p className="mt-4 text-center text-slate-600 dark:text-slate-300">Four simple steps from onboarding to verified transparency.</p>
            </SectionReveal>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {howItWorks.map((step, index) => (
                <SectionReveal key={step.title} delay={index * 0.08}>
                  <motion.div whileHover={{ y: -6 }} className="lp-card relative rounded-2xl p-5 h-full">
                    {index < howItWorks.length - 1 && <span className="lp-step-connector" />}
                    <div className="h-11 w-11 rounded-xl lp-gradient-btn flex items-center justify-center mb-4">
                      <step.icon />
                    </div>
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Step {index + 1}</div>
                    <h3 className="text-lg font-semibold mt-2">{step.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">{step.desc}</p>
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="ai-highlight">
          <div className="lp-container">
            <SectionReveal>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="lp-card rounded-3xl p-6 sm:p-8">
                  <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">AI copilots for instant explanations</h2>
                  <p className="mt-4 text-slate-600 dark:text-slate-300">
                    Ask natural-language questions and get source-linked product stories, certification checks, and anomaly summaries.
                  </p>
                  <div className="mt-7 space-y-3 text-sm">
                    <div className="lp-glass rounded-lg p-3">Why was this shipment flagged in transit?</div>
                    <div className="lp-glass rounded-lg p-3">Show complete temperature compliance timeline.</div>
                    <div className="lp-glass rounded-lg p-3">Summarize chain of custody for lot #BT-93.</div>
                  </div>
                </div>
                <div className="lp-card rounded-3xl p-6 sm:p-8">
                  <div className="rounded-2xl bg-slate-100 dark:bg-slate-900 p-4 h-full border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2 mb-4 text-sm font-semibold">
                      <FaRobot className="text-indigo-500" /> AI Trace Assistant
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="ml-auto max-w-[85%] rounded-xl bg-indigo-500 text-white p-3">Explain verification status for Product A-441.</div>
                      <div className="max-w-[92%] rounded-xl lp-glass p-3">
                        Product A-441 is verified. 4 blockchain events, zero tampering indicators, and valid certificate chain.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="lp-section scroll-mt-24" id="feature-grid">
          <div className="lp-container">
            <SectionReveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Capabilities that scale with your operations</h2>
            </SectionReveal>
            <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {featureGrid.map((feature, index) => (
                <SectionReveal key={feature.title} delay={index * 0.05}>
                  <motion.div
                    whileHover={{ y: -6, boxShadow: '0 20px 45px rgba(79,70,229,0.18)' }}
                    className="lp-card rounded-2xl p-5 h-full border border-transparent hover:border-indigo-400/40"
                  >
                    <div className="h-10 w-10 rounded-lg lp-gradient-btn flex items-center justify-center mb-4">
                      <feature.icon />
                    </div>
                    <h3 className="text-lg font-semibold">{feature.title}</h3>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{feature.desc}</p>
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="integrations">
          <div className="lp-container">
            <SectionReveal>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Integrations</h2>
              <p className="mt-3 text-slate-600 dark:text-slate-300">Plug TraceChain into your existing stack with minimal setup friction.</p>
            </SectionReveal>
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {integrations.map((name, index) => (
                <SectionReveal key={name} delay={index * 0.04}>
                  <motion.div whileHover={{ y: -3 }} className="lp-glass rounded-xl py-4 text-center text-sm font-medium">
                    {name}
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="security">
          <div className="lp-container">
            <SectionReveal>
              <div className="lp-card rounded-3xl p-6 sm:p-8">
                <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Security and trust by design</h2>
                <p className="mt-3 text-slate-600 dark:text-slate-300">
                  From cryptographic trace records to role-governed access, each workflow is designed for enterprise trust.
                </p>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {securityBadges.map((badge) => (
                    <div key={badge} className="lp-glass rounded-xl py-3 text-center text-sm font-semibold">
                      {badge}
                    </div>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="trust-architecture">
          <div className="lp-container">
            <SectionReveal>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
                <div className="lp-card rounded-3xl p-6 sm:p-8">
                  <p className="lp-kicker">Trust Architecture</p>
                  <h2 className="mt-2 text-3xl md:text-4xl font-semibold tracking-tight">Built to keep verification resilient at scale</h2>
                  <p className="mt-4 text-slate-600 dark:text-slate-300">
                    A layered trust model blends cryptographic evidence, governance controls, and AI-assisted anomaly detection.
                  </p>
                  <div className="mt-6 h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      whileInView={{ width: '86%' }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.2, ease: 'easeOut' }}
                      className="h-full"
                      style={{ background: 'var(--lp-gradient-primary)' }}
                    />
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-[0.18em] text-slate-500">Trust coverage index: 86 / 100</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trustPillars.map((pillar, index) => (
                    <SectionReveal key={pillar.title} delay={index * 0.05}>
                      <article className="lp-glass rounded-2xl p-5 h-full">
                        <div className="h-10 w-10 rounded-lg lp-gradient-btn flex items-center justify-center mb-3">
                          <pillar.icon />
                        </div>
                        <h3 className="text-base font-semibold">{pillar.title}</h3>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{pillar.text}</p>
                      </article>
                    </SectionReveal>
                  ))}
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="pricing">
          <div className="lp-container">
            <SectionReveal>
              <p className="lp-kicker text-center">Pricing</p>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-center">Flexible plans for every traceability stage</h2>
              <p className="mt-3 text-center text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                Start with a pilot, scale as your chain grows, and move to enterprise governance when you are ready.
              </p>
            </SectionReveal>
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4">
              {pricingPlans.map((plan, index) => (
                <SectionReveal key={plan.name} delay={index * 0.06}>
                  <motion.div
                    whileHover={{ y: -5 }}
                    className={`rounded-2xl p-6 h-full border ${plan.featured ? 'lp-pricing-featured' : 'lp-card'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      {plan.featured ? <span className="lp-chip text-xs font-semibold px-2 py-1">Most Popular</span> : null}
                    </div>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{plan.tagline}</p>
                    <div className="mt-5">
                      <span className="text-3xl font-semibold">{plan.price}</span>
                      <span className="text-sm text-slate-500">{plan.cycle}</span>
                    </div>
                    <ul className="mt-5 space-y-2 text-sm">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2">
                          <FaCheckCircle className="mt-0.5 text-emerald-500" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={handleGetStarted}
                      className={`mt-6 h-11 w-full rounded-xl font-semibold inline-flex items-center justify-center gap-2 ${
                        plan.featured
                          ? 'lp-gradient-btn'
                          : 'border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-100'
                      }`}
                    >
                      {plan.cta} <FaArrowRight className="text-xs" />
                    </button>
                  </motion.div>
                </SectionReveal>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section pt-0 scroll-mt-24" id="testimonial">
          <div className="lp-container">
            <SectionReveal>
              <div className="lp-card rounded-3xl p-8 sm:p-10 text-center">
                <p className="text-lg sm:text-2xl leading-relaxed max-w-4xl mx-auto">
                  TraceChain helped us cut manual audits by 42% while improving consumer trust with instant, verifiable product stories.
                </p>
                <div className="mt-7 flex items-center justify-center gap-3">
                  <div className="h-11 w-11 rounded-full lp-gradient-btn flex items-center justify-center font-semibold">R</div>
                  <div className="text-left">
                    <div className="font-semibold">Riya Sharma</div>
                    <div className="text-sm text-slate-500">Supply Lead, FreshCart Global</div>
                  </div>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>

        <section id="final-cta" className="lp-section pt-0 scroll-mt-24">
          <div className="lp-container">
            <SectionReveal>
              <div className="rounded-3xl p-8 sm:p-12 text-white" style={{ background: 'var(--lp-gradient-primary)' }}>
                <h2 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-3xl">Launch transparent supply operations your customers can trust.</h2>
                <p className="mt-4 text-white/85 text-base sm:text-lg max-w-2xl">
                  Deploy quickly, connect your stack, and give every stakeholder real-time confidence in product authenticity.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <button onClick={handleGetStarted} className="h-12 px-6 rounded-xl bg-white text-slate-900 font-semibold inline-flex items-center justify-center gap-2">
                    Start Free Trial <FaArrowRight className="text-xs" />
                  </button>
                  <button onClick={() => navigate('/scan')} className="h-12 px-6 rounded-xl border border-white/70 text-white font-semibold inline-flex items-center justify-center gap-2">
                    Try QR Verification <FaLink className="text-xs" />
                  </button>
                </div>
              </div>
            </SectionReveal>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/60 dark:border-slate-700/60 py-10">
        <div className="lp-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 text-sm">
          <div>
            <BrandLogo size="sm" />
            <p className="mt-3 text-slate-600 dark:text-slate-300">Enterprise-grade product traceability for modern supply ecosystems.</p>
          </div>
          <div>
            <div className="font-semibold mb-3">Product</div>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <a href="#features">Features</a>
              <a href="#analytics">Analytics</a>
              <a href="#integrations">Integrations</a>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3">Resources</div>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <a href="#how-it-works">How it works</a>
              <a href="#security">Security</a>
              <button className="text-left" onClick={() => navigate('/auth/login')}>Sign In</button>
            </div>
          </div>
          <div>
            <div className="font-semibold mb-3">Company</div>
            <div className="space-y-2 text-slate-600 dark:text-slate-300">
              <div className="break-all">contact@tracechain.io</div>
              <div>+1 (555) 102-5542</div>
              <div>San Francisco, CA</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
