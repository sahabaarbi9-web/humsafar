// src/models/admin.model.js
const db = require('../db/database');

function addAdmin(userId, createdBy) {
  db.prepare('INSERT OR IGNORE INTO admin_users (user_id, created_by) VALUES (?,?)').run(userId, createdBy || null);
  db.prepare("UPDATE users SET role = 'ADMIN' WHERE id = ?").run(userId);
}

function isAdminUser(userId) {
  return !!db.prepare('SELECT id FROM admin_users WHERE user_id = ?').get(userId);
}

function touchLogin(userId) {
  db.prepare("UPDATE admin_users SET last_login_at = datetime('now') WHERE user_id = ?").run(userId);
}

module.exports = { addAdmin, isAdminUser, touchLogin };