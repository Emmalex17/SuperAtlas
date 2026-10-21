/* ================= C2 · Enforcement: watchlist, cases, notices, responses, decisions ================= */
const atOf = id => S.actionTypes.find(t => t.id === id) || S.actionTypes[0];
const caseE = id => S.enfCases.find(c => c.id === id);
const naira = n => '₦' + Number(n || 0).toLocaleString('en-GB');
const OPEN_ENF = ['Awaiting sign-off', 'Notice issued', 'Response received', 'Awaiting payment'];
const enfOpenFor = org => S.enfCases.find(c => c.org === org && OPEN_ENF.includes(c.status));
const ENF_TONE = { 'Awaiting sign-off': ['warn', 'signature'], 'Notice issued': ['info', 'paper-plane-tilt'], 'Response received': ['warn', 'chat-circle-dots'], 'Awaiting payment': ['warn', 'money'], Closed: ['neu', 'lock-simple'], Escalated: ['ai', 'arrow-fat-line-up'], Withdrawn: ['neu', 'x-circle'] };
const enfChip = st => chip(st, (ENF_TONE[st] || ['neu'])[0], (ENF_TONE[st] || [])[1]);
function caseLog(c, what, who) { c.timeline.push([TODAY, who || persona().name, what]); }

/* ---------- the watchlist: organisations flagged by the status rules, plus manual additions ---------- */
function watchlist() {
  const cp = S.compliance; const out = {};
  const add = (org, why) => { (out[org] = out[org] || { org, reasons: [] }).reasons.push(why); };
  const days = +cp.watchDays;
  if (days > 0) allFindings().filter(x => x.f.cls === 'MaNC' && !['Closed', 'Noted', 'Verified fixed'].includes(x.f.status) && effDue(x.f) && daysBetween(effDue(x.f), TODAY) > days)
    .forEach(x => add(x.c.org, { rule: 'overdue', text: `Major nonconformity overdue by ${daysBetween(effDue(x.f), TODAY)} days: ${x.f.title}`, ev: { kind: 'finding', id: x.f.id, label: `${x.f.cls}: ${x.f.title} (${progOf(x.c.prog).name})` } }));
  const n = +cp.cyclesRunning;
  if (n > 0) S.series.forEach(sr => { const b = +(cp.bench[sr.id] ?? 70); const orgs = [...new Set(S.cases.filter(c => progOf(c.prog).series === sr.id && c.stage === 'Published').map(c => c.org))];
    orgs.forEach(org => { const res = S.cases.filter(c => c.org === org && c.stage === 'Published' && c.score != null && progOf(c.prog).series === sr.id).sort((a, c) => +progOf(c.prog).cycle - +progOf(a.prog).cycle).slice(0, n);
      if (res.length === n && res.every(c => c.score < b)) add(org, { rule: 'cycles', text: `Below the ${sr.name} benchmark (${b}) in ${n} cycles running: ${res.map(c => progOf(c.prog).cycle + ' scored ' + c.score).join(', ')}`, ev: { kind: 'result', id: res[0].id, label: `${progOf(res[0].prog).name}: score ${res[0].score}` } }); }); });
  const lr = +cp.lateRuns;
  if (lr > 0 && S.filings) { const keys = [...new Set(S.filings.map(f => f.org + '|' + f.tpl))]; keys.forEach(k => { const [org, tpl] = k.split('|'); const fs = S.filings.filter(f => f.org === org && f.tpl === tpl && (isFiled(f) || f.due < TODAY)).sort((a, b) => b.pkey.localeCompare(a.pkey)).slice(0, lr); if (fs.length === lr && fs.every(f => f.lateBy || retStatus(f) === 'Late')) add(org, { rule: 'returns', text: `Late with ${tplOf(tpl).name} ${lr} periods running`, ev: { kind: 'return', id: fs[0].id, label: `${tplOf(tpl).name} ${fs[0].period}` } }); }); }
  (S.watchManual || []).forEach(m => add(m.org, { rule: 'manual', text: `Added by ${m.by}: ${m.reason}`, ev: null }));
  return Object.values(out).filter(w => !S.watchDismissed[w.org] || S.watchDismissed[w.org].sig !== w.reasons.filter(r => r.rule !== 'manual').map(r => r.text).join('|')).sort((a, b) => b.reasons.length - a.reasons.length || S.orgs[a.org].name.localeCompare(S.orgs[b.org].name));
}

