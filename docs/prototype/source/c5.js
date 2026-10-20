/* ================= C5 · Firms, ratings and exports ================= */
const ACTIVE_ENG = ['Requests', 'Active', 'Submitted'];
const starsHtml = n => `<span class="stars" aria-label="${n} out of 5">${[1, 2, 3, 4, 5].map(i => `<i class="${i <= Math.round(n) ? 'on' : ''}">★</i>`).join('')}</span>`;
const firmRatings = fid => (S.ratings || []).filter(r => r.firm === fid);
const avg1 = xs => xs.length ? Math.round(xs.reduce((a, v) => a + v, 0) / xs.length * 10) / 10 : null;
function reportDays(c) { if (c.reportDays) return c.reportDays; const a = new Date(String(c.submitted || '').split(',')[0]), b = new Date(c.reportAt || ''); return isNaN(a) || isNaN(b) ? null : Math.max(0, Math.round((b - a) / 864e5)); }

/* ---------- Firm dashboard ---------- */
function firmDashBody(f) {
  Object.keys(DRILL).forEach(k => delete DRILL[k]);
  const cs = S.cases.filter(c => c.firm === f.id); const act = cs.filter(c => ACTIVE_ENG.includes(ENG_GROUP(c)));
  const row = c => ({ org: c.org, sub: `${esc(progOf(c.prog).name)} · due ${fmtD(c.due)}`, chip: statusChip(c.stage), go: ['Submitted', 'Assessing', 'In preview', 'Signed off', 'Returned'].includes(c.stage) ? `firm/assess:${c.id}|requirements` : 'firm/engagements' });
  const req = cs.filter(c => ENG_GROUP(c) === 'Requests'); const fix = allFindings().filter(x => x.c.firm === f.id && x.f.status === 'Fix submitted');
  const rs = firmRatings(f.id); const soon = act.filter(c => c.due && daysBetween(TODAY, c.due) <= 45).sort((a, b) => a.due.localeCompare(b.due));
  const groups = ['Requests', 'Active', 'Submitted', 'Completed'].map(g => { const l = cs.filter(c => ENG_GROUP(c) === g); return { l: g, v: l.length, col: g === 'Requests' ? CH.warn : g === 'Completed' ? CH.ok : CH.brand, drill: drillKey(g, 'Engagements', l.map(row)) }; });
  const people = (f.people || []).filter(p => p.status !== 'Removed');
  const load = people.map(p => { const l = act.filter(c => c.lead === p.name || (c.team || []).includes(p.name)); return { l: p.name, lh: `${esc(p.name)} <span class="cap muted">${esc(p.role || '')}</span>`, v: l.length, col: l.length > 4 ? CH.bad : CH.brand, drill: drillKey(`${p.name}: active engagements`, '', l.map(row)) }; }).sort((a, b) => b.v - a.v);
  return `<div class="ktiles">${kTile('Active engagements', act.length, { sub: `${cs.filter(c => ENG_GROUP(c) === 'Submitted').length} submitted and waiting for you`, drill: drillKey('Active engagements', '', act.map(row)), test: 'fk-act' })}${kTile('Requests', req.length, { sub: req.length ? 'Accept or decline' : 'None waiting', drill: drillKey('Engagement requests', '', req.map(row)), test: 'fk-req' })}${kTile('Fixes to verify', fix.length, { sub: 'Organisations sent proof', drill: drillKey('Fixes to verify', '', fix.map(x => ({ org: x.c.org, sub: esc(x.f.title), chip: fdChip(x.f), go: `firm/finding:${x.f.id}` }))), test: 'fk-fix' })}${kTile('Average rating', rs.length ? `${avg1(rs.map(r => r.stars))}<small> / 5</small>` : '—', { sub: `${rs.length} rating${rs.length === 1 ? '' : 's'} from organisations` })}</div>
    <div class="ch-grid2"><div class="card p0 col"><div class="tbl-tools"><div class="grow"><div class="h4">Due soon</div><div class="cap muted">Active engagements due in the next 45 days</div></div><a href="#firm/engagements" data-go="firm/engagements" class="small strong">All engagements</a></div><div class="list">${soon.slice(0, 6).map(c => `<button class="list-row" data-act="open" data-arg="${row(c).go}" data-test="fsoon-${c.id}">${logo(S.orgs[c.org], 32)}<span class="grow" style="min-width:0"><span class="strong small ell" style="display:block">${esc(S.orgs[c.org].name)}</span><span class="cap muted">${esc(progOf(c.prog).name)} · ${dueText(c.due)}</span></span>${statusChip(c.stage)}</button>`).join('') || `<div style="padding:12px 20px">${empty('calendar-check', 'Nothing due soon', '')}</div>`}</div></div>
      ${chCard('f-load', load.some(x => x.v > 4) ? `${load.filter(x => x.v > 4).length} people have more than 4 active engagements` : 'Team workload is even', 'Active engagements per person, as lead or team member · click to see which', chBars(load), miniTable(['Person', 'Active engagements'], load.map(x => [esc(x.l), x.v])))}</div>
    ${chCard('f-stage', `${act.length} active, ${groups[3].v} completed`, 'Engagements by stage · click to see which', chBars(groups), null)}`;
}

