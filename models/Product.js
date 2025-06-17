// models/Product.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database'); // <-- OK, sobe para config
const User = require('./user');     // <--- MUITO IMPORTANTE: DEVE SER './user' (NO MESMO DIRETÓRIO) e minúsculo!
const Category = require('./Category'); // <-- OK, está no mesmo diretório

const Product = sequelize.define('Product', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: true,
            min: 0,
        },
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: 0,
        },
    },
    imageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id',
        },
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Category,
            key: 'id',
        },
    },
});

// Associações
Product.belongsTo(User, { foreignKey: 'userId', as: 'producer' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

module.exports = Product;