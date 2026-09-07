/* =====================================================================
   HUMSAFAR — Frontend (REAL BACKEND INTEGRATION)
   Vanilla JS. Talks to same-origin /api/* (Express + node:sqlite).
   ===================================================================== */
'use strict';

const API = '/api';
const TOKEN_KEY = 'humsafar_token';

/* ---------- Static marketing content ---------- */
const DATE_IDEAS = [
  { emoji: '🍽️', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80', title: 'Romantic Dinner', desc: 'Enjoy a cozy dinner with your special someone.', loc: '📍 Clifton, Karachi', price: 'Rs. 5,000' },
  { emoji: '☕', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700&q=80', title: 'Coffee Date', desc: 'Warm drinks, deeper talks and good vibes.', loc: '📍 Gulberg, Lahore', price: 'Rs. 1,500' },
  { emoji: '🌊', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80', title: 'Beach Walk', desc: 'Sand, sea breeze and honest conversations.', loc: '📍 Sea View, Karachi', price: 'Free' },
  { emoji: '🎬', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700&q=80', title: 'Movie Night', desc: 'A good film and an even better companion.', loc: '📍 Centaurus, Islamabad', price: 'Rs. 2,000' },
  { emoji: '🏞️', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&q=80', title: 'Adventure Date', desc: 'Hike, climb, explore — for the bold.', loc: '📍 Margalla Hills', price: 'Rs. 1,200' },
  { emoji: '🧺', img: 'https://images.unsplash.com/photo-1522426266218-ba48b1f6c63f?w=700&q=80', title: 'Picnic', desc: 'Baskets, blankets and golden-hour talks.', loc: '📍 Jilani Park, Lahore', price: 'Rs. 800' }
];

const SOLO_GAMES = {
  'Truth or Dare': { emoji: '🎭', desc: 'Spicy questions and daring dares to break the ice.', players: '2–6 players', questions: ['What\'s your most embarrassing moment?', 'If you could kiss anyone here, who?', 'Sing your favourite song out loud!'] },
  'Would You Rather': { emoji: '🔀', desc: 'Impossible choices that reveal everything.', players: '2–8 players', questions: ['Dinner date or travel date?', 'Texting all day or calls at night?', 'Movie night or game night?'] },
  '20 Questions': { emoji: '❓', desc: 'Guess the secret — one question at a time.', players: '2 players', questions: ['Think of a place you love', 'Think of a movie you like', 'Think of a food you crave'] },
  'Couple Quiz': { emoji: '💞', desc: 'Find out how much you know about each other.', players: '2 players', questions: ['What\'s their favourite season?', 'What do they order first at a café?', 'What\'s their dream destination?'] },
  'Emoji Challenge': { emoji: '😜', desc: 'Describe it without words — only emojis.', players: '2–6 players', questions: ['Act out: a proposal', 'Act out: first date nerves', 'Act out: airport goodbye'] },
  'Love Trivia': { emoji: '💘', desc: 'Fun facts and flirty questions about love.', players: '2–8 players', questions: ['What scent is most romantic?', 'Best first-date location?', 'Fastest way to someone\'s heart?'] }
};

const TESTIMONIALS = [
  { name: 'Ayesha & Hamza', loc: 'Karachi', img: 'https://i.pravatar.cc/200?img=47', stars: 5, story: 'I joined Humsafar just to meet new people. I never expected to find someone who understood me so well.' },
  { name: 'Sarah & Daniyal', loc: 'Islamabad', img: 'https://i.pravatar.cc/200?img=45', stars: 5, story: 'Three matches in, I found exactly who I was looking for. Our first coffee date turned into a whole year together.' },
  { name: 'Hira & Bilal', loc: 'Lahore', img: 'https://i.pravatar.cc/200?img=44', stars: 4, story: 'The Game Club icebreakers made the first chat so easy. Before I knew it, we were planning our first date.' }
];

const INTEREST_ICONS = { Coffee: '☕', Travel: '✈️', Photography: '📸', Music: '🎧', Art: '🎨', Food: '🍜', Books: '📚', Movies: '🎬', Fitness: '🏋️', Tech: '💻', Cooking: '👩‍🍳', Dancing: '💃', Singing: '🎤', Hiking: '🥾', Fashion: '👗', Gaming: '🎮', Sports: '⚽', Yoga: '🧘', Reading: '📖', Animals: '🐾' };

/* ---------- State ---------- */
const state = {
  token: null, user: null, loggedIn: false,
  candidates: [], heroPicks: [],
  matches: [], matchIndex: 0,
  currentConvoId: null,
  activeGameId: null, gameTimer: null,
  notifs: [],
  filter: { age: 'all', location: 'all', interest: 'all', online: false, fresh: false },
  rtcConfig: null, rtc: null, incomingTicked: new Set()
};
const likedSet = new Set();

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (str) => String(str ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const icon = (name) => `${INTEREST_ICONS[name] || '✨'} ${name}`;
const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)];
const timeAgo = (iso) => {
  if (!iso) return '';
  const t = new Date(String(iso).replace(' ', 'T') + 'Z').getTime();
  if (isNaN(t)) return '';
  const s = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
};

function toast(msg, duration = 3000) {
  const stack = $('#toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = msg;
  stack.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 400); }, duration);
}

function ripple(e, btn) {
  const r = document.createElement('span');
  r.className = 'ripple';
  const rect = btn.getBoundingClientRect();
  r.style.left = (e.clientX - rect.left) + 'px';
  r.style.top = (e.clientY - rect.top) + 'px';
  btn.appendChild(r);
  setTimeout(() => r.remove(), 650);
}

function showModal(id) {
  const m = $(id);
  if (!m) return;
  m.classList.add('show');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  document.body.style.overflow = '';
  const m = $(id);
  if (m) m.classList.remove('show');
}

function overlayCss() {
  return 'position:fixed;inset:0;z-index:999;display:flex;align-items:center;justify-content:center;background:rgba(5,5,12,.72);backdrop-filter:blur(6px)';
}

function requireAuth(cb) {
  if (state.loggedIn && state.token) return cb();
  openAuth('login');
  const done = () => { document.removeEventListener('humsafar:login', done); cb(); };
  document.addEventListener('humsafar:login', done);
}

function handleApiError(err) {
  console.warn('[api]', err);
  if (err.status === 401) { toast('🔐 Session expired — please log in again.'); logout(false); openAuth('login'); return; }
  if (err.status >= 500) toast('⚠️ Server hiccup — please try again.');
  else toast(`⚠️ ${esc(err.message)}`);
}

/* ---------- API client ---------- */
async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) };
  const res = await fetch(API + path, { method: opts.method || (opts.body ? 'POST' : 'GET'), headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  let json = null;
  try { json = await res.json(); } catch { /* no body */ }
  if (!res.ok) {
    const err = new Error((json && json.message) || 'Request failed.');
    err.status = res.status; err.code = json && json.code; err.json = json;
    throw err;
  }
  return json;
}

/* ---------- Background / navbar ---------- */
function spawnBackground() {
  const container = $('#floatingHearts');
  if (!container) return;
  const hearts = ['♥', '♡', '🩷'];
  const spawn = () => {
    const isHeart = Math.random() > 0.35;
    const el = document.createElement('span');
    el.className = isHeart ? 'float-heart' : 'float-particle';
    if (isHeart) el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    el.style.left = (Math.random() * 100) + 'vw';
    el.style.animationDuration = (8 + Math.random() * 8) + 's';
    el.style.animationDelay = (Math.random() * 2) + 's';
    if (isHeart) el.style.fontSize = (11 + Math.random() * 14) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 18000);
  };
  for (let i = 0; i < 14; i++) spawn();
  setInterval(spawn, 900);
}

