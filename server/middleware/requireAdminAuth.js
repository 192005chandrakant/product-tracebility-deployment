const crypto = require('crypto');
const { auth } = require('./enhancedAuth');

function isAdminBypassEnabled() {
  return String(process.env.ADMIN_AUTH_BYPASS || '').toLowerCase() === 'true' || process.env.NODE_ENV === 'test';
}

function shouldAllowBypassInEnvironment() {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const bypassEnabled = String(process.env.ADMIN_AUTH_BYPASS || '').toLowerCase() === 'true';
  if (!bypassEnabled) {
    return false;
  }

  if (process.env.NODE_ENV === 'production') {
    return String(process.env.ADMIN_AUTH_BYPASS_ALLOW_PRODUCTION || '').toLowerCase() === 'true';
  }

  return true;
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));

  if (left.length === 0 || right.length === 0 || left.length !== right.length) {
    return false;
  }

  return crypto.timingSafeEqual(left, right);
}

function hasValidBypassSecret(req) {
  if (process.env.NODE_ENV === 'test') {
    return true;
  }

  const configuredSecret = String(process.env.ADMIN_AUTH_BYPASS_SECRET || '').trim();
  if (!configuredSecret) {
    // Keep local developer bypass usable when explicitly enabled.
    // In production we still require an explicit shared secret.
    return process.env.NODE_ENV !== 'production';
  }

  const providedSecret = String(req.headers['x-admin-bypass-secret'] || '').trim();
  return safeEqual(providedSecret, configuredSecret);
}

function requireAdminAuth(req, res, next) {
  const bypassRequested = String(req.headers['x-admin-bypass'] || '').toLowerCase() === 'true';

  if (bypassRequested && isAdminBypassEnabled() && shouldAllowBypassInEnvironment() && hasValidBypassSecret(req)) {
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
