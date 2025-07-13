const express = require('express');
const categoryController = require('../controllers/categoryController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', categoryController.getAllCategories);
router.get('/:id', categoryController.getCategoryById);

router.use(protect, restrictTo('admin'));

router.post('/', categoryController.createCategory);
router.patch('/:id', categoryController.updateCategory);
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;