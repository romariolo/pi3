const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/me', userController.getMe);
router.patch('/updateMe', userController.updateMe);
router.delete('/deleteMe', userController.deleteMe);

router.use(restrictTo('admin'));

router.route('/')
    .get(userController.getAllUsers);

router.route('/:id')
    .get(userController.getUserById)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

module.exports = router;