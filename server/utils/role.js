exports.isAdmin = (user) => user && user.role === 'admin';
exports.isProducer = (user) => user && user.role === 'producer';
exports.isCustomer = (user) => user && user.role === 'customer'; 