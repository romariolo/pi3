// controllers/categoryController.js
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Criar uma nova categoria
exports.createCategory = catchAsync(async (req, res, next) => {
    const { name, description, icon } = req.body;

    // Verifica se já existe uma categoria com o mesmo nome
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

// Listar todas as categorias
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

// Obter uma categoria por ID
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

// Atualizar uma categoria
exports.updateCategory = catchAsync(async (req, res, next) => {
    const { name, description, icon } = req.body;

    const category = await Category.findByPk(req.params.id);

    if (!category) {
        return next(new AppError('Nenhuma categoria encontrada com este ID para atualizar.', 404));
    }

    // Verifica se o novo nome já existe e não é a própria categoria
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

// Deletar uma categoria
exports.deleteCategory = catchAsync(async (req, res, next) => {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
        return next(new AppError('Nenhuma categoria encontrada com este ID para deletar.', 404));
    }

    // TODO: Adicionar lógica para verificar se existem produtos associados a esta categoria
    // e o que fazer neste caso (impedir deleção, reatribuir produtos, etc.)
    // Para simplificar no projeto de faculdade, pode-se deixar assim por enquanto.

    await category.destroy();

    res.status(204).json({ // 204 No Content para deleção bem sucedida
        status: 'success',
        data: null,
    });
});