// src/models/notification.model.js
const db = require('../db/database');

function add({ userId, type, title, body, data }) {
  const info = db.prepare(
    'INSERT INTO notifications (user_id, type, title, body, data) VALUES (?,?,?,?,?)'
  ).run(userId, type, title, body || '', JSON.stringify(data || {}));
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);
}

function listForUser(userId, limit = 50) {
  return db.prepare(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?'
  ).all(userId, limit);
}

function unreadCount(userId) {
  return db.prepare('SELECT COUNT(*) AS n FROM notifications WHERE user_id = ? AND is_read = 0').get(userId).n;
}

function markRead(id, userId) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(id, userId);
}

function markAllRead(userId) {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0').run(userId);
}

module.exports = { add, find, listForUser, unreadCount, markRead, markAllRead };