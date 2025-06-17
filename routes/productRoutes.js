// routes/productRoutes.js
const express = require('express');
// CORREÇÃO AQUI: De './controllers/productController' para '../controllers/productController'
const productController = require('../controllers/productController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Este já está correto

const router = express.Router();

// Rotas públicas (qualquer um pode listar e ver detalhes)
router.get('/', productController.getAllProducts);
router.get('/:id', productController.getProductById);

// A partir daqui, todas as rotas exigem que o usuário esteja autenticado
router.use(protect);

// Rota para criar um novo produto
router.post('/',
    productController.uploadProductImage,
    productController.createProduct
);

// Rotas para atualizar e deletar um produto específico
router
    .route('/:id')
    .put(productController.uploadProductImage, productController.updateProduct)
    .delete(productController.deleteProduct);

router.get('/my-products', productController.getAllProducts);

module.exports = router;