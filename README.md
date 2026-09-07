# Humsafar

💖 **Humsafar** — a Pakistani dating platform. Real backend (Express + `node:sqlite`), real-time calls & chat via lightweight polling + WebRTC, games, dates, video calls, matches, and a full admin dashboard.

## Stack

- **Frontend:** Vanilla JS SPA (`index.html`, `styles.css`, `app.js`) — original UI preserved and wired to the real API.
- **Admin dashboard:** Vanilla JS SPA at `/admin` (`admin/`).
- **Backend:** Express + Node's built-in `node:sqlite` (`server/`).
- **Auth:** JWT (bearer/cookie) with sessions, bcrypt password hashing, email verification + password reset (mock console transport, SMTP-ready).
- **Realtime:** polling-based signaling — chat, typing indicators, call signaling, incoming-call watcher.
- **Deploy:** single Vercel serverless function (`api/index.js`).

## Run locally

Requires **Node ≥ 22.5** (uses `node:sqlite`).

```bash
npm install --prefix server
npm run setup        # migrations + seed (admin + 20 demo users)
npm start            # http://localhost:4000
```

- Frontend: http://localhost:4000
- Admin: http://localhost:4000/admin
- Health: http://localhost:4000/api/public/health

## Demo credentials

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@humsafar.com` | `admin123` |
| Demo users | `ayesha.0@humsafar.test`, `kiran.18@humsafar.test`, … (`name.i@humsafar.test` for `i` in `0..19`) | `password123` |

Seed is idempotent (`npm run setup` is safe to re-run).

## API surface

Everything is under `/api/*` and returns `{ success, data }` (errors: `{ success: false, message, code }`).

- `public/` — meta, interests, locations, preferences, health
- `auth/` — register, login, logout, me, verify-email, forgot/reset-password
- `users/` — profile (GET/PUT /me, public profiles), photo upload/delete/primary, interests, delete account
- `discover/` — scored discovery feed (preferences, interests, online)
- `interactions/` — likes, super-likes, passes, likers
- `matches/` — matches list
- `conversations/` — messages, read receipts, typing
- `notifications/` — list + mark read
- `calls/` — call lifecycle (create/incoming/accept/reject/cancel/end/signals/history)
- `dates/` — plan + accept dates
- `games/` — TicTacToe + Truth/Dare (live moves against a match)
- `blocks/`, `reports/`
- `admin/` — dashboard, users (status/promote/demote), reports
- `/api/config` — client runtime config (APP_URL, STUN/TURN)

## Configuration

Copy `.env.example` to `server/.env` and adjust. Everything is optional; sensible defaults are built in. For **real email** fill the SMTP_* vars; otherwise messages are logged to the console.

## Deploy to Vercel

This repo is configured for a single serverless function (no `"functions"` block — every route rewrites to `/api/index.js`).

```bash
vercel --prod
```

Note: Vercel's filesystem is ephemeral and read-only except `/tmp`. The serverless entry points the SQLite DB and photo uploads at `/tmp` and re-migrates + re-seeds on every cold start, so the deployed demo always starts fresh (data resets between instances — intended).