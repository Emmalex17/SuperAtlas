/* ================= C4 · Organisation compliance ================= */
/* The organisation's own view: status per programme, what to do next, regulatory exposure,
   and a trace from a weak section to the finding and its action plan. Peer averages are anonymised
   and shown only when the category has at least 5 organisations with results. */
const PEER_MIN = 5;
const mySeries = org => liveSeries().filter(sr => S.cases.some(c => c.org === org && progOf(c.prog).series === sr.id && c.stage === 'Published'));
function peerAvg(org, p) { const t = S.orgs[org].type; const sc = casesOf(p.id).filter(c => c.stage === 'Published' && c.score != null && S.orgs[c.org].type === t); return sc.length >= PEER_MIN ? { a: avg(sc.map(c => c.score)), n: sc.length } : { a: null, n: sc.length }; }
function peerSec(org, p, sid) { const t = S.orgs[org].type; const sc = casesOf(p.id).filter(c => c.stage === 'Published' && S.orgs[c.org].type === t); return sc.length >= PEER_MIN ? avg(sc.map(c => caseScore(c, sid)).filter(v => v != null)) : null; }

/* ---------- what to do next ---------- */
function orgTodo(org) {
  const out = []; const dd = d => d ? daysBetween(TODAY, d) : 999;
  S.cases.filter(c => c.org === org).forEach(c => { const p = progOf(c.prog);
    if (c.stage === 'Firm to choose') out.push({ i: 'handshake', t: `Choose a firm for ${p.name}`, due: c.due, go: 'org/obligations', tone: 'warn' });
    if (c.stage === 'Answering') out.push({ i: 'pencil-simple', t: `Finish answering ${p.name}`, sub: `${caseProgress(c)}% answered`, due: c.due, go: 'org/obligations', tone: 'info' });
    if (c.stage === 'In preview') out.push({ i: 'eye', t: `Look at the outcome preview for ${p.name}`, due: c.due, go: 'org/obligations', tone: 'info' }); });
  (S.filings || []).filter(f => f.org === org && tplOf(f.tpl).status === 'Active').forEach(f => {
    if (f.status === 'Queried') out.push({ i: 'chat-circle-dots', t: `Answer the query on ${tplOf(f.tpl).name} (${f.period})`, due: TODAY, go: 'org/return:' + f.id, tone: 'warn', test: 'dret-' + f.id });
    else if (!isFiled(f) && dd(f.due) <= 31) out.push({ i: 'table', t: `File ${tplOf(f.tpl).name} (${f.period})`, due: f.due, go: 'org/return:' + f.id, tone: dd(f.due) < 0 ? 'bad' : 'info', test: 'dret-' + f.id }); });
  allFindings().filter(x => x.c.org === org).forEach(x => { const f = x.f;
    if (f.status === 'Open') out.push({ i: 'flag', t: `Plan the fix: ${f.title}`, due: effDue(f), go: 'org/finding:' + f.id, tone: fdOverdue(f) ? 'bad' : 'warn', test: 'dfd-' + f.id });
    else if (f.status === 'In progress') out.push({ i: 'wrench', t: `Finish the fix: ${f.title}`, due: effDue(f), go: 'org/finding:' + f.id, tone: fdOverdue(f) ? 'bad' : 'info', test: 'dfd-' + f.id }); });
  S.enfCases.filter(c => c.org === org).forEach(c => {
    if (c.status === 'Notice issued') out.push({ i: 'gavel', t: `Respond to ${atOf(c.type).name.toLowerCase()} ${c.ref}`, due: c.respondBy, go: 'org/action:' + c.id, tone: 'bad' });
    if (c.status === 'Awaiting payment') out.push({ i: 'money', t: `Pay the penalty for ${c.ref}`, due: c.respondBy, go: 'org/action:' + c.id, tone: 'bad' }); });
  return out.sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999'));
}
const dueText = d => { if (!d) return ''; const n = daysBetween(TODAY, d); return n < 0 ? `<span style="color:var(--bad-fg)">${-n} day${n === -1 ? '' : 's'} overdue</span>` : n === 0 ? '<span style="color:var(--warn-fg)">Due today</span>' : n <= 7 ? `<span style="color:var(--warn-fg)">Due in ${n} day${n === 1 ? '' : 's'}</span>` : `Due ${fmtD(d)}`; };

