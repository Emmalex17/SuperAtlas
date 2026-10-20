/* ================= Organisation and assurance firm workspaces ================= */

function wsHero(ent, line) {
  const p = persona();
  return `<section class="ws-hero">${logo(ent, 48)}<div class="grow"><div class="overline" style="color:var(--brand-200)">${esc(ent.name)}</div><h1 class="serif">${dashGreeting()}, ${esc(p.first || p.name)}</h1><p>${line}</p></div></section>`;
}
function setupCard(steps, done, go_) {
  const n = steps.filter(s => done[s[0]]).length; if (n === steps.length) return '';
  const next = steps.find(s => !done[s[0]]);
  return `<div class="card col gap12 setup-card"><div class="row"><div class="grow"><div class="h4">Finish setting up</div><div class="cap muted">${n} of ${steps.length} done · next: ${esc(next[1])}</div></div><div style="width:160px">${bar(n / steps.length * 100)}</div>${btn('Continue setup', { size: 'sm', go: go_, ir: 'arrow-right', test: 'continue-setup' })}</div>
    <div class="setup-chips">${steps.map(([k, l]) => `<span class="${done[k] ? 'done' : ''}">${ic(done[k] ? 'check-circle' : 'circle-dashed')}${esc(l)}</span>`).join('')}</div></div>`;
}

/* ---------- Organisation ---------- */
screen('org/dashboard', {
  t: 'Dashboard', layout: 'app', ws: 'organisation', crumbs: ['Dashboard'],
  render() {
    const o = myOrg(); o.onboard = o.onboard || { profile: true, logo: true, officers: true, people: true, group: true };
    const pend = S.classReqs.find(r => r.org === o.id && r.status === 'Pending');
    const people = (o.officers || []).length + (o.colleagues || []).length;
    if (typeof orgDashBody === 'function') return orgDashBody(o, pend);
    return `${wsHero(o, `Supervised by ${esc(S.tenant.short)}.`)}${obligationsCard()}`;
  }
});

