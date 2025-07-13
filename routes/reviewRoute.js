const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router({ mergeParams: true });

router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);

router.use(protect);

router.post('/', reviewController.createReview);

router.route('/:id')
    .patch(reviewController.updateReview)
    .delete(reviewController.deleteReview);

module.exports = router;