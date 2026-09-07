// src/routes/block.routes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const blockModel = require('../models/block.model');
const userModel = require('../models/user.model');
const { requireAuth } = require('../middleware/auth');
const { bodyIds, positiveIntParam } = require('../middleware/validate');
const { requireFields } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth, bodyIds);

router.get('/', asyncHandler(async (req, res) => {
  const rows = blockModel.listForUser(req.user.id);
  res.json({ success: true, data: { blocks: rows.map((r) => ({ id: r.id, blocked: { id: r.blocked, name: r.name, photo: r.photo }, createdAt: r.created_at })) } });
}));

router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['blocked']);
  const blocked = req.body.blocked;
  if (req.user.id === blocked) throw new AppError('Cannot block yourself.', 422, 'VALIDATION_ERROR');
  const target = userModel.findById(blocked);
  if (!target || target.status !== 'ACTIVE') throw new AppError('User not found.', 404, 'NOT_FOUND');

  blockModel.add(req.user.id, blocked);
  res.status(201).json({ success: true, data: { ok: true } });
}));

router.delete('/:id', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const deleted = blockModel.removeById(req.params.id, req.user.id);
  if (!deleted) throw new AppError('Block not found.', 404, 'NOT_FOUND');
  res.json({ success: true, data: { ok: true } });
}));

module.exports = router;