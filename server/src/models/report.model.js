// src/models/report.model.js
const db = require('../db/database');

const REASONS = ['fake_profile', 'harassment', 'spam', 'inappropriate', 'scam', 'other'];

function create({ reporter, reported, reason, details }) {
  const info = db.prepare(
    'INSERT INTO reports (reporter, reported, reason, details) VALUES (?,?,?,?)'
  ).run(reporter, reported, reason, details || '');
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM reports WHERE id = ?').get(id);
}

function listAdmin(status, limit = 50) {
  return db.prepare(`
    SELECT r.*, ru.name AS reporter_name, rd.name AS reported_name, rd.status AS reported_status
    FROM reports r
    JOIN users ru ON ru.id = r.reporter
    JOIN users rd ON rd.id = r.reported
    WHERE (? IS NULL OR r.status = ?)
    ORDER BY CASE WHEN r.status = 'OPEN' THEN 0 ELSE 1 END, r.id DESC
    LIMIT ?
  `).all(status || null, status || null, limit);
}

function countOpen() {
  return db.prepare("SELECT COUNT(*) AS n FROM reports WHERE status = 'OPEN'").get().n;
}

function setStatus(id, status, actionTaken, resolvedBy) {
  if (status === 'RESOLVED' || status === 'IGNORED') {
    db.prepare("UPDATE reports SET status = ?, action_taken = ?, resolved_by = ?, resolved_at = datetime('now') WHERE id = ?")
      .run(status, actionTaken || '', resolvedBy || null, id);
  } else {
    db.prepare("UPDATE reports SET status = ?, resolved_by = ?, resolved_at = NULL WHERE id = ?").run(status, resolvedBy || null, id);
  }
  return find(id);
}

module.exports = { REASONS, create, find, listAdmin, countOpen, setStatus };