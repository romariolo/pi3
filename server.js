// server.js
const express = require('express');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/database');
const globalErrorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const path = require('path');

// Importar todos os modelos para que o Sequelize os reconheça
const User = require('./models/user');
// CORREÇÃO AQUI: Removido parêntese extra
const Category = require('./models/Category');
const Product = require('./models/Product');
const { Order, OrderItem } = require('./models/Order');
const Review = require('./models/Review');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================================
// MIDDLEWARES GLOBAIS
// =========================================================
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================================================
// DEFINIÇÃO DAS ROTAS DA API
// =========================================================
app.get('/', (req, res) => {
    res.send('API do Marketplace de Comércio Local está rodando!');
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);


// =========================================================
// TRATAMENTO DE ERROS GLOBAIS
// =========================================================
app.use(globalErrorHandler);

// =========================================================
// INICIALIZAÇÃO DO SERVIDOR
// =========================================================
const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync({ force: false });
        console.log('Todos os modelos foram sincronizados com sucesso com o banco de dados.');

        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer();