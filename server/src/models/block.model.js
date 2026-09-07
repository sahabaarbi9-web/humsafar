// src/models/block.model.js
const db = require('../db/database');

function add(blocker, blocked) {
  db.prepare('INSERT OR IGNORE INTO blocks (blocker, blocked) VALUES (?,?)').run(blocker, blocked);
}

function remove(blocker, blocked) {
  db.prepare('DELETE FROM blocks WHERE blocker = ? AND blocked = ?').run(blocker, blocked);
}

function removeById(id, blocker) {
  const info = db.prepare('DELETE FROM blocks WHERE id = ? AND blocker = ?').run(id, blocker);
  return info.changes > 0;
}

function exists(blocker, blocked) {
  return !!db.prepare('SELECT id FROM blocks WHERE blocker = ? AND blocked = ?').get(blocker, blocked);
}

// Either direction blocked?
function blockedEither(a, b) {
  return !!db.prepare(`
    SELECT id FROM blocks WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)
  `).get(a, b, b, a);
}

function listForUser(blocker) {
  return db.prepare(`
    SELECT b.id, b.blocked AS user_id, b.created_at, u.name, u.location
    FROM blocks b JOIN users u ON u.id = b.blocked
    WHERE b.blocker = ? ORDER BY b.created_at DESC
  `).all(blocker);
}

function blockedUserIds(blocker) {
  return db.prepare('SELECT blocked AS id FROM blocks WHERE blocker = ?').all(blocker).map((r) => r.id);
}

module.exports = { add, remove, removeById, exists, blockedEither, listForUser, blockedUserIds };