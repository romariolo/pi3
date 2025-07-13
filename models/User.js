const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const User = sequelize.define('User', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            },
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
            validate: {
                len: [6, 255],
            },
        },
        role: {
            type: DataTypes.ENUM('user', 'vendedor', 'admin'),
            defaultValue: 'user',
        },
        address: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        phone: {
            type: DataTypes.STRING,
            allowNull: true,
        },
    });

    User.beforeCreate(async (user) => {
        if (user.password) {
            user.password = await bcrypt.hash(user.password, 12);
        }
    });

    User.prototype.comparePassword = async function (candidatePassword) {
        return await bcrypt.compare(candidatePassword, this.password);
    };

    return User;
};