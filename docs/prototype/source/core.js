/* ================= SuperAtlas prototype — core ================= */
'use strict';
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const clone = o => JSON.parse(JSON.stringify(o));
const uid = (p = 'id') => p + Math.random().toString(36).slice(2, 8);

/* ---------- icons ---------- */
function ic(n, cls = '') {
  const p = ICONS[n] || ICONS['question'];
  return `<span class="ic ${cls}" aria-hidden="true"><svg viewBox="0 0 256 256" fill="currentColor">${p}</svg></span>`;
}

/* ---------- Meridian logo (original Direction A) ---------- */
function meridian(size = 28, variant = 'navy') {
  const shield = variant === 'white' ? '#ffffff' : '#1B2056';
  const lines = variant === 'white' ? '#1B2056' : '#ffffff';
  return `<svg width="${size}" height="${size}" viewBox="37 32 54 64" aria-label="SuperAtlas" role="img"><path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="${shield}"/><path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="${lines}" stroke-width="3" fill="none"/><path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="${lines}" stroke-width="2.2" fill="none"/><path d="M49.5 63H62" stroke="${lines}" stroke-width="2.2"/><path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;
}
function lockup(dark = false, size = 28) {
  return `<span class="row gap8" style="gap:10px">${meridian(size, dark ? 'white' : 'navy')}<span style="font:600 ${Math.round(size * .72)}px/1 var(--sans);letter-spacing:-.01em;color:${dark ? '#fff' : 'var(--brand-700)'}">Super<span style="font-family:var(--serif);font-weight:700">Atlas</span></span></span>`;
}

/* ---------- components ---------- */
function btn(label, o = {}) {
  const v = o.v || 'primary';
  const cls = ['btn', 'btn-' + v, o.size ? 'btn-' + o.size : '', o.block ? 'btn-block' : '', o.cls || ''].join(' ');
  const data = [o.go ? `data-go="${o.go}"` : '', o.act ? `data-act="${o.act}"` : '', o.arg !== undefined ? `data-arg="${esc(o.arg)}"` : '', o.test ? `data-test="${o.test}"` : '', o.id ? `id="${o.id}"` : '', o.attrs || ''].join(' ');
  return `<button type="${o.type || 'button'}" class="${cls}" ${data} ${o.disabled ? 'disabled' : ''}>${o.i ? ic(o.i) : ''}${label ? `<span>${label}</span>` : ''}${o.ir ? ic(o.ir) : ''}</button>`;
}
const chip = (t, tone = 'neu', i) => `<span class="chip ${tone}">${i ? ic(i) : ''}${esc(t)}</span>`;
const tag = t => `<span class="tag">${esc(t)}</span>`;
const count = n => `<span class="count">${n}</span>`;
function logo(o, size = 40) {
  if (!o) return `<span class="logo s${size} empty">${ic('buildings')}</span>`;
  const style = o.col ? `style="background:${o.col}"` : '';
  return `<span class="logo s${size}" ${style} title="${esc(o.name || '')}">${esc(o.ini)}</span>`;
}
const cls = (type, tier) => `<span class="cls">${ic('buildings')}<b>${esc(type)}</b>${tier ? `<i>${esc(tier)}</i>` : ''}</span>`;
const av = (ini, size = '') => `<span class="av ${size ? 's' + size : ''}">${esc(ini)}</span>`;
const tile = (i, tone = '', size = '') => `<span class="tile ${tone} ${size}">${ic(i)}</span>`;
function pageHead({ over, title, sub, actions = '' }) {
  return `<div class="ph"><div class="grow">${over ? `<div class="overline">${over}</div>` : ''}<h1 class="h1" style="margin-top:4px">${title}</h1>${sub ? `<p class="muted">${sub}</p>` : ''}</div><div class="row wrap">${actions}</div></div>`;
}
/* one filter pattern for lists: a row of pills with counts inside the table card */
function fpills(items, active, act) { return `<div class="tbl-sub"><div class="pills">${items.map(([k, l, n, test, tone]) => `<button class="pill ${active === k ? 'on' : ''} ${tone && n ? 'tone-' + tone : ''}" data-act="${act}" data-arg="${k}"${test ? ` data-test="${test}"` : ''}>${esc(l)}${n != null ? count(n) : ''}</button>`).join('')}</div></div>`; }
function tabs(items, active, act, arg = '') {
  return `<div class="tabs" role="tablist">${items.map(t => `<button role="tab" class="${t.id === active ? 'on' : ''}" data-act="${act}" data-arg="${t.id}" ${t.test ? `data-test="${t.test}"` : ''} ${arg}>${t.i ? ic(t.i) : ''}${esc(t.label)}${t.count !== undefined ? count(t.count) : ''}</button>`).join('')}</div>`;
}
function field(label, control, o = {}) {
  return `<div class="field ${o.cls || ''}">${label ? `<label ${o.for ? `for="${o.for}"` : ''}>${label}${o.opt ? ' <span class="muted" style="font-weight:400">(optional)</span>' : ''}</label>` : ''}${control}${o.err ? `<div class="err">${ic('warning-circle')}${o.err}</div>` : o.hint ? `<div class="hint">${o.hint}</div>` : ''}</div>`;
}
const inp = (id, val = '', o = {}) => `<input class="inp ${o.invalid ? 'invalid' : ''}" id="${id}" name="${id}" type="${o.type || 'text'}" value="${esc(val)}" placeholder="${esc(o.ph || '')}" ${o.attrs || ''} ${o.ro ? 'readonly' : ''}>`;
const sel = (id, opts, val, o = {}) => `<select class="sel ${o.invalid ? 'invalid' : ''}" id="${id}" name="${id}" ${o.attrs || ''}>${opts.map(x => { const [v, l] = Array.isArray(x) ? x : [x, x]; return `<option value="${esc(v)}" ${v === val ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>`;
const ta = (id, val = '', o = {}) => `<textarea class="ta" id="${id}" name="${id}" placeholder="${esc(o.ph || '')}" ${o.attrs || ''}>${esc(val)}</textarea>`;
const sw = (id, on, o = {}) => `<label class="switch"><input type="checkbox" id="${id}" ${on ? 'checked' : ''} ${o.attrs || ''}><span></span></label>`;
const ck = (id, label, on, o = {}) => `<label class="check"><input type="checkbox" id="${id}" name="${id}" ${on ? 'checked' : ''} ${o.attrs || ''}><span>${label}</span></label>`;
function alertBox(tone, title, body, actions = '', icon) {
  const ics = { ok: 'check-circle', warn: 'warning', bad: 'warning-octagon', info: 'info', ai: 'sparkle' };
  return `<div class="alert ${tone}">${tile(icon || ics[tone] || 'info', 'solid ' + (tone === 'ai' ? '' : tone), 'sm')}<div class="grow"><div class="t">${title}</div>${body ? `<div class="b">${body}</div>` : ''}</div>${actions ? `<div class="row">${actions}</div>` : ''}</div>`;
}
const note = (t, i = 'info') => `<div class="note">${ic(i)}<div>${t}</div></div>`;
const demoNote = () => '';
function stepper(steps, cur) {
  return `<div class="stepper">${steps.map((s, i) => `${i ? '<span class="step-line"></span>' : ''}<span class="step ${i < cur ? 'done' : i === cur ? 'on' : ''}"><span class="n">${i < cur ? ic('check') : i + 1}</span>${esc(s)}</span>`).join('')}</div>`;
}
function kv(pairs) { return `<div class="kv">${pairs.map(([k, v]) => `<div>${esc(k)}</div><div>${v}</div>`).join('')}</div>`; }
function bar(p, color) { return `<div class="bar"><i style="width:${p}%;${color ? 'background:' + color : ''}"></i></div>`; }
function empty(i, t, b, a = '') { return `<div class="col" style="align-items:center;text-align:center;padding:40px 16px;gap:10px">${tile(i, '', 'lg')}<div class="h4">${t}</div><p class="muted small" style="max-width:44ch">${b}</p>${a}</div>`; }
function fileRow(name, meta, o = {}) {
  return `<div class="file">${tile(o.i || 'file-text', o.tone || '', 'sm')}<div class="grow"><div class="strong" style="overflow-wrap:anywhere">${esc(name)}</div><div class="cap muted">${meta}</div></div>${o.actions || `<button class="icon-btn" title="Preview">${ic('eye')}</button>`}</div>`;
}
function orgCell(o, sub) { return `<div class="org">${logo(o, 40)}<div style="min-width:0"><div class="nm">${esc(o.name || o.org)}</div><div class="sub">${esc(sub ?? o.web ?? '')}</div></div></div>`; }
function statusChip(st) {
  const m = { Verified: ['ok', 'seal-check'], Accredited: ['ok', 'seal-check'], Active: ['ok', 'seal-check'], Accepted: ['ok', 'check-circle'], Approved: ['ok', 'check-circle'], Published: ['ok', 'check-circle'], Live: ['ok', 'seal-check'],
    'Pending verification': ['warn', 'hourglass'], 'Renewal due': ['warn', 'clock'], 'Change requested': ['warn', 'git-diff'], 'In review': ['info', 'hourglass'], 'Under review': ['info', 'hourglass'], Pending: ['info', 'clock'], Invited: ['info', 'envelope-simple'], 'Info requested': ['warn', 'chat-circle-dots'], Draft: ['neu', 'note-pencil'],
    Expired: ['neu', 'clock'], Open: ['ok', 'play-circle'], Scheduled: ['info', 'calendar-blank'], Closed: ['neu', 'lock-simple'], 'Firm to assign': ['warn', 'user-plus'], 'Firm to choose': ['warn', 'handshake'], 'Firm approval': ['warn', 'hourglass'], 'Awaiting firm': ['info', 'hourglass'], Answering: ['info', 'pencil-simple'], Submitted: ['info', 'paper-plane-tilt'], Assessing: ['info', 'magnifying-glass'], 'Report submitted': ['info', 'file-text'], 'Held back': ['warn', 'pause-circle'], Requested: ['warn', 'hourglass'], Assigned: ['info', 'user-plus'], 'Not started': ['neu', 'circle-dashed'], Answered: ['ok', 'check-circle'], 'Changes requested': ['warn', 'arrow-u-up-left'], 'In preview': ['info', 'eye'], 'Signed off': ['ok', 'seal-check'], Returned: ['warn', 'arrow-u-up-left'], Overdue: ['bad', 'warning'], Filed: ['ok', 'check-circle'], Queried: ['warn', 'chat-circle-dots'], Due: ['info', 'clock'], Late: ['bad', 'clock'], 'Fix in progress': ['info', 'wrench'], 'Fix submitted': ['info', 'paper-plane-tilt'], 'Verified fixed': ['ok', 'check-circle'], 'Extension requested': ['warn', 'clock-clockwise'], 'Invite expired': ['neu', 'clock'], 'Pending credential': ['warn', 'hourglass'], Revoked: ['neu', 'x-circle'], Suspended: ['bad', 'warning-octagon'], Rejected: ['bad', 'x-circle'], Declined: ['bad', 'x-circle'] };
  const [t, i] = m[st] || ['neu', null];
  return chip(st, t, i);
}
const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

/* ---------- toasts / dialogs / drawers ---------- */
function toast(msg, tone = 'ok', i) {
  const ics = { ok: 'check', info: 'info', warn: 'warning', bad: 'x' };
  const host = $('#toasts');
  const el = document.createElement('div');
  el.className = 'toast'; el.setAttribute('role', 'status');
  el.innerHTML = `${tile(i || ics[tone], 'solid ' + tone, '')}<div class="grow">${msg}</div><button class="icon-btn" style="color:#fff" aria-label="Dismiss">${ic('x')}</button>`;
  el.querySelector('button').onclick = () => el.remove();
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}
function openDialog(html, o = {}) {
  closeDialog();
  const s = document.createElement('div');
  s.className = 'scrim'; s.id = 'dlg';
  s.innerHTML = `<div class="dialog ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`;
  s.addEventListener('mousedown', e => { if (e.target === s && !o.sticky) closeDialog(); });
  document.body.appendChild(s);
  setTimeout(() => { const f = s.querySelector('input,select,textarea,button.btn-primary'); f && f.focus(); }, 30);
}
function closeDialog() { const d = $('#dlg'); d && d.remove(); }
function openDrawer(html) {
  closeDrawer();
  const w = document.createElement('div'); w.id = 'drw';
  w.innerHTML = `<div class="drawer-scrim" data-act="closeDrawer"></div><aside class="drawer" role="dialog" aria-modal="true">${html}</aside>`;
  document.body.appendChild(w);
}
function closeDrawer() { const d = $('#drw'); d && d.remove(); }
function dlgHead(t, sub, i, tone = '') { return `<div class="row top">${i ? tile(i, tone) : ''}<div class="grow"><h2 class="h3">${t}</h2>${sub ? `<p class="muted small" style="margin-top:4px">${sub}</p>` : ''}</div><button class="icon-btn" data-act="closeDialog" aria-label="Close">${ic('x')}</button></div>`; }

/* ---------- state ---------- */
let S;
function resetState() { S = clone(SEED); S.ui = {}; }
resetState();
const ui = (k, d) => (S.ui[k] === undefined ? (S.ui[k] = typeof d === 'function' ? d() : clone(d)) : S.ui[k]);
function addAudit(action, record, who) {
  const p = persona();
  S.audit.unshift({ when: 'Just now', who: who || p.name, ini: p.ini, action, record, ws: S.ws, ip: '41.58.xx.xx' });
}
const notifMine = n => (n.ws === S.ws || n.ws === 'all') && (!n.org || (S.ws === 'organisation' ? n.org === S.orgId : S.ws === 'firm' ? n.org === S.firmId : true));
function notify(n) { S.notifications.unshift(Object.assign({ id: uid('n'), when: 'Just now', unread: true }, n)); }

/* ---------- accounts & workspaces ---------- */
const WS = {
  regulator: { label: 'Regulator', home: 'dashboard', icon: 'scales', sub: 'Supervision workspace' },
  organisation: { label: 'Organisation', home: 'org/dashboard', icon: 'buildings', sub: 'Organisation workspace' },
  firm: { label: 'Assurance firm', home: 'firm/dashboard', icon: 'briefcase', sub: 'Assurance firm workspace' }
};
const DEFAULT_ACCT = { regulator: 'm.bello@nitda.gov.ng', organisation: 'a.okonkwo@zenith.example', firm: 't.adebayo@deloitte.example' };
function persona() { const a = S.accounts[S.me] || S.accounts[DEFAULT_ACCT.regulator]; return Object.assign({ email: S.me }, a); }
const myOrg = () => S.orgs[S.orgId] || S.orgs.zenith;
const myFirm = () => S.firms[S.firmId] || S.firms.deloitte;
function signInAs(email) {
  const a = S.accounts[email]; if (!a) return false;
  S.me = email; S.ws = a.ws;
  const m = a.memberships[0];
  if (m.ws === 'organisation') S.orgId = m.id;
  if (m.ws === 'firm') S.firmId = m.id;
  return true;
}
/* opening an app screen directly (e.g. a shared link) signs in the matching demo account */
function ensureAccount(ws) {
  const a = S.accounts[S.me];
  if (a && a.memberships.some(m => m.ws === ws)) { S.ws = ws; return; }
  signInAs(DEFAULT_ACCT[ws]);
}

/* ---------- navigation ---------- */
const NAV = {
  regulator: [
    { i: 'squares-four', l: 'Dashboard', go: 'dashboard' },
    { sec: 'Supervise' },
    { i: 'buildings', l: 'Organisations', go: 'organisations', also: ['organisations/profile', 'organisations/invite'], cnt: () => Object.values(S.orgs).filter(o => o.status === 'Pending verification').length + S.classReqs.filter(r => r.status === 'Pending').length },
    { i: 'briefcase', l: 'Assurance firms', go: 'firms', also: ['firms/profile'], cnt: () => S.accApps.filter(a => a.status === 'In review').length },
    { i: 'gavel', l: 'Enforcement', go: 'enforcement', also: ['enforcement/case', 'enforcement/new'], cnt: () => (S.enfCases || []).filter(c => ['Awaiting sign-off', 'Response received'].includes(c.status)).length },
    { sec: 'Assess' },
    { i: 'book-open-text', l: 'Requirements library', go: 'library', also: ['library/regulation', 'library/requirement', 'library/edit', 'library/ai'] },
    { i: 'calendar-check', l: 'Programmes', go: 'programmes', also: ['programmes/new', 'programmes/view'] },
    { i: 'stamp', l: 'Reviews & publishing', go: 'reviews', also: ['reviews/report'], cnt: () => S.cases.filter(c => c.stage === 'Report submitted').length },
    { i: 'flag', l: 'Findings', go: 'findings', also: ['findings/view'], cnt: () => typeof allFindings === 'function' ? allFindings().filter(x => x.f.status === 'Verified fixed' || (x.f.ext && x.f.ext.status === 'Requested')).length : 0 },
    { sec: 'Collect' },
    { i: 'table', l: 'Data returns', go: 'returns', also: ['returns/template', 'returns/filing'], cnt: () => (S.filings || []).filter(f => ['Submitted', 'Resubmitted'].includes(f.status)).length }
  ],
  organisation: [
    { i: 'squares-four', l: 'Dashboard', go: 'org/dashboard', also: ['org/welcome'] },
    { i: 'shield-check', l: 'Compliance', go: 'org/compliance', also: ['org/compliance/programme', 'org/exposure', 'org/actions', 'org/action'], cnt: () => (S.enfCases || []).filter(c => c.org === S.orgId && c.status === 'Notice issued').length },
    { sec: 'Work' },
    { i: 'list-checks', l: 'Obligations', go: 'org/obligations', also: ['org/answer', 'org/submit', 'org/assessment', 'org/report'], cnt: () => S.cases.filter(c => c.org === S.orgId && ['Firm to choose', 'In preview'].includes(c.stage)).length },
    { i: 'table', l: 'Data returns', go: 'org/returns', also: ['org/return'], cnt: () => (S.filings || []).filter(f => f.org === S.orgId && f.status === 'Queried').length },
    { i: 'flag', l: 'Findings', go: 'org/findings', also: ['org/finding'], cnt: () => typeof allFindings === 'function' ? allFindings().filter(x => x.c.org === S.orgId && x.f.status === 'Open').length : 0 },
    { i: 'folder-open', l: 'Evidence library', go: 'org/evidence' },
    { sec: 'Organisation' },
    { i: 'users', l: 'Team', go: 'org/team' },
    { i: 'identification-card', l: 'Profile', go: 'org/profile' }
  ],
  firm: [
    { i: 'squares-four', l: 'Dashboard', go: 'firm/dashboard', also: ['firm/welcome'] },
    { sec: 'Work' },
    { i: 'kanban', l: 'Engagements', go: 'firm/engagements', also: ['firm/assess'], cnt: () => typeof ENG_GROUP === 'function' ? S.cases.filter(c => c.firm === S.firmId && ENG_GROUP(c) === 'Requests').length : 0 },
    { i: 'flag', l: 'Findings', go: 'firm/findings', also: ['firm/finding'], cnt: () => typeof allFindings === 'function' ? allFindings().filter(x => x.c.firm === S.firmId && x.f.status === 'Fix submitted').length : 0 },
    { sec: 'Firm' },
    { i: 'users', l: 'Team', go: 'firm/team' },
    { i: 'identification-card', l: 'Profile', go: 'firm/profile', also: ['firm/apply'] }
  ]
};
/* settings pages share one shell with a left menu (Slack/ClickUp pattern) */
const SETTINGS_NAV = [['Workspace', [['Profile', 'profile'], ['Branding', 'profile/branding'], ['Team', 'team']]], ['Supervision', [['Categories', 'settings/categories', ['settings/categories/import']], ['Firm types', 'settings/firm-types'], ['Scoring schemes', 'settings/scoring'], ['Deadlines & reminders', 'settings/deadlines'], ['Finding classes', 'settings/findings'], ['Compliance status', 'settings/compliance'], ['Action types', 'settings/actions']]]];
const SETTINGS_IDS = SETTINGS_NAV.flatMap(g => g[1].flatMap(x => [x[1], ...(x[2] || [])]));
function settingsShell(id, body) {
  return `<div class="set-shell"><nav class="set-nav" aria-label="Settings">${SETTINGS_NAV.map(([g, items]) => `<div class="set-g">${esc(g)}</div>${items.map(([l, r, also]) => `<a href="#${r}" data-go="${r}" class="${r === id || (also || []).includes(id) ? 'on' : ''}" data-test="set-${r.replace(/\//g, '-')}">${esc(l)}</a>`).join('')}`).join('')}</nav><div class="set-body">${body}</div></div>`;
}
function tenantMark(size = 36) {
  const t = S.tenant;
  return `<span class="logo s${size} tenant-mark" style="background:${t.col || 'var(--brand-500)'}" title="${esc(t.name)}">${esc(t.ini)}</span>`;
}
function navLink(n) {
  if (n.sec) return `<div class="sb-sec">${esc(n.sec)}</div>`;
  if (n.show && !n.show()) return '';
  const on = S.route === n.go || (n.also || []).includes(S.route);
  const c = n.cnt ? n.cnt() : 0;
  return `<a class="nav ${on ? 'on' : ''} ${c ? 'has-count' : ''}" href="#${n.go}" data-go="${n.go}" data-tip="${esc(n.l)}${c ? ' · ' + c + ' waiting for you' : ''}" title="${c ? esc(n.l) + ': ' + c + ' waiting for you' : ''}" aria-label="${esc(n.l)}">${ic(n.i)}<span>${n.l}</span>${c ? count(c) : ''}</a>`;
}
function sidebar() {
  const ws = S.ws, t = S.tenant;
  const ent = ws === 'organisation' ? myOrg() : ws === 'firm' ? myFirm() : null;
  const brand = ent ? `<div class="sb-brand">${logo(ent, 36)}<div class="grow"><b class="ell" style="display:block">${esc(ent.name)}</b><span>Supervised by ${esc(t.short)}</span></div><button class="sb-toggle" data-act="navCollapse" data-test="nav-toggle" aria-label="${railOn() ? 'Expand' : 'Collapse'} sidebar" title="${railOn() ? 'Expand' : 'Collapse'} sidebar">${ic('sidebar-simple')}</button></div>`
    : `<div class="sb-brand">${tenantMark(36)}<div class="grow"><b>${esc(t.short)}</b><span>${WS[ws].sub}</span></div><button class="sb-toggle" data-act="navCollapse" data-test="nav-toggle" aria-label="${railOn() ? 'Expand' : 'Collapse'} sidebar" title="${railOn() ? 'Expand' : 'Collapse'} sidebar">${ic('sidebar-simple')}</button></div>`;
  return `<aside class="sb" aria-label="Main navigation">
    ${brand}
    <nav class="sb-nav">${NAV[ws].map(navLink).join('')}</nav>
    <div class="sb-bottom">
      <button class="nav" data-act="help" data-tip="Help" aria-label="Help">${ic('question')}<span>Help</span></button>
      ${ws === 'regulator' ? navLink({ i: 'gear-six', l: 'Settings', go: 'settings/categories', also: SETTINGS_IDS }) : ''}
      <div class="sb-foot">${meridian(16, 'white')}<span>Powered by SuperAtlas</span></div>
    </div>
  </aside>`;
}
function topbar(crumbs) {
  const p = persona();
  const unread = S.notifications.filter(n => n.unread && notifMine(n)).length;
  return `<header class="topbar"><button class="icon-btn menu-btn" data-act="navToggle" aria-label="Menu">${ic('list')}</button>
    <nav class="crumbs" aria-label="Breadcrumb">${crumbs.map((c, i) => { const [l, g] = Array.isArray(c) ? c : [c]; return i < crumbs.length - 1 ? `${g ? `<a href="#${g}" data-go="${g}">${esc(l)}</a>` : `<span>${esc(l)}</span>`}${ic('caret-right')}` : `<b>${esc(l)}</b>`; }).join('')}</nav>
    <form class="search" data-form="search" role="search">${ic('magnifying-glass')}<input id="q" placeholder="Search" value="" aria-label="Search or jump to a page" data-test="top-search" readonly><kbd>${/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl '}K</kbd></form>
    ${typeof taskBtn === 'function' ? taskBtn() : ''}<button class="icon-btn" data-act="bell" aria-label="Notifications" title="Notifications" data-test="bell">${ic('bell')}${unread ? '<span class="bell-dot"></span>' : ''}</button>
    <button class="user" data-act="userMenu" data-test="user-menu">${av(p.ini)}<div><b>${esc(p.name)}</b><span>${esc(p.role)}</span></div>${ic('caret-down')}</button>
  </header>`;
}

/* ---------- collapsible sidebar: icons only when collapsed; auto-collapses between 761 and 1100 px ---------- */
let navMode = 'auto'; try { navMode = localStorage.getItem('sa-nav') || 'auto'; } catch (e) {}
function railOn() { const w = window.innerWidth; if (w <= 760) return false; return navMode === 'collapsed' || (navMode === 'auto' && w <= 1100); }
function applyRail() { const a = $('.app'); if (!a) return; const on = railOn(); a.classList.toggle('rail', on); const b = $('.sb-toggle'); if (b) { const l = (on ? 'Expand' : 'Collapse') + ' sidebar'; b.setAttribute('aria-label', l); b.title = l + ' ( [ )'; } }
function navCollapse() { navMode = railOn() ? 'expanded' : 'collapsed'; try { localStorage.setItem('sa-nav', navMode); } catch (e) {} applyRail(); };
window.addEventListener('resize', applyRail);
document.addEventListener('keydown', e => { if (e.key === '[' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && $('.app')) { e.preventDefault(); navCollapse(); } });

/* ---------- screens registry ---------- */
const SCREENS = {};
function screen(id, def) { SCREENS[id] = Object.assign({ id }, def); }

/* ---------- render ---------- */
function render() {
  const id = S.route;
  const scr = SCREENS[id] || SCREENS.home;
  if (scr.ws && scr.ws !== 'any' && scr.ws !== 'public') ensureAccount(scr.ws);
  if (scr.ws === 'any' && S.ws === 'public') ensureAccount('regulator');
  const root = $('#app');
  let body;
  try { body = scr.render(); if (SETTINGS_IDS.includes(id)) body = settingsShell(id, body); } catch (e) { console.error(e); body = `<div class="content"><div class="card">${alertBox('bad', 'This page failed to load', esc(e.message))}</div></div>`; }
  if (scr.layout === 'app') {
    const crumbs = typeof scr.crumbs === 'function' ? scr.crumbs() : (scr.crumbs || [scr.t]);
    root.innerHTML = `<div class="app ${railOn() ? 'rail' : ''}" data-screen="${id}">${sidebar()}<div class="main">${topbar(crumbs)}<main class="content" id="main">${body}</main></div></div>`;
    armIdle();
  } else {
    root.innerHTML = `<div data-screen="${id}">${body}</div>`;
    disarmIdle();
  }
  document.title = `${scr.t} · ${scr.layout === 'app' ? S.tenant.short + ' · ' : ''}SuperAtlas`;
  scr.mount && scr.mount();
}
function go(id, opts = {}) {
  if (!SCREENS[id]) id = 'home';
  closeDialog(); closeDrawer(); closePop();
  S.route = id; render(); window.scrollTo(0, 0);
  if (location.hash !== '#' + id) { try { history.pushState(null, '', '#' + id); } catch (e) { location.hash = id; } }
}
window.addEventListener('hashchange', onHash);
window.addEventListener('popstate', onHash);
function onHash() {
  const id = decodeURIComponent(location.hash.slice(1)) || 'home';
  if (id === S.route) return;
  S.route = SCREENS[id] ? id : 'home';
  closeDialog(); closeDrawer(); closePop();
  render(); window.scrollTo(0, 0);
}

/* ---------- actions & delegation ---------- */
const ACT = {};
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if (g && !g.disabled) { e.preventDefault(); if (g.dataset.ui) { const [k, v] = g.dataset.ui.split('='); S.ui[k] = v; } go(g.dataset.go); return; }
  const a = e.target.closest('[data-act]');
  if (a && !a.disabled) {
    const fn = ACT[a.dataset.act];
    if (fn) { if (!(a.tagName === 'INPUT' && /checkbox|radio/.test(a.type))) e.preventDefault(); fn(a.dataset.arg, a, e); }
    else console.warn('No action', a.dataset.act);
    return;
  }
  const pop = $('#pop');
  if (pop && !e.target.closest('#pop')) closePop();
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-form]');
  if (!f) return;
  e.preventDefault();
  const fn = ACT['form_' + f.dataset.form];
  fn ? fn(f, e) : console.warn('No form handler', f.dataset.form);
});
document.addEventListener('change', e => { const c = e.target.dataset && e.target.dataset.change; if (c && ACT['chg_' + c]) ACT['chg_' + c](e.target.value, e.target); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { closeDialog(); closeDrawer(); closePop(); }
  if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { const q = $('#q'); if (q) { e.preventDefault(); q.focus(); } }
});
const val = id => { const el = document.getElementById(id); return el ? (el.type === 'checkbox' ? el.checked : el.value.trim()) : ''; };

ACT.closeDialog = () => closeDialog();
ACT.navCollapse = () => navCollapse();
ACT.navToggle = () => document.body.classList.toggle('nav-open');
document.addEventListener('click', e => { if (document.body.classList.contains('nav-open') && (e.target.closest('.sb a') || (!e.target.closest('.sb') && !e.target.closest('.menu-btn')))) document.body.classList.remove('nav-open'); }, true);
ACT.closeDrawer = () => closeDrawer();
ACT.rerender = () => render();
ACT.setUi = (arg) => { const [k, v] = arg.split('='); S.ui[k] = v === 'true' ? true : v === 'false' ? false : v; render(); };
ACT.form_search = () => { S.ui.q = val('q'); go('search'); };
ACT.savedToast = (m) => toast(m || 'Saved');
ACT.fakeUpload = (m) => toast(m || 'Uploaded', 'ok', 'upload-simple');
ACT.help = () => openDialog(`${dlgHead('Help', 'Guides and support for ' + esc(S.tenant.short) + ' on SuperAtlas', 'question')}<div class="list" style="margin:0 -24px">${[['book-open-text', 'Getting started guide', 'How your workspace is organised'], ['play-circle', 'Short videos', 'Two-minute walkthroughs of common tasks'], ['chat-circle-dots', 'Contact support', 'support@superatlas.example · replies within one working day']].map(([i, t, d]) => `<button class="list-row" data-act="savedToast" data-arg="Opening ${t.toLowerCase()}">${tile(i, '', 'sm')}<span class="grow"><span class="strong" style="display:block">${t}</span><span class="cap muted">${d}</span></span>${ic('caret-right')}</button>`).join('')}</div>`);

/* popovers */
function closePop() { const p = $('#pop'); p && p.remove(); }
function openPop(anchor, html, align = 'right') {
  closePop();
  const r = anchor.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'popover'; p.id = 'pop'; p.innerHTML = html;
  document.body.appendChild(p);
  const w = p.offsetWidth;
  let left = align === 'right' ? r.right - w : r.left;
  left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
  p.style.left = left + 'px'; p.style.top = (r.bottom + 8 + window.scrollY) + 'px';
}
ACT.bell = (_, el) => {
  const list = S.notifications.filter(notifMine).slice(0, 5);
  openPop(el, `<div class="row between" style="padding:8px 10px"><b>Notifications</b><button class="link-btn small" data-act="markAll">Mark all read</button></div>
    ${list.map(n => `<button class="menu-item" data-act="openNotif" data-arg="${n.id}" style="align-items:flex-start">${tile(n.i, n.tone || '', 'sm')}<div class="grow"><div class="small ${n.unread ? 'semi' : ''}">${esc(n.title)}</div><div class="cap muted">${esc(n.when)}</div></div>${n.unread ? '<span class="dot" style="background:var(--brand-500);margin-top:6px"></span>' : ''}</button>`).join('') || '<p class="muted small" style="padding:12px">Nothing new.</p>'}
    <hr class="sep" style="margin:6px 0"><button class="menu-item" data-go="notifications">${ic('tray')}<span>View all notifications</span></button>`);
  $('#pop').style.width = '380px';
};
ACT.userMenu = (_, el) => {
  const p = persona(); const multi = (p.memberships || []).length > 1;
  openPop(el, `<div class="row" style="padding:10px">${av(p.ini, 40)}<div><div class="semi">${esc(p.name)}</div><div class="cap muted">${esc(p.email)}</div></div></div><hr class="sep" style="margin:4px 0">
    <button class="menu-item" data-go="account">${ic('user-circle')}<span>My account</span></button>
    <button class="menu-item" data-go="audit" data-test="menu-audit">${ic('clock-counter-clockwise')}<span>Audit trail</span></button>
    <hr class="sep" style="margin:4px 0"><button class="menu-item" data-act="signOut" data-test="sign-out">${ic('sign-out')}<span>Sign out</span></button>`);
  $('#pop').style.width = '260px';
};
ACT.signOut = () => { S.ws = 'public'; S.ui.signin = undefined; S.ui.signedOut = true; go('signin'); };
ACT.markAll = () => { S.notifications.forEach(n => { if (notifMine(n)) n.unread = false; }); closePop(); render(); toast('All notifications marked as read'); };
ACT.openNotif = (id) => { const n = S.notifications.find(x => x.id === id); if (!n) return; n.unread = false; closePop(); openRoute(n.go, n.arg); };
/* routes that take a record: organisations/profile (id|tab), firms/profile (id|tab), organisations (status filter) */
const OPEN_HOOKS = {};
function openRoute(r, arg) {
  if (arg) {
    const [a, b] = String(arg).split('|');
    if (r === 'organisations/profile') { S.ui.profileOrg = a; S.ui.orgTab = b || 'overview'; }
    else if (r === 'firms/profile') { S.ui.profileFirm = a; S.ui.firmTab = b || 'overview'; }
    else if (r === 'organisations') { S.ui.orgSt = a; }
    else if (r === 'programmes/view') { S.ui.progId = a; S.ui.progTab = b || 'overview'; }
    else if (OPEN_HOOKS[r]) OPEN_HOOKS[r](a, b);
    else if (r === 'firm/profile' || r === 'org/profile') { S.ui[r === 'firm/profile' ? 'myFirmTab' : 'myOrgTab'] = a; }
  }
  go(r);
}
ACT.open = (arg) => { const i = arg.indexOf(':'); openRoute(arg.slice(0, i), arg.slice(i + 1)); };

/* ---------- idle timeout: 15 minutes, then a 60-second warning ---------- */
const IDLE_MS = 15 * 60 * 1000;
let idleT = null;
function armIdle() { if (idleT) return; const reset = () => { clearTimeout(idleT); idleT = setTimeout(showTimeout, IDLE_MS); }; ['mousemove', 'keydown', 'click', 'scroll'].forEach(ev => window.addEventListener(ev, reset, { passive: true })); armIdle.reset = reset; reset(); }
function disarmIdle() { clearTimeout(idleT); }
function showTimeout() {
  if (S.ws === 'public') return;
  let n = 60;
  openDialog(`<div class="col" style="align-items:center;text-align:center;gap:14px">${tile('hourglass', 'warn', 'lg')}<h2 class="h2">Are you still there?</h2><p class="muted">For security, you will be signed out in <b id="tmo" class="tnum" style="color:var(--text)">60</b> seconds because you have been inactive. Unsaved changes will be lost.</p><div class="bar" style="width:100%"><i id="tmo-bar" style="width:100%;background:var(--warn-icon)"></i></div><div class="row" style="width:100%">${btn('Sign out now', { v: 'outline', cls: 'grow', act: 'tmoOut' })}${btn('Stay signed in', { cls: 'grow', act: 'tmoStay', test: 'tmo-stay' })}</div></div>`, { sticky: true });
  clearInterval(S._tmo);
  S._tmo = setInterval(() => { n--; const el = $('#tmo'); if (!el) { clearInterval(S._tmo); return; } el.textContent = n; $('#tmo-bar').style.width = (n / 60 * 100) + '%'; if (n <= 0) { clearInterval(S._tmo); closeDialog(); S.ui.timedOut = true; ACT.signOut(); } }, 1000);
}
ACT.tmoStay = () => { clearInterval(S._tmo); closeDialog(); toast('You are still signed in'); armIdle.reset && armIdle.reset(); };
ACT.tmoOut = () => { clearInterval(S._tmo); closeDialog(); ACT.signOut(); };

/* ---------- shared bits for app pages ---------- */
const allTypes = () => S.categories.flatMap(c => c.types.map(t => Object.assign({ sector: c.name }, t)));
const typeOpts = () => allTypes().map(t => t.name);
const btnIc = (i, act, arg, label) => `<button class="icon-btn" style="width:30px;height:30px" data-act="${act}" data-arg="${arg}" aria-label="${label}" title="${label}">${ic(i)}</button>`;
function routeTabs(items, active) { return `<div class="tabs" role="tablist">${items.map(([l, r, c]) => `<a role="tab" class="${r === active ? 'on' : ''}" href="#${r}" data-go="${r}">${esc(l)}${c !== undefined ? count(c) : ''}</a>`).join('')}</div>`; }
function initials(n) { return String(n || '').replace(/[^A-Za-z ]/g, ' ').split(/\s+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '—'; }
function upcoming(title, sub, bullets, extra = '') {
  return `${pageHead({ title, sub })}<div class="card soon-card"><div class="row top" style="gap:16px">${tile('hourglass', '', 'lg')}<div class="grow"><div class="row gap8"><span class="h3">Arrives in Drop B</span>${chip('Planned', 'neu')}</div><p class="muted small" style="margin-top:4px">This area is designed and scoped. It will be built once Drop A is signed off.</p><ul class="soon-list">${bullets.map(b => `<li>${ic('check')}<span>${b}</span></li>`).join('')}</ul>${extra}</div></div></div>`;
}