/* ---------- Enforcement page ---------- */
screen('enforcement', {
  t: 'Enforcement', layout: 'app', ws: 'regulator', crumbs: ['Enforcement'],
  render() {
    Object.keys(DRILL).forEach(k => delete DRILL[k]);
    const tab = ui('enfTab', 'watch'); const wl = watchlist(); const cs = S.enfCases;
    const openN = cs.filter(c => OPEN_ENF.includes(c.status)).length;
    let body = '';
    if (tab === 'watch') {
      const ruleOff = !(+S.compliance.watchDays > 0);
      body = `${ruleOff ? alertBox('info', 'The overdue-fix rule is off', `Set how many days a major nonconformity can be overdue before an organisation is flagged.`, btn('Set it in Settings', { size: 'sm', v: 'secondary', go: 'settings/compliance', test: 'enf-set-days' }), 'gear-six') : ''}
        <div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Watchlist</div><div class="cap muted">Flagged by the rules in Settings → Compliance status, or added by your team. Open a case, or dismiss with a reason.</div></div>${btn('Add an organisation', { v: 'secondary', size: 'sm', i: 'plus', act: 'watchAdd', test: 'watch-add' })}</div>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Why it is flagged</th><th>Case</th><th class="act-col"></th></tr></thead><tbody>${wl.map(w => { const o = S.orgs[w.org]; const oc = enfOpenFor(w.org); return `<tr data-test="watch-${w.org}"><td>${orgCell(o, catLabel(o.type, o.tier))}</td><td class="wrap" style="max-width:520px"><ul class="why">${w.reasons.map(r => `<li>${ic({ overdue: 'warning', cycles: 'chart-line-down', returns: 'table', manual: 'user' }[r.rule] || 'dot')}<span>${esc(r.text)}</span></li>`).join('')}</ul></td><td>${oc ? `<a href="#" data-act="open" data-arg="enforcement/case:${oc.id}" class="small strong">${esc(oc.ref)}</a><div>${enfChip(oc.status)}</div>` : '<span class="cap muted">None open</span>'}</td><td class="act-col"><div class="row end gap4">${oc ? '' : btn('Open a case', { size: 'sm', act: 'enfNew', arg: w.org, test: 'enf-new-' + w.org })}${btn('Dismiss', { v: 'tertiary', size: 'sm', act: 'watchDismiss', arg: w.org, test: 'dismiss-' + w.org })}</div></td></tr>`; }).join('') || `<tr><td colspan="4">${empty('eye', 'Nobody is flagged', 'Organisations appear here when they meet a rule in Settings → Compliance status.')}</td></tr>`}</tbody></table></div><div class="tbl-foot">${wl.length} organisation${wl.length === 1 ? '' : 's'} flagged</div></div>`;
    } else if (tab === 'cases') {
      const f = ui('enfF', 'open'); const fs = { open: c => OPEN_ENF.includes(c.status), all: () => true, closed: c => !OPEN_ENF.includes(c.status) };
      const rows = cs.filter(fs[f]).sort((a, b) => b.opened.localeCompare(a.opened));
      body = `<div class="card p0">${fpills([['open', 'Open', cs.filter(fs.open).length, 'ef-open'], ['closed', 'Closed', cs.filter(fs.closed).length, 'ef-closed'], ['all', 'All', cs.length, 'ef-all']], f, 'enfF')}
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Case</th><th>Organisation</th><th>Action</th><th>Opened</th><th>Respond by</th><th>Status</th></tr></thead><tbody>${rows.map(c => { const o = S.orgs[c.org]; const late = c.status === 'Notice issued' && c.respondBy && c.respondBy < TODAY; return `<tr class="click" data-act="open" data-arg="enforcement/case:${c.id}" data-test="case-${c.id}"><td class="mono small">${esc(c.ref)}</td><td>${orgCell(o, catLabel(o.type, o.tier))}</td><td class="small">${esc(atOf(c.type).name)}${c.penalty ? `<div class="cap muted">${naira(c.penalty.amount)}</div>` : ''}</td><td class="small">${fmtD(c.opened)}</td><td class="small">${c.respondBy ? fmtD(c.respondBy) : '—'}${late ? `<div class="cap" style="color:var(--bad-fg)">No response yet</div>` : ''}</td><td>${enfChip(c.status)}</td></tr>`; }).join('') || `<tr><td colspan="6">${empty('gavel', 'No cases here', 'Open a case from the watchlist or from an organisation.')}</td></tr>`}</tbody></table></div></div>`;
    } else {
      const closed = cs.filter(c => c.status === 'Closed' && c.decision); const days = closed.map(c => daysBetween(c.opened, c.decision.when)).filter(v => v >= 0);
      const byOrg = {}; cs.forEach(c => { byOrg[c.org] = (byOrg[c.org] || 0) + 1; }); const repeat = Object.keys(byOrg).filter(o => byOrg[o] > 1);
      const row = c => ({ org: c.org, sub: `${esc(c.ref)} · ${esc(atOf(c.type).name)}`, chip: enfChip(c.status), go: `enforcement/case:${c.id}` });
      const stages = ['Awaiting sign-off', 'Notice issued', 'Response received', 'Awaiting payment', 'Closed', 'Escalated'];
      const byStage = stages.map(st => { const l = cs.filter(c => c.status === st); return { l: st, v: l.length, col: CH[(ENF_TONE[st] || ['neu'])[0]] || CH.brand, drill: drillKey(st, 'Enforcement cases', l.map(row)) }; }).filter(x => x.v);
      const byType = S.actionTypes.map(t => { const l = cs.filter(c => c.type === t.id); return { l: t.name, v: l.length, col: CH.ai, drill: drillKey(t.name, 'Enforcement cases', l.map(row)) }; });
      const paid = cs.filter(c => c.penalty && c.penalty.paid).reduce((a, c) => a + c.penalty.amount, 0); const due = cs.filter(c => c.penalty && !c.penalty.paid).reduce((a, c) => a + c.penalty.amount, 0);
      body = `<div class="ktiles">${kTile('Open cases', cs.filter(c => OPEN_ENF.includes(c.status)).length, { sub: `${cs.filter(c => c.status === 'Response received').length} waiting for your decision`, drill: drillKey('Open cases', '', cs.filter(c => OPEN_ENF.includes(c.status)).map(row)), test: 'ek-open' })}${kTile('Closed', closed.length, { sub: 'All time', drill: drillKey('Closed cases', '', closed.map(row)), test: 'ek-closed' })}${kTile('Average days to close', avg(days) ?? '—', { sub: 'From opening to decision' })}${kTile('Repeat organisations', repeat.length, { sub: 'More than one case', drill: drillKey('Organisations with more than one case', '', repeat.map(o => ({ org: o, sub: `${byOrg[o]} cases`, go: orgGo(o) }))), test: 'ek-repeat' })}</div>
        <div class="ch-grid2">${chCard('enf-stage', `${cs.filter(c => c.status === 'Response received').length} case${cs.filter(c => c.status === 'Response received').length === 1 ? '' : 's'} waiting for a decision`, 'Cases by stage · click to see which', chBars(byStage), miniTable(['Stage', 'Cases'], byStage.map(x => [esc(x.l), x.v])))}${chCard('enf-type', `Penalties: ${naira(paid)} paid, ${naira(due)} outstanding`, 'Cases by action', chBars(byType), miniTable(['Action', 'Cases'], byType.map(x => [esc(x.l), x.v])))}</div>`;
    }
    return `${pageHead({ title: 'Enforcement', sub: 'Organisations flagged by your rules, and the action you take: notices, responses, decisions and penalties.', actions: `<button class="icon-btn bordered" data-go="settings/actions" title="Action types" aria-label="Action types">${ic('gear-six')}</button>` + btn('Open a case', { i: 'plus', act: 'enfNew', arg: '', test: 'enf-new' }) })}
      ${tabs([{ id: 'watch', label: 'Watchlist', count: wl.length, test: 'et-watch' }, { id: 'cases', label: 'Cases', count: openN, test: 'et-cases' }, { id: 'insights', label: 'Insights', test: 'et-insights' }], tab, 'enfTab')}${body}`;
  }
});
ACT.enfTab = t => { S.ui.enfTab = t; render(); };
ACT.enfF = f => { S.ui.enfF = f; render(); };
ACT.watchDismiss = org => { const o = S.orgs[org]; openDialog(`${dlgHead('Dismiss from the watchlist', `${esc(o.name)} stays off the list until a new reason flags it again.`, 'eye-slash')}<div class="col gap12" style="margin-top:16px">${field('Reason', ta('wd-r', '', { attrs: 'rows="3" data-test="wd-r"', ph: 'Why no action is needed now' }), { for: 'wd-r' })}</div><div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Dismiss', { act: 'watchDismissDo', arg: org, test: 'wd-go' })}</div>`); };
ACT.watchDismissDo = org => { const r = val('wd-r'); if (!r) { toast('Give a reason', 'bad', 'warning'); return; } const w = watchlist().find(x => x.org === org); S.watchDismissed[org] = { reason: r, by: persona().name, when: TODAY, sig: w ? w.reasons.map(x => x.text).join('|') : '' }; S.watchManual = S.watchManual.filter(m => m.org !== org); if (w) S.watchDismissed[org].sig = w.reasons.filter(x => x.rule !== 'manual').map(x => x.text).join('|'); addAudit('Dismissed from the watchlist', `${S.orgs[org].name}: ${r}`); closeDialog(); render(); toast('Dismissed. The reason is kept in the audit trail.'); };
ACT.watchAdd = () => openDialog(`${dlgHead('Add an organisation to the watchlist', 'For concerns the rules do not catch, such as a complaint or a news report.', 'eye')}<div class="col gap12" style="margin-top:16px">${field('Organisation', sel('wa-org', Object.values(S.orgs).filter(o => o.status === 'Verified').sort((a, b) => a.name.localeCompare(b.name)).map(o => [o.id, o.name]), 'brightwater', { attrs: 'data-test="wa-org"' }), { for: 'wa-org' })}${field('Reason', ta('wa-r', '', { attrs: 'rows="3" data-test="wa-r"', ph: 'What is the concern?' }), { for: 'wa-r' })}</div><div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Add', { act: 'watchAddDo', test: 'wa-go' })}</div>`);
ACT.watchAddDo = () => { const org = val('wa-org'), r = val('wa-r'); if (!r) { toast('Give a reason', 'bad', 'warning'); return; } S.watchManual.push({ org, reason: r, by: persona().name, when: TODAY }); delete S.watchDismissed[org]; addAudit('Added to the watchlist', `${S.orgs[org].name}: ${r}`); closeDialog(); render(); toast(`${esc(S.orgs[org].name)} added to the watchlist`); };

