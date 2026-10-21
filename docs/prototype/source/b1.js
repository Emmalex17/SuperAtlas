/* ================= B1 · Programmes and engagements ================= */
const progOf = id => S.programmes.find(p => p.id === id) || S.programmes[0];
const casesOf = pid => S.cases.filter(c => c.prog === pid);
const caseOf = id => S.cases.find(c => c.id === id);
const regOfProg = p => S.regs.find(r => r.id === p.reg) || S.regs[0];
const fmtD = d => d ? fmtDate(d) : '—';
const caseQs = c => qsetQs(progOf(c.prog).qset);
function caseProgress(c) { const qs = caseQs(c); if (!qs.length) return 0; const n = qs.filter(q => c.answers[q.id] && c.answers[q.id].status === 'answered').length; return Math.round(n / qs.length * 100); }
const LATE_STAGES = ['Submitted', 'Assessing', 'In preview', 'Signed off', 'Report submitted', 'In review', 'Returned', 'Approved', 'Scheduled', 'Held back', 'Published'];
const isSubmitted = c => LATE_STAGES.includes(c.stage);
function progStats(p) { const cs = casesOf(p.id); const done = cs.filter(isSubmitted).length; return { n: cs.length, done, pct: cs.length ? Math.round(done / cs.length * 100) : 0 }; }
const PROG_ST = ['Draft', 'Scheduled', 'Open', 'In review', 'Closed'];
const progBar = (pct, label) => `<div class="pbar"><div class="bar"><i style="width:${pct}%"></i></div><span class="cap tnum">${label != null ? label : pct + '%'}</span></div>`;
function progActivity(p, who, what) { p.activity.unshift(['19 Oct 2026', who, what]); }
const accredited = () => Object.values(S.firms).filter(f => f.status === 'Accredited' || f.status === 'Renewal due');
const conflictOf = (f, orgId) => (f.clients || []).find(c => c.orgId === orgId);

/* calendar sources: later parts add interviews, return due dates and fix deadlines */
const CAL_SOURCES = [() => S.programmes.filter(p => p.status !== 'Draft').flatMap(p => [[p.opens, 'Opens', p.name, 'open', `programmes/view:${p.id}|overview`], [p.closes, 'Due', p.name, 'due', `programmes/view:${p.id}|overview`]])];

/* ---------- Programmes list + calendar ---------- */
screen('programmes', {
  t: 'Programmes', layout: 'app', ws: 'regulator', crumbs: ['Programmes'],
  render() {
    const view = ui('progView', 'list'); const st = ui('progSt', 'All'); const q = ui('progQ', '');
    const ser = S.series.map(sr => ({ sr, cur: currentCycle(sr.id), n: cyclesOf(sr.id).length })).filter(x => x.cur);
    const rows = ser.filter(x => (st === 'All' || x.cur.status === st) && (!q || (x.sr.name + x.cur.name + x.cur.reg).toLowerCase().includes(q.toLowerCase())));
    const cnt = s => ser.filter(x => x.cur.status === s).length;
    return `${pageHead({ title: 'Programmes', sub: 'Assessment programmes and their yearly cycles: which regulation, which organisations, by when, and who assesses them.', actions: `<button class="icon-btn bordered" data-go="settings/scoring" title="Scoring and deadline settings" aria-label="Scoring and deadline settings">${ic('gear-six')}</button>` + btn('New programme', { i: 'plus', act: 'progNew', test: 'prog-new' }) })}
      <div class="card p0"><div class="tbl-tools"><form class="inp-wrap" data-form="progSearch" style="width:280px">${ic('magnifying-glass')}<input class="inp" id="prog-q" placeholder="Search programmes" value="${esc(q)}"></form><span class="grow"></span>
        <div class="seg sm" role="tablist" aria-label="View">${[['list', 'List', 'list-bullets'], ['calendar', 'Calendar', 'calendar-blank']].map(([k, l, i]) => `<button class="${view === k ? 'on' : ''}" data-act="progView" data-arg="${k}" data-test="view-${k}">${ic(i)} ${l}</button>`).join('')}</div></div>
        ${view === 'calendar' ? calendar() : `${fpills([['All', 'All', ser.length, 'pst-All'], ...PROG_ST.map(s => [s, s, cnt(s), 'pst-' + s.replace(/ /g, '-')])], st, 'progSt')}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Current cycle</th><th>Window</th><th class="num">Organisations</th><th>Submitted</th><th>Status</th><th class="act-col"></th></tr></thead><tbody>${rows.map(({ sr, cur: p, n }) => { const s = progStats(p); const reg = regOfProg(p); return `<tr class="click" data-act="${p.status === 'Draft' ? 'progEdit' : 'progOpen'}" data-arg="${p.id}" data-test="prog-${p.id}"><td><div class="row gap8">${tile('calendar-check', '', 'sm')}<div><div class="strong">${esc(sr.name)}</div><div class="cap muted">${esc(reg.ref)} ${esc(p.ver)} · ${esc(sr.freq)} · ${n} cycle${n === 1 ? '' : 's'}</div></div></div></td><td class="small"><b>${esc(p.cycle)}</b><div class="cap muted">${p.firmMode === 'organisation' ? 'organisations choose firms' : esc(S.tenant.short) + ' assigns firms'}</div></td><td class="small">${fmtD(p.opens)} – ${fmtD(p.closes)}</td><td class="num tnum">${p.status === 'Draft' || p.status === 'Scheduled' ? scopeOrgs(p).length : s.n}</td><td>${p.status === 'Draft' || p.status === 'Scheduled' ? '<span class="cap muted">Not open yet</span>' : progBar(s.pct, `${s.done}/${s.n}`)}</td><td>${statusChip(p.status)}</td><td class="act-col">${p.status === 'Draft' ? btn('Continue setup', { v: 'secondary', size: 'sm', act: 'progEdit', arg: p.id }) : ''}</td></tr>`; }).join('') || `<tr><td colspan="7">${empty('calendar-check', 'No programmes match', 'Change the filter, or start a new programme.')}</td></tr>`}</tbody></table></div><div class="tbl-foot">${rows.length} of ${ser.length} programmes</div>`}</div>`;
  }
});
ACT.progSt = (s) => { S.ui.progSt = s; render(); };
ACT.progView = (v) => { S.ui.progView = v; render(); };
ACT.form_progSearch = () => { S.ui.progQ = val('prog-q'); render(); };
ACT.progOpen = (id) => openRoute('programmes/view', id + '|overview');

