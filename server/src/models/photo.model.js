// src/models/photo.model.js
const db = require('../db/database');

function listByUser(userId) {
  return db.prepare('SELECT id, url, is_primary, created_at FROM photos WHERE user_id = ? ORDER BY is_primary DESC, id ASC').all(userId);
}

function countByUser(userId) {
  return db.prepare('SELECT COUNT(*) AS n FROM photos WHERE user_id = ?').get(userId).n;
}

function add(userId, url, isPrimary = false) {
  const n = countByUser(userId);
  const info = db.prepare('INSERT INTO photos (user_id, url, is_primary) VALUES (?,?,?)').run(userId, url, isPrimary ? 1 : 0);
  if (isPrimary) setPrimary(userId, info.lastInsertRowid);
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM photos WHERE id = ?').get(id);
}

function remove(id) {
  db.prepare('DELETE FROM photos WHERE id = ?').run(id);
}

function setPrimary(userId, photoId) {
  db.prepare('UPDATE photos SET is_primary = 0 WHERE user_id = ?').run(userId);
  db.prepare('UPDATE photos SET is_primary = 1 WHERE id = ? AND user_id = ?').run(photoId, userId);
}

function primaryUrl(userId) {
  return db.prepare('SELECT url FROM photos WHERE user_id = ? AND is_primary = 1 LIMIT 1').get(userId);
}

function anyUrl(userId) {
  const row = db.prepare('SELECT url FROM photos WHERE user_id = ? ORDER BY id ASC LIMIT 1').get(userId);
  return row ? row.url : null;
}

module.exports = { listByUser, countByUser, add, find, remove, setPrimary, primaryUrl, anyUrl };