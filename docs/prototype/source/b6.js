/* ================= B6 · Findings and remediation ================= */
/* Findings come from published reports. Lifecycle: Open → In progress (plan) → Fix submitted → Verified fixed (firm) → Closed (regulator).
   OFI findings are "Noted" with no deadline. An extension, once approved, moves the deadline. */
const LIVE_FD = ['Open', 'In progress', 'Fix submitted', 'Verified fixed'];
function allFindings() { return S.cases.filter(c => c.stage === 'Published').flatMap(c => (c.findings || []).map(f => { f.status = f.status || (fcOf(f.cls).days ? 'Open' : 'Noted'); f.updates = f.updates || []; f.proof = f.proof || []; return { f, c }; })); }
const fdFind = id => allFindings().find(x => x.f.id === id) || allFindings()[0];
const effDue = f => f.ext && f.ext.status === 'Approved' ? f.ext.date : f.due;
const fdOverdue = f => ['Open', 'In progress'].includes(f.status) && effDue(f) && effDue(f) < TODAY;
const fixesToClose = () => allFindings().filter(x => x.f.status === 'Verified fixed');
function fdChip(f) {
  const m = { Open: ['warn', 'flag', 'Plan needed'], 'In progress': ['info', 'wrench', 'In progress'], 'Fix submitted': ['info', 'paper-plane-tilt', 'Fix submitted'], 'Verified fixed': ['ok', 'seal-check', 'Verified fixed'], Closed: ['neu', 'lock-simple', 'Closed'], Noted: ['neu', 'note', 'Noted'] };
  const [t, i, l] = m[f.status] || ['neu', null, f.status];
  return chip(l, t, i) + (fdOverdue(f) ? ' ' + chip('Overdue', 'bad', 'warning') : '') + (f.ext && f.ext.status === 'Requested' ? ' ' + chip('More time asked', 'warn', 'clock-clockwise') : '');
}
const clsChip = code => `<span class="chip ${fcOf(code).tone}" title="${esc(fcOf(code).name)}">${esc(code)}</span>`;
function fdDue(f) {
  if (!effDue(f)) return '<span class="cap muted">No deadline</span>';
  const n = daysBetween(TODAY, effDue(f)); const live = ['Open', 'In progress'].includes(f.status);
  return `${fmtD(effDue(f))}${f.ext && f.ext.status === 'Approved' ? ` <span class="cap muted">(extended)</span>` : ''}${live ? `<div class="cap" style="color:${n < 0 ? 'var(--bad-fg)' : n <= 14 ? 'var(--warn-fg)' : 'var(--text-3)'}">${n < 0 ? -n + ' days overdue' : n === 0 ? 'Due today' : n + ' days left'}</div>` : ''}`;
}
function fdLog(f, what, who) { f.updates.push(['19 Oct 2026', who || persona().name, what]); }
CAL_SOURCES.push(() => allFindings().filter(x => ['Open', 'In progress'].includes(x.f.status) && effDue(x.f)).map(({ f, c }) => [effDue(f), 'Fix due', S.orgs[c.org].name.split(' ')[0] + ': ' + f.title, 'fix', 'findings/view:' + f.id]));
OPEN_HOOKS['findings'] = a => { S.ui.fdF = a || ''; };
['findings/view', 'org/finding', 'firm/finding'].forEach(r => { OPEN_HOOKS[r] = a => { S.ui.fdId = a; S.ui.fdPlan = undefined; S.ui.fdDraft = undefined; }; });

/* ---------- shared table ---------- */
function fdTable(rows, o = {}) {
  const route = o.route || 'findings/view';
  return `<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Finding</th>${o.noOrg ? '' : '<th>Organisation</th>'}<th>From</th><th>Fix by</th><th>Status</th><th class="act-col"></th></tr></thead><tbody>${rows.map(({ f, c }) => { const o_ = S.orgs[c.org]; const fm = S.firms[c.firm]; return `<tr class="click" data-act="open" data-arg="${route}:${f.id}" data-test="fd-${f.id}"><td class="wrap" style="min-width:300px;max-width:420px"><div class="row gap8 top">${clsChip(f.cls)}<div><div class="strong small">${esc(f.title)}</div><div class="cap mono muted">${esc(f.ref)}</div></div></div></td>${o.noOrg ? '' : `<td>${orgCell(o_, catLabel(o_.type, o_.tier))}</td>`}<td class="small">${esc(progOf(c.prog).name)}<div class="cap muted">${esc(fm ? fm.name : '')}</div></td><td class="small">${fdDue(f)}</td><td><div class="row wrap gap6">${fdChip(f)}</div></td><td class="act-col">${o.act ? o.act(f, c) : ''}</td></tr>`; }).join('') || `<tr><td colspan="6">${empty('flag', o.emptyT || 'No findings here', o.emptyB || 'Change the filter to see more.')}</td></tr>`}</tbody></table></div>`;
}

