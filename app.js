/* =====================================================================
   HUMSAFAR — Frontend Interactions & Data
   Vanilla JS only.
   ===================================================================== */
'use strict';

/* ---------- Mock data ---------- */
const PROFILES = [
  { name: 'Ayesha', age: 24, city: 'Karachi', img: 'https://i.pravatar.cc/400?img=47', online: true, premium: true, new: true, bio: 'Coffee lover, traveler & photography enthusiast.', tags: ['☕ Coffee', '✈️ Travel', '📸 Photography'] },
  { name: 'Sarah', age: 23, city: 'Islamabad', img: 'https://i.pravatar.cc/400?img=45', online: true, premium: true, bio: 'I love long walks, coffee and late-night talks.', tags: ['☕ Coffee', '📚 Books', '🎧 Music'] },
  { name: 'Hira', age: 26, city: 'Lahore', img: 'https://i.pravatar.cc/400?img=44', online: false, bio: 'Artist & dreamer. Looking for someone to paint life with.', tags: ['🎨 Art', '🎬 Films', '🌙 Night walks'] },
  { name: 'Zara', age: 22, city: 'Multan', img: 'https://i.pravatar.cc/400?img=43', online: true, new: true, bio: 'Foodie on a mission. Let\'s explore the best spots.', tags: ['🍜 Food', '✈️ Travel', '📸 Photography'] },
  { name: 'Mahnoor', age: 25, city: 'Karachi', img: 'https://i.pravatar.cc/400?img=32', online: false, premium: true, bio: 'Doctor by day, bookworm by night.', tags: ['📚 Books', '☕ Coffee', '🎧 Music'] },
  { name: 'Eman', age: 27, city: 'Islamabad', img: 'https://i.pravatar.cc/400?img=26', online: true, bio: 'Software engineer who codes and dances like nobody is watching.', tags: ['💻 Tech', '🎧 Music', '🏃‍♀️ Fitness'] },
  { name: 'Noor', age: 24, city: 'Lahore', img: 'https://i.pravatar.cc/400?img=40', online: false, bio: 'Tea enthusiast, sunset chaser.', tags: ['☕ Coffee', '📸 Photography', '✈️ Travel'] },
  { name: 'Sana', age: 29, city: 'Rawalpindi', img: 'https://i.pravatar.cc/400?img=29', online: true, premium: true, new: true, bio: 'Entrepreneur with a soft spot for old movies.', tags: ['🎬 Films', '🎨 Art', '🍜 Food'] },
  { name: 'Maria', age: 21, city: 'Karachi', img: 'https://i.pravatar.cc/400?img=31', online: true, new: true, bio: 'Student, singer and professional laugher.', tags: ['🎤 Singing', '🎧 Music', '🌙 Night walks'] }
];

