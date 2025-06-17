// routes/orderRoutes.js
const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas as rotas de pedido exigem que o usuário esteja autenticado
router.use(protect);

// Rotas para usuários comuns (compradores)
router.post('/', orderController.createOrder); // Criar um novo pedido
router.get('/my-orders', orderController.getMyOrders); // Listar meus pedidos
router.patch('/:id/cancel', orderController.cancelOrder); // Cancelar um pedido

// Rotas para usuários (produtores) e administradores
// Produtores podem ver detalhes de pedidos que contenham seus produtos
router.get('/:id', orderController.getOrderById); // Ver detalhes de um pedido

// Rotas para ADMINISTRADORES
router.use(restrictTo('admin')); // Todas as rotas abaixo desta linha exigirão que o usuário seja 'admin'
router.get('/', orderController.getAllOrders); // Listar todos os pedidos (apenas admin)
router.patch('/:id/status', orderController.updateOrderStatus); // Atualizar status do pedido (apenas admin)


module.exports = router;