// src/routes/match.routes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const matchModel = require('../models/match.model');
const profileService = require('../services/profile.service');
const { requireAuth } = require('../middleware/auth');
const { positiveIntParam } = require('../middleware/validate');
const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const matches = matchModel.listForUser(req.user.id).map((m) => ({
    matchId: m.id,
    conversationId: m.conversation_id,
    user: {
      id: m.other_id,
      name: m.other_name,
      location: m.other_location,
      online: !!m.other_online,
      last_active: m.other_last_active,
      photo: m.other_photo || null
    },
    last_message: m.last_message,
    last_message_at: m.last_message_at,
    unread: m.unread
  }));
  res.json({ success: true, data: { matches } });
}));

router.get('/:id', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const m = matchModel.getWithConversation(req.params.id);
  if (!m || (m.user_a !== req.user.id && m.user_b !== req.user.id)) {
    throw new AppError('Match not found.', 404, 'NOT_FOUND');
  }
  const otherId = m.user_a === req.user.id ? m.user_b : m.user_a;
  const other = profileService.buildPublic(otherId);
  res.json({ success: true, data: { match: { matchId: m.id, conversationId: m.conversation_id, other } } });
}));

module.exports = router;