function setupNavbar() {
  const nav = $('#navbar');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#hamburger');
  const links = $('#navLinks');
  burger.addEventListener('click', () => { burger.classList.toggle('open'); links.classList.toggle('open'); });
  $$('.nav-links a', links).forEach((a) => a.addEventListener('click', () => { burger.classList.remove('open'); links.classList.remove('open'); }));

  const sections = $$('section[id]');
  const navAnchors = $$('.nav-links a');
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navAnchors.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach((s) => spy.observe(s));
}

/* ---------- Hero ---------- */
function renderHero() {
  const wrap = $('#heroProfiles');
  if (!wrap) return;
  wrap.innerHTML = '';
  const picks = state.heroPicks.slice(0, 3);
  if (!picks.length) {
    wrap.innerHTML = '<p style="color:var(--text-muted);text-align:center">Log in to meet people ✨</p>';
    return;
  }
  const rot = [-6, 3, 8];
  picks.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.style.setProperty('--r', rot[i] + 'deg');
    card.style.animationDelay = (-i * 2) + 's';
    const liked = likedSet.has(p.id);
    card.innerHTML = `
      <img src="${p.photo || 'https://i.pravatar.cc/400?img=44'}" alt="${esc(p.name)}">
      <div class="hero-card-body">
        <div class="hc-name"><span>${esc(p.name)}, ${p.age}</span>
          <button class="hero-heart-btn ${liked ? 'liked' : ''}" data-hero-like="${p.id}" aria-label="Like">${liked ? '✓' : '♥'}</button>
        </div>
        <div class="hc-loc">📍 ${esc(p.location || '')}</div>
        <span class="hc-status">${p.online ? 'Online' : 'Away'}</span>
      </div>`;
    wrap.appendChild(card);
  });
  wrap.onclick = (e) => {
    const btn = e.target.closest('[data-hero-like]');
    if (!btn) return;
    requireAuth(async () => {
      try {
        const j = await api('/interactions/likes', { body: { toUserId: +btn.dataset.heroLike } });
        likedSet.add(+btn.dataset.heroLike);
        btn.classList.add('liked'); btn.textContent = '✓';
        toast('💗 Liked! They may like you back.');
        if (j.data.matched) { showMatchCelebration(+btn.dataset.heroLike, state.candidates.find((c) => c.id === +btn.dataset.heroLike)); refreshMatchData(); }
      } catch (err) { handleApiError(err); }
    });
  };
}

/* ---------- Discover ---------- */
async function refreshDiscover() {
  if (!state.token) return;
  try {
    const q = new URLSearchParams();
    if (state.filter.age === '18-24') q.set('maxAge', 24);
    if (state.filter.age === '25-32') { q.set('minAge', 25); q.set('maxAge', 32); }
    if (state.filter.age === '33+') q.set('minAge', 33);
    if (state.filter.location !== 'all') q.set('location', state.filter.location);
    if (state.filter.interest !== 'all') q.set('interest', state.filter.interest);
    q.set('limit', 50);
    const j = await api('/discover?' + q.toString());
    state.candidates = j.data.candidates;
    if (!state.heroPicks.length && state.candidates.length) {
      state.heroPicks = [...state.candidates].sort((a, b) => b.score - a.score).slice(0, 4);
      renderHero();
    }
    renderDiscoverGrid(); renderPremiumGrid();
    if (state.matchIndex >= state.candidates.length) state.matchIndex = 0;
    renderMatchCard();
  } catch (err) { handleApiError(err); }
}

function renderDiscoverGrid() {
  const grid = $('#discoverGrid');
  if (!grid) return;
  const q = ($('#discoverSearch').value || '').toLowerCase();
  const list = state.candidates.filter((p) => !q || (p.name + ' ' + p.location + ' ' + (p.interests || []).join(' ')).toLowerCase().includes(q));
  grid.innerHTML = list.length ? list.map((p) => cardHTML(p)).join('') : emptyGrid('No one matches that search yet. Try widening it. ✨');
  bindGridActions(grid);
}

function renderPremiumGrid() {
  const grid = $('#premiumGrid');
  if (!grid) return;
  let list = [...state.candidates];
  if (state.filter.online) list = list.filter((p) => p.online);
  if (state.filter.fresh) list = list.slice(0, 6);
  grid.innerHTML = list.length ? list.map((p) => cardHTML(p, true)).join('') : emptyGrid('No one matches those filters yet. Try widening them. ✨');
  bindGridActions(grid);
}

const emptyGrid = (msg) => `<p class="profile-bio-mini" style="text-align:center;grid-column:1/-1;color:var(--text-muted)">${msg}</p>`;

function cardHTML(p, showScore) {
  return `
    <article class="profile-card" data-id="${p.id}">
      <div class="profile-media">
        <img src="${p.photo || 'https://i.pravatar.cc/400?img=44'}" alt="${esc(p.name)}" loading="lazy">
        ${p.score >= 4 ? '<span class="premium-badge">✨ Top Match</span>' : ''}
        <span class="online-dot ${p.online ? '' : 'offline'}"></span>
      </div>
      <div class="profile-body">
        <h3>${esc(p.name)}, ${p.age}</h3>
        <span class="profile-loc-line">📍 ${esc(p.location)}</span>
        ${showScore ? `<span class="profile-loc-line" style="color:var(--text-muted);font-size:.72rem">Match score: ${p.score}</span>` : ''}
        <p class="profile-bio-mini">"${esc(p.bio || '')}"</p>
        <div class="tag-row">${(p.interests || []).slice(0, 4).map((t) => `<span class="tag">${icon(t)}</span>`).join('')}</div>
        <div class="profile-actions-row">
          <button class="btn-pass" data-action="pass">✕ Pass</button>
          <button class="btn-like ${likedSet.has(p.id) ? 'liked' : ''}" data-action="like" data-id="${p.id}">${likedSet.has(p.id) ? '♥ Liked' : '♥ Like'}</button>
          <button class="btn-view" data-action="view">View</button>
        </div>
      </div>
    </article>`;
}

function bindGridActions(container) {
  container.onclick = async (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('.profile-card');
    const id = +btn.dataset.id;
    if (btn.dataset.action === 'like') {
      requireAuth(async () => {
        try {
          const j = await api('/interactions/likes', { body: { toUserId: id } });
          likedSet.add(id); renderHero(); renderDiscoverGrid(); renderPremiumGrid(); updateFavCount();
          toast('💗 Liked!');
          if (j.data.matched) { showMatchCelebration(id, state.candidates.find((c) => c.id === id)); refreshMatchData(); }
        } catch (err) { handleApiError(err); }
      });
    } else if (btn.dataset.action === 'pass') {
      requireAuth(async () => {
        try {
          await api('/interactions/passes', { body: { toUserId: id } });
          card.style.transform = 'translateX(-40%) scale(0.9)'; card.style.opacity = '0';
          setTimeout(() => { card.style.transform = ''; card.style.opacity = ''; }, 350);
          toast('👋 Passed');
          state.candidates = state.candidates.filter((c) => c.id !== id);
          renderDiscoverGrid(); renderPremiumGrid();
        } catch (err) { handleApiError(err); }
      });
    } else if (btn.dataset.action === 'view') {
      openProfileModal(id);
    }
  };
}

