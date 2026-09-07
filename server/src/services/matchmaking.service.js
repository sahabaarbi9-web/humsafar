// src/services/matchmaking.service.js — Like/Pass/SuperLike + match creation
const interactionModel = require('../models/interaction.model');
const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');
const userModel = require('../models/user.model');
const blockModel = require('../models/block.model');
const AppError = require('../utils/AppError');

function notify(userId, type, title, body, data) {
  notificationModel.add({ userId, type, title, body, data });
}

// Core action. Returns { matched, match } when a mutual like creates a match.
function performLike(from, to, kind = 'LIKE') {
  ensureEligible(from, to);

  if (kind === 'SUPER_LIKE') {
    interactionModel.addSuperLike(from, to);
    notify(to, 'SUPER_LIKE', 'Someone super liked you! ⭐',
      `${userModel.findById(from).name} sent you a Super Like.`, { by: from });
  } else {
    interactionModel.addLike(from, to);
    notify(to, 'LIKE', 'New like 💗',
      `${userModel.findById(from).name} liked your profile.`, { by: from });
  }

  // Reciprocal like from `to` → MATCH
  if (interactionModel.alreadyLiked(to, from) || interactionModel.alreadySuperLiked(to, from)) {
    return createMatch(from, to);
  }
  return { matched: false, match: null };
}

function performPass(from, to) {
  ensureEligible(from, to);
  interactionModel.addPass(from, to);
  return { matched: false, match: null };
}

function createMatch(a, b) {
  const existing = matchModel.between(a, b);
  if (existing) return { matched: true, match: existing, duplicate: true };

  const match = matchModel.create(a, b);
  const nameA = userModel.findById(a).name;
  const nameB = userModel.findById(b).name;

  notify(a, 'MATCH', "It's a Match! 💕", `You and ${nameB} liked each other.`, { matchId: match.id, other: b });
  notify(b, 'MATCH', "It's a Match! 💕", `You and ${nameA} liked each other.`, { matchId: match.id, other: a });

  return { matched: true, match, duplicate: false };
}

function ensureEligible(from, to) {
  if (from === to) throw new AppError('You cannot interact with yourself.', 422, 'VALIDATION_ERROR');
  const target = userModel.findById(to);
  if (!target || target.status !== 'ACTIVE') throw new AppError('User not found.', 404, 'NOT_FOUND');
  if (blockModel.blockedEither(from, to)) throw new AppError('This profile is not available.', 404, 'NOT_FOUND');
}

module.exports = { performLike, performPass, createMatch };