/* Humsafar Admin SPA */
(function () {
  'use strict';

  const TOKEN_KEY = 'humsafar_admin_token';

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const timeAgo = (iso) => {
    if (!iso) return '—';
    const t = new Date(iso.replace(' ', 'T') + 'Z').getTime();
    if (Number.isNaN(t)) return iso;
    const s = Math.floor((Date.now() - t) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return Math.floor(s / 60) + 'm ago';
    if (s < 86400) return Math.floor(s / 3600) + 'h ago';
    return Math.floor(s / 86400) + 'd ago';
  };
  const fmtDate = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso.replace(' ', 'T') + 'Z');
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  /* ---------------- API ---------------- */
  let token = localStorage.getItem(TOKEN_KEY) || '';

  function setToken(t) {
    token = t || '';
    if (t) localStorage.setItem(TOKEN_KEY, t);
    else localStorage.removeItem(TOKEN_KEY);
  }

  async function api(path, options) {
    options = options || {};
    const headers = Object.assign({}, options.headers || {});
    if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json';
    if (token) headers['Authorization'] = 'Bearer ' + token;
    let res;
    try {
      res = await fetch(path, Object.assign({}, options, { headers, credentials: 'include' }));
    } catch (e) {
      throw new Error('Network error — is the server running?');
    }
    const ct = res.headers.get('content-type') || '';
    const body = ct.includes('application/json') ? await res.json() : { success: false, error: { message: res.statusText } };
    if (!res.ok || !body.success) {
      const msg = (body.error && (body.error.message || body.error.code)) || 'Request failed (' + res.status + ')';
      if (res.status === 401) { setToken(null); renderLogin(); }
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    return body.data;
  }

  /* ---------------- Shell ---------------- */
  const app = $('#app');

  const ICONS = {
    dashboard: '📊',
    users: '👥',
    reports: '🚩',
    interests: '✨'
  };

  function statusBadge(status, role) {
    if (role === 'ADMIN') return '<span class="badge admin">ADMIN</span>';
    const map = { ACTIVE: 'active', SUSPENDED: 'suspended', BANNED: 'banned' };
    return '<span class="badge ' + (map[status] || 'user') + '">' + esc(status || 'ACTIVE') + '</span>';
  }

  function renderShell(active, title, inner) {
    const nav = ['dashboard', 'users', 'reports', 'interests'].map((v) => {
      const labels = { dashboard: 'Dashboard', users: 'Users', reports: 'Reports', interests: 'Interests' };
      return '<button class="nav-item ' + (v === active ? 'active' : '') + '" data-nav="' + v + '">' +
        '<span class="ico">' + ICONS[v] + '</span>' + labels[v] + '</button>';
    }).join('');
    app.innerHTML = '<div class="shell">' +
      '<aside class="sidebar">' +
        '<div class="brand">Humsafar <span>Admin</span></div>' +
        nav + '<div class="spacer"></div>' +
        '<button class="logout" data-logout>🚪&nbsp; Logout</button>' +
      '</aside>' +
      '<main class="main">' +
        '<div class="page-head"><h1>' + esc(title) + '</h1>' +
        '<div class="user-chip"><span class="dot"></span>Signed in as admin</div></div>' +
        '<div class="page-body">' + inner + '</div>' +
      '</main>' +
    '</div>';

    $$('[data-nav]').forEach((b) => b.addEventListener('click', () => go(b.getAttribute('data-nav'))));
    $('[data-logout]', app).addEventListener('click', logout);
    bindPageHandlers(active);
  }

  function pageBody() { return $('.page-body'); }

  function toast(msg, isError) {
    let t = $('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.toggle('error', !!isError);
    requestAnimationFrame(() => t.classList.add('show'));
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove('show'), 3200);
  }

  const loadingHtml = (label) => '<div class="loading"><div class="spinner"></div>' + esc(label || 'Loading…') + '</div>';

  async function safe(fn) {
    try { await fn(); } catch (e) { renderError(e.message); }
  }

  function renderError(msg) {
    pageBody().innerHTML = '<div class="error">⚠️ ' + esc(msg) + '</div>';
  }

  /* ---------------- Views ---------------- */
  async function ensureShell(v, title) {
    if (!$('.shell', app)) renderShell(v, title, '<div class="loading"><div class="spinner"></div></div>');
    else {
      $$('[data-nav]', app).forEach((b) => b.classList.toggle('active', b.getAttribute('data-nav') === v));
      $('.page-head h1', app).textContent = title;
    }
  }

  function go(v) {
    if (v === 'dashboard') viewDashboard();
    else if (v === 'users') viewUsers();
    else if (v === 'reports') viewReports();
    else if (v === 'interests') viewInterests();
  }

  /* ----- Dashboard ----- */
  async function viewDashboard() {
    await ensureShell('dashboard', 'Dashboard');
    pageBody().innerHTML = loadingHtml('Loading dashboard…');
    safe(async () => {
      const d = await api('/api/admin/dashboard');
      const c = d.counts;
      const cards = [
        ['Total Users', c.users], ['Banned', c.banned], ['Admins', c.admins],
        ['Online Now', c.onlineNow], ['Likes', c.likes], ['Super Likes', c.superLikes],
        ['Passes', c.passes], ['Matches', c.matches], ['Messages', c.messages],
        ['Conversations', c.conversations], ['Calls', c.calls], ['Dates', c.dates],
        ['Games', c.games]
      ];
      const now = Date.now();
      pageBody().innerHTML =
        '<div class="stats-grid">' +
        '<div class="stat-card tall"><div class="label">Open Reports</div><div class="value">' + c.openReports + '</div></div>' +
        cards.map(([l, v]) => '<div class="stat-card"><div class="label">' + esc(l) + '</div><div class="value">' + Number(v) + '</div></div>').join('') +
        '</div>' +
        '<div class="panel"><div class="panel-head"><h2>Recently Joined</h2>' +
        '<button class="btn btn-ghost btn-sm" data-nav="users">View all users</button></div>' +
        (d.recentUsers.length ? userTable(d.recentUsers, true) : '<div class="empty">No users yet.</div>') +
        '</div>';
      $('[data-nav="users"]', pageBody()).addEventListener('click', () => go('users'));
    });
  }

  function userTable(rows, compact) {
    return '<div class="tbl-wrap"><table><thead><tr>' +
      (compact ? '<th></th>' : '') +
      '<th>User</th><th>Gender</th><th>Location</th><th>Status</th><th>Joined</th>' +
      (compact ? '' : '<th>Likes</th><th>Matches</th><th>Reports</th><th>Actions</th>') +
      '</tr></thead><tbody>' + rows.map(rowHtml(compact)).join('') + '</tbody></table></div>';
  }

  function rowHtml(compact) {
    return (u) => {
      const img = u.photo ? '<img class="avatar" src="' + esc(u.photo) + '" alt="">' :
        '<span class="avatar" style="display:inline-flex;align-items:center;justify-content:center;color:#a78bfa">' + (u.name ? esc(u.name[0]) : '?') + '</span>';
      return '<tr>' +
        (compact ? '<td>' + img + '</td>' : '') +
        '<td><strong>' + esc(u.name) + '</strong><br><span style="font-size:0.75rem;color:#6f6f86">' + esc(u.email) + '</span></td>' +
        '<td>' + esc(u.gender || '—') + '</td>' +
        '<td>' + esc(u.location || '—') + '</td>' +
        '<td>' + statusBadge(u.status, u.role) + '</td>' +
        '<td title="' + esc(u.created_at) + '">' + timeAgo(u.created_at) + '</td>' +
        (compact ? '' :
          '<td>' + Number(u.likes_sent || 0) + '</td>' +
          '<td>' + Number(u.matches || 0) + '</td>' +
          '<td>' + Number(u.open_reports || 0) + '</td>' +
          '<td><div class="row-actions">' +
            '<button class="btn btn-ghost btn-sm" data-user-view="' + u.id + '">View</button>' +
            '<select data-user-status="' + u.id + '">' + statusOptions(u.status) + '</select>' +
            (u.role === 'ADMIN'
              ? '<button class="btn btn-warn btn-sm" data-user-demote="' + u.id + '">Demote</button>'
              : '<button class="btn btn-ghost btn-sm" data-user-promote="' + u.id + '">Promote</button>') +
          '</div></td>');
    };
  }

  function statusOptions(current) {
    return ['ACTIVE', 'SUSPENDED', 'BANNED'].map((s) =>
      '<option value="' + s + '"' + (s === current ? ' selected' : '') + '>' + s + '</option>').join('');
  }

  /* ----- Users ----- */
  const usersState = { page: 1, q: '', status: 'all' };

  async function viewUsers() {
    await ensureShell('users', 'Users');
    pageBody().innerHTML = loadingHtml('Loading users…');
    loadUsers();
  }

  function usersGridHtml() {
    return '<div class="toolbar">' +
      '<input data-users-q placeholder="Search name or email…" value="' + esc(usersState.q) + '">' +
      '<select data-users-status>' +
        '<option value="all"' + (usersState.status === 'all' ? ' selected' : '') + '>All statuses</option>' +
        '<option value="ACTIVE"' + (usersState.status === 'ACTIVE' ? ' selected' : '') + '>Active</option>' +
        '<option value="SUSPENDED"' + (usersState.status === 'SUSPENDED' ? ' selected' : '') + '>Suspended</option>' +
        '<option value="BANNED"' + (usersState.status === 'BANNED' ? ' selected' : '') + '>Banned</option>' +
      '</select>' +
      '<button class="btn btn-gradient btn-sm" data-users-refresh>Refresh</button>' +
    '</div>' +
    '<div class="panel"><div class="tbl-wrap" data-users-body></div><div class="pager" data-users-pager></div></div>';
  }

  async function loadUsers() {
    const body = pageBody();
    if (!$('[data-users-body]', body)) body.innerHTML = usersGridHtml();
    let err = null;
    let res = null;
    try {
      res = await api('/api/admin/users?page=' + usersState.page + '&limit=25&q=' + encodeURIComponent(usersState.q) + '&status=' + encodeURIComponent(usersState.status));
    } catch (e) { err = e; }
    if (!$('[data-users-body]', pageBody())) return;
    $('[data-users-body]', pageBody()).innerHTML = err
      ? '<div class="error">' + esc(err.message) + '</div>'
      : (res.users.length ? userTable(res.users, false) : '<div class="empty">No users found.</div>');
    const pager = $('[data-users-pager]', pageBody());
    const totalPages = Math.max(1, Math.ceil(res ? res.total / res.limit : 1));
    pager.innerHTML = '<span>' + Number(res ? res.total : 0) + ' users</span>' +
      '<div class="page-btns">' +
        '<button class="btn btn-ghost btn-sm" data-pg="prev" ' + (usersState.page <= 1 ? 'disabled' : '') + '>← Prev</button>' +
        '<button class="btn btn-ghost btn-sm">Page ' + usersState.page + ' / ' + totalPages + '</button>' +
        '<button class="btn btn-ghost btn-sm" data-pg="next" ' + (usersState.page >= totalPages ? 'disabled' : '') + '>Next →</button>' +
      '</div>';
    $('[data-pg="prev"]', pager).addEventListener('click', () => { usersState.page--; loadUsers(); });
    $('[data-pg="next"]', pager).addEventListener('click', () => { usersState.page++; loadUsers(); });
  }

  async function setUserStatus(id, status) {
    await safe(async () => {
      await api('/api/admin/users/' + id + '/status', { method: 'POST', body: JSON.stringify({ status }) });
      toast('User #' + id + ' is now ' + status.toLowerCase() + '.');
      loadUsers();
    });
  }

  async function promoteUser(id) {
    await safe(async () => {
      await api('/api/admin/users/' + id + '/promote-admin', { method: 'POST', body: JSON.stringify({}) });
      toast('User #' + id + ' promoted to admin.');
      loadUsers();
    });
  }

  async function demoteUser(id) {
    await safe(async () => {
      await api('/api/admin/users/' + id + '/demote-admin', { method: 'POST', body: JSON.stringify({}) });
      toast('User #' + id + ' demoted.');
      loadUsers();
    });
  }

  /* ----- User detail modal ----- */
  async function openUserDetail(id) {
    let d;
    try { d = await api('/api/admin/users/' + id); } catch (e) { toast(e.message, true); return; }
    const u = d.user;
    const photo = u.photos && u.photos.find((p) => p.is_primary) || (u.photos && u.photos[0]);
    const age = u.age || '—';
    openModal(
      '<button class="modal-x">&times;</button>' +
      '<h2>@' + esc(u.username) + '</h2>' +
      '<div class="modal-sub">' + esc(u.name) + ' · ' + esc(u.email) + '</div>' +
      '<div style="text-align:center;margin-bottom:16px">' +
        (photo ? '<img src="' + esc(photo.url) + '" style="width:150px;height:150px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,45,120,.4)">' :
          '<span class="avatar" style="width:150px;height:150px;font-size:3rem;display:inline-flex;align-items:center;justify-content:center">' + (u.name ? esc(u.name[0]) : '?') + '</span>') +
      '</div>' +
      '<div class="m-grid">' +
        field('ID', u.id) + field('Status', statusBadge(u.status, u.role)) +
        field('Gender', u.gender) + field('Age', age) +
        field('Location', u.location) + field('Bio', u.bio, true) +
        field('Phone', u.phone || '—') + field('Email Verified', u.email_verified ? 'Yes' : 'No') +
        field('Interests', (u.interests && u.interests.length ? u.interests.map((i) => i.name).join(', ') : '—'), true) +
        field('Joined', fmtDate(u.created_at)) + field('Last Active', timeAgo(u.last_active_at)) +
        field('Photos', (u.photos ? u.photos.length : 0)) + field('Distance Pref', u.distance_pref ? u.distance_pref + ' km' : '—') +
      '</div>' +
      '<h3 style="font-size:.95rem;color:#a6a6bd;margin:6px 0 10px">Reports involving this user (' + (d.reports ? d.reports.length : 0) + ')</h3>' +
      (d.reports && d.reports.length
        ? '<div class="tbl-wrap"><table><thead><tr><th>#</th><th>Type</th><th>Reason</th><th>Status</th><th>When</th></tr></thead><tbody>' +
          d.reports.map((r) => '<tr><td>' + r.id + '</td><td>' + esc(r.reporter) + ' → ' + esc(r.reported) + '</td><td>' + esc(r.reason) + '</td><td>' + statusBadge(r.status) + '</td><td>' + timeAgo(r.createdAt) + '</td></tr>').join('') +
          '</tbody></table></div>'
        : '<div class="empty" style="padding:14px">No reports on record.</div>') +
      '<h3 style="font-size:.95rem;color:#a6a6bd;margin:14px 0 10px">User blocks</h3>' +
      (d.blocks && d.blocks.length
        ? '<div class="chip-row">' + d.blocks.map((b) => '<span class="chip">Blocked #' + b.blocked + '</span>').join('') + '</div>'
        : '<div class="empty" style="padding:14px">No active blocks.</div>') +
      '<div class="modal-actions">' +
        '<button class="btn btn-warn btn-sm" data-detail-status="SUSPENDED">Suspend</button>' +
        '<button class="btn btn-danger btn-sm" data-detail-status="BANNED">Ban</button>' +
        '<button class="btn btn-success btn-sm" data-detail-status="ACTIVE">Re-activate</button>' +
        (u.role === 'ADMIN'
          ? '<button class="btn btn-warn btn-sm" data-detail-demote>Demote admin</button>'
          : '<button class="btn btn-ghost btn-sm" data-detail-promote>Make admin</button>') +
      '</div>'
    );
    const modal = $('.modal');
    $('.modal-x', modal).addEventListener('click', closeModal);
    $$('[data-detail-status]', modal).forEach((b) => b.addEventListener('click', async () => {
      await setUserStatus(id, b.getAttribute('data-detail-status'));
      closeModal();
    }));
    const pr = $('[data-detail-promote]', modal);
    if (pr) pr.addEventListener('click', async () => { await promoteUser(id); closeModal(); });
    const dm = $('[data-detail-demote]', modal);
    if (dm) dm.addEventListener('click', async () => { await demoteUser(id); closeModal(); });
  }

  function field(k, v, span) {
    return '<div class="' + (span ? 'span2' : '') + '"><div class="k">' + esc(k) + '</div><div class="v">' + (v === '' || v == null ? '—' : v) + '</div></div>';
  }

  function openModal(html) {
    const back = document.createElement('div');
    back.className = 'modal-back';
    back.innerHTML = '<div class="modal">' + html + '</div>';
    back.addEventListener('click', (e) => { if (e.target === back) back.remove(); });
    document.body.appendChild(back);
  }
  function closeModal() { const b = $('.modal-back'); if (b) b.remove(); }

  /* ----- Reports ----- */
  const reportsState = { status: 'open' };

  async function viewReports() {
    await ensureShell('reports', 'Reports');
    pageBody().innerHTML = loadingHtml('Loading reports…');
    safe(async () => {
      const d = await api('/api/admin/reports?status=' + reportsState.status + '&limit=100');
      pageBody().innerHTML = reportsPageHtml(d);
      const sel = $('[data-reports-status]', pageBody());
      sel.addEventListener('change', () => { reportsState.status = sel.value; viewReports(); });
      $$('[data-report-resolve]', pageBody()).forEach((b) => b.addEventListener('click', () => setReportStatus(b.getAttribute('data-report-resolve'), 'RESOLVED')));
      $$('[data-report-ignore]', pageBody()).forEach((b) => b.addEventListener('click', () => setReportStatus(b.getAttribute('data-report-ignore'), 'IGNORED')));
      $$('[data-report-reopen]', pageBody()).forEach((b) => b.addEventListener('click', () => setReportStatus(b.getAttribute('data-report-reopen'), 'OPEN')));
    });
  }

  function reportsPageHtml(d) {
    const rows = d.reports;
    const filter = '<div class="toolbar"><select data-reports-status>' +
      '<option value="open"' + (reportsState.status === 'open' ? ' selected' : '') + '>Open</option>' +
      '<option value="all"' + (reportsState.status === 'all' ? ' selected' : '') + '>All</option>' +
      '<option value="resolved"' + (reportsState.status === 'resolved' ? ' selected' : '') + '>Resolved</option>' +
      '<option value="ignored"' + (reportsState.status === 'ignored' ? ' selected' : '') + '>Ignored</option>' +
    '</select><button class="btn btn-gradient btn-sm" data-nav="users">Open reports: ' + d.openReports + '</button>' +
    '<button class="btn btn-ghost btn-sm" data-nav="reports" style="display:none"></button></div>';
    const table = '<div class="panel"><div class="tbl-wrap"><table><thead><tr>' +
      '<th>ID</th><th>Reporter</th><th>Reported</th><th>Reason</th><th>Details</th><th>Status</th><th>Reported</th><th>Resolved</th><th>Actions</th>' +
      '</tr></thead><tbody>' +
      (rows.length ? rows.map((r) => {
        const reportedStatus = r.reported && r.reported.status;
        return '<tr>' +
          '<td>' + r.id + '</td>' +
          '<td><button class="btn btn-ghost btn-sm" style="padding:2px 8px" data-user-view="' + r.reporter.id + '">' + esc(r.reporter.name) + '</button></td>' +
          '<td><button class="btn btn-ghost btn-sm" style="padding:2px 8px" data-user-view="' + r.reported.id + '">' + esc(r.reported.name) + '</button>' +
            (reportedStatus === 'BANNED' ? ' <span class="badge banned">BANNED</span>' : reportedStatus === 'SUSPENDED' ? ' <span class="badge suspended">SUSPENDED</span>' : '') +
          '</td>' +
          '<td><span class="badge open" style="background:rgba(255,255,255,.06);color:#a6a6bd">' + esc(r.reason) + '</span></td>' +
          '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(r.details) + '">' + esc(r.details || '—') + '</td>' +
          '<td>' + statusBadge(r.status) + '</td>' +
          '<td>' + timeAgo(r.created_at) + '</td>' +
          '<td>' + (r.status === 'RESOLVED' ? timeAgo(r.resolved_at) : '—') + '</td>' +
          '<td><div class="row-actions">' +
            (r.status === 'OPEN'
              ? '<button class="btn btn-success btn-sm" data-report-resolve="' + r.id + '">Resolve</button>' +
                '<button class="btn btn-warn btn-sm" data-report-ignore="' + r.id + '">Ignore</button>'
              : '<button class="btn btn-ghost btn-sm" data-report-reopen="' + r.id + '">Reopen</button>') +
          '</div></td>' +
        '</tr>';
      }).join('') : '<tr><td colspan="8"><div class="empty">No reports in this view.</div></td></tr>') +
      '</tbody></table></div>' +
      '<div class="pager"><span>Resolved total: ' + (d.countResolved || 0) + '</span></div></div>';
    return filter + table;
  }

  async function bindPageHandlers(active) {
    const body = pageBody();
    if (!body) return;
    $$('[data-user-view]', body).forEach((b) => b.addEventListener('click', () => openUserDetail(b.getAttribute('data-user-view'))));
    $$('[data-user-status]', body).forEach((sel) => sel.addEventListener('change', () => {
      if (sel.value) setUserStatus(sel.getAttribute('data-user-status'), sel.value);
    }));
    $$('[data-user-promote]', body).forEach((b) => b.addEventListener('click', () => promoteUser(b.getAttribute('data-user-promote'))));
    $$('[data-user-demote]', body).forEach((b) => b.addEventListener('click', () => demoteUser(b.getAttribute('data-user-demote'))));
    if (active === 'users') {
      const q = $('[data-users-q]', body);
      if (q) q.addEventListener('input', debounce(() => {
        if (usersState.q !== q.value) { usersState.q = q.value; usersState.page = 1; loadUsers(); }
      }, 350));
      const st = $('[data-users-status]', body);
      if (st) st.addEventListener('change', () => {
        if (usersState.status !== st.value) { usersState.status = st.value; usersState.page = 1; loadUsers(); }
      });
      const rf = $('[data-users-refresh]', body);
      if (rf) rf.addEventListener('click', () => loadUsers());
    }
  }

  async function setReportStatus(id, status) {
    await safe(async () => {
      await api('/api/admin/reports/' + id + '/status', { method: 'POST', body: JSON.stringify({ status }) });
      toast('Report #' + id + ' ' + status.toLowerCase() + '.');
      viewReports();
    });
  }

  /* ----- Interests ----- */
  async function viewInterests() {
    await ensureShell('interests', 'Interests');
    pageBody().innerHTML = loadingHtml('Loading interests…');
    safe(async () => {
      const d = await api('/api/admin/interests');
      pageBody().innerHTML =
        '<div class="panel"><div class="panel-head"><h2>' + d.interests.length + ' interests</h2></div>' +
        '<div class="interest-list">' + d.interests.map((i) => '<span class="interest-item">' + esc(i.name) + '</span>').join('') + '</div></div>';
    });
  }

  /* ---------------- Auth ---------------- */
  function renderLogin() {
    app.innerHTML =
      '<div class="login-wrap"><div class="login-card">' +
        '<div class="logo">♥ Humsafar</div>' +
        '<div class="sub">Admin Control Room</div>' +
        '<form data-login-form>' +
          '<div class="field"><label>Email</label><input type="email" name="email" required autofocus placeholder="admin@humsafar.com" autocomplete="username"></div>' +
          '<div class="field"><label>Password</label><input type="password" name="password" required placeholder="••••••••" autocomplete="current-password"></div>' +
          '<button class="btn btn-gradient btn-block" type="submit">Sign in</button>' +
          '<p style="text-align:center;color:#6f6f86;font-size:.75rem;margin-top:16px">Admin-only access. Credentials are verified server-side.</p>' +
        '</form>' +
      '</div></div>';
    $('[data-login-form]', app).addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = form.querySelector('button[type=submit]');
      btn.disabled = true;
      btn.textContent = 'Signing in…';
      try {
        const d = await api('/api/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email: form.email.value.trim().toLowerCase(), password: form.password.value })
        });
        setToken(d.token);
        viewDashboard();
        toast('Welcome back.');
      } catch (err) {
        toast(err.message, true);
        btn.disabled = false;
        btn.textContent = 'Sign in';
      }
    });
  }

  async function verifySession() {
    if (!token) { renderLogin(); return false; }
    try {
      await api('/api/admin/dashboard');
      return true;
    } catch (e) {
      setToken(null);
      renderLogin();
      return false;
    }
  }

  function logout() {
    setToken(null);
    renderLogin();
  }

  function debounce(fn, ms) {
    let t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }

  /* ---------------- Init ---------------- */
  async function init() {
    if (await verifySession()) viewDashboard();
  }

  init();
})();