function openProfileModal(id) {
  requireAuth(async () => {
    try {
      const u = (await api('/users/' + id)).data.user;
      const overlay = document.createElement('div');
      overlay.className = 'modal-backdrop show';
      overlay.style.cssText = overlayCss();
      overlay.innerHTML = `
        <div class="modal glass" style="max-width:420px;width:min(92vw,420px);max-height:86vh;overflow:auto">
          <button class="modal-close" data-close>&times;</button>
          <div style="text-align:center">
            <img src="${u.photo || 'https://i.pravatar.cc/240?img=44'}" alt="${esc(u.name)}" style="width:110px;height:110px;border-radius:50%;object-fit:cover;border:2px solid var(--neon-pink)">
            <h3 style="margin:12px 0 4px">${esc(u.name)}, ${u.age}</h3>
            <span class="profile-loc">📍 ${esc(u.location)}</span>
            <div class="contact-status ${u.online ? 'online' : 'offline'}" style="margin-top:8px">${u.online ? '🟢 Online now' : '⚫ Away'}</div>
          </div>
          <p class="profile-bio" style="margin-top:14px;text-align:center">"${esc(u.bio || 'No bio yet.')}"</p>
          <div class="tag-row" style="justify-content:center">${(u.interests || []).map((t) => `<span class="tag">${icon(t)}</span>`).join('')}</div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-grad" style="flex:1" data-action="like">♥ Like</button>
            <button class="btn btn-glass" style="flex:1" data-close>Close</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', async (e) => {
        if (e.target.closest('[data-action="like"]')) {
          try {
            const j = await api('/interactions/likes', { body: { toUserId: id } });
            likedSet.add(id);
            if (j.data.matched) showMatchCelebration(id, state.candidates.find((c) => c.id === id));
            toast('💗 Liked!'); overlay.remove();
          } catch (err) { handleApiError(err); }
        } else if (e.target.closest('[data-close]') || e.target === overlay) overlay.remove();
      });
    } catch (err) { handleApiError(err); }
  });
}

/* ---------- Match swipe experience ---------- */
function renderMatchCard() {
  const card = $('#matchCard');
  if (!card || !state.candidates.length) return;
  if (state.matchIndex >= state.candidates.length) state.matchIndex = 0;
  const p = state.candidates[state.matchIndex];
  const img = $('#matchCard img');
  const info = card.querySelector('.match-info h3');
  const loc = card.querySelector('.match-info span');
  const meta = card.querySelector('.match-meta p');
  const tags = card.querySelector('.tag-row');
  if (!img || !info || !loc || !meta || !tags) return;
  card.style.transition = 'none'; card.style.opacity = '0'; card.style.transform = 'scale(0.92)';
  setTimeout(() => {
    img.src = p.photo || 'https://i.pravatar.cc/500?img=44'; img.alt = p.name;
    info.textContent = `${p.name}, ${p.age}`;
    loc.textContent = `📍 ${p.location}`;
    meta.textContent = `"${p.bio || ''}"`;
    tags.innerHTML = (p.interests || []).slice(0, 4).map((t) => `<span class="tag">${icon(t)}</span>`).join('');
    card.style.transition = ''; card.style.opacity = '1'; card.style.transform = 'scale(1)';
  }, 60);
}

function animateSwipe(dir) {
  const card = $('#matchCard');
  if (!card) return;
  card.classList.add(dir === 'right' ? 'swiped-right' : 'swiped-left');
  if (dir === 'right') heartBurst();
  setTimeout(() => { card.classList.remove('swiped-right', 'swiped-left'); if (state.matchIndex < state.candidates.length) state.matchIndex++; renderMatchCard(); }, 500);
}

function heartBurst() {
  const h = document.createElement('div');
  h.className = 'heart-burst'; h.textContent = '💗';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 900);
}

function setupMatch() {
  $('#btnPass').addEventListener('click', () => {
    const p = state.candidates[state.matchIndex];
    if (!p) return;
    requireAuth(async () => {
      try { await api('/interactions/passes', { body: { toUserId: p.id } }); animateSwipe('left'); toast('👋 Not your vibe'); }
      catch (err) { handleApiError(err); }
    });
  });
  $('#btnLike').addEventListener('click', () => {
    const p = state.candidates[state.matchIndex];
    if (!p) return;
    requireAuth(async () => {
      try {
        const j = await api('/interactions/likes', { body: { toUserId: p.id } });
        likedSet.add(p.id); animateSwipe('right');
        if (j.data.matched) { setTimeout(() => showMatchCelebration(p.id, p), 600); refreshMatchData(); }
      } catch (err) { handleApiError(err); }
    });
  });
  $('#btnSuper').addEventListener('click', () => {
    const p = state.candidates[state.matchIndex];
    if (!p) return;
    requireAuth(async () => {
      try {
        const j = await api('/interactions/super-likes', { body: { toUserId: p.id } });
        animateSwipe('right');
        toast(`⭐ Super liked <span class="pink">${esc(p.name)}</span>!`);
        if (j.data.matched) { setTimeout(() => showMatchCelebration(p.id, p), 600); refreshMatchData(); }
      } catch (err) { handleApiError(err); }
    });
  });
}

function showMatchCelebration(id, p) {
  if (!p) p = { name: 'Your match', photo: 'https://i.pravatar.cc/120?img=44' };
  const nameEl = $('#matchName'); const avatar = $('#matchAvatar');
  if (nameEl) nameEl.textContent = p.name;
  if (avatar) { avatar.src = p.photo || 'https://i.pravatar.cc/120?img=44'; avatar.alt = p.name; }
  showModal('#matchModal');
}

/* ---------- Dates ---------- */
function renderDates() {
  const grid = $('#datesGrid');
  if (!grid) return;
  grid.innerHTML = DATE_IDEAS.map((d) => `
    <article class="date-card">
      <div class="date-visual" style="background-image:url('${d.img}')"><span class="date-emoji">${d.emoji}</span></div>
      <div class="date-body">
        <h3>${esc(d.title)}</h3><p>${esc(d.desc)}</p>
        <div class="date-meta"><span>${d.loc}</span><span>${d.price}</span></div>
        <button class="btn btn-grad" data-date="${esc(d.title)}" data-emoji="${d.emoji}">Plan This Date ♥</button>
      </div>
    </article>`).join('');
  grid.onclick = (e) => {
    const btn = e.target.closest('[data-date]');
    if (!btn) return;
    requireAuth(openPlanDateModal(btn.dataset.date, btn.dataset.emoji));
  };
}

function openPlanDateModal(title, emoji) {
  return async () => {
    if (!state.matches.length) { toast('😅 You need a match first — keep liking!'); return; }
    const opts = state.matches.map((m) => `<option value="${m.user.id}">${esc(m.user.name)}</option>`).join('');
    const def = new Date(Date.now() + 86400000).toISOString().slice(0, 16);
    const overlay = document.createElement('div');
    overlay.className = 'modal-backdrop show';
    overlay.style.cssText = overlayCss();
    overlay.innerHTML = `
      <div class="modal glass" style="max-width:420px;width:min(92vw,420px)">
        <button class="modal-close" data-close>&times;</button>
        <div class="auth-emoji">${emoji}</div>
        <h3 style="text-align:center;margin-bottom:14px">Plan ${esc(title)}</h3>
        <div class="field"><label>With your match</label><select id="pdMatch">${opts}</select></div>
        <div class="field"><label>Date &amp; time</label><input type="datetime-local" id="pdWhen" value="${def}"></div>
        <div class="field"><label>Where (optional)</label><input type="text" id="pdLoc" placeholder="e.g. English Tea House, Lahore"></div>
        <button class="btn btn-grad btn-block" id="pdGo">Send Invite 🌹</button>
      </div>`;
    document.body.appendChild(overlay);
    overlay.addEventListener('click', async (e) => {
      if (e.target.closest('[data-close]') || e.target === overlay) overlay.remove();
    });
    const go = $('#pdGo');
    go.addEventListener('click', async () => {
      try {
        const whenEl = $('#pdWhen');
        const scheduledAt = whenEl ? new Date(whenEl.value).toISOString().replace('T', ' ').slice(0, 16) : new Date().toISOString().replace('T', ' ').slice(0, 16);
        await api('/dates', { body: { toUserId: +$('#pdMatch').value, title, scheduledAt, location: ($('#pdLoc') || {}).value || '' } });
        toast(`🌹 ${esc(title)} planned! Invite sent.`);
        overlay.remove();
      } catch (err) { handleApiError(err); }
    });
  };
}

/* ---------- Games (local + live) ---------- */
function renderGames() {
  const grid = $('#gamesGrid');
  if (!grid) return;
  grid.innerHTML = `
    <article class="game-card">
      <span class="game-icon">⭕</span><h3>Tic Tac Toe with a Match</h3>
      <p>Live multiplayer — challenge one of your matches to a quick game.</p>
      <span class="game-players">👥 2 players · online</span>
      <button class="btn btn-grad btn-sm" data-challenge>Challenge a Match</button>
    </article>` +
    Object.entries(SOLO_GAMES).map(([name, g]) => `
      <article class="game-card">
        <span class="game-icon">${g.emoji}</span><h3>${esc(name)}</h3>
        <p>${esc(g.desc)}</p>
        <span class="game-players">👥 ${g.players}</span>
        <button class="btn btn-grad btn-sm" data-game="${esc(name)}">Play Now</button>
      </article>`).join('');

  const start = $('#gameStartBtn');
  if (start) { start.hidden = true; start.style.display = 'none'; }

  grid.onclick = (e) => {
    if (e.target.closest('[data-challenge]')) { requireAuth(startLiveGame); return; }
    const btn = e.target.closest('[data-game]');
    if (!btn) return;
    const g = SOLO_GAMES[btn.dataset.game];
    $('#gameModalTitle').textContent = btn.dataset.game;
    $('#gameModalEmoji').textContent = g.emoji;
    $('#gameModalDesc').textContent = `👥 ${g.players} · ${g.desc}`;
    $('#gameQuestions').innerHTML = g.questions.map((q) => `<li>${esc(q)}</li>`).join('');
    showModal('#gameModal');
  };
}

async function startLiveGame() {
  if (!state.matches.length) { toast('😅 You need a match first!'); return; }
  const opts = state.matches.map((m) => `<option value="${m.user.id}">${esc(m.user.name)}</option>`).join('');
  const overlay = document.createElement('div');
  overlay.className = 'modal-backdrop show';
  overlay.style.cssText = overlayCss();
  overlay.innerHTML = `
    <div class="modal glass" style="max-width:420px;width:min(92vw,420px)">
      <button class="modal-close" data-close>&times;</button>
      <div class="auth-emoji">⭕</div>
      <h3 style="text-align:center;margin-bottom:14px">Challenge a Match</h3>
      <div class="field"><label>Choose your opponent</label><select id="gmMatch">${opts}</select></div>
      <button class="btn btn-grad btn-block" id="gmGo">Send Challenge 🎮</button>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target === overlay) overlay.remove(); });
  $('#gmGo').addEventListener('click', async () => {
    try {
      const j = await api('/games', { body: { toUserId: +$('#gmMatch').value, type: 'TICTACTOE' } });
      openTictactoe(j.data.game);
      overlay.remove();
    } catch (err) { handleApiError(err); }
  });
}

