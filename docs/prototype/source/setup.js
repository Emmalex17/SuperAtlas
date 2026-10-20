/* ================= Phase 1 · Regulator setup (B01–B12) ================= */
function profileHead(active) { return active === 'profile' ? pageHead({ title: 'Profile', sub: 'How ' + esc(S.tenant.short) + ' appears to organisations and assurance firms, on screen and in emails.' }) : pageHead({ title: 'Branding', sub: 'Your name, logo and colours inside the workspace and in every email.' }); }
const SET_SUB = { 'settings/categories': 'Organise the institutions you supervise by sector, institution type and authorisation tier.', 'settings/firm-types': 'The kinds of assurance firm you accredit.', 'settings/scoring': 'How assessor outcomes become scores and rating bands.', 'settings/deadlines': 'Default windows, reminders and grace periods.', 'settings/findings': 'Finding classes and how soon each must be fixed.', 'settings/compliance': 'Benchmarks and the rules that set each organisation\'s compliance status.', 'settings/actions': 'The enforcement actions you can take, how long organisations have to respond, and which carry a penalty.' };
function settingsHead(active, actions = '') { const item = SETTINGS_NAV.flatMap(g => g[1]).find(x => x[1] === active || (x[2] || []).includes(active)); return pageHead({ title: item ? item[0] : 'Settings', sub: SET_SUB[active] || '', actions }); }

/* B02 Regulator profile */
screen('profile', {
  t: 'Profile', layout: 'app', ws: 'regulator', crumbs: ['Profile', 'Details'],
  render() {
    const t = S.tenant; const e = ui('b02err', {});
    return `${profileHead('profile')}
      <form class="grid side" data-form="tenant" novalidate>
        <div class="card col gap20"><div class="h4">Details</div>
          <div class="grid g2" style="gap:16px">${field('Name shown in SuperAtlas', inp('t-name', t.name, { invalid: e.name }), { err: e.name, for: 't-name' })}${field('Short name', inp('t-short', t.short, { attrs: 'maxlength="8"' }), { hint: 'Used in status text, e.g. "With REG". Up to 8 characters.', for: 't-short' })}</div>
          ${field('Legal name', inp('t-legal', t.legal), { for: 't-legal' })}
          ${field('Mandate', ta('t-mandate', t.mandate), { hint: 'Shown on your profile and in invitation emails.', for: 't-mandate' })}
          <div class="field"><label>Sectors you supervise</label><div class="row wrap gap8">${['Banking', 'Payments', 'Digital economy', 'Insurance', 'Capital markets', 'Pensions'].map(s => `<label class="pill ${t.sectors.includes(s) ? 'on' : ''}" style="cursor:pointer"><input type="checkbox" class="sr" name="sector" value="${s}" ${t.sectors.includes(s) ? 'checked' : ''} data-act="pillToggle">${s}</label>`).join('')}</div></div>
          <div class="grid g2" style="gap:16px">${field('Supervision email', inp('t-email', t.email, { type: 'email' }), { for: 't-email' })}${field('Phone', inp('t-phone', t.phone), { for: 't-phone' })}</div>
          ${field('Address', inp('t-addr', t.address), { for: 't-addr' })}
          <div class="row end">${btn('Save profile', { type: 'submit', test: 'save-profile' })}</div></div>
        <div class="col gap24"><div class="card col gap16"><div class="h4">Logo</div>
          <div class="row">${t.logoUploaded ? `<span class="logo s64" style="background:#fff;color:var(--brand-700);box-shadow:inset 0 0 0 1px var(--border)">${esc(t.ini)}</span>` : `<span class="logo s64">${esc(t.ini)}</span>`}<div class="small muted">Square SVG or PNG, at least 256 px. Shown in the sidebar, sign-in page and emails.</div></div>
          ${t.logoUploaded ? fileRow('regulator-logo.svg', '24 KB · uploaded just now', { i: 'image', actions: btn('Remove', { v: 'tertiary', size: 'sm', act: 'logoToggle' }) }) : `<button type="button" class="drop" data-act="logoToggle">${tile('upload-simple', '', 'sm')}<b class="small">Upload logo</b><span class="cap muted">Drag a file here or click to choose</span></button>`}</div>
          <div class="card col gap12"><div class="h4">Preview</div><div class="preview-box" style="padding:16px;background:var(--sidebar);color:#fff;border:0"><div class="row">${t.logoUploaded ? `<span class="logo s40" style="background:#fff;color:var(--brand-700)">${esc(t.ini)}</span>` : `<span class="logo s40">${esc(t.ini)}</span>`}<div><b>${esc(t.name)}</b><div class="cap" style="color:var(--brand-200)">Supervision workspace</div></div></div></div></div></div>
      </form>`;
  }
});
ACT.pillToggle = (_, el) => { setTimeout(() => el.parentElement.classList.toggle('on', el.checked)); };
ACT.logoToggle = () => { readTenantForm(); S.tenant.logoUploaded = !S.tenant.logoUploaded; render(); toast(S.tenant.logoUploaded ? 'Logo uploaded' : 'Logo removed', 'ok', 'image'); };
function readTenantForm() { if (!$('#t-name')) return; Object.assign(S.tenant, { name: val('t-name'), short: val('t-short').toUpperCase(), legal: val('t-legal'), mandate: val('t-mandate'), email: val('t-email'), phone: val('t-phone'), address: val('t-addr'), sectors: $$('input[name=sector]:checked').map(x => x.value) }); }
ACT.form_tenant = () => {
  if (!val('t-name')) { S.ui.b02err = { name: 'Enter the name to show in SuperAtlas' }; return render(); }
  S.ui.b02err = {}; readTenantForm(); S.tenant.ini = S.tenant.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase(); toast('Profile saved'); addAudit('Updated profile', S.tenant.name); render();
};