function calendar() {
  const m = ui('calMonth', '2026-10'); const [y, mo] = m.split('-').map(Number);
  const first = new Date(y, mo - 1, 1); const days = new Date(y, mo, 0).getDate(); const lead = (first.getDay() + 6) % 7;
  const ev = CAL_SOURCES.flatMap(f => f()).filter(e => e[0] && e[0].startsWith(m));
  const label = first.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const cells = []; for (let i = 0; i < lead; i++) cells.push('<div class="cal-d off"></div>');
  for (let d = 1; d <= days; d++) { const ds = `${m}-${String(d).padStart(2, '0')}`; const es = ev.filter(e => e[0] === ds); cells.push(`<div class="cal-d ${ds === '2026-10-19' ? 'today' : ''}"><span class="cal-n">${d}</span>${es.map(e => `<button class="cal-e ${e[3]}" data-act="open" data-arg="${esc(e[4])}" title="${esc(e[1] + ': ' + e[2])}"><b>${esc(e[1])}</b> ${esc(e[2])}</button>`).join('')}</div>`); }
  return `<div class="cal"><div class="row between" style="padding:12px 20px"><div class="row gap8">${btnIc('caret-left', 'calMove', '-1', 'Previous month')}<b class="h4" style="min-width:150px;text-align:center">${label}</b>${btnIc('caret-right', 'calMove', '1', 'Next month')}</div><div class="row gap12 cap muted">${[['open', 'Opens'], ['due', 'Due'], ['iv', 'Interview'], ['ret', 'Return due'], ['fix', 'Fix due']].map(([k, l]) => `<span class="row gap6"><i class="cal-key ${k}"></i>${l}</span>`).join('')}</div></div>
    <div class="cal-g">${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => `<div class="cal-h">${d}</div>`).join('')}${cells.join('')}</div></div>`;
}
ACT.calMove = (d) => { const [y, m] = ui('calMonth', '2026-10').split('-').map(Number); const dt = new Date(y, m - 1 + +d, 1); S.ui.calMonth = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`; render(); };

/* ---------- Create / edit programme (6 steps) ---------- */
const PW_STEPS = ['Basics', 'Scope', 'Question set', 'Scoring and deadlines', 'Settings', 'Review and launch'];
const scopeOrgs = p => Object.values(S.orgs).filter(o => o.status === 'Verified' && p.types.includes(o.type) && !(p.exclude || []).includes(o.id));
function pwInit() { const reg = S.regs.find(r => r.status === 'Published'); S.ui.pw = { step: 0, isNew: true, p: { id: uid('p'), name: '', reg: reg.id, ver: reg.version, status: 'Draft', opens: '2027-01-15', closes: '2027-03-31', types: reg.applies.filter(a => typeOpts().includes(a)).slice(0, 2), desc: '', scheme: S.schemes.find(s => s.def).id, reminders: S.deadlines.reminders, escalate: S.deadlines.escalate, firmMode: 'regulator', preview: true, publisher: 'regulator', by: persona().name, created: '19 Oct 2026', activity: [], exclude: [], qset: makeQSet(reg), edited: 0 } }; }
ACT.progNew = () => { pwInit(); S.ui.psSec = undefined; go('programmes/new'); };
ACT.progEdit = (id) => { const p = progOf(id); S.ui.pw = { step: 0, isNew: false, p: Object.assign({ exclude: [] }, clone(p)) }; S.ui.psSec = undefined; go('programmes/new'); };
screen('programmes/new', {
  t: 'Programme setup', layout: 'app', ws: 'regulator', crumbs: () => [['Programmes', 'programmes'], (S.ui.pw && S.ui.pw.p.name) || 'New programme'],
  render() {
    if (!S.ui.pw) pwInit();
    const w = S.ui.pw, p = w.p, st = w.step; const reg = regOfProg(p);
    let body = '';
    if (st === 0) body = `<div class="grid g2" style="gap:16px">${field('Programme name', inp('pw-name', p.name, { ph: 'e.g. ISR 2027 annual assessment', invalid: w.err }), { err: w.err, for: 'pw-name' })}${field('Regulation', sel('pw-reg', S.regs.filter(r => r.status === 'Published').map(r => [r.id, `${r.ref} ${r.version} · ${r.name}`]), p.reg, { attrs: 'data-change="pwReg"' }), { hint: 'Only published regulations can be used.', for: 'pw-reg' })}${field('Opens', inp('pw-open', p.opens, { type: 'date' }), { for: 'pw-open' })}${field('Due', inp('pw-close', p.closes, { type: 'date' }), { for: 'pw-close' })}</div>${field('Description', ta('pw-desc', p.desc, { attrs: 'rows="2"', ph: 'Shown to organisations and firms' }), { opt: true, for: 'pw-desc' })}`;
    if (st === 1) { const orgs = scopeOrgs(p); const all = Object.values(S.orgs).filter(o => o.status === 'Verified' && p.types.includes(o.type));
      body = `<div class="field"><label>Categories in scope</label><div class="grid g3" style="gap:6px">${typeOpts().map((t, i) => ck('pw-t' + i, `${esc(t)} ${reg.applies.includes(t) ? '' : '<span class="cap muted">· not in this regulation</span>'}`, p.types.includes(t), { attrs: `data-pwt="${esc(t)}" data-act="pwTypes"` })).join('')}</div></div>
        <div class="card flat tight col gap8"><div class="row"><b class="grow">${orgs.length} organisation${orgs.length === 1 ? '' : 's'} in scope</b><span class="cap muted">Verified organisations only. Untick any to leave them out.</span></div>${all.map(o => `<label class="row small" style="gap:10px;padding:6px 0;border-top:1px solid var(--border)"><input type="checkbox" ${p.exclude.includes(o.id) ? '' : 'checked'} data-act="pwOrg" data-arg="${o.id}" style="accent-color:var(--brand-500)">${logo(o, 24)}<span class="grow">${esc(o.name)}</span>${cls(o.type, o.tier)}</label>`).join('') || '<p class="small muted">No verified organisations in these categories yet.</p>'}</div>`; }
    if (st === 2) body = qsetEditor(p);
    if (st === 3) body = `<div class="field"><label>Scoring scheme</label><div class="grid g2" style="gap:8px">${S.schemes.map(s => `<button type="button" class="choice ${p.scheme === s.id ? 'on' : ''}" data-act="pwSet" data-arg="scheme|${s.id}"><span class="radio"></span><span class="grow"><b>${esc(s.name)}</b><br><span class="cap muted">${s.levels.map(l => l[0]).join(' · ')}</span></span>${s.def ? chip('Default', 'brand') : ''}</button>`).join('')}</div></div>
      <div class="grid g2" style="gap:16px">${field('Reminders before the due date (days)', inp('pw-rem', p.reminders), { hint: 'Default from Settings: ' + esc(S.deadlines.reminders), for: 'pw-rem' })}${field('Escalate to the supervisor after', `<div class="row gap8">${inp('pw-esc', p.escalate, { type: 'number', attrs: 'style="width:100px"' })}<span class="muted">days overdue</span></div>`, { for: 'pw-esc' })}</div>`;
    if (st === 4) body = `${setGroup('Who assigns assurance firms?', 'firmMode', p.firmMode, [['regulator', `${S.tenant.short} assigns`, 'You assign firms to organisations, one by one or in bulk. Independence checks block conflicts.'], ['organisation', 'Organisations engage their own', 'Each organisation picks an accredited firm. A firm that is not accredited needs your approval.']])}
      ${setGroup('Outcome preview', 'preview', p.preview ? 'on' : 'off', [['on', 'On', 'Organisations see the firm\'s outcomes before the report is submitted, and can comment. They cannot change outcomes.'], ['off', 'Off', 'Organisations see results only when the report is published.']])}
      ${setGroup('Who publishes reports?', 'publisher', p.publisher, [['regulator', `${S.tenant.short} publishes`, 'You approve, then publish now or on a date.'], ['firm', 'Delegated to the firm', 'The firm may publish reports you have approved. Unapproved reports cannot be published.']])}`;
    if (st === 5) { const qs = qsetQs(p.qset); const sc = S.schemes.find(s => s.id === p.scheme);
      body = `<div class="grid g4" style="gap:12px">${[['buildings', 'Organisations', scopeOrgs(p).length], ['list-numbers', 'Sections', p.qset.sections.filter(s => s.on).length], ['book-open-text', 'Requirements', qsetReqs(p.qset).length], ['question', 'Questions', qs.length]].map(([i, l, n]) => `<div class="card flat tight row">${tile(i, '', 'sm')}<div><div class="cap muted">${l}</div><b class="tnum" style="font:700 22px var(--serif)">${n}</b></div></div>`).join('')}</div>
        ${kv([['Programme', esc(p.name || '—')], ['Regulation', `${esc(reg.ref)} ${esc(p.ver)} · ${esc(reg.name)}`], ['Window', `${fmtD(p.opens)} to ${fmtD(p.closes)}`], ['Categories', esc(p.types.join(', '))], ['Scoring scheme', esc(sc.name)], ['Reminders', esc(p.reminders) + ' days before; escalate after ' + esc(p.escalate) + ' days'], ['Firms', p.firmMode === 'organisation' ? 'Organisations engage their own' : `${esc(S.tenant.short)} assigns`], ['Outcome preview', p.preview ? 'On' : 'Off'], ['Publishing', p.publisher === 'firm' ? 'Delegated to the firm (approved reports only)' : `${esc(S.tenant.short)} publishes`], ['Questions changed for this programme', String(p.edited || 0)]])}
        ${note('Launching locks the question set for this programme. The library stays as it is. Organisations are emailed on the opening date.', 'lock-simple')}`; }
    const future = p.opens > '2026-10-19';
    return `${pageHead({ title: w.isNew ? 'New programme' : 'Edit programme', sub: w.isNew ? 'Set up an assessment cycle in six steps. You can save a draft at any point.' : esc(p.name) })}
      ${stepper(PW_STEPS, st)}
      <form class="card col gap20" data-form="pw" novalidate>${body}
        <div class="row between">${st ? btn('Back', { v: 'outline', i: 'arrow-left', act: 'pwBack' }) : btn('Cancel', { v: 'outline', go: 'programmes' })}<div class="row gap8">${btn('Save draft', { v: 'tertiary', act: 'pwDraft', test: 'pw-draft' })}${st < 5 ? btn('Continue', { type: 'submit', ir: 'arrow-right', test: 'pw-next' }) : btn(future ? 'Schedule programme' : 'Launch now', { type: 'submit', i: future ? 'calendar-check' : 'paper-plane-tilt', test: 'pw-launch' })}</div></div></form>`;
  }
});
function setGroup(label, key, cur, opts) { return `<div class="field"><label>${label}</label><div class="grid g2" style="gap:8px">${opts.map(([v, l, d]) => `<button type="button" class="choice ${cur === v ? 'on' : ''}" data-act="pwSet" data-arg="${key}|${v}" data-test="pw-${key}-${v}"><span class="radio"></span><span class="grow"><b>${l}</b><br><span class="cap muted">${d}</span></span></button>`).join('')}</div></div>`; }
function pwRead() { const w = S.ui.pw; if (!w) return; const p = w.p;
  if ($('#pw-name')) Object.assign(p, { name: val('pw-name'), opens: val('pw-open'), closes: val('pw-close'), desc: val('pw-desc') });
  if ($('#pw-rem')) Object.assign(p, { reminders: val('pw-rem'), escalate: val('pw-esc') });
  if ($('[data-psq]')) psSaveCurrent(); }
ACT.chg_pwReg = (v) => { pwRead(); const p = S.ui.pw.p; const r = S.regs.find(x => x.id === v); p.reg = v; p.ver = r.version; p.qset = makeQSet(r); p.types = r.applies.filter(a => typeOpts().includes(a)).slice(0, 2); p.edited = 0; render(); };
ACT.pwTypes = (_, el) => { setTimeout(() => { const p = S.ui.pw.p; p.types = $$('[data-pwt]').filter(x => x.checked).map(x => x.dataset.pwt); render(); }); };
ACT.pwOrg = (id, el) => { setTimeout(() => { const p = S.ui.pw.p; p.exclude = el.checked ? p.exclude.filter(x => x !== id) : p.exclude.concat(id); render(); }); };
ACT.pwSet = (arg) => { pwRead(); const [k, v] = arg.split('|'); const p = S.ui.pw.p; p[k] = k === 'preview' ? v === 'on' : v; render(); };
ACT.pwBack = () => { pwRead(); S.ui.pw.step--; render(); };
ACT.pwDraft = () => { pwRead(); const p = S.ui.pw.p; if (!p.name) p.name = 'Untitled programme'; saveProg(p); toast('Draft saved'); S.ui.pw = undefined; go('programmes'); };
function saveProg(p) { if (!p.series) { p.series = 's-' + p.id; p.cycle = (p.opens || '2027').slice(0, 4); S.series.push({ id: p.series, name: p.name.replace(/\s*\b20\d\d\b\s*/, ' ').trim(), reg: p.reg, freq: 'Yearly' }); } const i = S.programmes.findIndex(x => x.id === p.id); if (i >= 0) S.programmes[i] = p; else S.programmes.unshift(p); }
ACT.form_pw = () => {
  pwRead(); const w = S.ui.pw, p = w.p; w.err = '';
  if (w.step === 0) { if (!p.name) { w.err = 'Name the programme'; return render(); } if (p.closes <= p.opens) { toast('The due date must be after the opening date', 'bad'); return; } }
  if (w.step === 1 && !scopeOrgs(p).length) { toast('Choose at least one organisation in scope', 'bad'); return; }
  if (w.step === 2 && !qsetQs(p.qset).length) { toast('Keep at least one section with questions', 'bad'); return; }
  if (w.step < 5) { w.step++; render(); window.scrollTo(0, 0); return; }
  /* launch or schedule */
  const future = p.opens > '2026-10-19';
  p.status = future ? 'Scheduled' : 'Open'; p.locked = future ? '' : '19 Oct 2026'; delete p.exclude_;
  if (!future) { scopeOrgs(p).forEach(o => S.cases.push({ id: uid('c'), prog: p.id, org: o.id, firm: '', firmStatus: '', team: [], lead: '', answers: {}, assign: {}, outcomes: {}, findings: [], threads: [], interviews: [], stage: p.firmMode === 'organisation' ? 'Firm to choose' : 'Firm to assign', due: p.closes })); }
  progActivity(p, persona().name, future ? `scheduled the programme to open on ${fmtD(p.opens)}` : `launched the programme to ${scopeOrgs(p).length} organisations`);
  saveProg(p); addAudit(future ? 'Scheduled programme' : 'Launched programme', p.name);
  S.ui.pw = undefined; toast(future ? `Scheduled. Opens ${fmtD(p.opens)}` : `${esc(p.name)} launched`, 'ok', 'paper-plane-tilt'); openRoute('programmes/view', p.id + '|overview');
};

/* question set editor: sections in scope on the left, editable questions on the right (programme copy only) */
function qsetEditor(p) {
  const secs = p.qset.sections; const sid = S.ui.psSec && secs.find(s => s.id === S.ui.psSec) ? S.ui.psSec : secs[0].id; const sec = secs.find(s => s.id === sid);
  return `${alertBox('info', 'This is the programme\'s own copy', 'Edit, add or remove questions for this programme only. The library is not changed. The set locks when the programme launches.', btn('Reset to library', { v: 'tertiary', size: 'sm', act: 'psReset' }))}
    <div class="q-layout" style="padding:0"><div class="q-secs"><div class="overline" style="padding:4px 8px 8px">Sections in scope</div>${secs.map(s => `<div class="q-sec ${s.id === sid ? 'on' : ''}" role="button" tabindex="0" data-act="psSec" data-arg="${s.id}"><input type="checkbox" ${s.on ? 'checked' : ''} data-act="psOn" data-arg="${s.id}" aria-label="Include ${esc(s.name)}" style="accent-color:var(--brand-500)"><span class="grow ${s.on ? '' : 'muted'}">${esc(s.name)}</span>${count(s.reqs.reduce((a, r) => a + r.questions.length, 0))}</div>`).join('')}</div>
    <div class="col gap12">${sec.on ? '' : note('This section is out of scope. Tick it on the left to include it.', 'eye-slash')}${sec.reqs.map((r, ri) => `<div class="card flat tight col gap8" data-psreq="${ri}"><div class="row"><span class="mono ref small" style="color:var(--brand-600);font-weight:600">${esc(r.ref)}</span><b class="grow small">${esc(r.t)}</b>${btn('Suggest with AI', { v: 'tertiary', size: 'sm', i: 'sparkle', act: 'psSuggest', arg: ri, test: 'ps-suggest-' + ri })}${btn('Add question', { v: 'tertiary', size: 'sm', i: 'plus', act: 'psAdd', arg: ri })}</div>${r.questions.map((q, qi) => qEditRow(q, qi, 'data-psq')).join('').replace(/data-psq="(\d+)"/g, (m, qi) => `data-psq="${ri}.${qi}"`) || '<p class="small muted">No questions.</p>'}</div>`).join('')}</div></div>`;
}
function psSaveCurrent() { const p = S.ui.pw.p; const sid = S.ui.psSec || p.qset.sections[0].id; const sec = p.qset.sections.find(s => s.id === sid) || p.qset.sections[0];
  sec.reqs.forEach((r, ri) => { const rows = $$(`[data-psq^="${ri}."]`); if (!rows.length && r.questions.length) return; const before = JSON.stringify(r.questions.map(q => q.q)); r.questions = rows.map((row, qi) => { const o = { id: (r.questions[qi] && r.questions[qi].id) || r.ref + '#n' + uid('') }; row.querySelectorAll('[data-qf]').forEach(el => { o[el.dataset.qf] = el.type === 'checkbox' ? el.checked : el.value.trim(); }); return o; }).filter(q => q.q); if (JSON.stringify(r.questions.map(q => q.q)) !== before) p.edited = (p.edited || 0) + 1; }); }
ACT.psSec = (id) => { pwRead(); S.ui.psSec = id; render(); };
ACT.psOn = (id, el, e) => { e && e.stopPropagation(); setTimeout(() => { pwRead(); const s = S.ui.pw.p.qset.sections.find(x => x.id === id); s.on = el.checked; render(); }); };
ACT.psAdd = (ri) => { pwRead(); const p = S.ui.pw.p; const sec = p.qset.sections.find(s => s.id === (S.ui.psSec || p.qset.sections[0].id)); const r = sec.reqs[+ri]; r.questions.push({ id: r.ref + '#n' + uid(''), q: 'New question', choice: 'yn', comment: true, evidence: false, interview: false }); p.edited = (p.edited || 0) + 1; render(); };
ACT.psQDel = (i, el) => { const row = el.closest('[data-psq]'); if (!row) return; const [ri, qi] = row.dataset.psq.split('.').map(Number); pwRead(); const p = S.ui.pw.p; const sec = p.qset.sections.find(s => s.id === (S.ui.psSec || p.qset.sections[0].id)); sec.reqs[ri].questions.splice(qi, 1); p.edited = (p.edited || 0) + 1; render(); };
ACT.psSuggest = (ri) => { pwRead(); const p = S.ui.pw.p; const sec = p.qset.sections.find(s => s.id === (S.ui.psSec || p.qset.sections[0].id)); const r = sec.reqs[+ri]; openSuggest(r, list => { r.questions = r.questions.concat(list.map(q => Object.assign({ id: r.ref + '#n' + uid('') }, q))); p.edited = (p.edited || 0) + list.length; render(); toast(`${list.length} question${list.length > 1 ? 's' : ''} added to this programme`, 'ok', 'sparkle'); }); };
ACT.psReset = () => { const p = S.ui.pw.p; p.qset = makeQSet(regOfProg(p)); p.edited = 0; render(); toast('Question set reset to the library'); };

/* ---------- Programme page ---------- */
const STAGES_ORDER = ['Firm to assign', 'Firm to choose', 'Firm approval', 'Awaiting firm', 'Answering', 'Submitted', 'Assessing', 'In preview', 'Signed off', 'Report submitted', 'In review', 'Returned', 'Approved', 'Scheduled', 'Held back', 'Published'];
screen('programmes/view', {
  t: 'Programme', layout: 'app', ws: 'regulator', crumbs: () => [['Programmes', 'programmes'], progOf(S.ui.progId).name],
  render() {
    const p = progOf(S.ui.progId); const reg = regOfProg(p); const cs = casesOf(p.id); const tab = ui('progTab', 'overview'); const s = progStats(p);
    const reqN = cs.filter(c => c.stage === 'Firm approval').length;
    let body = '';
    if (tab === 'overview') { const groups = STAGE_GROUPS();
      body = `<div class="stage-row">${groups.map(([l, sts], i) => `<div class="stage-c"><span class="cap muted">${esc(l)}</span><b class="tnum">${cs.filter(c => sts.includes(c.stage)).length}</b>${i < groups.length - 1 ? `<span class="stage-ar">${ic('caret-right')}</span>` : ''}</div>`).join('')}</div>
        <div class="grid side"><div class="col gap16"><div class="card col gap12"><div class="row"><span class="h4 grow">Progress</span><span class="cap muted">${s.done} of ${s.n} submitted</span></div>${progBar(s.pct)}
          <div class="tbl-wrap" style="margin:0 -20px -20px"><table class="tbl"><thead><tr><th>Organisation</th><th>Stage</th><th>Answered</th></tr></thead><tbody>${cs.slice(0, 6).map(c => { const o = S.orgs[c.org]; return `<tr class="click" data-act="progCase" data-arg="${c.id}"><td>${orgCell(o, S.firms[c.firm] ? S.firms[c.firm].name : 'Needs a firm')}</td><td>${statusChip(c.stage)}</td><td>${progBar(caseProgress(c))}</td></tr>`; }).join('') || `<tr><td colspan="3">${empty('buildings', 'No organisations yet', p.status === 'Scheduled' ? 'Organisations are added when the programme opens.' : 'Launch the programme to add organisations.')}</td></tr>`}</tbody></table></div></div></div>
        <div class="col gap16"><div class="card col gap8"><div class="h4">Key dates</div>${kv([['Opens', fmtD(p.opens)], ['Due', fmtD(p.closes)], ['Reminders', esc(p.reminders) + ' days before'], ['Questions locked', esc(p.locked || 'At launch')]])}</div>
          <div class="card col gap8"><div class="h4">Recent activity</div><div class="act-feed">${p.activity.slice(0, 6).map(([d, w, a]) => `<div class="act-i">${av(initials(w), 24)}<div><div class="small"><b>${esc(w)}</b> ${esc(a)}</div><div class="cap muted">${esc(d)}</div></div></div>`).join('') || '<p class="small muted">Nothing yet.</p>'}</div></div></div></div>`; }
    if (tab === 'organisations') { const sel_ = ui('progSel_' + p.id, []);
      body = `<div class="card p0">${p.firmMode === 'regulator' && p.status === 'Open' ? `<div class="tbl-tools"><span class="small ${sel_.length ? 'strong' : 'muted'}">${sel_.length ? sel_.length + ' selected' : 'Select organisations to assign a firm or send a reminder'}</span><span class="grow"></span>${btn('Send reminder', { v: 'outline', size: 'sm', i: 'bell', act: 'progRemind', arg: p.id, disabled: !sel_.length })}${btn('Assign firm', { size: 'sm', i: 'user-plus', act: 'assignFirm', arg: p.id, disabled: !sel_.length, test: 'bulk-assign' })}</div>` : ''}
        <div class="tbl-wrap"><table class="tbl"><thead><tr>${p.firmMode === 'regulator' ? `<th style="width:36px"><input type="checkbox" data-act="progSelAll" data-arg="${p.id}" aria-label="Select all" ${sel_.length && sel_.length === cs.length ? 'checked' : ''}></th>` : ''}<th>Organisation</th><th>Assurance firm</th><th>Stage</th><th>Answered</th><th>Due</th><th class="act-col"></th></tr></thead><tbody>
        ${cs.map(c => { const o = S.orgs[c.org]; const f = S.firms[c.firm]; return `<tr>${p.firmMode === 'regulator' ? `<td><input type="checkbox" data-act="progSel" data-arg="${p.id}|${c.id}" ${sel_.includes(c.id) ? 'checked' : ''} aria-label="Select ${esc(o.name)}" data-test="sel-${c.org}"></td>` : ''}<td>${orgCell(o, catLabel(o.type, o.tier))}</td><td class="small">${f ? `<div class="row gap8">${logo(f, 24)}<div><div>${esc(f.name)}</div><div class="cap muted">${esc(c.firmStatus)}${c.lead ? ' · lead ' + esc(c.lead) : ''}</div></div></div>` : c.reqFirm ? `<div><div>${esc(c.reqFirm.name)}</div><div class="cap" style="color:var(--warn-fg)">Not accredited · approval needed</div></div>` : '<span class="muted">—</span>'}</td><td>${statusChip(c.stage)}</td><td>${progBar(caseProgress(c))}</td><td class="small muted">${fmtD(c.due)}</td><td class="act-col">${c.stage === 'Firm approval' ? btn('Review request', { v: 'secondary', size: 'sm', act: 'firmReq', arg: c.id, test: 'firmreq-' + c.org }) : c.stage === 'Firm to assign' && p.status === 'Open' ? btn('Assign firm', { v: 'tertiary', size: 'sm', act: 'assignOne', arg: c.id }) : ''}</td></tr>`; }).join('') || `<tr><td colspan="7">${empty('buildings', 'No organisations yet', 'They are added when the programme opens.')}</td></tr>`}
        </tbody></table></div></div>`; }
    if (tab === 'firms') { const fs = [...new Set(cs.map(c => c.firm).filter(Boolean))];
      body = `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Firm</th><th class="num">Organisations</th><th class="num">Accepted</th><th>Lead auditors</th></tr></thead><tbody>${fs.map(id => { const f = S.firms[id]; const mine = cs.filter(c => c.firm === id); return `<tr class="click" data-act="open" data-arg="firms/profile:${id}|overview"><td>${orgCell(f, f.types.join(' · '))}</td><td class="num tnum">${mine.length}</td><td class="num tnum">${mine.filter(c => c.firmStatus === 'Accepted').length}</td><td class="small">${esc([...new Set(mine.map(c => c.lead).filter(Boolean))].join(', ') || '—')}</td></tr>`; }).join('') || `<tr><td colspan="4">${empty('briefcase', 'No firms yet', p.firmMode === 'regulator' ? 'Assign firms from the Organisations tab.' : 'Organisations choose their firms.')}</td></tr>`}</tbody></table></div></div>`; }
    if (tab === 'questions') { const sid = S.ui.pvSec && p.qset.sections.find(x => x.id === S.ui.pvSec) ? S.ui.pvSec : p.qset.sections.find(x => x.on).id; const sec = p.qset.sections.find(x => x.id === sid); let n = 0;
      body = `${note(p.locked ? `Locked on ${esc(p.locked)}. Based on ${esc(reg.ref)} ${esc(p.ver)}; ${p.edited || 0} change${p.edited === 1 ? '' : 's'} made for this programme.` : 'Editable until the programme opens. Use Edit programme.', 'lock-simple')}
        <div class="card p0"><div class="q-layout"><div class="q-secs"><div class="overline" style="padding:4px 8px 8px">Sections</div>${p.qset.sections.filter(x => x.on).map(x => `<button class="q-sec ${x.id === sid ? 'on' : ''}" data-act="pvSec" data-arg="${x.id}"><span class="grow">${esc(x.name)}</span>${count(x.reqs.reduce((a, r) => a + r.questions.length, 0))}</button>`).join('')}</div>
          <div class="col gap8">${sec.reqs.map(r => r.questions.map(q => { n++; return `<div class="q-card"><div class="row top"><span class="q-n">${n}</span><div class="grow"><div class="strong">${esc(q.q)}</div><div class="row wrap gap8" style="margin-top:6px">${qParts(q)}<span class="cap mono">${esc(r.ref)}</span></div></div></div></div>`; }).join('')).join('')}</div></div></div>`; }
    if (tab === 'cycles') body = cyclesTab(p);
    if (tab === 'analytics' && typeof progAnalytics === 'function') body = progAnalytics(p);
    if (tab === 'settings') { const sc = S.schemes.find(x => x.id === p.scheme); body = `<div class="card col gap12" style="max-width:760px">${kv([['Regulation', `${esc(reg.ref)} ${esc(p.ver)} · ${esc(reg.name)}`], ['Categories', esc(p.types.join(', '))], ['Scoring scheme', esc(sc.name)], ['Reminders', esc(p.reminders) + ' days before; escalate after ' + esc(p.escalate) + ' days'], ['Firms', p.firmMode === 'organisation' ? 'Organisations engage their own; non-accredited firms need approval' : `${esc(S.tenant.short)} assigns`], ['Outcome preview', p.preview ? 'On: organisations can see and comment, not change' : 'Off'], ['Publishing', p.publisher === 'firm' ? 'Delegated to the firm (approved reports only)' : `${esc(S.tenant.short)} publishes`]])}</div>`; }
    const acts = p.status === 'Draft' || p.status === 'Scheduled' ? btn('Edit programme', { v: 'secondary', i: 'pencil-simple', act: 'progEdit', arg: p.id }) : p.status === 'Open' ? btn('Send reminder to all', { v: 'outline', i: 'bell', act: 'progRemindAll', arg: p.id }) : '';
    const sr = seriesOf(p); const cyc = cyclesOf(p.series);
    const menu = moreMenu('prog-' + p.id, [['arrow-clockwise', 'Run next cycle', 'progNext', p.id], ['export', 'Export cycle results (CSV)', 'savedToast', 'Export started. You will get an email with the CSV file.']]);
    return `<div class="ph-card"><div class="ph-row">${tile('calendar-check', 'brand', 'lg')}<div class="ph-info"><div class="overline">Programme${cyc.length > 1 ? ` · ${cyc.length} cycles` : ''}</div><div class="row wrap gap8"><h1 class="h1">${esc(sr ? sr.name : p.name)}</h1>${statusChip(p.status)}</div><div class="ph-meta"><span class="cyc-pick">${ic('arrows-clockwise')}${cyc.length > 1 ? sel('prog-cycle', cyc.map(c => [c.id, 'Cycle ' + c.cycle]), p.id, { attrs: 'data-change="progCycle" aria-label="Cycle" data-test="prog-cycle"' }) : 'Cycle ' + esc(p.cycle || '')}</span><span>${ic('book-open-text')}${esc(reg.ref)} ${esc(p.ver)}</span><span>${ic('calendar-blank')}${fmtD(p.opens)} – ${fmtD(p.closes)}</span><span>${ic('buildings')}${cs.length || scopeOrgs(p).length} organisations</span></div></div><div class="row wrap gap8">${acts}${menu}</div></div>
      ${tabs([{ id: 'overview', label: 'Overview' }, ...(typeof progAnalytics === 'function' ? [{ id: 'analytics', label: 'Analytics', test: 'tab-analytics' }] : []), { id: 'organisations', label: 'Organisations', count: reqN || undefined }, { id: 'firms', label: 'Firms' }, { id: 'questions', label: 'Questions', count: qsetQs(p.qset).length }, { id: 'cycles', label: 'Cycles', count: cyc.length, test: 'tab-cycles' }, { id: 'settings', label: 'Settings' }], tab, 'progTab')}</div>${body}`;
  }
});
ACT.progTab = (t) => { S.ui.progTab = t; render(); };
ACT.pvSec = (id) => { S.ui.pvSec = id; render(); };
ACT.progCase = (id) => { const c = caseOf(id); S.ui.progTab = 'organisations'; render(); };
ACT.progSel = (arg) => { const [pid, cid] = arg.split('|'); const s = ui('progSel_' + pid, []); const i = s.indexOf(cid); i >= 0 ? s.splice(i, 1) : s.push(cid); render(); };
ACT.progSelAll = (pid) => { const cs = casesOf(pid); const s = ui('progSel_' + pid, []); S.ui['progSel_' + pid] = s.length === cs.length ? [] : cs.map(c => c.id); render(); };
ACT.progRemind = (pid) => { const n = (S.ui['progSel_' + pid] || []).length; S.ui['progSel_' + pid] = []; render(); toast(`Reminder sent to ${n} organisation${n === 1 ? '' : 's'}`, 'ok', 'bell'); };
ACT.progRemindAll = (pid) => { const p = progOf(pid); const n = casesOf(pid).filter(c => !isSubmitted(c)).length; progActivity(p, persona().name, `sent a reminder to ${n} organisations`); render(); toast(`Reminder sent to ${n} organisations that have not submitted`, 'ok', 'bell'); };
ACT.assignOne = (cid) => { const c = caseOf(cid); S.ui['progSel_' + c.prog] = [cid]; ACT.assignFirm(c.prog); };
ACT.assignFirm = (pid) => {
  const ids = S.ui['progSel_' + pid] || []; const fs = accredited(); const fid = S.ui.assignPick && S.firms[S.ui.assignPick] ? S.ui.assignPick : fs[0].id; const f = S.firms[fid];
  const rows = ids.map(caseOf).map(c => { const o = S.orgs[c.org]; const cf = conflictOf(f, c.org); return `<div class="row small" style="padding:8px 0;border-top:1px solid var(--border)">${logo(o, 24)}<span class="grow">${esc(o.name)}</span>${cf ? chip(`Blocked: advised since ${cf.since}`, 'bad', 'prohibit') : c.firm ? chip('Replaces ' + S.firms[c.firm].name, 'warn') : chip('OK', 'ok', 'check')}</div>`; }).join('');
  const ok = ids.filter(cid => !conflictOf(f, caseOf(cid).org)).length;
  openDialog(`${dlgHead('Assign an assurance firm', `${ids.length} organisation${ids.length === 1 ? '' : 's'} selected. The firm is asked to accept and name its team.`, 'user-plus')}
    <div class="col gap12">${field('Firm', sel('af-firm', fs.map(x => [x.id, `${x.name} · ${x.types.join(', ')}`]), fid, { attrs: 'data-change="afFirm" data-test="af-firm"' }), { for: 'af-firm' })}
    <div class="card flat tight"><div class="overline" style="margin-bottom:4px">Independence check</div>${rows}</div>
    ${ok < ids.length ? alertBox('warn', `${ids.length - ok} cannot be assigned to ${esc(f.name)}`, `The firm advised ${ids.length - ok === 1 ? 'this organisation' : 'these organisations'} within the last ${esc(S.firmRules.conflictMonths)} months. Pick another firm for ${ids.length - ok === 1 ? 'it' : 'them'}.`) : ''}
    <div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn(`Assign to ${ok}`, { act: 'assignGo', arg: pid, disabled: !ok, test: 'af-go' })}</div></div>`, { wide: true });
};
ACT.chg_afFirm = (v) => { S.ui.assignPick = v; const pid = S.ui.progId; ACT.assignFirm(pid); };
ACT.assignGo = (pid) => {
  const p = progOf(pid); const f = S.firms[val('af-firm')]; let n = 0;
  (S.ui['progSel_' + pid] || []).map(caseOf).forEach(c => { if (conflictOf(f, c.org)) return; c.firm = f.id; c.firmStatus = 'Assigned'; c.stage = 'Awaiting firm'; c.lead = ''; n++; });
  progActivity(p, persona().name, `assigned ${f.name} to ${n} organisation${n === 1 ? '' : 's'}`); addAudit('Assigned firm', `${f.name} · ${n} organisations · ${p.name}`);
  notify({ ws: 'firm', i: 'handshake', tone: 'info', title: `${S.tenant.short} assigned you ${n} engagement${n === 1 ? '' : 's'} (${p.name})`, go: 'firm/engagements', kind: 'Approvals' });
  S.ui['progSel_' + pid] = []; S.ui.assignPick = undefined; closeDialog(); render(); toast(`${esc(f.name)} assigned to ${n} organisation${n === 1 ? '' : 's'}. Waiting for the firm to accept.`, 'ok', 'user-plus');
};
ACT.firmReq = (cid) => {
  const c = caseOf(cid); const o = S.orgs[c.org]; const r = c.reqFirm;
  openDrawer(`<div class="row top"><div class="grow"><div class="overline">Firm request · ${esc(progOf(c.prog).name)}</div><h2 class="h3" style="margin-top:4px">${esc(o.name)} wants to use ${esc(r.name)}</h2></div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div>
    ${alertBox('warn', 'This firm is not accredited', `${esc(r.name)} is not on ${esc(S.tenant.short)}'s accredited list. Approving lets it assess ${esc(o.name)} for this programme only.`)}
    ${kv([['Requested by', `${esc(r.by)} · ${esc(r.when)}`], ['Firm contact', esc(r.contact)], ['Credentials', esc(r.creds)], ['Reason', esc(r.reason)]])}
    ${fileRow(r.file, 'Firm profile · PDF', { i: 'file-text' })}
    ${field('Note to the organisation', ta('fr-note', '', { ph: 'Required if you decline', attrs: 'rows="2"' }), { for: 'fr-note' })}
    <div class="row end">${btn('Decline', { v: 'danger-soft', act: 'firmReqGo', arg: cid + '|no' })}${btn('Approve for this programme', { i: 'seal-check', act: 'firmReqGo', arg: cid + '|yes', test: 'firmreq-approve' })}</div>`);
};
ACT.firmReqGo = (arg) => {
  const [cid, d] = arg.split('|'); const c = caseOf(cid); const o = S.orgs[c.org]; const p = progOf(c.prog); const note_ = val('fr-note');
  if (d === 'no' && !note_) { toast('Add a note so the organisation knows why', 'bad'); return; }
  if (d === 'yes') { const id = 'x-' + c.reqFirm.name.toLowerCase().replace(/[^a-z]+/g, '-'); if (!S.firms[id]) S.firms[id] = { id, name: c.reqFirm.name, ini: initials(c.reqFirm.name), col: '#5E6A71', web: c.reqFirm.contact.split('@')[1], types: ['Data protection (DPCO)'], status: 'Approved for one programme', assigned: 0, renews: '—', since: '—', city: '—', people: [{ name: 'Lead assessor', ini: 'LA', role: 'Lead auditor', title: '', cred: c.reqFirm.creds, expires: '—', status: 'Active' }], clients: [], oneOff: true }; c.firm = id; c.firmStatus = 'Approved'; c.stage = 'Answering'; c.lead = 'Lead assessor'; }
  else { c.firmStatus = 'Declined'; c.stage = 'Firm to choose'; c.declineNote = note_; c.reqFirm = null; }
  progActivity(p, persona().name, `${d === 'yes' ? 'approved' : 'declined'} ${o.name}'s firm request`); addAudit(d === 'yes' ? 'Approved firm request' : 'Declined firm request', `${o.name} · ${p.name}`);
  notify({ ws: 'organisation', i: 'handshake', tone: d === 'yes' ? 'ok' : 'bad', title: `${S.tenant.short} ${d === 'yes' ? 'approved' : 'declined'} your firm request (${p.name})`, go: 'org/obligations', kind: 'Updates' });
  closeDrawer(); render(); toast(d === 'yes' ? 'Approved. The firm can start.' : 'Declined. The organisation will choose another firm.', d === 'yes' ? 'ok' : 'info');
};