const DATES = [
  { emoji: '🍽️', img: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=700&q=80', title: 'Romantic Dinner', desc: 'Enjoy a cozy dinner with your special someone.', loc: '📍 Clifton, Karachi', price: 'Rs. 5,000' },
  { emoji: '☕', img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=700&q=80', title: 'Coffee Date', desc: 'Warm drinks, deeper talks and good vibes.', loc: '📍 Gulberg, Lahore', price: 'Rs. 1,500' },
  { emoji: '🌊', img: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=700&q=80', title: 'Beach Walk', desc: 'Sand, sea breeze and honest conversations.', loc: '📍 Sea View, Karachi', price: 'Free' },
  { emoji: '🎬', img: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=700&q=80', title: 'Movie Night', desc: 'A good film and an even better companion.', loc: '📍 Centaurus, Islamabad', price: 'Rs. 2,000' },
  { emoji: '🏞️', img: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=700&q=80', title: 'Adventure Date', desc: 'Hike, climb, explore — for the bold.', loc: '📍 Margalla Hills', price: 'Rs. 1,200' },
  { emoji: '🧺', img: 'https://images.unsplash.com/photo-1522426266218-ba48b1f6c63f?w=700&q=80', title: 'Picnic', desc: 'Baskets, blankets and golden-hour talks.', loc: '📍 Jilani Park, Lahore', price: 'Rs. 800' },
  { emoji: '🎲', img: 'https://images.unsplash.com/photo-1529453253035-1b3a4e3b20e2?w=700&q=80', title: 'Game Night', desc: 'Board games, snacks and playful rivalry.', loc: '📍 Game Zone, Karachi', price: 'Rs. 1,000' }
];

const GAMES = {
  'Truth or Dare': { emoji: '🎭', desc: 'Spicy questions and daring dares to break the ice.', players: '2–6 players', questions: ['What\'s your most embarrassing moment?', 'If you could kiss anyone here, who?', 'Sing your favourite song out loud!'] },
  'Would You Rather': { emoji: '🔀', desc: 'Impossible choices that reveal everything.', players: '2–8 players', questions: ['Dinner date or travel date?', 'Texting all day or calls at night?', 'Movie night or game night?'] },
  '20 Questions': { emoji: '❓', desc: 'Guess the secret — one question at a time.', players: '2 players', questions: ['Think of a place you love', 'Think of a movie you like', 'Think of a food you crave'] },
  'Couple Quiz': { emoji: '💞', desc: 'Find out how much you know about each other.', players: '2 players', questions: ['What\'s their favourite season?', 'What do they order first at a café?', 'What\'s their dream destination?'] },
  'Emoji Challenge': { emoji: '😜', desc: 'Describe it without words — only emojis.', players: '2–6 players', questions: ['Act out: a proposal', 'Act out: first date nerves', 'Act out: airport goodbye'] },
  'Love Trivia': { emoji: '💘', desc: 'Fun facts and flirty questions about love.', players: '2–8 players', questions: ['What scent is most romantic?', 'Best first-date location?', 'Fastest way to someone\'s heart?'] }
};

const CALLS = [
  { name: 'Sarah', age: 23, img: 'https://i.pravatar.cc/200?img=45', online: true },
  { name: 'Ayesha', age: 24, img: 'https://i.pravatar.cc/200?img=47', online: true },
  { name: 'Hira', age: 26, img: 'https://i.pravatar.cc/200?img=44', online: false },
  { name: 'Zara', age: 22, img: 'https://i.pravatar.cc/200?img=43', online: true },
  { name: 'Mahnoor', age: 25, img: 'https://i.pravatar.cc/200?img=32', online: false },
  { name: 'Eman', age: 27, img: 'https://i.pravatar.cc/200?img=26', online: true }
];

const CONVOS = [
  { id: 1, name: 'Sarah', img: 'https://i.pravatar.cc/80?img=45', online: true, time: '2m', last: 'Hey! How was your day? ❤️', unread: 2, msgs: [
    { from: 'in', text: 'Hey! How was your day? ❤️' },
    { from: 'out', text: 'Honestly better now that you texted 😄' },
    { from: 'in', text: 'Aww, you always say the right things' },
    { from: 'out', text: 'Only for you 😌 What about yours?' }
  ]},
  { id: 2, name: 'Ayesha', img: 'https://i.pravatar.cc/80?img=47', online: true, time: '1h', last: 'Sent you a photo 📸', unread: 0, msgs: [
    { from: 'out', text: 'Your photography is unreal btw' },
    { from: 'in', text: 'That sunset pic? It was you-inspired 🌅' },
    { from: 'in', text: 'Sent you a photo 📸' }
  ]},
  { id: 3, name: 'Zara', img: 'https://i.pravatar.cc/80?img=43', online: false, time: '3h', last: 'We should try that new café!', unread: 0, msgs: [
    { from: 'in', text: 'We should try that new café!' },
    { from: 'out', text: 'Say when and I\'m there 😉' }
  ]},
  { id: 4, name: 'Mahnoor', img: 'https://i.pravatar.cc/80?img=32', online: false, time: 'Yesterday', last: 'Good night 🌙', unread: 0, msgs: [
    { from: 'in', text: 'Good night 🌙' },
    { from: 'out', text: 'Sweet dreams ✨' }
  ]}
];

const TESTIMONIALS = [
  { name: 'Ayesha & Hamza', loc: 'Karachi', img: 'https://i.pravatar.cc/200?img=47', stars: 5, story: 'I joined Humsafar just to meet new people. I never expected to find someone who understood me so well.' },
  { name: 'Sarah & Daniyal', loc: 'Islamabad', img: 'https://i.pravatar.cc/200?img=45', stars: 5, story: 'Three matches in, I found exactly who I was looking for. Our first coffee date turned into a whole year together.' },
  { name: 'Hira & Bilal', loc: 'Lahore', img: 'https://i.pravatar.cc/200?img=44', stars: 4, story: 'The Game Club icebreakers made the first chat so easy. Before I knew it, we were planning our first date.' }
];

const NOTIFICATIONS = [
  { emoji: '💗', text: 'Sarah super liked your profile!', time: '2m ago' },
  { emoji: '💬', text: 'Ayesha sent you a message.', time: '1h ago' },
  { emoji: '🎉', text: 'New match: Zara liked you back!', time: '3h ago' },
  { emoji: '✨', text: 'Your profile got 12 views today.', time: '5h ago' }
];

/* ---------- State ---------- */
const state = {
  favorites: new Set(),
  currentMatchIndex: 0,
  currentConvo: 0,
  filter: { age: 'all', location: 'all', interest: 'all', online: false, fresh: false },
  loggedIn: false
};

/* ---------- Helpers ---------- */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (str) => String(str).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function toast(msg, duration = 2600) {
  const stack = $('#toastStack');
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
  const m = $(id);
  if (!m) return;
  m.classList.remove('show');
  document.body.style.overflow = '';
}

/* ---------- Ripple on all .btn ---------- */
$$('.btn').forEach((btn) => btn.addEventListener('click', (e) => ripple(e, btn)));

/* ---------- Animated background ---------- */
function spawnBackground() {
  const container = $('#floatingHearts');
  if (!container) return;
  const hearts = ['♥', '♡', '🩷'];
  let count = 0;
  const spawn = () => {
    const isHeart = Math.random() > 0.35;
    const el = document.createElement('span');
    el.className = isHeart ? 'float-heart' : 'float-particle';
    if (isHeart) el.textContent = hearts[Math.floor(Math.random() * hearts.length)];
    el.style.left = Math.random() * 100 + 'vw';
    el.style.animationDuration = (8 + Math.random() * 8) + 's';
    el.style.animationDelay = (Math.random() * 2) + 's';
    if (isHeart) el.style.fontSize = (11 + Math.random() * 14) + 'px';
    container.appendChild(el);
    setTimeout(() => el.remove(), 18000);
    count++;
  };
  for (let i = 0; i < 14; i++) spawn();
  setInterval(spawn, 900);
}

/* ---------- Navbar scroll ---------- */
function setupNavbar() {
  const nav = $('#navbar');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 20);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const burger = $('#hamburger');
  const links = $('#navLinks');
  burger.addEventListener('click', () => {
    burger.classList.toggle('open');
    links.classList.toggle('open');
  });
  $$('.nav-links a', links).forEach((a) => a.addEventListener('click', () => {
    burger.classList.remove('open');
    links.classList.remove('open');
  }));

  /* active link highlight on scroll */
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

/* ---------- Hero profile cards ---------- */
function renderHero() {
  const wrap = $('#heroProfiles');
  const picks = [PROFILES[1], PROFILES[0], PROFILES[4]];
  const rot = [-6, 3, 8];
  picks.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'hero-card';
    card.style.setProperty('--r', rot[i] + 'deg');
    card.style.animationDelay = (-i * 2) + 's';
    card.innerHTML = `
      <img src="${p.img}" alt="${esc(p.name)}">
      <div class="hero-card-body">
        <div class="hc-name">
          <span>${esc(p.name)}, ${p.age}</span>
          <button class="hero-heart-btn" data-hero-like="${esc(p.name)}" aria-label="Like">♥</button>
        </div>
        <div class="hc-loc">📍 ${esc(p.city)}</div>
        <span class="hc-status">Online</span>
      </div>`;
    wrap.appendChild(card);
  });

  wrap.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-hero-like]');
    if (!btn) return;
    const name = btn.dataset.heroLike;
    btn.classList.add('liked');
    btn.textContent = '✓';
    if (state.favorites.has(name)) state.favorites.delete(name);
    else state.favorites.add(name);
    updateFavCount();
    toast(`💗 You liked <span class="pink">${esc(name)}</span>!`);
    pushNotification({ emoji: '💗', text: `${name} liked you back!`, time: 'Just now' });
  });
}

