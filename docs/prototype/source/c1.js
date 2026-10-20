/* ================= C1 · Programme analytics (regulator) ================= */
/* An Analytics tab on each programme: Progress, Results, Sections, Over time, Remediation.
   Same filter bar on every tab: cycle, compare-to cycle, category, firm. Every mark opens the organisations behind it. */
const AN_TABS = [['progress', 'Progress'], ['results', 'Results'], ['sections', 'Sections'], ['time', 'Over time'], ['remediation', 'Remediation']];
const DONE_ASSESS = ['Signed off', 'Report submitted', 'In review', 'Returned', 'Approved', 'Scheduled', 'Held back', 'Published'];
const DONE_REVIEW = ['Approved', 'Scheduled', 'Held back', 'Published'];
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const avg = xs => xs.length ? Math.round(xs.reduce((a, v) => a + v, 0) / xs.length) : null;
const daysFrom = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const orgGo = o => `organisations/profile:${o}|overview`;
const hasResults = p => casesOf(p.id).some(c => c.stage === 'Published');

function anFilter(p) {
  const f = ui('anF', { cat: 'all', firm: 'all', cmp: 'auto' });
  const cyc = cyclesOf(p.series); const older = cyc.filter(c => c.id !== p.id && +c.cycle < +p.cycle && c.status !== 'Draft');
  const cmp = f.cmp === 'auto' ? older[0] : f.cmp === 'none' ? null : cyc.find(c => c.id === f.cmp) || null;
  const keep = c => (f.cat === 'all' || S.orgs[c.org].type === f.cat) && (f.firm === 'all' || c.firm === f.firm);
  return { f, cyc, cmp, keep, cs: casesOf(p.id).filter(keep), cc: cmp ? casesOf(cmp.id).filter(keep) : [] };
}
function anBar(p, A) {
  const types = [...new Set([...casesOf(p.id), ...A.cc].map(c => S.orgs[c.org].type))].sort();
  const firms = [...new Set(casesOf(p.id).map(c => c.firm).filter(Boolean))];
  const sel_ = (id, label, opts, v, ch) => `<label class="row gap6">${label}${sel(id, opts, v, { attrs: `data-change="${ch}" aria-label="${label}" data-test="${id}"` })}</label>`;
  return `<div class="abar" data-test="an-bar">${sel_('an-cycle', 'Cycle', A.cyc.filter(c => c.status !== 'Draft').map(c => [c.id, c.cycle + (c.status === 'Open' ? ' (open)' : '')]), p.id, 'anCycle')}${sel_('an-cmp', 'Compare with', [['auto', A.cmp && A.f.cmp === 'auto' ? `${A.cmp.cycle} (previous)` : 'Previous cycle'], ['none', 'No comparison'], ...A.cyc.filter(c => c.id !== p.id && c.status !== 'Draft').map(c => [c.id, c.cycle])], A.f.cmp, 'anCmp')}${sel_('an-cat', 'Category', [['all', 'All categories'], ...types.map(t => [t, t])], A.f.cat, 'anCat')}${sel_('an-firm', 'Firm', [['all', 'All firms'], ...firms.map(id => [id, S.firms[id].name])], A.f.firm, 'anFirm')}<span class="grow"></span>${btn('Export', { v: 'tertiary', size: 'sm', i: 'export', act: 'savedToast', arg: 'Export started. You will get an email with the CSV and charts.' })}</div>`;
}
ACT.anCycle = v => { S.ui.progId = v; render(); };
ACT.chg_anCycle = v => ACT.anCycle(v);
ACT.chg_anCmp = v => { ui('anF').cmp = v; render(); };
ACT.chg_anCat = v => { ui('anF').cat = v; render(); };
ACT.chg_anFirm = v => { ui('anF').firm = v; render(); };
ACT.anTab = t => { S.ui.anTab = t; render(); };