/* ---------- Open a case ---------- */
ACT.enfNew = org => { S.ui.enfDraft = { org: org || '', type: '', ev: null, respondBy: '', amount: '', subject: '', body: '', approver: '' }; go('enforcement/new'); };
function enfEvidence(org) {
  const items = [];
  const w = watchlist().find(x => x.org === org); (w ? w.reasons : []).forEach(r => { if (r.ev) items.push(Object.assign({ checked: true }, r.ev)); });
  allFindings().filter(x => x.c.org === org && NC_OPEN(x.f) && !items.some(i => i.id === x.f.id)).forEach(x => items.push({ kind: 'finding', id: x.f.id, label: `${x.f.cls}: ${x.f.title} (${progOf(x.c.prog).name})`, checked: false }));
  S.cases.filter(c => c.org === org && c.stage === 'Published' && c.score != null && c.score < benchOf(progOf(c.prog)) && !items.some(i => i.id === c.id)).forEach(c => items.push({ kind: 'result', id: c.id, label: `${progOf(c.prog).name}: score ${c.score}`, checked: false }));
  (S.filings || []).filter(f => f.org === org && retStatus(f) === 'Late').forEach(f => items.push({ kind: 'return', id: f.id, label: `${tplOf(f.tpl).name} ${f.period}: late`, checked: false }));
  return items;
}
function noticeText(d) {
  const o = S.orgs[d.org]; const t = atOf(d.type); const ev = (d.ev || []).filter(e => e.checked);
  return { subject: `${t.name}: ${o ? o.name : ''}`, body: `Dear ${o ? (o.officer || 'Compliance officer') : ''},\n\n${S.tenant.name} is issuing this ${t.name.toLowerCase()} because of the following:\n${ev.map(e => '• ' + e.label).join('\n') || '• (add the reasons)'}\n\n${t.penalty ? `A penalty of ${naira(d.amount || 0)} applies. ` : ''}${t.days ? `Please respond by ${d.respondBy ? fmtD(d.respondBy) : '(date)'}: accept and send your fix plan, or contest with supporting documents.` : 'No response is needed.'}\n\n${persona().name}\n${S.tenant.short}` };
}
function enfSync() { const d = S.ui.enfDraft; if (!$('#en-org')) return d; d.org = val('en-org'); d.respondBy = val('en-by'); d.amount = val('en-amt'); d.approver = val('en-appr'); d.subject = val('en-subj'); d.body = val('en-body'); (d.ev || []).forEach((e, i) => { e.checked = !!val('en-ev-' + i); }); d.touched = true; return d; }
screen('enforcement/new', {
  t: 'Open a case', layout: 'app', ws: 'regulator', crumbs: [['Enforcement', 'enforcement'], 'Open a case'],
  render() {
    const d = S.ui.enfDraft || (S.ui.enfDraft = { org: '', type: '' });
    if (d.org && !d.ev) d.ev = enfEvidence(d.org);
    const t = d.type ? atOf(d.type) : null;
    if (t && !d.respondBy && t.days) d.respondBy = dPlus(TODAY, t.days);
    if (t && !d.edited) Object.assign(d, noticeText(d));
    const orgs = Object.values(S.orgs).filter(o => o.status === 'Verified').sort((a, b) => a.name.localeCompare(b.name));
    return `${pageHead({ title: 'Open a case', sub: 'Choose the action, link the evidence, and draft the notice. A second person signs it off before it is issued.' })}
      <div class="grid side" id="en-form"><div class="col gap16">
        <div class="card col gap12"><div class="h4">1. Organisation</div>${field('', sel('en-org', [['', 'Choose an organisation'], ...orgs.map(o => [o.id, o.name])], d.org, { attrs: 'data-change="enOrg" data-test="en-org"' }))}</div>
        <div class="card col gap12"><div class="h4">2. Action</div><div class="grid g2" style="gap:8px">${S.actionTypes.map(a => `<button class="choice ${d.type === a.id ? 'on' : ''}" data-act="enType" data-arg="${a.id}" data-test="en-type-${a.id}"><span class="radio"></span><span><b class="small">${esc(a.name)}</b><span class="cap muted" style="display:block">${esc(a.d)}</span></span></button>`).join('')}</div>
          ${t ? `<div class="grid g2" style="gap:14px">${t.days ? field('Respond by', inp('en-by', d.respondBy, { type: 'date', attrs: 'data-test="en-by"' }), { for: 'en-by', hint: `Default ${t.days} days` }) : ''}${t.penalty ? field('Penalty amount (₦)', inp('en-amt', d.amount, { type: 'number', ph: 'e.g. 5000000', attrs: 'data-test="en-amt"' }), { for: 'en-amt' }) : ''}</div>` : ''}</div>
        <div class="card col gap12"><div class="h4">3. Evidence</div>${d.org ? ((d.ev || []).length ? `<div class="col gap6">${d.ev.map((e, i) => ck('en-ev-' + i, `${chip({ finding: 'Finding', result: 'Result', return: 'Return' }[e.kind] || 'Note', 'neu')} ${esc(e.label)}`, e.checked, { attrs: `data-test="en-ev-${i}"` })).join('')}</div>` : note('No findings, low scores or late returns on record. Explain the reason in the notice.')) : '<p class="small muted">Choose an organisation first.</p>'}</div>
        <div class="card col gap12"><div class="row"><span class="h4 grow">4. Notice</span>${t ? btn('Rebuild from template', { v: 'tertiary', size: 'sm', i: 'arrow-counter-clockwise', act: 'enRebuild' }) : ''}</div>${t ? `${field('Subject', inp('en-subj', d.subject), { for: 'en-subj' })}${field('Letter', ta('en-body', d.body, { attrs: 'rows="12" data-test="en-body"' }), { for: 'en-body', hint: 'The organisation sees this in its workspace and by email.' })}` : '<p class="small muted">Choose an action to draft the notice.</p>'}</div></div>
      <div class="col gap16"><div class="card col gap12" style="position:sticky;top:70px"><div class="h4">Sign-off</div>${field('Approver', sel('en-appr', reviewers().map(r => [r.name, r.name + ' · ' + r.role]), d.approver || (reviewers().find(r => r.name !== persona().name) || reviewers()[0]).name), { for: 'en-appr', hint: 'They check the case and issue the notice.' })}
        ${btn('Send for sign-off', { block: true, i: 'signature', act: 'enSubmit', test: 'en-submit' })}${btn('Cancel', { v: 'tertiary', block: true, go: 'enforcement' })}</div></div></div>`;
  },
  mount() { const f = $('#en-form'); f && f.addEventListener('change', e => { if (e.target.id === 'en-org') return; enfSync(); if (['en-subj', 'en-body'].includes(e.target.id)) S.ui.enfDraft.edited = true; }); }
});
ACT.chg_enOrg = v => { const d = enfSync(); d.org = v; d.ev = v ? enfEvidence(v) : null; d.edited = false; render(); };
ACT.enType = id => { const d = enfSync(); if (d.type !== id) { d.respondBy = ''; d.edited = false; } d.type = id; render(); };
ACT.enRebuild = () => { const d = enfSync(); d.edited = false; render(); };
ACT.enSubmit = () => {
  const d = enfSync(); if (!d.org) { toast('Choose an organisation', 'bad', 'warning'); return; } if (!d.type) { toast('Choose an action', 'bad', 'warning'); return; }
  const t = atOf(d.type); if (t.penalty && !(+d.amount > 0)) { toast('Enter the penalty amount', 'bad', 'warning'); return; } if (!d.body) { toast('Write the notice', 'bad', 'warning'); return; }
  const n = S.enfCases.filter(c => c.ref.startsWith('EC-2026')).length + 10;
  const c = { id: uid('ec'), ref: `EC-2026-${String(n).padStart(3, '0')}`, org: d.org, type: d.type, status: 'Awaiting sign-off', opened: TODAY, issued: '', respondBy: t.days ? d.respondBy : '', reason: (d.ev || []).filter(e => e.checked).map(e => e.label).join('; '), evidence: (d.ev || []).filter(e => e.checked).map(({ kind, id, label }) => ({ kind, id, label })), notice: { subject: d.subject, body: d.body }, approver: d.approver, by: persona().name, penalty: t.penalty ? { amount: +d.amount, paid: false } : null, response: null, decision: null, timeline: [], from: watchlist().some(w => w.org === d.org) ? 'watchlist' : 'manual' };
  caseLog(c, 'Case opened and sent for sign-off to ' + d.approver); S.enfCases.unshift(c); addAudit('Opened enforcement case', `${c.ref} · ${S.orgs[c.org].name} · ${t.name}`); S.ui.enfDraft = undefined;
  toast(`${esc(c.ref)} sent to ${esc(d.approver)} for sign-off`, 'ok', 'signature'); openRoute('enforcement/case', c.id);
};

