// src/models/user.model.js — users + profiles
const db = require('../db/database');

function findByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(String(email).toLowerCase());
}

function findById(id) {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function findByEmailWithStatus(email) {
  return db.prepare('SELECT * FROM users WHERE email = ? AND status = ?').get(String(email).toLowerCase(), 'ACTIVE');
}

function create({ name, email, passwordHash, dob, gender, location, phone }) {
  const info = db.prepare(
    'INSERT INTO users (name, email, password_hash, dob, gender, location, phone) VALUES (?,?,?,?,?,?,?)'
  ).run(name, email.toLowerCase(), passwordHash, dob, gender, location, phone || null);
  const user = findById(info.lastInsertRowid);
  db.prepare('INSERT INTO profiles (user_id) VALUES (?)').run(user.id);
  return user;
}

function update(id, fields) {
  const allowed = ['name', 'phone', 'gender', 'location', 'dob'];
  const sets = [];
  const vals = [];
  for (const k of allowed) {
    if (fields[k] !== undefined && fields[k] !== null) {
      sets.push(`${k} = ?`);
      vals.push(fields[k]);
    }
  }
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  if (sets.length > 1) {
    db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
  }
  return findById(id);
}

function setPassword(id, passwordHash) {
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?").run(passwordHash, id);
  db.prepare("UPDATE auth_tokens SET revoked_at = datetime('now') WHERE user_id = ? AND kind = 'SESSION'").run(id);
}

function setEmailVerified(id, verified = 1) {
  db.prepare('UPDATE users SET email_verified = ? WHERE id = ?').run(verified, id);
}

function setStatus(id, status) {
  db.prepare("UPDATE users SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
}

function deleteUser(id) {
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

function touchActivity(id) {
  db.prepare("UPDATE profiles SET online = 1, last_active = datetime('now') WHERE user_id = ?").run(id);
}

function setOffline(id) {
  db.prepare("UPDATE profiles SET online = 0, last_active = datetime('now') WHERE user_id = ?").run(id);
}

module.exports = { findByEmail, findById, findByEmailWithStatus, create, update, setPassword, setEmailVerified, setStatus, deleteUser, touchActivity, setOffline };