function openTictactoe(game) {
  state.activeGameId = game.id;
  const overlay = document.createElement('div');
  overlay.id = 'tttOverlay';
  overlay.className = 'modal-backdrop show';
  overlay.style.cssText = overlayCss() + ';background:rgba(5,5,12,.82)';
  overlay.innerHTML = `
    <div class="modal glass" style="max-width:360px;width:min(92vw,360px);text-align:center">
      <button class="modal-close" data-close>&times;</button>
      <div style="font-size:2rem">⭕</div>
      <h3>Tic Tac Toe</h3>
      <p class="match-hint" id="tttStatus">${game.state.myTurn ? 'Your turn — play ' + game.state.myMark : 'Waiting for opponent…'}</p>
      <div id="tttBoard" style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;max-width:260px;margin:0 auto 14px"></div>
      <button class="btn btn-glass btn-sm" id="tttQuit">Leave game</button>
    </div>`;
  document.body.appendChild(overlay);
  const boardEl = $('#tttBoard');
  for (let i = 0; i < 9; i++) {
    const c = document.createElement('button');
    c.className = 'btn btn-glass';
    c.style.cssText = 'font-size:1.6rem;padding:12px;min-height:68px';
    c.dataset.cell = i;
    c.addEventListener('click', () => makeMove(game.id, i));
    boardEl.appendChild(c);
  }
  overlay.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]') || e.target === overlay) { overlay.remove(); state.activeGameId = null; }
  });
  $('#tttQuit').addEventListener('click', () => { api('/games/' + game.id + '/abandon', { method: 'POST' }).catch(() => {}); overlay.remove(); state.activeGameId = null; });
  pollGame(game.id);
}

async function pollGame(gameId) {
  if (!state.activeGameId || state.activeGameId !== gameId) return;
  await new Promise((r) => setTimeout(r, 1600));
  try {
    const g = (await api('/games/' + gameId)).data.game;
    if (state.activeGameId !== gameId) return;
    const board = g.state.board || Array(9).fill(null);
    const cells = $$('#tttBoard button');
    cells.forEach((cell, i) => {
      const v = board[i];
      cell.textContent = v === 'X' || v === 'O' ? v : '';
      cell.disabled = !!v;
    });
    const status = $('#tttStatus');
    if (status) {
      if (g.status === 'FINISHED') status.textContent = g.winnerId ? (g.winnerId === (state.user && state.user.id) ? '🏆 You win!' : '😅 You lost. Rematch?') : '🤝 Draw!';
      else if (g.status === 'ABANDONED') status.textContent = 'Game abandoned.';
      else status.textContent = g.state.myTurn ? 'Your turn — play ' + g.state.myMark : 'Waiting for opponent…';
    }
  } catch { /* transient */ }
  pollGame(gameId);
}

async function makeMove(gameId, cell) {
  try {
    const mx = await api('/games/' + gameId + '/moves', { body: { mark: state.matchMark(gameId), cell } });
    void mx;
  } catch (err) {
    if (err.json && err.json.code === 'FORBIDDEN' && err.status === 403) { /* no auth */ }
    toast(err.status === 409 ? '⏳ Not your turn' : `⚠️ ${esc(err.message)}`);
  }
}
state.matchMark = () => null; // patched once a game is open

/* ---------- Calls (WebRTC via backend signaling) ---------- */
function renderCalls() {
  const grid = $('#callsGrid');
  if (!grid || !state.matches.length) {
    if (grid) grid.innerHTML = '<p class="profile-bio-mini" style="text-align:center;grid-column:1/-1;color:var(--text-muted)">Your matches appear here — like profiles to start calling. 💬</p>';
    return;
  }
  grid.innerHTML = state.matches.map((c) => `
    <article class="contact-card" data-call-peer="${c.user.id}">
      <div class="contact-avatar"><img src="${c.user.photo || 'https://i.pravatar.cc/80?img=44'}" alt="${esc(c.user.name)}"></div>
      <h3>${esc(c.user.name)}</h3>
      <span class="contact-status ${c.user.online ? 'online' : 'offline'}">${c.user.online ? '🟢 Online' : '⚫ Offline'}</span>
      <div class="contact-btns">
        <button class="btn btn-glass" data-calltype="audio" data-peer="${c.user.id}">📞 Voice</button>
        <button class="btn btn-outline" data-calltype="video" data-peer="${c.user.id}">🎥 Video</button>
      </div>
    </article>`).join('');
  grid.onclick = (e) => {
    const btn = e.target.closest('[data-calltype]');
    if (!btn) return;
    requireAuth(() => startCall(+btn.dataset.peer, btn.dataset.calltype));
  };
}

async function getRTC() {
  if (state.rtcConfig) return state.rtcConfig;
  try { state.rtcConfig = (await api('/config')).data; }
  catch { state.rtcConfig = { stun: 'stun:stun.l.google.com:19302', turn: null }; }
  return state.rtcConfig;
}