function progAnalytics(p) {
  Object.keys(DRILL).forEach(k => delete DRILL[k]);
  const A = anFilter(p);
  const tab = S.ui.anTab || (p.status === 'Open' ? 'progress' : 'results');
  const needsRes = ['results', 'sections', 'remediation'].includes(tab) && !hasResults(p);
  let body;
  if (needsRes) { const last = A.cyc.find(c => hasResults(c)); body = `<div class="card">${empty('chart-bar', `No results published for ${esc(p.cycle)} yet`, p.status === 'Open' ? 'Results appear here as reports are published. Progress shows how this cycle is going.' : 'Publish reports to see results.', last ? btn(`View ${esc(last.cycle)} results`, { v: 'secondary', act: 'anCycle', arg: last.id, test: 'an-last' }) : '')}</div>`; }
  else body = { progress: anProgress, results: anResults, sections: anSections, time: anTime, remediation: anRemediation }[tab](p, A);
  return `${anBar(p, A)}<div class="seg an-tabs" role="tablist" aria-label="Analytics">${AN_TABS.map(([k, l]) => `<button class="${tab === k ? 'on' : ''}" data-act="anTab" data-arg="${k}" data-test="an-${k}">${l}</button>`).join('')}</div>${body}`;
}

/* ---------- Progress: who has submitted, how fast, compared with last cycle ---------- */
function anProgress(p, A) {
  const cs = A.cs; const n = cs.length; const win = daysFrom(p.opens, p.closes); const live = p.status === 'Open';
  const day = live ? Math.max(0, Math.min(win, daysFrom(p.opens, TODAY))) : win; const left = daysFrom(TODAY, p.closes);
  const sub = cs.filter(isSubmitted); const notSub = cs.filter(c => !isSubmitted(c));
  const subBy = (list, open, d) => list.filter(c => c.subDate && daysFrom(open, c.subDate) <= d).length;
  const prevAt = A.cmp ? pct(subBy(A.cc, A.cmp.opens, day), A.cc.length) : null;
  const curPct = pct(sub.length, n);
  const row = c => ({ org: c.org, sub: `${S.firms[c.firm] ? esc(S.firms[c.firm].name) : 'Needs a firm'} · ${caseProgress(c)}% answered`, chip: statusChip(c.stage), go: orgGo(c.org) });
  const kSub = drillKey('Submitted', `${esc(p.name)}`, sub.map(row)); const kNot = drillKey('Not submitted yet', esc(p.name), notSub.map(row));
  const grp = [['In scope', cs], ['Firm in place', cs.filter(c => stageGroup(c.stage) !== 'Needs a firm')], ['Started answering', cs.filter(c => Object.keys(c.answers || {}).length || isSubmitted(c))], ['Submitted', sub], ['Assessed by the firm', cs.filter(c => DONE_ASSESS.includes(c.stage))], ['Reviewed by ' + S.tenant.short, cs.filter(c => DONE_REVIEW.includes(c.stage))], ['Published', cs.filter(c => c.stage === 'Published')]];
  const funnel = chFunnel(grp.map(([l, list]) => ({ l, n: list.length, drill: drillKey(l, esc(p.name), list.map(row)) })));
  /* cumulative share submitted by day since opening */
  const curve = (list, open, upto) => { const pts = []; for (let d = 0; d <= upto; d += 2) pts.push([d, pct(subBy(list, open, d), list.length)]); if (pts[pts.length - 1][0] !== upto) pts.push([upto, pct(subBy(list, open, upto), list.length)]); return pts; };
  const series = [{ name: `${p.cycle}`, col: CH.brand, pts: curve(cs, p.opens, day), end: `${curPct}%` }];
  if (A.cmp) series.unshift({ name: `${A.cmp.cycle}`, col: CH.prev, dash: true, w: 1.75, pts: curve(A.cc, A.cmp.opens, daysFrom(A.cmp.opens, A.cmp.closes)) });
  const ticks = []; for (let d = 0; d <= win; d += 14) ticks.push([d, `Day ${d}`]);
  const line = chLine({ w: 560, h: 240, x: { min: 0, max: win, ticks }, y: { min: 0, max: 100, ticks: [0, 25, 50, 75, 100], unit: '%' }, series, refX: [...(live ? [{ v: day, label: 'Today', col: CH.brand }] : []), { v: win, label: 'Due', col: CH.bad }], label: 'Share of organisations submitted by day' });
  const lineTitle = live ? `${sub.length} of ${n} submitted, ${left} days before the deadline` : `${sub.length} of ${n} submitted by the deadline`;
  const lineSub = A.cmp ? `Share submitted by day since opening · ${esc(A.cmp.cycle)} had ${prevAt}% by day ${day}` : 'Share submitted by day since opening';
  const types = [...new Set(cs.map(c => S.orgs[c.org].type))];
  const byCat = chStack(types.map(t => { const l = cs.filter(c => S.orgs[c.org].type === t); const s = l.filter(isSubmitted); return { l: t, vals: [{ n: s.length, drill: drillKey(`${t}: submitted`, '', s.map(row)) }, { n: l.length - s.length, drill: drillKey(`${t}: not submitted`, '', l.filter(c => !isSubmitted(c)).map(row)) }], total: `${pct(s.length, l.length)}%` }; }), [{ l: 'Submitted', col: CH.brand }, { l: 'Not submitted', col: 'var(--neu-strong)', ink: 'var(--text)' }]);
  const late = notSub.filter(c => c.due < TODAY);
  return `<div class="ktiles">${kTile('In scope', n, { sub: `${A.f.cat === 'all' ? 'All categories' : esc(A.f.cat)}`, drill: grp[0] && drillKey('In scope', esc(p.name), cs.map(row)), test: 'k-scope' })}${kTile('Submitted', `${sub.length}<small> · ${curPct}%</small>`, { delta: prevAt == null ? null : curPct - prevAt, unit: ' pts', vs: `vs ${esc(A.cmp ? A.cmp.cycle : '')} at this point`, drill: kSub, test: 'k-sub' })}${kTile('Not submitted yet', notSub.length, { sub: late.length ? `${late.length} past the deadline` : 'None late', drill: kNot, test: 'k-not' })}${kTile(live ? 'Days to the deadline' : 'Window', live ? Math.max(0, left) : `${win} days`, { sub: `Due ${fmtD(p.closes)}` })}</div>
    <div class="ch-grid2">${chCard('prog-line', lineTitle, lineSub, line, miniTable(['Day', `${p.cycle} submitted`, ...(A.cmp ? [`${A.cmp.cycle} submitted`] : [])], series[series.length - 1].pts.filter((x, i) => i % 3 === 0).map(([d, v]) => [`Day ${d}`, v + '%', ...(A.cmp ? [pct(subBy(A.cc, A.cmp.opens, d), A.cc.length) + '%'] : [])])))}
      ${chCard('prog-funnel', `${grp[6][1].length ? grp[6][1].length + ' published' : 'Nothing published yet'}; ${grp[1][1].length} of ${n} have a firm in place`, 'From scoped to published · click a stage to see who', funnel, miniTable(['Stage', 'Organisations'], grp.map(([l, list]) => [esc(l), list.length])))}</div>
    <div class="ch-grid2">${chCard('prog-cat', 'Submission by category', 'Click a bar to see who', byCat, null)}
      <div class="card p0 col"><div class="tbl-tools"><div class="grow"><div class="h4">Not submitted yet</div><div class="cap muted">${notSub.length} organisation${notSub.length === 1 ? '' : 's'} · newest stage first</div></div>${live && notSub.length ? btn(`Remind all (${notSub.length})`, { v: 'secondary', size: 'sm', i: 'bell-ringing', act: 'anRemind', arg: p.id, test: 'an-remind' }) : ''}</div>
        <div class="tbl-wrap" style="max-height:330px;overflow:auto"><table class="tbl"><tbody>${notSub.sort((a, b) => caseProgress(b) - caseProgress(a)).map(c => `<tr class="click" data-act="open" data-arg="${orgGo(c.org)}"><td>${orgCell(S.orgs[c.org], S.firms[c.firm] ? S.firms[c.firm].name : 'Needs a firm')}</td><td>${statusChip(c.stage)}</td><td style="width:120px;padding-right:20px">${progBar(caseProgress(c))}</td></tr>`).join('') || `<tr><td>${empty('check-circle', 'Everyone has submitted', '')}</td></tr>`}</tbody></table></div></div></div>`;
}
ACT.anRemind = pid => { const p = progOf(pid); const A = anFilter(p); const list = A.cs.filter(c => !isSubmitted(c)); list.forEach(c => { c.reminders = (c.reminders || 0) + 1; notify({ ws: 'organisation', org: c.org, i: 'bell-ringing', tone: 'warn', title: `${S.tenant.short} reminded you: ${p.name} is due ${fmtD(p.closes)}`, go: 'org/obligations', kind: 'Reminders' }); }); progActivity(p, persona().name, `reminded ${list.length} organisations that have not submitted`); addAudit('Sent programme reminders', `${p.name} · ${list.length} organisations`); toast(`Reminders sent to ${list.length} organisations`, 'ok', 'bell-ringing'); };