/* ---------- Discover grid ---------- */
function renderDiscover() {
  const grid = $('#discoverGrid');
  const q = ($('#discoverSearch').value || '').toLowerCase();
  const list = PROFILES.filter((p) =>
    !q || (p.name + ' ' + p.city + ' ' + p.tags.join(' ')).toLowerCase().includes(q)
  );
  grid.innerHTML = list.map(cardHTML).join('');
  bindCardActions('#discoverGrid');
}

function cardHTML(p) {
  return `
    <article class="profile-card" data-name="${esc(p.name)}">
      <div class="profile-media">
        <img src="${p.img}" alt="${esc(p.name)}" loading="lazy">
        ${p.premium ? '<span class="premium-badge">✨ Premium</span>' : ''}
        <span class="online-dot ${p.online ? '' : 'offline'}"></span>
      </div>
      <div class="profile-body">
        <h3>${esc(p.name)}, ${p.age}</h3>
        <span class="profile-loc-line">📍 ${esc(p.city)}</span>
        <p class="profile-bio-mini">"${esc(p.bio)}"</p>
        <div class="tag-row">${p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>
        <div class="profile-actions-row">
          <button class="btn-pass" data-action="pass">✕ Pass</button>
          <button class="btn-like ${state.favorites.has(p.name) ? 'liked' : ''}" data-action="like" data-name="${esc(p.name)}">♥ Like</button>
          <button class="btn-view" data-action="view">View</button>
        </div>
      </div>
    </article>`;
}

