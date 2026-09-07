// src/services/profile.service.js — build consistent profile JSON payloads
const userModel = require('../models/user.model');
const profileModel = require('../models/profile.model');
const photoModel = require('../models/photo.model');
const interestModel = require('../models/interest.model');
const { ageFromDob } = require('../utils/validators');

function buildPublic(userId) {
  const u = userModel.findById(userId);
  if (!u) return null;
  const p = profileModel.findByUserId(userId) || {};
  const photos = photoModel.listByUser(userId) || [];
  const interests = interestModel.listForUser(userId) || [];

  return {
    id: u.id,
    name: u.name,
    age: ageFromDob(u.dob),
    gender: u.gender,
    location: u.location,
    dob: u.dob,
    bio: p.bio || '',
    relationship_pref: p.relationship_pref || '',
    looking_gender: p.looking_gender || 'all',
    distance_pref: p.distance_pref != null ? p.distance_pref : 100,
    age_min: p.age_min != null ? p.age_min : 18,
    age_max: p.age_max != null ? p.age_max : 45,
    height: p.height || null,
    occupation: p.occupation || '',
    education: p.education || '',
    online: !!p.online,
    last_active: p.last_active || '',
    photos: photos.map(({ id, url, is_primary }) => ({ id, url, is_primary: !!is_primary })),
    photo: photos.find((ph) => ph.is_primary)?.url || photos[0]?.url || null,
    interests: interests.map((i) => i.name),
    email_verified: !!u.email_verified,
    created_at: u.created_at
  };
}

function buildOwn(userId) {
  const pub = buildPublic(userId);
  if (!pub) return null;
  const u = userModel.findById(userId);
  return { ...pub, email: u.email, phone: u.phone || '', role: u.role, status: u.status };
}

module.exports = { buildPublic, buildOwn };