/* ---------- Regulator: findings register ---------- */
const FD_CARDS = [['plan', 'Plan needed', 'flag', x => x.f.status === 'Open'], ['progress', 'In progress', 'wrench', x => x.f.status === 'In progress'], ['verify', 'With firm to verify', 'seal-question', x => x.f.status === 'Fix submitted'], ['close', 'Ready to close', 'seal-check', x => x.f.status === 'Verified fixed'], ['overdue', 'Overdue', 'warning', x => fdOverdue(x.f)], ['ext', 'More time asked', 'clock-clockwise', x => x.f.ext && x.f.ext.status === 'Requested']];
screen('findings', {
  t: 'Findings', layout: 'app', ws: 'regulator', crumbs: ['Findings'],
  render() {
    const view = ui('fdView', 'register');
    if (view === 'insights') return `${pageHead({ title: 'Findings', sub: 'Every finding from published reports, and how each fix is going. Firms verify fixes; you close them.' })}${tabs([{ id: 'register', label: 'Register' }, { id: 'insights', label: 'Insights', test: 'fd-insights' }], view, 'fdView')}${fdInsights()}`;
    const fk = ui('fdF', ''); const cls = ui('fdCls', 'all'); const q = ui('fdQ', ''); const shut = ui('fdClosed', false);
    const all = allFindings();
    const rows = all.filter(x => (!fk || FD_CARDS.find(c => c[0] === fk)[3](x)) && (cls === 'all' || x.f.cls === cls) && (shut || fk || !['Closed', 'Noted'].includes(x.f.status)) && (!q || (S.orgs[x.c.org].name + ' ' + x.f.title).toLowerCase().includes(q.toLowerCase())))
      .sort((a, b) => (fdOverdue(b.f) - fdOverdue(a.f)) || ['MaNC', 'MiNC', 'OBS', 'OFI'].indexOf(a.f.cls) - ['MaNC', 'MiNC', 'OBS', 'OFI'].indexOf(b.f.cls) || String(effDue(a.f)).localeCompare(String(effDue(b.f))));
    return `${pageHead({ title: 'Findings', sub: 'Every finding from published reports, and how each fix is going. Firms verify fixes; you close them.', actions: `<button class="icon-btn bordered" data-go="settings/findings" title="Finding classes" aria-label="Finding classes">${ic('gear-six')}</button>` + btn('Export', { v: 'secondary', i: 'export', act: 'savedToast', arg: 'Export started. You will get an email with the CSV file.' }) })}${tabs([{ id: 'register', label: 'Register' }, { id: 'insights', label: 'Insights', test: 'fd-insights' }], 'register', 'fdView')}
      <div class="card p0"><div class="tbl-tools wrap"><form class="inp-wrap" data-form="fdSearch" style="width:260px">${ic('magnifying-glass')}<input class="inp" id="fd-q" placeholder="Search findings or organisations" value="${esc(q)}"></form>${sel('fd-cls', [['all', 'All classes'], ...S.findingClasses.map(c => [c.code, `${c.code} · ${c.name}`])], cls, { attrs: 'data-change="fdCls" style="width:auto" aria-label="Class"' })}
        <span class="grow"></span>${fk ? '' : ck('fd-closed', 'Show closed and noted', shut, { attrs: 'data-act="fdClosedT"' })}</div>
        ${fpills([['', 'All open', all.filter(x => !['Closed', 'Noted'].includes(x.f.status)).length, 'fc-all'], ...FD_CARDS.map(([k, l, i, fn]) => [k, l, all.filter(fn).length, 'fc-' + k, k === 'overdue' ? 'bad' : k === 'close' || k === 'ext' ? 'warn' : ''])], fk, 'fdF')}
        ${fdTable(rows, { act: (f) => f.status === 'Verified fixed' ? btn('Close', { v: 'secondary', size: 'sm', act: 'open', arg: 'findings/view:' + f.id }) : f.ext && f.ext.status === 'Requested' ? btn('Decide', { v: 'secondary', size: 'sm', act: 'open', arg: 'findings/view:' + f.id }) : fdOverdue(f) ? btn('Remind', { v: 'tertiary', size: 'sm', i: 'bell-ringing', act: 'fdRemind', arg: f.id }) : '' })}<div class="tbl-foot">${rows.length} finding${rows.length === 1 ? '' : 's'}</div></div>`;
  }
});
ACT.fdF = k => { S.ui.fdF = k; render(); };
ACT.chg_fdCls = v => { S.ui.fdCls = v; render(); };
ACT.form_fdSearch = () => { S.ui.fdQ = val('fd-q'); render(); };
ACT.fdClosedT = () => { S.ui.fdClosed = !S.ui.fdClosed; render(); };
ACT.fdRemind = id => { const { f, c } = fdFind(id); fdLog(f, 'Reminder sent'); notify({ ws: 'organisation', org: c.org, i: 'bell-ringing', tone: 'warn', title: `${S.tenant.short} reminded you: “${f.title}” is ${fdOverdue(f) ? 'overdue' : 'due ' + fmtD(effDue(f))}`, go: 'org/finding', arg: f.id, kind: 'Reminders' }); addAudit('Sent finding reminder', `${S.orgs[c.org].name} · ${f.title}`); render(); toast(`Reminder sent to ${esc(S.orgs[c.org].name)}`, 'ok', 'bell-ringing'); };