/* ---------- client picker on the assessment screen ---------- */
function clientPicker(c) {
  if (S.ws !== 'firm') return '';
  const list = S.cases.filter(x => x.firm === S.firmId && ['Submitted', 'Assessing', 'In preview', 'Signed off', 'Returned'].includes(x.stage)).sort((a, b) => a.due.localeCompare(b.due));
  if (list.length < 2 && list.some(x => x.id === c.id)) return '';
  const opts = (list.some(x => x.id === c.id) ? list : [c, ...list]).map(x => [x.id, `${S.orgs[x.org].name} · ${x.stage}${x.due ? ' · due ' + fmtD(x.due) : ''}`]);
  return `<label class="row gap6 small muted">${ic('arrows-left-right')}${sel('client-pick', opts, c.id, { attrs: 'data-change="clientPick" style="width:auto;max-width:340px;height:36px" aria-label="Switch organisation" data-test="client-pick"' })}</label>`;
}
ACT.chg_clientPick = id => openRoute('firm/assess', id + '|requirements');

/* ---------- rate your firm (organisation, after the report is published) ---------- */
function rateCard(c) {
  if (S.ws !== 'organisation' || !c.firm || !S.firms[c.firm]) return '';
  const f = S.firms[c.firm]; const r = (S.ratings || []).find(x => x.case === c.id && x.org === S.orgId);
  if (r) return `<div class="card col gap8" data-test="rated"><div class="h4">Your rating of ${esc(f.name)}</div>${starsHtml(r.stars)}${r.comment ? `<p class="small muted">“${esc(r.comment)}”</p>` : ''}<p class="cap muted">Seen by ${esc(S.tenant.short)}. The firm sees ratings without your name.</p></div>`;
  const st = ui('rateStars', 0);
  return `<div class="card col gap12" data-test="rate-card"><div><div class="h4">How did ${esc(f.name)} do?</div><p class="cap muted" style="margin-top:2px">Your rating helps ${esc(S.tenant.short)} oversee assurance firms. The firm sees it without your name.</p></div>
    <div class="star-pick" role="radiogroup" aria-label="Rating">${[1, 2, 3, 4, 5].map(i => `<button class="${i <= st ? 'on' : ''}" data-act="rateStar" data-arg="${i}" aria-label="${i} star${i > 1 ? 's' : ''}" data-test="rate-star-${i}">★</button>`).join('')}<span class="cap muted">${['', 'Poor', 'Below expectations', 'Fine', 'Good', 'Excellent'][st]}</span></div>
    ${field('Comment', ta('rate-c', '', { attrs: 'rows="3" data-test="rate-c"', ph: 'What went well, what could be better' }), { for: 'rate-c', opt: true })}${btn('Send rating', { size: 'sm', act: 'rateSend', arg: c.id, test: 'rate-go', disabled: !st })}</div>`;
}
ACT.rateStar = n => { const t = val('rate-c'); S.ui.rateStars = +n; render(); const el = $('#rate-c'); if (el) el.value = t; };
ACT.rateSend = cid => { const c = caseOf(cid); S.ratings.push({ id: uid('rt'), firm: c.firm, org: S.orgId, case: c.id, stars: S.ui.rateStars, comment: val('rate-c'), when: '19 Oct 2026' }); S.ui.rateStars = 0; notify({ ws: 'regulator', i: 'star', tone: 'info', title: `${myOrg().name} rated ${S.firms[c.firm].name}`, go: 'firms/profile', arg: c.firm + '|performance', kind: 'Updates' }); addAudit('Rated assurance firm', S.firms[c.firm].name); render(); toast('Thank you. Your rating has been sent.', 'ok', 'star'); };

