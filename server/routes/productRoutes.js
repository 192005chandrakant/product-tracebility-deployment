const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { auth, requireRole } = require('../middleware/auth');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post('/add-product', auth, requireRole('producer'), upload.single('certFile'), productController.addProduct);
router.post('/update-product/:id', auth, requireRole('producer'), productController.updateProduct);
router.get('/product/:id', productController.getProduct);
router.get('/products', productController.getAllProducts);

module.exports = router; 