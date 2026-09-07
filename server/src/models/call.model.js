// src/models/call.model.js — calls + signaling packets
const db = require('../db/database');
const notificationModel = require('./notification.model');

function create({ callerId, calleeId, type }) {
  const info = db.prepare('INSERT INTO calls (caller_id, callee_id, type) VALUES (?,?,?)').run(callerId, calleeId, type);
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM calls WHERE id = ?').get(id);
}

function tailForUser(userId, limit = 30) {
  return db.prepare(`
    SELECT c.*, u.name AS peer_name, u.location AS peer_location,
      (SELECT url FROM photos WHERE user_id = (CASE WHEN c.caller_id = ? THEN c.callee_id ELSE c.caller_id END) AND is_primary = 1 LIMIT 1) AS peer_photo
    FROM calls c
    JOIN users u ON u.id = CASE WHEN c.caller_id = ? THEN c.callee_id ELSE c.caller_id END
    WHERE c.caller_id = ? OR c.callee_id = ?
    ORDER BY c.id DESC LIMIT ?
  `).all(userId, userId, userId, userId, limit);
}

function incomingForUser(userId) {
  return db.prepare(`
    SELECT c.*, u.name AS caller_name,
      (SELECT url FROM photos WHERE user_id = c.caller_id AND is_primary = 1 LIMIT 1) AS caller_photo
    FROM calls c JOIN users u ON u.id = c.caller_id
    WHERE c.callee_id = ? AND c.status IN ('REQUESTED','ACCEPTED')
    ORDER BY c.id DESC LIMIT 10
  `).all(userId);
}

function setStatus(id, status) {
  db.prepare('UPDATE calls SET status = ? WHERE id = ?').run(status, id);
}

function setStarted(id) {
  db.prepare("UPDATE calls SET started_at = datetime('now'), status = 'ACCEPTED' WHERE id = ?").run(id);
}

function setEnded(id) {
  db.prepare("UPDATE calls SET ended_at = datetime('now'), status = 'ENDED' WHERE id = ? AND status NOT IN ('MISSED','REJECTED','CANCELLED')").run(id);
}

// --- signaling ---
function pushSignal(callId, senderId, packet) {
  db.prepare('INSERT INTO call_signals (call_id, sender_id, packet) VALUES (?,?,?)').run(callId, senderId, JSON.stringify(packet));
}

function signalsAfter(callId, afterId) {
  const rows = db.prepare('SELECT id, sender_id, packet FROM call_signals WHERE call_id = ? AND id > ? ORDER BY id ASC').all(callId, afterId);
  return rows.map((r) => ({ ...r, packet: safeParse(r.packet) }));
}

function lastSignalId(callId) {
  const r = db.prepare('SELECT MAX(id) AS m FROM call_signals WHERE call_id = ?').get(callId);
  return r.m || 0;
}

function candidatePeers(callId) {
  return db.prepare('SELECT DISTINCT caller_id, callee_id FROM calls WHERE id = ?').get(callId);
}

function safeParse(s) { try { return JSON.parse(s); } catch { return {}; } }

module.exports = { create, find, tailForUser, incomingForUser, setStatus, setStarted, setEnded, pushSignal, signalsAfter, lastSignalId, candidatePeers, safeParse };