// routes/reviewRoutes.js
const express = require('express');
const reviewController = require('../controllers/reviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// 'mergeParams: true' é importante se esta rota for aninhada,
// ex: router.use('/:productId/reviews', reviewRouter);
const router = express.Router({ mergeParams: true });

// Rotas para listar avaliações (públicas ou filtradas por produto)
router.get('/', reviewController.getAllReviews);
router.get('/:id', reviewController.getReviewById);

// Todas as rotas abaixo exigem autenticação
router.use(protect);

// Rota para criar avaliação (apenas usuários logados)
// Se for rota aninhada, productId virá dos params. Se for rota direta, do body.
router.post('/', reviewController.createReview);

// Rotas para atualizar e deletar avaliação (apenas o autor ou admin)
router
    .route('/:id')
    .patch(reviewController.updateReview) // PATCH para atualização parcial
    .delete(reviewController.deleteReview);

module.exports = router;