/* ---------- Case (regulator) ---------- */
OPEN_HOOKS['enforcement/case'] = a => { S.ui.ecId = a; };
OPEN_HOOKS['org/action'] = a => { S.ui.ecId = a; };
function evLink(e, side) { const go = e.kind === 'finding' ? (side === 'org' ? 'org/finding:' : 'findings/view:') + e.id : e.kind === 'result' ? (side === 'org' ? 'org/report:' : 'reviews/report:') + e.id : e.kind === 'return' ? (side === 'org' ? 'org/return:' : 'returns/filing:') + e.id : ''; return `<div class="ev-row">${chip({ finding: 'Finding', result: 'Result', return: 'Return' }[e.kind] || 'Note', 'neu')}${go && e.id ? `<a href="#" data-act="open" data-arg="${go}" class="small">${esc(e.label)}</a>` : `<span class="small">${esc(e.label)}</span>`}</div>`; }
function caseBody(c, side) {
  const t = atOf(c.type); const resp = c.response;
  return `${c.notice || c.reason ? `<div class="card col gap8"><div class="row"><span class="h4 grow">Notice</span>${c.issued ? `<span class="cap muted">Issued ${fmtD(c.issued)}</span>` : chip('Not issued yet', 'warn')}</div>${c.notice ? `<div class="strong small">${esc(c.notice.subject)}</div><div class="letter">${esc(c.notice.body)}</div>` : `<p class="small">${esc(c.reason)}</p>`}${btn('Download notice (PDF)', { v: 'tertiary', size: 'sm', i: 'download-simple', act: 'savedToast', arg: 'Notice downloaded' })}</div>` : ''}
    <div class="card col gap8"><div class="h4">Evidence</div>${(c.evidence || []).map(e => evLink(e, side)).join('') || '<p class="small muted">None linked.</p>'}</div>
    ${resp ? `<div class="card col gap8"><div class="row"><span class="h4 grow">${side === 'org' ? 'Your response' : 'Response from ' + esc(S.orgs[c.org].name)}</span>${chip(resp.kind === 'accept' ? 'Accepted' : 'Contested', resp.kind === 'accept' ? 'ok' : 'warn')}</div><p class="small">${esc(resp.text)}</p>${(resp.files || []).map(f => fileRow(f[0], esc(f[1]))).join('')}<div class="cap muted">${esc(resp.by)} · ${fmtD(resp.when)}</div></div>` : ''}
    ${c.decision ? `<div class="card col gap8"><div class="h4">Decision</div>${kv([['Outcome', esc(c.decision.outcome)], ['By', esc(c.decision.by)], ['When', fmtD(c.decision.when)], ...(c.decision.note ? [['Note', esc(c.decision.note)]] : [])])}</div>` : ''}
    <div class="card col gap12"><div class="h4">Timeline</div><div class="timeline">${[...c.timeline].reverse().map(([w, who, a]) => `<div class="tl">${tile(/Closed|paid/i.test(a) ? 'check-circle' : /Contested|Escalated/i.test(a) ? 'arrow-fat-line-up' : /issued/i.test(a) ? 'paper-plane-tilt' : /Accepted|respon/i.test(a) ? 'chat-circle-dots' : 'note-pencil', /Closed|paid/i.test(a) ? 'ok' : '', 'sm')}<div><div class="small strong">${esc(a)}</div><div class="cap muted">${esc(who)} · ${fmtD(w)}</div></div></div>`).join('')}</div></div>`;
}
screen('enforcement/case', {
  t: 'Enforcement case', layout: 'app', ws: 'regulator', crumbs: () => { const c = caseE(S.ui.ecId) || S.enfCases[0]; return [['Enforcement', 'enforcement'], c.ref]; },
  render() {
    const c = caseE(S.ui.ecId) || S.enfCases[0]; S.ui.ecId = c.id; const o = S.orgs[c.org]; const t = atOf(c.type);
    let side;
    if (c.status === 'Awaiting sign-off') side = `<p class="small muted">${esc(c.approver)} checks the case and issues the notice. ${esc(o.name)} is told straight away.</p>${btn(`Sign off and issue${c.approver === persona().name ? '' : ' (as ' + esc(c.approver) + ')'}`, { block: true, i: 'signature', act: 'ecIssue', test: 'ec-issue' })}${btn('Withdraw', { v: 'tertiary', block: true, act: 'ecWithdraw' })}`;
    else if (c.status === 'Notice issued') side = `${alertBox(c.respondBy && c.respondBy < TODAY ? 'bad' : 'info', c.respondBy ? (c.respondBy < TODAY ? 'No response by the deadline' : `Waiting for a response by ${fmtD(c.respondBy)}`) : 'Issued', c.respondBy && c.respondBy < TODAY ? 'Escalate to the next action, or extend the deadline.' : '')}${btn('Send a reminder', { v: 'secondary', block: true, i: 'bell-ringing', act: 'ecRemind' })}${btn('Extend the deadline', { v: 'tertiary', block: true, act: 'ecExtend' })}${btn('Escalate', { v: 'tertiary', block: true, i: 'arrow-fat-line-up', act: 'ecEscalate', test: 'ec-escalate' })}`;
    else if (c.status === 'Response received') side = `<p class="small muted">${esc(o.name)} has ${c.response.kind === 'accept' ? 'accepted' : 'contested'}. Decide what happens next.</p>${field('Outcome', sel('ec-out', t.penalty ? ['Penalty confirmed', 'Penalty reduced', 'Penalty withdrawn'] : ['Complied', 'No further action', 'Contest upheld'], '', { attrs: 'data-test="ec-out"' }), { for: 'ec-out' })}${t.penalty ? field('Final amount (₦)', inp('ec-amt', c.penalty.amount, { type: 'number' }), { for: 'ec-amt' }) : ''}${field('Note', ta('ec-note', '', { attrs: 'rows="3" data-test="ec-note"', ph: 'Your reasons, shared with the organisation' }), { for: 'ec-note' })}${btn(t.penalty ? 'Record decision' : 'Close the case', { block: true, i: 'check-circle', act: 'ecDecide', test: 'ec-decide' })}${btn('Escalate', { v: 'secondary', block: true, i: 'arrow-fat-line-up', act: 'ecEscalate', test: 'ec-escalate' })}${btn('Extend the deadline', { v: 'tertiary', block: true, act: 'ecExtend' })}`;
    else if (c.status === 'Awaiting payment') side = `${alertBox('warn', `${naira(c.penalty.amount)} to pay`, `Due ${c.respondBy ? fmtD(c.respondBy) : ''}${c.penalty.proof ? '. Proof of payment received.' : ''}`)}${c.penalty.proof ? fileRow(c.penalty.proof[0], esc(c.penalty.proof[1])) : ''}${field('Payment reference', inp('ec-ref', c.penalty.ref || '', { ph: 'e.g. REMITA 1234 5678 9012', attrs: 'data-test="ec-ref"' }), { for: 'ec-ref' })}${btn('Record payment and close', { block: true, i: 'money', act: 'ecPaid', test: 'ec-paid' })}${btn('Escalate', { v: 'tertiary', block: true, i: 'arrow-fat-line-up', act: 'ecEscalate' })}`;
    else side = alertBox('ok', c.status, c.decision ? `${esc(c.decision.outcome)} · ${fmtD(c.decision.when)}` : '');
    return `<div class="rh">${logo(o, 48)}<div class="rh-main"><div class="overline">${esc(c.ref)} · ${esc(t.name)}</div><div class="rh-title"><h1 class="h1">${esc(o.name)}</h1>${enfChip(c.status)}</div><div class="rh-meta">Opened ${fmtD(c.opened)} by ${esc(c.by)}${c.respondBy ? ' · respond by ' + fmtD(c.respondBy) : ''}${c.penalty ? ' · penalty ' + naira(c.penalty.amount) : ''}</div></div><div class="rh-act">${btn('Open organisation', { v: 'secondary', size: 'sm', act: 'open', arg: orgGo(c.org) })}</div></div>
      <div class="grid side"><div class="col gap16">${caseBody(c, 'reg')}</div>
      <div class="col gap16"><div class="card col gap12"><div class="h4">Next step</div>${side}</div><div class="card col gap8"><div class="h4">Case</div>${kv([['Action', esc(t.name)], ['Approver', esc(c.approver)], ['Opened from', c.from === 'watchlist' ? 'Watchlist' : 'Manually'], ['Other cases', String(S.enfCases.filter(x => x.org === c.org && x.id !== c.id).length)]])}</div></div></div>`;
  }
});
function ecNotify(c, title, i, tone) { notify({ ws: 'organisation', org: c.org, i, tone, title, go: 'org/action', arg: c.id, kind: 'Approvals' }); }
ACT.ecIssue = () => { const c = caseE(S.ui.ecId); c.status = 'Notice issued'; c.issued = TODAY; if (c.type === 'referral') { c.status = 'Closed'; c.decision = { outcome: 'Referred', note: '', when: TODAY, by: c.approver }; } caseLog(c, 'Signed off and issued the notice', c.approver); ecNotify(c, `${S.tenant.short} issued a ${atOf(c.type).name.toLowerCase()} (${c.ref})`, 'gavel', 'bad'); addAudit('Issued enforcement notice', `${c.ref} · ${S.orgs[c.org].name}`); render(); toast(`Notice issued to ${esc(S.orgs[c.org].name)}`, 'ok', 'paper-plane-tilt'); };
ACT.ecWithdraw = () => { const c = caseE(S.ui.ecId); c.status = 'Withdrawn'; caseLog(c, 'Withdrawn before issue'); render(); toast('Case withdrawn'); };
ACT.ecRemind = () => { const c = caseE(S.ui.ecId); caseLog(c, 'Reminder sent'); ecNotify(c, `Reminder: respond to ${c.ref} by ${fmtD(c.respondBy)}`, 'bell-ringing', 'warn'); render(); toast('Reminder sent', 'ok', 'bell-ringing'); };
ACT.ecExtend = () => { const c = caseE(S.ui.ecId); openDialog(`${dlgHead('Extend the deadline', '', 'clock-clockwise')}<div class="col gap12" style="margin-top:16px">${field('New date', inp('ex-d', dPlus(c.respondBy && c.respondBy > TODAY ? c.respondBy : TODAY, 14), { type: 'date' }), { for: 'ex-d' })}</div><div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Extend', { act: 'ecExtendDo' })}</div>`); };
ACT.ecExtendDo = () => { const c = caseE(S.ui.ecId); c.respondBy = val('ex-d'); if (c.status === 'Response received' && !c.penalty) c.status = 'Notice issued'; caseLog(c, 'Deadline extended to ' + fmtD(c.respondBy)); ecNotify(c, `${S.tenant.short} extended the deadline for ${c.ref} to ${fmtD(c.respondBy)}`, 'clock-clockwise', 'info'); closeDialog(); render(); toast('Deadline extended'); };
ACT.ecDecide = () => { const c = caseE(S.ui.ecId); const out = val('ec-out'); const nt = val('ec-note'); if (!nt && /Contest|reduced|withdrawn/i.test(out)) { toast('Explain the decision in the note', 'bad', 'warning'); return; }
  c.decision = { outcome: out, note: nt, when: TODAY, by: persona().name };
  if (c.penalty && /confirmed|reduced/.test(out)) { c.penalty.amount = +val('ec-amt') || c.penalty.amount; c.status = 'Awaiting payment'; caseLog(c, `Penalty ${out === 'Penalty reduced' ? 'reduced to ' + naira(c.penalty.amount) : 'confirmed'}; waiting for payment`); }
  else { c.status = 'Closed'; caseLog(c, 'Closed: ' + out.toLowerCase()); }
  ecNotify(c, `${S.tenant.short} decided on ${c.ref}: ${out}`, 'gavel', 'info'); addAudit('Decided enforcement case', `${c.ref}: ${out}`); render(); toast(c.status === 'Closed' ? 'Case closed. The organisation has been told.' : 'Decision recorded. Waiting for payment.', 'ok', 'check-circle'); };
