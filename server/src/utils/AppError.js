// src/utils/AppError.js — operational error with status + code
class AppError extends Error {
  constructor(message, status = 400, code = 'ERROR') {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
module.exports = AppError;