// controllers/productController.js
const Product = require('../models/Product');
const User = require('../models/user'); // Certifique-se que o casing está correto (user.js)
const Category = require('../models/Category');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const multer = require('multer');
const path = require('path');
const fs = require('fs'); // Para lidar com arquivos do sistema

// -----------------------------------------------------
// Configuração do Multer para upload de imagens
// -----------------------------------------------------
const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../uploads/products');
        // Cria a pasta se não existir
        // Com recursive: true, ele cria subpastas se necessário
        fs.mkdirSync(uploadPath, { recursive: true });
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        // Gera um nome de arquivo único: product-<timestamp>.<extensao>
        const ext = file.mimetype.split('/')[1]; // ex: 'jpeg', 'png'
        cb(null, `product-${Date.now()}.${ext}`);
    },
});

const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Não é uma imagem! Por favor, faça upload apenas de imagens.', 400), false);
    }
};

const upload = multer({
    storage: multerStorage,
    fileFilter: multerFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // Limite de 5MB por arquivo
});

// Middleware para upload de UMA imagem (campo 'image')
// Este middleware será usado nas rotas de criação e atualização de produto
exports.uploadProductImage = upload.single('image');

// -----------------------------------------------------
// Funções CRUD para Produtos
// -----------------------------------------------------

// Criar um novo produto
exports.createProduct = catchAsync(async (req, res, next) => {
    const { name, description, price, stock, categoryId } = req.body;

    // O ID do produtor vem do usuário logado (req.user.id)
    // O middleware 'protect' garante que req.user está disponível
    const userId = req.user.id;

    // Verificar se a categoria existe
    const category = await Category.findByPk(categoryId);
    if (!category) {
        return next(new AppError('Categoria não encontrada.', 404));
    }

    // Obter o caminho da imagem se houver upload
    let imageUrl = null;
    if (req.file) {
        // O caminho salvo deve ser relativo para acesso via URL (ex: /uploads/products/nome_do_arquivo.jpg)
        imageUrl = `/uploads/products/${req.file.filename}`;
    }

    const newProduct = await Product.create({
        name,
        description,
        price,
        stock,
        categoryId,
        userId, // Associa o produto ao usuário logado (produtor)
        imageUrl,
    });

    res.status(201).json({
        status: 'success',
        data: {
            product: newProduct,
        },
    });
});

// Listar todos os produtos (com filtros e paginação opcional)
exports.getAllProducts = catchAsync(async (req, res, next) => {
    // Para simplificar a busca e filtros:
    // Exemplo de uso: /api/products?price[gte]=10&categoryName=Hortaliças&sort=price,asc&page=1&limit=10
    const query = {
        include: [
            { model: User, as: 'producer', attributes: ['id', 'name', 'email', 'phone'] },
            { model: Category, as: 'category', attributes: ['id', 'name'] },
        ],
        where: {}
    };

    // Filtragem (ex: name, price[gte], price[lte], categoryId)
    if (req.query.name) {
        query.where.name = { [Op.like]: `%${req.query.name}%` };
    }
    if (req.query.price) {
        if (req.query.price.gte) query.where.price = { ...query.where.price, [Op.gte]: req.query.price.gte };
        if (req.query.price.lte) query.where.price = { ...query.where.price, [Op.lte]: req.query.price.lte };
    }
    if (req.query.categoryId) {
        query.where.categoryId = req.query.categoryId;
    }
    // Para filtrar por nome da categoria, precisaríamos de uma associação mais complexa no 'where'
    // ou buscar primeiro a categoria pelo nome e usar o ID.
    // Exemplo: if (req.query.categoryName) { ... }

    // Ordenação (ex: ?sort=price,-createdAt)
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').map(field => {
            if (field.startsWith('-')) {
                return [field.substring(1), 'DESC'];
            }
            return [field, 'ASC'];
        });
        query.order = sortBy;
    } else {
        query.order = [['createdAt', 'DESC']]; // Padrão
    }

    // Paginação
    const page = req.query.page * 1 || 1;
    const limit = req.query.limit * 1 || 10;
    const offset = (page - 1) * limit;

    query.limit = limit;
    query.offset = offset;

    // Para operações de busca (Op.like, Op.gte, etc.)
    const { Op } = require('sequelize');


    const products = await Product.findAll(query);

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products,
        },
    });
});

// Obter um produto por ID
exports.getProductById = catchAsync(async (req, res, next) => {
    const product = await Product.findByPk(req.params.id, {
        include: [
            { model: User, as: 'producer', attributes: ['id', 'name', 'email', 'phone'] },
            { model: Category, as: 'category', attributes: ['id', 'name'] },
        ],
    });

    if (!product) {
        return next(new AppError('Nenhum produto encontrado com este ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            product,
        },
    });
});

// Atualizar um produto (apenas pelo produtor ou admin)
exports.updateProduct = catchAsync(async (req, res, next) => {
    const { name, description, price, stock, categoryId } = req.body;

    const product = await Product.findByPk(req.params.id);

    if (!product) {
        return next(new AppError('Nenhum produto encontrado com este ID para atualizar.', 404));
    }

    // Verifica se o usuário logado é o produtor do produto OU é um admin
    if (product.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para atualizar este produto.', 403));
    }

    // Se houver nova imagem, processa o upload e remove a antiga (se existir)
    if (req.file) {
        // Remover a imagem antiga, se existir
        if (product.imageUrl) {
            const oldImagePath = path.join(__dirname, '..', product.imageUrl);
            fs.unlink(oldImagePath, (err) => {
                if (err) console.error('Erro ao deletar imagem antiga:', err);
            });
        }
        product.imageUrl = `/uploads/products/${req.file.filename}`;
    }

    // Atualiza apenas os campos fornecidos
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.stock = stock !== undefined ? stock : product.stock; // Permite setar 0
    product.categoryId = categoryId || product.categoryId;

    // Se a categoriaId foi alterada, verificar se a nova categoria existe
    if (categoryId && categoryId !== product.categoryId) {
        const newCategory = await Category.findByPk(categoryId);
        if (!newCategory) {
            return next(new AppError('A nova categoria fornecida não foi encontrada.', 404));
        }
    }

    await product.save();

    res.status(200).json({
        status: 'success',
        data: {
            product,
        },
    });
});

// Deletar um produto (apenas pelo produtor ou admin)
exports.deleteProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
        return next(new AppError('Nenhum produto encontrado com este ID para deletar.', 404));
    }

    // Verifica se o usuário logado é o produtor do produto OU é um admin
    if (product.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para deletar este produto.', 403));
    }

    // Remove a imagem associada ao produto (se existir)
    if (product.imageUrl) {
        const imagePath = path.join(__dirname, '..', product.imageUrl);
        fs.unlink(imagePath, (err) => {
            if (err) console.error('Erro ao deletar imagem do produto:', err);
        });
    }

    await product.destroy();

    res.status(204).json({
        status: 'success',
        data: null,
    });
});