/* ---------- Results: scores, benchmark, status ---------- */
function anResults(p, A) {
  const b = benchOf(p); const pub = A.cs.filter(c => c.stage === 'Published' && c.score != null); const prevPub = A.cc.filter(c => c.stage === 'Published' && c.score != null);
  const prevOf = org => (prevPub.find(c => c.org === org) || {}).score;
  const st = c => compStatus(c); const row = c => ({ org: c.org, sub: `Score ${c.score}${prevOf(c.org) != null ? ` (was ${prevOf(c.org)})` : ''}`, chip: compChip(st(c)), go: orgGo(c.org) });
  const met = pub.filter(c => c.score >= b); const nonc = pub.filter(c => st(c) === 'Non-compliant');
  const pMet = pct(met.length, pub.length), ppMet = pct(prevPub.filter(c => c.score >= b).length, prevPub.length);
  const bins = [[0, 49, '0–49'], [50, 59, '50–59'], [60, 69, '60–69'], [70, 79, '70–79'], [80, 89, '80–89'], [90, 100, '90–100']];
  const refAt = bins.findIndex(x => b >= x[0] && b <= x[1]);
  const hist = chColumns({ bins: bins.map(([lo, hi, l]) => { const list = pub.filter(c => c.score >= lo && c.score <= hi); return { l, n: list.length, col: hi < b ? 'var(--bad-icon)' : 'var(--brand-500)', drill: drillKey(`Score ${l}`, esc(p.name), list.map(row)) }; }), refAt, refLabel: `Benchmark ${b}` });
  const stParts = COMP_ST.slice(0, 3).map(s => ({ l: s, col: s === 'Compliant' ? CH.ok : s === 'Non-compliant' ? CH.bad : CH.warn }));
  const types = [...new Set(pub.map(c => S.orgs[c.org].type))];
  const stRows = [{ l: 'All organisations', vals: COMP_ST.slice(0, 3).map(s => { const l = pub.filter(c => st(c) === s); return { n: l.length, drill: drillKey(s, esc(p.name), l.map(row)) }; }), total: pub.length }, ...types.map(t => ({ l: t, vals: COMP_ST.slice(0, 3).map(s => { const l = pub.filter(c => S.orgs[c.org].type === t && st(c) === s); return { n: l.length, drill: drillKey(`${t}: ${s}`, '', l.map(row)) }; }), total: pub.filter(c => S.orgs[c.org].type === t).length }))];
  const sorted = [...pub].sort((a, c) => c.score - a.score);
  return `<div class="ktiles">${kTile('Scoped', A.cs.length, { delta: A.cmp ? A.cs.length - A.cc.length : null, vs: `vs ${esc(A.cmp ? A.cmp.cycle : '')}`, test: 'k-scoped' })}${kTile('Completed (published)', pub.length, { delta: A.cmp ? pub.length - prevPub.length : null, vs: `vs ${esc(A.cmp ? A.cmp.cycle : '')}`, drill: drillKey('Completed', esc(p.name), pub.map(row)), test: 'k-done' })}${kTile(`Met the benchmark (${b})`, `${met.length}<small> · ${pMet}%</small>`, { delta: A.cmp && prevPub.length ? pMet - ppMet : null, unit: ' pts', vs: `vs ${esc(A.cmp ? A.cmp.cycle : '')}`, drill: drillKey(`Met the benchmark (${b})`, esc(p.name), met.map(row)), test: 'k-met' })}${kTile('Non-compliant', nonc.length, { delta: A.cmp ? nonc.length - prevPub.filter(c => st(c) === 'Non-compliant').length : null, goodUp: false, vs: `vs ${esc(A.cmp ? A.cmp.cycle : '')}`, drill: drillKey('Non-compliant', esc(p.name), nonc.map(row)), test: 'k-nonc' })}</div>
    <div class="ch-grid2">${chCard('res-hist', `${met.length} of ${pub.length} met the benchmark of ${b}; average score ${avg(pub.map(c => c.score)) ?? '—'}`, 'Organisations by score · click a bar to see who', hist, miniTable(['Score', 'Organisations'], bins.map(([lo, hi, l]) => [l, pub.filter(c => c.score >= lo && c.score <= hi).length])))}
      ${chCard('res-status', `${nonc.length} non-compliant, ${pub.filter(c => st(c) === 'Compliant with conditions').length} compliant with conditions`, 'Compliance status now, after fixes closed since publishing', chStack(stRows, stParts), miniTable(['Group', ...stParts.map(x => x.l)], stRows.map(r => [esc(r.l), ...r.vals.map(v => v.n)])))}</div>
    <div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Results</div><div class="cap muted">${pub.length} published · sorted by score</div></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Firm</th><th class="num">Score</th><th class="num">Change</th><th>Status</th><th class="num">Open findings</th></tr></thead><tbody>${sorted.map(c => { const pv = prevOf(c.org); const d = pv == null ? null : c.score - pv; const open = (c.findings || []).filter(f => !['Closed', 'Noted'].includes(f.status)).length; return `<tr class="click" data-act="open" data-arg="${orgGo(c.org)}"><td>${orgCell(S.orgs[c.org], catLabel(S.orgs[c.org].type, S.orgs[c.org].tier))}</td><td class="small">${esc((S.firms[c.firm] || {}).name || '—')}</td><td class="num tnum strong" style="color:${c.score < b ? 'var(--bad-fg)' : 'inherit'}">${c.score}</td><td class="num tnum">${d == null ? '<span class="muted">new</span>' : `<span style="color:${d >= 0 ? 'var(--ok-fg)' : 'var(--bad-fg)'}">${d > 0 ? '+' : ''}${d}</span>`}</td><td>${compChip(st(c))}</td><td class="num tnum">${open || '—'}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}

