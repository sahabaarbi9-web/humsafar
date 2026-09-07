// src/routes/report.routes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const reportModel = require('../models/report.model');
const userModel = require('../models/user.model');
const { requireAuth } = require('../middleware/auth');
const { bodyIds } = require('../middleware/validate');
const { requireFields } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth, bodyIds);

router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['reported', 'reason']);
  const reported = req.body.reported;
  const reason = String(req.body.reason);
  if (req.user.id === reported) throw new AppError('Cannot report yourself.', 422, 'VALIDATION_ERROR');
  if (!reportModel.REASONS.includes(reason)) {
    throw new AppError(`Reason must be one of: ${reportModel.REASONS.join(', ')}`, 422, 'VALIDATION_ERROR');
  }
  const target = userModel.findById(reported);
  if (!target) throw new AppError('User not found.', 404, 'NOT_FOUND');

  const details = String(req.body.details || '').slice(0, 500);
  const report = reportModel.create({ reporter: req.user.id, reported, reason, details });

  res.status(201).json({ success: true, data: { reportId: report.id } });
}));

module.exports = router;