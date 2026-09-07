// src/models/token.model.js — auth tokens (sessions, email verify, password reset)
const db = require('../db/database');

function createToken({ userId, tokenHash, kind, expiresAt }) {
  const info = db.prepare(
    'INSERT INTO auth_tokens (user_id, token_hash, kind, expires_at) VALUES (?,?,?,?)'
  ).run(userId, tokenHash, kind, expiresAt);
  return find(info.lastInsertRowid);
}

function find(id) { return db.prepare('SELECT * FROM auth_tokens WHERE id = ?').get(id); }

function findValid(tokenHash, kind) {
  return db.prepare(`
    SELECT * FROM auth_tokens WHERE token_hash = ? AND kind = ?
      AND revoked_at IS NULL AND expires_at > datetime('now')
    ORDER BY id DESC LIMIT 1
  `).get(tokenHash, kind);
}

function revoke(id) { db.prepare("UPDATE auth_tokens SET revoked_at = datetime('now') WHERE id = ?").run(id); }

function revokeAllForUser(userId, kind) {
  db.prepare("UPDATE auth_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND kind = ? AND revoked_at IS NULL").run(userId, kind);
}

function touchSession(id) {
  db.prepare("UPDATE auth_tokens SET expires_at = datetime('now', '+30 days') WHERE id = ?").run(id);
}

module.exports = { createToken, find, findValid, revoke, revokeAllForUser, touchSession };