/* ---------- firm performance (regulator and the firm itself) ---------- */
function firmPerf(f, side) {
  Object.keys(DRILL).forEach(k => delete DRILL[k]);
  const pub = S.cases.filter(c => c.firm === f.id && c.stage === 'Published'); const rs = firmRatings(f.id);
  const outs = pub.flatMap(c => Object.values(c.outcomes || {})); const ov = outs.filter(o => o.override).length;
  const days = pub.map(reportDays).filter(v => v != null);
  const years = [...new Set(pub.map(c => +progOf(c.prog).cycle))].sort();
  const byYear = years.map(y => { const cs = pub.filter(c => +progOf(c.prog).cycle === y); const r = rs.filter(x => cs.some(c => c.id === x.case)); return { y, n: cs.length, r: avg1(r.map(x => x.stars)), d: avg(cs.map(reportDays).filter(v => v != null)), ov: pct(cs.flatMap(c => Object.values(c.outcomes || {})).filter(o => o.override).length, cs.flatMap(c => Object.values(c.outcomes || {})).length) }; });
  const line = years.length > 1 ? chLine({ w: 560, h: 200, x: { min: years[0] - 0.2, max: years[years.length - 1] + 0.2, ticks: years.map(y => [y, String(y)]) }, y: { min: 1, max: 5, ticks: [1, 3, 5] }, series: [{ name: 'Average rating', col: CH.warn, dots: true, pts: byYear.filter(b => b.r != null).map(b => [b.y, b.r]), end: String(byYear[byYear.length - 1].r ?? '') }], label: 'Average rating by cycle' }) : '<p class="small muted">Trends appear after a second cycle.</p>';
  const peers = Object.values(S.firms).filter(x => firmRatings(x.id).length).map(x => ({ l: x.name, v: avg1(firmRatings(x.id).map(r => r.stars)), col: x.id === f.id ? CH.brand : CH.prev, go: side === 'reg' ? `firms/profile:${x.id}|performance` : undefined })).sort((a, b) => b.v - a.v);
  const rRow = r => ({ org: r.org, sub: `${'★'.repeat(r.stars)} · ${esc(r.comment || '')}`, go: side === 'reg' ? orgGo(r.org) : '' });
  return `<div class="ktiles">${kTile('Reports published', pub.length, { sub: `${years.length} cycle${years.length === 1 ? '' : 's'}` })}${kTile('Average rating', rs.length ? `${avg1(rs.map(r => r.stars))}<small> / 5</small>` : '—', { sub: `${rs.length} rating${rs.length === 1 ? '' : 's'}`, drill: side === 'reg' ? drillKey('Ratings', esc(f.name), rs.map(rRow)) : undefined, test: 'fp-rating' })}${kTile('Days to report', avg(days) ?? '—', { sub: 'From submission to signed report, on average' })}${kTile(`Outcomes changed by ${esc(S.tenant.short)}`, `${pct(ov, outs.length)}%`, { sub: `${ov} of ${outs.length} outcomes`, test: 'fp-override' })}</div>
    <div class="ch-grid2">${chCard('fp-trend', byYear.length ? `Average rating ${byYear.filter(b => b.r != null).map(b => b.r).join(' → ')}` : 'No ratings yet', 'Average organisation rating per cycle', line, miniTable(['Cycle', 'Reports', 'Average rating', 'Days to report', 'Outcomes changed'], byYear.map(b => [b.y, b.n, b.r ?? '—', b.d ?? '—', b.ov + '%'])))}
      ${side === 'reg' ? chCard('fp-peers', 'Compared with other firms', 'Average rating from organisations · click to open', chBars(peers.map(x => ({ ...x, vl: x.v })), { max: 5 }), null) : `<div class="card col gap12"><div class="h4">What organisations said</div><p class="cap muted">Names are hidden. ${esc(S.tenant.short)} sees who said what.</p>${rs.slice(-5).reverse().map(r => `<div class="oa">${starsHtml(r.stars)}<p class="small" style="margin-top:4px">${esc(r.comment || 'No comment')}</p></div>`).join('') || '<p class="small muted">No ratings yet.</p>'}</div>`}</div>
    ${side === 'reg' ? `<div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Ratings</div><div class="cap muted">Newest first</div></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Report</th><th>Rating</th><th>Comment</th></tr></thead><tbody>${[...rs].reverse().slice(0, 12).map(r => `<tr><td>${orgCell(S.orgs[r.org], '')}</td><td class="small">${esc(progOf((caseOf(r.case) || {}).prog || 'p1').name)}</td><td>${starsHtml(r.stars)}</td><td class="wrap small" style="max-width:360px">${esc(r.comment || '')}</td></tr>`).join('') || `<tr><td colspan="4">${empty('star', 'No ratings yet', '')}</td></tr>`}</tbody></table></div></div>` : ''}`;
}

