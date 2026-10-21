/* ================= Regulator workspace: dashboard, first-time setup, organisations, assurance firms ================= */

/* ---------- compact profile header (organisations and firms) ---------- */
function profileHeader(o, kind, actions, tabsHtml) {
  return `<div class="ph-card"><div class="ph-row">${logo(o, 56)}
    <div class="ph-info"><div class="row wrap gap8"><h1 class="h1">${esc(o.name)}</h1>${kind === 'org' ? statusChip(orgStatus(o)) : statusChip(o.status)}</div><div class="ph-meta">${kind === 'org' ? cls(o.type || 'Category to confirm', o.tier) : o.types.map(t => tag(t)).join('')}${o.web ? `<span>${ic('globe')}${esc(o.web)}</span>` : ''}${o.hq && o.hq !== '—' || o.city ? `<span>${ic('map-pin')}${esc(o.hq && o.hq !== '—' ? o.hq : o.city)}</span>` : ''}${o.group ? `<span>${ic('buildings')}Group: ${esc(o.group)}</span>` : ''}</div></div>
    <div class="row wrap gap8">${actions}</div></div>${tabsHtml}</div>`;
}
const orgStatus = o => (o.status === 'Verified' && S.classReqs.some(r => r.org === o.id && r.status === 'Pending')) ? 'Change requested' : o.status;

/* ---------- Dashboard (Figma: Supervision overview) ---------- */
function dashGreeting() { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; }
const trend = d => d > 0 ? chip(`+${d} pts`, 'ok', 'trend-up') : d < 0 ? chip(`${d} pts`, 'bad', 'trend-down') : chip('0 pts', 'neu', 'minus');
/* the supervision dashboard is built from live data in c3.js */

/* ---------- First-time setup for a new regulator workspace (after invitation + MFA) ---------- */
const WIZ = [['profile', 'Profile'], ['branding', 'Branding'], ['team', 'Team']];
screen('welcome', {
  t: 'Set up your workspace', layout: 'public', ws: 'regulator',
  render() {
    const st = ui('wiz', { step: 0, theme: S.tenant.theme, invites: [] }); const t = S.tenant;
    let body;
    if (st.step === 0) body = `<div><h1 class="h1">Confirm your profile</h1><p class="muted" style="margin-top:4px">RegTech365 filled this in from your agreement. Check it; organisations see it in invitations and on your profile.</p></div>
      <form class="col gap16" data-form="wizProfile" novalidate><div class="grid g2" style="gap:14px">${field('Name shown in SuperAtlas', inp('w-name', t.name), { for: 'w-name' })}${field('Short name', inp('w-short', t.short, { attrs: 'maxlength="8"' }), { hint: 'Used in status text, e.g. "With ' + esc(t.short) + '"', for: 'w-short' })}</div>
        ${field('Legal name', inp('w-legal', t.legal), { for: 'w-legal' })}${field('Mandate', ta('w-mandate', t.mandate, { attrs: 'rows="3"' }), { for: 'w-mandate' })}
        <div class="grid g2" style="gap:14px">${field('Supervision email', inp('w-email', t.email, { type: 'email' }), { for: 'w-email' })}${field('Phone', inp('w-phone', t.phone), { for: 'w-phone' })}</div>
        <div class="row">${tenantMark(48)}<div class="grow small muted">${t.logoUploaded ? 'Logo uploaded by RegTech365.' : 'No logo yet. Initials are shown.'}</div>${btn(t.logoUploaded ? 'Replace logo' : 'Upload logo', { v: 'outline', size: 'sm', i: 'upload-simple', act: 'fakeUpload', arg: 'Logo uploaded' })}</div>
        <div class="row end">${btn('Save and continue', { type: 'submit', ir: 'arrow-right', test: 'wiz-next' })}</div></form>`;
    else if (st.step === 1) body = `<div><h1 class="h1">Choose your branding</h1><p class="muted" style="margin-top:4px">Your colours appear inside the workspace and on the emails you send. Sign-in stays SuperAtlas-branded so everyone has one place to sign in.</p></div>
      <div class="grid g3" style="gap:10px">${THEMES.map(([k, n, d, sw]) => `<button type="button" class="choice ${st.theme === k ? 'on' : ''}" data-act="wizTheme" data-arg="${k}"><span class="radio"></span><span class="grow"><b>${n}</b><br><span class="cap muted">${d}</span></span><span class="row gap4">${sw.map(c => `<i style="width:14px;height:14px;border-radius:4px;background:${c};display:inline-block"></i>`).join('')}</span></button>`).join('')}</div>
      <div class="preview-box">${brandPreview('app', st.theme)}</div>
      <div class="row between">${btn('Back', { v: 'outline', i: 'arrow-left', act: 'wizStep', arg: 0 })}${btn('Save and continue', { ir: 'arrow-right', act: 'wizBrand', test: 'wiz-next' })}</div>`;
    else body = `<div><h1 class="h1">Invite your team</h1><p class="muted" style="margin-top:4px">Add the people who will supervise with you. You can do this later from Team.</p></div>
      ${st.invites.map(i => `<div class="file">${av(initials(i.email.split('@')[0].replace('.', ' ')))}<div class="grow"><div class="strong">${esc(i.email)}</div><div class="cap muted">${esc(i.role)}</div></div>${chip('Invited', 'info', 'envelope-simple')}</div>`).join('')}
      <form class="row wrap" data-form="wizInvite" style="gap:10px" novalidate>${inp('wi-email', '', { type: 'email', ph: 'name@' + (t.email.split('@')[1] || 'regulator.gov.ng'), attrs: 'style="flex:1;min-width:220px"' })}${sel('wi-role', S.roles.map(r => r.name), 'Supervisor', { attrs: 'style="width:160px"' })}${btn('Invite', { type: 'submit', v: 'secondary', i: 'plus', test: 'wiz-invite' })}</form>
      <div class="row between">${btn('Back', { v: 'outline', i: 'arrow-left', act: 'wizStep', arg: 1 })}<div class="row gap8">${st.invites.length ? '' : btn('Skip for now', { v: 'tertiary', act: 'wizDone' })}${btn('Go to dashboard', { ir: 'arrow-right', act: 'wizDone', test: 'wiz-done' })}</div></div>`;
    return `<div class="wiz"><header class="wiz-top">${tenantMark(32)}<b>${esc(t.short)}</b><span class="muted small">Workspace setup</span><span class="grow"></span><span class="row gap8 cap muted">${meridian(16)}Powered by SuperAtlas</span></header>
      <div class="wiz-body"><div class="wiz-steps">${WIZ.map(([k, l], i) => `<div class="ws-step ${i < st.step ? 'done' : i === st.step ? 'on' : ''}"><span class="n">${i < st.step ? ic('check') : i + 1}</span>${l}</div>`).join('')}</div><div class="card col gap20 wiz-card">${body}</div></div></div>`;
  }
});
ACT.form_wizProfile = () => { if (!val('w-name')) { toast('Enter the name to show', 'bad'); return; } Object.assign(S.tenant, { name: val('w-name'), short: (val('w-short') || S.tenant.short).toUpperCase(), legal: val('w-legal'), mandate: val('w-mandate'), email: val('w-email'), phone: val('w-phone') }); addAudit('Confirmed profile', S.tenant.name); ui('wiz').step = 1; render(); };
ACT.wizTheme = (k) => { ui('wiz').theme = k; render(); };
ACT.wizStep = (n) => { ui('wiz').step = +n; render(); };
ACT.wizBrand = () => { S.tenant.theme = ui('wiz').theme; applyTheme(); addAudit('Set branding', THEMES.find(x => x[0] === S.tenant.theme)[1]); ui('wiz').step = 2; render(); };
ACT.form_wizInvite = () => { const em = val('wi-email'); if (!isEmail(em)) { toast('Enter a valid work email', 'bad'); return; } const nm = em.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()); ui('wiz').invites.push({ email: em, role: val('wi-role') }); S.team.push({ name: nm, ini: initials(nm), email: em, role: val('wi-role'), portfolio: 'All categories', status: 'Invited', last: '—' }); addAudit('Invited staff', em); render(); toast(`Invitation sent to ${esc(em)}`, 'ok', 'envelope-simple'); };
ACT.wizDone = () => { S.tenant.onboarded = true; S.ui.wiz = undefined; toast(`${esc(S.tenant.short)} is ready`, 'ok', 'check-circle'); go('dashboard'); };

