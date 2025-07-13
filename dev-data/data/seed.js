const fs = require('fs');
const dotenv = require('dotenv');
const db = require('../../models');

dotenv.config();

const { User, Category, Product } = db;

const usersData = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const categoriesData = JSON.parse(fs.readFileSync(`${__dirname}/categories.json`, 'utf-8'));
const productsData = JSON.parse(fs.readFileSync(`${__dirname}/products.json`, 'utf-8'));

const importData = async () => {
    try {
        await db.sequelize.authenticate();
        console.log('Conexão com o MySQL estabelecida com sucesso!');
        await db.sequelize.sync({ force: true });
        console.log('Tabelas recriadas com sucesso!');

        const createdUsers = await User.bulkCreate(usersData, { individualHooks: true });
        console.log('Usuários importados com sucesso!');

        const createdCategories = await Category.bulkCreate(categoriesData);
        console.log('Categorias importadas com sucesso!');

        const adminUser = createdUsers.find(u => u.role === 'admin');
        const vendedorUser = createdUsers.find(u => u.role === 'vendedor');
        
        const productsWithAssociations = productsData.map((product, index) => ({
            ...product,
            userId: vendedorUser.id,
            categoryId: createdCategories[index % createdCategories.length].id,
        }));

        await Product.bulkCreate(productsWithAssociations);
        console.log('Produtos importados com sucesso!');

        console.log('Dados importados com sucesso!');
        process.exit();
    } catch (err) {
        console.error('ERRO:', err);
        process.exit(1);
    }
};

const deleteData = async () => {
    try {
        await db.sequelize.sync({ force: true });
        console.log('Dados deletados com sucesso!');
        process.exit();
    } catch (err) {
        console.error('ERRO:', err);
        process.exit(1);
    }
};

if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
} else {
    console.log('Por favor, use --import para importar ou --delete para deletar.');
    process.exit(1);
}