/* ---------- reports and exports: scorecard, CSV, board pack ---------- */
function csvDownload(name, rows) {
  const csv = rows.map(r => r.map(v => { const s = String(v ?? ''); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(',')).join('\n');
  S._lastCsv = { name, rows: rows.length };
  const local = () => { try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); toast(`${esc(name)} downloaded (${rows.length - 1} rows)`, 'ok', 'download-simple'); } catch (e) { toast('Download is not available here', 'info', 'info'); } };
  if (window.claude && window.claude.use) { window.claude.use('downloads').then(d => { if (!d) return local(); d.save({ filename: name, data: csv }).then(() => toast(`${esc(name)} saved (${rows.length - 1} rows)`, 'ok', 'download-simple')).catch(e => { if (e && e.code !== 'declined') toast('Download is not available here', 'info', 'info'); }); }).catch(local); }
  else local();
}
function scoreData(kind, a, b) {
  if (kind === 'org') { const o = S.orgs[a]; const sers = mySeries(a); const fs = allFindings().filter(x => x.c.org === a && x.f.cls !== 'OFI'); const fl = (S.filings || []).filter(f => f.org === a && (isFiled(f) || f.due < TODAY));
    return { title: `${o.name}`, sub: `Compliance scorecard · ${catLabel(o.type, o.tier)}`, kpis: [['Overall status', orgOverall(a)], ['Open findings', fs.filter(x => !['Closed', 'Noted'].includes(x.f.status)).length], ['Returns on time', fl.length ? pct(fl.filter(f => isFiled(f) && !f.lateBy).length, fl.length) + '%' : '—'], ['Open enforcement cases', S.enfCases.filter(c => c.org === a && OPEN_ENF.includes(c.status)).length]],
      head: ['Programme', 'Cycle', 'Score', 'Benchmark', 'Status', 'Open nonconformities'], rows: sers.map(sr => { const c = latestResult(a, sr.id); return [sr.name, progOf(c.prog).cycle, c.score, S.compliance.bench[sr.id] ?? 70, compStatus(c), (c.findings || []).filter(NC_OPEN).length]; }),
      extra: ['Exposure', orgExposure(a).slice(0, 8).map(e => [e.t, e.lv, e.why])], file: `${o.ini}-scorecard-${TODAY}.csv` }; }
  if (kind === 'cat') { const sr = S.series.find(s => s.id === b) || S.series[0]; const os = verifiedOrgs().filter(o => o.type === a); const res = os.map(o => ({ o, c: latestResult(o.id, sr.id) })).sort((x, y) => ((y.c || {}).score ?? -1) - ((x.c || {}).score ?? -1));
    return { title: (allTypes().find(x => x.name === a) || {}).plural || a, sub: `Category scorecard · ${sr.name}`, kpis: [['Organisations', os.length], ['Assessed', res.filter(r => r.c).length], ['Average score', avg(res.filter(r => r.c).map(r => r.c.score)) ?? '—'], ['Non-compliant', res.filter(r => compStatus(r.c) === 'Non-compliant').length]],
      head: ['Rank', 'Organisation', 'Score', 'Status', 'Open nonconformities'], rows: res.map((r, i) => [r.c ? i + 1 : '—', r.o.name, r.c ? r.c.score : '—', compStatus(r.c), r.c ? (r.c.findings || []).filter(NC_OPEN).length : '—']), file: `${a.replace(/ /g, '-').toLowerCase()}-scorecard-${TODAY}.csv` }; }
  const orgs = verifiedOrgs(); const wl = watchlist();
  return { title: 'Supervision board pack', sub: `${S.tenant.name} · ${fmtD(TODAY)}`, kpis: [['Organisations', orgs.length], ['Non-compliant', orgs.filter(o => orgOverall(o.id) === 'Non-compliant').length], ['Overdue fixes', allFindings().filter(x => fdOverdue(x.f)).length], ['On the watchlist', wl.length]],
    head: ['Programme', 'Compliant', 'With conditions', 'Non-compliant', 'Not assessed'], rows: liveSeries().map(sr => [sr.name, ...COMP_ST.map(s => orgs.filter(o => compStatus(latestResult(o.id, sr.id)) === s).length)]),
    extra: ['Watchlist', wl.slice(0, 10).map(w => [S.orgs[w.org].name, w.reasons.length + ' reason' + (w.reasons.length > 1 ? 's' : ''), w.reasons[0].text])], file: `board-pack-${TODAY}.csv` };
}
ACT.scorecard = arg => {
  const [kind, a, b] = String(arg).split('|'); const d = scoreData(kind, a, b); S._score = d;
  openDialog(`<div class="score-doc" data-test="scorecard"><div class="row top"><div class="grow"><div class="overline">${esc(d.sub)}</div><h2 class="h2" style="margin-top:4px">${esc(d.title)}</h2><div class="cap muted">As of ${fmtD(TODAY)} · prepared by ${esc(persona().name)} on SuperAtlas</div></div><button class="icon-btn no-print" data-act="closeDialog" aria-label="Close">${ic('x')}</button></div>
    <div class="sc-kpis">${d.kpis.map(([l, v]) => `<div><span class="cap muted">${esc(l)}</span><b>${esc(v)}</b></div>`).join('')}</div>
    <table class="tbl keep"><thead><tr>${d.head.map(h => `<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${d.rows.map(r => `<tr>${r.map(v => `<td class="small">${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
    ${d.extra && d.extra[1].length ? `<div class="h4" style="margin-top:6px">${esc(d.extra[0])}</div><div class="sc-list">${d.extra[1].map(r => `<div><div class="row gap8"><b class="small grow">${esc(r[0])}</b><span class="cap muted">${esc(r[1])}</span></div><div class="cap muted">${esc(r[2])}</div></div>`).join('')}</div>` : ''}
    <div class="row end no-print sc-acts" style="margin-top:8px">${btn('Download CSV', { v: 'secondary', i: 'file-csv', act: 'scoreCsv', test: 'sc-csv' })}${btn('Print or save as PDF', { i: 'printer', act: 'scorePrint', test: 'sc-print' })}</div></div>`, { wide: true });
};
ACT.scoreCsv = () => { const d = S._score; csvDownload(d.file, [d.head, ...d.rows]); };
ACT.scorePrint = () => { try { window.print(); } catch (e) {} S._printed = true; toast('Opening print. Choose “Save as PDF” to keep a copy.', 'info', 'printer'); };
OPEN_HOOKS['firms/profile'] = (id, tab) => { if (id) S.ui.profileFirm = id; if (tab) S.ui.firmTab = tab; };