screen('org/team', {
  t: 'Team', layout: 'app', ws: 'organisation', crumbs: ['Team'],
  render() {
    const o = myOrg(); const rows = [...(o.officers || []).map(p => ({ name: p.name, email: p.email, role: 'Organisation admin', title: p.role, status: 'Active' })), ...(o.colleagues || []).map(c => ({ name: c.name || c.email, email: c.email, role: c.role, title: '', status: c.status || 'Invited' }))];
    return `${pageHead({ title: 'Team', sub: 'People in ' + esc(o.name) + ' who use SuperAtlas, and what each can do.', actions: btn('Invite colleague', { i: 'user-plus', act: 'orgInvite', test: 'org-invite' }) })}
      <div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Name</th><th>Role</th><th>Status</th></tr></thead><tbody>${rows.map(r => `<tr><td><div class="row">${av(initials(r.name))}<div><div class="strong">${esc(r.name)}</div><div class="cap muted">${esc(r.email || '')}${r.title ? ' · ' + esc(r.title) : ''}</div></div></div></td><td>${chip(r.role, r.role === 'Organisation admin' ? 'brand' : 'neu')}</td><td>${statusChip(r.status === 'Active' ? 'Active' : 'Invited')}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="grid g4" style="gap:12px">${[['Organisation admin', 'Manages profile, team and settings'], ['Compliance officer', 'Approves and submits answers and returns'], ['Contributor', 'Answers requirements assigned to them'], ['Executive viewer', 'Read-only view of status and results']].map(([n, d]) => `<div class="card tight col gap4"><b class="small">${n}</b><span class="cap muted">${d}</span></div>`).join('')}</div>`;
  }
});
ACT.orgInvite = () => openDialog(`${dlgHead('Invite a colleague', 'They get an email to set a password and MFA.', 'user-plus')}<form class="col gap16" data-form="orgInvite" novalidate>${field('Work email', inp('oi-email', '', { type: 'email', ph: 'name@' + (myOrg().web || 'organisation.com') }), { for: 'oi-email' })}${field('Role', sel('oi-role', ['Contributor', 'Compliance officer', 'Executive viewer', 'Organisation admin'], 'Contributor'), { for: 'oi-role' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Send invitation', { type: 'submit' })}</div></form>`);
ACT.form_orgInvite = () => { const e = val('oi-email'); if (!isEmail(e)) { toast('Enter a valid email', 'bad'); return; } const o = myOrg(); (o.colleagues = o.colleagues || []).push({ email: e, name: e.split('@')[0].replace(/\./g, ' ').replace(/\b\w/g, c => c.toUpperCase()), role: val('oi-role'), status: 'Invited' }); closeDialog(); addAudit('Invited colleague', e); render(); toast(`Invitation sent to ${esc(e)}`, 'ok', 'envelope-simple'); };

screen('org/profile', {
  t: 'Profile', layout: 'app', ws: 'organisation', crumbs: ['Profile'],
  render() {
    const o = myOrg(); const t = ui('myOrgTab', 'details'); const reqs = S.classReqs.filter(r => r.org === o.id); const pend = reqs.find(r => r.status === 'Pending');
    let body = '';
    if (t === 'details') body = `<form class="grid side" data-form="myOrg"><div class="card col gap16"><div class="h4">Organisation details</div><div class="grid g2" style="gap:14px">${field('Legal name', inp('mo-name', o.name, { ro: true }), { hint: 'Set by ' + esc(S.tenant.short) + '. Ask them to change it.', for: 'mo-name' })}${field('Registration number', inp('mo-rc', o.rc || ''), { for: 'mo-rc' })}${field('Website', inp('mo-web', o.web || ''), { for: 'mo-web' })}${field('Head office', inp('mo-hq', o.hq || ''), { for: 'mo-hq' })}${field('Compliance contact email', inp('mo-em', o.email || '', { type: 'email' }), { for: 'mo-em' })}</div><div class="row end">${btn('Save changes', { type: 'submit' })}</div></div>
      <div class="col gap16"><div class="card col gap12"><div class="h4">Logo</div><div class="grid g2" style="gap:10px">${['On light', 'On dark'].map((l, i) => `<div class="col" style="align-items:center;gap:6px;padding:14px;border-radius:12px;background:${i ? 'var(--brand-800)' : 'var(--canvas)'}">${logo(o, 40)}<span class="cap" style="color:${i ? 'var(--brand-200)' : 'var(--text-2)'}">${l}</span></div>`).join('')}</div>${btn(o.logoUp ? 'Replace logo' : 'Upload logo', { v: 'tertiary', i: 'upload-simple', act: 'obLogo' })}</div>
        <div class="card col gap12"><div class="row"><span class="h4 grow">Key officers</span><a href="#org/welcome" data-act="obGo" data-arg="officers" class="small strong" data-go="org/welcome" data-ui="obStep=officers">Manage</a></div>${(o.officers || []).map(p => `<div class="row">${av(p.ini || initials(p.name))}<div><div class="strong small">${esc(p.name)}</div><div class="cap muted">${esc(p.role)}</div></div></div>`).join('')}</div></div></form>`;
    if (t === 'classification') { const st = ui('ccForm', { file: '', err: {} });
      body = `<div class="grid side"><div class="col gap16">${pend ? `<div class="card col gap16"><div class="row">${tile('hourglass', 'info')}<div class="grow"><div class="h4">${esc(pend.ref)} · with ${esc(S.tenant.short)}</div><div class="cap muted">Submitted ${esc(pend.date)} by ${esc(pend.by)}</div></div>${statusChip('In review')}</div>
          <div class="grid g2" style="gap:12px"><div class="card flat tight col gap6"><span class="overline">From</span>${cls(pend.from.type, pend.from.tier)}</div><div class="card flat tight col gap6" style="border-color:var(--brand-400)"><span class="overline" style="color:var(--brand-500)">To</span>${cls(pend.to.type, pend.to.tier)}</div></div>
          <p class="small muted">${esc(pend.reason)}</p>${fileRow(pend.file, 'Attached licence', { i: 'file-text' })}<div>${btn('Withdraw request', { v: 'danger-soft', size: 'sm', act: 'ccWithdraw', arg: pend.id })}</div></div>`
        : `<form class="card col gap16" data-form="cc" novalidate><div><div class="h4">Request a classification change</div><p class="small muted" style="margin-top:2px">Your category decides which requirements and returns apply to you. ${esc(S.tenant.short)} must approve any change.</p></div><div data-cat-host>${catSelects('cc', (S.ui.cat_cc || {}).sec || o.sector, (S.ui.cat_cc || {}).type || o.type, (S.ui.cat_cc || {}).tier || '')}</div>
          ${field('Why are you asking for this change?', ta('cc-reason', st.reason || '', { ph: 'e.g. Our licence was upgraded to international authorisation in September.', attrs: st.err.reason ? 'style="border-color:var(--bad-icon)"' : '' }), { err: st.err.reason, for: 'cc-reason' })}
          ${st.file ? fileRow(st.file, '640 KB · uploaded just now', { i: 'file-text', tone: 'ok', actions: btn('Remove', { v: 'tertiary', size: 'sm', act: 'ccFile', arg: '' }) }) : `<button type="button" class="drop" data-act="ccFile" data-arg="New licence.pdf" data-test="cc-file">${tile('upload-simple', '', 'sm')}<b>Attach the new licence</b><span class="cap muted">Required · PDF up to 10 MB</span></button>`}${st.err.file ? `<div class="field"><div class="err">${ic('warning-circle')}${st.err.file}</div></div>` : ''}
          ${note('If approved, new requirements apply from the next cycle. Work you have already submitted is not affected.')}<div class="row end">${btn('Submit request', { type: 'submit', test: 'cc-submit' })}</div></form>`}</div>
        <div class="col gap16"><div class="card col gap12"><div class="row"><span class="h4 grow">Current category</span><span class="row gap6 cap muted">${ic('lock-simple')}Set by ${esc(S.tenant.short)}</span></div>${kv([['Sector', esc(o.sector)], ['Institution type', esc(o.type)], ['Authorisation', esc(o.tier || '—')]])}</div>
          <div class="card col gap8"><div class="h4">History</div>${reqs.filter(r => r.status !== 'Pending').map(r => `<div class="small"><b>${esc(r.ref)} · ${esc(r.status)}</b><div class="cap muted">${esc(catLabel(r.to.type, r.to.tier))} · ${esc(r.decided || '')}</div></div>`).join('') || '<p class="small muted">No earlier requests.</p>'}</div></div></div>`; }
    if (t === 'licences') body = `<div class="card col gap12">${fileRow(`${o.type} licence — ${o.tier || 'current'}.pdf`, `Issued Jan 2024 · expires Dec 2028 · verified by ${esc(S.tenant.short)}`, { i: 'certificate', tone: 'ok' })}${fileRow('Certificate of incorporation.pdf', 'Uploaded at registration', { i: 'file-text' })}<div>${btn('Upload a licence', { v: 'secondary', i: 'upload-simple', act: 'fakeUpload', arg: 'Licence uploaded. ' + S.tenant.short + ' will check it.' })}</div></div>`;
    if (t === 'group') body = `<div class="card col gap12">${alertBox('info', 'Each entity answers on its own', 'Linking a holding company or subsidiary is for reference. Every entity keeps its own requirements, answers, scores and findings.')}${(o.links || []).map(l => `<div class="file">${tile('buildings', '', 'sm')}<div class="grow"><div class="strong">${esc(l.name)}</div><div class="cap muted">${esc(l.rel)}</div></div>${chip('Linked', 'ok')}</div>`).join('') || '<p class="small muted">No group links.</p>'}<div>${btn('Add a link', { v: 'secondary', size: 'sm', i: 'plus', go: 'org/welcome', attrs: 'data-ui="obStep=group"' })}</div></div>`;
    if (t === 'settings') body = `<div class="card col gap16" style="max-width:640px">${[['Require MFA for all colleagues', true], ['Email digest of due items to compliance officers', true], ['Allow contributors to upload to the evidence library', false]].map(([l, on], i) => `<div class="row between"><span>${l}</span>${sw('os' + i, on)}</div>`).join('')}<div class="row end">${btn('Save settings', { act: 'savedToast', arg: 'Settings saved' })}</div></div>`;
    return `${profileHeader(o, 'org', '', tabs([{ id: 'details', label: 'Details' }, { id: 'classification', label: 'Classification', count: pend ? 1 : undefined }, { id: 'licences', label: 'Licences' }, { id: 'group', label: 'Group links' }, { id: 'settings', label: 'Settings' }], t, 'myOrgTab'))}${body}`;
  }
});
ACT.myOrgTab = (t) => { S.ui.myOrgTab = t; render(); };
ACT.form_myOrg = () => { const o = myOrg(); Object.assign(o, { rc: val('mo-rc'), web: val('mo-web'), hq: val('mo-hq'), email: val('mo-em') }); addAudit('Updated profile', o.name); render(); toast('Profile saved'); };
ACT.ccFile = (f) => { const st = ui('ccForm'); st.reason = val('cc-reason'); if ($('#cc-type')) { const c = readCat('cc'); S.ui.cat_cc = { sec: c.sector, type: c.type, tier: c.tier }; } st.file = f; st.err = {}; render(); };
ACT.ccWithdraw = (id) => { S.classReqs = S.classReqs.filter(x => x.id !== id); S.ui.ccForm = undefined; addAudit('Withdrew classification request', myOrg().name); render(); toast('Request withdrawn'); };
ACT.form_cc = () => {
  const st = ui('ccForm'); const c = readCat('cc'); st.reason = val('cc-reason'); st.err = {};
  const o = myOrg();
  if (c.type === o.type && c.tier === o.tier) { toast('Choose a category different from your current one', 'bad'); return; }
  if (tiersOf(c.type).length && !c.tier) { S.ui.cat_cc = { sec: c.sector, type: c.type }; toast('Choose a tier', 'bad'); return render(); }
  if (!st.reason) st.err.reason = 'Explain why you are asking for the change';
  if (!st.file) st.err.file = 'Attach the licence that supports the change';
  if (Object.keys(st.err).length) return render();
  const id = uid('cc'); const ref = 'CC-0' + (219 + S.classReqs.length);
  S.classReqs.unshift({ id, ref, org: o.id, by: `${persona().name}, ${persona().role}`, date: '19 Oct 2026', from: { sector: o.sector, type: o.type, tier: o.tier }, to: { sector: c.sector, type: c.type, tier: c.tier }, reason: st.reason, file: st.file, status: 'Pending', impact: `${o.name} moves to ${catLabel(c.type, c.tier)}. Requirements for that category apply from the next cycle. Open submissions keep their current requirements.` });
  notify({ ws: 'regulator', i: 'git-diff', tone: 'warn', title: `${o.name} requested a classification change`, go: 'organisations/profile', arg: o.id + '|classification', kind: 'Approvals' });
  addAudit('Requested classification change', `${o.name} · ${ref}`);
  S.ui.ccForm = undefined; S.ui.cat_cc = undefined; render(); toast('Request sent to ' + esc(S.tenant.short), 'ok', 'git-diff');
};

/* ---------- Assurance firm ---------- */
screen('firm/dashboard', {
  t: 'Dashboard', layout: 'app', ws: 'firm', crumbs: ['Dashboard'],
  render() {
    const f = myFirm(); f.onboard = f.onboard || { profile: true, logo: true, people: true, clients: true };
    const accs = S.firmAccreditations[f.id] || []; const app = S.accApps.find(a => a.firm === f.id && (a.status === 'In review' || a.status === 'Info requested'));
    const lead = leadOf(f);
    return `${myHero({ ent: f, line: f.status === 'Accredited' || f.status === 'Renewal due' ? `Accredited by ${esc(S.tenant.short)} for ${esc(f.types.join(' and '))}.` : `Your accreditation application is ${esc((app || {}).status || f.status).toLowerCase()} with ${esc(S.tenant.short)}.`, actions: heroBtn('Engagements', 'kanban', { go: 'firm/engagements' }) + heroBtn('Performance', 'chart-line-up', { act: 'open', arg: 'firm/profile:performance' }) })}
      ${setupCard(FIRM_STEPS, f.onboard, 'firm/welcome')}
      ${app && app.status === 'Info requested' ? alertBox('warn', `${esc(S.tenant.short)} asked for more information`, esc(app.infoMsg || ''), btn('Open application', { size: 'sm', act: 'open', arg: 'firm/profile:accreditations' })) : ''}
      ${typeof firmDashBody === 'function' ? firmDashBody(f) : engagementsCard()}`;
  }
});
screen('firm/team', {
  t: 'Team', layout: 'app', ws: 'firm', crumbs: ['Team'],
  render() {
    const f = myFirm();
    return `${pageHead({ title: 'Team', sub: 'Your lead auditor and assessors. ' + esc(S.tenant.short) + ' checks credentials when you apply for accreditation.', actions: btn('Add person', { i: 'user-plus', act: 'firmPerson', test: 'firm-person' }) })}
      <div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Credential expiry</th><th>Status</th><th></th></tr></thead><tbody>${f.people.map((p, i) => `<tr><td><div class="row">${av(p.ini || initials(p.name))}<div><div class="strong">${esc(p.name)}</div><div class="cap muted">${esc(p.title || '')}</div></div></div></td><td>${chip(p.role, p.role === 'Lead auditor' ? 'brand' : 'neu')}</td><td class="small">${esc(p.cred)}</td><td class="small muted">${esc(p.expires)}</td><td>${statusChip(p.status)}</td><td class="act-col">${p.name === persona().name ? '<span class="cap muted">You</span>' : btnIc('trash', 'fbAsDel', i, 'Remove')}</td></tr>`).join('')}</tbody></table></div></div>`;
  }
});
ACT.firmPerson = () => openDialog(`${dlgHead('Add a person', 'They get an email to join your firm on SuperAtlas.', 'user-plus')}<form class="col gap16" data-form="firmPerson" novalidate><div class="grid g2" style="gap:12px">${field('Full name', inp('fp-name', ''), { for: 'fp-name' })}${field('Email', inp('fp-email', '', { type: 'email' }), { for: 'fp-email' })}${field('Role', sel('fp-role', ['Assessor', 'Lead auditor', 'Firm admin'], 'Assessor'), { for: 'fp-role' })}${field('Job title', inp('fp-title', ''), { opt: true, for: 'fp-title' })}${field('Credentials', inp('fp-cred', '', { ph: 'e.g. CISA, CIPP/E' }), { for: 'fp-cred' })}${field('Credential expiry', inp('fp-exp', '', { ph: 'e.g. Mar 2028' }), { for: 'fp-exp' })}</div><div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Add person', { type: 'submit' })}</div></form>`, { wide: true });
ACT.form_firmPerson = () => { const n = val('fp-name'); if (!n || !isEmail(val('fp-email'))) { toast('Add a name and a valid email', 'bad'); return; } myFirm().people.push({ name: n, ini: initials(n), role: val('fp-role'), title: val('fp-title'), cred: val('fp-cred') || '—', expires: val('fp-exp') || '—', status: 'Active' }); closeDialog(); addAudit('Added person', n); render(); toast(`${esc(n)} added`); };

screen('firm/profile', {
  t: 'Profile', layout: 'app', ws: 'firm', crumbs: ['Profile'],
  render() {
    const f = myFirm(); const t = ui('myFirmTab', 'details'); const accs = S.firmAccreditations[f.id] || []; const apps = S.accApps.filter(a => a.firm === f.id);
    let body = '';
    if (t === 'details') body = `<form class="card col gap16" data-form="myFirm" style="max-width:760px"><div class="grid g2" style="gap:14px">${field('Firm name', inp('mf-name', f.name, { ro: true }), { for: 'mf-name' })}${field('Website', inp('mf-web', f.web), { for: 'mf-web' })}${field('Offices', inp('mf-city', f.city), { for: 'mf-city' })}${field('Contact email', inp('mf-em', f.email || '', { type: 'email' }), { for: 'mf-em' })}</div><div class="row end">${btn('Save changes', { type: 'submit' })}</div></form>`;
    if (t === 'performance') body = firmPerf(f, 'firm');
    if (t === 'accreditations') body = `<div class="card col gap12"><div class="row"><span class="h4 grow">Accreditations</span>${btn('Apply for accreditation', { size: 'sm', i: 'certificate', go: 'firm/apply', test: 'go-apply' })}</div>${accs.map(a => `<div class="file">${tile('certificate', a.status === 'Active' ? 'ok' : 'warn', 'sm')}<div class="grow"><div class="strong">${esc(a.type)}</div><div class="cap muted">${esc(a.ref)} · ${esc(a.from)} to ${esc(a.to)}</div></div>${statusChip(a.status)}</div>`).join('')}
        ${apps.filter(a => a.status !== 'Accredited').map(a => `<div class="file">${tile('hourglass', a.status === 'Info requested' ? 'warn' : 'info', 'sm')}<div class="grow"><div class="strong">${esc(a.type)} application</div><div class="cap muted">Submitted ${esc(a.submitted)}${a.status === 'In review' ? ' · decision due ' + esc(a.due) : ''}</div>${a.infoMsg && a.status === 'Info requested' ? `<div class="cap" style="margin-top:4px">${esc(S.tenant.short)}: ${esc(a.infoMsg)}</div>` : ''}</div>${statusChip(a.status)}</div>`).join('')}${!accs.length && !apps.length ? empty('certificate', 'No accreditations yet', 'Apply by firm type. ' + esc(S.tenant.short) + ' reviews your documents and assessors.') : ''}</div>`;
    if (t === 'people') body = `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Person</th><th>Role</th><th>Credentials</th><th>Expires</th></tr></thead><tbody>${f.people.map(p => `<tr><td><div class="strong">${esc(p.name)}</div><div class="cap muted">${esc(p.title || '')}</div></td><td>${chip(p.role, p.role === 'Lead auditor' ? 'brand' : 'neu')}</td><td class="small">${esc(p.cred)}</td><td class="small muted">${esc(p.expires)}</td></tr>`).join('')}</tbody></table></div></div>`;
    if (t === 'clients') body = `<div class="card col gap12">${alertBox('info', 'Why we ask', `You cannot be assigned to assess an organisation you advised in the last ${esc(S.firmRules.conflictMonths)} months. Declaring clients lets SuperAtlas block conflicts automatically.`)}${f.clients.map((c, i) => `<div class="file">${logo(c, 32)}<div class="grow"><div class="strong">${esc(c.org)}</div><div class="cap muted">${esc(c.service)} · since ${esc(c.since)}</div></div>${btnIc('trash', 'fbClDel', i, 'Remove')}</div>`).join('') || '<p class="small muted">No advisory clients declared.</p>'}
        <form class="card flat tight col gap12" data-form="fbClient" novalidate><b class="small">Declare a client</b><div class="grid g3" style="gap:12px">${inp('cl-org', '', { ph: 'Organisation' })}${inp('cl-svc', '', { ph: 'Service provided' })}${inp('cl-since', '', { ph: 'Since, e.g. Feb 2026' })}</div><div class="row end">${btn('Declare client', { type: 'submit', v: 'secondary', i: 'plus' })}</div></form></div>`;
    return `${profileHeader(f, 'firm', '', tabs([{ id: 'details', label: 'Details' }, ...(typeof firmPerf === 'function' ? [{ id: 'performance', label: 'Performance', test: 'my-perf' }] : []), { id: 'accreditations', label: 'Accreditations' }, { id: 'people', label: 'Assessors', count: f.people.length }, { id: 'clients', label: 'Advisory clients', count: f.clients.length }], t, 'myFirmTab'))}${body}`;
  }
});
ACT.myFirmTab = (t) => { S.ui.myFirmTab = t; render(); };
ACT.form_myFirm = () => { const f = myFirm(); Object.assign(f, { web: val('mf-web'), city: val('mf-city'), email: val('mf-em') }); addAudit('Updated firm profile', f.name); render(); toast('Profile saved'); };

function obligationsCard() {
  const cs = myCases().filter(c => c.stage !== 'Published');
  return `<div class="card p0"><div class="tbl-tools"><span class="h4 grow">Your obligations</span><a href="#org/obligations" data-go="org/obligations" class="small strong">View all</a></div>${cs.length ? `<div class="list">${cs.map(c => { const p = progOf(c.prog); return `<div class="list-row" style="cursor:default">${tile('list-checks', '', 'sm')}<span class="grow"><span class="strong" style="display:block">${esc(p.name)}</span><span class="cap muted">Due ${fmtD(c.due)} · ${S.firms[c.firm] ? esc(S.firms[c.firm].name) : 'no firm yet'}</span></span>${statusChip(c.stage)}<span style="width:140px">${progBar(caseProgress(c))}</span>${obAction(c)}</div>`; }).join('')}</div>` : `<div style="padding:20px">${empty('list-checks', 'Nothing due', 'Programmes appear here when ' + esc(S.tenant.short) + ' opens one that applies to you.')}</div>`}</div>`;
}
function engagementsCard() {
  const es = myEngs(); const req = es.filter(c => ENG_GROUP(c) === 'Requests').length;
  return `<div class="card col gap12"><div class="row"><span class="h4 grow">Engagements</span><a href="#firm/engagements" data-go="firm/engagements" class="small strong">Open engagements</a></div>${req ? alertBox('info', `${req} engagement request${req > 1 ? 's' : ''} waiting`, 'Accept and name your team, or decline with a reason.', btn('Review', { size: 'sm', go: 'firm/engagements', attrs: 'data-ui="engG=Requests"' })) : ''}<div class="grid g4" style="gap:10px">${['Requests', 'Active', 'Submitted', 'Completed'].map(x => `<div class="mini-card">${ic({ Requests: 'tray', Active: 'magnifying-glass', Submitted: 'paper-plane-tilt', Completed: 'seal-check' }[x])}<div><b class="small">${x}</b><div class="h3 tnum">${es.filter(c => ENG_GROUP(c) === x).length}</div></div></div>`).join('')}</div></div>`;
}