/* ---------- Organisation: Obligations ---------- */
const myCases = () => S.cases.filter(c => c.org === S.orgId && progOf(c.prog).status !== 'Draft');
screen('org/obligations', {
  t: 'Obligations', layout: 'app', ws: 'organisation', crumbs: ['Obligations'],
  render() {
    const cs = myCases(); const f = ui('oblF', 'Active');
    const active = c => !['Published'].includes(c.stage) && progOf(c.prog).status !== 'Closed';
    const rows = cs.filter(c => f === 'All' || (f === 'Active' ? active(c) : !active(c)));
    const soon = cs.filter(c => active(c) && c.due && c.due <= '2026-11-30' && !isSubmitted(c)).length;
    return `${pageHead({ title: 'Obligations', sub: `Programmes ${esc(S.tenant.short)} has opened for ${esc(myOrg().name)}. Each entity in a group answers on its own.` })}
      <div class="card p0">${fpills([['Active', 'Active', cs.filter(active).length, 'obl-active'], ['Completed', 'Completed', cs.filter(c => !active(c)).length, 'obl-completed'], ['All', 'All', cs.length, 'obl-all']], f, 'oblF')}
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Assurance firm</th><th>Stage</th><th>Answered</th><th>Due</th><th class="act-col"></th></tr></thead><tbody>${rows.map(c => { const p = progOf(c.prog); const fm = S.firms[c.firm]; return `<tr><td><div class="strong">${esc(p.name)}</div><div class="cap muted">${esc(regOfProg(p).ref)} ${esc(p.ver)} · ${qsetQs(p.qset).length} questions</div></td><td class="small">${fm ? `${esc(fm.name)}<div class="cap muted">${esc(c.firmStatus)}</div>` : c.reqFirm ? `${esc(c.reqFirm.name)}<div class="cap" style="color:var(--warn-fg)">Waiting for ${esc(S.tenant.short)} approval</div>` : p.firmMode === 'organisation' ? `<span class="cap" style="color:var(--warn-fg)">You choose${c.declineNote ? ' (last request declined)' : ''}</span>` : `<span class="muted">${esc(S.tenant.short)} assigns</span>`}</td><td>${statusChip(c.stage)}</td><td>${c.stage === 'Published' ? `<b class="serif">${c.score}</b> <span class="cap muted">score</span>` : progBar(caseProgress(c))}</td><td class="small muted">${fmtD(c.due)}</td><td class="act-col">${obAction(c)}</td></tr>`; }).join('') || `<tr><td colspan="6">${empty('list-checks', 'Nothing here', 'Programmes appear when ' + esc(S.tenant.short) + ' opens one that applies to you.')}</td></tr>`}</tbody></table></div></div>`;
  }
});
function obAction(c) {
  if (c.stage === 'Firm to choose') return btn('Choose a firm', { v: 'secondary', size: 'sm', act: 'engageFirm', arg: c.id, test: 'engage-' + c.prog });
  if (['Answering', 'Awaiting firm', 'Firm to assign', 'Firm approval'].includes(c.stage) && SCREENS['org/answer']) return btn(Object.keys(c.answers).length ? 'Continue' : 'Start answering', { v: Object.keys(c.answers).length ? 'secondary' : 'primary', size: 'sm', act: 'openCase', arg: c.id, test: 'answer-' + c.prog });
  if (isSubmitted(c) && c.stage !== 'Published' && SCREENS['org/assessment']) { const need = (c.threads || []).filter(t => t.status === 'Open').length + (c.interviews || []).filter(i => i.status === 'Times proposed').length; return btn(need ? `Respond (${need})` : 'Open', { v: need ? 'primary' : 'tertiary', size: 'sm', act: 'open', arg: `org/assessment:${c.id}|${need ? ((c.threads || []).some(t => t.status === 'Open') ? 'requests' : 'interviews') : (c.previewAt ? 'preview' : 'requests')}`, test: 'oa-' + c.prog }); }
  if (c.stage === 'Published' && SCREENS['org/report']) return btn('View report', { v: 'tertiary', size: 'sm', act: 'openReport', arg: c.id });
  if (isSubmitted(c) && SCREENS['org/answer']) return btn('View', { v: 'tertiary', size: 'sm', act: 'openCase', arg: c.id });
  return '';
}
ACT.oblF = (f) => { S.ui.oblF = f; render(); };
ACT.engageFirm = (cid) => {
  const c = caseOf(cid); const p = progOf(c.prog); const mode = ui('engMode', 'list'); const fs = accredited();
  openDialog(`${dlgHead('Choose an assurance firm', `${esc(p.name)}. The firm is asked to accept.`, 'handshake')}
    ${c.declineNote ? alertBox('bad', `${esc(S.tenant.short)} declined your last request`, esc(c.declineNote)) : ''}
    <div class="seg" style="align-self:flex-start"><button class="${mode === 'list' ? 'on' : ''}" data-act="engMode" data-arg="list|${cid}">Accredited firms</button><button class="${mode === 'other' ? 'on' : ''}" data-act="engMode" data-arg="other|${cid}" data-test="eng-other">Another firm</button></div>
    ${mode === 'list' ? `<div class="col gap8">${fs.map(f => { const cf = conflictOf(f, c.org); return `<label class="choice" style="${cf ? 'opacity:.55' : ''}"><input type="radio" name="eng-f" value="${f.id}" class="sr" ${cf ? 'disabled' : ''}><span class="radio"></span>${logo(f, 32)}<span class="grow"><b>${esc(f.name)}</b><br><span class="cap muted">${cf ? 'Not available: advised you since ' + esc(cf.since) : esc(f.types.join(' · '))}</span></span></label>`; }).join('')}</div><div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Engage firm', { act: 'engageGo', arg: cid, test: 'eng-go' })}</div>`
      : `<div class="col gap12">${note(`A firm that is not accredited needs ${esc(S.tenant.short)}'s approval before it can start.`, 'info')}<div class="grid g2" style="gap:12px">${field('Firm name', inp('eo-name', ''), { for: 'eo-name' })}${field('Contact email', inp('eo-email', '', { type: 'email' }), { for: 'eo-email' })}</div>${field('Assessor credentials', inp('eo-cred', '', { ph: 'e.g. CIPP/E (2)' }), { for: 'eo-cred' })}${field('Why this firm?', ta('eo-why', '', { attrs: 'rows="2"' }), { for: 'eo-why' })}<button type="button" class="drop" data-act="savedToast" data-arg="Firm profile attached">${tile('upload-simple', '', 'sm')}<b class="small">Attach the firm's profile</b></button><div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Send for approval', { act: 'engageOther', arg: cid, test: 'eo-go' })}</div></div>`}`, { wide: true });
};
ACT.engMode = (arg) => { const [m, cid] = arg.split('|'); S.ui.engMode = m; ACT.engageFirm(cid); };
ACT.engageGo = (cid) => { const v = ($$('input[name=eng-f]').find(x => x.checked) || {}).value; if (!v) { toast('Choose a firm', 'bad'); return; } const c = caseOf(cid); c.firm = v; c.firmStatus = 'Requested by you'; c.stage = 'Awaiting firm'; c.declineNote = ''; const p = progOf(c.prog); progActivity(p, persona().name, `engaged ${S.firms[v].name} for ${S.orgs[c.org].name}`); addAudit('Engaged firm', `${S.firms[v].name} · ${p.name}`); notify({ ws: 'firm', i: 'handshake', tone: 'info', title: `${S.orgs[c.org].name} asked you to assess it (${p.name})`, go: 'firm/engagements', kind: 'Approvals' }); S.ui.engMode = undefined; closeDialog(); render(); toast(`Request sent to ${esc(S.firms[v].name)}`, 'ok', 'handshake'); };
ACT.engageOther = (cid) => { const n = val('eo-name'), e = val('eo-email'), w = val('eo-why'); if (!n || !isEmail(e) || !w) { toast('Add the firm name, a valid email and your reason', 'bad'); return; } const c = caseOf(cid); const p = progOf(c.prog); c.reqFirm = { name: n, contact: e, reason: w, creds: val('eo-cred') || '—', file: n + ' profile.pdf', when: '19 Oct 2026', by: persona().name }; c.firmStatus = 'Requested'; c.stage = 'Firm approval'; c.declineNote = ''; progActivity(p, persona().name, `asked to use ${n} (not accredited) for ${S.orgs[c.org].name}`); addAudit('Requested non-accredited firm', `${n} · ${p.name}`); notify({ ws: 'regulator', i: 'handshake', tone: 'warn', title: `${S.orgs[c.org].name} asked to use a firm that is not accredited (${p.name})`, go: 'programmes/view', arg: p.id + '|organisations', kind: 'Approvals' }); S.ui.engMode = undefined; closeDialog(); render(); toast(`Sent to ${esc(S.tenant.short)} for approval`, 'ok', 'paper-plane-tilt'); };

/* ---------- Firm: Engagements ---------- */
const myEngs = () => S.cases.filter(c => c.firm === S.firmId);
const ENG_GROUP = c => ['Assigned', 'Requested by you'].includes(c.firmStatus) ? 'Requests' : c.stage === 'Published' ? 'Completed' : ['Report submitted', 'In review', 'Approved', 'Scheduled', 'Held back', 'Returned'].includes(c.stage) && c.stage !== 'Returned' ? 'Submitted' : 'Active';
screen('firm/engagements', {
  t: 'Engagements', layout: 'app', ws: 'firm', crumbs: ['Engagements'],
  render() {
    const es = myEngs(); const g = ui('engG', 'All');
    const rows = es.filter(c => g === 'All' || ENG_GROUP(c) === g);
    return `${pageHead({ title: 'Engagements', sub: 'Organisations you assess, from request to published report.' })}
      <div class="card p0">${fpills([['All', 'All', es.length, 'eg-All'], ...['Requests', 'Active', 'Submitted', 'Completed'].map(x => [x, x, es.filter(c => ENG_GROUP(c) === x).length, 'eg-' + x, x === 'Requests' ? 'warn' : ''])], g, 'engG')}<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Programme</th><th>Team</th><th>Stage</th><th>Due</th><th class="act-col"></th></tr></thead><tbody>${rows.map(c => { const o = S.orgs[c.org]; const p = progOf(c.prog); return `<tr><td>${orgCell(o, catLabel(o.type, o.tier))}</td><td class="small"><div>${esc(p.name)}</div><div class="cap muted">${c.firmStatus === 'Requested by you' ? 'Requested by the organisation' : c.firmStatus === 'Assigned' ? 'Assigned by ' + esc(S.tenant.short) : esc(c.firmStatus)}</div></td><td class="small">${c.lead ? `${esc(c.lead)}${c.team.length ? `<div class="cap muted">+ ${esc(c.team.join(', '))}</div>` : ''}` : '<span class="muted">Lead not named yet</span>'}</td><td>${['Assigned', 'Requested by you'].includes(c.firmStatus) ? statusChip('Requested') : statusChip(c.stage)}</td><td class="small muted">${fmtD(c.due)}</td><td class="act-col">${['Assigned', 'Requested by you'].includes(c.firmStatus) ? btn('Decline', { v: 'tertiary', size: 'sm', act: 'engDecline', arg: c.id }) + btn('Accept', { v: 'secondary', size: 'sm', act: 'engAccept', arg: c.id, test: 'eng-accept-' + c.org }) : SCREENS['firm/assess'] && ['Submitted', 'Assessing', 'In preview', 'Signed off', 'Returned'].includes(c.stage) ? btn(c.stage === 'Submitted' ? 'Start assessment' : 'Open', { v: c.stage === 'Submitted' ? 'primary' : 'secondary', size: 'sm', act: 'openAssess', arg: c.id, test: 'assess-' + c.org }) : c.stage === 'Approved' && p.publisher === 'firm' ? btn('Publish', { size: 'sm', i: 'paper-plane-tilt', act: 'firmPublish', arg: c.id, test: 'fpub-' + c.org }) : ''}</td></tr>`; }).join('') || `<tr><td colspan="6">${empty('kanban', 'No engagements here', 'Requests appear when ' + esc(S.tenant.short) + ' assigns you, or an organisation engages you.')}</td></tr>`}</tbody></table></div></div>`;
  }
});
ACT.engG = (x) => { S.ui.engG = x; render(); };
ACT.engAccept = (cid) => {
  const c = caseOf(cid); const f = myFirm(); const leads = f.people.filter(p => p.status === 'Active');
  openDialog(`${dlgHead('Accept engagement', `${esc(S.orgs[c.org].name)} · ${esc(progOf(c.prog).name)}`, 'handshake')}
    <div class="col gap12">${note('By accepting you confirm your firm is independent of this organisation.', 'seal-check')}
    ${field('Lead auditor', sel('ea-lead', leads.filter(p => p.role === 'Lead auditor').concat(leads.filter(p => p.role !== 'Lead auditor')).map(p => [p.name, `${p.name} · ${p.role}`]), (leads.find(p => p.role === 'Lead auditor') || leads[0]).name), { for: 'ea-lead' })}
    <div class="field"><label>Team</label><div class="col gap6">${leads.map(p => ck('ea-t-' + initials(p.name), `${esc(p.name)} <span class="muted">· ${esc(p.cred)}</span>`, p.role === 'Assessor', { attrs: `data-team="${esc(p.name)}"` })).join('')}</div></div>
    <div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Accept and name team', { act: 'engAcceptGo', arg: cid, test: 'ea-go' })}</div></div>`);
};
ACT.engAcceptGo = (cid) => { const c = caseOf(cid); c.lead = val('ea-lead'); c.team = $$('[data-team]').filter(x => x.checked).map(x => x.dataset.team).filter(n => n !== c.lead); c.firmStatus = 'Accepted'; if (['Awaiting firm', 'Firm to assign', 'Firm to choose'].includes(c.stage)) c.stage = 'Answering'; const p = progOf(c.prog); progActivity(p, myFirm().name, `accepted the engagement for ${S.orgs[c.org].name}`); addAudit('Accepted engagement', `${S.orgs[c.org].name} · ${p.name}`); notify({ ws: 'organisation', i: 'handshake', tone: 'ok', title: `${myFirm().name} accepted your engagement (${p.name})`, go: 'org/obligations', kind: 'Updates' }); closeDialog(); render(); toast('Engagement accepted. Team named.', 'ok', 'handshake'); };
ACT.engDecline = (cid) => openDialog(`${dlgHead('Decline this engagement?', 'Tell them why, for example a conflict of interest or capacity.', 'x-circle', 'bad')}<div class="col gap12">${field('Reason', ta('ed-r', ''), { for: 'ed-r' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Decline', { v: 'danger', act: 'engDeclineGo', arg: cid })}</div></div>`);
ACT.engDeclineGo = (cid) => { if (!val('ed-r')) { toast('Give a reason', 'bad'); return; } const c = caseOf(cid); const p = progOf(c.prog); c.firm = ''; c.firmStatus = 'Declined'; c.stage = p.firmMode === 'organisation' ? 'Firm to choose' : 'Firm to assign'; c.declineNote = myFirm().name + ' declined: ' + val('ed-r'); progActivity(p, myFirm().name, `declined ${S.orgs[c.org].name}`); closeDialog(); render(); toast('Engagement declined'); };

