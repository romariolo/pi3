const express = require('express');
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.use('/:productId/reviews', reviewRouter);

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

router.use(protect);

router.get('/my', productController.getMyProducts);

router.post('/',
    restrictTo('admin', 'vendedor'),
    productController.uploadProductImage,
    productController.createProduct
);

router.patch('/:id',
    restrictTo('admin', 'vendedor'),
    productController.uploadProductImage, 
    productController.updateProduct
);

router.delete('/:id',
    restrictTo('admin', 'vendedor'),
    productController.deleteProduct
);

module.exports = router;