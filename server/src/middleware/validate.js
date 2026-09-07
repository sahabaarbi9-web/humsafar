// src/middleware/validate.js — body/params coercion helpers
const AppError = require('../utils/AppError');

function bodyIds(req, res, next) {
  const ids = ['toUserId', 'receiverId', 'userId', 'reported', 'blocked'];
  for (const id of ids) {
    if (req.body && req.body[id] !== undefined) {
      const n = Number(req.body[id]);
      if (!Number.isInteger(n) || n <= 0) return next(new AppError(`Invalid ${id}.`, 422, 'VALIDATION_ERROR'));
      req.body[id] = n;
    }
  }
  next();
}

function positiveIntParam(name) {
  return (req, res, next) => {
    const n = Number(req.params[name]);
    if (!Number.isInteger(n) || n <= 0) return next(new AppError(`Invalid ${name}.`, 404, 'NOT_FOUND'));
    req.params[name] = n;
    next();
  };
}

module.exports = { bodyIds, positiveIntParam };