async function startCall(peerId, type) {
  if (state.rtc) { toast('A call is already active.'); return; }
  toast(`${type === 'video' ? '🎥 Video' : '📞 Voice'} call connecting…`);
  try {
    const j = await api('/calls', { body: { toUserId: peerId, type } });
    await waitForAccept(j.data.call, type);
  } catch (err) { handleApiError(err); }
}

async function waitForAccept(call, type) {
  const peer = state.matches.find((m) => m.user.id === call.calleeId);
  const seconds = 20;
  for (let i = 0; i < seconds; i++) {
    try {
      const hist = (await api('/calls')).data.history.find((c) => c.id === call.id);
      if (!hist) { toast('Call ended.'); return; }
      if (hist.status === 'ACCEPTED') return airMedia(hist, peer, type, true);
      if (hist.status === 'REJECTED') { toast('📵 Call declined.'); return; }
      if (hist.status === 'CANCELLED' || hist.status === 'MISSED') { toast('Call missed.'); return; }
    } catch { /* keep polling */ }
    await new Promise((r) => setTimeout(r, 1100));
  }
  await api('/calls/' + call.id + '/cancel', { method: 'POST' }).catch(() => {});
  toast('⌛ No answer — call missed.');
}

function buildCallUI(peer) {
  state.rtc = { peer: peer, video: true, muted: false, camHidden: false };
  const overlay = document.createElement('div');
  overlay.id = 'callOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;z-index:1000;background:rgba(8,8,16,.95);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;color:#fff;font-family:Poppins,sans-serif';
  overlay.innerHTML = `
    <div style="font-size:2rem">${state.rtc.video ? '🎥' : '📞'}</div>
    <h2 style="margin:0">${esc(peer ? peer.user.name : 'Humsafar Call')}</h2>
    <div id="rtcStatus" style="color:#a6a6bd">Connecting…</div>
    <div id="rtcStage" style="position:relative;width:min(92vw,560px);height:min(60vw,360px);background:#000;border-radius:20px;overflow:hidden">
      <video id="rtcRemote" autoplay playsinline style="width:100%;height:100%;object-fit:cover"></video>
      <video id="rtcLocal" autoplay playsinline muted style="position:absolute;width:120px;height:160px;object-fit:cover;right:10px;bottom:10px;border-radius:12px;border:2px solid var(--neon-pink)"></video>
      <div id="rtcAvatar" style="display:none;align-items:center;justify-content:center;width:100%;height:100%;font-size:4rem;background:linear-gradient(160deg,var(--grad-main))">💗</div>
    </div>
    <div style="display:flex;gap:14px">
      <button id="rtcMute" class="btn btn-glass">🔇 Mute</button>
      <button id="rtcCam" class="btn btn-glass">🙈 Hide Cam</button>
      <button id="rtcHang" class="btn btn-outline" style="border-color:var(--coral-red);color:var(--coral-red)">📵 End Call</button>
    </div>`;
  document.body.appendChild(overlay);
  $('#rtcMute').addEventListener('click', () => {
    if (state.rtc && state.rtc.stream) { const t = state.rtc.stream.getAudioTracks()[0]; if (t) { t.enabled = !t.enabled; $('#rtcMute').textContent = t.enabled ? '🔇 Mute' : '🔊 Unmute'; } }
  });
  $('#rtcCam').addEventListener('click', () => {
    if (state.rtc && state.rtc.stream) { const t = state.rtc.stream.getVideoTracks()[0]; if (t) { t.enabled = !t.enabled; $('#rtcCam').textContent = t.enabled ? '🙈 Hide Cam' : '👁 Show Cam'; } }
  });
  $('#rtcHang').addEventListener('click', () => endCall(true));
  return overlay;
}
function setCallStatus(t) { const s = $('#rtcStatus'); if (s) s.textContent = t; }
function setPeerBusy(b) { const t = $('#rtcStatus'); if (t) t.textContent = b ? 'Busy…' : 'Ringing…'; }

async function airMedia(call, peer, isCaller) {
  // Attach signaling loop then start media & offer
  const myType = call.type === 'video' ? { video: true, audio: true } : { audio: true };
  let stream = null;
  try {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      stream = await navigator.mediaDevices.getUserMedia(myType);
    }
  } catch { stream = null; }
  if (!stream && isCaller) { toast('🎥 Could not access camera/mic — call as voice only.'); }

  const cfg = await getRTC();
  const pc = new RTCPeerConnection({ iceServers: [{ urls: cfg.stun }].concat(cfg.turn ? [{ urls: cfg.turn, username: cfg.turnUser, credential: cfg.turnPass }] : []) });
  pc.onicecandidate = (ev) => { if (ev.candidate) api('/calls/' + call.id + '/signals', { method: 'POST', body: { packet: { kind: 'candidate', candidate: ev.candidate } } }).catch(() => {}); };
  pc.ontrack = (ev) => { const rm = $('#rtcRemote'); if (rm) { rm.srcObject = ev.streams[0]; rm.play().catch(() => {}); setCallStatus('Connected'); } };
  pc.onconnectionstatechange = () => {
    const s = pc.connectionState;
    if (s === 'connected') setCallStatus('Connected');
    if (s === 'failed' || s === 'disconnected') setCallStatus('Reconnecting…');
    if (s === 'closed') { endCall(false); }
  };

  state.rtc = Object.assign(state.rtc || {}, { pc, callId: call.id, stream, cursor: 0, isCaller, lastPacket: 0 });
  if ($('#callOverlay')) $('#callOverlay').remove();
  const overlay = buildCallUI(peer);
  if (stream) {
    const lv = $('#rtcLocal');
    if (lv) { lv.srcObject = stream; lv.play().catch(() => {}); }
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  }
  setCallStatus(isCaller ? 'Ringing…' : 'Connecting…');

  // signaling loop
  (async function loop() {
    if (!state.rtc || state.rtc.callId !== call.id) return;
    try {
      const j = await api('/calls/' + call.id + '/signals?after=' + state.rtc.cursor);
      for (const s of j.data.signals) {
        state.rtc.cursor = Math.max(state.rtc.cursor, s.id);
        const p = s.packet;
        if (!p) continue;
        if (p.kind === 'offer' && p.sdp) {
          await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
          const ans = await pc.createAnswer();
          await pc.setLocalDescription(ans);
          await api('/calls/' + call.id + '/signals', { method: 'POST', body: { packet: { kind: 'answer', sdp: pc.localDescription } } }).catch(() => {});
          setCallStatus('Ringing…');
        } else if (p.kind === 'answer' && p.sdp && pc.signalingState === 'have-local-offer') {
          await pc.setRemoteDescription(new RTCSessionDescription(p.sdp));
        } else if (p.kind === 'candidate' && p.candidate) {
          try { await pc.addIceCandidate(new RTCIceCandidate(p.candidate)); } catch { /* ignore */ }
        }
      }
    } catch { /* transient */ }
    setTimeout(loop, 900);
  })();

  if (isCaller) {
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await api('/calls/' + call.id + '/signals', { method: 'POST', body: { packet: { kind: 'offer', sdp: pc.localDescription } } }).catch(() => {});
    } catch { /* ignore */ }
  }
}

async function endCall(notifyServer) {
  const r = state.rtc;
  state.rtc = null;
  if (r && r.callId && notifyServer) api('/calls/' + r.callId + '/end', { method: 'POST' }).catch(() => {});
  if (r && r.pc) { try { r.pc.close(); } catch { /* */ } }
  if (r && r.stream) r.stream.getTracks().forEach((t) => t.stop());
  const o = $('#callOverlay'); if (o) o.remove();
  toast('📵 Call ended');
}

