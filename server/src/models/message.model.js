// src/models/message.model.js — messages, read state, typing, block-aware
const db = require('../db/database');

function listByConversation(convId, limit = 100, beforeId) {
  if (beforeId) {
    return db.prepare(`
      SELECT id, sender_id, body, is_deleted, created_at, read_at
      FROM messages WHERE conversation_id = ? AND id < ? AND is_deleted = 0
      ORDER BY id DESC LIMIT ?
    `).all(convId, beforeId, limit).reverse();
  }
  return db.prepare(`
    SELECT id, sender_id, body, is_deleted, created_at, read_at
    FROM messages WHERE conversation_id = ? AND is_deleted = 0
    ORDER BY id ASC LIMIT ?
  `).all(convId, limit);
}

function add(convId, senderId, body) {
  const info = db.prepare('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?,?,?)').run(convId, senderId, body);
  db.prepare("UPDATE conversations SET last_message_at = datetime('now') WHERE id = ?").run(convId);
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM messages WHERE id = ?').get(id);
}

function softDelete(id, userId) {
  const m = find(id);
  if (!m || m.sender_id !== userId) return null;
  db.prepare("UPDATE messages SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?").run(id);
  return find(id);
}

function markReadByConversation(convId, userId) {
  db.prepare(`
    UPDATE messages SET read_at = COALESCE(read_at, datetime('now'))
    WHERE conversation_id = ? AND sender_id != ? AND read_at IS NULL
  `).run(convId, userId);
}

function unreadCountForUser(userId) {
  const row = db.prepare(`
    SELECT COUNT(*) AS n FROM messages msg
    JOIN conversations c ON c.id = msg.conversation_id
    JOIN matches m ON m.id = c.match_id
    WHERE msg.sender_id != ? AND msg.read_at IS NULL AND msg.is_deleted = 0
      AND (m.user_a = ? OR m.user_b = ?)
  `).get(userId, userId, userId);
  return row.n;
}

module.exports = { listByConversation, add, find, softDelete, markReadByConversation, unreadCountForUser };