/* B03 Branding */
const THEMES = [['default', 'SuperAtlas default', 'Navy and indigo', ['#1b2056', '#4f46e5', '#dba94d']], ['forest', 'Forest', 'Deep green', ['#0f3d2a', '#15803d', '#dba94d']], ['ocean', 'Ocean', 'Deep blue', ['#0b2e4f', '#0369a1', '#dba94d']]];
screen('profile/branding', {
  t: 'Branding', layout: 'app', ws: 'regulator', crumbs: [['Profile', 'profile'], 'Branding'],
  render() {
    const pick = ui('themePick', S.tenant.theme); const pv = ui('brandPv', 'app');
    return `${profileHead('profile/branding')}<p class="muted small">Your name, logo and colours appear inside the workspace and on every email you send. Sign-in stays SuperAtlas-branded, so everyone has one place to sign in.</p>
      <div class="grid side">
        <div class="card col gap20"><div class="h4">Preview</div>${tabs([{ id: 'app', label: 'Workspace' }, { id: 'email', label: 'Invitation email' }], pv, 'brandPv')}
          <div class="preview-box" data-brand-preview="${pick}" style="padding:0">${brandPreview(pv, pick)}</div></div>
        <form class="col gap24" data-form="branding">
          <div class="card col gap12"><div class="h4">Theme</div>${THEMES.map(([k, n, d, sw]) => `<button type="button" class="choice ${pick === k ? 'on' : ''}" data-act="themePick" data-arg="${k}" data-test="theme-${k}"><span class="radio"></span><span class="grow"><b>${n}</b><br><span class="cap muted">${d}</span></span><span class="row gap4">${sw.map(c => `<span style="width:20px;height:20px;border-radius:6px;background:${c};display:inline-block"></span>`).join('')}</span></button>`).join('')}</div>
          <div class="card col gap16"><div class="h4">Name and web address</div>${field('Short name in status text', inp('b-short', S.tenant.short, { attrs: 'maxlength="8"' }), { hint: 'Shown in status text such as "With ' + esc(S.tenant.short) + '".', for: 'b-short' })}${field('Web address', `<div class="inp-wrap">${ic('globe')}${inp('b-dom', S.tenant.domain)}</div>`, { hint: 'We will give you a DNS record to add. Until then the default address works.', for: 'b-dom' })}<div>${chip('DNS verified', 'ok', 'check-circle')}</div></div>
          <div class="row end">${btn('Save branding', { type: 'submit', test: 'save-branding' })}</div></form></div>`;
  }
});
function brandPreview(pv, k) {
  const th = THEMES.find(x => x[0] === k)[3]; const t = S.tenant;
  if (pv === 'app') return `<div style="display:grid;grid-template-columns:120px 1fr;min-height:300px"><div style="background:${th[0]};padding:12px 8px;display:flex;flex-direction:column;gap:6px">${['Home', 'Organisations', 'Firms', 'Library'].map((l, i) => `<div style="padding:6px 8px;border-radius:8px;color:#fff;font-size:12px;${i === 1 ? 'background:' + th[1] : ''}">${l}</div>`).join('')}</div><div style="padding:16px;display:flex;flex-direction:column;gap:10px"><b class="serif" style="font-size:18px">Directory</b><div class="row gap8"><span style="height:28px;padding:0 12px;border-radius:99px;background:${th[1]};color:#fff;font-size:12px;display:inline-flex;align-items:center">All</span><span class="tag">Banks</span><span class="tag">Payments</span></div>${[1, 2, 3].map(() => `<div class="skel" style="height:30px;animation:none"></div>`).join('')}</div></div>`;
  return `<div style="padding:20px;background:#f4f5fb"><div class="mail"><div class="mh"><b style="color:var(--text)">You are invited to ${esc(t.name)} on SuperAtlas</b><span>From: ${esc(t.name)} &lt;no-reply@${esc(t.domain)}&gt;</span></div><div style="height:6px;background:${th[1]}"></div><div class="mb col gap12"><div class="row gap8"><span class="logo s32" style="background:${th[1]}">${esc(t.ini)}</span><b>${esc(t.name)}</b></div><p>Hello, you have been invited to join ${esc(t.name)}'s supervision portal.</p><span style="align-self:flex-start;padding:8px 14px;border-radius:10px;background:${th[1]};color:#fff;font-weight:600;font-size:13px">Accept invitation</span><p class="cap muted">Powered by SuperAtlas</p></div></div></div>`;
}
ACT.themePick = (k) => { S.ui.themePick = k; render(); };
ACT.brandPv = (k) => { S.ui.brandPv = k; render(); };
ACT.form_branding = () => {
  S.tenant.short = (val('b-short') || S.tenant.short).toUpperCase(); S.tenant.theme = S.ui.themePick || S.tenant.theme; S.tenant.domain = val('b-dom') || S.tenant.domain;
  applyTheme(); toast(`Branding saved. Theme: ${THEMES.find(x => x[0] === S.tenant.theme)[1]}`); addAudit('Updated branding', S.tenant.name); render();
};
function applyTheme() { const r = document.documentElement; if (S.tenant.theme === 'default') r.removeAttribute('data-brand'); else r.setAttribute('data-brand', S.tenant.theme); }