/* ---------- Incoming call watcher ---------- */
async function checkIncomingCalls() {
  if (!state.token || state.rtc) return;
  try {
    const j = await api('/calls/incoming');
    for (const c of j.data.incoming) {
      if (state.incomingTicked.has(c.id)) continue;
      state.incomingTicked.add(c.id);
      if (c.status === 'ACCEPTED') continue; // answered ourselves elsewhere
      const peer = { user: { id: c.callerId, name: c.peerName || 'Match', photo: c.peerPhoto } };
      const overlay = document.createElement('div');
      overlay.className = 'modal-backdrop show';
      overlay.style.cssText = overlayCss();
      overlay.innerHTML = `
        <div class="modal glass" style="max-width:360px;width:min(92vw,360px);text-align:center">
          <div class="auth-emoji">${c.type === 'video' ? '🎥' : '📞'}</div>
          <h3>Incoming call</h3>
          <p>${esc(peer.user.name)} is calling (${c.type})</p>
          <div style="display:flex;gap:12px;justify-content:center">
            <button class="btn btn-grad" id="incAccept">Accept</button>
            <button class="btn btn-outline" id="incDecline" style="border-color:var(--coral-red);color:var(--coral-red)">Decline</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      $('#incAccept').addEventListener('click', async () => {
        overlay.remove();
        try {
          await api('/calls/' + c.id + '/accept', { method: 'POST' });
          await airMedia(c, peer, false);
        } catch (err) { handleApiError(err); }
      });
      $('#incDecline').addEventListener('click', async () => { overlay.remove(); await api('/calls/' + c.id + '/reject', { method: 'POST' }).catch(() => {}); });
    }
  } catch { /* ignore */ }
}

/* ---------- Messages ---------- */
async function refreshChat() {
  if (!state.token) return;
  try {
    const j = await api('/matches');
    state.matches = j.data.matches;
    if (!state.currentConvoId && state.matches.length) { state.currentConvoId = state.matches[0].conversationId; }
    renderChatList();
    if (state.currentConvoId) renderChatWindow();
    const pending = state.matches.reduce((a, m) => a + (m.unread || 0), 0);
    $(`#chatList .chat-list-head`) && null;
  } catch (err) { if (err.status !== 401) console.warn('chat refresh', err); }
}

function renderChatList() {
  const list = $('#chatList');
  if (!list) return;
  list.innerHTML = '<div class="chat-list-head">Messages 💬</div>' +
    (state.matches.length ? state.matches.map((c, i) => `
      <div class="convo ${c.conversationId === state.currentConvoId ? 'active' : ''}" data-convo="${c.conversationId}" data-i="${i}">
        <div class="convo-avatar ${c.user.online ? '' : 'offline'}"><img src="${c.user.photo || 'https://i.pravatar.cc/80?img=44'}" alt="${esc(c.user.name)}"></div>
        <div class="convo-body">
          <div class="convo-name-time"><span class="convo-name">${esc(c.user.name)}</span><span class="convo-time">${timeAgo(c.last_message_at)}</span></div>
          <div class="convo-last">${esc(c.last_message || 'Say hi 👋')}</div>
        </div>
        ${c.unread ? `<span class="convo-unread">${c.unread}</span>` : ''}
      </div>`).join('') : '<p style="color:var(--text-muted);font-size:.85rem;padding:18px">No matches yet — keep liking! 💘</p>');
  list.onclick = (e) => {
    const el = e.target.closest('[data-convo]');
    if (!el) return;
    state.currentConvoId = +el.dataset.convo;
    renderChatList(); renderChatWindow();
  };
}

async function renderChatWindow() {
  const name = $('#chatName'); const avatar = $('#chatAvatar'); const body = $('#chatBody');
  const conv = state.matches.find((m) => m.conversationId === state.currentConvoId);
  if (name && conv) name.textContent = conv.user.name;
  if (avatar && conv) avatar.src = conv.user.photo || 'https://i.pravatar.cc/60?img=44';
  if (body && conv) {
    try {
      const j = await api('/conversations/' + state.currentConvoId + '/messages?limit=100');
      const ownId = state.user && state.user.id;
      body.innerHTML = j.data.messages.length
        ? j.data.messages.map((m) => `<div class="bubble ${m.senderId === ownId ? 'out' : 'in'}">${esc(m.body)}</div>`).join('')
        : '<p style="color:var(--text-muted);font-size:.85rem;text-align:center;padding:24px">Start the conversation 💬</p>';
      body.scrollTop = body.scrollHeight;
      // clear unread
      if (conv.unread) { api('/conversations/' + state.currentConvoId + '/read', { method: 'POST' }).catch(() => {}); conv.unread = 0; }
    } catch (err) { handleApiError(err); }
  }
}

function setupChatInput() {
  const input = $('#chatInput');
  const send = async () => {
    const text = input.value.trim();
    if (!text || !state.currentConvoId) return;
    try {
      await api('/conversations/' + state.currentConvoId + '/messages', { body: { body: text } });
      input.value = '';
      await renderChatWindow(); refreshChat();
      api('/conversations/' + state.currentConvoId + '/typing', { method: 'POST' }).catch(() => {});
    } catch (err) { handleApiError(err); }
  };
  $('#sendBtn').addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

function setupEmojiPop() {
  const btn = $('#emojiBtn');
  if (!btn) return;
  if (!$('.emoji-pop')) {
    const pop = document.createElement('div');
    pop.className = 'emoji-pop glass';
    pop.innerHTML = ['❤️', '😊', '😂', '😍', '🔥', '🥰', '✨', '😘', '🌹', '💫', '😉', '🫶'].map((e) => `<button type="button">${e}</button>`).join('') + `<button type="button">💌</button>`;
    btn.parentNode.appendChild(pop);
    pop.addEventListener('click', (e) => {
      const em = e.target.closest('button');
      if (!em) return;
      $('#chatInput').value += em.textContent;
      $('#chatInput').focus();
      pop.classList.remove('show');
    });
  }
  btn.addEventListener('click', (e) => { e.stopPropagation(); $('.emoji-pop').classList.toggle('show'); });
}

async function attachPhoto() {
  const fileInput = document.createElement('input');
  fileInput.type = 'file'; fileInput.accept = 'image/*'; fileInput.multiple = true;
  fileInput.onchange = async () => {
    const files = [...fileInput.files];
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('photos', f));
    const headers = { ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}) };
    const res = await fetch(API + '/users/me/photos', { method: 'POST', headers, body: fd });
    if (res.ok) { toast('📸 Photo added to your profile!'); refreshProfile(); }
    else { let m = 'Upload failed.'; try { m = (await res.json()).message; } catch { /* */ } toast(`⚠️ ${m}`); }
  };
  fileInput.click();
}

/* ---------- Filters ---------- */
function setupFilters() {
  const apply = () => { refreshDiscover(); };
  ['filterAge', 'filterLocation', 'filterInterest'].forEach((id) => {
    $(`#${id}`).addEventListener('change', (e) => {
      const map = { filterAge: 'age', filterLocation: 'location', filterInterest: 'interest' };
      state.filter[map[id]] = e.target.value;
      apply();
    });
  });
  $$('.filter-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.dataset.filter;
      if (key === 'online') state.filter.online = !state.filter.online;
      if (key === 'new') state.filter.fresh = !state.filter.fresh;
      chip.classList.toggle('active');
      apply();
    });
  });
}

/* ---------- Notifications ---------- */
async function refreshNotifications() {
  if (!state.token) return;
  try {
    const j = await api('/notifications');
    state.notifs = j.data.notifications;
    const unread = j.data.unreadCount;
    const dot = $('#notifPanel .notif-dot') || document.querySelector('#notifBtn .notif-dot');
    if (dot) dot.style.display = unread ? 'block' : 'none';
    const list = $('#notifList');
    if (!list) return;
    list.innerHTML = state.notifs.length
      ? state.notifs.map((n) => `<div class="notif-item"><span class="ni-emoji">${notifEmoji(n.type)}</span><div><div class="ni-text">${esc(n.title)} — ${esc(n.body)}</div><div class="ni-time">${timeAgo(n.createdAt)}</div></div></div>`).join('')
      : '<p style="color:var(--text-muted);font-size:.85rem">Nothing yet. 💤</p>';
  } catch { /* ignore */ }
}
function notifEmoji(t) {
  return { LIKE: '💗', SUPER_LIKE: '⭐', MATCH: '💕', MESSAGE: '💬', CALL: '📞', DATE: '🌹', GAME: '🎮' }[t] || '🔔';
}

