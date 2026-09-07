// src/services/matching.service.js — discover + recommendation algorithm
// Modular + scorable so it can be improved (weighted scoring, ML hooks) later.
const db = require('../db/database');
const profileModel = require('../models/profile.model');
const interestModel = require('../models/interest.model');
const matchModel = require('../models/match.model');
const blockModel = require('../models/block.model');
const userModel = require('../models/user.model');

// Weight buckets — tune these to change how the algorithm prioritizes.
const WEIGHTS = { interest: 3, city: 2, age: 1.5, relationship: 1.5, distance: 1, avatar: 0.5 };

function ageFromDob(dob) {
  const d = new Date(dob);
  const now = new Date();
  let a = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) a--;
  return a;
}

function interestNamesFor(userId) {
  return interestModel.listForUser(userId).map((i) => i.name);
}

// Core scoring: higher = better recommendation
function scoreCandidate(candidate, me) {
  let score = 0;
  const meInterests = new Set(me.interests.map((s) => s.toLowerCase()));
  const theirInterests = new Set((candidate.interests || []).map((s) => s.toLowerCase()));

  for (const int of theirInterests) if (meInterests.has(int)) score += WEIGHTS.interest;

  if (candidate.location && me.profile.location && candidate.location.toLowerCase() === me.profile.location.toLowerCase()) score += WEIGHTS.city;

  const theirAge = ageFromDob(candidate.dob);
  if (Number.isFinite(theirAge)) {
    const ageMin = me.profile.age_min || 18;
    const ageMax = me.profile.age_max || 45;
    if (theirAge >= ageMin && theirAge <= ageMax) score += WEIGHTS.age;
    else score -= WEIGHTS.age; // outside preference → deprioritized but not hidden
  }

  if (me.profile.relationship_pref && candidate.relationship_pref && me.profile.relationship_pref === candidate.relationship_pref) score += WEIGHTS.relationship;

  if (candidate.photo) score += WEIGHTS.avatar;

  // online bonus — small nudge to active members
  if (candidate.online) score += 0.5;

  return score;
}

// Build candidate list for `userId` honouring filters, blocks, previous interactions, existing matches.
function discover({ userId, filters = {}, limit = 30 }) {
  const me = db.prepare(`
    SELECT u.id, u.name, u.gender, u.location, u.dob,
      p.bio, p.relationship_pref, p.looking_gender, p.distance_pref, p.age_min, p.age_max, p.online, p.last_active
    FROM users u JOIN profiles p ON p.user_id = u.id WHERE u.id = ?
  `).get(userId);

  const myInterests = interestNamesFor(userId);
  const myLikes = db.prepare('SELECT to_user AS id FROM likes WHERE from_user = ?').all(userId).map((r) => r.id);
  const mySuperLikes = db.prepare('SELECT to_user AS id FROM super_likes WHERE from_user = ?').all(userId).map((r) => r.id);
  const myPasses = db.prepare('SELECT to_user AS id FROM passes WHERE from_user = ?').all(userId).map((r) => r.id);
  const myMatches = matchModel.listForUser(userId).map((m) => m.other_id);
  const blockedIds = blockModel.blockedUserIds(userId);
  const blockedMeIds = db.prepare('SELECT blocker AS id FROM blocks WHERE blocked = ?').all(userId).map((r) => r.id);

  const excluded = new Set([...myLikes, ...mySuperLikes, ...myPasses, ...myMatches, ...blockedIds, ...blockedMeIds, userId]);

  const rows = db.prepare(`
    SELECT u.id, u.name, u.gender, u.location, u.dob, u.status,
      p.bio, p.relationship_pref, p.online, p.last_active,
      (SELECT url FROM photos WHERE user_id = u.id AND is_primary = 1 LIMIT 1) AS photo
    FROM users u JOIN profiles p ON p.user_id = u.id
    WHERE u.status = 'ACTIVE' AND u.id != ?
    AND u.id NOT IN (SELECT blocked FROM blocks WHERE blocker = ?)
    AND u.id NOT IN (SELECT blocker FROM blocks WHERE blocked = ?)
  `).all(userId, userId, userId);

  const candidates = rows
    .filter((r) => !excluded.has(r.id))
    .map((cand) => ({
      ...cand,
      age: ageFromDob(cand.dob),
      interests: interestNamesFor(cand.id)
    }))
    .map((cand) => {
      const score = scoreCandidate(cand, { profile: me, interests: myInterests });
      return { ...cand, score };
    });

  // Apply explicit filters
  let out = candidates;
  if (filters.minAge) out = out.filter((c) => c.age >= Number(filters.minAge));
  if (filters.maxAge) out = out.filter((c) => c.age <= Number(filters.maxAge));
  if (filters.gender && filters.gender !== 'all') out = out.filter((c) => c.gender === filters.gender);
  if (filters.location && filters.location !== 'all') out = out.filter((c) => c.location === filters.location);
  if (filters.interest) out = out.filter((c) => c.interests.some((i) => i.toLowerCase().includes(String(filters.interest).toLowerCase())));
  if (filters.relationshipPref) out = out.filter((c) => c.relationship_pref === filters.relationshipPref);

  // Sort: score desc, then online first
  out.sort((a, b) => (b.score - a.score) || (b.online - a.online));
  const sliced = [...out].slice(0, limit);

  return {
    candidates: sliced.map((c) => ({
      id: c.id, name: c.name, age: c.age, gender: c.gender, location: c.location,
      bio: c.bio, relationship_pref: c.relationship_pref,
      online: !!c.online, last_active: c.last_active,
      interests: c.interests, photo: c.photo, score: Math.round(c.score * 10) / 10
    })),
    total: out.length
  };
}

module.exports = { discover, scoreCandidate, WEIGHTS };