function bindCardActions(scope) {
  $(scope).addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('.profile-card');
    const name = btn.dataset.name || card.dataset.name;
    const action = btn.dataset.action;

    if (action === 'like') {
      btn.classList.add('liked');
      btn.textContent = '♥ Liked';
      if (!state.favorites.has(name)) {
        state.favorites.add(name);
        updateFavCount();
        toast(`💗 You liked <span class="pink">${esc(name)}</span>!`);
      }
    } else if (action === 'pass') {
      card.style.transform = 'translateX(-40%) scale(0.9)';
      card.style.opacity = '0';
      setTimeout(() => { card.style.transform = ''; card.style.opacity = ''; }, 350);
      toast(`👋 Passed on ${esc(name)}`);
    } else if (action === 'view') {
      openProfileModal(name);
    }
  });
}

function openProfileModal(name) {
  showAuthOr(() => {
    const p = PROFILES.find((x) => x.name === name);
    if (!p) return;
    toast(`👀 Viewing ${esc(p.name)}\'s profile…`);
    showModal('#profileModal'); /* placeholder fallback */
  });
}

/* ---------- Matching experience ---------- */
function nextMatchCard() {
  state.currentMatchIndex = (state.currentMatchIndex + 1) % PROFILES.length;
  const p = PROFILES[state.currentMatchIndex];
  const card = $('#matchCard');
  card.style.transition = 'none';
  card.style.opacity = '0';
  card.style.transform = 'scale(0.92)';
  setTimeout(() => {
    $('#matchCard img').src = p.img;
    card.querySelector('.match-info h3').textContent = `${p.name}, ${p.age}`;
    card.querySelector('.match-info span').textContent = `📍 ${p.city}`;
    card.querySelector('.match-meta p').textContent = `"${p.bio}"`;
    card.querySelector('.tag-row').innerHTML = p.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('');
    card.style.transition = '';
    card.style.opacity = '1';
    card.style.transform = 'scale(1)';
  }, 60);
}

