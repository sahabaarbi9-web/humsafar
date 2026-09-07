// src/routes/user.routes.js
const express = require('express');
const path = require('path');
const config = require('../config/config');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const userModel = require('../models/user.model');
const profileModel = require('../models/profile.model');
const photoModel = require('../models/photo.model');
const interestModel = require('../models/interest.model');
const profileService = require('../services/profile.service');
const uploadService = require('../services/upload.service');
const { requireAuth } = require('../middleware/auth');
const { positiveIntParam } = require('../middleware/validate');
const { requireFields, requireMinAge } = require('../utils/validators');
const router = express.Router();

router.use(requireAuth);

// --- Own profile: read + full update ---
router.get('/me', asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: profileService.buildOwn(req.user.id) } });
}));

router.put('/me', asyncHandler(async (req, res) => {
  const b = req.body;
  const userFields = {};
  if (b.name !== undefined) {
    if (typeof b.name !== 'string' || b.name.trim().length < 2 || b.name.trim().length > 50) throw new AppError('Invalid name.', 422, 'VALIDATION_ERROR');
    userFields.name = b.name.trim();
  }
  if (b.gender !== undefined) { if (!['Female', 'Male', 'Other'].includes(b.gender)) throw new AppError('Invalid gender.', 422, 'VALIDATION_ERROR'); userFields.gender = b.gender; }
  if (b.location !== undefined) { if (!b.location || typeof b.location !== 'string') throw new AppError('Invalid location.', 422, 'VALIDATION_ERROR'); userFields.location = b.location.trim(); }
  if (b.dob !== undefined) { requireMinAge(b.dob, config.minAge); userFields.dob = b.dob; }
  if (b.phone !== undefined) userFields.phone = b.phone;

  const profileFields = {};
  if (b.bio !== undefined) { if (typeof b.bio !== 'string' || b.bio.length > 500) throw new AppError('Bio must be under 500 characters.', 422, 'VALIDATION_ERROR'); profileFields.bio = b.bio; }
  if (b.relationship_pref !== undefined) { if (!['Friendship', 'Serious Relationship', 'Something Casual'].includes(b.relationship_pref)) throw new AppError('Invalid relationship pref.', 422, 'VALIDATION_ERROR'); profileFields.relationship_pref = b.relationship_pref; }
  if (b.looking_gender !== undefined) { if (!['Female', 'Male', 'Other', 'all'].includes(b.looking_gender)) throw new AppError('Invalid looking gender.', 422, 'VALIDATION_ERROR'); profileFields.looking_gender = b.looking_gender; }
  if (b.distance_pref !== undefined) { const n = Number(b.distance_pref); if (!Number.isFinite(n) || n < 1 || n > 1000) throw new AppError('Distance preference 1–1000 km.', 422, 'VALIDATION_ERROR'); profileFields.distance_pref = n; }
  if (b.age_min !== undefined) profileFields.age_min = Number(b.age_min);
  if (b.age_max !== undefined) profileFields.age_max = Number(b.age_max);
  if (b.height !== undefined) profileFields.height = b.height ? Number(b.height) : null;
  if (b.occupation !== undefined) profileFields.occupation = String(b.occupation).slice(0, 100);
  if (b.education !== undefined) profileFields.education = String(b.education).slice(0, 100);

  userModel.update(req.user.id, userFields);
  profileModel.update(req.user.id, profileFields);
  if (Array.isArray(b.interests)) {
    interestModel.setForUser(req.user.id, b.interests);
  }
  res.json({ success: true, data: { user: profileService.buildOwn(req.user.id) } });
}));

// --- Other user profile (public) ---
router.get('/:id', positiveIntParam('id'), asyncHandler(async (req, res) => {
  if (req.params.id === req.user.id) {
    return res.json({ success: true, data: { user: profileService.buildOwn(req.user.id), own: true } });
  }
  const target = userModel.findById(req.params.id);
  if (!target || target.status !== 'ACTIVE') throw new AppError('User not found.', 404, 'NOT_FOUND');

  const blockModel = require('../models/block.model');
  if (blockModel.blockedEither(req.user.id, target.id)) {
    throw new AppError('User not found.', 404, 'NOT_FOUND');
  }
  res.json({ success: true, data: { user: profileService.buildPublic(target.id), own: false } });
}));

// --- Photos: upload (1..n), delete, set primary ---
router.post('/me/photos', uploadService.upload.array('photos', config.maxPhotos), asyncHandler(async (req, res) => {
  if (!req.files || !req.files.length) throw new AppError('No images uploaded.', 422, 'VALIDATION_ERROR');
  const existing = photoModel.countByUser(req.user.id);
  const room = config.maxPhotos - existing;
  const toAdd = req.files.slice(0, room > 0 ? room : 0);
  if (!toAdd.length) throw new AppError('Photo limit reached.', 413, 'PHOTO_LIMIT');

  const firstIsPrimary = existing === 0;
  const urls = toAdd.map((f) => {
    const url = uploadService.toPublicUrl(f.filename);
    photoModel.add(req.user.id, url, firstIsPrimary);
    return url;
  });
  res.status(201).json({ success: true, data: { photos: photoModel.listByUser(req.user.id), uploaded: urls } });
}));

router.delete('/me/photos/:photoId', positiveIntParam('photoId'), asyncHandler(async (req, res) => {
  const ph = photoModel.find(req.params.photoId);
  if (!ph || ph.user_id !== req.user.id) throw new AppError('Photo not found.', 404, 'NOT_FOUND');

  const unlinkPath = path.basename(ph.url);
  if (ph.url && ph.url.startsWith(config.uploadsUrl + '/')) {
    try { uploadService.removeFile(path.join(config.uploadsDir, unlinkPath)); } catch { /* ignore */ }
  }
  photoModel.remove(ph.id);

  // If we just removed the primary, promote the newest remaining photo
  if (ph.is_primary) {
    const remaining = photoModel.listByUser(req.user.id);
    if (remaining.length) photoModel.setPrimary(req.user.id, remaining[remaining.length - 1].id);
  }
  res.json({ success: true, data: { photos: photoModel.listByUser(req.user.id) } });
}));

router.put('/me/photos/:photoId/primary', positiveIntParam('photoId'), asyncHandler(async (req, res) => {
  const ph = photoModel.find(req.params.photoId);
  if (!ph || ph.user_id !== req.user.id) throw new AppError('Photo not found.', 404, 'NOT_FOUND');
  photoModel.setPrimary(req.user.id, ph.id);
  res.json({ success: true, data: { photos: photoModel.listByUser(req.user.id) } });
}));

// --- Interests ---
router.put('/me/interests', asyncHandler(async (req, res) => {
  const { interests } = req.body;
  if (!Array.isArray(interests)) throw new AppError('interests must be an array.', 422, 'VALIDATION_ERROR');
  if (interests.length > 10) throw new AppError('Max 10 interests.', 422, 'VALIDATION_ERROR');
  const list = interestModel.setForUser(req.user.id, interests);
  res.json({ success: true, data: { interests: list.map((i) => i.name) } });
}));

router.delete('/me/account', asyncHandler(async (req, res) => {
  requireFields(req.body, ['password']);
  const bcrypt = require('bcryptjs');
  const ok = await bcrypt.compare(req.body.password, req.user.password_hash);
  if (!ok) throw new AppError('Password is incorrect.', 401, 'INVALID_CREDENTIALS');
  userModel.deleteUser(req.user.id);
  res.json({ success: true, data: { message: 'Account deleted.' } });
}));

module.exports = router;