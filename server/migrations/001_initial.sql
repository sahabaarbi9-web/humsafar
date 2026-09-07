-- 001_initial.sql — Humsafar full schema
-- Relational, with FKs, unique constraints & indexes. Designed to map cleanly to Postgres.

-- ---------- USERS ----------
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  dob TEXT NOT NULL,                        -- ISO date YYYY-MM-DD
  gender TEXT NOT NULL,                     -- Female / Male / Other
  location TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'USER',        -- USER / ADMIN
  status TEXT NOT NULL DEFAULT 'ACTIVE',    -- ACTIVE / SUSPENDED / BANNED
  email_verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_gender ON users(gender);
CREATE INDEX IF NOT EXISTS idx_users_dob ON users(dob);

-- ---------- PROFILES ----------
CREATE TABLE IF NOT EXISTS profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT DEFAULT '',
  -- preferences
  relationship_pref TEXT DEFAULT '',         -- Friendship / Serious Relationship / Something Casual
  looking_gender TEXT DEFAULT 'all',        -- Female / Male / Other / all
  distance_pref INTEGER DEFAULT 100,        -- max distance (km)
  age_min INTEGER DEFAULT 18,
  age_max INTEGER DEFAULT 45,
  height INTEGER,                           -- cm (optional)
  occupation TEXT DEFAULT '',
  education TEXT DEFAULT '',
  -- activity
  online INTEGER NOT NULL DEFAULT 0,
  last_active TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- PHOTOS ----------
CREATE TABLE IF NOT EXISTS photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_photos_user ON photos(user_id);

-- ---------- INTERESTS ----------
CREATE TABLE IF NOT EXISTS interests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_interests (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest_id INTEGER NOT NULL REFERENCES interests(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, interest_id)
);

-- ---------- LIKES / PASSES / SUPER LIKES ----------
CREATE TABLE IF NOT EXISTS likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (from_user, to_user)
);
CREATE INDEX IF NOT EXISTS idx_likes_to_user ON likes(to_user);
CREATE INDEX IF NOT EXISTS idx_likes_from_user ON likes(from_user);

CREATE TABLE IF NOT EXISTS passes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (from_user, to_user)
);
CREATE INDEX IF NOT EXISTS idx_passes_from_user ON passes(from_user);

CREATE TABLE IF NOT EXISTS super_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (from_user, to_user)
);
CREATE INDEX IF NOT EXISTS idx_superlikes_to_user ON super_likes(to_user);

-- ---------- MATCHES (conversation = 1:1 per match) ----------
CREATE TABLE IF NOT EXISTS matches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON matches(user_a);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON matches(user_b);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id INTEGER NOT NULL UNIQUE REFERENCES matches(id) ON DELETE CASCADE,
  last_message_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ---------- MESSAGES ----------
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  is_deleted INTEGER NOT NULL DEFAULT 0,
  edited_at TEXT,
  deleted_at TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);

-- ---------- NOTIFICATIONS ----------
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                       -- LIKE / SUPER_LIKE / MATCH / MESSAGE / DATE_REQUEST / DATE_ACCEPTED / CALL / GAME / SYSTEM
  title TEXT NOT NULL,
  body TEXT DEFAULT '',
  data TEXT DEFAULT '{}',                   -- JSON payload
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);

-- ---------- CALLS ----------
CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  caller_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  callee_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                       -- VOICE / VIDEO
  status TEXT NOT NULL DEFAULT 'REQUESTED', -- REQUESTED / ACCEPTED / REJECTED / ENDED / MISSED / CANCELLED
  started_at TEXT,
  ended_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_calls_callee ON calls(callee_id, status);
CREATE INDEX IF NOT EXISTS idx_calls_caller ON calls(caller_id);

-- ---------- CALL SIGNALING (WebRTC offer/answer/ice bridge) ----------
CREATE TABLE IF NOT EXISTS call_signals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  call_id INTEGER NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  packet TEXT NOT NULL,                     -- JSON {type:'offer'|'answer'|'ice', sdp/candidate}
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_call_signals_call ON call_signals(call_id);

-- ---------- DATES ----------
CREATE TABLE IF NOT EXISTS dates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  location TEXT DEFAULT '',
  scheduled_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',   -- PENDING / ACCEPTED / REJECTED / CANCELLED / COMPLETED
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_dates_user ON dates(sender_id);
CREATE INDEX IF NOT EXISTS idx_dates_receiver ON dates(receiver_id, status);

-- ---------- GAMES ----------
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_a INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  player_b INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                       -- TIC_TAC_TOE / ROCK_PAPER_SCISSORS
  state TEXT DEFAULT '{}',                  -- JSON game state
  status TEXT NOT NULL DEFAULT 'ONGOING',   -- ONGOING / FINISHED / ABANDONED
  winner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  finished_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_games_player_a ON games(player_a, status);
CREATE INDEX IF NOT EXISTS idx_games_player_b ON games(player_b, status);

CREATE TABLE IF NOT EXISTS game_moves (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  move TEXT NOT NULL,                       -- JSON
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_game_moves_game ON game_moves(game_id);

-- ---------- BLOCKS ----------
CREATE TABLE IF NOT EXISTS blocks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  blocker INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (blocker, blocked)
);
CREATE INDEX IF NOT EXISTS idx_blocks_blocker ON blocks(blocker);

-- ---------- REPORTS ----------
CREATE TABLE IF NOT EXISTS reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reporter INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reported INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,                     -- fake_profile / harassment / spam / inappropriate / scam / other
  details TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'OPEN',      -- OPEN / IN_REVIEW / RESOLVED / IGNORED
  action_taken TEXT DEFAULT '',
  resolved_by INTEGER REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  resolved_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON reports(reported);

-- ---------- TOKENS (sessions, email verification, password reset) ----------
CREATE TABLE IF NOT EXISTS auth_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,                 -- sha256 of plaintext token
  kind TEXT NOT NULL DEFAULT 'SESSION',     -- SESSION / EMAIL_VERIFY / PASSWORD_RESET
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_user ON auth_tokens(user_id, kind);
CREATE INDEX IF NOT EXISTS idx_auth_tokens_hash ON auth_tokens(token_hash);

-- ---------- ADMINS ----------
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  last_login_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);