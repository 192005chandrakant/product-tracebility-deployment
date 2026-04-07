const mongoose = require('mongoose');

const AdminActionLogSchema = new mongoose.Schema({
  adminEmail: { type: String, required: true },
  adminRole: { type: String, default: 'admin' },
  action: { type: String, required: true },
  productId: { type: String, required: true },
  reason: { type: String },
  metadata: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AdminActionLog', AdminActionLogSchema);
