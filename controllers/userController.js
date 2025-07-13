const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
        if (allowedFields.includes(el)) newObj[el] = obj[el];
    });
    return newObj;
};

exports.getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user,
        },
    });
});

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'Esta rota não é para atualização de senha. Por favor, use /updateMyPassword.',
                400
            )
        );
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'address', 'phone');

    const updatedUser = await req.user.update(filteredBody);

    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser,
        },
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.destroy({
        where: { id: req.user.id }
    });

    res.status(204).json({
        status: 'success',
        data: null,
    });
});

exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] }
    });

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users,
        },
    });
});

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

exports.updateUser = catchAsync(async (req, res, next) => {
    if (req.body.password) {
        return next(new AppError('Admin não pode alterar a senha de um usuário diretamente por esta rota.', 400));
    }

    const user = await User.findByPk(req.params.id);

    if (!user) {
        return next(new AppError('Nenhum usuário encontrado com este ID para atualizar.', 404));
    }

    const filteredBody = filterObj(req.body, 'name', 'email', 'role', 'address', 'phone');

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

exports.deleteUser = catchAsync(async (req, res, next) => {
    const user = await User.findByPk(req.params.id);

    if (!user) {
        return next(new AppError('Nenhum usuário encontrado com este ID para deletar.', 404));
    }

    if (req.user.id === user.id) {
        return next(new AppError('Administradores não podem deletar sua própria conta por esta rota.', 403));
    }

    await user.destroy();

    res.status(204).json({
        status: 'success',
        data: null,
    });
});