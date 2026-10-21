/* ================= Phase 2 · Onboarding organisations and firms (C01–C14) ================= */
const catLabel = (type, tier) => type ? type + (tier ? ' · ' + tier : '') : 'Category to confirm';
const sectorOf = type => (S.categories.find(c => c.types.some(t => t.name === type)) || {}).name || '';
const tiersOf = type => (allTypes().find(t => t.name === type) || { tiers: [] }).tiers;
function catSelects(prefix, sector, type, tier, o = {}) {
  const secs = S.categories.map(c => c.name); const sec = sector || secs[0];
  const types = (S.categories.find(c => c.name === sec) || { types: [] }).types.map(t => t.name);
  const ty = types.includes(type) ? type : types[0]; const tiers = tiersOf(ty);
  return `<div class="grid g3" style="gap:12px">${field('Sector', sel(prefix + '-sec', secs, sec, { attrs: `data-change="cascade" data-prefix="${prefix}"` }), { for: prefix + '-sec' })}${field('Institution type', sel(prefix + '-type', types, ty, { attrs: `data-change="cascade" data-prefix="${prefix}"` }), { for: prefix + '-type' })}${field('Tier', tiers.length ? sel(prefix + '-tier', ['', ...tiers].map(x => [x, x || 'Choose a tier']), tier || '', { invalid: o.tierErr }) : `<input class="inp" id="${prefix}-tier" value="" placeholder="No tiers for this type" readonly>`, { for: prefix + '-tier', err: o.tierErr })}</div>`;
}
ACT.chg_cascade = (v, el) => {
  const p = el.dataset.prefix; const host = el.closest('[data-cat-host]');
  const sec = $('#' + p + '-sec').value; let type = $('#' + p + '-type').value;
  if (el.id.endsWith('-sec')) type = '';
  host.innerHTML = catSelects(p, sec, type, '');
  S.ui['cat_' + p] = { sec, type: $('#' + p + '-type').value };
};
const readCat = p => ({ sector: val(p + '-sec'), type: val(p + '-type'), tier: val(p + '-tier') });
const regOrgCount = () => Object.values(S.orgs).length;

/* C01 Invite organisations */
screen('organisations/invite', {
  t: 'Invite organisations', layout: 'app', ws: 'regulator', crumbs: [['Organisations', 'organisations'], 'Invite'],
  render() {
    const mode = ui('invMode', 'sheet');
    return `${pageHead({ title: 'Invite organisations', sub: 'Each invitation maps the organisation to a category. They can see it when they join, and only you can change it.' })}
      <div class="seg" role="tablist"><button class="${mode === 'sheet' ? 'on' : ''}" data-act="invMode" data-arg="sheet" data-test="mode-sheet">${ic('table')} Spreadsheet</button><button class="${mode === 'single' ? 'on' : ''}" data-act="invMode" data-arg="single" data-test="mode-single">${ic('user-plus')} One organisation</button></div>
      ${mode === 'single' ? inviteSingle() : inviteSheet()}`;
  }
});
ACT.invMode = (m) => { S.ui.invMode = m; render(); };
function newInvited(r) {
  const id = r.org.toLowerCase().replace(/[^a-z]+/g, '-').replace(/^-|-$/g, '').slice(0, 24);
  S.orgs[id] = { id, name: r.org, ini: r.ini, col: r.col, web: r.email.split('@')[1], sector: r.sector || sectorOf(r.type), type: r.type, tier: r.tier, status: 'Invited', officer: '—', joined: '—', last: 'Today', hq: '—', tags: [], isNew: true,
    invite: { email: r.email, sent: '19 Oct 2026', expires: '2 Nov 2026', by: persona().name, history: [['19 Oct 2026', 'Invitation sent', persona().name]] } };
  return id;
}
function emailPreview(org, cat) {
  const t = S.tenant;
  return `<div class="mail"><div class="mh"><b style="color:var(--text)">${esc(t.name)} invites ${esc(org || 'your organisation')} to SuperAtlas</b><span>From: ${esc(t.name)} &lt;no-reply@${esc(t.domain)}&gt;</span></div><div style="height:5px;background:var(--brand-500)"></div><div class="mb col gap12"><div class="row gap8"><span class="logo s32">${esc(t.ini)}</span><b>${esc(t.name)}</b></div><p class="small">Hello,</p><p class="small">${esc(t.name)} supervises ${esc(org || 'your organisation')} as a <b>${esc(cat || 'category to confirm')}</b>. Accept this invitation to set up your organisation's account. You will answer requirements and file returns here.</p><span class="btn btn-primary btn-sm" style="align-self:flex-start;box-shadow:none">Accept invitation</span><p class="cap muted">The link expires in ${esc(S.deadlines.inviteExpiry)} days. Powered by SuperAtlas.</p></div></div>`;
}
function inviteSingle() {
  const v = ui('invSingle', { org: '', email: '', msg: '', err: {} }); const c = S.ui.cat_inv || {};
  return `<form class="grid side" data-form="invSingle" novalidate><div class="card col gap16">
      ${field('Organisation name', inp('in-org', v.org, { ph: 'e.g. Northgate Bank Plc', invalid: v.err.org }), { err: v.err.org, for: 'in-org' })}
      ${field('Compliance contact email', inp('in-email', v.email, { type: 'email', ph: 'compliance@organisation.com', invalid: v.err.email }), { err: v.err.email, for: 'in-email' })}
      <div data-cat-host>${catSelects('inv', c.sec, c.type, '')}</div>
      ${field('Personal message', ta('in-msg', v.msg, { ph: 'Optional note added to the email' }), { opt: true, for: 'in-msg' })}
      <div class="row end">${btn('Cancel', { v: 'outline', go: 'organisations' })}${btn('Send invitation', { type: 'submit', i: 'envelope-simple', test: 'inv-single-send' })}</div></div>
    <div class="col gap12"><div class="overline">Email preview</div>${emailPreview(v.org, '')}</div></form>`;
}
ACT.form_invSingle = () => {
  const v = { org: val('in-org'), email: val('in-email'), msg: val('in-msg'), err: {} }; const c = readCat('inv');
  if (!v.org) v.err.org = 'Enter the organisation name';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) v.err.email = 'Enter a valid email address';
  if (tiersOf(c.type).length && !c.tier) { S.ui.invSingle = v; S.ui.cat_inv = { sec: c.sector, type: c.type }; toast('Choose a tier for this institution type', 'bad'); return render(); }
  S.ui.invSingle = v; if (Object.keys(v.err).length) return render();
  const ini = v.org.split(/\s+/).filter(w => /^[A-Z]/.test(w)).map(w => w[0]).join('').slice(0, 2) || 'OR';
  newInvited({ org: v.org, ini, col: '#3f51b5', email: v.email, sector: c.sector, type: c.type, tier: c.tier });
  addAudit('Sent invitation', v.org); S.ui.invSingle = undefined; S.ui.orgSt = 'Invited';
  toast(`Invitation sent to ${esc(v.org)}`, 'ok', 'envelope-simple'); go('organisations');
};
function inviteSheet() {
  const st = ui('sheet', { step: 0, rows: clone(SEED.importRows) });
  if (st.step === 0) return `<div class="grid g2"><div class="card col gap16">${tile('download-simple', '', 'lg')}<div class="h3">1. Fill in the template</div><p class="muted small">One row per organisation: name, contact email, sector, institution type and tier. Use the names from your category list.</p>
      <div class="tbl-wrap" style="border:1px solid var(--border);border-radius:12px"><table class="tbl"><thead><tr><th>organisation</th><th>email</th><th>institution_type</th><th>tier</th></tr></thead><tbody><tr><td>Northgate Bank Plc</td><td class="small">compliance@…</td><td>Commercial bank</td><td>National</td></tr></tbody></table></div>${btn('Download template (.xlsx)', { v: 'secondary', i: 'download-simple', act: 'savedToast', arg: 'Template downloaded' })}</div>
    <div class="card col gap16">${tile('upload-simple', '', 'lg')}<div class="h3">2. Upload it</div><p class="muted small">We match each row to a category and check for organisations already on SuperAtlas. Nothing is sent until you confirm.</p><button class="drop" data-act="sheetUpload" data-test="sheet-upload" style="padding:36px">${tile('cloud-arrow-up', '', 'lg')}<b>Drop your invite list here</b><span class="cap muted">.xlsx or .csv · demo uses invite-list.xlsx</span></button></div></div>`;
  if (st.step === 1) return `<div class="card col" style="align-items:center;text-align:center;padding:48px">${ic('circle-notch', 'spin')}<div class="h3">Reading invite-list.xlsx</div><p class="muted small">Matching 7 rows to your categories</p><div style="width:min(360px,100%)">${bar(62)}</div></div>`;
  if (st.step === 3) return '';
  const R = st.rows;
  const needs = R.filter(r => (r.flag === 'tier' && !r.tier) || (r.flag === 'category' && !r.resolved)).length;
  const sendable = R.filter(r => !r.skip && r.flag !== 'exists' && !(r.flag === 'category'));
  return `${fileRow('invite-list.xlsx', '7 rows · uploaded just now', { i: 'table', tone: 'ok', actions: btn('Replace file', { v: 'tertiary', size: 'sm', act: 'sheetReset' }) })}
    ${needs ? alertBox('warn', `${needs} row${needs > 1 ? 's' : ''} need your input`, 'Fix them to send. Organisations already on SuperAtlas are skipped automatically.') : alertBox('ok', 'Ready to send', `${sendable.length} invitations will go out. ${R.length - sendable.length} rows are skipped.`)}
    <div class="grid side"><div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Category</th><th>Check</th></tr></thead><tbody>${R.map((r, i) => {
      let catCell = cls(r.type || 'Category to confirm', r.tier), check;
      if (r.flag === 'exists') check = chip('Already in directory · skipped', 'neu', 'check');
      else if (r.flag === 'expired') check = chip('Earlier invite expired · will resend', 'info', 'arrow-clockwise');
      else if (r.flag === 'tier') { catCell = `<div class="row gap8">${cls(r.type)}${sel('tier-' + i, ['', ...tiersOf(r.type)].map(x => [x, x || 'Choose tier']), r.tier, { attrs: `data-change="rowTier" data-i="${i}" style="height:34px;width:150px" data-test="taj-tier"`, invalid: !r.tier })}</div>`; check = r.tier ? chip('Ready', 'ok', 'check') : chip('Tier needed', 'warn', 'warning'); }
      else if (r.flag === 'category') { check = r.resolved ? chip('Skipped · kept current category', 'neu') : `<div class="col gap6" style="align-items:flex-start">${chip('Already in directory as Mobile money operator', 'warn', 'warning')}<span class="cap muted" style="max-width:34ch">Your file says Microfinance bank. Category changes go through a classification request.</span>${btn('Skip row, keep current', { v: 'outline', size: 'sm', act: 'rowResolve', arg: i, test: 'opay-resolve' })}</div>`; }
      else check = chip('Ready', 'ok', 'check');
      return `<tr style="${(r.flag === 'tier' && !r.tier) || (r.flag === 'category' && !r.resolved) ? 'background:var(--warn-bg)' : ''}"><td>${orgCell(r, r.email)}</td><td>${catCell}</td><td>${check}</td></tr>`; }).join('')}</tbody></table></div></div>
      <div class="col gap12"><div class="overline">Email preview</div>${emailPreview('Northgate Bank Plc', 'Commercial bank · National')}</div></div>
    <div class="row end">${btn('Cancel', { v: 'outline', go: 'organisations' })}${btn(`Send ${sendable.length} invitations`, { i: 'envelope-simple', act: 'sheetSend', disabled: needs > 0, test: 'sheet-send' })}</div>`;
}
ACT.sheetUpload = () => { const st = ui('sheet'); st.step = 1; render(); setTimeout(() => { if (S.route === 'organisations/invite' && ui('sheet').step === 1) { st.step = 2; render(); } }, 1000); };
ACT.sheetReset = () => { S.ui.sheet = undefined; render(); };
ACT.chg_rowTier = (v, el) => { ui('sheet').rows[+el.dataset.i].tier = v; render(); };
ACT.rowResolve = (i) => { ui('sheet').rows[+i].resolved = true; render(); };
ACT.sheetSend = () => {
  const st = ui('sheet'); let n = 0;
  st.rows.forEach(r => {
    if (r.flag === 'exists' || r.flag === 'category') return;
    if (r.flag === 'expired') { const old = Object.values(S.orgs).find(x => x.name === r.org); if (old) { old.status = 'Invited'; old.invite.sent = '19 Oct 2026'; old.invite.expires = '2 Nov 2026'; orgHist(old, 'Invitation resent'); n++; return; } }
    newInvited(r); n++;
  });
  addAudit('Sent invitations', `${n} organisations from invite-list.xlsx`); S.ui.sheet = undefined; S.ui.orgSt = 'Invited';
  toast(`${n} invitations sent`, 'ok', 'envelope-simple'); go('organisations');
};