/* ---------- detail (one layout, actions depend on who is looking) ---------- */
function fdDetail(ws) {
  const { f, c } = fdFind(S.ui.fdId); S.ui.fdId = f.id; const o = S.orgs[c.org]; const fm = S.firms[c.firm]; const fc = fcOf(f.cls); const p = progOf(c.prog);
  const canPlan = ws === 'organisation' && ['Open', 'In progress'].includes(f.status);
  const editing = canPlan && (f.status === 'Open' || S.ui.fdPlan === f.id);
  const plan = S.ui.fdDraft && S.ui.fdDraft.id === f.id ? S.ui.fdDraft : f.plan || { action: '', owner: '', target: effDue(f) || '', steps: [['', false]] };
  const people = orgPeople(o);
  const planCard = editing ? `<div class="card col gap16" data-test="plan-form"><div class="row"><span class="h4 grow">Action plan</span>${f.plan ? btn('Cancel', { v: 'tertiary', size: 'sm', act: 'fdPlanEdit', arg: '' }) : ''}</div>
      ${field('What you will do', ta('pl-action', plan.action, { attrs: 'rows="3" data-test="pl-action"', ph: 'Describe the fix in a sentence or two' }), { for: 'pl-action' })}
      <div class="grid g2" style="gap:14px">${field('Owner', sel('pl-owner', [['', 'Choose a person'], ...people.map(n => [n, n])], plan.owner, { attrs: 'data-test="pl-owner"' }), { for: 'pl-owner' })}${field('Target date', inp('pl-target', plan.target, { type: 'date', attrs: `max="${effDue(f) || ''}"` }), { for: 'pl-target', hint: effDue(f) ? 'On or before ' + fmtD(effDue(f)) : '' })}</div>
      ${field('Steps', `<div class="col gap8" id="pl-steps">${plan.steps.map((s, i) => `<div class="row gap8">${inp('pl-s-' + i, s[0], { ph: 'Step ' + (i + 1), attrs: `data-test="pl-s-${i}"` })}${plan.steps.length > 1 ? btnIc('x', 'fdStepDel', i, 'Remove step') : ''}</div>`).join('')}<div>${btn('Add step', { v: 'tertiary', size: 'sm', i: 'plus', act: 'fdStepAdd' })}</div></div>`, { opt: true })}
      <div class="row end">${btn(f.plan ? 'Save plan' : 'Submit plan', { i: 'paper-plane-tilt', act: 'fdPlanSave', test: 'pl-submit' })}</div></div>`
    : f.plan ? `<div class="card col gap12"><div class="row"><span class="h4 grow">Action plan</span>${canPlan ? btn('Edit plan', { v: 'tertiary', size: 'sm', i: 'pencil-simple', act: 'fdPlanEdit', arg: f.id }) : ''}</div><p class="small">${esc(f.plan.action)}</p>${kv([['Owner', esc(f.plan.owner || '—')], ['Target date', f.plan.target ? fmtD(f.plan.target) : '—']])}
      ${f.plan.steps.filter(s => s[0]).length ? `<div class="col gap6">${f.plan.steps.filter(s => s[0]).map((s, i) => canPlan ? `<label class="check"><input type="checkbox" ${s[1] ? 'checked' : ''} data-act="fdStepTick" data-arg="${i}"><span class="small">${esc(s[0])}</span></label>` : `<div class="row gap8 small">${ic(s[1] ? 'check-circle' : 'circle-dashed', s[1] ? 'ok-t' : '')}<span>${esc(s[0])}</span></div>`).join('')}</div>` : ''}</div>`
    : f.status === 'Noted' ? '' : `<div class="card">${empty('clipboard-text', 'No plan yet', `${esc(o.name)} has not planned this fix yet.`)}</div>`;
  const canProof = ws === 'organisation' && f.status === 'In progress';
  const proofCard = f.status === 'Noted' || (!f.proof.length && !canProof) ? '' : `<div class="card col gap12"><div class="row"><span class="h4 grow">Proof of the fix</span>${count(f.proof.length)}</div>${f.proof.map((x, i) => fileRow(x[0], esc(x[1]), { i: 'file-text', actions: canProof ? btnIc('trash', 'fdProofDel', i, 'Remove file') : `<button class="icon-btn" title="Preview" aria-label="Preview">${ic('eye')}</button>` })).join('')}
      ${canProof ? `<button class="drop" data-act="fdProofAdd" data-test="pf-add">${tile('upload-simple', '', 'sm')}<b class="small">Add a file</b><span class="cap muted">Screenshots, exports, minutes or policies that show the fix works</span></button>` : ''}</div>`;
  const verCard = f.verify ? `<div class="card col gap8"><div class="row"><span class="h4 grow">Verification</span>${chip(f.verify.ok ? 'Verified fixed' : 'Not fixed', f.verify.ok ? 'ok' : 'bad')}</div><p class="small">${esc(f.verify.note)}</p><div class="cap muted">${esc(f.verify.by)} · ${esc(fm ? fm.name : '')} · ${esc(f.verify.when)}</div></div>` : '';
  /* decision panel */
  let side = '';
  if (ws === 'organisation') {
    side = f.status === 'Open' ? note('Plan the fix: say what you will do, who owns it and by when. Then work on it and send proof.', 'info')
      : f.status === 'In progress' ? `<p class="small muted">When the fix is done, add proof and submit it. ${esc(fm ? fm.name : 'Your assessor')} checks it.</p>${btn('Submit fix', { block: true, i: 'paper-plane-tilt', act: 'fdSubmitFix', test: 'fix-submit', disabled: !f.proof.length })}${f.proof.length ? '' : '<p class="cap muted">Add at least one file of proof first.</p>'}`
      : f.status === 'Fix submitted' ? alertBox('info', 'With your assessor', `${esc(fm ? fm.name : 'The firm')} is checking the fix.`)
      : f.status === 'Verified fixed' ? alertBox('ok', 'Verified fixed', `Waiting for ${esc(S.tenant.short)} to close it.`)
      : f.status === 'Closed' ? alertBox('ok', 'Closed', `${esc(f.closed.by)} · ${esc(f.closed.when)}`) : note('An opportunity for improvement. No fix is required.', 'info');
    if (['Open', 'In progress'].includes(f.status) && effDue(f)) side += f.ext && f.ext.status === 'Requested' ? alertBox('warn', 'More time asked', `Until ${fmtD(f.ext.date)}. Waiting for ${esc(S.tenant.short)}.`) : btn('Ask for more time', { v: 'tertiary', block: true, i: 'clock-clockwise', act: 'fdExtAsk', test: 'ext-ask' });
  } else if (ws === 'firm') {
    side = f.status === 'Fix submitted' ? `<p class="small muted">Check the proof. If the fix works, verify it. If not, say what is missing; the organisation keeps working on it.</p>${field('Note', ta('vf-note', '', { attrs: 'rows="3" data-test="vf-note"', ph: 'What you checked' }), { for: 'vf-note' })}${btn('Verified fixed', { block: true, i: 'seal-check', act: 'fdVerify', arg: 'ok', test: 'vf-ok' })}${btn('Not fixed', { v: 'secondary', block: true, i: 'x-circle', act: 'fdVerify', arg: 'no', test: 'vf-no' })}`
      : f.status === 'Verified fixed' ? alertBox('ok', 'You verified this fix', `Waiting for ${esc(S.tenant.short)} to close it.`) : f.status === 'Closed' ? alertBox('ok', 'Closed', `${esc(f.closed.by)} · ${esc(f.closed.when)}`) : note(`${esc(o.name)} is still working on this fix.`, 'hourglass');
  } else {
    side = f.status === 'Verified fixed' ? `<p class="small muted">${esc(fm ? fm.name : 'The firm')} verified the fix. Close the finding, or reopen it if you are not satisfied.</p>${field('Note', ta('cl-note', '', { attrs: 'rows="2"', ph: 'Required if you reopen' }), { for: 'cl-note' })}${btn('Close finding', { block: true, i: 'lock-simple', act: 'fdClose', test: 'fd-close' })}${btn('Reopen', { v: 'secondary', block: true, i: 'arrow-counter-clockwise', act: 'fdReopen' })}`
      : f.status === 'Closed' ? alertBox('ok', 'Closed', `${esc(f.closed.by)} · ${esc(f.closed.when)}`)
      : f.status === 'Noted' ? note('Opportunity for improvement. No fix is required.', 'info')
      : `${f.status === 'Fix submitted' ? alertBox('info', 'With the firm to verify', esc(fm ? fm.name : '')) : alertBox(fdOverdue(f) ? 'bad' : 'info', fdOverdue(f) ? 'Overdue' : f.status === 'Open' ? 'Waiting for a plan' : 'Fix in progress', fdOverdue(f) ? `Past the deadline of ${fmtD(effDue(f))}.` : `${esc(o.name)} has until ${fmtD(effDue(f))}.`)}${btn('Send a reminder', { v: 'secondary', block: true, i: 'bell-ringing', act: 'fdRemind', arg: f.id, test: 'fd-remind' })}`;
    if (f.ext && f.ext.status === 'Requested') side += `<div class="ext-box col gap8"><div class="row gap8">${tile('clock-clockwise', 'warn', 'sm')}<div class="grow"><div class="small strong">More time asked: until ${fmtD(f.ext.date)}</div><div class="cap muted">${esc(f.ext.by)} · ${esc(f.ext.when)} · now due ${fmtD(f.due)}</div></div></div><p class="small">“${esc(f.ext.reason)}”</p><div class="row">${btn('Approve', { size: 'sm', i: 'check', act: 'fdExtDecide', arg: 'Approved', test: 'ext-approve' })}${btn('Decline', { size: 'sm', v: 'secondary', act: 'fdExtDecide', arg: 'Declined', test: 'ext-decline' })}</div></div>`;
  }
  const tl = [...f.updates].reverse();
  return `<div class="rh"><div class="rh-main"><div class="overline">${esc(fc.name)} · ${esc(f.ref)}${ws !== 'organisation' ? ' · ' + esc(o.name) : ''}</div><div class="rh-title"><h1 class="h1">${esc(f.title)}</h1><span class="row wrap gap6">${clsChip(f.cls)}${fdChip(f)}</span></div><div class="rh-meta">From the ${esc(p.name)} report · published ${esc(c.published || '')}</div></div></div>
    <div class="grid side"><div class="col gap16">
      <div class="card col gap8"><div class="h4">The finding</div><p class="small">${esc(f.detail || 'The assessor found a gap against ' + f.ref + '. See the published report for the full note.')}</p></div>
      ${planCard}${proofCard}${verCard}
      <div class="card col gap12"><div class="h4">Activity</div><div class="timeline">${tl.map(([w, who, a]) => `<div class="tl">${tile(/Verified|Closed|approved/i.test(a) ? 'check-circle' : /Not fixed|Reopen|declined/i.test(a) ? 'x-circle' : /time/i.test(a) ? 'clock-clockwise' : /Remind/.test(a) ? 'bell-ringing' : 'note-pencil', /Verified|Closed|approved/i.test(a) ? 'ok' : /Not fixed|Reopen|declined/i.test(a) ? 'bad' : '', 'sm')}<div><div class="small strong">${esc(a)}</div><div class="cap muted">${esc(who)} · ${esc(w)}</div></div></div>`).join('')}<div class="tl">${tile('flag', '', 'sm')}<div><div class="small strong">Raised in the published report</div><div class="cap muted">${esc(fm ? fm.name : '')} · ${esc(c.published || '')}</div></div></div></div></div></div>
    <div class="col gap16"><div class="card col gap12"><div class="h4">${ws === 'organisation' ? 'Next step' : ws === 'firm' ? 'Verification' : 'Decision'}</div>${side}</div>
      <div class="card col gap8"><div class="h4">Details</div>${kv([['Class', `${clsChip(f.cls)} <span class="small">${esc(fc.name)}</span>`], ['Fix by', effDue(f) ? fmtD(effDue(f)) : 'No deadline'], ...(f.ext && f.ext.status === 'Approved' ? [['Original deadline', fmtD(f.due)]] : []), ['Organisation', esc(o.name)], ['Assessed by', esc(fm ? fm.name : '—')], ['Owner', esc((f.plan || {}).owner || '—')]])}</div></div></div>`;
}
screen('findings/view', { t: 'Finding', layout: 'app', ws: 'regulator', crumbs: () => [['Findings', 'findings'], fdFind(S.ui.fdId).f.title], render() { return fdDetail('regulator'); } });
screen('org/finding', { t: 'Finding', layout: 'app', ws: 'organisation', crumbs: () => [['Findings', 'org/findings'], fdFind(S.ui.fdId).f.title], render() { return fdDetail('organisation'); } });
screen('firm/finding', { t: 'Finding', layout: 'app', ws: 'firm', crumbs: () => [['Findings', 'firm/findings'], fdFind(S.ui.fdId).f.title], render() { return fdDetail('firm'); } });