function animateSwipe(dir, p) {
  const card = $('#matchCard');
  card.classList.add(dir === 'right' ? 'swiped-right' : 'swiped-left');
  if (dir === 'right') heartBurst();
  setTimeout(() => {
    card.classList.remove('swiped-right', 'swiped-left');
    nextMatchCard();
  }, 500);
}

function heartBurst() {
  const h = document.createElement('div');
  h.className = 'heart-burst';
  h.textContent = '💗';
  document.body.appendChild(h);
  setTimeout(() => h.remove(), 900);
}

function setupMatch() {
  nextMatchCard();
  $('#btnPass').addEventListener('click', () => {
    animateSwipe('left');
    toast('👋 Not your vibe');
  });
  $('#btnLike').addEventListener('click', () => {
    const p = PROFILES[state.currentMatchIndex];
    animateSwipe('right', p);
    pushNotification({ emoji: '💗', text: `${p.name} liked you back!`, time: 'Just now' });
    setTimeout(() => showMatchModal(p), 650);
  });
  $('#btnSuper').addEventListener('click', () => {
    const p = PROFILES[state.currentMatchIndex];
    animateSwipe('right', p);
    toast(`⭐ Super liked <span class="pink">${esc(p.name)}</span>! They'll be thrilled.`);
    setTimeout(() => showMatchModal(p), 650);
  });
}

function showMatchModal(p) {
  $('#matchName').textContent = p.name;
  $('#matchAvatar').src = p.img;
  showModal('#matchModal');
}

function pushNotification(n) {
  const list = $('#notifList');
  list.insertAdjacentHTML('afterbegin',
    `<div class="notif-item"><span class="ni-emoji">${n.emoji}</span><div><div class="ni-text">${esc(n.text)}</div><div class="ni-time">${n.time}</div></div></div>`);
}

/* ---------- Dates ---------- */
function renderDates() {
  const grid = $('#datesGrid');
  grid.innerHTML = DATES.map((d) => `
    <article class="date-card">
      <div class="date-visual" style="background-image:url('${d.img}')">
        <span class="date-emoji">${d.emoji}</span>
      </div>
      <div class="date-body">
        <h3>${esc(d.title)}</h3>
        <p>${esc(d.desc)}</p>
        <div class="date-meta"><span>${d.loc}</span><span>${d.price}</span></div>
        <button class="btn btn-grad" data-date="${esc(d.title)}" data-emoji="${d.emoji}">Plan This Date ♥</button>
      </div>
    </article>`).join('');
  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-date]');
    if (!btn) return;
    showAuthOr(() => {
      toast(`${btn.dataset.emoji} <span class="pink">${esc(btn.dataset.date)}</span> planned for tonight! 🌹`);
      pushNotification({ emoji: '🌹', text: `You planned a ${btn.dataset.date}!`, time: 'Just now' });
    });
  });
}

/* ---------- Games ---------- */
function renderGames() {
  const grid = $('#gamesGrid');
  grid.innerHTML = Object.entries(GAMES).map(([name, g]) => `
    <article class="game-card">
      <span class="game-icon">${g.emoji}</span>
      <h3>${esc(name)}</h3>
      <p>${esc(g.desc)}</p>
      <span class="game-players">👥 ${g.players}</span>
      <button class="btn btn-grad btn-sm" data-game="${esc(name)}">Play Now</button>
    </article>`).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-game]');
    if (!btn) return;
    const name = btn.dataset.game;
    const g = GAMES[name];
    $('#gameModalTitle').textContent = name;
    $('#gameModalEmoji').textContent = g.emoji;
    $('#gameModalDesc').textContent = `👥 ${g.players} · ${g.desc}`;
    $('#gameQuestions').innerHTML = g.questions.map((q) => `<li>${esc(q)}</li>`).join('');
    showModal('#gameModal');
    window.__gameName = name;
  });
}

