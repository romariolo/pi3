// server.js
const express = require('express');
const dotenv = require('dotenv');
const { connectDB, sequelize } = require('./config/database');
const globalErrorHandler = require('./middlewares/errorHandler');
const authRoutes = require('./routes/authRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const productRoutes = require('./routes/productRoutes'); // Importa as rotas de produto
const path = require('path'); // Módulo nativo do Node.js para lidar com caminhos de arquivos

// Importar todos os modelos para que o Sequelize os reconheça
// Isso é importante para que o Sequelize configure as associações e
// crie as tabelas corretamente quando sequelize.sync() for chamado.
const User = require('./models/user');
const Category = require('./models/Category');
const Product = require('./models/Product');
const { Order, OrderItem } = require('./models/Order'); // Importa Order e OrderItem

// Carrega as variáveis de ambiente do arquivo .env para process.env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// =========================================================
// MIDDLEWARES GLOBAIS
// =========================================================

// Middleware para parsear o corpo das requisições com formato JSON
// Isso permite que o Express entenda os dados JSON enviados nas requisições POST/PUT
app.use(express.json());

// Middleware para servir arquivos estáticos (ex: imagens de produtos, PDFs)
// O '/uploads' é o prefixo da URL. Qualquer requisição para '/uploads/...'
// será mapeada para a pasta 'uploads' na raiz do seu projeto.
// Exemplo: Imagem salva em 'projeto_integrador/uploads/products/minha-imagem.jpg'
// será acessível em 'http://localhost:PORT/uploads/products/minha-imagem.jpg'
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================================================
// DEFINIÇÃO DAS ROTAS DA API
// =========================================================

// Rota de teste simples para verificar se a API está online
app.get('/', (req, res) => {
    res.send('API do Marketplace de Comércio Local está rodando!');
});

// Monta as rotas de autenticação (registro, login) sob o prefixo /api/auth
// Ex: POST /api/auth/register, POST /api/auth/login
app.use('/api/auth', authRoutes);

// Monta as rotas de categoria sob o prefixo /api/categories
// Ex: GET /api/categories, POST /api/categories, PUT /api/categories/:id, DELETE /api/categories/:id
app.use('/api/categories', categoryRoutes);

// Monta as rotas de produto sob o prefixo /api/products
// Ex: GET /api/products, POST /api/products, PUT /api/products/:id, DELETE /api/products/:id
app.use('/api/products', productRoutes);


// =========================================================
// TRATAMENTO DE ERROS GLOBAIS
// =========================================================

// Este middleware deve ser SEMPRE o último a ser usado, depois de todas as rotas.
// Ele captura qualquer erro que ocorra nas rotas e envia uma resposta padronizada ao cliente.
app.use(globalErrorHandler);

// =========================================================
// INICIALIZAÇÃO DO SERVIDOR
// =========================================================

// Função assíncrona para conectar ao banco de dados e iniciar o servidor Express
const startServer = async () => {
    try {
        // Tenta autenticar a conexão com o banco de dados MySQL
        await connectDB();

        // Sincroniza todos os modelos definidos com o banco de dados.
        // CUIDADO:
        // - { force: true } : Apaga todas as tabelas e as recria. Útil em desenvolvimento inicial.
        // - { force: false }: Cria tabelas apenas se não existirem. Não altera tabelas existentes.
        // Para alterações de esquema em um banco de dados com dados, o ideal são 'migrations' do Sequelize.
        await sequelize.sync({ force: false });
        console.log('Todos os modelos foram sincronizados com sucesso com o banco de dados.');

        // Inicia o servidor Express na porta definida
        app.listen(PORT, () => {
            console.log(`Servidor rodando na porta ${PORT}`);
            console.log(`Acesse: http://localhost:${PORT}`);
        });
    } catch (error) {
        // Em caso de erro na conexão com o DB ou sincronização, loga o erro e encerra o processo Node.js
        console.error('Falha ao iniciar o servidor:', error);
        process.exit(1);
    }
};

startServer(); // Chama a função para iniciar a aplicação