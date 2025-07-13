const Review = require('../models/Review');
const Product = require('../models/Product');
const User = require('../models/user');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createReview = catchAsync(async (req, res, next) => {
    const productId = req.body.productId || req.params.productId;
    const { review, rating } = req.body;
    const userId = req.user.id;

    if (!productId || !review || !rating) {
        return next(new AppError('Por favor, forneça o ID do produto, a avaliação e a nota.', 400));
    }

    const productExists = await Product.findByPk(productId);
    if (!productExists) {
        return next(new AppError('Produto não encontrado para esta avaliação.', 404));
    }

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

exports.getAllReviews = catchAsync(async (req, res, next) => {
    const filter = {};
    if (req.params.productId) filter.productId = req.params.productId;

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

exports.updateReview = catchAsync(async (req, res, next) => {
    const { review: reviewText, rating } = req.body;

    const reviewToUpdate = await Review.findByPk(req.params.id);

    if (!reviewToUpdate) {
        return next(new AppError('Nenhuma avaliação encontrada com este ID para atualizar.', 404));
    }

    if (reviewToUpdate.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para atualizar esta avaliação.', 403));
    }

    reviewToUpdate.review = reviewText || reviewToUpdate.review;
    reviewToUpdate.rating = rating || reviewToUpdate.rating;

    await reviewToUpdate.save();

    res.status(200).json({
        status: 'success',
        data: {
            review: reviewToUpdate,
        },
    });
});

exports.deleteReview = catchAsync(async (req, res, next) => {
    const review = await Review.findByPk(req.params.id);

    if (!review) {
        return next(new AppError('Nenhuma avaliação encontrada com este ID para deletar.', 404));
    }

    if (review.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para deletar esta avaliação.', 403));
    }

    await review.destroy();

    res.status(204).json({
        status: 'success',
        data: null,
    });
});