/* C03 Register and choose category (public) */
screen('register', {
  t: 'Register and choose category', d: 'Self-registration with category and licence', layout: 'public', ws: 'public',
  render() {
    const st = ui('reg', { step: 0, v: { name: 'Sapphire Microfinance Bank Ltd', trading: 'Sapphire MFB', rc: 'RC 000005 (sample)', web: 'sapphiremfb.example', addr: 'Ibadan, Oyo State', sec: 'Banking', type: 'Microfinance bank', tier: '', lic: '', licNo: 'MFB/ST/0000 (sample)', person: 'F. Adewale', title: 'Head of compliance', email: 'f.adewale@sapphiremfb.example', phone: '' }, err: {} });
    const v = st.v, e = st.err; const steps = ['Organisation', 'Category', 'Licence', 'Your details', 'Review'];
    let body;
    if (st.step === 0) body = `<div class="grid g2" style="gap:16px">${field('Legal name', inp('r-name', v.name, { invalid: e.name }), { err: e.name, for: 'r-name' })}${field('Trading name', inp('r-trading', v.trading), { opt: true, for: 'r-trading' })}${field('Registration number', inp('r-rc', v.rc, { invalid: e.rc }), { err: e.rc, for: 'r-rc' })}${field('Website', inp('r-web', v.web), { opt: true, for: 'r-web' })}</div>${field('Head office address', inp('r-addr', v.addr), { for: 'r-addr' })}`;
    if (st.step === 1) { const sec = S.categories.find(c => c.name === v.sec) || S.categories[0]; const ty = sec.types.find(t => t.name === v.type); body = `<div><div class="lbl" style="margin-bottom:8px">Sector</div><div class="grid g3" style="gap:8px">${S.categories.map(c => `<button type="button" class="choice ${c.name === v.sec ? 'on' : ''}" data-act="regPick" data-arg="sec|${c.name}"><span class="radio"></span><span><b>${esc(c.name)}</b><br><span class="cap muted">${c.types.length} institution types</span></span></button>`).join('')}</div></div>
      <div><div class="lbl" style="margin-bottom:8px">Institution type</div><div class="grid g2" style="gap:8px">${sec.types.map(t => `<button type="button" class="choice ${t.name === v.type ? 'on' : ''}" data-act="regPick" data-arg="type|${t.name}" data-test="pick-${t.id}"><span class="radio"></span><span><b>${esc(t.name)}</b><br><span class="cap muted">${t.tiers.length ? 'Tiers: ' + t.tiers.join(', ') : 'No tiers'}</span></span></button>`).join('')}</div></div>
      ${ty && ty.tiers.length ? `<div><div class="lbl" style="margin-bottom:8px">Authorisation tier ${e.tier ? `<span class="err" style="display:inline-flex;color:var(--bad-fg);font-weight:400;font-size:12px;margin-left:8px">${ic('warning-circle')} ${e.tier}</span>` : ''}</div><div class="row wrap gap8">${ty.tiers.map(t => `<button type="button" class="pill ${t === v.tier ? 'on' : ''}" data-act="regPick" data-arg="tier|${t}" data-test="tier-${t}">${t}</button>`).join('')}</div></div>` : ''}
      ${note('Choose the category on your licence. The regulator checks it during verification, and only the regulator can change it later.', 'lock-simple')}`; }
    if (st.step === 2) body = `${field('Licence number', inp('r-licno', v.licNo), { for: 'r-licno' })}${v.lic ? fileRow(v.lic, '1.8 MB · uploaded just now', { i: 'file-text', tone: 'ok', actions: btn('Remove', { v: 'tertiary', size: 'sm', act: 'regLic', arg: '' }) }) : `<button type="button" class="drop" data-act="regLic" data-arg="Microfinance banking licence — state.pdf" data-test="reg-lic">${tile('upload-simple', '', 'sm')}<b>Upload your operating licence</b><span class="cap muted">PDF, up to 10 MB</span></button>`}${e.lic ? `<div class="field"><div class="err">${ic('warning-circle')}${e.lic}</div></div>` : ''}`;
    if (st.step === 3) body = `<div class="grid g2" style="gap:16px">${field('Your full name', inp('r-person', v.person, { invalid: e.person }), { err: e.person, for: 'r-person' })}${field('Job title', inp('r-title', v.title), { for: 'r-title' })}${field('Work email', inp('r-email', v.email, { type: 'email', invalid: e.email }), { err: e.email, hint: 'Use your organisation\'s domain. We will send a link to set your password.', for: 'r-email' })}${field('Phone', inp('r-phone', v.phone), { opt: true, for: 'r-phone' })}</div>`;
    if (st.step === 4) body = `${kv([['Legal name', esc(v.name)], ['Registration number', esc(v.rc)], ['Head office', esc(v.addr)], ['Category', cls(v.type, v.tier)], ['Licence', esc(v.lic) + ' · ' + esc(v.licNo)], ['Contact', `${esc(v.person)} · ${esc(v.title)}<br><span class="muted small">${esc(v.email)}</span>`]])}${ck('r-decl', 'I confirm these details are accurate and I am authorised to register this organisation.', false)}${e.decl ? `<div class="field"><div class="err">${ic('warning-circle')}${e.decl}</div></div>` : ''}`;
    const done = st.step === 5;
    return `<div class="mk" style="background:var(--canvas);min-height:100vh">${mkNav()}<div style="max-width:960px;margin:0 auto;padding:40px var(--side-gutter-r) 80px var(--side-gutter-l);display:flex;flex-direction:column;gap:24px">
      ${done ? `<div class="card col gap16" style="padding:40px;align-items:flex-start">${tile('check-circle', 'solid ok', 'lg')}<h1 class="h1">Application received</h1><p class="muted" style="font-size:16px;line-height:25px">${esc(S.tenant.name)} will verify ${esc(v.name)} and confirm your category. We have emailed <b style="color:var(--text)">${esc(v.email)}</b> a link to set your password. Reference <span class="mono">REG-2026-0458</span>.</p>
        <div class="timeline" style="width:100%">${[['check-circle', 'ok', 'Application submitted', 'Just now'], ['hourglass', 'info', 'Verification by the regulator', 'Usually within 3 working days'], ['buildings', 'neu', 'Complete your profile and invite colleagues', 'After verification']].map(([i, t, a, b]) => `<div class="tl">${tile(i, t, 'sm')}<div><b>${a}</b><div class="cap muted">${b}</div></div></div>`).join('')}</div>
        <div class="row wrap">${btn('Back to the site', { v: 'outline', go: 'home', test: 'reg-home' })}</div></div>`
      : `<div><span class="overline">Register your organisation</span><h1 class="h1" style="margin-top:6px">Join ${esc(S.tenant.name)} on SuperAtlas</h1><p class="muted" style="margin-top:6px">For organisations supervised by ${esc(S.tenant.name)} that have not received an invitation.</p></div>
      ${stepper(steps, st.step)}
      <form class="card col gap20" data-form="reg" novalidate>${body}<div class="row between">${st.step ? btn('Back', { v: 'outline', act: 'regBack', i: 'arrow-left' }) : `<a href="#signin" data-go="signin" class="small strong">Already have an account? Sign in</a>`}${btn(st.step === 4 ? 'Submit application' : 'Continue', { type: 'submit', ir: st.step === 4 ? 'check' : 'arrow-right', test: 'reg-next' })}</div></form>`}
    </div></div>`;
  }
});
function readReg() { const v = ui('reg').v; [['name', 'r-name'], ['trading', 'r-trading'], ['rc', 'r-rc'], ['web', 'r-web'], ['addr', 'r-addr'], ['licNo', 'r-licno'], ['person', 'r-person'], ['title', 'r-title'], ['email', 'r-email'], ['phone', 'r-phone']].forEach(([k, id]) => { if (document.getElementById(id)) v[k] = val(id); }); }
ACT.regPick = (arg) => { readReg(); const [k, x] = arg.split('|'); const v = ui('reg').v; if (k === 'sec') { v.sec = x; v.type = S.categories.find(c => c.name === x).types[0].name; v.tier = ''; } if (k === 'type') { v.type = x; v.tier = ''; } if (k === 'tier') v.tier = x; ui('reg').err = {}; render(); };
ACT.regLic = (f) => { readReg(); ui('reg').v.lic = f; ui('reg').err = {}; render(); };
ACT.regBack = () => { readReg(); ui('reg').step--; render(); };
ACT.form_reg = () => {
  readReg(); const st = ui('reg'), v = st.v, e = {};
  if (st.step === 0) { if (!v.name) e.name = 'Enter the legal name'; if (!v.rc) e.rc = 'Enter the registration number'; }
  if (st.step === 1 && tiersOf(v.type).length && !v.tier) e.tier = 'Choose a tier';
  if (st.step === 2 && !v.lic) e.lic = 'Upload your licence to continue';
  if (st.step === 3) { if (!v.person) e.person = 'Enter your name'; if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) e.email = 'Enter a valid work email'; }
  if (st.step === 4 && !val('r-decl')) e.decl = 'Confirm the declaration to submit';
  st.err = e; if (Object.keys(e).length) return render();
  if (st.step === 4) {
    const id = 'sapphire'; S.orgs[id] = { id, name: v.name, ini: initials(v.name.replace(/ Ltd| Plc/, '')), col: '#1565C0', web: v.web, sector: v.sec, type: v.type, tier: v.tier, status: 'Pending verification', officer: v.person, joined: '—', last: 'Today', hq: v.addr, tags: [], selfReg: true, isNew: true,
      invite: { history: [['19 Oct 2026', 'Registered and submitted for verification', v.person]] },
      application: { route: 'Self-registration', submitted: '19 Oct 2026', rc: v.rc, licence: v.lic, contact: `${v.person} · ${v.title}`, checks: [['RC number format', true], ['Licence category matches chosen category', true], ['No duplicate organisation', true], ['Contact email on organisation domain', true]] } };
    notify({ ws: 'regulator', i: 'seal-check', tone: 'info', title: `${v.name} registered and is waiting for verification`, go: 'organisations/profile', arg: 'sapphire|verification', kind: 'Approvals' });
    S.audit.unshift({ when: 'Just now', who: v.person, ini: 'FA', action: 'Registered organisation', record: v.name, ws: 'organisation', ip: '102.90.xx.xx', detail: catLabel(v.type, v.tier) });
  }
  st.step++; render(); window.scrollTo(0, 0);
};

