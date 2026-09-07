// src/models/game.model.js — games + moves
const db = require('../db/database');

function create({ playerA, playerB, type, initialState }) {
  const info = db.prepare(
    'INSERT INTO games (player_a, player_b, type, state) VALUES (?,?,?,?)'
  ).run(playerA, playerB, type, JSON.stringify(initialState || {}));
  return find(info.lastInsertRowid);
}

function find(id) {
  return db.prepare('SELECT * FROM games WHERE id = ?').get(id);
}

function activeBetween(a, b) {
  return db.prepare(`
    SELECT * FROM games WHERE status = 'ONGOING'
      AND ((player_a = ? AND player_b = ?) OR (player_a = ? AND player_b = ?))
    ORDER BY id DESC LIMIT 1
  `).get(a, b, b, a);
}

function listForUser(userId, type) {
  return db.prepare(`
    SELECT g.id, g.type, g.status, g.winner_id, g.created_at, g.finished_at,
      g.player_a, g.player_b,
      u.name AS other_name,
      (SELECT url FROM photos WHERE user_id = other_id AND is_primary = 1 LIMIT 1) AS other_photo
    FROM games g
    JOIN users u ON u.id = CASE WHEN g.player_a = ? THEN g.player_b ELSE g.player_a END
    LEFT JOIN (
      SELECT id AS uid, CASE WHEN player_a = ? THEN player_b ELSE player_a END AS other_id FROM games
    ) filt ON filt.uid = g.id
    WHERE (g.player_a = ? OR g.player_b = ?)
      AND (? IS NULL OR g.type = ?)
    ORDER BY g.id DESC LIMIT 50
  `).all(userId, userId, userId, userId, type || null, type || null);
}

function updateState(id, state) {
  db.prepare('UPDATE games SET state = ? WHERE id = ?').run(JSON.stringify(state), id);
}

function finish(id, winnerId) {
  db.prepare("UPDATE games SET status = 'FINISHED', winner_id = ?, finished_at = datetime('now') WHERE id = ?").run(winnerId, id);
}

function markAbandoned(id) {
  db.prepare("UPDATE games SET status = 'ABANDONED', finished_at = datetime('now') WHERE id = ? AND status = 'ONGOING'").run(id);
}

function addMove(gameId, playerId, move) {
  db.prepare('INSERT INTO game_moves (game_id, player_id, move) VALUES (?,?,?)').run(gameId, playerId, JSON.stringify(move));
  const r = db.prepare('SELECT id FROM game_moves WHERE game_id = ? ORDER BY id DESC LIMIT 1').get(gameId);
  return r.id;
}

function movesFor(gameId) {
  return db.prepare('SELECT id, player_id, move, created_at FROM game_moves WHERE game_id = ? ORDER BY id ASC').all(gameId)
    .map((m) => ({ ...m, move: (() => { try { return JSON.parse(m.move); } catch { return {}; } })() }));
}

module.exports = { create, find, activeBetween, listForUser, updateState, finish, markAbandoned, addMove, movesFor };