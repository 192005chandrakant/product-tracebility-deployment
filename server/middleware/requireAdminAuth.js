const { auth } = require('./enhancedAuth');

function isAdminBypassEnabled() {
  return String(process.env.ADMIN_AUTH_BYPASS || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'test';
}

function requireAdminAuth(req, res, next) {
  if (isAdminBypassEnabled() && String(req.headers['x-admin-bypass'] || '').toLowerCase() === 'true') {
    const email = String(req.headers['x-admin-email'] || 'admin@local.test').trim().toLowerCase();
    req.user = {
      id: req.headers['x-admin-user-id'] || 'admin-test-user',
      email,
      role: 'admin',
      permissions: ['view_all_products', 'update_product_status', 'view_statistics', 'manage_storage']
    };

    return next();
  }

  return auth(req, res, (error) => {
    if (error) {
      return next(error);
    }

    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        message: 'You do not have permission to access this resource.'
      });
    }

    return next();
  });
}

module.exports = requireAdminAuth;
