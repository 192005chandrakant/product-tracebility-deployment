const crypto = require('crypto');
 
exports.hashString = (str) => {
  return crypto.createHash('sha256').update(str).digest('hex');
}; 