/* plan editing */
function fdReadPlan() { const { f } = fdFind(S.ui.fdId); const pl = S.ui.fdDraft && S.ui.fdDraft.id === f.id ? S.ui.fdDraft : { id: f.id, steps: clone((f.plan || { steps: [['', false]] }).steps) };
  if ($('#pl-action')) { pl.action = val('pl-action'); pl.owner = val('pl-owner'); pl.target = val('pl-target'); pl.steps = pl.steps.map((s, i) => [val('pl-s-' + i), s[1]]); }
  S.ui.fdDraft = pl; return pl; }
ACT.fdStepAdd = () => { const pl = fdReadPlan(); pl.steps.push(['', false]); renderPlanDraft(); };
ACT.fdStepDel = i => { const pl = fdReadPlan(); pl.steps.splice(+i, 1); renderPlanDraft(); };
function renderPlanDraft() { S.ui.fdPlan = S.ui.fdId; render(); }
ACT.fdPlanEdit = id => { S.ui.fdPlan = id || undefined; S.ui.fdDraft = undefined; render(); };
ACT.fdPlanSave = () => {
  const { f, c } = fdFind(S.ui.fdId); const pl = fdReadPlan();
  if (!pl.action || !pl.owner || !pl.target) { toast('Add what you will do, an owner and a target date', 'bad', 'warning'); return; }
  if (effDue(f) && pl.target > effDue(f)) { toast('The target date must be on or before the deadline. Ask for more time instead.', 'bad', 'warning'); return; }
  const first = !f.plan; f.plan = { action: pl.action, owner: pl.owner, target: pl.target, steps: pl.steps.filter(s => s[0]) }; if (!f.plan.steps.length) f.plan.steps = [];
  if (f.status === 'Open') f.status = 'In progress'; fdLog(f, first ? 'Plan submitted' : 'Plan updated');
  if (first) notify({ ws: 'regulator', i: 'clipboard-text', tone: 'info', title: `${S.orgs[c.org].name} planned the fix for “${f.title}”`, go: 'findings/view', arg: f.id, kind: 'Updates' });
  addAudit(first ? 'Submitted action plan' : 'Updated action plan', f.title); S.ui.fdPlan = undefined; S.ui.fdDraft = undefined; render(); toast(first ? `Plan submitted. ${esc(S.tenant.short)} can see it.` : 'Plan saved');
};
ACT.fdStepTick = i => { const { f } = fdFind(S.ui.fdId); const st = f.plan.steps.filter(s => s[0])[+i]; st[1] = !st[1]; if (st[1]) fdLog(f, 'Step done: ' + st[0]); render(); };
const PROOF_FILES = [['Complaints register — USSD channel export.xlsx', '182 KB'], ['Contact centre procedure v3 (signed).pdf', '410 KB'], ['Test log — USSD complaints logging.pdf', '96 KB']];
ACT.fdProofAdd = () => { const { f } = fdFind(S.ui.fdId); const nx = PROOF_FILES.find(p => !f.proof.some(x => x[0] === p[0])) || ['Evidence ' + (f.proof.length + 1) + '.pdf', '120 KB']; f.proof.push(nx); render(); toast('Uploaded ' + esc(nx[0]), 'ok', 'upload-simple'); };
ACT.fdProofDel = i => { const { f } = fdFind(S.ui.fdId); f.proof.splice(+i, 1); render(); };
ACT.fdSubmitFix = () => openDialog(`${dlgHead('Submit the fix', `Your assessor checks the proof and verifies the fix. ${esc(S.tenant.short)} then closes the finding.`, 'paper-plane-tilt')}
  <div class="col gap12" style="margin-top:16px">${field('Note for the assessor', ta('fx-note', '', { attrs: 'rows="3" data-test="fx-note"', ph: 'What changed and where to look' }), { for: 'fx-note', opt: true })}</div>
  <div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Submit fix', { act: 'fdSubmitFixDo', test: 'fx-go' })}</div>`);
