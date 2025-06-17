// controllers/userController.js
const User = require('../models/user'); // Casing minúsculo para user.js
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

// Middleware para filtrar objetos de requisição, removendo campos indesejados
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

// -----------------------------------------------------
// Funções de Perfil para o PRÓPRIO Usuário Logado
// (comprador/produtor)
// -----------------------------------------------------

// Obter o perfil do usuário logado
exports.getMe = catchAsync(async (req, res, next) => {
    // O usuário já está disponível em req.user graças ao middleware 'protect'
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user,
        },
    });
});

// Atualizar o perfil do usuário logado (nome, email, etc., mas NÃO senha ou role)
exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Criar erro se o usuário POSTar dados de senha
    if (req.body.password || req.body.passwordConfirm) { // passwordConfirm não existe no nosso modelo, mas é uma boa prática para evitar
        return next(
            new AppError(
                'Esta rota não é para atualização de senha. Por favor, use /updateMyPassword.',
                400
            )
        );
    }

    // 2) Filtrar nomes de campos não permitidos que não devem ser atualizados
    const filteredBody = filterObj(req.body, 'name', 'email', 'address', 'phone');

    // 3) Atualizar documento do usuário
    const updatedUser = await req.user.update(filteredBody);

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

// Deletar o próprio usuário (desativar conta)
exports.deleteMe = catchAsync(async (req, res, next) => {
    // Em vez de deletar, podemos apenas desativar a conta
    // Isso é mais seguro para manter o histórico de pedidos, etc.
    // Você pode adicionar um campo 'active' ao modelo User (boolean, defaultValue: true)
    // E então setar user.active = false
    // Por enquanto, vamos fazer a deleção física para simplicidade, mas para um sistema real, prefira desativação.
    await User.destroy({
        where: { id: req.user.id }
    });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

// -----------------------------------------------------
// Funções para ADMIN (Gerenciar OUTROS Usuários)
// -----------------------------------------------------

// Listar todos os usuários (Admin)
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] } // Não enviar a senha para o cliente
    });

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

// Obter um usuário por ID (Admin)
exports.getUserById = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.params.id, {
        attributes: { exclude: ['password'] }
    });

    if (!user) {
        return next(new AppError('Nenhum usuário encontrado com este ID.', 404));
    }

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// Atualizar um usuário por ID (Admin) - CUIDADO ao permitir mudança de senha ou role aqui
exports.updateUser = catchAsync(async (req, res, next) => {
    // Admin não deve mudar a senha do usuário por aqui, apenas resetar (nova rota)
    if (req.body.password) {
        return next(new AppError('Admin não pode alterar a senha de um usuário diretamente por esta rota.', 400));
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
        return next(new AppError('Nenhum usuário encontrado com este ID para atualizar.', 404));
    }

    // Filtrar campos que o admin pode atualizar (nome, email, role, address, phone)
    const filteredBody = filterObj(req.body, 'name', 'email', 'role', 'address', 'phone');

    // Se o admin tentar mudar o próprio papel (role) para algo que não seja admin
    // Isso é uma proteção opcional para não permitir que um admin se rebaixe sem querer.
    if (req.user.id === user.id && filteredBody.role && filteredBody.role !== 'admin') {
        return next(new AppError('Administradores não podem rebaixar seu próprio papel por esta rota.', 403));
    }

    await user.update(filteredBody);

    res.status(200).json({
        status: 'success',
        data: {
            user,
        },
    });
});

// Deletar um usuário por ID (Admin)
exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
        return next(new AppError('Nenhum usuário encontrado com este ID para deletar.', 404));
    }

    // Proteção: Admin não pode se deletar
    if (req.user.id === user.id) {
        return next(new AppError('Administradores não podem deletar sua própria conta por esta rota.', 403));
    }

    await user.destroy();

    res.status(204).json({
        status: 'success',
        data: null,
    });
});