/* ---------- Organisations: one table, category cards, status filters; profile holds invitations, verification and classification ---------- */
/* category cards: the regulator pins up to 6; every other category is one click away in "All categories" */
const SECTOR_IC = { Banking: 'bank', Payments: 'credit-card', 'Digital economy': 'cloud' };
const TYPE_IC = { 'Microfinance bank': 'piggy-bank', 'Mobile money operator': 'device-mobile', 'Switching and processing': 'arrows-left-right', 'Payment solution service provider': 'credit-card', 'Data controller of major importance': 'database', 'Cloud service provider': 'cloud', 'Fintech platform': 'lightning' };
function catOptions() {
  return S.categories.flatMap(c => [{ key: 's:' + c.name, label: c.name, kind: 'sector', value: c.name, icon: SECTOR_IC[c.name] || 'squares-four', group: 'Sectors' }]
    .concat(c.types.map(t => ({ key: 't:' + t.name, label: t.plural || t.name, kind: 'type', value: t.name, icon: TYPE_IC[t.name] || SECTOR_IC[c.name] || 'buildings', group: c.name }))));
}
const DEFAULT_PINS = ['t:Commercial bank', 't:Non-interest bank', 't:Merchant bank', 't:Microfinance bank', 's:Payments', 's:Digital economy'];
let catPins = null; try { catPins = JSON.parse(localStorage.getItem('sa-catpins') || 'null'); } catch (e) {}
const pins = () => (catPins || DEFAULT_PINS).map(k => catOptions().find(o => o.key === k)).filter(Boolean);
const inCard = (o, c) => !c || (c.kind === 'type' ? o.type === c.value : o.sector === c.value);
/* count = organisations this regulator manages on SuperAtlas (invited onwards), excluding rejected and revoked */
const managed = () => Object.values(S.orgs).filter(o => o.status !== 'Rejected' && o.status !== 'Revoked');
const catCount = c => managed().filter(o => inCard(o, c)).length;
function catCard(c, on) { return `<button class="cat-card ${on ? 'on' : ''}" data-act="orgCard" data-arg="${c.key}" data-test="cat-${c.value.split(' ')[0].toLowerCase()}" title="${esc(c.label)}">${tile(c.icon, on ? 'brand' : '', 'sm')}<span class="cat-l">${esc(c.label)}</span><b class="tnum">${catCount(c)}</b></button>`; }
ACT.catAll = (_, el, e) => {
  e && e.stopPropagation(); const cur = S.ui.orgCard; const opts = catOptions(); const groups = [...new Set(opts.map(o => o.group))];
  openPop(el, `<div class="row between" style="padding:6px 8px 8px"><b>All categories</b><button class="link-btn small" data-act="catCustomise">Choose cards</button></div><div class="cat-pop">${groups.map(g => `<div class="overline" style="padding:8px 10px 4px">${esc(g)}</div>${opts.filter(o => o.group === g).map(o => `<button class="menu-item ${cur === o.key ? 'on' : ''}" data-act="orgCard" data-arg="${o.key}">${ic(o.icon)}<span class="grow">${esc(o.label)}</span><span class="tnum muted small">${catCount(o)}</span></button>`).join('')}`).join('')}</div>`);
  $('#pop').style.width = '320px';
};
ACT.catCustomise = () => {
  closePop(); const cur = (catPins || DEFAULT_PINS); const opts = catOptions(); const groups = [...new Set(opts.map(o => o.group))];
  openDialog(`${dlgHead('Choose your category cards', 'Pick up to 6 to show above the table. Every category stays available under All categories. This only changes your view.', 'squares-four')}
    <div class="pin-grid">${groups.map(g => `<div><div class="overline" style="margin-bottom:6px">${esc(g)}</div>${opts.filter(o => o.group === g).map(o => ck('pin-' + o.key.replace(/[^a-z0-9]/gi, '_'), `${esc(o.label)} <span class="muted">· ${catCount(o)}</span>`, cur.includes(o.key), { attrs: `data-pin value="${esc(o.key)}" data-act="pinLimit"` })).join('')}</div>`).join('')}</div>
    <p class="cap muted" id="pin-n"></p><div class="row between">${btn('Reset to default', { v: 'tertiary', act: 'pinReset' })}<div class="row gap8">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Save cards', { act: 'pinSave', test: 'pin-save' })}</div></div>`, { wide: true });
  ACT.pinLimit();
};
ACT.pinLimit = () => { setTimeout(() => { const all = $$("input[data-pin]"); const n = all.filter(x => x.checked).length; all.forEach(x => { if (!x.checked) x.disabled = n >= 6; }); const el = $('#pin-n'); if (el) el.textContent = `${n} of 6 chosen`; }); };
ACT.pinSave = () => { const v = $$("input[data-pin]:checked").map(x => x.value); if (!v.length) { toast('Choose at least one card', 'bad'); return; } catPins = v; try { localStorage.setItem('sa-catpins', JSON.stringify(v)); } catch (e) {} closeDialog(); render(); toast('Category cards saved'); };
ACT.pinReset = () => { catPins = null; try { localStorage.removeItem('sa-catpins'); } catch (e) {} closeDialog(); render(); toast('Category cards reset'); };
const ORG_ST = ['All', 'Verified', 'Invited', 'Pending verification', 'Info requested', 'Change requested', 'Invite expired', 'Rejected', 'Revoked'];
function orgRowAction(o) {
  const st = orgStatus(o);
  if (st === 'Pending verification' || st === 'Info requested') return btn('Review', { v: 'secondary', size: 'sm', act: 'open', arg: `organisations/profile:${o.id}|verification`, test: 'row-review-' + o.id });
  if (st === 'Change requested') return btn('Review change', { v: 'secondary', size: 'sm', act: 'open', arg: `organisations/profile:${o.id}|classification`, test: 'row-change-' + o.id });
  if (st === 'Invited') return btn('Resend', { v: 'tertiary', size: 'sm', act: 'invResend', arg: o.id });
  if (st === 'Invite expired') return btn('Resend', { v: 'secondary', size: 'sm', act: 'invResend', arg: o.id, test: 'row-resend-' + o.id });
  return '';
}
screen('organisations', {
  t: 'Organisations', layout: 'app', ws: 'regulator', crumbs: ['Organisations'],
  render() {
    const st = ui('orgSt', 'All'); const card = ui('orgCard', ''); const q = ui('orgQ', '');
    const all = Object.values(S.orgs); const c = catOptions().find(x => x.key === card);
    const base = all.filter(o => inCard(o, c) && (!q || (o.name + o.officer + (o.web || '')).toLowerCase().includes(q.toLowerCase())));
    const rows = base.filter(o => st === 'All' || orgStatus(o) === st);
    const cnt = s => s === 'All' ? base.length : base.filter(o => orgStatus(o) === s).length;
    const sts = ORG_ST.filter(s => ['All', 'Verified', 'Invited', 'Pending verification'].includes(s) || cnt(s) || s === st);
    return `${pageHead({ title: 'Organisations', sub: 'Everyone you supervise, from invitation to verified. Open an organisation to verify it, review a category change or manage its invitation.', actions: `<button class="icon-btn bordered" data-go="settings/categories" title="Category settings" aria-label="Category settings">${ic('gear-six')}</button>` + btn('Export', { v: 'outline', i: 'export', act: 'savedToast', arg: 'Export started. You will get an email when it is ready.' }) + btn('Invite organisations', { i: 'user-plus', go: 'organisations/invite', test: 'go-invite' }) })}
      <div class="cat-cards" style="--n:${pins().length + 1}">${pins().map(x => catCard(x, card === x.key)).join('')}<button class="cat-card more ${card && !pins().some(p => p.key === card) ? 'on' : ''}" data-act="catAll" data-test="cat-all">${tile('dots-three', '', 'sm')}<span class="cat-l">All categories</span><span class="cat-more">${catOptions().length} to choose from ${ic('caret-down')}</span></button></div>
      <div class="card p0"><div class="tbl-tools"><form class="inp-wrap" data-form="orgSearch" style="width:280px">${ic('magnifying-glass')}<input class="inp" id="org-q" placeholder="Search name, officer or website" value="${esc(q)}"></form>${c ? `<span class="filter-chip">${ic('funnel')}${esc(c.label)}<button class="icon-btn" data-act="orgCard" data-arg="${card}" aria-label="Clear category filter">${ic('x')}</button></span>` : ''}${c && allTypes().some(x => x.name === c.label || x.plural === c.label) ? btn('Category insights', { v: 'tertiary', size: 'sm', i: 'chart-bar', act: 'open', arg: 'organisations/category:' + (allTypes().find(x => x.name === c.label || x.plural === c.label) || {}).name, test: 'cat-insights' }) : ''}<span class="grow"></span><span class="cap muted">${rows.length} shown</span></div>
        <div class="tbl-sub"><div class="pills">${sts.map(s => `<button class="pill ${st === s ? 'on' : ''}" data-act="orgSt" data-arg="${s}" data-test="st-${s.replace(/ /g, '-')}">${s}${count(cnt(s))}</button>`).join('')}</div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Category</th><th>Status</th><th>Last activity</th><th class="act-col"></th></tr></thead><tbody>${rows.map(o => `<tr class="click" data-act="open" data-arg="organisations/profile:${o.id}|overview" data-test="org-${o.id}"><td>${orgCell(o, o.officer && o.officer !== '—' ? o.officer + ' · ' + (o.web || '') : o.web)}</td><td>${cls(o.type || 'Category to confirm', o.tier)}</td><td>${statusChip(orgStatus(o))}${o.isNew ? ' ' + chip('New', 'brand') : ''}</td><td class="small muted">${esc(o.last || '—')}</td><td class="act-col"><div class="row end gap4">${orgRowAction(o)}<button class="icon-btn" data-act="orgMenu" data-arg="${o.id}" aria-label="More actions">${ic('dots-three')}</button></div></td></tr>`).join('') || `<tr><td colspan="5">${empty('magnifying-glass', 'No organisations match', 'Try another status, category or search.')}</td></tr>`}</tbody></table></div>
        <div class="tbl-foot row between"><span>${managed().length} organisations managed on SuperAtlas</span><div class="row gap4">${btnIc('caret-left', 'savedToast', 'First page', 'Previous page')}${btnIc('caret-right', 'savedToast', 'Next page', 'Next page')}</div></div></div>`;
  }
});
ACT.orgSt = (s) => { S.ui.orgSt = s; render(); };
ACT.orgCard = (k) => { closePop(); S.ui.orgCard = S.ui.orgCard === k ? '' : k; render(); };
ACT.form_orgSearch = () => { S.ui.orgQ = val('org-q'); render(); };
ACT.orgMenu = (id, el, e) => {
  e && e.stopPropagation(); const o = S.orgs[id]; const st = orgStatus(o);
  const items = [['eye', 'Open profile', 'open', `organisations/profile:${id}|overview`]];
  if (st === 'Verified' || st === 'Change requested') items.push(['git-diff', 'Change category', 'regChangeCat', id], ['chat-circle-dots', 'Message compliance officer', 'savedToast', 'Message sent to ' + o.officer]);
  if (st === 'Invited' || st === 'Invite expired') items.push(['envelope-simple', 'View invitation email', 'invPreview', id], ['arrow-clockwise', 'Resend invitation', 'invResend', id], ['x-circle', 'Revoke invitation', 'invRevoke', id]);
  if (st === 'Pending verification' || st === 'Info requested') items.push(['seal-check', 'Review application', 'open', `organisations/profile:${id}|verification`]);
  openPop(el, items.map(([i, l, a, g]) => `<button class="menu-item" data-act="${a}" data-arg="${esc(g)}" ${l.startsWith('Revoke') ? 'style="color:var(--bad-fg)"' : ''}>${ic(i)}<span>${l}</span></button>`).join(''));
};

