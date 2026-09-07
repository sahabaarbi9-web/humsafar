// src/models/interaction.model.js — likes, passes, super_likes
const db = require('../db/database');
const { transaction } = require('../db/transaction');
const notificationModel = require('./notification.model');

function alreadyLiked(from, to) {
  return db.prepare('SELECT id FROM likes WHERE from_user = ? AND to_user = ?').get(from, to);
}
function alreadySuperLiked(from, to) {
  return db.prepare('SELECT id FROM super_likes WHERE from_user = ? AND to_user = ?').get(from, to);
}
function alreadyPassed(from, to) {
  return db.prepare('SELECT id FROM passes WHERE from_user = ? AND to_user = ?').get(from, to);
}
function hasLikedMe(from, to) { // has `from` liked `to`?
  return db.prepare('SELECT id FROM likes WHERE from_user = ? AND to_user = ?').get(from, to);
}

const addLike = transaction((from, to) => {
  db.prepare('DELETE FROM passes WHERE from_user = ? AND to_user = ?').run(from, to);
  db.prepare('INSERT OR IGNORE INTO likes (from_user, to_user) VALUES (?,?)').run(from, to);
});

const addSuperLike = transaction((from, to) => {
  db.prepare('DELETE FROM passes WHERE from_user = ? AND to_user = ?').run(from, to);
  db.prepare('INSERT OR IGNORE INTO super_likes (from_user, to_user) VALUES (?,?)').run(from, to);
});

const addPass = transaction((from, to) => {
  db.prepare('DELETE FROM likes WHERE from_user = ? AND to_user = ?').run(from, to);
  db.prepare('DELETE FROM super_likes WHERE from_user = ? AND to_user = ?').run(from, to);
  db.prepare('INSERT OR IGNORE INTO passes (from_user, to_user) VALUES (?,?)').run(from, to);
});

function removeLike(from, to) {
  db.prepare('DELETE FROM likes WHERE from_user = ? AND to_user = ?').run(from, to);
}
function removeSuperLike(from, to) {
  db.prepare('DELETE FROM super_likes WHERE from_user = ? AND to_user = ?').run(from, to);
}

function likeStats(to) {
  return db.prepare('SELECT COUNT(*) AS n FROM likes WHERE to_user = ?').get(to).n;
}

module.exports = { alreadyLiked, alreadySuperLiked, alreadyPassed, hasLikedMe, addLike, addSuperLike, addPass, removeLike, removeSuperLike, likeStats, notificationModel };