/* Organisation first-time setup */
const ORG_STEPS = [['profile', 'Organisation profile', 'identification-card'], ['logo', 'Logo', 'image'], ['officers', 'Key officers', 'users'], ['people', 'Invite colleagues', 'user-plus'], ['group', 'Group links', 'buildings']];
screen('org/welcome', {
  t: 'Set up your organisation', layout: 'app', ws: 'organisation', crumbs: [['Dashboard', 'org/dashboard'], 'Set up'],
  render() {
    const o = myOrg(); o.officers = o.officers || [{ ini: initials(o.officer), name: o.officer, role: 'Chief compliance officer', email: o.email || '' }]; o.colleagues = o.colleagues || []; o.links = o.links || []; o.onboard = o.onboard || { profile: true, logo: true, officers: true, people: true, group: true }; const cur = ui('obStep', ORG_STEPS.find(s => !o.onboard[s[0]])?.[0] || 'profile');
    const done = ORG_STEPS.filter(s => o.onboard[s[0]]).length;
    let body = '';
    if (cur === 'profile') body = `<form class="col gap16" data-form="obProfile"><div class="grid g2" style="gap:16px">${field('Legal name', inp('ob-name', o.name, { ro: true }), { hint: 'From your invitation. Contact the regulator to change it.', for: 'ob-name' })}${field('Trading name', inp('ob-trade', o.name.replace(/ (Plc|Ltd|Limited)$/, '')), { for: 'ob-trade' })}${field('Registration number', inp('ob-rc', o.rc), { for: 'ob-rc' })}${field('Website', inp('ob-web', o.web), { for: 'ob-web' })}${field('Head office', inp('ob-hq', o.hq), { for: 'ob-hq' })}${field('Compliance contact email', inp('ob-em', o.email || '', { type: 'email' }), { for: 'ob-em' })}</div><div class="row end">${btn('Save and continue', { type: 'submit', ir: 'arrow-right' })}</div></form>`;
    if (cur === 'logo') body = `<div class="col gap16"><p class="muted small">Your logo appears to the regulator and your assurance firm wherever your organisation is listed.</p><div class="grid g2" style="gap:12px">${['On light', 'On dark'].map((l, i) => `<div class="col" style="align-items:center;gap:8px;padding:18px;border-radius:14px;background:${i ? 'var(--brand-800)' : 'var(--canvas)'}">${logo(o, 48)}<span class="cap" style="color:${i ? 'var(--brand-200)' : 'var(--text-2)'}">${l}</span></div>`).join('')}</div>
      ${o.logoUp ? fileRow(o.id + '-logo.svg', '18 KB · square · uploaded just now', { i: 'image', tone: 'ok', actions: btn('Replace', { v: 'tertiary', size: 'sm', act: 'obLogo' }) }) : `<button class="drop" data-act="obLogo" data-test="ob-logo">${tile('upload-simple', '', 'sm')}<b>Upload your logo</b><span class="cap muted">SVG or PNG, square, at least 256 px</span></button>`}
      ${note('Until a logo is uploaded, your initials are shown in your brand colour.')}<div class="row end">${btn('Skip for now', { v: 'tertiary', act: 'obNext', arg: 'logo' })}${btn('Continue', { act: 'obNext', arg: 'logo', disabled: !o.logoUp, ir: 'arrow-right', test: 'ob-logo-next' })}</div></div>`;
    if (cur === 'officers') body = `<div class="col gap16"><p class="muted small">The regulator sees these people as your accountable officers.</p>${o.officers.map((p, i) => `<div class="file">${av(p.ini)}<div class="grow"><div class="strong">${esc(p.name)}</div><div class="cap muted">${esc(p.role)} · ${esc(p.email)}</div></div>${i ? btnIc('trash', 'obOffDel', i, 'Remove') : chip('You', 'brand')}</div>`).join('')}
      <form class="card flat tight col gap12" data-form="obOfficer" novalidate><b class="small">Add an officer</b><div class="grid g3" style="gap:12px">${inp('of-name', '', { ph: 'Full name' })}${sel('of-role', ['Chief information security officer', 'Head, internal audit', 'Data protection officer', 'Chief risk officer', 'Managing director'], 'Chief information security officer')}${inp('of-email', '', { ph: 'Email', type: 'email' })}</div><div class="row end">${btn('Add officer', { type: 'submit', v: 'secondary', i: 'plus', test: 'of-add' })}</div></form>
      <div class="row end">${btn('Continue', { act: 'obNext', arg: 'officers', disabled: o.officers.length < 2, ir: 'arrow-right', test: 'ob-off-next' })}</div>${o.officers.length < 2 ? '<p class="cap muted" style="text-align:right">Add at least one more officer.</p>' : ''}</div>`;
    if (cur === 'people') body = `<div class="col gap16"><p class="muted small">Colleagues help answer requirements and file returns. You choose what each person can do.</p>${o.colleagues.map(p => `<div class="file">${av(p.name.split(' ').map(w => w[0]).join(''))}<div class="grow"><div class="strong">${esc(p.email)}</div><div class="cap muted">${esc(p.role)}</div></div>${chip('Invited', 'info', 'envelope-simple')}</div>`).join('')}
      <form class="card flat tight col gap12" data-form="obColleague" novalidate><div class="grid g2" style="gap:12px;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr)">${inp('co-email', '', { ph: 'colleague@' + (o.web || 'organisation.com'), type: 'email' })}${sel('co-role', ['Contributor · answers assigned requirements', 'Compliance officer · approves and submits', 'Executive viewer · read only', 'Organisation admin'], 'Contributor · answers assigned requirements')}</div><div class="row end">${btn('Send invite', { type: 'submit', v: 'secondary', i: 'envelope-simple', test: 'co-add' })}</div></form>
      <div class="row end">${btn('Skip for now', { v: 'tertiary', act: 'obNext', arg: 'people' })}${btn('Continue', { act: 'obNext', arg: 'people', disabled: !o.colleagues.length, ir: 'arrow-right', test: 'ob-people-next' })}</div></div>`;
    if (cur === 'group') body = `<div class="col gap16">${alertBox('info', 'Each entity answers on its own', 'Linking a holding company or subsidiary is for reference only. Every entity keeps its own requirements, answers, scores and findings.')}
      ${o.links.map(l => `<div class="file">${tile('buildings', '', 'sm')}<div class="grow"><div class="strong">${esc(l.name)}</div><div class="cap muted">${esc(l.rel)}</div></div>${chip('Linked', 'ok')}</div>`).join('')}
      <form class="card flat tight col gap12" data-form="obLink"><div class="grid g2" style="gap:12px">${inp('ln-name', '', { ph: 'Linked entity name' })}${sel('ln-rel', ['Holding company', 'Subsidiary', 'Sister company'], 'Holding company')}</div><div class="row end">${btn('Add link', { type: 'submit', v: 'secondary', i: 'plus' })}</div></form>
      <div class="row end">${btn('No group links', { v: 'tertiary', act: 'obNext', arg: 'group' })}${btn('Finish setup', { act: 'obNext', arg: 'group', test: 'ob-finish' })}</div></div>`;
    return `<div class="ph">${logo(o, 48)}<div class="grow"><div class="overline">Getting started</div><h1 class="h1" style="margin-top:2px">Set up ${esc(o.name)}</h1><p class="muted small" style="margin-top:2px">Category: <b style="color:var(--text);font-weight:500">${esc(catLabel(o.type, o.tier))}</b>, set by ${esc(S.tenant.short)}</p></div><div class="page-progress"><div class="grow">${bar(done / ORG_STEPS.length * 100)}</div><span class="cap strong tnum">${done} of ${ORG_STEPS.length}</span></div></div>
      <div class="grid side-l"><div class="card tight vsteps">${ORG_STEPS.map(([k, l, i], n) => `<button class="vstep ${cur === k ? 'on' : ''} ${o.onboard[k] ? 'done' : ''}" data-act="obGo" data-arg="${k}"><span class="n">${o.onboard[k] ? ic('check') : n + 1}</span>${l}</button>`).join('')}<hr class="sep" style="margin:8px 0">${btn('View profile', { v: 'tertiary', go: 'org/profile', i: 'eye' })}</div>
        <div class="card col gap16"><div class="row">${tile(ORG_STEPS.find(s => s[0] === cur)[2])}<div class="h3">${ORG_STEPS.find(s => s[0] === cur)[1]}</div></div>${body}</div></div>`;
  }
});
ACT.obGo = (k) => { S.ui.obStep = k; render(); };
function obAdvance(k) { const o = myOrg(); o.onboard[k] = true; const nx = ORG_STEPS.find(s => !o.onboard[s[0]]); if (nx) { S.ui.obStep = nx[0]; render(); } else { addAudit('Completed onboarding', o.name); toast('Setup complete. Your profile is ready.', 'ok', 'check-circle'); go('org/dashboard'); } }
ACT.form_obProfile = () => { const o = myOrg(); o.web = val('ob-web'); o.hq = val('ob-hq'); o.email = val('ob-em'); o.rc = val('ob-rc'); toast('Profile saved'); obAdvance('profile'); };
ACT.obLogo = () => { myOrg().logoUp = true; render(); toast('Logo uploaded', 'ok', 'image'); };
ACT.obNext = (k) => obAdvance(k);
ACT.form_obOfficer = () => { const n = val('of-name'), e = val('of-email'); if (!n || !/@/.test(e)) { toast('Add a name and email', 'bad'); return; } myOrg().officers.push({ ini: n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), name: n, role: val('of-role'), email: e }); render(); toast('Officer added'); };
ACT.obOffDel = (i) => { myOrg().officers.splice(+i, 1); render(); };
ACT.form_obColleague = () => { const e = val('co-email'); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) { toast('Enter a valid email', 'bad'); return; } myOrg().colleagues.push({ email: e, name: e.split('@')[0].replace(/\./g, ' '), role: val('co-role').split(' · ')[0] }); render(); toast(`Invitation sent to ${esc(e)}`, 'ok', 'envelope-simple'); };
ACT.form_obLink = () => { const n = val('ln-name'); if (!n) return; myOrg().links.push({ name: n, rel: val('ln-rel') }); myOrg().group = n; render(); toast('Group link added'); };

