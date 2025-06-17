// routes/categoryRoutes.js
const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middlewares/authMiddleware'); // Importa os middlewares de proteção

const router = express.Router();

// Rotas que não exigem autenticação ou permissão de admin (apenas listar)
router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

// Rotas que exigem autenticação e permissão de 'admin'
router.use(protect); // Todas as rotas abaixo desta linha exigirão autenticação
router.use(restrictTo('admin')); // Todas as rotas abaixo desta linha exigirão que o usuário seja 'admin'

router.post('/', categoryController.createCategory);
router.put('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;