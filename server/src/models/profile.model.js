// src/models/profile.model.js — profile fields + preferences
const db = require('../db/database');

function findByUserId(userId) {
  return db.prepare('SELECT * FROM profiles WHERE user_id = ?').get(userId);
}

function update(userId, fields) {
  const allowed = ['bio', 'relationship_pref', 'looking_gender', 'distance_pref', 'age_min', 'age_max', 'height', 'occupation', 'education'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined && fields[k] !== null) {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
  }
  if (!sets.length) return findByUserId(userId);
  sets.push("updated_at = datetime('now')");
  vals.push(userId);
  db.prepare(`UPDATE profiles SET ${sets.join(', ')} WHERE user_id = ?`).run(...vals);
  return findByUserId(userId);
}

function publicProfileRow(userId) {
  return db.prepare(`
    SELECT p.*, u.name, u.gender, u.location, u.dob, u.created_at, u.email_verified
    FROM profiles p JOIN users u ON u.id = p.user_id
    WHERE p.user_id = ?
  `).get(userId);
}

module.exports = { findByUserId, update, publicProfileRow };