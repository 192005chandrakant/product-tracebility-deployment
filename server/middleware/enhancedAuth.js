const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

// Role-based permissions map
const PERMISSIONS = {
  admin: [
    'view_all_products',
    'add_product',
    'update_product',
    'delete_product',
    'view_user_list',
    'update_user',
    'delete_user',
    'change_roles',
    'update_product_status',
    'view_statistics',
    'manage_storage'
  ],
  producer: [
    'view_own_products',
    'add_product',
    'update_own_product',
    'update_product_status',
    'view_own_statistics'
  ],
  consumer: [
    'view_products',
    'scan_products',
    'view_public_info'
  ]
};

// Standard authentication middleware
exports.auth = async (req, res, next) => {
  const token = req.headers.authorization && req.headers.authorization.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ 
      error: 'Authentication required', 
      message: 'You must be logged in to access this resource'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data (in case roles/permissions have changed)
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Invalid account', 
        message: 'Your account is inactive or has been deleted'
      });
    }
    
    // Add user permissions based on role
    const permissions = PERMISSIONS[user.role] || [];
    
    // Attach user and permissions to request
    req.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      permissions,
      firstName: user.firstName,
      lastName: user.lastName
    };
    
    // Log authentication
    console.log(`🔐 User authenticated: ${user.email} (${user.role})`);
    
    next();
  } catch (err) {
    console.error('Authentication error:', err.message);
    return res.status(401).json({ 
      error: 'Invalid token', 
      message: 'Your session has expired. Please log in again.'
    });
  }
};

// Role-based access control middleware
exports.requireRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ 
      error: 'Authentication required', 
      message: 'You must be logged in to access this resource'
    });
  }
  
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  if (!allowedRoles.includes(req.user.role)) {
    console.log(`🚫 Access denied: ${req.user.email} (${req.user.role}) attempted to access resource requiring ${allowedRoles.join(', ')}`);
    return res.status(403).json({ 
      error: 'Access denied', 
      message: `This action requires ${allowedRoles.join(' or ')} role`
    });
  }
  
  next();
};

// Permission-based access control middleware
exports.requirePermission = (requiredPermissions) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ 
      error: 'Authentication required', 
      message: 'You must be logged in to access this resource'
    });
  }
  
  const permissionsToCheck = Array.isArray(requiredPermissions) 
    ? requiredPermissions 
    : [requiredPermissions];
  
  const hasAllPermissions = permissionsToCheck.every(permission => 
    req.user.permissions.includes(permission)
  );
  
  if (!hasAllPermissions) {
    console.log(`🚫 Permission denied: ${req.user.email} attempted to perform action requiring ${permissionsToCheck.join(', ')}`);
    return res.status(403).json({ 
      error: 'Permission denied', 
      message: 'You do not have permission to perform this action'
    });
  }
  
  next();
};

// Secondary authentication for sensitive operations
exports.requireSecondaryAuth = async (req, res, next) => {
  // Handle both JSON and FormData requests
  let password;
  
  // For multipart/form-data (file uploads), password might be in req.body or req.fields
  if (req.body && typeof req.body === 'object') {
    password = req.body.password;
  }
  
  // If using multer, check if password is in the parsed body
  if (!password && req.fields) {
    password = req.fields.password;
  }
  
  // Debug logging
  console.log('🔍 Secondary auth check - password provided:', !!password);
  console.log('🔍 Request body type:', typeof req.body);
  console.log('🔍 Request body keys:', req.body ? Object.keys(req.body) : 'no body');
  console.log('🔍 Request fields keys:', req.fields ? Object.keys(req.fields) : 'no fields');
  
  if (!password) {
    console.log('❌ No password provided for secondary authentication');
    return res.status(400).json({ 
      error: 'Secondary authentication required', 
      message: 'Please provide your password to confirm this sensitive operation'
    });
  }
  
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found', 
        message: 'User account not found'
      });
    }
    
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      console.log('❌ Invalid password for secondary authentication');
      return res.status(401).json({ 
        error: 'Invalid password', 
        message: 'The password you entered is incorrect'
      });
    }
    
    // Password confirmed, proceed
    console.log(`🔒 Secondary authentication successful for ${user.email}`);
    next();
  } catch (err) {
    console.error('Secondary authentication error:', err.message);
    return res.status(500).json({ 
      error: 'Authentication error', 
      message: 'An error occurred during authentication'
    });
  }
};

// Get permissions for a role
exports.getPermissions = (role) => {
  return PERMISSIONS[role] || [];
};

// Export permissions map for use elsewhere
exports.PERMISSIONS = PERMISSIONS;