ACT.ecPaid = () => { const c = caseE(S.ui.ecId); const ref = val('ec-ref'); if (!ref) { toast('Enter the payment reference', 'bad', 'warning'); return; } Object.assign(c.penalty, { paid: true, ref, paidAt: TODAY }); c.status = 'Closed'; c.decision = Object.assign(c.decision || {}, { outcome: 'Penalty paid', when: TODAY, by: persona().name }); caseLog(c, `Payment of ${naira(c.penalty.amount)} recorded (${ref}); case closed`); ecNotify(c, `${S.tenant.short} recorded your payment for ${c.ref}. The case is closed.`, 'check-circle', 'ok'); addAudit('Recorded penalty payment', `${c.ref} · ${naira(c.penalty.amount)}`); render(); toast('Payment recorded. Case closed.', 'ok', 'money'); };
ACT.ecEscalate = () => { const c = caseE(S.ui.ecId); const t = atOf(c.type); const next = S.actionTypes.filter(a => a.level > t.level); if (!next.length) { toast('This is already the strongest action', 'info'); return; }
  openDialog(`${dlgHead('Escalate', `Close ${esc(c.ref)} as escalated and open a stronger action with the same evidence.`, 'arrow-fat-line-up', 'warn')}<div class="col gap12" style="margin-top:16px">${field('Next action', sel('es-t', next.map(a => [a.id, a.name]), next[0].id, { attrs: 'data-test="es-t"' }), { for: 'es-t' })}</div><div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Escalate', { act: 'ecEscalateDo', test: 'es-go' })}</div>`); };