/* organisation profile (regulator view) */
screen('organisations/profile', {
  t: 'Organisation', layout: 'app', ws: 'regulator', crumbs: () => [['Organisations', 'organisations'], (S.orgs[S.ui.profileOrg] || S.orgs.zenith).name],
  render() {
    const o = S.orgs[S.ui.profileOrg] || S.orgs.zenith; const st = orgStatus(o);
    const reqs = S.classReqs.filter(r => r.org === o.id); const pend = reqs.find(r => r.status === 'Pending');
    const tabsL = [{ id: 'overview', label: 'Overview' }];
    if (typeof orgComplianceReg === 'function' && o.status === 'Verified') tabsL.push({ id: 'compliance', label: 'Compliance', test: 'org-tab-compliance' });
    if (o.application) tabsL.push({ id: 'verification', label: 'Verification', count: (o.status === 'Pending verification' || o.status === 'Info requested') ? 1 : undefined });
    tabsL.push({ id: 'classification', label: 'Classification', count: pend ? 1 : undefined }, { id: 'invitations', label: 'Invitations' }, { id: 'people', label: 'People' }, { id: 'licences', label: 'Licences' }, { id: 'activity', label: 'Activity' });
    let t = ui('orgTab', 'overview'); if (!tabsL.some(x => x.id === t)) t = 'overview';
    let acts = '';
    if (st === 'Pending verification' || st === 'Info requested') acts = btn('Review application', { act: 'orgTab', arg: 'verification' });
    else if (st === 'Change requested') acts = btn('Review change', { act: 'orgTab', arg: 'classification' });
    else if (st === 'Invited' || st === 'Invite expired') acts = btn('Revoke', { v: 'outline', act: 'invRevoke', arg: o.id }) + btn('Resend invitation', { i: 'envelope-simple', act: 'invResend', arg: o.id, test: 'prof-resend' });
    else if (st === 'Verified') acts = btn('Message', { v: 'outline', i: 'chat-circle-dots', act: 'savedToast', arg: 'Message sent to ' + o.officer }) + btn('Change category', { v: 'secondary', i: 'git-diff', act: 'regChangeCat', arg: o.id });
    let body = '';
    const officers = o.officers || (o.officer && o.officer !== '—' ? [{ ini: initials(o.officer), name: o.officer, role: 'Chief compliance officer', email: o.invite && o.invite.email }] : []);
    if (t === 'overview') body = `<div class="grid side"><div class="col gap16"><div class="card col gap12"><div class="h4">Organisation details</div>${kv([['Legal name', esc(o.name)], ['Registration number', esc(o.rc || (o.application && o.application.rc) || '—')], ['Website', esc(o.web || '—')], ['Head office', esc(o.hq || '—')], ['Compliance contact', esc(o.email || (o.invite && o.invite.email) || '—')], ['Joined', esc(o.joined || '—')]])}</div>
        <div class="card col gap12"><div class="row"><span class="h4 grow">Classification</span>${btn('Manage', { v: 'tertiary', size: 'sm', act: 'orgTab', arg: 'classification' })}</div>${kv([['Sector', esc(o.sector || '—')], ['Institution type', esc(o.type || 'To confirm')], ['Authorisation tier', esc(o.tier || '—')], ['Tags', esc((o.tags || []).join(' · ') || '—')]])}</div></div>
      <div class="col gap16"><div class="card col gap12"><div class="h4">Status</div>${statusTimeline(o)}</div>
        <div class="card col gap12"><div class="h4">Key officers</div>${officers.map(p => `<div class="row">${av(p.ini || initials(p.name))}<div><div class="strong small">${esc(p.name)}</div><div class="cap muted">${esc(p.role)}</div></div></div>`).join('') || '<p class="small muted">Added by the organisation after it joins.</p>'}</div></div></div>`;
    if (t === 'compliance') body = orgComplianceReg(o);
    if (t === 'verification') { const a = o.application; const open = o.status === 'Pending verification' || o.status === 'Info requested';
      body = `<div class="grid side"><div class="col gap16"><div class="card col gap12"><div class="row"><span class="h4 grow">Application</span><span class="cap muted">${esc(a.route)} · submitted ${esc(a.submitted)}</span></div>${kv([['Category chosen', cls(o.type, o.tier)], ['Sector', esc(o.sector)], ['Registration number', esc(a.rc)], ['Contact', esc(a.contact)]])}${fileRow(a.licence, 'Licence · PDF · integrity recorded', { i: 'file-text' })}</div>
        <div class="card col gap12"><div class="h4">Automatic checks</div>${a.checks.map(([x, ok]) => `<div class="row small">${ok ? `<span class="yes">${ic('check-circle')}</span>` : `<span style="color:var(--warn-icon)">${ic('warning')}</span>`}<span class="grow">${x}</span>${ok ? chip('Passed', 'ok') : chip('Check manually', 'warn')}</div>`).join('')}</div></div>
        <div class="col gap16">${open ? `<div class="card col gap12"><div class="h4">Decision</div>${o.status === 'Info requested' ? note(`You asked: “${esc(o.infoMsg)}” The organisation has not replied yet.`, 'chat-circle-dots') : '<p class="small muted">Approving adds the organisation to your register. It can then complete its profile and receive programmes.</p>'}${btn('Approve and verify', { i: 'seal-check', act: 'verApprove', arg: o.id, block: true, test: 'ver-approve' })}${btn('Ask for more information', { v: 'secondary', act: 'verAsk', arg: o.id, block: true, test: 'ver-ask' })}${btn('Reject', { v: 'danger-soft', act: 'verReject', arg: o.id, block: true })}</div>`
          : `<div class="card col gap8">${o.status === 'Verified' ? alertBox('ok', 'Verified', `${esc(o.name)} is in your register.`) : alertBox('bad', 'Rejected', esc(o.rejectMsg || 'The applicant was told why.'))}</div>`}</div></div>`; }
    if (t === 'classification') {
      const side = (label, c, on) => `<div class="card col gap8" style="${on ? 'box-shadow:0 0 0 2px var(--brand-500),var(--e1)' : ''}"><span class="overline" style="${on ? 'color:var(--brand-500)' : ''}">${label}</span>${cls(c.type, c.tier)}${kv([['Sector', esc(c.sector)], ['Institution type', esc(c.type)], ['Authorisation', esc(c.tier || '—')]])}</div>`;
      body = `${pend ? `<div class="card col gap16"><div class="row"><div class="grow"><div class="overline">Request ${esc(pend.ref)}</div><div class="h3">Category change requested</div><div class="cap muted">By ${esc(pend.by)} · ${esc(pend.date)}</div></div>${chip('Waiting for you', 'warn', 'clock')}</div>
          <div class="cmp">${side('Current', pend.from, false)}<span class="tile" style="border-radius:999px;background:var(--surface);box-shadow:var(--e1)">${ic('arrow-right')}</span>${side('Proposed', pend.to, true)}</div>
          <div class="grid g2" style="gap:16px"><div class="col gap8"><div class="h4">Reason given</div><p class="muted small">${esc(pend.reason)}</p>${fileRow(pend.file, 'Licence evidence · integrity recorded', { i: 'file-text' })}</div>${alertBox('warn', 'If you approve', esc(pend.impact))}</div>
          <div class="col gap12">${field('Note to the organisation', ta('cc-note', '', { ph: 'e.g. Approved. Effective from the next cycle.', attrs: 'rows="2"' }), { hint: 'Required if you reject.', for: 'cc-note' })}<div class="row end">${btn('Reject', { v: 'secondary', act: 'ccDecide', arg: pend.id + '|Rejected' })}${btn('Approve change', { i: 'seal-check', act: 'ccDecide', arg: pend.id + '|Approved', test: 'cc-approve' })}</div></div></div>` : ''}
        <div class="grid side"><div class="card col gap12"><div class="row"><span class="h4 grow">Current category</span>${o.status === 'Verified' ? btn('Change category', { v: 'outline', size: 'sm', i: 'git-diff', act: 'regChangeCat', arg: o.id }) : ''}</div>${kv([['Sector', esc(o.sector || '—')], ['Institution type', esc(o.type || 'To confirm')], ['Authorisation tier', esc(o.tier || '—')]])}<p class="cap muted">${ic('lock-simple')} Only ${esc(S.tenant.short)} can change it. The organisation can ask through a classification request.</p></div>
          <div class="card col gap12"><div class="h4">Request history</div>${reqs.filter(r => r.status !== 'Pending').map(r => `<div class="row top small">${tile(r.status === 'Approved' ? 'check-circle' : 'x-circle', r.status === 'Approved' ? 'ok' : 'bad', 'sm')}<div class="grow"><b>${esc(r.ref)} · ${esc(r.status)}</b><div class="cap muted">${esc(catLabel(r.from.type, r.from.tier))} → ${esc(catLabel(r.to.type, r.to.tier))} · ${esc(r.decided || '')}</div>${r.note ? `<div class="cap" style="margin-top:2px">${esc(r.note)}</div>` : ''}</div></div>`).join('') || '<p class="small muted">No decided requests.</p>'}</div></div>`;
    }
    if (t === 'invitations') { const inv = o.invite || { history: [] };
      body = `<div class="grid side"><div class="card col gap12"><div class="h4">Invitation history</div><div class="timeline">${inv.history.slice().reverse().map(([d, w, by]) => `<div class="tl">${tile(/expired|revoked/i.test(w) ? 'clock' : /accepted|verified/i.test(w) ? 'check-circle' : 'envelope-simple', /accepted|verified/i.test(w) ? 'ok' : '', 'sm')}<div><b>${esc(w)}</b><div class="cap muted">${esc(d)} · ${esc(by)}</div></div></div>`).join('') || '<p class="small muted">Registered without an invitation.</p>'}</div></div>
        <div class="card col gap12"><div class="h4">Current invitation</div>${inv.email ? kv([['Sent to', esc(inv.email)], ['Status', statusChip(st === 'Invited' || st === 'Invite expired' || st === 'Revoked' ? st : 'Accepted')], ['Sent', esc(inv.sent || inv.history[0] && inv.history[0][0] || '—')], ['Expires', esc(st === 'Invited' ? inv.expires : '—')]]) : '<p class="small muted">No invitation. This organisation registered itself.</p>'}
          ${inv.email ? `<div class="row wrap gap8">${btn('View email', { v: 'outline', size: 'sm', i: 'envelope-open', act: 'invPreview', arg: o.id })}${st === 'Invited' || st === 'Invite expired' || st === 'Revoked' ? btn('Resend', { v: 'secondary', size: 'sm', act: 'invResend', arg: o.id }) : ''}${st === 'Invited' ? btn('Revoke', { v: 'tertiary', size: 'sm', act: 'invRevoke', arg: o.id }) : ''}</div>` : ''}</div></div>`; }
    if (t === 'people') body = `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role in SuperAtlas</th><th>Status</th></tr></thead><tbody>${[...officers.map(p => [p.name, p.email || '', p.role, 'Active']), ...(o.colleagues || []).map(c => [c.name || c.email, c.email, c.role, c.status || 'Invited'])].map(([n, e, r, s]) => `<tr><td><div class="row">${av(initials(n))}<div><div class="strong">${esc(n)}</div><div class="cap muted">${esc(e)}</div></div></div></td><td>${esc(r)}</td><td>${s === 'Active' ? chip('Active', 'ok') : chip('Invited', 'info')}</td></tr>`).join('') || `<tr><td colspan="3">${empty('users', 'No people yet', 'People appear once the organisation accepts its invitation.')}</td></tr>`}</tbody></table></div></div>`;
    if (t === 'licences') body = `<div class="card col gap12">${o.status === 'Invited' || o.status === 'Invite expired' ? empty('certificate', 'No licences yet', 'The organisation uploads its licence when it accepts the invitation.') : fileRow(`${o.type || 'Operating'} licence — ${o.tier || 'current'}.pdf`, `Issued Jan 2024 · expires Dec 2028 · ${o.status === 'Verified' ? 'verified by ' + esc(S.tenant.short) : 'not yet verified'}`, { i: 'certificate', tone: o.status === 'Verified' ? 'ok' : '' }) + fileRow('Certificate of incorporation.pdf', 'Uploaded at registration', { i: 'file-text' })}</div>`;
    if (t === 'activity') { const rows = S.audit.filter(a => a.record.includes(o.name.split(' ')[0])); body = `<div class="card"><div class="timeline">${rows.map(a => `<div class="tl">${av(a.ini)}<div><b>${esc(a.action)}</b><div class="cap muted">${esc(a.who)} · ${esc(a.when)}</div></div></div>`).join('') || empty('clock-counter-clockwise', 'No activity yet', 'Actions on this organisation appear here.')}</div></div>`; }
    return `${profileHeader(o, 'org', acts, tabs(tabsL, t, 'orgTab'))}${body}`;
  }
});
ACT.orgTab = (t) => { S.ui.orgTab = t; render(); };
function statusTimeline(o) {
  const steps = [['Invited', !!(o.invite && o.invite.email)], ['Joined', !['Invited', 'Invite expired', 'Revoked'].includes(o.status)], ['Verified', o.status === 'Verified']];
  if (o.selfReg) steps[0] = ['Registered', true];
  return `<div class="mini-steps">${steps.map(([l, d]) => `<div class="${d ? 'done' : ''}"><span>${d ? ic('check') : ''}</span>${l}</div>`).join('')}</div><div class="small muted">${{ Verified: 'Verified and in your register.', Invited: `Invitation sent ${esc(o.invite && o.invite.sent || '')}. Expires ${esc(o.invite && o.invite.expires || '')}.`, 'Invite expired': 'The invitation expired before it was accepted.', 'Pending verification': 'Waiting for your verification.', 'Info requested': 'Waiting for the organisation to reply.', Rejected: 'Application rejected.', Revoked: 'Invitation revoked.' }[o.status] || ''}</div>`;
}

