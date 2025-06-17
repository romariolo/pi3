// controllers/orderController.js
const { Order, OrderItem } = require('../models/Order'); // Importa ambos os modelos
const Product = require('../models/Product');
const User = require('../models/user'); // Casing minúsculo para user.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const { sequelize } = require('../config/database'); // Para transações

// -----------------------------------------------------
// Funções CRUD para Pedidos
// -----------------------------------------------------

// Criar um novo pedido (usuário comum - comprador)
exports.createOrder = catchAsync(async (req, res, next) => {
    // req.body.products é esperado como um array de objetos:
    // [{ productId: 1, quantity: 2 }, { productId: 3, quantity: 1 }]
    const { products: orderProducts, shippingAddress } = req.body;
    const userId = req.user.id; // ID do comprador logado

    if (!orderProducts || orderProducts.length === 0 || !shippingAddress) {
        return next(new AppError('Dados de pedido incompletos. Por favor, forneça produtos e endereço de entrega.', 400));
    }

    // Usar uma transação para garantir a atomicidade (tudo ou nada)
    const transaction = await sequelize.transaction();

    try {
        let totalAmount = 0;
        const itemsToCreate = [];

        for (const item of orderProducts) {
            const product = await Product.findByPk(item.productId, { transaction });

            if (!product) {
                throw new AppError(`Produto com ID ${item.productId} não encontrado.`, 404);
            }
            if (product.stock < item.quantity) {
                throw new AppError(`Estoque insuficiente para o produto "${product.name}". Disponível: ${product.stock}`, 400);
            }

            // Reduz o estoque do produto
            product.stock -= item.quantity;
            await product.save({ transaction });

            const itemPrice = product.price; // Preço do produto no momento da compra
            totalAmount += itemPrice * item.quantity;

            itemsToCreate.push({
                productId: product.id,
                quantity: item.quantity,
                price: itemPrice, // Armazena o preço no momento da compra
            });
        }

        const newOrder = await Order.create({
            userId,
            totalAmount,
            shippingAddress,
            status: 'pending', // Status inicial
        }, { transaction });

        // Associa os itens ao pedido recém-criado
        for (const item of itemsToCreate) {
            await OrderItem.create({
                orderId: newOrder.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            }, { transaction });
        }

        await transaction.commit(); // Confirma a transação

        res.status(201).json({
            status: 'success',
            message: 'Pedido realizado com sucesso!',
            data: {
                order: newOrder,
            },
        });
    } catch (error) {
        await transaction.rollback(); // Reverte a transação em caso de erro
        console.error('Erro ao criar pedido:', error);
        next(error); // Passa o erro para o middleware de tratamento de erros
    }
});

// Listar pedidos do usuário logado (comprador)
exports.getMyOrders = catchAsync(async (req, res, next) => {
    const orders = await Order.findAll({
        where: { userId: req.user.id },
        include: [
            {
                model: OrderItem,
                as: 'orderItems',
                include: {
                    model: Product,
                    as: 'Product', // 'Product' é o nome padrão do modelo, não 'product'
                    attributes: ['id', 'name', 'price', 'imageUrl']
                }
            },
        ],
        order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
            orders,
        },
    });
});

// Obter detalhes de um pedido específico (para comprador ou produtor/admin)
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
                    attributes: ['id', 'name', 'price', 'imageUrl']
                }
            },
        ],
    });

    if (!order) {
        return next(new AppError('Pedido não encontrado.', 404));
    }

    // Autorização: O comprador do pedido OU um admin pode ver o pedido
    if (order.userId !== req.user.id && req.user.role !== 'admin') {
        // Se for um produtor, ele só deve ver se o pedido contiver algum produto dele
        const isProducerOfProductsInOrder = await OrderItem.findOne({
            where: { orderId: order.id },
            include: {
                model: Product,
                as: 'Product',
                where: { userId: req.user.id }
            }
        });

        if (!isProducerOfProductsInOrder) {
             return next(new AppError('Você não tem permissão para visualizar este pedido.', 403));
        }
    }

    res.status(200).json({
        status: 'success',
        data: {
            order,
        },
    });
});

