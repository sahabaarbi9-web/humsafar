// src/models/match.model.js — matches + conversations
const db = require('../db/database');
const { transaction } = require('../db/transaction');

// userA/userB normalized so user_a < user_b
function pairKey(a, b) { return a < b ? [a, b] : [b, a]; }

function between(a, b) {
  let [x, y] = pairKey(a, b);
  return db.prepare('SELECT * FROM matches WHERE user_a = ? AND user_b = ?').get(x, y);
}

const create = transaction((a, b) => {
  const [x, y] = pairKey(a, b);
  const info = db.prepare('INSERT OR IGNORE INTO matches (user_a, user_b) VALUES (?,?)').run(x, y);
  const match = between(x, y);
  db.prepare('INSERT OR IGNORE INTO conversations (match_id) VALUES (?)').run(match.id);
  return match;
});

function listForUser(userId) {
  const rows = db.prepare(`
    SELECT m.*,
      CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END AS other_id,
      u.name AS other_name, u.location AS other_location,
      prof.online AS other_online, prof.last_active AS other_last_active,
      (SELECT url FROM photos WHERE user_id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END AND is_primary = 1 LIMIT 1) AS other_photo,
      (SELECT url FROM photos WHERE user_id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END AND is_primary = 0 LIMIT 1) AS other_photo_2,
      c.id AS conversation_id,
      c.last_message_at,
      (SELECT body FROM messages WHERE conversation_id = c.id AND is_deleted = 0 ORDER BY id DESC LIMIT 1) AS last_message,
      (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id AND sender_id != ? AND read_at IS NULL AND is_deleted = 0) AS unread
    FROM matches m
    JOIN users u ON u.id = CASE WHEN m.user_a = ? THEN m.user_b ELSE m.user_a END
    JOIN profiles prof ON prof.user_id = u.id
    LEFT JOIN conversations c ON c.match_id = m.id
    WHERE m.user_a = ? OR m.user_b = ?
    ORDER BY c.last_message_at DESC
  `).all(userId, userId, userId, userId, userId, userId, userId);
  return rows.map((r) => ({ ...r, other_photo: r.other_photo || r.other_photo_2, other_photo_2: undefined }));
}

function getWithConversation(matchId) {
  return db.prepare(`
    SELECT m.*, c.id AS conversation_id FROM matches m
    LEFT JOIN conversations c ON c.match_id = m.id
    WHERE m.id = ?
  `).get(matchId);
}

module.exports = { pairKey, between, create, listForUser, getWithConversation };