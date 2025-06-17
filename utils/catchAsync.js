// utils/catchAsync.js
// Wrapper para funções assíncronas em controllers, para capturar erros e passá-los ao next()
const catchAsync = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = catchAsync;