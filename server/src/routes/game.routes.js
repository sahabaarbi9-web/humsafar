// src/routes/game.routes.js — multiplayer mini-games (TicTacToe, Truth/Dare shown as moves)
const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const gameModel = require('../models/game.model');
const blockModel = require('../models/block.model');
const userModel = require('../models/user.model');
const matchModel = require('../models/match.model');
const notificationModel = require('../models/notification.model');
const { requireAuth } = require('../middleware/auth');
const { bodyIds, positiveIntParam } = require('../middleware/validate');
const { requireFields } = require('../utils/validators');

const router = express.Router();
router.use(requireAuth, bodyIds);

const TYPES = ['TICTACTOE', 'MEMORY', 'TRUTH_DARE'];

function assertParticipant(g, userId) {
  if (!g || (g.player_a !== userId && g.player_b !== userId)) throw new AppError('Game not found.', 404, 'NOT_FOUND');
}

function otherId(g, userId) { return g.player_a === userId ? g.player_b : g.player_a; }

function opponentMove(move) {
  // For tictactoe invert the mark so the viewer sees their own perspective
  if (move && typeof move.mark === 'string') {
    return { ...move, mark: move.mark === 'X' ? 'O' : 'X' };
  }
  return move;
}

// New game against a match
router.post('/', asyncHandler(async (req, res) => {
  requireFields(req.body, ['toUserId', 'type']);
  const type = String(req.body.type).toUpperCase();
  if (!TYPES.includes(type)) throw new AppError('Invalid game type.', 422, 'VALIDATION_ERROR');
  const to = req.body.toUserId;
  if (req.user.id === to) throw new AppError('Cannot play against yourself.', 422, 'VALIDATION_ERROR');
  if (blockModel.blockedEither(req.user.id, to)) throw new AppError('Cannot do this.', 403, 'BLOCKED');
  if (!matchModel.between(req.user.id, to)) throw new AppError('You can only play games with your matches.', 403, 'FORBIDDEN');

  if (gameModel.activeBetween(req.user.id, to)) throw new AppError('You already have an ongoing game.', 409, 'CONFLICT');

  const initialState = type === 'TICTACTOE' ? { board: Array(9).fill(null), turn: req.user.id } : {};
  const g = gameModel.create({ playerA: req.user.id, playerB: to, type, initialState });
  const otherName = userModel.findById(to).name;
  notificationModel.add({
    userId: to, type: 'GAME', title: 'Game challenge 🎮',
    body: `${req.user.name} challenged you to ${type.replace('_', ' ')}.`, data: { gameId: g.id }
  });

  res.status(201).json({ success: true, data: { game: publicGame(g, req.user.id) } });
}));

// List my games
router.get('/', asyncHandler(async (req, res) => {
  const rows = gameModel.listForUser(req.user.id, req.query.type || null);
  res.json({ success: true, data: { games: rows.map((g) => ({
    id: g.id, type: g.type, status: g.status, winnerId: g.winner_id,
    createdAt: g.created_at, finishedAt: g.finished_at,
    other: { id: otherId(g, req.user.id), name: g.other_name, photo: g.other_photo },
    isMyTurn: g.status === 'ONGOING' && (JSON.parse(db2().prepare('SELECT state FROM games WHERE id = ?').get(g.id).state).turn === req.user.id)
  })) } });
}));

router.get('/:id', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const g = gameModel.find(req.params.id);
  assertParticipant(g, req.user.id);
  res.json({ success: true, data: { game: publicGame(g, req.user.id), moves: gameModel.movesFor(g.id).map((m) => ({ id: m.id, playerId: m.player_id, move: opponentMove(m.move), createdAt: m.created_at })) } });
}));