/* ---------- regulatory exposure: what could draw regulator action ---------- */
function orgExposure(org) {
  const out = []; const add = (lv, t, why, go) => out.push({ lv, t, why, go });
  S.enfCases.filter(c => c.org === org && OPEN_ENF.includes(c.status) && c.issued).forEach(c => add('High', `Open regulatory notice ${c.ref}`, `${atOf(c.type).name}${c.respondBy ? ', respond by ' + fmtD(c.respondBy) : ''}`, 'org/action:' + c.id));
  allFindings().filter(x => x.c.org === org && !['Closed', 'Noted'].includes(x.f.status) && x.f.cls !== 'OFI').forEach(x => { const f = x.f; const ov = fdOverdue(f);
    if (f.cls === 'MaNC' || ov) add('High', f.title, `${fcOf(f.cls).name}${ov ? ', fix overdue' : ''} · ${progOf(x.c.prog).name}`, 'org/finding:' + f.id);
    else if (f.cls === 'MiNC') add('Medium', f.title, `Minor nonconformity, fix by ${fmtD(effDue(f))}`, 'org/finding:' + f.id);
    else add('Low', f.title, `Observation, fix by ${fmtD(effDue(f))}`, 'org/finding:' + f.id); });
  mySeries(org).forEach(sr => { const c = latestResult(org, sr.id); const st = compStatus(c); const b = +(S.compliance.bench[sr.id] ?? 70);
    if (st === 'Non-compliant') add('High', `Non-compliant in ${sr.name}`, `Score ${c.score} against a benchmark of ${b}`, 'org/compliance/programme:' + sr.id);
    else if (st === 'Compliant with conditions') add('Medium', `Compliant with conditions in ${sr.name}`, c.score < b ? `Score ${c.score} is below the benchmark of ${b}` : 'A major nonconformity is still open', 'org/compliance/programme:' + sr.id);
    progOf(c.prog).qset.sections.filter(s => s.on).forEach(s => { const v = caseScore(c, s.id); if (v != null && v < b && st !== 'Non-compliant') add('Medium', `${s.name.replace(/^\d+\.\s*/, '')} below the benchmark`, `${v} in ${progOf(c.prog).name}`, 'org/compliance/programme:' + sr.id); }); });
  (S.filings || []).filter(f => f.org === org && tplOf(f.tpl).status === 'Active').forEach(f => { const st = retStatus(f);
    if (st === 'Late') add('High', `${tplOf(f.tpl).name} (${f.period}) not filed`, 'Past the due date and the grace period', 'org/return:' + f.id);
    else if (st === 'Overdue') add('Medium', `${tplOf(f.tpl).name} (${f.period}) overdue`, 'Inside the grace period', 'org/return:' + f.id);
    else if (f.status === 'Queried') add('Medium', `Query on ${tplOf(f.tpl).name} (${f.period})`, 'Answer and resubmit', 'org/return:' + f.id); });
  const rank = { High: 0, Medium: 1, Low: 2 }; return out.sort((a, b) => rank[a.lv] - rank[b.lv]);
}
const LV_TONE = { High: 'bad', Medium: 'warn', Low: 'neu' };