ACT.fdSubmitFixDo = () => { const { f, c } = fdFind(S.ui.fdId); f.status = 'Fix submitted'; f.fixNote = val('fx-note'); f.verify = null; fdLog(f, 'Fix submitted with proof' + (f.fixNote ? ': ' + f.fixNote : ''));
  notify({ ws: 'firm', org: c.firm, i: 'seal-question', tone: 'info', title: `${S.orgs[c.org].name} submitted a fix for you to verify`, go: 'firm/finding', arg: f.id, kind: 'Approvals' });
  addAudit('Submitted fix', f.title); closeDialog(); render(); toast(`Fix submitted to ${esc((S.firms[c.firm] || {}).name || 'your assessor')}`, 'ok', 'paper-plane-tilt'); };
ACT.fdExtAsk = () => { const { f } = fdFind(S.ui.fdId); openDialog(`${dlgHead('Ask for more time', `${esc(S.tenant.short)} decides. Until then the current deadline of ${fmtD(effDue(f))} stands.`, 'clock-clockwise', 'warn')}
  <div class="col gap12" style="margin-top:16px">${field('New date', inp('ex-date', dPlus(effDue(f) < TODAY ? TODAY : effDue(f), 45), { type: 'date', attrs: 'data-test="ex-date"' }), { for: 'ex-date' })}${field('Reason', ta('ex-reason', '', { attrs: 'rows="3" data-test="ex-reason"', ph: 'Why you need more time, and what is already done' }), { for: 'ex-reason' })}</div>
  <div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Send request', { act: 'fdExtDo', test: 'ex-go' })}</div>`); };
