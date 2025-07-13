const db = require('../models');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const { Order, Product, User, Category, OrderItem } = db;

exports.createOrder = catchAsync(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const userId = req.user.id;

    if (!productId || !quantity || quantity <= 0) {
        return next(new AppError('Por favor, forneça um produto e uma quantidade válida.', 400));
    }

    const transaction = await db.sequelize.transaction();
    try {
        const product = await Product.findByPk(productId, { transaction });

        if (!product) {
            throw new AppError(`Produto com ID ${productId} não encontrado.`, 404);
        }
        if (product.stock < quantity) {
            throw new AppError(`Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stock}`, 400);
        }

        product.stock -= quantity;
        if (product.stock <= 0) {
            product.status = 'indisponivel';
        }

        await product.save({ transaction });

        const totalAmount = product.price * quantity;

        const newOrder = await Order.create({
            userId, 
            totalAmount,
            shippingAddress: 'Venda Local',
            status: 'delivered',
        }, { transaction });

        await OrderItem.create({
            orderId: newOrder.id,
            productId: product.id,
            quantity: quantity,
            price: product.price,
        }, { transaction });

        await transaction.commit();

        const finalOrder = await Order.findByPk(newOrder.id, {
             include: [{
                model: OrderItem,
                as: 'orderItems'
            }]
        });

        res.status(201).json({
            status: 'success',
            message: 'Venda registrada com sucesso!',
            data: {
                order: finalOrder,
            },
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [{
            model: OrderItem,
            as: 'orderItems',
            include: {
                model: Product,
                as: 'Product',
                attributes: ['id', 'name', 'price', 'imageUrl', 'unit']
            }
        }],
        order: [
            ['createdAt', 'DESC']
        ],
    });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
            orders,
        },
    });
});


exports.getOrderById = catchAsync(async (req, res, next) => {
    const order = await Order.findByPk(req.params.id, {
        include: [
            { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'phone'] },
            {
                model: OrderItem,
                as: 'orderItems',
                include: {
                    model: Product,
                    as: 'Product',
                    attributes: ['id', 'name', 'price', 'imageUrl', 'unit']
                }
            },
        ],
    });

    if (!order) {
        return next(new AppError('Pedido não encontrado.', 404));
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para visualizar este pedido.', 403));
    }

    res.status(200).json({
        status: 'success',
        data: {
            order,
        },
    });
});

exports.getAllOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.findAll({
        include: [{
            model: User,
            as: 'buyer',
            attributes: ['id', 'name']
        }, {
            model: OrderItem,
            as: 'orderItems',
            include: {
                model: Product,
                as: 'Product',
                attributes: ['id', 'name', 'price', 'unit'],
                include: {
                    model: Category,
                    as: 'category',
                    attributes: ['name']
                }
            }
        }, ],
        order: [
            ['createdAt', 'DESC']
        ],
    });

    const salesHistory = orders.flatMap(order =>
        order.orderItems.map(item => ({
            id: order.id + '-' + item.productId,
            timestamp: order.createdAt,
            productName: item.Product ? item.Product.name : 'Produto Deletado',
            category: item.Product && item.Product.category ? item.Product.category.name : 'Sem Categoria',
            quantity: item.quantity,
            unit: item.Product ? item.Product.unit : '',
            price: parseFloat(item.price),
            total: item.quantity * parseFloat(item.price),
        }))
    );

    res.status(200).json({
        status: 'success',
        results: salesHistory.length,
        data: {
            sales: salesHistory,
        },
    });
});

exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return next(new AppError('Status de pedido inválido.', 400));
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
        return next(new AppError('Pedido não encontrado.', 404));
    }
    
    if (req.user.role !== 'admin') {
         return next(new AppError('Você não tem permissão para atualizar o status deste pedido.', 403));
    }

    order.status = status;
    await order.save();

    res.status(200).json({
        status: 'success',
        data: {
            order,
        },
    });
});

exports.cancelOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
        return next(new AppError('Pedido não encontrado.', 404));
    }

    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        return next(new AppError('Você não tem permissão para cancelar este pedido.', 403));
    }

    if (order.status !== 'delivered' && order.status !== 'cancelled') {
        const transaction = await db.sequelize.transaction();
        try {
            order.status = 'cancelled';
            await order.save({ transaction });

            const orderItems = await OrderItem.findAll({
                where: { orderId: order.id },
                transaction
            });

            for (const item of orderItems) {
                const product = await Product.findByPk(item.productId, { transaction });
                if (product) {
                    product.stock += item.quantity;
                    await product.save({ transaction });
                }
            }

            await transaction.commit();

            res.status(200).json({
                status: 'success',
                message: 'Pedido cancelado e estoque revertido.',
                data: {
                    order,
                },
            });
        } catch (error) {
            await transaction.rollback();
            next(error);
        }
    } else {
        return next(new AppError(`Não é possível cancelar um pedido com status "${order.status}".`, 400));
    }
});