/* ---------- Organisation dashboard ---------- */
function orgDashBody(o) {
  const sers = mySeries(o.id); const todo = orgTodo(o.id); const ex = orgExposure(o.id); const hi = ex.filter(e => e.lv === 'High').length;
  const card = sr => { const c = latestResult(o.id, sr.id); const b = +(S.compliance.bench[sr.id] ?? 70); const st = compStatus(c); const left = (c.findings || []).filter(NC_OPEN).length; const all = (c.findings || []).filter(f => ['MaNC', 'MiNC', 'OBS'].includes(f.cls)).length;
    return `<button class="comp-card" data-act="open" data-arg="org/compliance/programme:${sr.id}" data-test="cc-${sr.id}"><div class="row top"><span class="grow strong">${esc(sr.name)}</span>${compChip(st)}</div><div class="row" style="align-items:baseline;gap:6px"><span class="metric tnum">${c.score}</span><span class="cap muted">/ 100 · benchmark ${b} · ${esc(progOf(c.prog).cycle)}</span></div><div class="cc-bar"><i style="width:${c.score}%;background:${c.score < b ? 'var(--bad-icon)' : 'var(--brand-500)'}"></i><em style="left:${b}%"></em></div><div class="cap muted">${left ? `${left} nonconformit${left === 1 ? 'y' : 'ies'} to fix` : all ? 'All nonconformities fixed' : 'No findings'}</div></button>`; };
  return `${myHero({ ent: o, line: `Supervised by ${esc(S.tenant.short)} as <b>${esc(catLabel(o.type, o.tier))}</b>. ${sers.length ? `Overall: <b>${esc(orgOverall(o.id).toLowerCase())}</b>${hi ? `, with ${hi} high exposure item${hi === 1 ? '' : 's'}` : ''}.` : 'No published results yet.'}`, actions: heroBtn('Export scorecard', 'export', { act: 'scorecard', arg: 'org|' + o.id }) + heroBtn('Open compliance', 'shield-check', { go: 'org/compliance' }) })}
    ${setupCard(ORG_STEPS, o.onboard, 'org/welcome')}
    ${sers.length ? `<div class="row"><span class="h4 grow">Compliance</span><a href="#org/compliance" data-go="org/compliance" class="small strong">Open compliance</a></div><div class="comp-cards">${sers.map(card).join('')}</div>` : ''}
    <div class="col gap16">
      <div class="card p0 col"><div class="tbl-tools"><div class="grow"><div class="h4">Regulatory exposure</div><div class="cap muted">What could draw action from ${esc(S.tenant.short)}</div></div><a href="#org/exposure" data-go="org/exposure" class="small strong">View all</a></div><div class="list">${ex.slice(0, 6).map(e => `<button class="list-row" data-act="open" data-arg="${esc(e.go)}">${chip(e.lv, LV_TONE[e.lv])}<span class="grow" style="min-width:0"><span class="strong small ell" style="display:block">${esc(e.t)}</span><span class="cap muted ell" style="display:block">${esc(e.why)}</span></span></button>`).join('') || `<div style="padding:12px 20px">${empty('shield-check', 'Nothing exposed', 'No open findings, late returns or notices.')}</div>`}</div></div>
      ${obligationsCard()}</div>`;
}

