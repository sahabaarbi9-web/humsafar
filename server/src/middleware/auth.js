// src/middleware/auth.js — JWT auth for user + admin
const config = require('../config/config');
const authService = require('../services/auth.service');
const userModel = require('../models/user.model');
const adminModel = require('../models/admin.model');
const AppError = require('../utils/AppError');

function attachUser(req, res, next, { required }) {
  let token = null;
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) token = header.slice(7);
  if (!token && req.cookies) token = req.cookies[config.cookieName] || null;
  if (!token && req.body && req.body.__token) token = req.body.__token;

  const decoded = token ? authService.verifyToken(token) : null;
  if (decoded && decoded.uid) {
    const user = userModel.findById(decoded.uid);
    if (user) {
      req.user = user;
      req.rawToken = token;
      userModel.touchActivity(user.id);
    }
  }

  if (required && !req.user) {
    return next(new AppError('Authentication required. Please log in.', 401, 'UNAUTHORIZED'));
  }
  if (required && req.user.status !== 'ACTIVE') {
    return next(new AppError('Your account is suspended or banned.', 403, 'FORBIDDEN'));
  }
  next();
}

function requireAuth(req, res, next) { attachUser(req, res, next, { required: true }); }
function optionalAuth(req, res, next) { attachUser(req, res, next, { required: false }); }

function requireAdmin(req, res, next) {
  if (!req.user) return next(new AppError('Authentication required.', 401, 'UNAUTHORIZED'));
  const isAdmin = req.user.role === 'ADMIN' && adminModel.isAdminUser(req.user.id);
  if (!isAdmin) return next(new AppError('Admin access required.', 403, 'FORBIDDEN'));
  adminModel.touchLogin(req.user.id);
  next();
}

module.exports = { requireAuth, optionalAuth, requireAdmin };