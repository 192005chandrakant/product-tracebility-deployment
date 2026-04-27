import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { 
  FaEdit, 
  FaBoxOpen, 
  FaSearch, 
  FaEye, 
  FaPlusCircle, 
  FaQrcode, 
  FaFileAlt,
  FaSync,
  FaArrowLeft,
  FaCaretDown,
  FaChartBar,
  FaShieldAlt,
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaTrash,
  FaClipboardCheck,
  FaBell,
  FaSearchPlus,
  FaHistory,
  FaSignOutAlt,
  FaUserShield,
  FaClipboardList,
  FaFlag
} from 'react-icons/fa';
import AnimatedCard from '../components/UI/AnimatedCard';
import GlowingButton from '../components/UI/GlowingButton';
import SkeletonLoader from '../components/UI/SkeletonLoader';
import FloatingCubeWrapper from '../components/3D/FloatingCubeWrapper';
import useRealTimeStats from '../hooks/useRealTimeStats';
import { buildAPIURL } from '../utils/apiConfig';
import AIInsightsPanel from '../components/AIInsightsPanel';
import VerificationTimeline from '../components/VerificationTimeline';
import VerificationResultPanel from '../components/VerificationResultPanel';
import { getAdminDashboard, getAdminOverview, getFlaggedProducts, getAdminActionLogs, getAdminProduct, takeAdminAction } from '../utils/adminApi';

const PLACEHOLDER_IMG = 'https://via.placeholder.com/400x200?text=No+Image';

function isDatabaseProduct(product) {
  return Boolean(product && typeof product === 'object' && product._id);
}

function isValidImage(url) {
  // If it's an object with publicUrl (Cloudinary or other storage)
  if (url && typeof url === 'object' && url.publicUrl) {
    return true;
  }
  
  // If it's a string URL
  return url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('/'));
}

function getFullUrl(url) {
  // If it's an object with publicUrl (Cloudinary or other storage)
  if (url && typeof url === 'object' && url.publicUrl) {
    return url.publicUrl;
  }
  
  // If it's a string URL
  if (url && typeof url === 'string') {
    // Use API config utility for resolving file URLs
    const { resolveFileURL } = require('../utils/apiConfig');
    return resolveFileURL(url);
  }
  
  return PLACEHOLDER_IMG;
}

function getLatestDocumentFile(product) {
  if (!product) {
    return null;
  }

  const stageEvents = Array.isArray(product.stageEvents) ? product.stageEvents : [];
  for (let index = stageEvents.length - 1; index >= 0; index -= 1) {
    const event = stageEvents[index];
    const docs = Array.isArray(event?.documents) ? event.documents : [];
    for (let docIndex = docs.length - 1; docIndex >= 0; docIndex -= 1) {
      const file = docs[docIndex]?.file;
      if (file && (file.publicUrl || file.downloadUrl || file.shareUrl || file.url)) {
        return file;
      }
    }
  }

  return product.certFile || null;
}

function getVerificationMeta(verification) {
  const status = verification?.status || 'flagged';
  const riskScore = Number(verification?.riskScore || 0);

  if (status === 'allowed') {
    return {
      label: 'Verified',
      statusClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      reviewClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      riskClass: 'bg-emerald-500',
      riskScore
    };
  }

  if (status === 'blocked') {
    return {
      label: 'Blocked',
      statusClass: 'bg-rose-100 text-rose-700 border-rose-200',
      reviewClass: 'bg-rose-50 text-rose-700 border-rose-200',
      riskClass: 'bg-rose-500',
      riskScore
    };
  }

  return {
    label: 'Flagged',
    statusClass: 'bg-amber-100 text-amber-700 border-amber-200',
    reviewClass: 'bg-amber-50 text-amber-700 border-amber-200',
    riskClass: 'bg-amber-500',
    riskScore
  };
}