ACT.fdExtDo = () => { const { f, c } = fdFind(S.ui.fdId); const d = val('ex-date'); const r = val('ex-reason'); if (!d || !r) { toast('Add a date and a reason', 'bad', 'warning'); return; } if (d <= effDue(f)) { toast('Pick a date after the current deadline', 'bad', 'warning'); return; }
  f.ext = { date: d, reason: r, status: 'Requested', when: '19 Oct 2026', by: persona().name }; fdLog(f, 'Asked for more time, until ' + fmtD(d));
  notify({ ws: 'regulator', i: 'clock-clockwise', tone: 'warn', title: `${S.orgs[c.org].name} asked for more time on “${f.title}”`, go: 'findings/view', arg: f.id, kind: 'Approvals' }); closeDialog(); render(); toast('Request sent to ' + esc(S.tenant.short)); };
ACT.fdExtDecide = d => { const { f, c } = fdFind(S.ui.fdId); f.ext.status = d; f.ext.decidedBy = persona().name; fdLog(f, `More time ${d.toLowerCase()}${d === 'Approved' ? ': now due ' + fmtD(f.ext.date) : ''}`);
  notify({ ws: 'organisation', org: c.org, i: 'clock-clockwise', tone: d === 'Approved' ? 'ok' : 'warn', title: `${S.tenant.short} ${d.toLowerCase()} more time for “${f.title}”`, go: 'org/finding', arg: f.id, kind: 'Updates' });
  addAudit(`${d} extension`, `${S.orgs[c.org].name} · ${f.title}`); render(); toast(d === 'Approved' ? `Approved. New deadline ${fmtD(f.ext.date)}` : 'Declined. The original deadline stands.'); };
