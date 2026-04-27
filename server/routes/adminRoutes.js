const express = require('express');
const router = express.Router();

const requireAdminAuth = require('../middleware/requireAdminAuth');
const adminController = require('../models/controllers/adminController');

router.get('/overview', requireAdminAuth, adminController.getOverview);
router.get('/dashboard', requireAdminAuth, adminController.getOverview);
router.get('/actions', requireAdminAuth, adminController.getActionLogs);
router.get('/transparency-export', requireAdminAuth, adminController.exportTransparencyAudit);
router.get('/products/flagged', requireAdminAuth, adminController.getFlaggedProducts);
router.get('/product/:id', requireAdminAuth, adminController.getProductReview);
router.post('/product/:id/action', requireAdminAuth, adminController.productAction);

// Blockchain event listener management
router.post('/blockchain-listener/sync', requireAdminAuth, adminController.syncBlockchainEvents);
router.get('/blockchain-listener/stats', requireAdminAuth, adminController.getBlockchainListenerStats);
router.post('/blockchain-listener/reset', requireAdminAuth, adminController.resetBlockchainListener);

module.exports = router;