ACT.ecEscalateDo = () => { const c = caseE(S.ui.ecId); const nt = val('es-t'); c.status = 'Escalated'; c.decision = { outcome: 'Escalated to ' + atOf(nt).name.toLowerCase(), note: '', when: TODAY, by: persona().name }; caseLog(c, 'Escalated to ' + atOf(nt).name.toLowerCase()); closeDialog();
  S.ui.enfDraft = { org: c.org, type: nt, ev: (c.evidence || []).map(e => Object.assign({ checked: true }, e)), respondBy: '', amount: '', edited: false }; toast('Draft the new notice, then send it for sign-off'); go('enforcement/new'); };

/* ---------- Organisation: regulatory actions ---------- */
const myEnf = () => S.enfCases.filter(c => c.org === S.orgId && c.issued);
screen('org/actions', {
  t: 'Regulatory actions', layout: 'app', ws: 'organisation', crumbs: [['Compliance', 'org/compliance'], 'Regulatory actions'],
  render() {
    const cs = myEnf().sort((a, b) => b.issued.localeCompare(a.issued));
    return `${typeof compHead === 'function' ? compHead('org/actions') : pageHead({ title: 'Regulatory actions' })}<p class="small muted">Notices from ${esc(S.tenant.short)} and what they need from you. Respond by the deadline: accept with a fix plan, or contest with documents.</p>
      <div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Notice</th><th>Issued</th><th>Respond by</th><th>Status</th><th class="act-col"></th></tr></thead><tbody>${cs.map(c => `<tr class="click" data-act="open" data-arg="org/action:${c.id}" data-test="oa-${c.id}"><td><div class="strong small">${esc(atOf(c.type).name)}</div><div class="cap mono muted">${esc(c.ref)}</div></td><td class="small">${fmtD(c.issued)}</td><td class="small">${c.respondBy ? fmtD(c.respondBy) : '—'}</td><td>${enfChip(c.status === 'Notice issued' ? 'Notice issued' : c.status)}</td><td class="act-col">${c.status === 'Notice issued' ? btn('Respond', { size: 'sm', act: 'open', arg: 'org/action:' + c.id }) : ''}</td></tr>`).join('') || `<tr><td colspan="5">${empty('gavel', 'No regulatory actions', 'Nothing here, and nothing needed.')}</td></tr>`}</tbody></table></div></div>`;
  }
});
screen('org/action', {
  t: 'Regulatory action', layout: 'app', ws: 'organisation', crumbs: () => { const c = caseE(S.ui.ecId) || myEnf()[0]; return [['Compliance', 'org/compliance'], ['Regulatory actions', 'org/actions'], c ? c.ref : '']; },
  render() {
    const c = caseE(S.ui.ecId) || myEnf()[0]; if (!c) return empty('gavel', 'No regulatory actions', ''); S.ui.ecId = c.id; const t = atOf(c.type); const r = ui('ecResp', { kind: 'accept', files: [] });
    let side;
    if (c.status === 'Notice issued' && t.days) side = `<div class="seg" role="tablist">${[['accept', 'Accept'], ['contest', 'Contest']].map(([k, l]) => `<button class="${r.kind === k ? 'on' : ''}" data-act="oaKind" data-arg="${k}" data-test="oa-kind-${k}">${l}</button>`).join('')}</div>
      ${field(r.kind === 'accept' ? 'Your fix plan' : 'Why you disagree', ta('oa-text', r.text || '', { attrs: 'rows="5" data-test="oa-text"', ph: r.kind === 'accept' ? 'What you will do, who owns it, and by when' : 'Explain, and attach your evidence' }), { for: 'oa-text' })}
      ${r.files.map(f => fileRow(f[0], esc(f[1]))).join('')}<button class="drop" data-act="oaFile" data-test="oa-file">${tile('upload-simple', '', 'sm')}<b class="small">Attach a document</b></button>
      ${btn('Send response', { block: true, i: 'paper-plane-tilt', act: 'oaSend', test: 'oa-send' })}`;
    else if (c.status === 'Awaiting payment') side = `${alertBox('warn', `Pay ${naira(c.penalty.amount)}`, `By ${c.respondBy ? fmtD(c.respondBy) : 'the deadline'}. Upload proof once paid.`)}${c.penalty.proof ? fileRow(c.penalty.proof[0], esc(c.penalty.proof[1])) : `<button class="drop" data-act="oaProof" data-test="oa-proof">${tile('upload-simple', '', 'sm')}<b class="small">Upload proof of payment</b></button>`}`;
    else if (c.status === 'Response received') side = alertBox('info', 'Response sent', `${esc(S.tenant.short)} will decide and tell you.`);
    else side = alertBox(c.status === 'Closed' ? 'ok' : 'info', c.status, c.decision ? esc(c.decision.outcome) : '');
    return `<div class="rh"><div class="rh-main"><div class="overline">${esc(c.ref)} · from ${esc(S.tenant.short)}</div><div class="rh-title"><h1 class="h1">${esc(t.name)}</h1>${enfChip(c.status)}</div><div class="rh-meta">Issued ${fmtD(c.issued)}${c.respondBy ? ' · respond by ' + fmtD(c.respondBy) : ''}${c.penalty ? ' · penalty ' + naira(c.penalty.amount) : ''}</div></div></div>
      <div class="grid side"><div class="col gap16">${caseBody(c, 'org')}</div><div class="col gap16"><div class="card col gap12"><div class="h4">${c.status === 'Notice issued' ? 'Your response' : 'Status'}</div>${side}</div></div></div>`;
  }
});
ACT.oaKind = k => { const r = ui('ecResp'); r.text = val('oa-text'); r.kind = k; render(); };
ACT.oaFile = () => { const r = ui('ecResp'); r.text = val('oa-text'); r.files.push([r.kind === 'accept' ? 'Fix plan and timeline.pdf' : 'Supporting evidence ' + (r.files.length + 1) + '.pdf', '240 KB']); render(); toast('Attached', 'ok', 'upload-simple'); };
ACT.oaSend = () => { const c = caseE(S.ui.ecId); const r = ui('ecResp'); const txt = val('oa-text'); if (!txt) { toast(r.kind === 'accept' ? 'Add your fix plan' : 'Explain why you disagree', 'bad', 'warning'); return; }
  c.response = { kind: r.kind, text: txt, files: r.files.slice(), when: TODAY, by: persona().name }; c.status = 'Response received'; caseLog(c, r.kind === 'accept' ? 'Accepted with a fix plan' : 'Contested with documents');
  notify({ ws: 'regulator', i: 'chat-circle-dots', tone: 'warn', title: `${myOrg().name} ${r.kind === 'accept' ? 'accepted' : 'contested'} ${c.ref}`, go: 'enforcement/case', arg: c.id, kind: 'Approvals' }); addAudit('Responded to enforcement notice', c.ref); S.ui.ecResp = undefined; render(); toast(`Response sent to ${esc(S.tenant.short)}`, 'ok', 'paper-plane-tilt'); };