/* ---------- Assurance firms ---------- */
const FIRM_ST = ['All', 'Accredited', 'Renewal due', 'In review', 'Invited', 'Suspended', 'Declined'];
const firmHasType = (f, t) => f.types.includes(t);
const leadOf = f => (f.people || []).find(p => p.role === 'Lead auditor');
screen('firms', {
  t: 'Assurance firms', layout: 'app', ws: 'regulator', crumbs: ['Assurance firms'],
  render() {
    const st = ui('firmSt', 'All'); const ty = ui('firmTy', ''); const q = ui('firmQ', '');
    const all = Object.values(S.firms);
    const base = all.filter(f => (!ty || firmHasType(f, ty)) && (!q || f.name.toLowerCase().includes(q.toLowerCase())));
    const rows = base.filter(f => st === 'All' || f.status === st);
    const cnt = s => s === 'All' ? base.length : base.filter(f => f.status === s).length;
    const sts = FIRM_ST.filter(s => ['All', 'Accredited', 'In review'].includes(s) || cnt(s) || s === st);
    const act = f => f.status === 'In review' ? btn('Review application', { v: 'secondary', size: 'sm', act: 'open', arg: `firms/profile:${f.id}|accreditations`, test: 'row-acc-' + f.id }) : f.status === 'Renewal due' ? btn('Renew', { v: 'tertiary', size: 'sm', act: 'firmRenew', arg: f.id }) : '';
    return `${pageHead({ title: 'Assurance firms', sub: `Firms accredited to assess the organisations you supervise. Accreditation lasts ${esc(S.firmRules.renewal)} months. Open a firm to review its application or its people.`, actions: `<button class="icon-btn bordered" data-go="settings/firm-types" title="Firm type settings" aria-label="Firm type settings">${ic('gear-six')}</button>` + btn('Export', { v: 'outline', i: 'export', act: 'savedToast', arg: 'Export started' }) + btn('Invite a firm', { i: 'user-plus', act: 'firmInvite', test: 'firm-invite' }) })}
      <div class="cat-cards c4">${S.firmTypes.map(t => `<button class="cat-card ${ty === t.name ? 'on' : ''}" data-act="firmTy" data-arg="${t.name}">${tile(t.icon, ty === t.name ? 'brand' : '', 'sm')}<span class="cap muted">${esc(t.name)}</span><b class="tnum">${all.filter(f => firmHasType(f, t.name) && f.status !== 'Declined').length}</b><span class="cap muted">${all.filter(f => firmHasType(f, t.name) && f.status === 'Accredited').length} accredited</span></button>`).join('')}</div>
      <div class="card p0"><div class="tbl-tools"><form class="inp-wrap" data-form="firmSearch" style="width:280px">${ic('magnifying-glass')}<input class="inp" id="firm-q" placeholder="Search firms" value="${esc(q)}"></form>${ty ? `<span class="filter-chip">${ic('funnel')}${esc(ty)}<button class="icon-btn" data-act="firmTy" data-arg="${ty}" aria-label="Clear firm type filter">${ic('x')}</button></span>` : ''}<span class="grow"></span><span class="cap muted">${rows.length} shown</span></div>
        <div class="tbl-sub"><div class="pills">${sts.map(s => `<button class="pill ${st === s ? 'on' : ''}" data-act="firmSt" data-arg="${s}">${s}${count(cnt(s))}</button>`).join('')}</div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Firm</th><th>Firm types</th><th>Status</th><th>Lead auditor</th><th class="num">Assessors</th><th class="num">Assigned</th><th>Renews</th><th class="act-col"></th></tr></thead><tbody>${rows.map(f => { const l = leadOf(f); return `<tr class="click" data-act="open" data-arg="firms/profile:${f.id}|overview" data-test="firm-${f.id}"><td>${orgCell(f, f.city)}</td><td><div class="row wrap gap6">${f.types.map(t => tag(t)).join('')}</div></td><td>${statusChip(f.status)}</td><td class="small">${l ? esc(l.name) : '—'}</td><td class="num tnum">${(f.people || []).filter(p => p.role === 'Assessor').length}</td><td class="num tnum">${f.assigned}</td><td class="small muted">${esc(f.renews)}</td><td class="act-col"><div class="row end gap4">${act(f)}<button class="icon-btn" data-act="firmMenu" data-arg="${f.id}" aria-label="More actions">${ic('dots-three')}</button></div></td></tr>`; }).join('') || `<tr><td colspan="8">${empty('briefcase', 'No firms match', 'Try another status or firm type.')}</td></tr>`}</tbody></table></div>
        <div class="tbl-foot">${rows.length} of ${all.length} firms</div></div>`;
  }
});
ACT.firmSt = (s) => { S.ui.firmSt = s; render(); };
ACT.firmTy = (t) => { S.ui.firmTy = S.ui.firmTy === t ? '' : t; render(); };
ACT.form_firmSearch = () => { S.ui.firmQ = val('firm-q'); render(); };
ACT.firmMenu = (id, el, e) => { e && e.stopPropagation(); const f = S.firms[id]; const items = [['eye', 'Open profile', 'open', `firms/profile:${id}|overview`]]; if (f.status === 'Accredited' || f.status === 'Renewal due') items.push(['arrow-clockwise', 'Renew accreditation', 'firmRenew', id], ['warning-octagon', 'Suspend', 'firmSuspend', id]); if (f.status === 'Suspended') items.push(['seal-check', 'Reinstate', 'firmReinstate', id]); if (f.status === 'In review') items.push(['certificate', 'Review application', 'open', `firms/profile:${id}|accreditations`]); openPop(el, items.map(([i, l, a, g]) => `<button class="menu-item" data-act="${a}" data-arg="${esc(g)}" ${l === 'Suspend' ? 'style="color:var(--bad-fg)"' : ''}>${ic(i)}<span>${l}</span></button>`).join('')); };
ACT.firmInvite = () => openDialog(`${dlgHead('Invite an assurance firm', 'The firm sets up its profile and applies for accreditation by type.', 'briefcase')}<form class="col gap16" data-form="firmInvite" novalidate>${field('Firm name', inp('fi-name', ''), { for: 'fi-name' })}${field('Contact email', inp('fi-email', '', { type: 'email' }), { for: 'fi-email' })}${field('Expected firm type', sel('fi-type', S.firmTypes.map(t => t.name), S.firmTypes[0].name), { for: 'fi-type' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Send invitation', { type: 'submit', i: 'envelope-simple' })}</div></form>`);
ACT.form_firmInvite = () => { const n = val('fi-name'), em = val('fi-email'); if (!n || !isEmail(em)) { toast('Add the firm name and a valid email', 'bad'); return; } const id = uid('f'); S.firms[id] = { id, name: n, ini: initials(n), col: '#455A64', web: em.split('@')[1], types: [val('fi-type')], status: 'Invited', assigned: 0, renews: '—', since: '—', city: '—', people: [], clients: [], isNew: true }; closeDialog(); addAudit('Invited firm', n); render(); toast(`Invitation sent to ${esc(n)}`, 'ok', 'envelope-simple'); };

