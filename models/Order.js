const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Order = sequelize.define('Order', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        shippingAddress: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        status: {
            type: DataTypes.ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled'),
            defaultValue: 'pending',
        },
    });

    return Order;
};