/* ---------- Calls ---------- */
function renderCalls() {
  const grid = $('#callsGrid');
  grid.innerHTML = CALLS.map((c) => `
    <article class="contact-card">
      <div class="contact-avatar"><img src="${c.img}" alt="${esc(c.name)}"></div>
      <h3>${esc(c.name)}, ${c.age}</h3>
      <span class="contact-status ${c.online ? 'online' : 'offline'}">${c.online ? '🟢 Online' : '⚫ Offline'}</span>
      <div class="contact-btns">
        <button class="btn btn-glass" data-calltype="voice" data-name="${esc(c.name)}">📞 Voice</button>
        <button class="btn btn-outline" data-calltype="video" data-name="${esc(c.name)}">🎥 Video</button>
      </div>
    </article>`).join('');

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-calltype]');
    if (!btn) return;
    const type = btn.dataset.calltype === 'voice' ? '📞 Voice call' : '🎥 Video call';
    showAuthOr(() => {
      toast(`${type} connecting to <span class="pink">${esc(btn.dataset.name)}</span>…`);
      setTimeout(() => toast('😅 Call UI coming soon — it\'s a demo!'), 1200);
    });
  });
}

/* ---------- Messages / Chat ---------- */
function renderChatList() {
  const list = $('#chatList');
  list.innerHTML = '<div class="chat-list-head">Messages 💬</div>' +
    CONVOS.map((c, i) => `
      <div class="convo ${i === state.currentConvo ? 'active' : ''}" data-convo="${i}">
        <div class="convo-avatar ${c.online ? '' : 'offline'}"><img src="${c.img}" alt="${esc(c.name)}"></div>
        <div class="convo-body">
          <div class="convo-name-time"><span class="convo-name">${esc(c.name)}</span><span class="convo-time">${c.time}</span></div>
          <div class="convo-last">${esc(c.last)}</div>
        </div>
        ${c.unread ? `<span class="convo-unread">${c.unread}</span>` : ''}
      </div>`).join('');

  list.addEventListener('click', (e) => {
    const el = e.target.closest('[data-convo]');
    if (!el) return;
    state.currentConvo = +el.dataset.convo;
    renderChatList();
    renderChatWindow();
  });
}

function renderChatWindow() {
  const c = CONVOS[state.currentConvo];
  $('#chatAvatar').src = c.img;
  $('#chatName').textContent = c.name;
  $('#chatBody').innerHTML = c.msgs.map((m) =>
    `<div class="bubble ${m.from === 'out' ? 'out' : 'in'}">${esc(m.text)}</div>`).join('');
  const body = $('#chatBody');
  body.scrollTop = body.scrollHeight;
}

function setupChatInput() {
  const input = $('#chatInput');
  const send = () => {
    const text = input.value.trim();
    if (!text) return;
    const c = CONVOS[state.currentConvo];
    c.msgs.push({ from: 'out', text });
    c.last = text;
    c.time = 'Now';
    c.unread = 0;
    input.value = '';
    renderChatWindow();
    renderChatList();
    setTimeout(() => {
      const replies = ['That sounds lovely ❤️', 'Haha you\'re so cute 😊', 'Tell me more about that!', 'I was just thinking about you ✨'];
      c.msgs.push({ from: 'in', text: replies[Math.floor(Math.random() * replies.length)] });
      c.unread = 0;
      renderChatWindow();
      renderChatList();
    }, 1300);
  };
  $('#sendBtn').addEventListener('click', send);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(); });
}

function setupEmojiPop() {
  const btn = $('#emojiBtn');
  if (!$('.emoji-pop')) {
    const pop = document.createElement('div');
    pop.className = 'emoji-pop glass';
    const emojis = ['❤️', '😊', '😂', '😍', '🔥', '🥰', '✨', '😘', '🌹', '💫', '😉', '🫶'];
    pop.innerHTML = emojis.map((e) => `<button type="button">${e}</button>`).join('') + `<button type="button">💌</button>`;
    btn.parentNode.appendChild(pop);
    pop.addEventListener('click', (e) => {
      const em = e.target.closest('button');
      if (!em) return;
      $('#chatInput').value += em.textContent;
      $('#chatInput').focus();
      pop.classList.remove('show');
    });
  }
  btn.addEventListener('click', () => $('.emoji-pop').classList.toggle('show'));
}

