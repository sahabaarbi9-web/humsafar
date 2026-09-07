// src/utils/token.js — one-time token helpers (email verify, password reset, refresh)
const crypto = require('crypto');

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function hashToken(plain) {
  return crypto.createHash('sha256').update(plain).digest('hex');
}

module.exports = { randomToken, hashToken };