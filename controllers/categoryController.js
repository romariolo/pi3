const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

exports.createCategory = catchAsync(async (req, res, next) => {
    const { name, description, icon } = req.body;

    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
        return next(new AppError('Já existe uma categoria com este nome.', 400));
    }

    const newCategory = await Category.create({
        name,
        description,
        icon,
    });

    res.status(201).json({
        status: 'success',
        data: {
            category: newCategory,
        },
    });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.findAll();

    res.status(200).json({
        status: 'success',
        results: categories.length,
        data: {
            categories,
        },
    });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        return next(new AppError('Nenhuma categoria encontrada com este ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            category,
        },
    });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
    const { name, description, icon } = req.body;

    const category = await Category.findByPk(req.params.id);

    if (!category) {
        return next(new AppError('Nenhuma categoria encontrada com este ID para atualizar.', 404));
    }

    if (name && name !== category.name) {
        const existingCategory = await Category.findOne({ where: { name } });
        if (existingCategory && existingCategory.id !== category.id) {
            return next(new AppError('Já existe outra categoria com este nome.', 400));
        }
    }

    category.name = name || category.name;
    category.description = description || category.description;
    category.icon = icon || category.icon;

    await category.save();

    res.status(200).json({
        status: 'success',
        data: {
            category,
        },
    });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        return next(new AppError('Nenhuma categoria encontrada com este ID para deletar.', 404));
    }

    await category.destroy();

    res.status(204).json({
        status: 'success',
        data: null,
    });
});