/* ---------- Filters ---------- */
function setupFilters() {
  const apply = () => {
    const grid = $('#premiumGrid');
    let list = [...PROFILES];
    if (state.filter.age === '18-24') list = list.filter((p) => p.age <= 24);
    if (state.filter.age === '25-32') list = list.filter((p) => p.age >= 25 && p.age <= 32);
    if (state.filter.age === '33+') list = list.filter((p) => p.age >= 33);
    if (state.filter.location !== 'all') list = list.filter((p) => p.city === state.filter.location);
    if (state.filter.interest !== 'all') list = list.filter((p) => p.tags.some((t) => t.includes(state.filter.interest)));
    if (state.filter.online) list = list.filter((p) => p.online);
    if (state.filter.fresh) list = list.filter((p) => p.new);

    grid.innerHTML = list.length
      ? list.map((p) => cardHTML(p)).join('')
      : '<p class="profile-bio-mini" style="text-align:center;grid-column:1/-1;color:var(--text-muted)">No one matches those filters yet. Try widening them. ✨</p>';

    duplicateGridBindings('#premiumGrid');
  };

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
      if (key === 'online') { state.filter.online = !state.filter.online; }
      if (key === 'new') { state.filter.fresh = !state.filter.fresh; }
      chip.classList.toggle('active');
      apply();
    });
  });
}

/* Avoid double-binding issues: non-empty grids get fresh listeners */
function duplicateGridBindings(scope) {
  $(scope).onclick = (e) => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const card = btn.closest('.profile-card');
    const name = btn.dataset.name || card.dataset.name;
    if (btn.dataset.action === 'like') {
      btn.classList.add('liked');
      btn.textContent = '♥ Liked';
      if (!state.favorites.has(name)) { state.favorites.add(name); updateFavCount(); toast(`💗 Liked <span class="pink">${esc(name)}</span>`); }
    } else if (btn.dataset.action === 'pass') {
      card.style.opacity = '0'; card.style.transform = 'scale(0.9)';
      setTimeout(() => { card.style.opacity = ''; card.style.transform = ''; }, 300);
      toast(`👋 Passed on ${esc(name)}`);
    }
  };
}