// Listar todos os pedidos (apenas para Admin)
exports.getAllOrders = catchAsync(async (req, res, next) => {
    // Implementar filtros se necessário (ex: por status, por compradorId, etc.)
    const orders = await Order.findAll({
        include: [
            { model: User, as: 'buyer', attributes: ['id', 'name', 'email', 'phone'] },
            {
                model: OrderItem,
                as: 'orderItems',
                include: {
                    model: Product,
                    as: 'Product',
                    attributes: ['id', 'name', 'price', 'imageUrl']
                }
            },
        ],
        order: [['createdAt', 'DESC']],
    });

    res.status(200).json({
        status: 'success',
        results: orders.length,
        data: {
            orders,
        },
    });
});

// Atualizar status do pedido (para Admin ou Produtor do produto)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
    const { status } = req.body;

    if (!['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(status)) {
        return next(new AppError('Status de pedido inválido.', 400));
    }

    const order = await Order.findByPk(req.params.id);

    if (!order) {
        return next(new AppError('Pedido não encontrado.', 404));
    }

    // Autorização: Apenas ADMIN pode mudar o status de qualquer pedido.
    // Ou, um PRODUTOR pode mudar o status DE SEUS PRODUTOS dentro do pedido.
    // Para simplificar, vou permitir que admins mudem qualquer status.
    // Produtores precisariam de uma lógica mais granular (ex: "marcar item como enviado")
    if (req.user.role !== 'admin') {
        // Lógica mais complexa para produtor:
        // Verificar se o pedido contém produtos do produtor logado
        const orderItemsForThisProducer = await OrderItem.findOne({
            where: { orderId: order.id },
            include: {
                model: Product,
                as: 'Product',
                where: { userId: req.user.id }
            }
        });

        if (!orderItemsForThisProducer) {
             return next(new AppError('Você não tem permissão para atualizar o status deste pedido.', 403));
        }

        // Permitir que o produtor atualize status apenas para 'shipped' ou 'delivered' em seus produtos
        // Se a mudança de status afeta o pedido inteiro, admin é o mais adequado.
        // Para o MVP de faculdade, admin para status geral é mais simples.
        // Se o produtor só puder mudar o status de SEUS itens no pedido, a lógica muda.
        // Por agora, vamos manter mais simples: Admin muda status do pedido geral.
        return next(new AppError('Você não tem permissão para atualizar o status global deste pedido. Apenas administradores podem fazer isso.', 403));
    }

    order.status = status;
    await order.save();

    res.status(200).json({
        status: 'success',
        message: `Status do pedido ${order.id} atualizado para "${status}".`,
        data: {
            order,
        },
    });
});

// Cancelar Pedido (comprador pode cancelar se status for 'pending' ou 'processing')
exports.cancelOrder = catchAsync(async (req, res, next) => {
    const order = await Order.findByPk(req.params.id);

    if (!order) {
        return next(new AppError('Pedido não encontrado.', 404));
    }

    // Somente o comprador pode cancelar seu próprio pedido
    if (order.userId !== req.user.id && req.user.role !== 'admin') { // Admin também pode cancelar
        return next(new AppError('Você não tem permissão para cancelar este pedido.', 403));
    }

    // Permite cancelar se o status for 'pending' ou 'processing'
    if (order.status === 'pending' || order.status === 'processing') {
        const transaction = await sequelize.transaction();
        try {
            order.status = 'cancelled';
            await order.save({ transaction });

            // Reverter estoque dos produtos no pedido
            const orderItems = await OrderItem.findAll({
                where: { orderId: order.id },
                transaction
            });

            for (const item of orderItems) {
                const product = await Product.findByPk(item.productId, { transaction });
                if (product) {
                    product.stock += item.quantity; // Adiciona o estoque de volta
                    await product.save({ transaction });
                }
            }

            await transaction.commit();

            res.status(200).json({
                status: 'success',
                message: 'Pedido cancelado com sucesso e estoque revertido.',
                data: {
                    order,
                },
            });
        } catch (error) {
            await transaction.rollback();
            console.error('Erro ao cancelar pedido e reverter estoque:', error);
            next(error);
        }
    } else {
        return next(new AppError(`Não é possível cancelar um pedido com status "${order.status}".`, 400));
    }
});