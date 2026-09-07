// src/routes/conversation.routes.js
const express = require('express');
const db = require('../db/database');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const matchModel = require('../models/match.model');
const messageModel = require('../models/message.model');
const blockModel = require('../models/block.model');
const notificationModel = require('../models/notification.model');
const { requireAuth } = require('../middleware/auth');
const { positiveIntParam } = require('../middleware/validate');
const { requireFields, strLen } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth);

// in-memory typing indicators { conversationId: { userId: lastTypingAt } }
const typing = new Map();
setInterval(() => {
  const now = Date.now();
  for (const [k, map] of typing) {
    for (const [uid, t] of map) if (now - t > 5000) map.delete(uid);
    if (!map.size) typing.delete(k);
  }
}, 3000).unref();

function getConversationForUser(convId, userId) {
  const conv = db.prepare(`
    SELECT c.id, c.match_id, m.user_a, m.user_b
    FROM conversations c JOIN matches m ON m.id = c.match_id
    WHERE c.id = ?
  `).get(convId);
  if (!conv || (conv.user_a !== userId && conv.user_b !== userId)) return null;
  return conv;
}

function ensureNotBlocked(conv, userId) {
  const other = conv.user_a === userId ? conv.user_b : conv.user_a;
  if (blockModel.blockedEither(userId, other)) {
    throw new AppError('Cannot message this user.', 403, 'BLOCKED');
  }
}

router.get('/', asyncHandler(async (req, res) => {
  const matches = matchModel.listForUser(req.user.id).map((m) => ({
    conversationId: m.conversation_id,
    matchId: m.id,
    user: {
      id: m.other_id, name: m.other_name, online: !!m.other_online,
      last_active: m.other_last_active, photo: m.other_photo || null
    },
    last_message: m.last_message || '',
    last_message_at: m.last_message_at || '',
    unread: m.unread || 0
  }));
  res.json({ success: true, data: { conversations: matches } });
}));

router.get('/:id/messages', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const conv = getConversationForUser(req.params.id, req.user.id);
  if (!conv) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
  const other = conv.user_a === req.user.id ? conv.user_b : conv.user_a;
  const { lastId } = req.query;
  const limit = Math.min(Number(req.query.limit) || 100, 200);
  const messages = messageModel.listByConversation(req.params.id, limit, lastId ? Number(lastId) : null);

  // mark received messages as read
  messageModel.markReadByConversation(conv.id, req.user.id);

  const isTyping = Array.from(typing.get(conv.id)?.keys() || []).filter((uid) => uid !== req.user.id).length > 0;

  res.json({
    success: true,
    data: {
      messages: messages.map((m) => ({ id: m.id, senderId: m.sender_id, body: m.body, createdAt: m.created_at, readAt: m.read_at })),
      peerTyping: isTyping,
      blocked: blockModel.blockedEither(req.user.id, other),
      otherId: other
    }
  });
}));

router.post('/:id/messages', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const conv = getConversationForUser(req.params.id, req.user.id);
  if (!conv) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
  ensureNotBlocked(conv, req.user.id);

  requireFields(req.body, ['body']);
  strLen(req.body.body, 1, 2000, 'Message');
  const other = conv.user_a === req.user.id ? conv.user_b : conv.user_a;

  const msg = messageModel.add(conv.id, req.user.id, req.body.body);

  notificationModel.add({
    userId: other, type: 'MESSAGE', title: 'New message 💬',
    body: String(req.body.body).slice(0, 120), data: { conversationId: conv.id, sender: req.user.id }
  });

  res.status(201).json({ success: true, data: { message: { id: msg.id, senderId: msg.sender_id, body: msg.body, createdAt: msg.created_at } } });
}));

// Typing indicator
router.post('/:id/typing', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const conv = getConversationForUser(req.params.id, req.user.id);
  if (!conv) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
  if (!typing.has(conv.id)) typing.set(conv.id, new Map());
  typing.get(conv.id).set(req.user.id, Date.now());
  res.json({ success: true, data: { ok: true } });
}));

// Mark all read
router.post('/:id/read', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const conv = getConversationForUser(req.params.id, req.user.id);
  if (!conv) throw new AppError('Conversation not found.', 404, 'NOT_FOUND');
  messageModel.markReadByConversation(conv.id, req.user.id);
  res.json({ success: true, data: { ok: true } });
}));

// Delete a message (soft) — only sender
router.delete('/messages/:messageId', positiveIntParam('messageId'), asyncHandler(async (req, res) => {
  const msg = messageModel.softDelete(req.params.messageId, req.user.id);
  if (!msg) throw new AppError('Message not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { deleted: true } });
}));

module.exports = router;