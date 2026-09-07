// src/routes/public.routes.js — open endpoints (meta, locations, interests)
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const interestModel = require('../models/interest.model');
const router = express.Router();

router.get('/health', asyncHandler(async (req, res) => {
  const db = require('../db/database');
  const rows = db.prepare('SELECT COUNT(*) AS users FROM users').get();
  res.json({ success: true, data: { status: 'ok', time: new Date().toISOString(), users: rows.users } });
}));

router.get('/meta', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      genders: ['Female', 'Male', 'Other'],
      locations: ['Lahore', 'Karachi', 'Islamabad', 'Multan', 'Rawalpindi', 'Faisalabad', 'Peshawar', 'Quetta'],
      relationshipPrefs: ['Friendship', 'Serious Relationship', 'Something Casual'],
      interests: interestModel.listAll().map((i) => i.name),
      minAge: 18
    }
  });
}));

router.get('/interests', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { interests: interestModel.listAll().map((i) => i.name) } });
}));

module.exports = router;