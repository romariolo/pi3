const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { connectDB, sequelize } = require('./config/database');
const globalErrorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const userRoutes = require('./routes/userRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const path = require('path');
const AppError = require('./utils/AppError');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('API do Marketplace de Comércio Local está rodando!');
});

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reviews', reviewRoutes);

app.all('*', (req, res, next) => {
    next(new AppError(`Não foi possível encontrar ${req.originalUrl} neste servidor!`, 404));
});

app.use(globalErrorHandler);

const startServer = async () => {
    try {
        await connectDB();
        await sequelize.sync({ force: false, alter: true });
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