screen('firms/profile', {
  t: 'Assurance firm', layout: 'app', ws: 'regulator', crumbs: () => [['Assurance firms', 'firms'], (S.firms[S.ui.profileFirm] || S.firms.deloitte).name],
  render() {
    const f = S.firms[S.ui.profileFirm] || S.firms.deloitte; const accs = S.firmAccreditations[f.id] || [];
    const apps = S.accApps.filter(a => a.firm === f.id); const open = apps.filter(a => a.status === 'In review' || a.status === 'Info requested');
    const t = ui('firmTab', 'overview'); const P = f.people || [];
    const acts = f.status === 'Suspended' ? btn('Reinstate', { i: 'seal-check', act: 'firmReinstate', arg: f.id }) : f.status === 'In review' ? btn('Review application', { act: 'firmTab', arg: 'accreditations' }) : (f.status === 'Accredited' || f.status === 'Renewal due') ? btn('Renew accreditation', { i: 'arrow-clockwise', act: 'firmRenew', arg: f.id }) + moreMenu('firm-' + f.id, [['pause-circle', 'Suspend accreditation', 'firmSuspend', f.id, true]]) : '';
    let body = '';
    if (t === 'overview') body = `<div class="grid side"><div class="col gap16"><div class="card col gap12"><div class="h4">Firm details</div>${kv([['Firm name', esc(f.name)], ['Website', esc(f.web)], ['Offices', esc(f.city)], ['Firm types', esc(f.types.join(', '))], ['Accredited since', esc(f.since)], ['Renews', esc(f.renews)]])}</div>
        ${f.status === 'Suspended' ? alertBox('bad', 'Suspended', esc(f.suspendReason || 'See the audit trail for the reason.')) : (f.clients || []).length ? alertBox('info', 'Independence', `${esc(f.name.split(' ')[0])} has declared ${f.clients.length} advisory client${f.clients.length > 1 ? 's' : ''}. It cannot be assigned to assess them for ${esc(S.firmRules.conflictMonths)} months.`) : ''}</div>
      <div class="col gap16"><div class="card col gap8"><div class="h4">At a glance</div>${[['Organisations assigned', f.assigned], ['Lead auditor', leadOf(f) ? leadOf(f).name : '—'], ['Assessors', P.filter(p => p.role === 'Assessor').length], ['Active accreditations', accs.filter(a => a.status === 'Active').length]].map(([k, v]) => `<div class="row between small"><span class="muted">${k}</span><b class="tnum">${esc(v)}</b></div>`).join('')}</div>
        ${open.length ? `<div class="card col gap8">${alertBox('info', `${open.length} application${open.length > 1 ? 's' : ''} to review`, esc(open.map(a => a.type).join(', ')), btn('Review', { size: 'sm', act: 'firmTab', arg: 'accreditations' }))}</div>` : ''}</div></div>`;
    if (t === 'performance') body = firmPerf(f, 'reg');
    if (t === 'accreditations') body = `${open.map(a => accReview(a, f)).join('')}
      <div class="card col gap12"><div class="h4">Accreditations</div>${accs.map(a => `<div class="file">${tile('certificate', a.status === 'Active' ? 'ok' : a.status === 'Suspended' ? 'bad' : 'warn', 'sm')}<div class="grow"><div class="strong">${esc(a.type)}</div><div class="cap muted">${esc(a.ref)} · ${esc(a.from)} to ${esc(a.to)}</div></div>${statusChip(a.status)}</div>`).join('') || '<p class="small muted">No accreditations yet.</p>'}
        ${apps.filter(a => a.status === 'Accredited' || a.status === 'Declined').map(a => `<div class="file">${tile(a.status === 'Accredited' ? 'check-circle' : 'x-circle', a.status === 'Accredited' ? 'ok' : 'bad', 'sm')}<div class="grow"><div class="strong">${esc(a.type)} application</div><div class="cap muted">Decided ${esc(a.decided)}</div></div>${statusChip(a.status)}</div>`).join('')}</div>`;
    if (t === 'people') body = `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Credential expiry</th><th>Status</th></tr></thead><tbody>${P.map(p => `<tr><td><div class="row">${av(p.ini || initials(p.name))}<div><div class="strong">${esc(p.name)}</div><div class="cap muted">${esc(p.title || '')}</div></div></div></td><td>${chip(p.role, p.role === 'Lead auditor' ? 'brand' : 'neu')}</td><td class="small">${esc(p.cred)}</td><td class="small ${p.expires === 'Expired' ? '' : 'muted'}">${p.expires === 'Expired' ? chip('Expired', 'bad') : esc(p.expires)}</td><td>${statusChip(p.status)}</td></tr>`).join('') || `<tr><td colspan="5">${empty('users', 'No people yet', 'The firm adds its lead auditor and assessors during setup.')}</td></tr>`}</tbody></table></div></div>`;
    if (t === 'assignments') body = `<div class="card">${empty('kanban', 'Assignments arrive with programmes', 'When programmes launch (Drop B), the organisations this firm is assigned to will be listed here, with independence checks.')}</div>`;
    if (t === 'activity') { const rows = S.audit.filter(a => a.record.includes(f.name.split(' ')[0])); body = `<div class="card"><div class="timeline">${rows.map(a => `<div class="tl">${av(a.ini)}<div><b>${esc(a.action)}</b><div class="cap muted">${esc(a.who)} · ${esc(a.when)}</div></div></div>`).join('') || empty('clock-counter-clockwise', 'No activity yet', 'Actions on this firm appear here.')}</div></div>`; }
    return `${profileHeader(f, 'firm', acts, tabs([{ id: 'overview', label: 'Overview' }, ...(typeof firmPerf === 'function' ? [{ id: 'performance', label: 'Performance', test: 'firm-tab-perf' }] : []), { id: 'accreditations', label: 'Accreditations', count: open.length || undefined }, { id: 'people', label: 'People', count: P.length }, { id: 'assignments', label: 'Assignments' }, { id: 'activity', label: 'Activity' }], t, 'firmTab'))}${body}`;
  }
});
ACT.firmTab = (t) => { S.ui.firmTab = t; render(); };
function accReview(a, f) {
  const missing = a.docs.filter(d => !d[1]).length;
  return `<div class="card col gap16"><div class="row"><div class="grow"><div class="overline">Application</div><div class="h3">${esc(a.type)}</div><div class="cap muted">Submitted ${esc(a.submitted)} · decision due ${esc(a.due)}</div></div>${statusChip(a.status)}</div>
    ${a.status === 'Info requested' ? note(`You asked: “${esc(a.infoMsg || '')}” Waiting for the firm.`, 'chat-circle-dots') : ''}
    <div class="grid g2" style="gap:16px"><div class="col gap8"><div class="h4">Documents</div>${a.docs.map(([d, ok]) => `<div class="file">${tile('file-text', ok ? '' : 'warn', 'sm')}<div class="grow"><div class="strong small">${esc(d)}</div><div class="cap muted">${ok ? 'Uploaded · integrity checked' : 'Missing'}</div></div>${ok ? chip('Received', 'ok', 'check') : chip('Missing', 'warn', 'warning')}</div>`).join('')}</div>
      <div class="col gap8"><div class="h4">Nominated assessors</div>${a.assessors.map(([n, c, ok]) => `<div class="file">${av(initials(n))}<div class="grow"><div class="strong small">${esc(n)}</div><div class="cap muted">${esc(c)}</div></div>${ok ? chip('Meets criteria', 'ok') : chip('Not yet', 'warn')}</div>`).join('')}<p class="cap muted">${esc(a.decl)}</p></div></div>
    ${missing ? alertBox('warn', `${missing} document${missing > 1 ? 's are' : ' is'} missing`, 'Ask for the missing documents before accrediting.') : ''}
    <div class="row wrap" style="align-items:flex-end;gap:12px">${field('Accredited from', inp('ac-from', '2026-11-01', { type: 'date' }), { for: 'ac-from' })}${field('Accredited until', inp('ac-to', '2027-10-31', { type: 'date' }), { for: 'ac-to' })}<span class="cap muted" style="padding-bottom:10px">${esc(S.firmRules.renewal)} months, set in Settings</span><span class="grow"></span>${btn('Decline', { v: 'danger-soft', act: 'accDecide', arg: a.id + '|Declined' })}${btn('Ask for more information', { v: 'secondary', act: 'accDecide', arg: a.id + '|Info requested' })}${btn('Accredit firm', { i: 'seal-check', act: 'accDecide', arg: a.id + '|Accredited', disabled: missing > 0, test: 'acc-approve-' + a.firm })}</div></div>`;
}

/* ---------- Drop B areas (designed and scoped, built next) ---------- */