/* ---------- Favorites count & panel ---------- */
function updateFavCount() {
  $('#favCount').textContent = state.favorites.size;
  const panel = $('#favList');
  panel.innerHTML = state.favorites.size
    ? [...state.favorites].map((n) => {
        const p = PROFILES.find((x) => x.name === n);
        return `<div class="fav-item"><img src="${p.img}" alt="${esc(n)}"><div>${esc(n)}, ${p.age}<br><span style="color:var(--text-muted);font-size:.76rem">${esc(p.city)}</span></div></div>`;
      }).join('')
    : '<p style="color:var(--text-muted);font-size:.85rem">No favorites yet. Tap ♥ on someone you like.</p>';
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

/* ---------- Profile page tabs & actions ---------- */
function setupProfilePage() {
  $$('.tab-btn').forEach((btn) => btn.addEventListener('click', () => {
    $$('.tab-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    $$('.tab-panel').forEach((p) => p.classList.remove('active'));
    const target = $('#tab-' + btn.dataset.tab);
    if (target) target.classList.add('active');
  }));
}

/* ---------- Auth (mock) ---------- */
let signupStep = 0;
let selectedGender = null;
let selectedLook = null;

function showAuthOr(ok) {
  if (state.loggedIn) ok();
  else {
    showAuthModal();
    const done = () => { document.removeEventListener('humsafar:login', done); ok(); };
    document.addEventListener('humsafar:login', done);
  }
}

function showAuthModal() { showModal('#authModal'); splitAuthViews('login'); }

function splitAuthViews(view) {
  $('#loginView').hidden = view !== 'login';
  $('#registerView').hidden = view !== 'register';
  $('#loginView').style.display = view === 'login' ? '' : 'none';
  $('#registerView').style.display = view === 'register' ? '' : 'none';
}

function setupAuth() {
  $('#navLoginBtn').addEventListener('click', (e) => { e.preventDefault(); showModal('#authModal'); splitAuthViews('login'); });
  $('#navSignupBtn').addEventListener('click', (e) => { e.preventDefault(); showModal('#authModal'); splitAuthViews('register'); });

  $$('[data-auth-switch]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    splitAuthViews(a.dataset.authSwitch === 'login' ? 'login' : 'register');
  }));

  /* login */
  $('#loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#loginEmail').value.trim();
    const pass = $('#loginPass').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { $('#loginError').textContent = 'Please enter a valid email.'; return; }
    if (pass.length < 6) { $('#loginError').textContent = 'Password must be at least 6 characters.'; return; }
    $('#loginError').textContent = '';
    completeLogin();
  });

  /* signup steps */
  $('#signupNext').addEventListener('click', () => {
    if (signupStep === 0) {
      const ok = $('#suName').value.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('#suEmail').value.trim()) && $('#suPass').value.length >= 6;
      if (!ok) { $('#signupError').textContent = 'Fill name, a valid email and a 6+ char password.'; return; }
    }
    if (signupStep === 1 && !selectedGender) { $('#signupError').textContent = 'Please pick a gender.'; return; }
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

  $('#signupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    if (signupStep < 2) return;
    if (!selectedLook) { $('#signupError').textContent = 'Pick what you\'re looking for.'; return; }
    $('#signupError').textContent = '';
    completeLogin();
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

function completeLogin() {
  state.loggedIn = true;
  closeModal('#authModal');
  toast('🎉 Welcome to <span class="pink">Humsafar</span>! Happy matching.');
  $('#navLoginBtn').textContent = 'Logged In';
  $('#navSignupBtn').style.display = 'none';
  document.dispatchEvent(new CustomEvent('humsafar:login'));
}

/* ---------- Reveal on scroll ---------- */
function setupReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  $$('.reveal').forEach((el) => io.observe(el));
}

/* ---------- Animated counters ---------- */
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

/* ---------- Modals close helpers ---------- */
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
  signupStep = 0;
  updateSignupProgress();
  $('#signupError').textContent = '';
}

/* ---------- Testimonials ---------- */
function renderTestimonials() {
  const grid = $('#storiesGrid');
  grid.innerHTML = TESTIMONIALS.map((t) => `
    <article class="testimonial-card reveal">
      <div class="testimonial-head">
        <img src="${t.img}" alt="${esc(t.name)}">
        <div>
          <h4>${esc(t.name)}</h4>
          <span class="loc">📍 ${esc(t.loc)}</span>
          <div class="stars">${'★'.repeat(t.stars)}${'☆'.repeat(5 - t.stars)}</div>
        </div>
      </div>
      <p>“${esc(t.story)}”</p>
    </article>`).join('');
}

/* ---------- Init ---------- */
function init() {
  spawnBackground();
  renderHero();
  renderDiscover();
  renderDates();
  renderGames();
  renderCalls();
  renderChatList();
  renderChatWindow();
  renderTestimonials();
  renderDiscover(); renderDiscover(); /* ensure search works after grid build */
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
  updateFavCount();

  // populate notifications
  NOTIFICATIONS.forEach((n) => pushNotification(n));

  // search listener
  $('#discoverSearch').addEventListener('input', () => renderDiscover());

  // toast on explore CTAs
  $$('a[href="#discover"], a[href="#match"], #navLoginBtn, #navSignupBtn').forEach((a) => {});
  $('#avatarMini').addEventListener('click', () => {
    if (!state.loggedIn) showAuthOr(() => window.location.hash = '#profile');
    else { toast('👤 Opening your profile'); window.location.hash = '#profile'; }
  });
  document.addEventListener('click', (e) => {
    const heroLike = e.target.closest('[data-hero-like]');
    if (heroLike) e.stopPropagation();
  });
}

document.addEventListener('DOMContentLoaded', init);