ACT.fdVerify = ok => { const { f, c } = fdFind(S.ui.fdId); const n = val('vf-note'); if (!n) { toast('Add a note on what you checked', 'bad', 'warning'); return; } const good = ok === 'ok';
  f.verify = { by: persona().name, when: '19 Oct 2026', ok: good, note: n }; f.status = good ? 'Verified fixed' : 'In progress'; fdLog(f, good ? 'Verified fixed' : 'Not fixed: ' + n);
  notify(good ? { ws: 'regulator', i: 'seal-check', tone: 'info', title: `${myFirm().name} verified a fix at ${S.orgs[c.org].name}. Ready to close`, go: 'findings/view', arg: f.id, kind: 'Approvals' } : { ws: 'organisation', org: c.org, i: 'x-circle', tone: 'warn', title: `Your assessor says “${f.title}” is not fixed yet`, go: 'org/finding', arg: f.id, kind: 'Updates' });
  if (good) notify({ ws: 'organisation', org: c.org, i: 'seal-check', tone: 'ok', title: `Your fix for “${f.title}” was verified`, go: 'org/finding', arg: f.id, kind: 'Updates' });
  addAudit(good ? 'Verified fix' : 'Rejected fix', `${S.orgs[c.org].name} · ${f.title}`); render(); toast(good ? `Verified. ${esc(S.tenant.short)} will close it.` : 'Sent back to the organisation'); };
ACT.fdClose = () => { const { f, c } = fdFind(S.ui.fdId); f.status = 'Closed'; f.closed = { by: persona().name, when: '19 Oct 2026', note: val('cl-note') }; fdLog(f, 'Closed');
  notify({ ws: 'organisation', org: c.org, i: 'lock-simple', tone: 'ok', title: `${S.tenant.short} closed “${f.title}”`, go: 'org/finding', arg: f.id, kind: 'Updates' }); addAudit('Closed finding', `${S.orgs[c.org].name} · ${f.title}`); render(); toast('Finding closed', 'ok', 'lock-simple'); };
ACT.fdReopen = () => { const { f, c } = fdFind(S.ui.fdId); const n = val('cl-note'); if (!n) { toast('Say why you are reopening it', 'bad', 'warning'); return; } f.status = 'In progress'; fdLog(f, 'Reopened: ' + n);
  notify({ ws: 'organisation', org: c.org, i: 'arrow-counter-clockwise', tone: 'warn', title: `${S.tenant.short} reopened “${f.title}”`, go: 'org/finding', arg: f.id, kind: 'Updates' }); render(); toast('Reopened'); };