/* ---------- Sections: where the sector is weak ---------- */
function anSections(p, A) {
  const pub = A.cs.filter(c => c.stage === 'Published'); const reqs = qsetReqs(p.qset); const secs = p.qset.sections.filter(s => s.on);
  const CLS = S.findingClasses.map(f => f.code); const colOf = { MaNC: CH.bad, MiNC: CH.warn, OBS: CH.brand, OFI: CH.neu };
  const who = (filterFn) => pub.filter(c => (c.findings || []).some(filterFn));
  const row = (c, ref) => ({ org: c.org, sub: (c.findings || []).filter(f => !ref || f.ref === ref).map(f => esc(f.cls) + ': ' + esc(f.title)).join(' · ').slice(0, 140), chip: compChip(compStatus(c)), go: orgGo(c.org) });
  const rows = []; secs.forEach(s => { const sreqs = s.reqs.map(r => r.ref);
    rows.push({ sec: true, key: s.id, l: s.name, cells: CLS.map(k => { const l = who(f => f.cls === k && sreqs.includes(f.ref)); return { n: l.length, drill: drillKey(`${s.name}: ${k}`, esc(fcOf(k).name), l.map(c => row(c))) }; }) });
    s.reqs.forEach(r => rows.push({ key: r.ref, l: r.ref + ' ' + r.t, lh: `<span class="mono">${esc(r.ref)}</span> ${esc(r.t)}`, t: r.t, cells: CLS.map(k => { const l = who(f => f.cls === k && f.ref === r.ref); return { n: l.length, drill: drillKey(`${r.ref} ${r.t}: ${k}`, esc(fcOf(k).name), l.map(c => row(c, r.ref))) }; }) })); });
  const heat = chHeat({ cols: CLS.map(k => ({ l: k, t: fcOf(k).name, col: colOf[k] || CH.brand })), rows });
  const secRows = rows.filter(r => r.sec); const topN = Math.max(0, ...secRows.map(r => r.cells[0].n)); const tops = secRows.filter(r => r.cells[0].n === topN).map(r => r.l.replace(/^\d+\.\s*/, ''));
  const worst = topN ? { l: tops.join(' and '), cells: [{ n: topN }] } : null;
  /* outcome mix per section */
  const parts = [{ l: 'Compliant', col: CH.ok }, { l: 'Partially compliant', col: CH.warn }, { l: 'Non-compliant', col: CH.bad }];
  const mix = secs.map(s => ({ l: s.name, vals: parts.map(pt => { const l = pub.filter(c => s.reqs.some(r => (c.outcomes[r.ref] || {}).o === pt.l)); const n = pub.reduce((a, c) => a + s.reqs.filter(r => (c.outcomes[r.ref] || {}).o === pt.l).length, 0); return { n, drill: drillKey(`${s.name}: ${pt.l}`, 'Organisations with at least one requirement at this outcome', l.map(c => row(c))) }; }), total: avg(pub.map(c => caseScore(c, s.id)).filter(v => v != null)) }));
  /* top gaps: requirements with the most organisations holding a nonconformity */
  const gaps = reqs.map(r => { const l = who(f => f.ref === r.ref && ['MaNC', 'MiNC'].includes(f.cls)); return { r, l }; }).filter(x => x.l.length).sort((a, b) => b.l.length - a.l.length).slice(0, 10);
  return `${chCard('sec-heat', worst && worst.cells[0].n ? `${esc(worst.l)} ${tops.length > 1 ? 'have' : 'has'} the most major nonconformities: ${worst.cells[0].n} organisations${tops.length > 1 ? ' each' : ''}` : 'Findings by section and class', `Number of organisations with a finding · ${pub.length} published reports in ${esc(p.cycle)} · click a cell to see who`, heat, null, { foot: `${CLS.map(k => `${k} ${esc(fcOf(k).name.toLowerCase())}`).join(' · ')}` })}
    <div class="ch-grid2">${chCard('sec-gaps', gaps.length ? `${esc(gaps[0].r.t)} is the most common gap (${gaps[0].l.length} organisations)` : 'No nonconformities', 'Requirements ranked by organisations with a major or minor nonconformity', chBars(gaps.map(g => ({ l: g.r.ref + ' ' + g.r.t, lh: `<span class="mono small">${esc(g.r.ref)}</span> ${esc(g.r.t)}`, v: g.l.length, col: CH.bad, drill: drillKey(`${g.r.ref} ${g.r.t}`, 'Major or minor nonconformity', g.l.map(c => row(c, g.r.ref))) }))), miniTable(['Requirement', 'Organisations'], gaps.map(g => [esc(g.r.ref + ' ' + g.r.t), g.l.length])))}
      ${chCard('sec-mix', 'Outcomes by section', 'Requirement outcomes across all published reports · right: average section score', chStack(mix, parts), miniTable(['Section', ...parts.map(x => x.l), 'Average score'], mix.map(m => [esc(m.l), ...m.vals.map(v => v.n), m.total ?? '—'])))}</div>`;
}

