// src/routes/call.routes.js — WebRTC call lifecycle + signaling
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const callModel = require('../models/call.model');
const blockModel = require('../models/block.model');
const userModel = require('../models/user.model');
const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');
const { requireAuth } = require('../middleware/auth');
const { bodyIds, positiveIntParam } = require('../middleware/validate');
const { requireFields } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth, bodyIds);

// TTL cleanup for stale calls
setInterval(() => {
  const db = require('../db/database');
  db.prepare("UPDATE calls SET status = 'MISSED' WHERE status = 'REQUESTED' AND created_at < datetime('now','-60 seconds')").run();
  db.prepare("UPDATE calls SET status = 'ENDED' WHERE status = 'ACCEPTED' AND started_at < datetime('now','-15 minutes')").run();
}, 30000).unref();

function assertParticipant(call, userId) {
  if (!call || (call.caller_id !== userId && call.callee_id !== userId)) {
    throw new AppError('Call not found.', 404, 'NOT_FOUND');
  }
}

function peerName(call, userId) {
  const peerId = call.caller_id === userId ? call.callee_id : call.caller_id;
  const u = userModel.findById(peerId);
  return u ? u.name : 'Unknown';
}

// REQUEST a call to a match
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['toUserId', 'type']);
  const to = req.body.toUserId;
  const type = req.body.type || 'video';
  if (!['video', 'audio'].includes(type)) throw new AppError('Invalid call type.', 422, 'VALIDATION_ERROR');
  if (req.user.id === to) throw new AppError('Cannot call yourself.', 422, 'VALIDATION_ERROR');

  const target = userModel.findById(to);
  if (!target || target.status !== 'ACTIVE') throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (blockModel.blockedEither(req.user.id, to)) throw new AppError('Cannot call this user.', 403, 'BLOCKED');
  if (!matchModel.between(req.user.id, to)) throw new AppError('You can only call your matches.', 403, 'FORBIDDEN');

  const call = callModel.create({ callerId: req.user.id, calleeId: to, type });
  notificationModel.add({
    userId: to, type: 'CALL', title: 'Incoming call 📞',
    body: `${peerName(call, req.user.id)} is calling you (${type})`, data: { callId: call.id }
  });
  res.status(201).json({ success: true, data: { call: serializeCall(req.user.id, call) } });
}));

// History + currently ringing
router.get('/', asyncHandler(async (req, res) => {
  const history = callModel.tailForUser(req.user.id, 30).map((c) => serializeCall(req.user.id, c));
  res.json({ success: true, data: { history } });
}));

router.get('/incoming', asyncHandler(async (req, res) => {
  const incoming = callModel.incomingForUser(req.user.id).map((c) => serializeCall(req.user.id, c));
  res.json({ success: true, data: { incoming } });
}));

router.post('/:id/accept', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const call = callModel.find(req.params.id);
  if (!call || call.callee_id !== req.user.id) throw new AppError('Call not found.', 404, 'NOT_FOUND');
  if (call.status !== 'REQUESTED') throw new AppError('This call is no longer active.', 409, 'CONFLICT');
  callModel.setStarted(call.id);
  res.json({ success: true, data: { call: serializeCall(req.user.id, callModel.find(call.id)) } });
}));

router.post('/:id/reject', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const call = callModel.find(req.params.id);
  if (!call || call.callee_id !== req.user.id) throw new AppError('Call not found.', 404, 'NOT_FOUND');
  callModel.setStatus(call.id, 'REJECTED');
  res.json({ success: true, data: { ok: true } });
}));

router.post('/:id/cancel', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const call = callModel.find(req.params.id);
  if (!call || call.caller_id !== req.user.id) throw new AppError('Call not found.', 404, 'NOT_FOUND');
  callModel.setStatus(call.id, 'CANCELLED');
  res.json({ success: true, data: { ok: true } });
}));

router.post('/:id/end', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const call = callModel.find(req.params.id);
  assertParticipant(call, req.user.id);
  callModel.setEnded(call.id);
  res.json({ success: true, data: { ok: true } });
}));

// Signaling: poll-based, ids are incrementing sequence numbers
router.get('/:id/signals', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const call = callModel.find(req.params.id);
  assertParticipant(call, req.user.id);
  const after = Number(req.query.after) || 0;
  const peers = callModel.candidatePeers(call.id);
  const signals = callModel.signalsAfter(call.id, after)
    .filter((s) => s.sender_id !== req.user.id) // don't echo your own packets
    .map((s) => ({ id: s.id, from: s.sender_id, packet: s.packet }));
  res.json({ success: true, data: { signals, lastId: callModel.lastSignalId(call.id), peers } });
}));

router.post('/:id/signals', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const call = callModel.find(req.params.id);
  assertParticipant(call, req.user.id);
  const { packet } = req.body;
  if (!packet || typeof packet !== 'object') throw new AppError('Invalid signaling packet.', 422, 'VALIDATION_ERROR');
  callModel.pushSignal(call.id, req.user.id, packet);
  res.status(201).json({ success: true, data: { id: callModel.lastSignalId(call.id) } });
}));

function serializeCall(me, c) {
  return {
    id: c.id,
    type: c.type,
    callerId: c.caller_id,
    calleeId: c.callee_id,
    status: c.status,
    createdAt: c.created_at,
    startedAt: c.started_at,
    endedAt: c.ended_at,
    isCaller: c.caller_id === me,
    peer: { id: c.caller_id === me ? c.callee_id : c.caller_id, name: c.peer_name || c.caller_name, photo: c.peer_photo || c.caller_photo }
  };
}

module.exports = router;