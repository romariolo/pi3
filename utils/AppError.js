// utils/AppError.js
class AppError extends Error {
    constructor(message, statusCode) {
        super(message); // Chama o construtor da classe Error
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true; // Erros operacionais são aqueles que podemos prever

        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;