// controllers/reviewController.js
const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Criar uma nova avaliação
// O productId virá dos parâmetros da URL, o userId do token.
exports.createReview = catchAsync(async (req, res, next) => {
    // Permite que o ID do produto venha do body (se for rota POST /api/reviews) ou dos params (POST /api/products/:productId/reviews)
    const productId = req.body.productId || req.params.productId;
    const { review, rating } = req.body;
    const userId = req.user.id; // Quem está criando a review

    if (!productId || !review || !rating) {
        return next(new AppError('Por favor, forneça o ID do produto, a avaliação e a nota.', 400));
    }

    // 1. Verificar se o produto existe
    const productExists = await Product.findByPk(productId);
    if (!productExists) {
        return next(new AppError('Produto não encontrado para esta avaliação.', 404));
    }

    // 2. Verificar se o usuário já avaliou este produto (baseado no hook do modelo)
    // O hook 'beforeCreate' no modelo Review já cuida disso.
    // Se o hook disparar um erro, ele será capturado pelo catchAsync.

    // 3. Criar a avaliação
    const newReview = await Review.create({
        review,
        rating,
        productId,
        userId,
    });

    res.status(201).json({
        status: 'success',
        data: {
            review: newReview,
        },
    });
});

// Listar todas as avaliações (pode ser filtrado por produtoId, userId)
exports.getAllReviews = catchAsync(async (req, res, next) => {
    const filter = {};
    if (req.params.productId) filter.productId = req.params.productId; // Se a rota for aninhada (ex: /products/:productId/reviews)

    const reviews = await Review.findAll({
        where: filter,
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Product, as: 'product', attributes: ['id', 'name'] },
        ],
        order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
        status: 'success',
        results: reviews.length,
        data: {
            reviews,
        },
    });
});

// Obter uma avaliação por ID
exports.getReviewById = catchAsync(async (req, res, next) => {
    const review = await Review.findByPk(req.params.id, {
        include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: Product, as: 'product', attributes: ['id', 'name'] },
        ],
    });

    if (!review) {
        return next(new AppError('Nenhuma avaliação encontrada com este ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            review,
        },
    });
});

// Atualizar uma avaliação (apenas o autor da review ou admin)
exports.updateReview = catchAsync(async (req, res, next) => {
    const { review: reviewText, rating } = req.body;

    const reviewToUpdate = await Review.findByPk(req.params.id);

    if (!reviewToUpdate) {
        return next(new AppError('Nenhuma avaliação encontrada com este ID para atualizar.', 404));
    }

    // Autorização: Apenas o usuário que criou a review ou um admin pode atualizá-la
    if (reviewToUpdate.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para atualizar esta avaliação.', 403));
    }

    reviewToUpdate.review = reviewText || reviewToUpdate.review;
    reviewToUpdate.rating = rating || reviewToUpdate.rating; // Permite atualizar para 0 se o validação permitir

    await reviewToUpdate.save();

    res.status(200).json({
        status: 'success',
        data: {
            review: reviewToUpdate,
        },
    });
});

// Deletar uma avaliação (apenas o autor da review ou admin)
exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
        return next(new AppError('Nenhuma avaliação encontrada com este ID para deletar.', 404));
    }

    // Autorização: Apenas o usuário que criou a review ou um admin pode deletá-la
    if (review.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para deletar esta avaliação.', 403));
    }

    await review.destroy();

    res.status(204).json({
        status: 'success',
        data: null,
    });
});