// controllers/authController.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);

    // Remover a senha do output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user,
        },
    });
};

exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, role, address, phone } = req.body;

    // Verificar se já existe um usuário com o email fornecido
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
        return next(new AppError('Este e-mail já está em uso. Por favor, escolha outro.', 400));
    }

    const newUser = await User.create({
        name,
        email,
        password,
        role: role || 'user', // Default para 'user' se não especificado
        address,
        phone,
    });

    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1) Verificar se email e senha foram fornecidos
    if (!email || !password) {
        return next(new AppError('Por favor, forneça email e senha!', 400));
    }

    // 2) Verificar se o usuário existe E a senha está correta
    const user = await User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
        return next(new AppError('Email ou senha incorretos!', 401));
    }

    // 3) Se tudo estiver ok, enviar token ao cliente
    createSendToken(user, 200, res);
});