/* ---------- Over time: across cycles ---------- */
function anTime(p, A) {
  const cyc = A.cyc.filter(c => hasResults(c)).sort((a, b) => +a.cycle - +b.cycle);
  if (cyc.length < 2) return `<div class="card">${empty('chart-line-up', 'Trends appear after the second cycle', 'There is only one cycle with published results so far.')}</div>`;
  const b = benchOf(p); const pubOf = c => casesOf(c.id).filter(x => x.stage === 'Published' && x.score != null && A.keep(x));
  const avgPts = cyc.map((c, i) => [i, avg(pubOf(c).map(x => x.score))]); const metPts = cyc.map((c, i) => [i, pct(pubOf(c).filter(x => x.score >= b).length, pubOf(c).length)]);
  const xt = cyc.map((c, i) => [i, c.cycle]);
  const l1 = chLine({ w: 460, h: 210, x: { min: -0.2, max: cyc.length - 0.8, ticks: xt }, y: { min: 0, max: 100, ticks: [0, 50, 100] }, series: [{ name: 'Average score', col: CH.brand, pts: avgPts, dots: true, end: String(avgPts[avgPts.length - 1][1]) }], refY: [{ v: b, label: `Benchmark ${b}` }], label: 'Average score per cycle' });
  const l2 = chLine({ w: 460, h: 210, x: { min: -0.2, max: cyc.length - 0.8, ticks: xt }, y: { min: 0, max: 100, ticks: [0, 50, 100], unit: '%' }, series: [{ name: 'Met the benchmark', col: CH.ok, pts: metPts, dots: true, end: metPts[metPts.length - 1][1] + '%' }], label: 'Share meeting the benchmark per cycle' });
  /* section change and per-organisation change between the compare cycle and this one */
  const base = A.cmp && hasResults(A.cmp) ? A.cmp : cyc[cyc.length - 2]; const top = hasResults(p) ? p : cyc[cyc.length - 1];
  const bc = pubOf(base), tc = pubOf(top); const secs = top.qset.sections.filter(s => s.on);
  const secRows = secs.map(s => ({ l: s.name, a: avg(bc.map(c => caseScore(c, s.id)).filter(v => v != null)), b: avg(tc.map(c => caseScore(c, s.id)).filter(v => v != null)) }));
  const both = tc.filter(c => bc.some(x => x.org === c.org)).map(c => ({ l: S.orgs[c.org].name, a: bc.find(x => x.org === c.org).score, b: c.score, go: orgGo(c.org) })).sort((x, y) => (x.b - x.a) - (y.b - y.a));
  const showAll = S.ui.anAllOrgs; const shown = showAll ? both : both.slice(0, 10);
  /* repeat findings: the same requirement failed by the same organisation in both cycles */
  const nc = f => ['MaNC', 'MiNC'].includes(f.cls);
  const reps = top.qset.sections.filter(s => s.on).flatMap(s => s.reqs).map(r => { const orgs = tc.filter(c => (c.findings || []).some(f => nc(f) && f.ref === r.ref) && bc.some(x => x.org === c.org && (x.findings || []).some(f => nc(f) && f.ref === r.ref))); return { r, orgs }; }).filter(x => x.orgs.length).sort((a, b2) => b2.orgs.length - a.orgs.length);
  const drop = both.filter(x => x.b < x.a).length;
  return `<div class="ch-grid2">${chCard('time-avg', `Average score ${avgPts[0][1]} → ${avgPts[avgPts.length - 1][1]} across ${cyc.length} cycles`, 'Average score of published reports per cycle', l1, miniTable(['Cycle', 'Average score'], cyc.map((c, i) => [c.cycle, avgPts[i][1]])))}${chCard('time-met', `${metPts[metPts.length - 1][1]}% met the benchmark in ${esc(cyc[cyc.length - 1].cycle)}, from ${metPts[0][1]}% in ${esc(cyc[0].cycle)}`, `Share of organisations scoring ${b} or more`, l2, miniTable(['Cycle', 'Met the benchmark'], cyc.map((c, i) => [c.cycle, metPts[i][1] + '%'])))}</div>
    <div class="ch-grid2">${chCard('time-sec', `Section scores, ${esc(base.cycle)} → ${esc(top.cycle)}`, 'Average section score in each cycle', chDots(secRows, { min: 0, max: 100, ref: b, key: [base.cycle, top.cycle] }), miniTable(['Section', base.cycle, top.cycle], secRows.map(r => [esc(r.l), r.a ?? '—', r.b ?? '—'])))}
      ${chCard('time-org', `${drop} of ${both.length} organisations scored lower than in ${esc(base.cycle)}`, `Score in ${esc(base.cycle)} and ${esc(top.cycle)} · biggest drops first · click to open`, chDots(shown, { min: 0, max: 100, ref: b, key: [base.cycle, top.cycle] }) + (both.length > 10 ? `<button class="link-btn small" data-act="anAllOrgs">${showAll ? 'Show the first 10' : `Show all ${both.length}`}</button>` : ''), miniTable(['Organisation', base.cycle, top.cycle], both.map(x => [esc(x.l), x.a, x.b])))}</div>
    ${chCard('time-rep', reps.length ? `${reps.reduce((a, x) => a + x.orgs.length, 0)} repeat findings: the same gap in ${esc(base.cycle)} and ${esc(top.cycle)}` : 'No repeat findings', 'A major or minor nonconformity on the same requirement in both cycles is the strongest sign a fix did not hold', chBars(reps.map(x => ({ l: x.r.ref + ' ' + x.r.t, lh: `<span class="mono small">${esc(x.r.ref)}</span> ${esc(x.r.t)}`, v: x.orgs.length, col: CH.ai, drill: drillKey(`Repeat: ${x.r.ref} ${x.r.t}`, `Nonconformity in ${esc(base.cycle)} and ${esc(top.cycle)}`, x.orgs.map(c => ({ org: c.org, sub: `Score ${c.score}`, chip: compChip(compStatus(c)), go: orgGo(c.org) }))) }))) || '<p class="small muted">None.</p>', miniTable(['Requirement', 'Organisations'], reps.map(x => [esc(x.r.ref + ' ' + x.r.t), x.orgs.length])))}`;
}
ACT.anAllOrgs = () => { S.ui.anAllOrgs = !S.ui.anAllOrgs; render(); };

