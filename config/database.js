const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        dialect: 'mysql',
        logging: false,
        define: {
            timestamps: true,
            underscored: true,
        },
    }
);

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('Conexão com o MySQL estabelecida com sucesso!');
    } catch (error) {
        console.error('Não foi possível conectar ao MySQL:', error);
        process.exit(1);
    }
};

module.exports = { sequelize, connectDB };