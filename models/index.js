'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const { sequelize } = require('../config/database');
const db = {};

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

const { User, Category, Product, Order, OrderItem, Review } = db;

User.hasMany(Product, { foreignKey: 'userId', as: 'products' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });

Category.hasMany(Product, { foreignKey: 'categoryId', as: 'products' });

Product.belongsTo(User, { foreignKey: 'userId', as: 'producer' });
Product.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });
Product.hasMany(Review, { foreignKey: 'productId', as: 'reviews' });
Product.hasMany(OrderItem, { foreignKey: 'productId' });

Order.belongsTo(User, { foreignKey: 'userId', as: 'buyer' });
Order.hasMany(OrderItem, { foreignKey: 'orderId', as: 'orderItems' });

OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { as: 'Product', foreignKey: 'productId' });

Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Review.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = db;