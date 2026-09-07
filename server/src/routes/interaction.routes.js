// src/routes/interaction.routes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const matchmaking = require('../services/matchmaking.service');
const userModel = require('../models/user.model');
const profileService = require('../services/profile.service');
const { requireAuth } = require('../middleware/auth');
const { bodyIds } = require('../middleware/validate');
const { requireFields } = require('../utils/validators');
const router = express.Router();

router.use(requireAuth, bodyIds);

const parseTo = (req) => {
  requireFields(req.body, ['toUserId']);
  return req.body.toUserId;
};

router.post('/likes', asyncHandler(async (req, res) => {
  const to = parseTo(req);
  const result = matchmaking.performLike(req.user.id, to, 'LIKE');
  res.status(result.matched ? 201 : 200).json({
    success: true,
    data: { matched: result.matched, matchId: result.match ? result.match.id : null }
  });
}));

router.post('/super-likes', asyncHandler(async (req, res) => {
  const to = parseTo(req);
  const result = matchmaking.performLike(req.user.id, to, 'SUPER_LIKE');
  res.status(result.matched ? 201 : 200).json({
    success: true,
    data: { matched: result.matched, matchId: result.match ? result.match.id : null, superLike: true }
  });
}));

router.post('/passes', asyncHandler(async (req, res) => {
  const to = parseTo(req);
  matchmaking.performPass(req.user.id, to);
  res.json({ success: true, data: { message: 'Profile passed.' } });
}));

// Undo actions (nice UX)
router.delete('/likes', asyncHandler(async (req, res) => {
  const to = parseTo(req);
  const interactionModel = require('../models/interaction.model');
  interactionModel.removeLike(req.user.id, to);
  res.json({ success: true, data: { message: 'Like removed.' } });
}));

router.delete('/super-likes', asyncHandler(async (req, res) => {
  const to = parseTo(req);
  const interactionModel = require('../models/interaction.model');
  interactionModel.removeSuperLike(req.user.id, to);
  res.json({ success: true, data: { message: 'Super like removed.' } });
}));

// Who liked me (helps the match UI)
router.get('/likers', asyncHandler(async (req, res) => {
  const db = require('../db/database');
  const rows = db.prepare(`
    SELECT l.from_user AS id, l.created_at, u.name, u.gender, u.location,
      (SELECT url FROM photos WHERE user_id = u.id AND is_primary = 1 LIMIT 1) AS photo
    FROM likes l JOIN users u ON u.id = l.from_user
    WHERE l.to_user = ? AND u.status = 'ACTIVE'
    ORDER BY l.id DESC LIMIT 50
  `).all(req.user.id);
  res.json({ success: true, data: { likers: rows } });
}));

module.exports = router;