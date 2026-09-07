// src/routes/date.routes.js — virtual / real date planning
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const db = require('../db/database');
const dateModel = require('../models/date.model');
const blockModel = require('../models/block.model');
const userModel = require('../models/user.model');
const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');
const { requireAuth } = require('../middleware/auth');
const { bodyIds, positiveIntParam } = require('../middleware/validate');
const { requireFields } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth, bodyIds);

function isValidDateTime(v) {
  if (typeof v !== 'string') return false;
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return false;
  const ts = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]), Number(m[6] || 0)).getTime();
  return !isNaN(ts);
}

function assertFutureDateTime(v) {
  if (!isValidDateTime(v) || new Date(v).getTime() < Date.now() - 5 * 3600000) {
    throw new AppError('Please provide a valid future date & time (YYYY-MM-DD HH:MM).', 422, 'VALIDATION_ERROR');
  }
}

function assertParticipant(d, userId) {
  if (!d || (d.sender_id !== userId && d.receiver_id !== userId)) throw new AppError('Date not found.', 404, 'NOT_FOUND');
}

function nextNotification(d, userId, title, body) {
  const other = d.sender_id === userId ? d.receiver_id : d.sender_id;
  notificationModel.add({ userId: other, type: 'DATE', title, body, data: { dateId: d.id } });
}

router.get('/', asyncHandler(async (req, res) => {
  const scope = req.query.scope === 'past' || req.query.scope === 'history' ? 'past' : 'upcoming';
  const rows = dateModel.listForUser(req.user.id, scope).map((d) => ({
    id: d.id, title: d.title, description: d.description, location: d.location,
    scheduledAt: d.scheduled_at, status: d.status,
    isSender: d.sender_id === req.user.id,
    other: { id: d.other_id, name: d.other_name, photo: d.other_photo },
    createdAt: d.created_at
  }));
  res.json({ success: true, data: { dates: rows, scope } });
}));

router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['toUserId', 'title', 'scheduledAt']);
  const to = req.body.toUserId;
  assertFutureDateTime(req.body.scheduledAt);
  if (req.user.id === to) throw new AppError('Cannot plan a date with yourself.', 422, 'VALIDATION_ERROR');
  const target = userModel.findById(to);
  if (!target || target.status !== 'ACTIVE') throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (blockModel.blockedEither(req.user.id, to)) throw new AppError('Cannot do this.', 403, 'BLOCKED');
  if (!matchModel.between(req.user.id, to)) throw new AppError('You can only plan dates with your matches.', 403, 'FORBIDDEN');

  const d = dateModel.create({
    senderId: req.user.id, receiverId: to,
    title: String(req.body.title).slice(0, 80),
    description: String(req.body.description || '').slice(0, 500),
    location: String(req.body.location || '').slice(0, 150),
    scheduledAt: req.body.scheduledAt
  });
  const otherName = userModel.findById(to).name;
  notificationModel.add({ userId: to, type: 'DATE', title: 'Date invitation 🌹', body: `${req.user.name} invited you to: ${d.title}`, data: { dateId: d.id } });

  res.status(201).json({ success: true, data: { date: { id: d.id, title: d.title, status: d.status, scheduledAt: d.scheduled_at } } });
}));

router.put('/:id', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const d = dateModel.find(req.params.id);
  assertParticipant(d, req.user.id);
  if (d.status === 'CANCELLED') throw new AppError('This date was cancelled.', 409, 'CONFLICT');
  if (d.status === 'COMPLETED') throw new AppError('This date already happened.', 409, 'CONFLICT');
  if (req.body.scheduledAt !== undefined) assertFutureDateTime(req.body.scheduledAt);
  const updated = dateModel.updateFields(d.id, req.body);
  res.json({ success: true, data: { date: { ...updated, other: userModel.findById(updated.sender_id === req.user.id ? updated.receiver_id : updated.sender_id).name } } });
}));

router.post('/:id/accept', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const d = dateModel.find(req.params.id);
  assertParticipant(d, req.user.id);
  if (d.receiver_id !== req.user.id) throw new AppError('Only the invitee can accept.', 403, 'FORBIDDEN');
  if (d.status !== 'PENDING') throw new AppError('Date is not pending.', 409, 'CONFLICT');
  dateModel.updateStatus(d.id, 'ACCEPTED');
  nextNotification(d, req.user.id, 'Date accepted 💚', `${req.user.name} accepted your date.`);
  res.json({ success: true, data: { ok: true } });
}));

router.post('/:id/reject', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const d = dateModel.find(req.params.id);
  assertParticipant(d, req.user.id);
  if (d.receiver_id !== req.user.id) throw new AppError('Only the invitee can reject.', 403, 'FORBIDDEN');
  if (d.status !== 'PENDING') throw new AppError('Date is not pending.', 409, 'CONFLICT');
  dateModel.updateStatus(d.id, 'REJECTED');
  nextNotification(d, req.user.id, 'Date declined 🙁', `${req.user.name} declined your date.`);
  res.json({ success: true, data: { ok: true } });
}));

router.post('/:id/cancel', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const d = dateModel.find(req.params.id);
  assertParticipant(d, req.user.id);
  if (d.status !== 'PENDING' && d.status !== 'ACCEPTED') throw new AppError('Cannot cancel this date.', 409, 'CONFLICT');
  dateModel.updateStatus(d.id, 'CANCELLED');
  nextNotification(d, req.user.id, 'Date cancelled', `${req.user.name} cancelled the date.`);
  res.json({ success: true, data: { ok: true } });
}));

router.post('/:id/complete', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const d = dateModel.find(req.params.id);
  assertParticipant(d, req.user.id);
  if (d.status !== 'ACCEPTED') throw new AppError('Only accepted dates can be marked complete.', 409, 'CONFLICT');
  dateModel.updateStatus(d.id, 'COMPLETED');
  res.json({ success: true, data: { ok: true } });
}));

module.exports = router;