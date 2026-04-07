const bcrypt = require('bcryptjs');
const User = require('../models/User');

const MIN_SECRET_LENGTH = 32;

function isBootstrapEnabled() {
  return String(process.env.ADMIN_BOOTSTRAP_ENABLED || '').toLowerCase() === 'true';
}

function getBootstrapConfig() {
  return {
    email: String(process.env.ADMIN_BOOTSTRAP_EMAIL || '').trim().toLowerCase(),
    password: String(process.env.ADMIN_BOOTSTRAP_PASSWORD || ''),
    secret: String(process.env.ADMIN_BOOTSTRAP_SECRET || '').trim(),
    rotatePassword: String(process.env.ADMIN_BOOTSTRAP_ROTATE_PASSWORD || '').toLowerCase() === 'true'
  };
}

function validateConfig(config) {
  const issues = [];

  if (!config.email) issues.push('ADMIN_BOOTSTRAP_EMAIL is missing');
  if (!config.password) issues.push('ADMIN_BOOTSTRAP_PASSWORD is missing');
  if (!config.secret) issues.push('ADMIN_BOOTSTRAP_SECRET is missing');
  if (config.secret && config.secret.length < MIN_SECRET_LENGTH) {
    issues.push(`ADMIN_BOOTSTRAP_SECRET must be at least ${MIN_SECRET_LENGTH} characters`);
  }

  return issues;
}

async function bootstrapAdminAccount() {
  if (!isBootstrapEnabled()) {
    console.log('ℹ️ Admin bootstrap disabled; skipping seeded admin creation');
    return null;
  }

  const config = getBootstrapConfig();
  const issues = validateConfig(config);

  if (issues.length > 0) {
    throw new Error(`Admin bootstrap misconfigured: ${issues.join('; ')}`);
  }

  const existingUser = await User.findOne({ email: config.email });
  if (existingUser) {
    let changed = false;

    if (existingUser.role !== 'admin') {
      existingUser.role = 'admin';
      changed = true;
    }

    if (config.rotatePassword) {
      existingUser.password = await bcrypt.hash(config.password, 12);
      changed = true;
    }

    if (changed) {
      await existingUser.save();
      console.log(`✅ Admin bootstrap updated existing account: ${config.email}`);
    } else {
      console.log(`ℹ️ Admin bootstrap found existing admin account: ${config.email}`);
    }

    return existingUser;
  }

  const hashedPassword = await bcrypt.hash(config.password, 12);
  const adminUser = new User({
    email: config.email,
    password: hashedPassword,
    role: 'admin',
    isActive: true
  });

  await adminUser.save();
  console.log(`✅ Admin bootstrap created admin account: ${config.email}`);
  return adminUser;
}

module.exports = {
  bootstrapAdminAccount
};
