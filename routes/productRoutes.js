// routes/productRoutes.js
const express = require('express');
const productController = require('./controllers/productController'); // <-- ESTÁ CORRETO
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const reviewRouter = require('./reviewRoutes');

const router = express.Router();

router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

router.use('/:productId/reviews', reviewRouter);

router.use(protect);

router.post('/',
    productController.uploadProductImage,
    productController.createProduct
);

router
    .route('/:id')
    .put(productController.uploadProductImage, productController.updateProduct)
    .delete(productController.deleteProduct);

router.get('/my-products', productController.getAllProducts);

module.exports = router;