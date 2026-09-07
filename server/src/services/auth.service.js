// src/services/auth.service.js — JWT creation/verification + session tokens
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const config = require('../config/config');
const tokenModel = require('../models/token.model');
const { hashToken } = require('../utils/token');
const AppError = require('../utils/AppError');

function signToken(userId, remember) {
  const expiresIn = remember ? config.rememberExpiry : config.tokenExpiry;
  const expiresAtMs = Date.now() + (remember
    ? msFromString(config.rememberExpiry)
    : msFromString(config.tokenExpiry));
  const token = jwt.sign({ uid: userId, remember: !!remember }, config.authSecret, { expiresIn });
  return { token, expiresAtMs };
}

function msFromString(str) {
  const match = String(str).match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 3600 * 1000;
  const n = Number(match[1]);
  return n * ({ s: 1000, m: 60000, h: 3600000, d: 86400000 }[match[2]]);
}

function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, config.authSecret);
    return decoded;
  } catch {
    return null;
  }
}

// Persist a session token hash so logout can revoke it server-side.
function persistSession(userId, token) {
  const expiresAt = new Date(Date.now() + msFromString(config.rememberExpiry)).toISOString().replace('T', ' ').slice(0, 19);
  tokenModel.createToken({ userId, tokenHash: hashToken(token), kind: 'SESSION', expiresAt });
}

function revokeSession(token) {
  const hashed = hashToken(token);
  const row = db.prepare("SELECT * FROM auth_tokens WHERE token_hash = ? AND kind = 'SESSION' AND revoked_at IS NULL").get(hashed);
  if (row) tokenModel.revoke(row.id);
}

module.exports = { signToken, verifyToken, persistSession, revokeSession, msFromString };