/* C07 Organisation profile (shared pattern; regulator and own views) */
/* regulator decisions: verification, classification, accreditation, firm status */
function orgHist(o, what, who) { o.invite = o.invite || { history: [] }; o.invite.history.push([fmtDate('2026-10-19'), what, who || persona().name]); }
ACT.verApprove = (id) => {
  const o = S.orgs[id]; o.status = 'Verified'; o.joined = 'Oct 2026'; o.last = 'Today'; o.infoMsg = '';
  orgHist(o, 'Verified'); addAudit('Verified organisation', o.name);
  notify({ ws: 'organisation', i: 'seal-check', tone: 'ok', title: `${S.tenant.short} verified ${o.name}`, go: 'org/profile', kind: 'Updates' });
  render(); toast(`${esc(o.name)} verified`, 'ok', 'seal-check');
};
ACT.verAsk = (id) => openDialog(`${dlgHead('Ask for more information', 'The organisation gets an email and sees your message when it signs in.', 'chat-circle-dots')}<div class="col gap16">${field('Message', ta('va-msg', 'Please upload your licence showing the current authorisation tier.'), { for: 'va-msg' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Send request', { act: 'verAskGo', arg: id, test: 'ver-ask-go' })}</div></div>`);
ACT.verAskGo = (id) => { const o = S.orgs[id]; const m = val('va-msg'); if (!m) { toast('Write what you need', 'bad'); return; } o.status = 'Info requested'; o.infoMsg = m; orgHist(o, 'More information requested'); closeDialog(); addAudit('Requested more information', o.name); render(); toast('Request sent'); };
ACT.verReject = (id) => openDialog(`${dlgHead('Reject this application?', 'Tell the applicant why. They can apply again.', 'x-circle', 'bad')}<div class="col gap16">${field('Reason', ta('vr-msg', '', { ph: 'e.g. The licence does not match the chosen category' }), { for: 'vr-msg' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Reject application', { v: 'danger', act: 'verRejectGo', arg: id })}</div></div>`);
ACT.verRejectGo = (id) => { if (!val('vr-msg')) { toast('Give a reason so the applicant knows what to fix', 'bad'); return; } const o = S.orgs[id]; o.status = 'Rejected'; o.rejectMsg = val('vr-msg'); orgHist(o, 'Application rejected'); closeDialog(); addAudit('Rejected application', o.name); render(); toast('Application rejected'); };
ACT.invResend = (id) => { const o = S.orgs[id]; o.status = 'Invited'; o.invite.sent = '19 Oct 2026'; o.invite.expires = '2 Nov 2026'; o.last = 'Today'; orgHist(o, 'Invitation resent'); closePop(); render(); toast(`Invitation resent to ${esc(o.name)}`, 'ok', 'envelope-simple'); addAudit('Resent invitation', o.name); };
ACT.invRevoke = (id) => { closePop(); const o = S.orgs[id]; openDialog(`${dlgHead('Revoke the invitation to ' + esc(o.name) + '?', 'The link stops working straight away. You can invite them again later.', 'warning', 'bad')}<div class="row end">${btn('Keep it', { v: 'outline', act: 'closeDialog' })}${btn('Revoke invitation', { v: 'danger', act: 'invRevokeGo', arg: id, test: 'revoke-go' })}</div>`); };
ACT.invRevokeGo = (id) => { const o = S.orgs[id]; o.status = 'Revoked'; orgHist(o, 'Invitation revoked'); closeDialog(); render(); toast('Invitation revoked'); addAudit('Revoked invitation', o.name); };
ACT.invPreview = (id) => { const o = S.orgs[id]; openDialog(`${dlgHead('Invitation email', 'As sent to ' + esc(o.invite.email), 'envelope-simple')}${emailPreview(o.name, catLabel(o.type, o.tier))}<div class="row end">${btn('Close', { v: 'outline', act: 'closeDialog' })}</div>`, { wide: true }); };