/* ---------- Compliance pages ---------- */
function compHead(active) {
  const n = S.enfCases.filter(c => c.org === S.orgId && c.issued).length; const ex = orgExposure(S.orgId);
  return `${pageHead({ title: 'Compliance', sub: `Your status in each programme, what could draw action from ${esc(S.tenant.short)}, and any notices you have received.`, actions: btn('Export scorecard', { v: 'secondary', i: 'export', act: 'scorecard', arg: 'org|' + S.orgId, test: 'my-export' }) })}${routeTabs([['Programmes', 'org/compliance'], ['Exposure', 'org/exposure', ex.filter(e => e.lv === 'High').length || undefined], ['Regulatory actions', 'org/actions', n || undefined]], active)}`;
}
screen('org/compliance', {
  t: 'Compliance', layout: 'app', ws: 'organisation', crumbs: ['Compliance'],
  render() {
    const o = myOrg(); const sers = mySeries(o.id); const live = S.cases.filter(c => c.org === o.id && c.stage !== 'Published' && !mySeries(o.id).some(sr => sr.id === progOf(c.prog).series));
    return `${compHead('org/compliance')}<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Programme</th><th>Latest result</th><th class="num">Score</th><th class="num">Change</th><th class="num">Category average</th><th>Status</th><th>Fixes left</th></tr></thead><tbody>${sers.map(sr => { const c = latestResult(o.id, sr.id); const pv = prevResult(o.id, sr.id); const pa = peerAvg(o.id, progOf(c.prog)); const all = (c.findings || []).filter(f => ['MaNC', 'MiNC'].includes(f.cls)); const left = all.filter(NC_OPEN).length; return `<tr class="click" data-act="open" data-arg="org/compliance/programme:${sr.id}" data-test="mc-${sr.id}"><td class="strong small">${esc(sr.name)}</td><td class="small">${esc(progOf(c.prog).cycle)} · published ${esc(c.published || '')}</td><td class="num tnum strong">${c.score}</td><td class="num tnum">${pv ? `${c.score - pv.score > 0 ? '+' : ''}${c.score - pv.score}` : '—'}</td><td class="num tnum">${pa.a ?? '<span class="cap muted">Not shown</span>'}</td><td>${compChip(compStatus(c))}</td><td style="width:180px">${all.length ? progBar(pct(all.length - left, all.length), `${left} left`) : '<span class="cap muted">None</span>'}</td></tr>`; }).join('') || `<tr><td colspan="7">${empty('shield-check', 'No published results yet', 'Your status appears when your first report is published.')}</td></tr>`}</tbody></table></div><div class="tbl-foot">Category averages are anonymised and shown only when at least ${PEER_MIN} organisations in your category have results.</div></div>
      ${live.length ? `<div class="card col gap8"><div class="h4">In progress</div>${live.map(c => `<div class="row small">${tile('hourglass', '', 'sm')}<span class="grow">${esc(progOf(c.prog).name)}</span>${statusChip(c.stage)}</div>`).join('')}</div>` : ''}`;
  }
});
OPEN_HOOKS['org/compliance/programme'] = a => { S.ui.ocSer = a; };
screen('org/compliance/programme', {
  t: 'Programme compliance', layout: 'app', ws: 'organisation', crumbs: () => [['Compliance', 'org/compliance'], (S.series.find(s => s.id === S.ui.ocSer) || {}).name || 'Programme'],
  render() {
    Object.keys(DRILL).forEach(k => delete DRILL[k]);
    const o = myOrg(); const sr = S.series.find(s => s.id === S.ui.ocSer) || mySeries(o.id)[0]; if (!sr) return empty('shield-check', 'No results yet', '');
    const c = latestResult(o.id, sr.id); const p = progOf(c.prog); const b = +(S.compliance.bench[sr.id] ?? 70); const pv = prevResult(o.id, sr.id);
    const mine = S.cases.filter(x => x.org === o.id && x.stage === 'Published' && x.score != null && progOf(x.prog).series === sr.id).sort((a, x) => +progOf(a.prog).cycle - +progOf(x.prog).cycle);
    const pa = peerAvg(o.id, p); const peerPts = mine.map(x => [+progOf(x.prog).cycle, peerAvg(o.id, progOf(x.prog)).a]).filter(x => x[1] != null);
    const yrs = mine.map(x => +progOf(x.prog).cycle);
    const line = mine.length > 1 ? chLine({ w: 560, h: 220, x: { min: yrs[0] - 0.2, max: yrs[yrs.length - 1] + 0.2, ticks: yrs.map(y => [y, String(y)]) }, y: { min: 0, max: 100, ticks: [0, 50, 100] }, series: [...(peerPts.length ? [{ name: `${(allTypes().find(x => x.name === o.type) || {}).plural || o.type} average (anonymised)`, col: CH.prev, dash: true, w: 1.75, pts: peerPts, end: 'avg ' + peerPts[peerPts.length - 1][1] }] : []), { name: 'Your score', col: CH.brand, dots: true, pts: mine.map(x => [+progOf(x.prog).cycle, x.score]), end: String(c.score) }], refY: [{ v: b, label: `Benchmark ${b}` }], label: 'Your score across cycles' }) : '<p class="small muted">Your trend appears after a second cycle.</p>';
    const secs = p.qset.sections.filter(s => s.on).map(s => ({ s, v: caseScore(c, s.id), peer: peerSec(o.id, p, s.id) })).sort((a, x) => (a.v ?? 999) - (x.v ?? 999));
    const finds = c.findings || [];
    const trace = secs.map(({ s, v }) => { const reqs = s.reqs.map(r => ({ r, oc: c.outcomes[r.ref] || {}, fs: finds.filter(f => f.ref === r.ref) })); const weak = v != null && v < b; return `<details class="trace" ${weak ? 'open' : ''} data-test="tr-${s.id}"><summary><span class="grow strong small">${esc(s.name)}</span>${weak ? chip('Below benchmark', 'bad') : ''}<span class="tnum strong" style="width:40px;text-align:right">${v ?? '—'}</span>${ic('caret-down')}</summary>${reqs.map(({ r, oc, fs }) => `<div class="tr-req"><div class="row top"><span class="mono small" style="color:var(--brand-600)">${esc(r.ref)}</span><span class="grow small">${esc(r.t)}</span>${oc.o ? chip(oc.o, outTone(schemeOf(p), oc.o)) : ''}</div>${fs.map(f => `<a href="#" class="tr-f" data-act="open" data-arg="org/finding:${f.id}" data-test="trf-${f.id}">${clsChip(f.cls)}<span class="grow">${esc(f.title)}</span>${fdChip(f)}${f.plan ? `<span class="cap muted">Owner ${esc(f.plan.owner)}</span>` : f.status === 'Open' ? '<span class="cap" style="color:var(--warn-fg)">No plan yet</span>' : ''}${ic('caret-right')}</a>`).join('')}</div>`).join('')}</details>`; }).join('');
    const left = finds.filter(NC_OPEN).length;
    return `<div class="rh"><div class="rh-main"><div class="overline">Programme · ${esc(p.name)}</div><div class="rh-title"><h1 class="h1">${esc(sr.name)}</h1>${compChip(compStatus(c))}</div><div class="rh-meta">Latest result published ${esc(c.published || '')} · assessed by ${esc((S.firms[c.firm] || {}).name || '—')}</div></div><div class="rh-act">${btn('Open the report', { v: 'secondary', size: 'sm', act: 'open', arg: 'org/report:' + c.id })}</div></div>
      <div class="ktiles">${kTile('Your score', c.score, { delta: pv ? c.score - pv.score : null, vs: pv ? `vs ${esc(progOf(pv.prog).cycle)}` : '', sub: `Benchmark ${b}` })}${kTile('Category average', pa.a ?? '—', { sub: pa.a != null ? `Anonymised · ${pa.n} organisations` : `Not shown: fewer than ${PEER_MIN} in your category`, test: 'k-peer' })}${kTile('Nonconformities left', left, { sub: `${finds.filter(f => ['MaNC', 'MiNC'].includes(f.cls)).length - left} fixed and closed` })}${kTile('Sections below the benchmark', secs.filter(x => x.v != null && x.v < b).length, { sub: `of ${secs.length}` })}</div>
      <div class="ch-grid2">${chCard('oc-trend', `${c.score} in ${esc(p.cycle)}${pv ? `, ${c.score >= pv.score ? 'up' : 'down'} from ${pv.score}` : ''}`, 'Your score in each cycle, with the benchmark and the anonymised category average', line, miniTable(['Cycle', 'Your score', 'Category average'], mine.map(x => [progOf(x.prog).cycle, x.score, peerAvg(o.id, progOf(x.prog)).a ?? '—'])))}
        ${chCard('oc-secs', 'Sections against your category', 'Your section score and the anonymised category average', chDots(secs.map(x => ({ l: x.s.name, a: x.peer, b: x.v })), { min: 0, max: 100, ref: b, key: ['Category average', 'Your score'] }), null)}</div>
      <div class="card col gap12"><div><div class="h4">Trace a gap to its fix</div><div class="cap muted">Weakest sections first. Open a finding to see or update its action plan.</div></div>${trace}</div>`;
  }
});
screen('org/exposure', {
  t: 'Exposure', layout: 'app', ws: 'organisation', crumbs: [['Compliance', 'org/compliance'], 'Exposure'],
  render() {
    const ex = orgExposure(S.orgId); const lv = ui('exLv', 'all');
    const rows = ex.filter(e => lv === 'all' || e.lv === lv);
    return `${compHead('org/exposure')}<div class="card p0">${fpills([['all', 'All', ex.length, 'ex-all'], ...['High', 'Medium', 'Low'].map(l => [l, l, ex.filter(e => e.lv === l).length, 'ex-' + l, l === 'High' ? 'bad' : l === 'Medium' ? 'warn' : ''])], lv, 'exLv')}<div class="list">${rows.map(e => `<button class="list-row" data-act="open" data-arg="${esc(e.go)}">${chip(e.lv, LV_TONE[e.lv])}<span class="grow" style="min-width:0"><span class="strong small" style="display:block">${esc(e.t)}</span><span class="cap muted">${esc(e.why)}</span></span>${ic('caret-right')}</button>`).join('') || `<div style="padding:16px 20px">${empty('shield-check', 'Nothing here', '')}</div>`}</div><div class="tbl-foot">High: likely to draw action now. Medium: will if left. Low: worth watching.</div></div>`;
  }
});
ACT.exLv = l => { S.ui.exLv = l; render(); };
