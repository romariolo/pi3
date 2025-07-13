const express = require('express');
const orderController = require('../controllers/orderController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', orderController.createOrder);
router.get('/my-orders', orderController.getMyOrders);
router.patch('/:id/cancel', orderController.cancelOrder);
router.get('/:id', orderController.getOrderById);

router.use(restrictTo('admin'));

router.get('/', orderController.getAllOrders);
router.patch('/:id/status', orderController.updateOrderStatus);

module.exports = router;