ACT.regChangeCat = (id) => { const o = S.orgs[id]; openDialog(`${dlgHead('Change category for ' + esc(o.name), 'The organisation is told and the change is recorded. Requirements follow from the next cycle.', 'git-diff')}<div class="col gap16"><div data-cat-host>${catSelects('rc', o.sector, o.type, o.tier)}</div>${field('Reason', ta('rc-reason', '', { ph: 'e.g. New licence issued on 1 October' }), { for: 'rc-reason' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Change category', { act: 'regChangeCatGo', arg: id })}</div></div>`, { wide: true }); };
ACT.regChangeCatGo = (id) => { const c = readCat('rc'); if (!val('rc-reason')) { toast('Give a reason for the change', 'bad'); return; } const o = S.orgs[id]; Object.assign(o, { sector: c.sector, type: c.type, tier: c.tier }); closeDialog(); addAudit('Changed category', `${o.name} → ${catLabel(c.type, c.tier)}`); render(); toast('Category changed'); };
ACT.ccDecide = (arg) => {
  const [id, d] = arg.split('|'); const r = S.classReqs.find(x => x.id === id); const n = val('cc-note');
  if (d === 'Rejected' && !n) { toast('Add a note so the organisation knows why', 'bad'); return; }
  r.status = d; r.note = n; r.decided = '19 Oct 2026';
  const o = S.orgs[r.org];
  if (d === 'Approved') Object.assign(o, { sector: r.to.sector, type: r.to.type, tier: r.to.tier });
  addAudit(d === 'Approved' ? 'Approved classification change' : 'Rejected classification change', `${o.name} · ${r.ref}`);
  notify({ ws: 'organisation', i: 'git-diff', tone: d === 'Approved' ? 'ok' : 'bad', title: `${S.tenant.short} ${d.toLowerCase()} your classification change`, go: 'org/profile', arg: 'classification', kind: 'Updates' });
  render(); toast(`${d}: ${esc(o.name)} is ${d === 'Approved' ? 'now ' + esc(catLabel(o.type, o.tier)) : 'unchanged'}`, d === 'Approved' ? 'ok' : 'info');
};
ACT.accDecide = (arg) => {
  const [id, d] = arg.split('|'); const a = S.accApps.find(x => x.id === id); const f = S.firms[a.firm];
  if (d === 'Info requested') return openDialog(`${dlgHead('Ask for more information', 'The firm is emailed and sees your note on its profile.', 'chat-circle-dots')}<div class="col gap16">${field('What do you need?', ta('acc-msg', a.docs.filter(x => !x[1]).map(x => 'Please upload: ' + x[0]).join('\n') || ''), { for: 'acc-msg' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Send request', { act: 'accInfoGo', arg: id })}</div></div>`);
  a.status = d; a.decided = '19 Oct 2026';
  if (d === 'Accredited') {
    if (!f.types.includes(a.type)) f.types.push(a.type); f.status = 'Accredited'; if (f.since === '—') f.since = 'Nov 2026'; if (f.renews === '—') f.renews = 'Oct 2027';
    (S.firmAccreditations[a.firm] = S.firmAccreditations[a.firm] || []).push({ type: a.type, ref: 'ACC-2026-0' + (300 + S.accApps.length), from: fmtDate(val('ac-from') || '2026-11-01'), to: fmtDate(val('ac-to') || '2027-10-31'), status: 'Active' });
  } else if (!(S.firmAccreditations[a.firm] || []).length) f.status = 'Declined';
  addAudit(d === 'Accredited' ? 'Accredited firm' : 'Declined accreditation', `${f.name} · ${a.type}`);
  notify({ ws: 'firm', i: 'certificate', tone: d === 'Accredited' ? 'ok' : 'warn', title: `${S.tenant.short}: ${a.type} application ${d.toLowerCase()}`, go: 'firm/profile', arg: 'accreditations', kind: 'Updates' });
  render(); toast(d === 'Accredited' ? `${esc(f.name)} accredited for ${esc(a.type)}` : `${esc(f.name)}: application declined`, d === 'Accredited' ? 'ok' : 'info', 'certificate');
};
ACT.accInfoGo = (id) => { const a = S.accApps.find(x => x.id === id); a.status = 'Info requested'; a.infoMsg = val('acc-msg'); closeDialog(); addAudit('Requested more information', S.firms[a.firm].name); render(); toast('Request sent to the firm'); };