/* ---------- Remediation: are fixes being made? ---------- */
function anRemediation(p, A) {
  const pub = A.cs.filter(c => c.stage === 'Published'); const all = pub.flatMap(c => (c.findings || []).filter(f => f.cls !== 'OFI').map(f => ({ f, c })));
  const closed = all.filter(x => x.f.status === 'Closed'); const open = all.filter(x => !['Closed', 'Noted'].includes(x.f.status)); const over = open.filter(x => fdOverdue(x.f));
  const pubISO = (() => { const d = new Date((pub[0] || {}).published || p.closes); return isNaN(d) ? p.closes : d.toISOString().slice(0, 10); })();
  const closeDate = x => x.f.closedDate || (x.f.closed && x.f.closed.when ? new Date(x.f.closed.when).toISOString().slice(0, 10) : null);
  const days = closed.map(x => closeDate(x) ? daysFrom(pubISO, closeDate(x)) : null).filter(v => v != null && v >= 0);
  const row = x => ({ org: x.c.org, sub: `${esc(x.f.cls)}: ${esc(x.f.title)}`, chip: typeof fdChip === 'function' ? fdChip(x.f) : statusChip(x.f.status), go: `findings/view:${x.f.id}` });
  /* cumulative closed by month since publishing */
  const months = Math.max(1, Math.min(20, Math.ceil(daysFrom(pubISO, TODAY) / 30)));
  const pts = []; for (let m = 0; m <= months; m++) pts.push([m, closed.filter(x => closeDate(x) && daysFrom(pubISO, closeDate(x)) <= m * 30).length]);
  const line = chLine({ w: 560, h: 230, x: { min: 0, max: months, ticks: pts.filter(([m]) => m % Math.max(1, Math.ceil(months / 8)) === 0).map(([m]) => [m, `Month ${m}`]) }, y: { min: 0, max: Math.max(4, all.length), ticks: [0, Math.round(all.length / 2), all.length] }, series: [{ name: 'Closed', col: CH.ok, pts, end: `${closed.length} closed` }], refY: [{ v: all.length, label: `${all.length} raised`, col: CH.quiet }], label: 'Findings closed since publishing' });
  const cls = ['MaNC', 'MiNC', 'OBS'];
  const byCls = cls.map(k => { const l = over.filter(x => x.f.cls === k); return { l: `${k} · ${fcOf(k).name}`, v: l.length, col: k === 'MaNC' ? CH.bad : k === 'MiNC' ? CH.warn : CH.brand, drill: drillKey(`Overdue: ${k}`, esc(fcOf(k).name), l.map(row)) }; });
  const firms = [...new Set(all.map(x => x.c.firm))].filter(Boolean);
  const byFirm = firms.map(id => { const l = all.filter(x => x.c.firm === id); const cl = l.filter(x => x.f.status === 'Closed'); const d = cl.map(x => closeDate(x) ? daysFrom(pubISO, closeDate(x)) : null).filter(v => v != null); return { id, n: l.length, cl: cl.length, d: avg(d) }; }).sort((a, b) => b.n - a.n);
  return `<div class="ktiles">${kTile('Findings raised', all.length, { sub: 'Not counting opportunities for improvement', drill: drillKey('Findings raised', esc(p.name), all.map(row)), test: 'k-raised' })}${kTile('Closed', `${closed.length}<small> · ${pct(closed.length, all.length)}%</small>`, { sub: 'Verified by the firm and closed', drill: drillKey('Closed', esc(p.name), closed.map(row)), test: 'k-closed' })}${kTile('Still open', open.length, { sub: `${over.length} overdue`, drill: drillKey('Still open', esc(p.name), open.map(row)), test: 'k-open' })}${kTile('Average days to close', avg(days) ?? '—', { sub: 'From publishing to closing' })}</div>
    <div class="ch-grid2">${chCard('rem-line', `${closed.length} of ${all.length} findings closed since ${esc(fmtD(pubISO))}`, 'Cumulative findings closed by month since the reports were published', line, miniTable(['Month', 'Closed'], pts.map(([m, v]) => [`Month ${m}`, v])))}
      ${chCard('rem-over', over.length ? `${over.length} fixes are overdue` : 'No overdue fixes', 'Open findings past their fix-by date, by class · click to see which', chBars(byCls), miniTable(['Class', 'Overdue'], byCls.map(x => [esc(x.l), x.v])))}</div>
    <div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">By firm</div><div class="cap muted">The firm that raised the findings verifies the fixes</div></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Firm</th><th class="num">Findings</th><th>Closed</th><th class="num">Average days to close</th></tr></thead><tbody>${byFirm.map(r => `<tr class="click" data-act="open" data-arg="firms/profile:${r.id}|overview"><td>${orgCell(S.firms[r.id], S.firms[r.id].types.join(' · '))}</td><td class="num tnum">${r.n}</td><td style="width:220px">${progBar(pct(r.cl, r.n), `${r.cl}/${r.n}`)}</td><td class="num tnum">${r.d ?? '—'}</td></tr>`).join('')}</tbody></table></div></div>`;
}
