// src/models/interest.model.js — interests + user_interests
const db = require('../db/database');

const DEFAULT_INTERESTS = [
  'Coffee', 'Travel', 'Photography', 'Music', 'Art', 'Food', 'Books', 'Movies',
  'Fitness', 'Tech', 'Cooking', 'Dancing', 'Singing', 'Hiking', 'Fashion', 'Gaming',
  'Sports', 'Yoga', 'Reading', 'Animals'
];

function ensureDefaults() {
  const stmt = db.prepare('INSERT OR IGNORE INTO interests (name) VALUES (?)');
  DEFAULT_INTERESTS.forEach((n) => stmt.run(n));
}

function listAll() {
  return db.prepare('SELECT id, name FROM interests ORDER BY name').all();
}

function findByName(name) {
  return db.prepare('SELECT * FROM interests WHERE name = ?').get(name);
}

function findById(id) {
  return db.prepare('SELECT * FROM interests WHERE id = ?').get(id);
}

function listForUser(userId) {
  return db.prepare(`
    SELECT i.id, i.name FROM interests i
    JOIN user_interests ui ON ui.interest_id = i.id
    WHERE ui.user_id = ? ORDER BY i.name
  `).all(userId);
}

// Replaces a user's interests with the given list of names (idempotent, no dupes)
function setForUser(userId, names) {
  db.prepare('DELETE FROM user_interests WHERE user_id = ?').run(userId);
  const ins = db.prepare('INSERT OR IGNORE INTO interests (name) VALUES (?)');
  const link = db.prepare('INSERT OR IGNORE INTO user_interests (user_id, interest_id) VALUES (?,?)');
  const clean = [...new Set((names || []).map((n) => String(n).trim()).filter(Boolean))];
  for (const n of clean) {
    ins.run(n);
    const found = findByName(n);
    if (found) link.run(userId, found.id);
  }
  return listForUser(userId);
}

module.exports = { ensureDefaults, listAll, findByName, findById, listForUser, setForUser, DEFAULT_INTERESTS };