ACT.firmMenu = (id, el, e) => { e.stopPropagation(); const f = S.firms[id]; openPop(el, `${f.status !== 'Suspended' ? `<button class="menu-item" data-act="firmRenew" data-arg="${id}">${ic('arrow-clockwise')}Renew accreditation</button><button class="menu-item" data-act="firmSuspend" data-arg="${id}" style="color:var(--bad-fg)">${ic('warning-octagon')}Suspend</button>` : `<button class="menu-item" data-act="firmReinstate" data-arg="${id}">${ic('seal-check')}Reinstate</button>`}<button class="menu-item" data-act="openFirm" data-arg="${id}">${ic('eye')}Open profile</button>`); };
ACT.firmRenew = (id) => { closePop(); const f = S.firms[id]; openDialog(`${dlgHead('Renew ' + esc(f.name), `Extends accreditation by ${esc(S.firmRules.renewal)} months.`, 'arrow-clockwise')}${kv([['Current expiry', esc(f.renews)], ['New expiry', 'Nov 2027'], ['Types', esc(f.types.join(', '))]])}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Renew', { act: 'firmRenewGo', arg: id })}</div>`); };
ACT.firmRenewGo = (id) => { const f = S.firms[id]; f.status = 'Accredited'; f.renews = 'Nov 2027'; closeDialog(); render(); toast(`${esc(f.name)} renewed until Nov 2027`); addAudit('Renewed accreditation', f.name); };
ACT.firmSuspend = (id) => { closePop(); const f = S.firms[id]; openDialog(`${dlgHead('Suspend ' + esc(f.name) + '?', 'The firm cannot start new engagements. Organisations it is assessing are told, and you can reassign them in Drop B.', 'warning-octagon', 'bad')}${f.assigned ? alertBox('warn', `${f.assigned} organisations are assigned to this firm`, 'Their engagements will be flagged for reassignment.') : ''}${field('Reason', ta('su-r', '', { ph: 'e.g. Professional indemnity insurance lapsed' }), { for: 'su-r' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Suspend firm', { v: 'danger', act: 'firmSuspendGo', arg: id, test: 'suspend-go' })}</div>`); };
ACT.firmSuspendGo = (id) => { const r = val('su-r'); if (!r) { toast('Give a reason for the suspension', 'bad'); return; } const f = S.firms[id]; f.status = 'Suspended'; f.suspendReason = r; closeDialog(); render(); toast(`${esc(f.name)} suspended`, 'warn', 'warning-octagon'); addAudit('Suspended firm', `${f.name} · ${r}`); };
ACT.firmReinstate = (id) => { closePop(); const f = S.firms[id]; f.status = 'Accredited'; render(); toast(`${esc(f.name)} reinstated`); addAudit('Reinstated firm', f.name); };
/* C10 Apply for accreditation (firm: Deloitte) */
screen('firm/apply', {
  t: 'Apply for accreditation', layout: 'app', ws: 'firm', crumbs: [['Profile', 'firm/profile'], 'Apply for accreditation'],
  render() {
    const f = myFirm(); const accs = S.firmAccreditations[f.id] || []; const app = S.accApps.find(a => a.firm === f.id && a.status !== 'Accredited' && a.status !== 'Declined');
    const st = ui('accForm', { step: 0, type: 'Data protection (DPCO)', docs: {}, assessors: Object.fromEntries(myFirm().people.filter(p => p.status === 'Active').map(p => [p.name, true])), err: '' });
    const held = accs.map(a => a.type);
    const curCard = `<div class="card col gap12"><div class="h4">Current accreditations</div>${accs.map(a => `<div class="row">${tile('certificate', 'ok', 'sm')}<div class="grow"><div class="strong small">${esc(a.type)}</div><div class="cap muted">${esc(a.ref)} · until ${esc(a.to)}</div></div>${statusChip(a.status)}</div>`).join('')}</div>`;
    if (app && st.step !== 4) return `${pageHead({ title: 'Application in review', sub: `${esc(S.tenant.short)} is reviewing your application. You will be notified of the decision.` })}<div class="grid side"><div class="card col gap16"><div class="row">${tile('hourglass', 'info')}<div class="grow"><div class="h4">${esc(app.type)}</div><div class="cap muted">Submitted ${esc(app.submitted)} · decision due ${esc(app.due)}</div></div>${statusChip(app.status)}</div>${app.docs.map(([d, ok]) => `<div class="row small">${ic(ok ? 'check-circle' : 'warning')}<span>${esc(d)}</span></div>`).join('')}</div>${curCard}</div>`;
    const docsNeeded = ['DPCO licence from the data protection authority', 'Professional indemnity insurance', 'Methodology document', 'Assessor CVs and certificates'];
    let body;
    if (st.step === 0) body = `<div class="grid g2" style="gap:12px">${S.firmTypes.map(t => { const has = held.includes(t.name); return `<button type="button" class="choice ${st.type === t.name ? 'on' : ''}" ${has ? 'disabled style="opacity:.55;cursor:not-allowed"' : `data-act="accType" data-arg="${t.name}"`}>${tile(t.icon, '', 'sm')}<span class="grow"><b>${esc(t.name)}</b><br><span class="cap muted">${has ? 'Already accredited' : esc(t.criteria[0])}</span></span></button>`; }).join('')}</div>${note('Advisory & remediation firms cannot assess an organisation they advised in the last ' + esc(S.firmRules.conflictMonths) + ' months.')}`;
    if (st.step === 1) body = `<div class="col gap12">${docsNeeded.map((d, i) => st.docs[i] ? fileRow(d + '.pdf', 'Uploaded just now', { i: 'file-text', tone: 'ok', actions: btn('Remove', { v: 'tertiary', size: 'sm', act: 'accDoc', arg: i }) }) : `<div class="file">${tile('file-text', 'neu', 'sm')}<div class="grow"><div class="strong">${esc(d)}</div><div class="cap muted">Required</div></div>${btn('Upload', { v: 'secondary', size: 'sm', i: 'upload-simple', act: 'accDoc', arg: i, test: 'acc-doc-' + i })}</div>`).join('')}${st.err ? `<div class="field"><div class="err">${ic('warning-circle')}${st.err}</div></div>` : ''}</div>`;
    if (st.step === 2) body = `<p class="muted small">Choose who will carry out assessments of this type. Their credentials are checked by the regulator.</p><div class="col gap8">${myFirm().people.map(a => `<label class="choice ${st.assessors[a.name] ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" class="sr" data-act="accAssessor" data-arg="${a.name}" ${st.assessors[a.name] ? 'checked' : ''}><span class="radio" style="border-radius:6px"></span><span class="grow"><b>${esc(a.name)}</b> <span class="muted small">· ${esc(a.role)}</span><br><span class="cap muted">${esc(a.cred)}</span></span></label>`).join('')}</div>${st.err ? `<div class="field"><div class="err">${ic('warning-circle')}${st.err}</div></div>` : ''}`;
    if (st.step === 3) body = `<div class="col gap12">${ck('d1', 'Our firm is independent of the organisations we will assess, as defined in the regulator\'s rules.', false)}${ck('d2', `We have declared every organisation we advised in the last ${esc(S.firmRules.conflictMonths)} months (${myFirm().clients.length} declared).`, false)}${ck('d3', 'We will tell the regulator within 5 working days of any change to our licence or insurance.', false)}${st.err ? `<div class="field"><div class="err">${ic('warning-circle')}${st.err}</div></div>` : ''}<div class="card flat tight">${kv([['Type', esc(st.type)], ['Documents', Object.keys(st.docs).length + ' of 4'], ['Assessors', Object.keys(st.assessors).filter(k => st.assessors[k]).join(', ')]])}</div></div>`;
    if (st.step === 4) return `${pageHead({ title: 'Application submitted' })}<div class="card col gap16" style="align-items:flex-start">${tile('check-circle', 'solid ok', 'lg')}<div class="h3">${esc(st.type)} application sent to ${esc(S.tenant.name)}</div><p class="muted">Reference <span class="mono">ACC-APP-2026-0311</span>. Decision due within 4 weeks.</p><div class="row">${btn('Back to profile', { v: 'secondary', act: 'accDone', test: 'acc-done' })}</div></div>`;
    return `${pageHead({ title: 'Apply for accreditation', sub: 'Choose a firm type, upload evidence and nominate assessors. The regulator reviews and accredits for ' + esc(S.firmRules.renewal) + ' months.' })}
      ${stepper(['Firm type', 'Documents', 'Assessors', 'Declarations'], st.step)}
      <div class="grid side"><div class="card col gap16">${body}<div class="row between">${st.step ? btn('Back', { v: 'outline', i: 'arrow-left', act: 'accStep', arg: st.step - 1 }) : '<span></span>'}${btn(st.step === 3 ? 'Submit application' : 'Continue', { act: 'accNext', ir: st.step === 3 ? 'check' : 'arrow-right', test: 'acc-next' })}</div></div>${curCard}</div>`;
  }
});
ACT.accType = (t) => { ui('accForm').type = t; render(); };
ACT.accDoc = (i) => { const st = ui('accForm'); st.docs[i] ? delete st.docs[i] : (st.docs[i] = true); st.err = ''; render(); };
ACT.accAssessor = (n, el) => { const st = ui('accForm'); st.assessors[n] = !st.assessors[n]; st.err = ''; render(); };
ACT.accStep = (n) => { ui('accForm').step = +n; ui('accForm').err = ''; render(); };
ACT.accDone = () => { S.ui.accForm = undefined; S.ui.myFirmTab = 'accreditations'; go('firm/profile'); };
ACT.accNext = () => {
  const st = ui('accForm'); st.err = '';
  if (st.step === 1 && Object.keys(st.docs).length < 4) st.err = 'Upload all four documents to continue';
  if (st.step === 2 && !Object.values(st.assessors).some(Boolean)) st.err = 'Choose at least one assessor';
  if (st.step === 3 && !(val('d1') && val('d2') && val('d3'))) st.err = 'Confirm all three declarations to submit';
  if (st.err) return render();
  if (st.step === 3) {
    S.accApps.unshift({ id: 'acc1', firm: f.id, type: st.type, submitted: 'Today', due: '16 Nov 2026', status: 'In review', isNew: true, docs: [['DPCO licence from the data protection authority', true], ['Professional indemnity insurance', true], ['Methodology document', true], ['Assessor CVs and certificates', true]], assessors: Object.keys(st.assessors).filter(k => st.assessors[k]).map(n => { const p = f.people.find(x => x.name === n) || {}; return [n, p.cred || '—', p.status === 'Active']; }), decl: `Independence declaration signed. Advisory clients declared: ${myFirm().clients.length}.` });
    notify({ ws: 'regulator', i: 'certificate', tone: 'info', title: `${f.name} applied for ${st.type} accreditation`, go: 'firms/profile', arg: f.id + '|accreditations', kind: 'Approvals' });
    addAudit('Submitted accreditation application', `${f.name} · ${st.type}`);
  }
  st.step++; render();
};