/* ---------- Favorites / likers ---------- */
function updateFavCount() { const el = $('#favCount'); if (el) el.textContent = likedSet.size; }

async function refreshFavorites() {
  if (!state.token) return;
  try {
    const panel = $('#favList');
    if (!panel) return;
    panel.innerHTML = '<p style="color:var(--text-muted);font-size:.85rem">Loading…</p>';
    const j = await api('/interactions/likers');
    likedSet.clear();
    j.data.likers.forEach((l) => likedSet.add(l.id));
    panel.innerHTML = j.data.likers.length
      ? j.data.likers.map((l) => `<div class="fav-item"><img src="${l.photo || 'https://i.pravatar.cc/80?img=44'}" alt="${esc(l.name)}"><div>${esc(l.name)} likes you 💗<br><span style="color:var(--text-muted);font-size:.76rem">${esc(l.location || '')} · ${timeAgo(l.created_at)}</span></div></div>`).join('')
      : '<p style="color:var(--text-muted);font-size:.85rem">No one has liked you yet — hang tight! 💫</p>';
    updateFavCount();
    renderHero(); renderDiscoverGrid(); renderPremiumGrid();
  } catch { /* ignore */ }
}

function setupPanels() {
  $('#notifBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#notifPanel').classList.toggle('show');
    $('#favPanel').classList.remove('show');
  });
  $('#heartBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('#favPanel').classList.toggle('show');
    $('#notifPanel').classList.remove('show');
  });
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.notif-panel') && !e.target.closest('#notifBtn')) $('#notifPanel').classList.remove('show');
    if (!e.target.closest('.fav-panel') && !e.target.closest('#heartBtn')) $('#favPanel').classList.remove('show');
  });
}

/* ---------- Profile page ---------- */
function setupProfilePage() {
  $$('.tab-btn').forEach((btn) => btn.addEventListener('click', () => {
    $$('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.tab-panel').forEach((p) => p.classList.remove('active'));
    const target = $('#tab-' + btn.dataset.tab);
    if (target) target.classList.add('active');
  }));
}

async function refreshProfile() {
  if (!state.token) return;
  try {
    const u = (await api('/users/me')).data.user;
    state.user = u;
    const avatar = $('#avatarMini img'); if (avatar) avatar.src = u.photo || 'https://i.pravatar.cc/80?img=44';
    const pa = $('.profile-avatar'); if (pa) pa.src = u.photo || 'https://i.pravatar.cc/240?img=44';
    const nameEl = $('.profile-name-row h2'); if (nameEl) nameEl.innerHTML = `${esc(u.name)} <span class="online-text">${u.online ? '🟢 Online' : '⚫ Away'}</span>`;
    const locEl = $('.profile-loc'); if (locEl) locEl.textContent = `📍 ${u.location}, Pakistan`;
    const bio = $('#tab-about .profile-bio'); if (bio) bio.textContent = `"${u.bio || 'Tell people about you…'}"`;
    const facts = $('#tab-about .profile-facts'); if (facts) facts.innerHTML =
      `<div><strong>Age:</strong> ${u.age}</div>
       <div><strong>Height:</strong> ${u.height ? u.height + 'cm' : '—'}</div>
       <div><strong>Job:</strong> ${esc(u.occupation || '—')}</div>
       <div><strong>Looking for:</strong> ${esc(u.relationship_pref || '—')}</div>`;
    const photos = $('#tab-photos .photo-grid'); if (photos) photos.innerHTML = (u.photos && u.photos.length)
      ? u.photos.map((p, i) => `<div class="photo-tile" style="background-image:url('${p.url}')"></div>`).join('') + '<div class="photo-tile add-photo">+</div>'
      : '<div class="photo-tile add-photo">+</div>';
    const phAdd = $('#tab-photos .add-photo'); if (phAdd) phAdd.onclick = () => attachPhoto();
    const interests = $('#tab-interests .tag-row'); if (interests) interests.innerHTML = (u.interests || []).map((t) => `<span class="tag">${icon(t)}</span>`).join('') || '<span class="tag">✨ Add interests</span>';
  } catch (err) { if (err.status !== 401) console.warn('profile', err); }
}

/* ---------- Auth ---------- */
let signupStep = 0;
let selectedGender = null;
let selectedLook = null;

function openAuth(view = 'login') {
  showModal('#authModal');
  splitAuthViews(view);
}

function splitAuthViews(view) {
  $('#loginView').hidden = view !== 'login';
  $('#registerView').hidden = view !== 'register';
  $('#loginView').style.display = view === 'login' ? '' : 'none';
  $('#registerView').style.display = view === 'register' ? '' : 'none';
}

async function completeLogin() {
  state.loggedIn = true;
  closeModal('#authModal');
  toast('🎉 Welcome back to <span class="pink">Humsafar</span>!');
  const login = $('#navLoginBtn'); const signup = $('#navSignupBtn');
  if (login) { login.textContent = 'Logged In'; login.href = '#'; }
  if (signup) signup.style.display = 'none';
  document.dispatchEvent(new CustomEvent('humsafar:login'));
  await Promise.all([refreshDiscover(), refreshChat(), refreshNotifications(), refreshFavorites(), refreshProfile()]).catch(() => {});
  renderCalls(); renderHero();
}

function logout(markOffline = true) {
  const hadToken = !!state.token;
  if (markOffline && hadToken) api('/auth/logout', { method: 'POST' }).catch(() => {});
  state.token = null; state.user = null; state.loggedIn = false;
  state.candidates = []; state.heroPicks = []; state.matches = [];
  likedSet.clear();
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* */ }
  const login = $('#navLoginBtn'); const signup = $('#navSignupBtn');
  if (login) { login.textContent = 'Login'; login.href = '#'; }
  if (signup) signup.style.display = '';
  const avatar = $('#avatarMini img'); if (avatar) avatar.src = 'https://i.pravatar.cc/80?img=12';
  renderHero(); renderDiscoverGrid(); renderPremiumGrid(); renderChatList();
  toast('👋 Logged out. See you soon!');
}

