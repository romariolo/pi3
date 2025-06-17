// models/Review.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user'); // Avaliação é feita por um usuário
const Product = require('./Product'); // Avaliação é sobre um produto

const Review = sequelize.define('Review', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    review: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
            min: 1,
            max: 5,
        },
    },
    // Chaves estrangeiras
    userId: { // Quem fez a avaliação
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    productId: { // Qual produto foi avaliado
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Product,
            key: 'id',
        },
    },
});

// Associações
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// Adicionar associações inversas nos modelos User e Product
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });

// Opcional: Impedir que um usuário avalie o mesmo produto mais de uma vez
Review.addHook('beforeCreate', async (review, options) => {
    const existingReview = await Review.findOne({
        where: {
            userId: review.userId,
            productId: review.productId,
        },
        transaction: options.transaction // Importante para transações
    });

    if (existingReview) {
        throw new Error('Você já avaliou este produto!');
    }
});

// Opcional: Calcular a média de avaliações do produto após uma review ser criada/atualizada/deletada
// Isso pode ser feito com um hook afterSave/afterDestroy no Review,
// ou um método estático/instância no Product que recalcula a média.
// Para fins de demonstração, pode-se calcular a média ao buscar o produto ou deixar para depois.


module.exports = Review;