/* ---------- Organisation: findings ---------- */
const ORG_FD = [['plan', 'To plan', 'flag', x => x.f.status === 'Open'], ['progress', 'In progress', 'wrench', x => x.f.status === 'In progress'], ['firm', 'With assessor', 'seal-question', x => ['Fix submitted', 'Verified fixed'].includes(x.f.status)], ['done', 'Closed', 'lock-simple', x => ['Closed', 'Noted'].includes(x.f.status)]];
screen('org/findings', {
  t: 'Findings', layout: 'app', ws: 'organisation', crumbs: ['Findings'],
  render() {
    const fk = ui('oFdF', ''); const mine = allFindings().filter(x => x.c.org === S.orgId);
    const over = mine.filter(x => fdOverdue(x.f)).length;
    const rows = mine.filter(x => fk ? ORG_FD.find(c => c[0] === fk)[3](x) : !['Closed', 'Noted'].includes(x.f.status)).sort((a, b) => (fdOverdue(b.f) - fdOverdue(a.f)) || (a.f.status === 'Open' ? -1 : b.f.status === 'Open' ? 1 : 0) || String(effDue(a.f)).localeCompare(String(effDue(b.f))));
    return `${pageHead({ title: 'Findings', sub: `Gaps found in your published assessments. Plan each fix, send proof, and your assessor verifies it before ${esc(S.tenant.short)} closes it.` })}
      ${over ? alertBox('bad', `${over} fix${over > 1 ? 'es are' : ' is'} overdue`, 'Finish the fix, or ask for more time.') : ''}
      <div class="card p0">${fpills([['', 'Open', mine.filter(x => !['Closed', 'Noted'].includes(x.f.status)).length, 'ofc-all'], ...ORG_FD.map(([k, l, i, fn]) => [k, l, mine.filter(fn).length, 'ofc-' + k, k === 'plan' ? 'warn' : ''])], fk, 'oFdF')}${fdTable(rows, { route: 'org/finding', noOrg: true, emptyT: 'No findings here', emptyB: 'Findings appear when a report is published.', act: f => f.status === 'Open' ? btn('Plan fix', { size: 'sm', act: 'open', arg: 'org/finding:' + f.id }) : f.status === 'In progress' ? btn('Update', { v: 'secondary', size: 'sm', act: 'open', arg: 'org/finding:' + f.id }) : '' })}</div>`;
  }
});
ACT.oFdF = k => { S.ui.oFdF = k; render(); };
function findingsCard() {
  const mine = allFindings().filter(x => x.c.org === S.orgId && ['Open', 'In progress'].includes(x.f.status)).sort((a, b) => (fdOverdue(b.f) - fdOverdue(a.f)) || String(effDue(a.f)).localeCompare(String(effDue(b.f)))).slice(0, 3);
  return `<div class="card p0"><div class="tbl-tools"><span class="h4 grow">Findings to fix</span><a href="#org/findings" data-go="org/findings" class="small strong">View all</a></div>${mine.length ? `<div class="list">${mine.map(({ f }) => `<button class="list-row" data-act="open" data-arg="org/finding:${f.id}" data-test="dfd-${f.id}">${clsChip(f.cls)}<span class="grow" style="min-width:0"><span class="strong ell" style="display:block">${esc(f.title)}</span><span class="cap muted">Fix by ${fmtD(effDue(f))}</span></span>${fdOverdue(f) ? chip('Overdue', 'bad') : f.status === 'Open' ? chip('Plan needed', 'warn') : chip('In progress', 'info')}</button>`).join('')}</div>` : `<div style="padding:12px 20px 20px">${empty('check-circle', 'Nothing to fix', 'Findings from published reports appear here.')}</div>`}</div>`;
}

/* ---------- Assurance firm: fixes to verify ---------- */
screen('firm/findings', {
  t: 'Findings', layout: 'app', ws: 'firm', crumbs: ['Findings'],
  render() {
    const mine = allFindings().filter(x => x.c.firm === S.firmId); const tab = ui('ffTab', 'verify');
    const sets = { verify: mine.filter(x => x.f.status === 'Fix submitted'), open: mine.filter(x => ['Open', 'In progress'].includes(x.f.status)), done: mine.filter(x => ['Verified fixed', 'Closed', 'Noted'].includes(x.f.status)) };
    return `${pageHead({ title: 'Findings', sub: 'Findings you raised in published reports. When an organisation submits a fix, check the proof and verify it.' })}
      ${tabs([{ id: 'verify', label: 'Fixes to verify', count: sets.verify.length }, { id: 'open', label: 'Being fixed', count: sets.open.length }, { id: 'done', label: 'Verified and closed', count: sets.done.length }], tab, 'ffTab')}
      <div class="card p0">${fdTable(sets[tab], { route: 'firm/finding', emptyT: tab === 'verify' ? 'No fixes waiting' : 'Nothing here', emptyB: tab === 'verify' ? 'You are told when an organisation submits a fix.' : '', act: f => f.status === 'Fix submitted' ? btn('Verify', { size: 'sm', act: 'open', arg: 'firm/finding:' + f.id }) : '' })}</div>`;
  }
});
ACT.ffTab = t => { S.ui.ffTab = t; render(); };
function firmFixAlert() { const n = allFindings().filter(x => x.c.firm === S.firmId && x.f.status === 'Fix submitted').length; return n ? alertBox('info', `${n} fix${n > 1 ? 'es' : ''} to verify`, 'Organisations sent proof that a finding is fixed. Check it and verify, or say what is missing.', btn('Open findings', { size: 'sm', go: 'firm/findings', test: 'firm-fix-alert' }), 'seal-question') : ''; }

ACT.fdView = v => { S.ui.fdView = v; render(); };
