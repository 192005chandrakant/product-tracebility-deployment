const User = require('../User');
const Product = require('../Product');
const bcrypt = require('bcryptjs');

// Get user profile
exports.getProfile = async (req, res) => {
  try {
    console.log('👤 Profile request for user:', req.user.email);
    
    const user = await User.findById(req.user.id).select('-password').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics based on role
    let stats = {};
    if (user.role === 'producer') {
      const [productCount, recentProducts, totalUpdatesAgg] = await Promise.all([
        Product.countDocuments({ createdByWallet: user.email }),
        Product.find({ createdByWallet: user.email })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('productId name origin manufacturer createdAt stages')
          .lean(),
        Product.aggregate([
          { $match: { createdByWallet: user.email } },
          { $unwind: { path: '$stages', preserveNullAndEmptyArrays: false } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ])
      ]);

      const totalUpdates = totalUpdatesAgg[0]?.count || 0;
      const scannedProductsAgg = await Product.aggregate([
        { $match: { createdByWallet: user.email } },
        {
          $project: {
            stageEventCount: { $size: { $ifNull: ['$stageEvents', []] } }
          }
        },
        { $group: { _id: null, count: { $sum: '$stageEventCount' } } }
      ]);
      const scannedProducts = scannedProductsAgg[0]?.count || 0;
      
      stats = {
        totalProducts: productCount,
        totalUpdates: totalUpdates,
        scannedProducts,
        recentProducts
      };
    } else if (user.role === 'consumer') {
      // For consumers, we could track products they've scanned/viewed
      const totalProducts = await Product.countDocuments();
      stats = {
        totalProducts: totalProducts,
        scannedProducts: 0,
        totalUpdates: 0,
        recentActivity: []
      };
    } else if (user.role === 'admin') {
      const [totalUsers, totalProducts, recentProducts, totalUpdatesAgg] = await Promise.all([
        User.countDocuments(),
        Product.countDocuments(),
        Product.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('productId name origin manufacturer createdAt createdByWallet stages')
          .lean(),
        Product.aggregate([
          { $unwind: { path: '$stages', preserveNullAndEmptyArrays: false } },
          { $group: { _id: null, count: { $sum: 1 } } }
        ])
      ]);

      const totalUpdates = totalUpdatesAgg[0]?.count || 0;
      const scannedProductsAgg = await Product.aggregate([
        {
          $project: {
            stageEventCount: { $size: { $ifNull: ['$stageEvents', []] } }
          }
        },
        { $group: { _id: null, count: { $sum: '$stageEventCount' } } }
      ]);
      const scannedProducts = scannedProductsAgg[0]?.count || 0;
      
      stats = {
        totalUsers,
        totalProducts,
        totalUpdates: totalUpdates,
        scannedProducts,
        recentProducts
      };
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      },
      stats
    });
  } catch (err) {
    console.error('❌ Profile error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    console.log('✏️ Profile update request for user:', req.user.email);
    
    const { 
      email, 
      currentPassword, 
      newPassword,
      firstName,
      lastName,
      company,
      phone,
      address
    } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
      user.email = email;
    }

    // Update password if provided
    if (currentPassword && newPassword) {
      const match = await bcrypt.compare(currentPassword, user.password);
      if (!match) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }
      
      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Update profile fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (company !== undefined) user.company = company;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) {
      user.address = {
        ...user.address,
        ...address
      };
    }

    await user.save();
    
    console.log('✅ Profile updated successfully for:', user.email);
    res.json({ 
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        company: user.company,
        phone: user.phone,
        address: user.address,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (err) {
    console.error('❌ Profile update error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

// Get user activity/statistics
exports.getUserStats = async (req, res) => {
  try {
    console.log('📊 Stats request for user:', req.user.email);
    
    const user = await User.findById(req.user.id).select('email role').lean();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    let stats = {};
    
    if (user.role === 'producer') {
      const products = await Product.find({ createdByWallet: user.email })
        .select('productId name origin createdAt')
        .lean();
      const totalProducts = products.length;
      const productsByOrigin = {};
      
      products.forEach(product => {
        const origin = product.origin || 'Unknown';
        productsByOrigin[origin] = (productsByOrigin[origin] || 0) + 1;
      });

      const monthlyStats = {};
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth();
      
      for (let i = 0; i < 12; i++) {
        const month = (currentMonth - i + 12) % 12;
        const year = currentYear - Math.floor((i - currentMonth) / 12);
        const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
        
        const monthProducts = products.filter(product => {
          const productDate = new Date(product.createdAt);
          return productDate.getFullYear() === year && productDate.getMonth() === month;
        });
        
        monthlyStats[monthKey] = monthProducts.length;
      }

      stats = {
        totalProducts,
        productsByOrigin,
        monthlyStats,
        recentProducts: products.slice(-5).map(p => ({
          productId: p.productId,
          name: p.name,
          origin: p.origin,
          createdAt: p.createdAt
        }))
      };
    } else if (user.role === 'admin') {
      const totalUsers = await User.countDocuments();
      const totalProducts = await Product.countDocuments();
      const usersByRole = await User.aggregate([
        { $group: { _id: '$role', count: { $sum: 1 } } }
      ]);
      
      const recentProducts = await Product.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('productId name origin manufacturer createdAt createdByWallet')
        .lean();

      stats = {
        totalUsers,
        totalProducts,
        usersByRole: usersByRole.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentProducts
      };
    }

    res.json({ stats });
  } catch (err) {
    console.error('❌ Stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
}; 