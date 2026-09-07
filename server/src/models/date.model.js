// src/models/date.model.js
const db = require('../db/database');

function create({ senderId, receiverId, title, description, location, scheduledAt }) {
  const info = db.prepare(
    'INSERT INTO dates (sender_id, receiver_id, title, description, location, scheduled_at) VALUES (?,?,?,?,?,?)'
  ).run(senderId, receiverId, title, description || '', location || '', scheduledAt);
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM dates WHERE id = ?').get(id);
}

function listForUser(userId, scope = 'upcoming') {
  const all = db.prepare(`
    SELECT d.*,
      CASE WHEN d.sender_id = ? THEN d.receiver_id ELSE d.sender_id END AS other_id,
      u.name AS other_name,
      (SELECT url FROM photos WHERE user_id = (CASE WHEN d.sender_id = ? THEN d.receiver_id ELSE d.sender_id END) AND is_primary = 1 LIMIT 1) AS other_photo
    FROM dates d
    JOIN users u ON u.id = CASE WHEN d.sender_id = ? THEN d.receiver_id ELSE d.sender_id END
    WHERE (d.sender_id = ? OR d.receiver_id = ?)
    ORDER BY d.scheduled_at DESC
  `).all(userId, userId, userId, userId, userId);
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
  return all.filter((r) => {
    const upcoming = (r.status === 'PENDING' || r.status === 'ACCEPTED') && r.scheduled_at >= now;
    return scope === 'upcoming' ? upcoming : !upcoming;
  });
}

function updateStatus(id, status) {
  db.prepare("UPDATE dates SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

function updateFields(id, fields) {
  const sets = [];
  const vals = [];
  for (const k of ['title', 'description', 'location', 'scheduled_at']) {
    if (fields[k] !== undefined) { sets.push(`${k} = ?`); vals.push(fields[k]); }
  }
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  db.prepare(`UPDATE dates SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  return find(id);
}

module.exports = { create, find, updateStatus, updateFields, listForUser };