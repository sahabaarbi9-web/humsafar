// src/routes/notification.routes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const notificationModel = require('../models/notification.model');
const { requireAuth } = require('../middleware/auth');
const { positiveIntParam } = require('../middleware/validate');
const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 100);
  const out = notificationModel.listForUser(req.user.id, limit).map((n) => ({
    id: n.id, type: n.type, title: n.title, body: n.body,
    read: !!n.read, data: n.data ? JSON.parse(n.data) : null, createdAt: n.created_at
  }));
  const unread = notificationModel.unreadCount(req.user.id);
  res.json({ success: true, data: { notifications: out, unreadCount: unread } });
}));

router.get('/unread-count', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { unreadCount: notificationModel.unreadCount(req.user.id) } });
}));

router.put('/:id/read', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const n = notificationModel.find(req.params.id);
  if (!n || n.user_id !== req.user.id) throwToken(404);
  notificationModel.markRead(req.params.id, req.user.id);
  res.json({ success: true, data: { ok: true } });
}));

router.put('/read-all', asyncHandler(async (req, res) => {
  notificationModel.markAllRead(req.user.id);
  res.json({ success: true, data: { ok: true } });
}));

function throwToken(code) {
  const AppError = require('../utils/AppError');
  throw new AppError('Notification not found.', code, 'NOT_FOUND');
}

module.exports = router;