exports.isAdmin = (user) => user && user.role === 'admin';
exports.isProducer = (user) => user && user.role === 'producer';
exports.isConsumer = (user) => user && user.role === 'consumer'; 

// Helper function to check for specific permissions
exports.hasPermission = (user, permission) => {
  if (!user || !user.permissions) return false;
  return user.permissions.includes(permission);
};

// Helper function to check if user can access a specific product
exports.canAccessProduct = (user, product) => {
  if (!user || !product) return false;
  
  // Admins can access all products
  if (user.role === 'admin') return true;
  
  // Producers can access their own products
  if (user.role === 'producer' && product.createdByWallet === user.email) return true;
  
  // Everyone can access products for viewing
  return true;
};

// Helper function to check if user can update a specific product
exports.canUpdateProduct = (user, product) => {
  if (!user || !product) return false;
  
  // Admins can update all products
  if (user.role === 'admin') return true;
  
  // Producers can update their own products
  if (user.role === 'producer' && product.createdByWallet === user.email) return true;
  
  return false;
};