// PLAY MOVE
router.post('/:id/moves', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const g = gameModel.find(req.params.id);
  assertParticipant(g, req.user.id);
  if (g.status !== 'ONGOING') throw new AppError('This game is not ongoing.', 409, 'CONFLICT');
  const state = readState(g);

  if (g.type === 'TICTACTOE') {
    requireFields(req.body, ['mark', 'cell']);
    if (state.turn !== req.user.id) throw new AppError('Not your turn.', 409, 'CONFLICT');
    const mark = req.body.mark;
    const cell = Number(req.body.cell);
    if (!['X', 'O'].includes(mark)) throw new AppError('Invalid mark.', 422, 'VALIDATION_ERROR');
    const myMark = playerMark(g, req.user.id);
    if (mark !== myMark) throw new AppError('Wrong mark.', 422, 'VALIDATION_ERROR');
    if (!Number.isInteger(cell) || cell < 0 || cell > 8 || state.board[cell] !== null) throw new AppError('Invalid cell.', 422, 'VALIDATION_ERROR');

    state.board[cell] = mark;
    const outcome = checkTicTacToe(state.board, myMark);

    if (outcome.winner) {
      state.winner = req.user.id;
      state.turn = null;
      gameModel.updateState(g.id, state);
      gameModel.addMove(g.id, req.user.id, { mark, cell });
      gameModel.finish(g.id, req.user.id);
      notifyGame(g, req.user.id, 'Game won 🏆', `${req.user.name} won the game!`);
    } else if (outcome.draw) {
      state.draw = true;
      state.turn = null;
      gameModel.updateState(g.id, state);
      gameModel.addMove(g.id, req.user.id, { mark, cell });
      gameModel.finish(g.id, null);
      notifyGame(g, req.user.id, 'Game drawn 🤝', `The game ended in a draw.`);
    } else {
      state.turn = otherId(g, req.user.id);
      gameModel.updateState(g.id, state);
      gameModel.addMove(g.id, req.user.id, { mark, cell });
    }
  } else if (g.type === 'TRUTH_DARE') {
    requireFields(req.body, ['action']);
    const action = String(req.body.action);
    if (!['TRUTH', 'DARE', 'I_CHOSE_DARE', 'I_CHOSE_TRUTH'].includes(action)) throw new AppError('Invalid action.', 422, 'VALIDATION_ERROR');
    state.turn = otherId(g, req.user.id);
    gameModel.updateState(g.id, state);
    gameModel.addMove(g.id, req.user.id, { action });
  } else {
    throw new AppError('Unsupported game logic.', 400, 'UNSUPPORTED');
  }

  res.status(201).json({ success: true, data: { game: publicGame(gameModel.find(g.id), req.user.id), moves: gameModel.movesFor(g.id).length } });
}));

router.post('/:id/abandon', positiveIntParam('id'), asyncHandler(async (req, res) => {
  const g = gameModel.find(req.params.id);
  assertParticipant(g, req.user.id);
  if (g.status !== 'ONGOING') throw new AppError('Game is not ongoing.', 409, 'CONFLICT');
  gameModel.markAbandoned(g.id);
  gameModel.finish(g.id, otherId(g, req.user.id)); // opponent wins by forfeit
  notifyGame(g, req.user.id, 'Game abandoned', `${req.user.name} left the game. You win!`);
  res.json({ success: true, data: { ok: true } });
}));

function readState(g) { try { return JSON.parse(g.state); } catch { return {}; } }
function playerMark(g, userId) { return g.player_a === userId ? 'X' : 'O'; }

function checkTicTacToe(board, /* unused */) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]
  ];
  for (const [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return { winner: board[a] };
  }
  if (board.every((v) => v !== null)) return { draw: true };
  return {};
}

function notifyGame(g, userId, title, body) {
  notificationModel.add({ userId: otherId(g, userId), type: 'GAME', title, body, data: { gameId: g.id } });
}

function db2() { return require('../db/database'); }

function publicGame(g, userId) {
  const state = readState(g);
  return {
    id: g.id, type: g.type, status: g.status, winnerId: g.winner_id,
    createdAt: g.created_at, finishedAt: g.finished_at,
    state: g.type === 'TICTACTOE' ? {
      board: state.board || Array(9).fill(null),
      turn: state.turn,
      myMark: playerMark(g, userId),
      myTurn: state.turn === userId
    } : state,
    other: { id: otherId(g, userId), name: userModel.findById(otherId(g, userId))?.name || 'Unknown' },
    movesCount: 0
  };
}

module.exports = router;