function setupAuth() {
  $('#navLoginBtn').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.loggedIn) { logout(); return; }
    openAuth('login');
  });
  $('#navSignupBtn').addEventListener('click', (e) => { e.preventDefault(); openAuth('register'); });

  $$('[data-auth-switch]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); splitAuthViews(a.dataset.authSwitch === 'login' ? 'login' : 'register'); }));

  $('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const pass = $('#loginPass').value;
    const err = $('#loginError');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent = 'Please enter a valid email.'; return; }
    if (pass.length < 6) { err.textContent = 'Password must be at least 6 characters.'; return; }
    err.textContent = '';
    try {
      const j = await api('/auth/login', { body: { email, password: pass } });
      setTokenProxy(j.data.token);
      await completeLogin();
    } catch (err2) { err.textContent = err2.message; }
  });

  $('#signupNext').addEventListener('click', () => {
    if (signupStep === 0) {
      const ok = $('#suName').value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#suEmail').value.trim()) && $('#suPass').value.length >= 6;
      if (!ok) { $('#signupError').textContent = 'Fill name, a valid email and a 6+ char password.'; return; }
    }
    if (signupStep === 1) {
      const age = +$('#suAge').value;
      if (!age || age < 18 || age > 99) { $('#signupError').textContent = 'You must be 18 or older to join Humsafar.'; return; }
      if (!selectedGender) { $('#signupError').textContent = 'Please pick a gender.'; return; }
    }
    if (signupStep === 2 && !selectedLook) { $('#signupError').textContent = 'Pick what you\'re looking for.'; return; }
    $('#signupError').textContent = '';
    if (signupStep < 2) { signupStep++; updateSignupProgress(); }
  });

  $('#signupBack').addEventListener('click', () => { if (signupStep > 0) { signupStep--; updateSignupProgress(); } });

  $$('[data-gender]').forEach((btn) => btn.addEventListener('click', () => {
    selectedGender = btn.textContent;
    $$('[data-gender]').forEach((b) => b.classList.toggle('active', b === btn));
  }));
  $$('[data-look]').forEach((btn) => btn.addEventListener('click', () => {
    selectedLook = btn.textContent;
    $$('[data-look]').forEach((b) => b.classList.toggle('active', b === btn));
  }));

  $('#signupForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (signupStep < 2) return;
    if (!selectedLook) { $('#signupError').textContent = 'Pick what you\'re looking for.'; return; }
    $('#signupError').textContent = '';
    const age = +$('#suAge').value;
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - age);
    const dobStr = dob.toISOString().slice(0, 10);
    try {
      const j = await api('/auth/register', {
        body: {
          name: $('#suName').value.trim(), email: $('#suEmail').value.trim(),
          password: $('#suPass').value, dob: dobStr, gender: selectedGender,
          location: $('#suCity').value
        }
      });
      setTokenProxy(j.data.token);
      // Extra profile details from step 2
      await api('/users/me', { method: 'PUT', body: { relationship_pref: selectedLook, bio: `New to Humsafar — say hi!` } }).catch(() => {});
      // backend shows verify link in dev/mock mode — surface as toast
      if (j.data.verifyUrl) toast(`📧 Check your inbox (mock): ${esc(j.data.verifyUrl)}`);
      $('#signupForm').reset();
      signupStep = 0; selectedGender = null; selectedLook = null; updateSignupProgress();
      await completeLogin();
    } catch (err) { $('#signupError').textContent = err.message || 'Signup failed.'; }
  });
}

function updateSignupProgress() {
  $$('.signup-step').forEach((s) => { s.hidden = +s.dataset.step !== signupStep; s.style.display = +s.dataset.step === signupStep ? '' : 'none'; });
  $('#signupBack').hidden = signupStep === 0;
  $('#signupBack').style.display = signupStep === 0 ? 'none' : '';
  $('#signupNext').hidden = signupStep === 2;
  $('#signupNext').style.display = signupStep === 2 ? 'none' : '';
  $('#signupSubmit').hidden = signupStep !== 2;
  $('#signupSubmit').style.display = signupStep !== 2 ? 'none' : '';
  $$('#signupDots span').forEach((d, i) => d.classList.toggle('active', i === signupStep));
}

/* ---------- Reveal / counters / testimonials ---------- */
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); io.unobserve(entry.target); } });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
}

function setupCounters() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = +el.dataset.target;
      const suffix = el.dataset.suffix || '';
      const dur = 2000;
      const start = performance.now();
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString('en-PK') + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
      io.unobserve(el);
    });
  }, { threshold: 0.4 });
  $$('.counter').forEach((el) => io.observe(el));
}

function setupModalsClose() {
  $$('#authModal, #gameModal, #matchModal').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop || e.target.closest('[data-close-modal]')) {
        closeModal('#' + backdrop.id);
        resetSignup();
      }
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      ['#authModal', '#gameModal', '#matchModal'].forEach((id) => closeModal(id));
      resetSignup();
    }
  });
}

function resetSignup() {
  signupStep = 0; selectedGender = null; selectedLook = null;
  updateSignupProgress();
  if ($('#signupError')) $('#signupError').textContent = '';
}

function renderTestimonials() {
  const grid = $('#storiesGrid');
  if (!grid) return;
  grid.innerHTML = TESTIMONIALS.map((t) => `
    <article class="testimonial-card reveal">
      <div class="testimonial-head">
        <img src="${t.img}" alt="${esc(t.name)}">
        <div><h4>${esc(t.name)}</h4><span class="loc">📍 ${esc(t.loc)}</span><div class="stars">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</div></div>
      </div>
      <p>“${esc(t.story)}”</p>
    </article>`).join('');
}

/* ---------- Profile page actions (like/msg/call on your own card) ---------- */
function bindProfileActions() {
  const btn = (sel) => $(sel);
  const like = btn('[data-like]'); const msg = btn('[data-msg]'); const call = btn('[data-call]'); const sup = btn('[data-super]');
  if (like) like.addEventListener('click', () => requireAuth(() => { toast('💗 Head to Discover or Match to like people!'); }));
  if (sup) sup.addEventListener('click', () => requireAuth(() => { toast('⭐ Use the Super Like button in the Match section!'); }));
  if (msg) msg.addEventListener('click', () => requireAuth(() => { if (state.matches.length) { location.hash = '#messages'; toast('💬 Opening messages…'); } else toast('You need a match to chat.'); }));
  if (call) call.addEventListener('click', () => requireAuth(() => { if (state.matches.length) { location.hash = '#calls'; toast('📞 Pick a match to call from the Calls section!'); } else toast('You need a match to call.'); }));
}

/* ---------- Auto session restore ---------- */
async function restoreSession() {
  let token = '';
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch { /* */ }
  if (!token) return;
  setTokenProxy(token);
  try {
    const j = await api('/auth/me');
    state.user = j.data.user;
    state.loggedIn = true;
    state.token = token;
    const login = $('#navLoginBtn'); const signup = $('#navSignupBtn');
    if (login) { login.textContent = 'Logged In'; login.href = '#'; }
    if (signup) signup.style.display = 'none';
    document.dispatchEvent(new CustomEvent('humsafar:login'));
    await Promise.all([refreshDiscover(), refreshChat(), refreshNotifications(), refreshFavorites(), refreshProfile()]).catch(() => {});
    renderCalls(); renderHero();
  } catch {
    logout(false);
  }
}

/* ---------- Background polling ---------- */
function startPolling() {
  setInterval(() => {
    if (!state.token) return;
    checkIncomingCalls().catch(() => {});
  }, 2500);
  setInterval(() => {
    if (!state.token) return;
    refreshNotifications().catch(() => {});
    if (state.rtc) refreshChat().catch(() => {}); // keep convos fresh while in call
  }, 5000);
  setInterval(() => {
    if (!state.token || state.rtc) return;
    refreshChat().catch(() => {});
  }, 6000);
}

/* ---------- Session-pollers for match data ---------- */
async function refreshMatchData() { refreshChat().catch(() => {}); }

/* ---------- Init ---------- */
function init() {
  spawnBackground();
  $$('.btn').forEach((btn) => btn.addEventListener('click', (e) => ripple(e, btn)));
  renderHero();
  renderDiscoverGrid();
  renderPremiumGrid();
  renderDates();
  renderGames();
  renderCalls();
  renderChatList();
  renderTestimonials();
  setupNavbar();
  setupMatch();
  setupChatInput();
  setupEmojiPop();
  setupFilters();
  setupPanels();
  setupProfilePage();
  setupAuth();
  setupReveal();
  setupCounters();
  setupModalsClose();
  bindProfileActions();
  updateFavCount();

  $('#discoverSearch').addEventListener('input', () => renderDiscoverGrid());
  $('#attachBtn').addEventListener('click', () => requireAuth(attachPhoto));
  $('#avatarMini').addEventListener('click', () => {
    if (!state.loggedIn) requireAuth();
    window.location.hash = '#profile';
  });
  $('a[data-nav-home]') && $('a[data-nav-home]').addEventListener('click', () => { if (state.loggedIn) refreshMatchData(); });

  restoreSession();
  startPolling();
}

document.addEventListener('DOMContentLoaded', init);