/* B04 Team & roles */
screen('team', {
  t: 'Team', layout: 'app', ws: 'regulator', crumbs: ['Team'],
  render() {
    const tab = ui('teamTab', 'people');
    return `${pageHead({ title: 'Team', sub: 'Give each person a role and a portfolio. A portfolio limits a supervisor or reviewer to the categories they look after.', actions: btn('Invite staff', { i: 'user-plus', act: 'inviteStaff', test: 'invite-staff' }) })}
      ${tabs([{ id: 'people', label: 'People', count: S.team.length }, { id: 'roles', label: 'Roles and permissions' }], tab, 'teamTab')}
      ${tab === 'people' ? `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Portfolio</th><th>Status</th><th>Last active</th><th></th></tr></thead><tbody>${S.team.map((p, i) => `<tr><td><div class="row">${av(p.ini)}<div><div class="strong">${esc(p.name)}</div><div class="cap muted">${esc(p.email)}</div></div></div></td><td>${chip(p.role, p.role === 'Admin' ? 'brand' : 'neu')}</td><td class="small">${esc(p.portfolio)}</td><td>${p.status === 'Invited' ? chip('Invited', 'info', 'envelope-simple') : chip('Active', 'ok')}</td><td class="small muted">${esc(p.last)}</td><td style="text-align:right">${p.name === persona().name ? '<span class="cap muted">You</span>' : `<button class="icon-btn" data-act="staffMenu" data-arg="${i}" aria-label="More">${ic('dots-three')}</button>`}</td></tr>`).join('')}</tbody></table></div></div>`
      : `<div class="grid g4" style="gap:16px">${S.roles.map(r => `<div class="card tight col gap8"><b>${r.name}</b><p class="small muted">${r.d}</p></div>`).join('')}</div>
        <div class="card p0"><div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>Permission</th>${S.roles.map(r => `<th>${r.name}</th>`).join('')}</tr></thead><tbody>${S.perms.map(([n, ...v]) => `<tr><td>${n}</td>${v.map(x => `<td>${x ? `<span class="yes">${ic('check-circle')}</span>` : `<span class="no">${ic('minus')}</span>`}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>`}`;
  }
});
ACT.teamTab = (t) => { S.ui.teamTab = t; render(); };
ACT.inviteStaff = () => openDialog(`${dlgHead('Invite staff', 'They get an email to set a password and MFA.', 'user-plus')}
  <form class="col gap16" data-form="staff" novalidate>${field('Work email', inp('st-email', '', { type: 'email', ph: 'name@regulator.gov.ng' }), { for: 'st-email' })}${field('Full name', inp('st-name', ''), { for: 'st-name' })}
  ${field('Role', sel('st-role', S.roles.map(r => r.name), 'Supervisor'), { for: 'st-role' })}
  <div class="field"><label>Portfolio</label><div class="grid g2" style="gap:8px">${typeOpts().slice(0, 8).map((t, i) => ck('pf' + i, t, i < 2, { attrs: `name="pf" value="${t}"` })).join('')}</div><div class="hint">Leave all unticked for access to all categories.</div></div>
  <div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Send invitation', { type: 'submit', test: 'staff-send' })}</div></form>`);
ACT.form_staff = () => {
  const em = val('st-email');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) { toast('Enter a valid work email', 'bad'); return; }
  const nm = val('st-name') || em.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const pf = $$('input[name=pf]:checked').map(x => x.value);
  S.team.push({ name: nm, ini: nm.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(), email: em, role: val('st-role'), portfolio: pf.length ? pf.join(', ') : 'All categories', status: 'Invited', last: '—' });
  closeDialog(); addAudit('Invited staff', em); if (S.team.filter(p => p.status === 'Invited').length >= 1)
  toast(`Invitation sent to ${esc(em)}`, 'ok', 'envelope-simple'); render();
};
ACT.staffMenu = (i, el) => { const p = S.team[+i]; openPop(el, `<button class="menu-item" data-act="staffRole" data-arg="${i}">${ic('pencil-simple')}Change role or portfolio</button>${p.status === 'Invited' ? `<button class="menu-item" data-act="savedToast" data-arg="Invitation resent">${ic('envelope-simple')}Resend invitation</button>` : ''}<button class="menu-item" data-act="staffRemove" data-arg="${i}" style="color:var(--bad-fg)">${ic('trash')}Remove access</button>`); };
ACT.staffRole = (i) => { closePop(); const p = S.team[+i]; openDialog(`${dlgHead('Change role', esc(p.name), 'users')}<div class="col gap16">${field('Role', sel('sr-role', S.roles.map(r => r.name), p.role), { for: 'sr-role' })}${field('Portfolio', inp('sr-pf', p.portfolio), { for: 'sr-pf' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Save', { act: 'staffRoleSave', arg: i })}</div></div>`); };
ACT.staffRoleSave = (i) => { const p = S.team[+i]; p.role = val('sr-role'); p.portfolio = val('sr-pf'); closeDialog(); render(); toast('Role updated'); addAudit('Changed role', p.name); };
ACT.staffRemove = (i) => { closePop(); const p = S.team[+i]; openDialog(`${dlgHead('Remove ' + esc(p.name) + '?', 'They lose access immediately. Their past actions stay in the audit trail.', 'warning', 'bad')}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Remove access', { v: 'danger', act: 'staffRemoveGo', arg: i })}</div>`); };
ACT.staffRemoveGo = (i) => { const p = S.team.splice(+i, 1)[0]; closeDialog(); render(); toast(`${esc(p.name)} removed`); addAudit('Removed staff', p.name); };

/* B05 Categories manager */
screen('settings/categories', {
  t: 'Categories', layout: 'app', ws: 'regulator', crumbs: [['Settings', 'settings/categories'], 'Categories'],
  render() {
    const tab = ui('catTab', 'tree');
    const total = allTypes().reduce((a, t) => a + t.count, 0);
    const banner = S.ui.importDone ? alertBox('ok', 'Spreadsheet imported', `${S.ui.importDone} New categories are marked below.`, btn('Undo import', { v: 'tertiary', size: 'sm', act: 'undoImport' })) : '';
    return `${settingsHead('settings/categories')}<div class="row wrap"><p class="muted small grow">Organise the institutions you supervise in three levels: sector, institution type and authorisation tier. Requirements, programmes and dashboards follow this structure.</p>${btn('Import spreadsheet', { v: 'outline', size: 'sm', i: 'upload-simple', go: 'settings/categories/import', test: 'import-cats' })}${btn('Add sector', { size: 'sm', i: 'plus', act: 'catAdd', arg: 'sector' })}</div>
      ${banner}
      ${tabs([{ id: 'tree', label: 'Categories', count: S.categories.length + allTypes().length }, { id: 'tags', label: 'Tags', count: S.tags.length }, { id: 'groups', label: 'Saved groups', count: S.groups.length }, { id: 'history', label: 'History' }], tab, 'catTab')}
      ${tab === 'tree' ? `<div class="grid side"><div class="card"><div class="row between" style="margin-bottom:8px"><span class="overline">Sector → institution type → tier</span><span class="cap muted tnum">${total} organisations</span></div><div class="tree">${S.categories.map(c => `
          <div class="tree-row l1 ${c.isNew ? 'sel' : ''}">${ic('folder-open')}<span>${esc(c.name)}</span>${c.isNew ? chip('New', 'brand') : ''}<span class="count" style="margin-left:8px">${c.types.reduce((a, t) => a + t.count, 0)}</span><span class="acts">${btnIc('arrow-up', 'secMove', c.id + '|-1', 'Move up')}${btnIc('arrow-down', 'secMove', c.id + '|1', 'Move down')}${btnIc('plus', 'catAdd', 'type|' + c.id, 'Add institution type')}${btnIc('pencil-simple', 'catEdit', 's|' + c.id, 'Rename')}${btnIc('trash', 'catDel', 's|' + c.id, 'Delete')}</span></div>
          ${c.types.map(t => `<div class="tree-row l2 ${t.isNew ? 'sel' : ''}">${ic('buildings')}<span>${esc(t.name)}</span>${t.isNew ? chip('New', 'brand') : ''}<span class="count" style="margin-left:8px">${t.count}</span><span class="acts">${btnIc('arrow-up', 'catMove', c.id + '|' + t.id + '|-1', 'Move up')}${btnIc('arrow-down', 'catMove', c.id + '|' + t.id + '|1', 'Move down')}${btnIc('plus', 'catAdd', 'tier|' + c.id + '|' + t.id, 'Add tier')}${btnIc('pencil-simple', 'catEdit', 't|' + c.id + '|' + t.id, 'Rename')}${btnIc('trash', 'catDel', 't|' + c.id + '|' + t.id, 'Delete')}</span></div>
          ${t.tiers.length ? `<div class="tree-row l3"><span class="row wrap gap6">${t.tiers.map(x => `<span class="chip brand" style="height:22px">${esc(x)}</span>`).join('')}</span></div>` : `<div class="tree-row l3 cap">No tiers</div>`}`).join('')}`).join('')}</div></div>
        <div class="col gap24"><div class="card col gap12"><div class="h4">How categories are used</div>${[['user-plus', 'Invitations map each organisation to a category'], ['buildings', 'Organisations pick one when they register'], ['book-open-text', 'Requirements apply by category'], ['git-diff', 'Changes to an organisation\'s category need your approval']].map(([i, t]) => `<div class="row small">${tile(i, '', 'sm')}<span>${t}</span></div>`).join('')}</div>
          ${note('Deleting a category that has organisations in it is blocked. Move the organisations first.', 'lock-simple')}
</div></div>`
      : tab === 'tags' ? `<div class="card col gap16"><p class="muted small">Tags cut across categories, for example listed companies or systemically important banks.</p><div class="row wrap gap8">${S.tags.map((t, i) => `<span class="chip brand" style="height:30px;padding:0 6px 0 12px">${esc(t)}<button class="icon-btn" style="width:22px;height:22px" data-act="tagDel" data-arg="${i}" aria-label="Remove tag">${ic('x')}</button></span>`).join('')}</div><form class="row" data-form="tagAdd" style="max-width:420px">${inp('tag-new', '', { ph: 'New tag name' })}${btn('Add tag', { type: 'submit', v: 'secondary', i: 'plus' })}</form></div>`
      : tab === 'groups' ? `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Group</th><th>Rule</th><th>Organisations</th></tr></thead><tbody>${S.groups.map(g => `<tr><td class="strong">${esc(g.name)}</td><td class="small">${esc(g.rule)}</td><td class="tnum">${g.count}</td></tr>`).join('')}</tbody></table></div></div><div>${btn('Create saved group', { v: 'secondary', i: 'plus', act: 'groupAdd' })}</div>`
      : `<div class="card"><div class="timeline">${S.catHistory.map(h => `<div class="tl">${av(h.who.split(' ').map(w => w[0]).join(''))}<div><div class="strong">${esc(h.what)}</div><div class="cap muted">${esc(h.who)} · ${esc(h.when)}</div></div></div>`).join('')}</div></div>`}`;
  }
});
ACT.catTab = (t) => { S.ui.catTab = t; render(); };
ACT.catMove = (arg) => { const [sid, tid, d] = arg.split('|'); const c = S.categories.find(x => x.id === sid); const i = c.types.findIndex(t => t.id === tid), j = i + +d; if (j < 0 || j >= c.types.length) return; [c.types[i], c.types[j]] = [c.types[j], c.types[i]]; render(); toast('Order saved'); };
ACT.secMove = (arg) => { const [sid, d] = arg.split('|'); const i = S.categories.findIndex(x => x.id === sid), j = i + +d; if (j < 0 || j >= S.categories.length) return; [S.categories[i], S.categories[j]] = [S.categories[j], S.categories[i]]; render(); toast('Order saved'); };
ACT.catAdd = (arg) => {
  const [lvl, sid, tid] = arg.split('|');
  const label = lvl === 'sector' ? 'sector' : lvl === 'type' ? 'institution type' : 'tier';
  openDialog(`${dlgHead('Add ' + label, lvl === 'sector' ? 'Top level, e.g. Insurance.' : lvl === 'type' ? 'Under ' + esc(S.categories.find(c => c.id === sid).name) : 'Authorisation level, e.g. National.', 'plus')}<form class="col gap16" data-form="catAdd" data-arg="${arg}">${field('Name', inp('cat-name', ''), { for: 'cat-name' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Add', { type: 'submit' })}</div></form>`);
};
ACT.form_catAdd = (f) => {
  const n = val('cat-name'); if (!n) { toast('Enter a name', 'bad'); return; }
  const [lvl, sid, tid] = f.dataset.arg.split('|');
  if (lvl === 'sector') S.categories.push({ id: uid('s'), name: n, types: [], isNew: true });
  else if (lvl === 'type') S.categories.find(c => c.id === sid).types.push({ id: uid('t'), name: n, count: 0, tiers: [], isNew: true });
  else S.categories.find(c => c.id === sid).types.find(t => t.id === tid).tiers.push(n);
  S.catHistory.unshift({ when: 'Today', who: persona().name, what: `Added ${lvl} "${n}"` }); addAudit('Added category', n);
  closeDialog(); render(); toast(`Added "${esc(n)}"`);
};
ACT.catEdit = (arg) => {
  const [lvl, sid, tid] = arg.split('|'); const c = S.categories.find(x => x.id === sid); const o = lvl === 's' ? c : c.types.find(t => t.id === tid);
  openDialog(`${dlgHead('Rename', 'Organisations keep their place; only the name changes.', 'pencil-simple')}<form class="col gap16" data-form="catEdit" data-arg="${arg}">${field('Name', inp('cat-ren', o.name), { for: 'cat-ren' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Save', { type: 'submit' })}</div></form>`);
};
ACT.form_catEdit = (f) => { const [lvl, sid, tid] = f.dataset.arg.split('|'); const c = S.categories.find(x => x.id === sid); const o = lvl === 's' ? c : c.types.find(t => t.id === tid); const old = o.name; o.name = val('cat-ren') || o.name; S.catHistory.unshift({ when: 'Today', who: persona().name, what: `Renamed "${old}" to "${o.name}"` }); closeDialog(); render(); toast('Renamed'); };
ACT.catDel = (arg) => {
  const [lvl, sid, tid] = arg.split('|'); const c = S.categories.find(x => x.id === sid); const o = lvl === 's' ? c : c.types.find(t => t.id === tid);
  const n = lvl === 's' ? c.types.reduce((a, t) => a + t.count, 0) : o.count;
  if (n) return openDialog(`${dlgHead('You cannot delete this yet', `${n} organisations are in "${esc(o.name)}". Move them to another category first, then delete it.`, 'lock-simple', 'warn')}<div class="row end">${btn('OK', { act: 'closeDialog' })}</div>`);
  if (lvl === 's') S.categories = S.categories.filter(x => x.id !== sid); else c.types = c.types.filter(t => t.id !== tid);
  S.catHistory.unshift({ when: 'Today', who: persona().name, what: `Deleted "${o.name}"` }); render(); toast(`Deleted "${esc(o.name)}"`);
};
ACT.tagDel = (i) => { S.tags.splice(+i, 1); render(); };
ACT.form_tagAdd = () => { const n = val('tag-new'); if (n) { S.tags.push(n); render(); toast('Tag added'); } };
ACT.groupAdd = () => openDialog(`${dlgHead('Create saved group', 'A named set of categories you can reuse in programmes and dashboards.', 'squares-four')}<form class="col gap16" data-form="groupAdd">${field('Group name', inp('g-name', '', { ph: 'e.g. Payments and fintech' }), { for: 'g-name' })}<div class="field"><label>Include</label><div class="grid g2" style="gap:8px">${typeOpts().map((t, i) => ck('gi' + i, t, false, { attrs: `name="gi" value="${t}"` })).join('')}</div></div><div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Create group', { type: 'submit' })}</div></form>`, { wide: true });
ACT.form_groupAdd = () => { const n = val('g-name'); const inc = $$('input[name=gi]:checked').map(x => x.value); if (!n || !inc.length) { toast('Name the group and pick at least one category', 'bad'); return; } S.groups.push({ name: n, rule: inc.join(' + '), count: allTypes().filter(t => inc.includes(t.name)).reduce((a, t) => a + t.count, 0) }); closeDialog(); render(); toast('Saved group created'); };

/* B06 Import categories */
const IMPORT_CATS = [
  ['Banking', 'Commercial bank', 'International', 'ok'], ['Banking', 'Commercial bank', 'National', 'ok'], ['Banking', 'Commercial bank', 'Regional', 'ok'], ['Banking', 'Merchant bank', 'National', 'ok'],
  ['Banking', 'Microfinance bank', 'National', 'ok'], ['Banking', 'Microfinance bank', 'State', 'ok'], ['Banking', 'Microfinance bank', 'Unit', 'ok'], ['Banking', 'Primary mortgage bank', 'National', 'new'],
  ['Banking', 'Primary mortgage bank', 'State', 'new'], ['Banking', 'Finance company', '', 'new'], ['Banking', 'Bureau de change', '', 'new'], ['Payments', 'Mobile money operator', '', 'ok'],
  ['Payments', 'Switching and processing', '', 'ok'], ['Payments', 'Payment solution service provider', 'PSSP', 'ok'], ['Insurance', 'Life insurer', '', 'new'], ['Insurance', 'General insurer', '', 'new'],
  ['Banking', 'Commercial Bank', 'International', 'dup'], ['', 'Development finance institution', 'National', 'noparent']
];
screen('settings/categories/import', {
  t: 'Import categories', layout: 'app', ws: 'regulator', crumbs: [['Settings', 'settings/categories'], ['Categories', 'settings/categories'], 'Import'],
  render() {
    const st = ui('imp', { step: 0, fixes: {} });
    const errs = IMPORT_CATS.filter(r => (r[3] === 'dup' || r[3] === 'noparent') && !st.fixes[r[1]]).length;
    const newRows = IMPORT_CATS.filter(r => r[3] === 'new' || (r[3] === 'noparent' && st.fixes[r[1]] === 'fix'));
    let body;
    if (st.step === 0) body = `<div class="grid g2"><div class="card col gap16">${tile('download-simple', '', 'lg')}<div class="h3">1. Download the template</div><p class="muted small">One row per tier. Leave the tier blank if a type has none.</p>
        <div class="tbl-wrap" style="border:1px solid var(--border);border-radius:12px"><table class="tbl"><thead><tr><th>sector</th><th>institution_type</th><th>tier</th><th>code</th></tr></thead><tbody><tr><td>Banking</td><td>Microfinance bank</td><td>State</td><td class="mono">MFB-S</td></tr><tr><td>Payments</td><td>Mobile money operator</td><td></td><td class="mono">MMO</td></tr></tbody></table></div>
        ${btn('Download template (.xlsx)', { v: 'secondary', i: 'download-simple', act: 'savedToast', arg: 'Template downloaded' })}</div>
      <div class="card col gap16">${tile('upload-simple', '', 'lg')}<div class="h3">2. Upload your file</div><p class="muted small">.xlsx or .csv, up to 2,000 rows. We check every row before anything changes.</p>
        <button class="drop" data-act="impUpload" data-test="imp-upload" style="padding:36px">${tile('cloud-arrow-up', '', 'lg')}<b>Drop your spreadsheet here</b><span class="cap muted">or click to choose a file</span></button>${demoNote('Demo: clicking uses a sample file with 18 rows, 2 of which need fixing.')}</div></div>`;
    else if (st.step === 1) body = `<div class="card col gap16" style="align-items:center;text-align:center;padding:48px">${ic('circle-notch', 'spin')}<div class="h3">Checking categories.xlsx</div><p class="muted small">Reading 18 rows and comparing them with your current categories.</p><div style="width:min(360px,100%)">${bar(68)}</div></div>`;
    else if (st.step === 2) body = `${fileRow('categories.xlsx', '18 rows · uploaded just now', { i: 'table', tone: 'ok', actions: btn('Replace file', { v: 'tertiary', size: 'sm', act: 'impReset' }) })}
      <div class="grid g4" style="gap:16px">${[['Rows read', 18, ''], ['Already exist', IMPORT_CATS.filter(r => r[3] === 'ok').length, 'neu'], ['New', newRows.length, 'ok'], ['Need fixing', errs, errs ? 'warn' : 'ok']].map(([l, n, t]) => `<div class="card tight"><div class="cap muted">${l}</div><div class="metric tnum" style="font-size:24px;margin-top:2px;color:${t === 'warn' ? 'var(--warn-solid)' : 'var(--text)'}">${n}</div></div>`).join('')}</div>
      ${errs ? alertBox('warn', `${errs} row${errs > 1 ? 's' : ''} need your input`, 'Fix or skip them. Rows that need fixing are not imported.') : alertBox('ok', 'Every row is ready', `${newRows.length} new categories will be added. Existing categories are not changed.`)}
      <div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Row</th><th>Sector</th><th>Institution type</th><th>Tier</th><th>Result</th></tr></thead><tbody>${IMPORT_CATS.map((r, i) => { const fx = st.fixes[r[1]]; let res;
        if (r[3] === 'ok') res = chip('Already exists', 'neu'); else if (r[3] === 'new') res = chip('New', 'ok', 'plus');
        else if (r[3] === 'dup') res = fx ? chip('Skipped', 'neu') : `<div class="row gap8">${chip('Duplicate of "Commercial bank"', 'warn', 'warning')}${btn('Skip row', { v: 'outline', size: 'sm', act: 'impFix', arg: r[1] + '|skip', test: 'fix-dup' })}</div>`;
        else res = fx === 'fix' ? chip('New · under Banking', 'ok', 'plus') : fx === 'skip' ? chip('Skipped', 'neu') : `<div class="row gap8">${chip('Sector missing', 'warn', 'warning')}${btn('Put under Banking', { v: 'outline', size: 'sm', act: 'impFix', arg: r[1] + '|fix', test: 'fix-parent' })}${btn('Skip', { v: 'tertiary', size: 'sm', act: 'impFix', arg: r[1] + '|skip' })}</div>`;
        return `<tr style="${(r[3] === 'dup' || r[3] === 'noparent') && !fx ? 'background:var(--warn-bg)' : ''}"><td class="tnum muted">${i + 2}</td><td>${esc(r[0]) || '<span class="muted">—</span>'}</td><td>${esc(r[1])}</td><td>${esc(r[2]) || '<span class="muted">—</span>'}</td><td>${res}</td></tr>`; }).join('')}</tbody></table></div></div>
      <div class="row end">${btn('Cancel', { v: 'outline', go: 'settings/categories' })}${btn(`Import ${newRows.length} new categories`, { act: 'impConfirm', disabled: errs > 0, test: 'imp-confirm' })}</div>`;
    return `${pageHead({ title: 'Import categories from a spreadsheet', sub: 'Add many sectors, institution types and tiers at once. Nothing changes until you confirm.' })}${stepper(['Template and upload', 'Check rows', 'Confirm'], st.step === 0 ? 0 : st.step === 1 ? 1 : 2)}${body}`;
  }
});
ACT.impUpload = () => { const st = ui('imp'); st.step = 1; render(); setTimeout(() => { if (S.route === 'settings/categories/import' && ui('imp').step === 1) { st.step = 2; render(); } }, 1100); };
ACT.impReset = () => { S.ui.imp = { step: 0, fixes: {} }; render(); };
ACT.impFix = (arg) => { const [k, v] = arg.split('|'); ui('imp').fixes[k] = v; render(); };
ACT.impConfirm = () => {
  const st = ui('imp'); let added = 0;
  const findSector = n => S.categories.find(c => c.name === n) || (S.categories.push({ id: uid('s'), name: n, types: [], isNew: true }), S.categories[S.categories.length - 1]);
  IMPORT_CATS.forEach(r => {
    const take = r[3] === 'new' || (r[3] === 'noparent' && st.fixes[r[1]] === 'fix'); if (!take) return;
    const sec = findSector(r[0] || 'Banking'); let t = sec.types.find(x => x.name === r[1]);
    if (!t) { t = { id: uid('t'), name: r[1], count: 0, tiers: [], isNew: true }; sec.types.push(t); }
    if (r[2] && !t.tiers.includes(r[2])) t.tiers.push(r[2]); added++;
  });
  S.catHistory.unshift({ when: 'Today', who: persona().name, what: `Imported ${added} new categories from categories.xlsx` }); addAudit('Imported categories', `${added} rows from categories.xlsx`);
  S.ui.importDone = `${added} new categories added from categories.xlsx; 2 rows were fixed or skipped.`; S.ui.imp = { step: 0, fixes: {} }; S.ui.catTab = 'tree'; toast(`Imported ${added} new categories`); go('settings/categories');
};
ACT.undoImport = () => { S.categories.forEach(c => { c.types = c.types.filter(t => !t.isNew); }); S.categories = S.categories.filter(c => !c.isNew); S.ui.importDone = null; render(); toast('Import undone', 'info', 'arrow-u-up-left'); };