function AdminDashboard() {
  // Real-time statistics
  const { statistics, loading: statsLoading, refreshStats } = useRealTimeStats(8000);
  
  const [myProducts, setMyProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-products'); // 'my-products' or 'all-products'
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminOverview, setAdminOverview] = useState(null);
  const [flaggedProducts, setFlaggedProducts] = useState([]);
  const [moderationLoading, setModerationLoading] = useState(false);
  const [selectedReviewProduct, setSelectedReviewProduct] = useState(null);
  const [selectedReviewLoading, setSelectedReviewLoading] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [moderationFilter, setModerationFilter] = useState('all');
  const [moderationSearch, setModerationSearch] = useState('');
  const [moderationError, setModerationError] = useState('');
  const [lastModerationSync, setLastModerationSync] = useState(null);
  const [adminIdentity, setAdminIdentity] = useState({ email: '', role: '' });
  const [adminActionLogs, setAdminActionLogs] = useState([]);
  const reviewSelectionCounterRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.role === 'admin');
        setAdminIdentity({
          email: decoded.email || '',
          role: decoded.role || ''
        });
        if (decoded.role === 'admin') {
          setActiveTab('all-products');
        }
      } catch (error) {
        setIsAdmin(false);
        setAdminIdentity({ email: '', role: '' });
      }
    }

    fetchMyProducts();
    fetchAllProducts();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadAdminData();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadAdminData({ silent: true });
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [isAdmin]);

  useEffect(() => {
    filterAndSortProducts();
  }, [myProducts, allProducts, searchQuery, selectedStage, sortBy, activeTab]);

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching my products with token:', token ? 'Present' : 'Missing');
      
      const res = await fetch(buildAPIURL('/api/my-products'), {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('🔍 My products response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        const normalizedProducts = Array.isArray(data)
          ? data
          : Array.isArray(data?.data)
            ? data.data
            : [];
        const dbProducts = normalizedProducts.filter(isDatabaseProduct);
        console.log('🔍 My products data received:', dbProducts);
        console.log('🔍 My products count:', dbProducts.length);
        setMyProducts(dbProducts);
      } else {
        const errorText = await res.text();
        console.error('❌ Failed to fetch my products:', res.status, errorText);
      }
    } catch (error) {
      console.error('❌ Error fetching my products:', error);
    }
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch(buildAPIURL('/api/products'));
      const data = await res.json();
      const normalizedProducts = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : [];
      const dbProducts = normalizedProducts.filter(isDatabaseProduct);
      setAllProducts(dbProducts);
    } catch (error) {
      console.error('Error fetching all products:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAdminData = async ({ silent = false } = {}) => {
    try {
      if (!silent) {
        setModerationLoading(true);
      }
      setModerationError('');
      const [overviewResult, flaggedResult, actionLogsResult] = await Promise.allSettled([
        getAdminDashboard().catch(() => getAdminOverview()),
        getFlaggedProducts(),
        getAdminActionLogs(20)
      ]);

      if (overviewResult.status === 'fulfilled' && overviewResult.value?.success) {
        setAdminOverview(overviewResult.value.data);
      }

      if (flaggedResult.status === 'fulfilled' && flaggedResult.value?.success) {
        setFlaggedProducts(flaggedResult.value.data || []);
      }

      if (actionLogsResult.status === 'fulfilled' && actionLogsResult.value?.success) {
        setAdminActionLogs(actionLogsResult.value.data || []);
      }

      const failedSegments = [
        overviewResult.status === 'rejected' ? 'overview' : null,
        flaggedResult.status === 'rejected' ? 'flagged queue' : null,
        actionLogsResult.status === 'rejected' ? 'action logs' : null
      ].filter(Boolean);

      if (failedSegments.length > 0) {
        setModerationError(`Partial sync issue in ${failedSegments.join(', ')}. Data shown may be stale.`);
      }

      setLastModerationSync(new Date());
    } catch (error) {
      console.error('Admin data load failed:', error);
      setModerationError('Unable to sync moderation data right now. Please retry.');
    } finally {
      if (!silent) {
        setModerationLoading(false);
      }
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('token');
    navigate('/auth/login');
  };

  const handleAdminAction = async (productId, action) => {
    const confirmationByAction = {
      approve: 'Approve this product and mark verification as trusted?',
      reject: 'Reject this product and mark it as failed moderation?',
      remove: 'Remove this product from active visibility?'
    };

    const confirmed = window.confirm(confirmationByAction[action] || 'Proceed with this moderation action?');
    if (!confirmed) {
      return;
    }

    const reason = window.prompt(`Enter reason for ${action} action:`, '') || '';
    if ((action === 'reject' || action === 'remove') && !reason.trim()) {
      window.alert('Reason is required for reject/remove actions.');
      return;
    }

    try {
      setReviewBusy(true);
      const response = await takeAdminAction(productId, action, reason);
      if (response?.success) {
        await loadAdminData();
        await fetchAllProducts();
        await fetchMyProducts();
        setSelectedReviewProduct(null);
      }
    } catch (error) {
      console.error('Admin action failed:', error);
    } finally {
      setReviewBusy(false);
    }
  };

  const handleSelectReviewProduct = async (product) => {
    if (!product || !product.productId) {
      return;
    }

    const selectionToken = reviewSelectionCounterRef.current + 1;
    reviewSelectionCounterRef.current = selectionToken;

    setSelectedReviewProduct(product);
    setSelectedReviewLoading(true);

    try {
      const response = await getAdminProduct(product.productId);
      const detailedProduct = response && response.success && response.data
        ? response.data
        : null;

      if (selectionToken === reviewSelectionCounterRef.current && detailedProduct) {
        setSelectedReviewProduct(detailedProduct);
      }
    } catch (error) {
      console.error('Failed to load admin product detail:', error);
    } finally {
      if (selectionToken === reviewSelectionCounterRef.current) {
        setSelectedReviewLoading(false);
      }
    }
  };

  const filterAndSortProducts = () => {
    const currentProducts = activeTab === 'my-products' ? myProducts : allProducts;
    
    console.log('🔍 Filtering products:', {
      activeTab,
      myProductsCount: myProducts.length,
      allProductsCount: allProducts.length,
      currentProductsCount: currentProducts.length,
      searchQuery,
      selectedStage
    });
    
    let filtered = currentProducts.filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           product.productId?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStage = !selectedStage || 
                          (product.stages && product.stages.includes(selectedStage));
      
      return matchesSearch && matchesStage;
    });

    console.log('🔍 Filtered products count:', filtered.length);

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'id':
          return (a.productId || '').localeCompare(b.productId || '');
        case 'stage':
          const aStage = a.stages && a.stages.length > 0 ? a.stages[a.stages.length - 1] : '';
          const bStage = b.stages && b.stages.length > 0 ? b.stages[b.stages.length - 1] : '';
          return aStage.localeCompare(bStage);
        default:
          return 0;
      }
    });

    setFilteredProducts(filtered);
  };

  const getStageColor = (stage) => {
    const stageColors = {
      'Harvested': 'from-green-500 to-green-600',
      'Processed': 'from-yellow-500 to-yellow-600',
      'Packaged': 'from-blue-500 to-blue-600',
      'Shipped': 'from-purple-500 to-purple-600',
      'Delivered': 'from-cyan-500 to-cyan-600',
      'Sold': 'from-red-500 to-red-600',
    };
    return stageColors[stage] || 'from-gray-500 to-gray-600';
  };

  const getRiskColor = (score) => {
    if (score >= 75) return 'bg-red-100 text-red-700 border-red-200';
    if (score >= 40) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-green-100 text-green-700 border-green-200';
  };

  const moderationStats = useMemo(() => {
    const queue = flaggedProducts || [];
    const totalRisk = queue.reduce((sum, product) => sum + Number(product?.verification?.riskScore || 0), 0);

    return {
      flagged: queue.length,
      blocked: queue.filter((product) => product?.verification?.status === 'blocked').length,
      verified: queue.filter((product) => product?.verification?.status === 'allowed').length,
      pending: queue.filter((product) => (product?.verification?.reviewState || 'pending_review') === 'pending_review').length,
      averageRisk: queue.length ? Math.round(totalRisk / queue.length) : 0
    };
  }, [flaggedProducts]);

  const moderationBreakdown = useMemo(() => {
    const queue = flaggedProducts || [];
    return queue.reduce((accumulator, product) => {
      const status = product?.verification?.status || 'flagged';
      if (status === 'allowed') {
        accumulator.verified += 1;
      } else if (status === 'blocked') {
        accumulator.blocked += 1;
      } else {
        accumulator.flagged += 1;
      }
      return accumulator;
    }, { verified: 0, flagged: 0, blocked: 0 });
  }, [flaggedProducts]);

  const filteredModerationQueue = useMemo(() => {
    const queue = flaggedProducts || [];

    return queue.filter((product) => {
      const status = product?.verification?.status || 'flagged';
      const matchesStatus = moderationFilter === 'all'
        ? true
        : moderationFilter === 'verified'
          ? status === 'allowed'
          : moderationFilter === 'blocked'
            ? status === 'blocked'
            : status === 'flagged';

      const query = moderationSearch.trim().toLowerCase();
      const matchesSearch = !query
        ? true
        : (product?.name || '').toLowerCase().includes(query) || (product?.productId || '').toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [flaggedProducts, moderationFilter, moderationSearch]);

  useEffect(() => {
    if (!filteredModerationQueue.length) {
      if (selectedReviewProduct) {
        setSelectedReviewProduct(null);
      }
      return;
    }

    const stillVisible = selectedReviewProduct
      ? filteredModerationQueue.some((product) => product.productId === selectedReviewProduct.productId)
      : false;

    if (!stillVisible) {
      handleSelectReviewProduct(filteredModerationQueue[0]);
    }
  }, [filteredModerationQueue, selectedReviewProduct]);

  // Get current products based on active tab
  const currentProducts = activeTab === 'my-products' ? myProducts : allProducts;
  
  const uniqueStages = [...new Set(currentProducts.flatMap(p => p.stages || []))];

  if (loading) {
    return (
      <div className="min-h-screen transition-all duration-300 cyber-page">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-[#A855F7] to-[#2DD4BF] rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_28px_rgba(168,85,247,0.35)]">
              <FaChartBar className="text-white text-2xl" />
            </div>
            <h2 className="text-2xl font-bold mb-4 text-white">
              Loading Dashboard
            </h2>
            <p className="text-slate-300">
              Fetching products data...
            </p>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 dark:border-blue-400 mx-auto mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  const adminCards = [
    {
      label: 'Total Products',
      value: adminOverview?.totalProducts ?? allProducts.length,
      icon: FaBoxOpen,
      color: 'from-blue-50 to-blue-100'
    },
    {
      label: 'Flagged Products',
      value: adminOverview?.flaggedProducts ?? flaggedProducts.length,
      icon: FaExclamationTriangle,
      color: 'from-yellow-50 to-yellow-100'
    },
    {
      label: 'Verified Products',
      value: adminOverview?.verifiedProducts ?? allProducts.filter((product) => product.verification?.status === 'allowed').length,
      icon: FaCheckCircle,
      color: 'from-green-50 to-green-100'
    },
    {
      label: 'Blocked Products',
      value: adminOverview?.failedProducts ?? adminOverview?.blockedProducts ?? allProducts.filter((product) => product.verification?.status === 'blocked').length,
      icon: FaTimesCircle,
      color: 'from-red-50 to-red-100'
    }
  ];

  return (
    <div className="min-h-screen transition-all duration-300 cyber-page">
      
      <div className="min-h-screen">
        <div className="w-full px-2 sm:px-4 py-6 sm:py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
              <div className="flex items-start sm:items-center gap-4">
                <GlowingButton
                  onClick={() => navigate('/')}
                  variant="secondary"
                  className="p-3 mt-1 sm:mt-0"
                  glowColor="blue"
                >
                  <FaArrowLeft className="w-4 h-4" />
                </GlowingButton>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 bg-clip-text text-transparent">
                    Admin Dashboard
                  </h1>
                  <p className="text-slate-300 text-sm sm:text-base">
                    Real-time moderation, lifecycle visibility, and product governance in one place.
                  </p>
                  {isAdmin ? (
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold">
                        <FaUserShield /> {adminIdentity.email || 'admin'}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold uppercase">
                        Role: {adminIdentity.role || 'admin'}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold">
                        Live sync: {lastModerationSync ? new Date(lastModerationSync).toLocaleTimeString() : 'Not synced yet'}
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-4 self-start lg:self-auto">
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={handleAdminLogout}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm font-semibold text-slate-200 hover:bg-white/10"
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                ) : null}
                <div className="relative">
                  <FloatingCubeWrapper size={0.8} className="w-20 h-20" />
                </div>
              </div>
            </div>

            {/* Real-time Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <AnimatedCard className="p-6 cyber-glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">My Products</p>
                    <p className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                      {myProducts.length}
                    </p>
                    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                      Products I registered
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaBoxOpen className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-6 cyber-glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Total Scans</p>
                    <p className="text-3xl font-bold text-green-800 dark:text-green-200">
                      {statistics.totalScans}
                    </p>
                    <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                      QR code scans
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaEye className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-6 cyber-glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Updates</p>
                    <p className="text-3xl font-bold text-purple-800 dark:text-purple-200">
                      {statistics.totalUpdates}
                    </p>
                    <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                      Stage updates
                    </p>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaEdit className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
              
              <AnimatedCard className="p-6 cyber-glass">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">All Products</p>
                    <p className="text-3xl font-bold text-orange-800 dark:text-orange-200">
                      {allProducts.length}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-orange-500 dark:text-orange-400">
                        Total in system
                      </p>
                      <button
                        onClick={refreshStats}
                        disabled={statsLoading}
                        className="text-orange-500 hover:text-orange-600 disabled:opacity-50 transition-colors"
                        title="Refresh Statistics"
                      >
                        <FaSync className={`text-xs ${statsLoading ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                  </div>
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FaQrcode className="text-white text-xl" />
                  </div>
                </div>
              </AnimatedCard>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <AIInsightsPanel
              products={currentProducts}
              activeTab={activeTab}
              searchQuery={searchQuery}
              selectedStage={selectedStage}
              sortBy={sortBy}
            />
          </motion.div>

          {isAdmin ? (
            <motion.div
              id="admin-overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="mb-10"
            >
              <AnimatedCard className="p-5 sm:p-8 cyber-glass">
                <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6 mb-6">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold mb-3">
                      <FaShieldAlt /> Admin Moderation Console
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Verification Review Center</h2>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      Monitor flagged products, inspect AI risk signals, and approve, reject, or remove records.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                        Flag threshold: {adminOverview?.flagThreshold ?? 40}
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold">
                        {moderationStats.pending} pending review
                      </span>
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold">
                        {moderationStats.blocked} blocked
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 xl:items-end">
                    <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                      <div className="min-w-[140px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Queue size</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{moderationStats.flagged}</p>
                      </div>
                      <div className="min-w-[140px] rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 px-4 py-3">
                        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Avg risk</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{moderationStats.averageRisk}</p>
                      </div>
                    </div>
                    <GlowingButton onClick={loadAdminData} variant="secondary" glowColor="blue" className="px-5 py-2">
                      <FaSync className={moderationLoading ? 'animate-spin' : ''} /> Refresh Moderation Data
                    </GlowingButton>
                  </div>
                </div>

                <div className="mb-5 grid grid-cols-3 gap-2 sm:max-w-xl">
                  {[
                    { key: 'verified', label: 'Verified', count: moderationBreakdown.verified, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                    { key: 'flagged', label: 'Flagged', count: moderationBreakdown.flagged, cls: 'bg-amber-50 text-amber-700 border-amber-200' },
                    { key: 'blocked', label: 'Blocked', count: moderationBreakdown.blocked, cls: 'bg-rose-50 text-rose-700 border-rose-200' }
                  ].map((item) => (
                    <div key={item.key} className={`rounded-xl border px-3 py-2 text-sm font-semibold ${item.cls}`}>
                      <div className="flex items-center justify-between gap-2">
                        <span>{item.label}</span>
                        <span>{item.count}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                  {adminCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <div key={card.label} className={`rounded-2xl border border-slate-200 dark:border-slate-700 p-4 bg-gradient-to-br ${card.color} dark:from-slate-800 dark:to-slate-900 shadow-sm`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">{card.label}</p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{card.value}</p>
                          </div>
                          <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-slate-800 flex items-center justify-center shadow-sm border border-slate-200 dark:border-slate-700">
                            <Icon className="text-slate-700 dark:text-slate-200" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {moderationError ? (
                  <div className="mb-5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                    {moderationError}
                  </div>
                ) : null}

                <div id="moderation-queue" className="grid grid-cols-1 2xl:grid-cols-[220px_1.05fr_0.95fr] gap-6">
                  <aside className="hidden 2xl:block rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/70 p-4 h-fit sticky top-24">
                    <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 mb-3">Control Center</h3>
                    <div className="space-y-2 text-sm">
                      <a href="#admin-overview" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <FaClipboardList /> Dashboard
                      </a>
                      <a href="#moderation-queue" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <FaFlag /> Flagged Items
                      </a>
                      <a href="#admin-action-logs" className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-900 border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                        <FaHistory /> Reports
                      </a>
                    </div>
                  </aside>

                  <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex flex-col min-h-[32rem]">
                    <div className="flex flex-col gap-4 px-4 sm:px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Moderation Queue</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300">Pick a product to inspect it in the detail pane.</p>
                        </div>
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                          {filteredModerationQueue.length} items
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'all', label: 'All' },
                          { key: 'verified', label: 'Verified' },
                          { key: 'flagged', label: 'Flagged' },
                          { key: 'blocked', label: 'Blocked' }
                        ].map((filter) => {
                          const active = moderationFilter === filter.key;
                          const count = filter.key === 'all'
                            ? flaggedProducts.length
                            : filter.key === 'verified'
                              ? moderationBreakdown.verified
                              : filter.key === 'blocked'
                                ? moderationBreakdown.blocked
                                : moderationBreakdown.flagged;
                          return (
                            <button
                              key={filter.key}
                              type="button"
                              onClick={() => setModerationFilter(filter.key)}
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${active ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                            >
                              {filter.label}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${active ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                        <input
                          type="text"
                          value={moderationSearch}
                          onChange={(event) => setModerationSearch(event.target.value)}
                          placeholder="Search moderation queue by product or ID"
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 pl-9 pr-3 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {moderationLoading ? (
                      <div className="px-4 py-10 text-center text-slate-500 dark:text-slate-300 text-sm">
                        Loading moderation queue...
                      </div>
                    ) : null}

                    <div className="hidden md:block flex-1 min-h-0 overflow-auto">
                      <table className="min-w-full">
                        <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Product</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Manufacturer</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Risk</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {filteredModerationQueue.length > 0 ? filteredModerationQueue.map((product) => {
                            const verificationMeta = getVerificationMeta(product.verification);
                            const isSelected = selectedReviewProduct?.productId === product.productId;

                            return (
                              <tr
                                key={product.productId}
                                onClick={() => handleSelectReviewProduct(product)}
                                className={`cursor-pointer transition-colors ${isSelected ? 'bg-slate-100 dark:bg-slate-800/80' : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'}`}
                              >
                                <td className="px-4 py-4">
                                  <div className="flex items-start gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                      {isValidImage(product.imageFile) ? (
                                        <img
                                          src={getFullUrl(product.imageFile)}
                                          alt={product.name}
                                          className="w-full h-full object-cover"
                                          onError={(event) => {
                                            event.target.onerror = null;
                                            event.target.src = PLACEHOLDER_IMG;
                                          }}
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400">
                                          <FaBoxOpen className="text-lg" />
                                        </div>
                                      )}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-900 dark:text-white">{product.name || 'Unnamed Product'}</div>
                                      <div className="text-xs text-slate-500 break-all">{product.productId}</div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${verificationMeta.statusClass}`}>
                                          {verificationMeta.label}
                                        </span>
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          {product.stages?.length ? product.stages[product.stages.length - 1] : 'No stage'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4 text-sm text-slate-700 dark:text-slate-300">
                                  {product.manufacturer || 'Unknown'}
                                </td>
                                <td className="px-4 py-4">
                                  <div className="min-w-[160px]">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className={`inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold ${getRiskColor(product.verification?.riskScore || 0)}`}>
                                        {product.verification?.riskScore ?? 0}
                                      </span>
                                      <span className="text-xs text-slate-500">/ 100</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${verificationMeta.riskClass}`}
                                        style={{ width: `${Math.min(100, Number(product.verification?.riskScore || 0))}%` }}
                                      />
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-4">
                                  <div className="space-y-2">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${verificationMeta.reviewClass}`}>
                                      {product.verification?.status || 'flagged'} / {product.verification?.reviewState || 'pending_review'}
                                    </span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                      {Array.isArray(product.verification?.issues) && product.verification.issues.length > 0
                                        ? `${product.verification.issues.length} issue${product.verification.issues.length === 1 ? '' : 's'} detected`
                                        : 'No issues detected'}
                                    </p>
                                  </div>
                                </td>
                              </tr>
                            );
                          }) : (
                            <tr>
                              <td colSpan={4} className="px-4 py-10 text-center text-slate-500">
                                No products match the selected moderation filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="md:hidden flex-1 min-h-0 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredModerationQueue.length > 0 ? filteredModerationQueue.map((product) => {
                        const verificationMeta = getVerificationMeta(product.verification);
                        const isSelected = selectedReviewProduct?.productId === product.productId;

                        return (
                          <button
                            key={product.productId}
                            type="button"
                            onClick={() => handleSelectReviewProduct(product)}
                            className={`w-full text-left p-4 transition-colors ${isSelected ? 'bg-slate-100 dark:bg-slate-800/80' : 'bg-white dark:bg-slate-900'}`}
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                {isValidImage(product.imageFile) ? (
                                  <img
                                    src={getFullUrl(product.imageFile)}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(event) => {
                                      event.target.onerror = null;
                                      event.target.src = PLACEHOLDER_IMG;
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                                    <FaBoxOpen className="text-sm" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-slate-900 dark:text-white truncate">{product.name || 'Unnamed Product'}</p>
                                <p className="text-xs text-slate-500 truncate">{product.productId}</p>
                                <p className="text-xs text-slate-500 truncate mt-1">{product.manufacturer || 'Unknown manufacturer'}</p>
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold border ${verificationMeta.statusClass}`}>
                                    {verificationMeta.label}
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[11px] font-semibold ${getRiskColor(product.verification?.riskScore || 0)}`}>
                                    Risk {product.verification?.riskScore ?? 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      }) : (
                        <div className="px-4 py-10 text-center text-slate-500 dark:text-slate-300 text-sm">
                          No products match the selected moderation filter.
                        </div>
                      )}
                    </div>
                  </div>

                  <div id="product-review" className="space-y-4">
                    {selectedReviewProduct ? (
                      <AnimatedCard className="p-5 sm:p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg sticky top-24">
                        <div className="flex items-center justify-between gap-3 mb-4">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Selected product</p>
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedReviewProduct.name}</h3>
                          </div>
                          <button onClick={() => setSelectedReviewProduct(null)} className="px-3 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-sm">
                            Close
                          </button>
                        </div>

                        <div className="space-y-3 text-sm">
                          {selectedReviewLoading ? (
                            <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3 text-blue-700 dark:text-blue-200 text-sm font-semibold">
                              Loading latest product verification details...
                            </div>
                          ) : null}

                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
                            <p className="text-slate-500 text-xs uppercase tracking-wide">Product ID</p>
                            <p className="font-medium text-slate-900 dark:text-white break-all">{selectedReviewProduct.productId}</p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
                              <p className="text-slate-500 text-xs uppercase tracking-wide">Manufacturer</p>
                              <p className="font-medium text-slate-900 dark:text-white">{selectedReviewProduct.manufacturer || 'Not provided'}</p>
                            </div>
                            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
                              <p className="text-slate-500 text-xs uppercase tracking-wide">Origin</p>
                              <p className="font-medium text-slate-900 dark:text-white">{selectedReviewProduct.origin || 'Not provided'}</p>
                            </div>
                          </div>

                          <VerificationResultPanel
                            verification={selectedReviewProduct.verification}
                            title="Moderation Verification Summary"
                          />

                          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 p-3">
                            <h4 className="font-semibold mb-2 text-slate-900 dark:text-white">Verification Timeline</h4>
                            <VerificationTimeline
                              product={selectedReviewProduct}
                              verification={selectedReviewProduct.verification}
                              title="Moderation Timeline"
                            />
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button disabled={reviewBusy} onClick={() => handleAdminAction(selectedReviewProduct.productId, 'approve')} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold disabled:opacity-60 hover:bg-emerald-700">
                              <FaClipboardCheck className="inline mr-2" />Approve
                            </button>
                            <button disabled={reviewBusy} onClick={() => handleAdminAction(selectedReviewProduct.productId, 'reject')} className="px-4 py-2 rounded-lg bg-amber-500 text-white font-semibold disabled:opacity-60 hover:bg-amber-600">
                              <FaBell className="inline mr-2" />Reject
                            </button>
                            <button disabled={reviewBusy} onClick={() => handleAdminAction(selectedReviewProduct.productId, 'remove')} className="px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold disabled:opacity-60 hover:bg-rose-700">
                              <FaTrash className="inline mr-2" />Remove
                            </button>
                          </div>
                        </div>
                      </AnimatedCard>
                    ) : (
                      <AnimatedCard className="p-5 sm:p-6 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg min-h-[18rem] flex items-center justify-center text-center">
                        <div>
                          <FaSearchPlus className="mx-auto text-3xl text-slate-400 mb-3" />
                          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Inspect a product</h3>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            Choose an item from the moderation queue to view its review details, risk score, and action options.
                          </p>
                        </div>
                      </AnimatedCard>
                    )}
                  </div>
                </div>

                <div id="admin-action-logs" className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/80 p-4">
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <FaHistory /> Recent Admin Actions
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{adminActionLogs.length} entries</span>
                  </div>

                  {adminActionLogs.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                            <th className="py-2 pr-4">Time</th>
                            <th className="py-2 pr-4">Admin</th>
                            <th className="py-2 pr-4">Action</th>
                            <th className="py-2 pr-4">Product</th>
                            <th className="py-2">Reason</th>
                          </tr>
                        </thead>
                        <tbody>
                          {adminActionLogs.map((log) => (
                            <tr key={log._id} className="border-t border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                              <td className="py-2 pr-4 whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</td>
                              <td className="py-2 pr-4 whitespace-nowrap">{log.adminEmail}</td>
                              <td className="py-2 pr-4">
                                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                  {log.action}
                                </span>
                              </td>
                              <td className="py-2 pr-4 font-mono text-xs">{log.productId}</td>
                              <td className="py-2">{log.reason || 'No reason provided'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No admin actions recorded yet.</p>
                  )}
                </div>
              </AnimatedCard>
            </motion.div>
          ) : null}

          {/* Tab System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <div className="flex flex-col sm:flex-row sm:space-x-1 gap-1 sm:gap-0 bg-white/5 border border-white/10 backdrop-blur-xl rounded-lg p-1">
              <button
                onClick={() => setActiveTab('my-products')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 text-left sm:text-center ${
                  activeTab === 'my-products'
                    ? 'bg-purple-500/25 text-white shadow-[0_0_18px_rgba(168,85,247,0.18)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                My Products ({myProducts.length})
              </button>
              <button
                onClick={() => setActiveTab('all-products')}
                className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 text-left sm:text-center ${
                  activeTab === 'all-products'
                    ? 'bg-purple-500/25 text-white shadow-[0_0_18px_rgba(168,85,247,0.18)]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                All Products ({allProducts.length})
              </button>
            </div>
          </motion.div>

          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <AnimatedCard className="p-4 sm:p-6">
              <div className="flex flex-col gap-4">
                {/* Search and Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Search */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSearch className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm text-slate-100 placeholder-slate-400"
                    />
                  </div>
                  
                  {/* Stage Filter */}
                  <div className="relative">
                    <select
                      value={selectedStage}
                      onChange={(e) => setSelectedStage(e.target.value)}
                      className="w-full pl-3 pr-8 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm appearance-none text-slate-100"
                    >
                      <option value="">All Stages</option>
                      {uniqueStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaCaretDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                  
                  {/* Sort */}
                  <div className="relative">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full pl-3 pr-8 py-3 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent backdrop-blur-sm appearance-none text-slate-100"
                    >
                      <option value="name">Sort by Name</option>
                      <option value="id">Sort by ID</option>
                      <option value="stage">Sort by Stage</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <FaCaretDown className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                {/* Add Product Button - Always Visible */}
                <div className="flex justify-end">
                  <GlowingButton
                    onClick={() => navigate('/admin/add')}
                    className="w-full sm:w-auto px-6 py-3 font-semibold text-base sm:text-lg"
                    glowColor="green"
                  >
                    <FaPlusCircle className="mr-2" />
                    Add Product
                  </GlowingButton>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Products Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            {loading ? (
              // Skeleton loader for products
              <SkeletonLoader type="grid" count={6} />
            ) : filteredProducts.length === 0 ? (
              <AnimatedCard className="p-8 sm:p-12 text-center">
                <FaBoxOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || selectedStage ? 'Try adjusting your search or filters' : 
                   activeTab === 'my-products' ? 
                   `You have ${myProducts.length} products but they don't match the current filters` : 
                   'Start by adding your first product'}
                </p>
                <GlowingButton
                  onClick={() => navigate('/admin/add')}
                  className="w-full sm:w-auto px-6 py-3 font-semibold text-base sm:text-lg"
                  glowColor="blue"
                >
                  <FaPlusCircle className="mr-2" />
                  Add Product
                </GlowingButton>
              </AnimatedCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product.productId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="group"
                  >
                    <AnimatedCard className="overflow-hidden h-full flex flex-col">
                      <div className="relative">
                        {/* Product Image */}
                      <div className="h-48 bg-gradient-to-br from-[#252131] to-[#13111C] flex items-center justify-center overflow-hidden">
                          {isValidImage(product.imageFile) ? (
                            <img
                              src={getFullUrl(product.imageFile)}
                              alt={product.name}
                              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = PLACEHOLDER_IMG;
                              }}
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center text-gray-400">
                              <FaBoxOpen className="text-4xl mb-2" />
                              <span className="text-sm">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Stage Badge */}
                        <div className="absolute top-2 right-2">
                          {product.stages && product.stages.length > 0 ? (
                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r ${getStageColor(product.stages[product.stages.length - 1])}`}>
                              {product.stages[product.stages.length - 1]}
                            </span>
                          ) : (
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold text-gray-500 bg-gray-200 dark:bg-gray-700">
                              No Status
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="p-4 sm:p-6 flex flex-col flex-grow">
                        <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate">
                          {product.name}
                        </h3>
                        
                        <div className="space-y-2 mb-4 flex-grow">
                          <div className="flex items-center text-sm text-slate-300">
                            <FaQrcode className="w-4 h-4 mr-2 flex-shrink-0" />
                            <span className="font-mono truncate">{product.productId}</span>
                          </div>
                          
                          {product.description && (
                            <p className="text-sm text-slate-300 line-clamp-2">
                              {product.description}
                            </p>
                          )}
                        </div>
                        
                        {/* Certificate Link */}
                        {getLatestDocumentFile(product) && (
                          <div className="mb-4">
                            <a
                              href={getFullUrl(getLatestDocumentFile(product))}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <FaFileAlt className="w-4 h-4 mr-1" />
                              View Certificate
                            </a>
                          </div>
                        )}
                        
                        {/* Action Button - Always Visible */}
                        <div className="sticky bottom-0 left-0 right-0 pt-4 mt-auto">
                          <GlowingButton
                            onClick={() => navigate(`/product/${product.productId}`)}
                            className="w-full py-3 font-semibold text-base sm:text-lg"
                            glowColor="blue"
                          >
                            <FaEye className="mr-2" />
                            View Details
                          </GlowingButton>
                        </div>
                      </div>
                    </AnimatedCard>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
