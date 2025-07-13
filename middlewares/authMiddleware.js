const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');

const protect = catchAsync(async (req, res, next) => {
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(
            new AppError('Você não está logado! Por favor, faça login para ter acesso.', 401)
        );
    }

    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
        return next(
            new AppError('O usuário pertencente a este token não existe mais.', 401)
        );
    }

    req.user = currentUser;
    next();
});

const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError('Você não tem permissão para realizar esta ação.', 403)
            );
        }
        next();
    };
};

module.exports = { protect, restrictTo };