// src/routes/discover.routes.js
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const matchingService = require('../services/matching.service');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

router.get('/', asyncHandler(async (req, res) => {
  const q = req.query;
  const filters = {
    minAge: q.minAge && Number(q.minAge),
    maxAge: q.maxAge && Number(q.maxAge),
    gender: q.gender && q.gender !== 'all' ? q.gender : null,
    location: q.location && q.location !== 'all' ? q.location : null,
    interest: q.interest && q.interest !== 'all' ? q.interest : null,
    relationshipPref: q.relationshipPref ? q.relationshipPref : null
  };
  const limit = Math.min(Number(q.limit) || 30, 100);
  const data = matchingService.discover({ userId: req.user.id, filters, limit });
  res.json({ success: true, data });
}));

module.exports = router;