ACT.oaProof = () => { const c = caseE(S.ui.ecId); c.penalty.proof = ['Payment receipt ' + c.ref + '.pdf', '120 KB']; caseLog(c, 'Proof of payment uploaded'); notify({ ws: 'regulator', i: 'money', tone: 'info', title: `${myOrg().name} uploaded proof of payment for ${c.ref}`, go: 'enforcement/case', arg: c.id, kind: 'Approvals' }); render(); toast('Proof of payment sent', 'ok', 'upload-simple'); };

/* ---------- Settings: action types ---------- */
screen('settings/actions', {
  t: 'Action types', layout: 'app', ws: 'regulator', crumbs: [['Settings', 'settings/categories'], 'Action types'],
  render() {
    return `${settingsHead('settings/actions', btn('Add action type', { size: 'sm', i: 'plus', act: 'atEdit', arg: '', test: 'at-add' }))}
      <div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Action</th><th class="num">Days to respond</th><th>Penalty</th><th class="num">Cases</th><th class="act-col"></th></tr></thead><tbody>${[...S.actionTypes].sort((a, b) => a.level - b.level).map(a => `<tr><td class="wrap"><div class="strong small">${esc(a.name)}</div><div class="cap muted">${esc(a.d)}</div></td><td class="num tnum">${a.days || 'No response'}</td><td>${a.penalty ? chip('Has a penalty', 'warn') : '<span class="cap muted">No</span>'}</td><td class="num tnum">${S.enfCases.filter(c => c.type === a.id).length}</td><td class="act-col">${btnIc('pencil-simple', 'atEdit', a.id, 'Edit')}</td></tr>`).join('')}</tbody></table></div><div class="tbl-foot">Ordered from mildest to strongest. Escalation moves to a stronger action.</div></div>`;
  }
});
ACT.atEdit = id => { const a = id ? atOf(id) : { id: '', name: '', d: '', days: 14, penalty: false };
  openDialog(`${dlgHead(id ? 'Edit action type' : 'Add action type', '', 'gavel')}<div class="col gap12" style="margin-top:16px">${field('Name', inp('at-n', a.name, { attrs: 'data-test="at-n"' }), { for: 'at-n' })}${field('What it means', ta('at-d', a.d, { attrs: 'rows="2"' }), { for: 'at-d' })}${field('Days to respond', inp('at-days', a.days, { type: 'number', attrs: 'min="0"' }), { for: 'at-days', hint: '0 means no response is needed.' })}${ck('at-pen', 'Carries a monetary penalty', a.penalty)}</div><div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Save', { act: 'atSave', arg: id, test: 'at-save' })}</div>`); };
ACT.atSave = id => { const n = val('at-n'); if (!n) { toast('Enter a name', 'bad', 'warning'); return; } const v = { name: n, d: val('at-d'), days: +val('at-days') || 0, penalty: !!val('at-pen') };
  if (id) Object.assign(atOf(id), v); else S.actionTypes.push(Object.assign({ id: uid('at'), level: Math.max(...S.actionTypes.map(a => a.level)) + 0.5 }, v)); addAudit(id ? 'Changed action type' : 'Added action type', n); closeDialog(); render(); toast('Saved'); };
