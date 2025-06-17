// models/Order.js
const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const User = require('./user');      // <-- MUITO IMPORTANTE: DEVE SER './user' (NO MESMO DIRETÓRIO) e minúsculo!
const Product = require('./Product'); // <-- OK, está no mesmo diretório

// ... (resto do código)