// routes/userRoutes.js
const express = require('express');
const userController = require('../controllers/userController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

const router = express.Router();

// -----------------------------------------------------
// Rotas para o PRÓPRIO Usuário Logado
// Essas rotas são acessíveis por qualquer usuário autenticado (user ou admin)
// -----------------------------------------------------
router.use(protect); // Todas as rotas abaixo desta linha exigem autenticação

router.get('/me', userController.getMe); // Obter meu perfil
router.patch('/updateMe', userController.updateMe); // Atualizar meu perfil (não senha)
router.delete('/deleteMe', userController.deleteMe); // Deletar minha conta (desativar)

// -----------------------------------------------------
// Rotas para ADMIN (Gerenciar OUTROS Usuários)
// -----------------------------------------------------
router.use(restrictTo('admin')); // Todas as rotas abaixo exigem que o usuário seja 'admin'

router.route('/')
    .get(userController.getAllUsers); // Listar todos os usuários

router.route('/:id')
    .get(userController.getUserById) // Obter usuário por ID
    .put(userController.updateUser) // Atualizar usuário por ID
    .delete(userController.deleteUser); // Deletar usuário por ID

module.exports = router;