/* C12 Firm onboarding (Deloitte) */
const FIRM_STEPS = [['profile', 'Firm profile', 'identification-card'], ['logo', 'Logo', 'image'], ['people', 'Lead auditor and assessors', 'users'], ['clients', 'Advisory clients', 'handshake']];
screen('firm/welcome', {
  t: 'Set up your firm', layout: 'app', ws: 'firm', crumbs: [['Dashboard', 'firm/dashboard'], 'Set up'],
  render() {
    const f = myFirm(); const P = f; P.onboard = P.onboard || { profile: true, logo: true, people: true, clients: true }; const cur = ui('fbStep', FIRM_STEPS.find(s => !P.onboard[s[0]])?.[0] || 'profile'); const done = FIRM_STEPS.filter(s => P.onboard[s[0]]).length;
    let body = '';
    if (cur === 'profile') body = `<form class="col gap16" data-form="fbProfile"><div class="grid g2" style="gap:16px">${field('Firm name', inp('fb-name', f.name, { ro: true }), { for: 'fb-name' })}${field('Website', inp('fb-web', f.web), { for: 'fb-web' })}${field('Offices', inp('fb-city', f.city), { for: 'fb-city' })}${field('Contact email', inp('fb-em', f.email || '', { type: 'email' }), { for: 'fb-em' })}</div><div class="row end">${btn('Save and continue', { type: 'submit', ir: 'arrow-right' })}</div></form>`;
    if (cur === 'logo') body = `<div class="col gap16"><div class="row">${logo(f, 64)}<p class="small muted">Shown to the regulator and to organisations you assess.</p></div>${P.logoUp ? fileRow(f.id + '-logo.svg', 'Uploaded just now', { i: 'image', tone: 'ok' }) : `<button class="drop" data-act="fbLogo">${tile('upload-simple', '', 'sm')}<b>Upload your logo</b><span class="cap muted">Use the official file. Initials show until then.</span></button>`}<div class="row end">${btn('Skip for now', { v: 'tertiary', act: 'fbNext', arg: 'logo' })}${btn('Continue', { act: 'fbNext', arg: 'logo', ir: 'arrow-right', disabled: !P.logoUp })}</div></div>`;
    if (cur === 'people') body = `<div class="col gap16"><div class="tbl-wrap" style="border:1px solid var(--border);border-radius:12px"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Expires</th><th></th></tr></thead><tbody>${P.people.map((a, i) => `<tr><td><div class="strong">${esc(a.name)}</div><div class="cap muted">${esc(a.title || '')}</div></td><td>${chip(a.role, a.role === 'Lead auditor' ? 'brand' : 'neu')}</td><td class="small">${esc(a.cred)}</td><td class="small">${esc(a.expires)}</td><td>${btnIc('trash', 'fbAsDel', i, 'Remove')}</td></tr>`).join('')}</tbody></table></div>
      <form class="card flat tight col gap12" data-form="fbAssessor" novalidate><b class="small">Add a person</b><div class="grid g4" style="gap:12px">${inp('as-name', '', { ph: 'Full name' })}${sel('as-role', ['Assessor', 'Lead auditor'], 'Assessor')}${inp('as-cred', '', { ph: 'Credentials, e.g. CISA, CIPP/E' })}${inp('as-exp', '', { ph: 'Credential expiry, e.g. Mar 2028' })}</div><div class="row end">${btn('Add assessor', { type: 'submit', v: 'secondary', i: 'plus', test: 'as-add' })}</div></form>
      <div class="row end">${btn('Continue', { act: 'fbNext', arg: 'people', ir: 'arrow-right', test: 'fb-as-next' })}</div></div>`;
    if (cur === 'clients') body = `<div class="col gap16">${alertBox('info', 'Why we ask', `You cannot be assigned to assess an organisation you advised in the last ${esc(S.firmRules.conflictMonths)} months. Declaring clients here lets the system block conflicts automatically.`)}${P.clients.map((c, i) => `<div class="file">${logo(c, 32)}<div class="grow"><div class="strong">${esc(c.org)}</div><div class="cap muted">${esc(c.service)} · since ${esc(c.since)}</div></div>${btnIc('trash', 'fbClDel', i, 'Remove')}</div>`).join('')}
      <form class="card flat tight col gap12" data-form="fbClient" novalidate><b class="small">Declare a client</b><div class="grid g3" style="gap:12px">${inp('cl-org', '', { ph: 'Organisation' })}${inp('cl-svc', '', { ph: 'Service provided' })}${inp('cl-since', '', { ph: 'Since, e.g. Feb 2026' })}</div><div class="row end">${btn('Declare client', { type: 'submit', v: 'secondary', i: 'plus' })}</div></form>
      <div class="row end">${btn('Finish setup', { act: 'fbNext', arg: 'clients', test: 'fb-finish' })}</div></div>`;
    return `<div class="ph">${logo(f, 48)}<div class="grow"><div class="overline">Getting started</div><h1 class="h1" style="margin-top:2px">Set up ${esc(f.name)}</h1><p class="muted small" style="margin-top:2px">${f.status === 'Accredited' || f.status === 'Renewal due' ? 'Accredited by ' + esc(S.tenant.short) + ' for ' + esc(f.types.join(' and ')) : 'Accreditation ' + esc(f.status.toLowerCase())}</p></div><div class="page-progress"><div class="grow">${bar(done / FIRM_STEPS.length * 100)}</div><span class="cap strong tnum">${done} of ${FIRM_STEPS.length}</span></div></div>
      <div class="grid side-l"><div class="card tight vsteps">${FIRM_STEPS.map(([k, l], n) => `<button class="vstep ${cur === k ? 'on' : ''} ${P.onboard[k] ? 'done' : ''}" data-act="fbGo" data-arg="${k}"><span class="n">${P.onboard[k] ? ic('check') : n + 1}</span>${l}</button>`).join('')}<hr class="sep" style="margin:8px 0">${btn('Apply for accreditation', { v: 'tertiary', go: 'firm/apply', i: 'certificate' })}</div>
      <div class="card col gap16"><div class="row">${tile(FIRM_STEPS.find(s => s[0] === cur)[2])}<div class="h3">${FIRM_STEPS.find(s => s[0] === cur)[1]}</div></div>${body}</div></div>`;
  }
});
ACT.fbGo = (k) => { S.ui.fbStep = k; render(); };
function fbAdvance(k) { const P = myFirm(); P.onboard[k] = true; const nx = FIRM_STEPS.find(s => !P.onboard[s[0]]); if (nx) { S.ui.fbStep = nx[0]; render(); } else { toast('Firm setup complete'); addAudit('Completed firm onboarding', P.name); go('firm/dashboard'); } }
ACT.form_fbProfile = () => { const f = myFirm(); f.web = val('fb-web'); f.city = val('fb-city'); f.email = val('fb-em'); toast('Profile saved'); fbAdvance('profile'); };
ACT.fbLogo = () => { myFirm().logoUp = true; render(); toast('Logo uploaded', 'ok', 'image'); };
ACT.fbNext = (k) => fbAdvance(k);
ACT.form_fbAssessor = () => { const n = val('as-name'), c = val('as-cred'); if (!n || !c) { toast('Add a name and credentials', 'bad'); return; } myFirm().people.push({ name: n, ini: initials(n), role: val('as-role'), title: '', cred: c, expires: val('as-exp') || '—', status: 'Active' }); render(); toast('Person added'); };
ACT.fbAsDel = (i) => { myFirm().people.splice(+i, 1); render(); };
ACT.form_fbClient = () => { const n = val('cl-org'); if (!n) { toast('Enter the organisation', 'bad'); return; } myFirm().clients.push({ org: n, ini: n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), col: '#607D8B', service: val('cl-svc') || 'Advisory', since: val('cl-since') || '2026' }); render(); toast('Client declared'); };
ACT.fbClDel = (i) => { myFirm().clients.splice(+i, 1); render(); };


