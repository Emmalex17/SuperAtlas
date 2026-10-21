/* ================= C0 · Foundations: programme cycles, status words, compliance status, chart kit ================= */

/* ---------- programme series and cycles ---------- */
const seriesOf = p => S.series.find(s => s.id === p.series);
const cyclesOf = sid => S.programmes.filter(p => p.series === sid).sort((a, b) => String(b.cycle).localeCompare(String(a.cycle)));
function currentCycle(sid) { const cs = cyclesOf(sid); return cs.find(p => ['Open', 'In review'].includes(p.status)) || cs[0]; }
const cycleLabel = p => p.cycle ? `${seriesOf(p) ? seriesOf(p).name : p.name} · ${p.cycle}` : p.name;
ACT.progCycle = id => { S.ui.progId = id; render(); };
ACT.progNext = pid => {
  closePop(); const p = progOf(pid); const cyc = cyclesOf(p.series);
  const pending = cyc.find(c => ['Draft', 'Scheduled'].includes(c.status) && +c.cycle > +p.cycle);
  if (pending) { toast(`Cycle ${esc(pending.cycle)} is already set up`, 'info'); return ACT.progEdit(pending.id); }
  const last = cyc[0]; const y = String(+last.cycle + 1); const yr = d => d ? String(+d.slice(0, 4) + 1) + d.slice(4) : d;
  const n = clone(last); Object.assign(n, { id: uid('p'), cycle: y, name: last.name.replace(/\b20\d\d\b/, y), status: 'Draft', opens: yr(last.opens), closes: yr(last.closes), created: '19 Oct 2026', by: persona().name, activity: [['19 Oct 2026', persona().name, `drafted cycle ${y} from cycle ${last.cycle}`]], locked: '', edited: 0, published: undefined });
  S.programmes.push(n); addAudit('Drafted next programme cycle', n.name); toast(`Cycle ${esc(y)} drafted from ${esc(last.cycle)}. Check the dates, then launch.`, 'ok', 'arrow-clockwise'); ACT.progEdit(n.id);
};
function cyclesTab(p) {
  const cyc = cyclesOf(p.series); const b = benchOf(p);
  return `<div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Cycles</div><div class="cap muted">Each cycle reuses the programme's set-up. Results stay with the cycle they were assessed in.</div></div>${btn('Run next cycle', { v: 'secondary', size: 'sm', i: 'arrow-clockwise', act: 'progNext', arg: p.id, test: 'prog-next' })}</div>
    <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Cycle</th><th>Window</th><th class="num">Organisations</th><th>Submitted</th><th class="num">Average score</th><th class="num">Met benchmark (${b})</th><th>Status</th></tr></thead><tbody>${cyc.map(c => { const cs = casesOf(c.id); const pub = cs.filter(x => x.stage === 'Published'); const sc = pub.map(x => x.score).filter(v => v != null); const avg = sc.length ? Math.round(sc.reduce((a, v) => a + v, 0) / sc.length) : null; const met = sc.filter(v => v >= b).length; const s = progStats(c); return `<tr class="click ${c.id === p.id ? 'sel' : ''}" data-act="progCycle" data-arg="${c.id}" data-test="cyc-${c.cycle}"><td><b>${esc(c.cycle)}</b>${c.id === p.id ? ' ' + chip('Viewing', 'brand') : ''}</td><td class="small">${fmtD(c.opens)} – ${fmtD(c.closes)}</td><td class="num tnum">${cs.length || scopeOrgs(c).length}</td><td>${['Draft', 'Scheduled'].includes(c.status) ? '<span class="cap muted">Not open yet</span>' : progBar(s.pct, `${s.done}/${s.n}`)}</td><td class="num tnum">${avg ?? '—'}</td><td class="num tnum">${sc.length ? `${met} of ${sc.length}` : '—'}</td><td>${statusChip(c.status)}</td></tr>`; }).join('')}</tbody></table></div></div>`;
}

/* ---------- one list of status words for engagement stages ---------- */
const STAGE_GROUPS = () => [['Needs a firm', ['Firm to assign', 'Firm to choose', 'Firm approval', 'Awaiting firm']], ['Answering', ['Answering']], ['With the firm', ['Submitted', 'Assessing', 'In preview', 'Signed off']], ['With ' + S.tenant.short, ['Report submitted', 'In review', 'Returned', 'Approved', 'Scheduled', 'Held back']], ['Published', ['Published']]];
const stageGroup = st => (STAGE_GROUPS().find(g => g[1].includes(st)) || ['Other'])[0];

/* ---------- "…" menu for rare and risky actions ---------- */
const MENUS = {};
function moreMenu(key, items) { MENUS[key] = items; return `<button class="icon-btn bordered" data-act="moreMenu" data-arg="${key}" aria-label="More actions" title="More actions" data-test="more-${key}">${ic('dots-three')}</button>`; }
ACT.moreMenu = (key, el, e) => { e && e.stopPropagation(); const items = MENUS[key] || []; openPop(el, items.map(([i, l, act, arg, danger]) => `<button class="menu-item ${danger ? 'danger' : ''}" data-act="${act}" data-arg="${esc(arg)}" data-test="mi-${act}">${ic(i)}<span>${esc(l)}</span></button>`).join('')); $('#pop').style.width = '260px'; };

/* ---------- compliance status (rules in Settings → Compliance status) ---------- */
const benchOf = p => +((S.compliance.bench || {})[p.series] ?? 70);
const NC_OPEN = f => ['MaNC', 'MiNC'].includes(f.cls) && !['Closed', 'Noted'].includes(f.status);
function compStatus(c) {
  if (!c || c.stage !== 'Published' || c.score == null) return 'Not assessed';
  const b = benchOf(progOf(c.prog)); const fs = c.findings || [];
  const openMa = fs.some(f => f.cls === 'MaNC' && !['Closed', 'Noted'].includes(f.status)); const openNC = fs.some(NC_OPEN);
  if (c.score >= b) return openMa ? 'Compliant with conditions' : 'Compliant';
  return openNC ? 'Non-compliant' : 'Compliant with conditions';
}
const COMP_ST = ['Compliant', 'Compliant with conditions', 'Non-compliant', 'Not assessed'];
const COMP_TONE = { Compliant: 'ok', 'Compliant with conditions': 'warn', 'Non-compliant': 'bad', 'Enforcement watch': 'ai', 'Not assessed': 'neu' };
const compChip = st => chip(st, COMP_TONE[st] || 'neu', { Compliant: 'check-circle', 'Compliant with conditions': 'warning', 'Non-compliant': 'x-circle', 'Not assessed': 'circle-dashed' }[st]);
/* the latest published result for one organisation in one programme series */
function latestResult(orgId, sid) { return S.cases.filter(c => c.org === orgId && c.stage === 'Published' && progOf(c.prog).series === sid).sort((a, b) => String(progOf(b.prog).cycle).localeCompare(String(progOf(a.prog).cycle)))[0]; }

screen('settings/compliance', {
  t: 'Compliance status', layout: 'app', ws: 'regulator', crumbs: [['Settings', 'settings/categories'], 'Compliance status'],
  render() {
    const cp = S.compliance; const sers = S.series.filter(s => cyclesOf(s.id).length);
    return `${settingsHead('settings/compliance')}
      <div class="card col gap12"><div class="h4">How status is worked out</div><p class="small muted">Each organisation gets a status for each programme from its latest published report. The score stays fixed until the next cycle; the status moves as findings are fixed and closed.</p>
        <div class="tbl-wrap" style="margin:0 -20px"><table class="tbl"><thead><tr><th>Status</th><th>Rule</th></tr></thead><tbody>
        <tr><td>${compChip('Compliant')}</td><td class="wrap small">Score at or above the programme's benchmark, and no open major nonconformity</td></tr>
        <tr><td>${compChip('Compliant with conditions')}</td><td class="wrap small">At or above the benchmark with a major nonconformity still open, or below it with every nonconformity fixed and closed</td></tr>
        <tr><td>${compChip('Non-compliant')}</td><td class="wrap small">Below the benchmark with nonconformities still open</td></tr>
        <tr><td>${chip('Enforcement watch', 'ai', 'eye')}</td><td class="wrap small">A flag on top of the status. Set the rules below.</td></tr></tbody></table></div></div>
      <form class="card col gap16" data-form="compSave"><div class="h4">Benchmarks</div><p class="small muted">The score an organisation needs to be compliant in each programme (0 to 100).</p>
        <div class="grid g3" style="gap:14px">${sers.map(s => field(esc(s.name), inp('bench-' + s.id, cp.bench[s.id] ?? 70, { type: 'number', attrs: `min="0" max="100" data-test="bench-${s.id}"` }), { for: 'bench-' + s.id })).join('')}</div>
        <div class="h4" style="margin-top:6px">Enforcement watch</div><p class="small muted">An organisation is flagged when any of these is true. Leave a box empty to switch that rule off.</p>
        <div class="grid g3" style="gap:14px">${field('Major nonconformity overdue by more than (days)', inp('cw-days', cp.watchDays, { type: 'number', ph: 'Not set', attrs: 'min="1" data-test="cw-days"' }), { for: 'cw-days', hint: cp.watchDays ? '' : 'Not set yet, so this rule is off.' })}${field('Non-compliant in this many cycles running', inp('cw-cycles', cp.cyclesRunning, { type: 'number', attrs: 'min="1"' }), { for: 'cw-cycles' })}${field('Late with the same return this many periods running', inp('cw-late', cp.lateRuns, { type: 'number', attrs: 'min="1"' }), { for: 'cw-late' })}</div>
        <div class="row end">${btn('Save', { type: 'submit', test: 'comp-save' })}</div></form>`;
  }
});
ACT.form_compSave = () => { const cp = S.compliance; S.series.forEach(s => { const v = val('bench-' + s.id); if (v !== '') cp.bench[s.id] = Math.max(0, Math.min(100, +v)); }); cp.watchDays = val('cw-days'); cp.cyclesRunning = val('cw-cycles'); cp.lateRuns = val('cw-late'); addAudit('Changed compliance status rules', 'Benchmarks and enforcement watch'); render(); toast('Compliance status rules saved'); };

/* ================= Chart kit: one look for every dashboard ================= */
const CH = { ink: 'var(--text)', quiet: 'var(--text-2)', grid: 'var(--border)', brand: 'var(--brand-500)', prev: '#9094a3', ok: 'var(--ok-icon)', warn: 'var(--warn-icon)', bad: 'var(--bad-icon)', ai: 'var(--ai-solid)', neu: 'var(--neu-icon)' };
const DRILL = {};
/* clicking a mark opens the organisations behind it in a side panel */
function drillKey(title, sub, rows) { const k = 'd' + Object.keys(DRILL).length; DRILL[k] = { title, sub, rows }; return k; }
ACT.drill = k => { const d = DRILL[k]; if (!d) return; openDrawer(`<div class="row top"><div class="grow"><div class="overline">${d.rows.length} ${d.rows.length === 1 ? 'organisation' : 'organisations'}</div><h2 class="h3" style="margin-top:4px">${d.title}</h2>${d.sub ? `<p class="small muted" style="margin-top:4px">${d.sub}</p>` : ''}</div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div>
  <div class="list" style="margin:0 -24px" data-test="drill-list">${d.rows.map(r => `<button class="list-row" data-act="open" data-arg="${esc(r.go)}">${logo(S.orgs[r.org], 32)}<span class="grow" style="min-width:0"><span class="strong ell" style="display:block">${esc(S.orgs[r.org].name)}</span><span class="cap muted">${r.sub || ''}</span></span>${r.chip || ''}${ic('caret-right')}</button>`).join('') || `<div style="padding:20px 24px">${empty('buildings', 'Nobody here', '')}</div>`}</div>
  <div class="row">${btn('Export list (CSV)', { v: 'secondary', size: 'sm', i: 'export', act: 'savedToast', arg: 'Export started' })}</div>`); };
/* headline figure with change from the comparison cycle */
function kTile(label, value, o = {}) {
  const d = o.delta; const good = o.goodUp === false ? d < 0 : d > 0;
  return `<${o.drill ? `button data-act="drill" data-arg="${o.drill}"` : 'div'} class="ktile ${o.drill ? 'click' : ''}" ${o.test ? `data-test="${o.test}"` : ''}><span class="kt-l">${esc(label)}</span><span class="kt-v tnum">${value}</span><span class="kt-s">${d == null || isNaN(d) ? `<span class="muted">${o.sub || '&nbsp;'}</span>` : `<span class="kt-d ${d === 0 ? '' : good ? 'up' : 'down'}">${ic(d > 0 ? 'arrow-up-right' : d < 0 ? 'arrow-down-right' : 'minus')}${d > 0 ? '+' : ''}${d}${o.unit || ''}</span> <span class="muted">${o.vs || 'vs last cycle'}</span>`}</span></${o.drill ? 'button' : 'div'}>`;
}
/* chart card: title states the finding; "View as table" swaps the drawing for its numbers */
function chCard(id, title, sub, drawing, table, o = {}) {
  const asTable = (S.ui.chTable || {})[id];
  return `<div class="card col gap12 chcard ${o.cls || ''}" data-test="ch-${id}"><div class="row top"><div class="grow"><div class="h4">${title}</div>${sub ? `<div class="cap muted" style="margin-top:2px">${sub}</div>` : ''}</div>${table ? `<button class="link-btn small" data-act="chTable" data-arg="${id}">${asTable ? 'View as chart' : 'View as table'}</button>` : ''}</div>${asTable ? table : drawing}${o.foot ? `<div class="cap muted">${o.foot}</div>` : ''}</div>`;
}
ACT.chTable = id => { S.ui.chTable = S.ui.chTable || {}; S.ui.chTable[id] = !S.ui.chTable[id]; render(); };
const miniTable = (head, rows) => `<div class="tbl-wrap"><table class="tbl keep"><thead><tr>${head.map((h, i) => `<th class="${i ? 'num' : ''}">${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((v, i) => `<td class="${i ? 'num tnum' : 'small'}">${v}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
/* line chart (svg): series of [x, y] with optional reference lines */
function chLine(o) {
  const W = o.w || 560, H = o.h || 220, L = 44, R = 16, T = 22, B = 28; const xs = o.x, ys = o.y;
  const X = v => L + (v - xs.min) / (xs.max - xs.min || 1) * (W - L - R), Y = v => T + (1 - (v - ys.min) / (ys.max - ys.min || 1)) * (H - T - B);
  const grid = (ys.ticks || []).map(v => `<line x1="${L}" x2="${W - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${CH.grid}"/><text x="${L - 6}" y="${Y(v) + 4}" text-anchor="end" font-size="12.5" fill="${CH.quiet}">${v}${ys.unit || ''}</text>`).join('');
  const xt = (xs.ticks || []).map(([v, l]) => `<text x="${X(v)}" y="${H - 8}" text-anchor="middle" font-size="12.5" fill="${CH.quiet}">${esc(l)}</text>`).join('');
  const refs = (o.refY || []).map(r => `<line x1="${L}" x2="${W - R}" y1="${Y(r.v)}" y2="${Y(r.v)}" stroke="${r.col || CH.warn}" stroke-dasharray="5 4" stroke-width="1.25"/><text x="${L + 6}" y="${Y(r.v) - 6}" font-size="12.5" font-weight="600" fill="${r.col || CH.warn}">${esc(r.label)}</text>`).join('') + (o.refX || []).map(r => { const nearEnd = X(r.v) > W - R - 50; return `<line x1="${X(r.v)}" x2="${X(r.v)}" y1="${T}" y2="${H - B}" stroke="${r.col || CH.quiet}" stroke-dasharray="3 4"/><text x="${X(r.v) + (nearEnd ? -4 : 4)}" y="${T + 10}" text-anchor="${nearEnd ? 'end' : 'start'}" font-size="12.5" fill="${r.col || CH.quiet}">${esc(r.label)}</text>`; }).join('');
  const lines = o.series.map(s => { const d = s.pts.map((p, i) => `${i ? 'L' : 'M'}${X(p[0]).toFixed(1)} ${Y(p[1]).toFixed(1)}`).join(''); const last = s.pts[s.pts.length - 1]; return `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="${s.w || 2.25}" ${s.dash ? 'stroke-dasharray="6 5"' : ''} stroke-linejoin="round"/>${s.dots ? s.pts.map(p => `<circle cx="${X(p[0])}" cy="${Y(p[1])}" r="3.5" fill="var(--surface)" stroke="${s.col}" stroke-width="2"/>`).join('') : ''}${last && s.end ? (() => { const near = X(last[0]) > W - R - 60; return `<circle cx="${X(last[0])}" cy="${Y(last[1])}" r="4" fill="${s.col}"/><text x="${X(last[0]) + (near ? -8 : 7)}" y="${Y(last[1]) + (near ? -10 : 4)}" text-anchor="${near ? 'end' : 'start'}" font-size="13" font-weight="600" fill="${s.col}">${esc(s.end)}</text>`; })() : ''}`; }).join('');
  const key = o.series.length > 1 || (o.refY || []).length ? `<div class="ch-key">${o.series.map(s => `<span><i style="background:${s.col};${s.dash ? 'opacity:.6' : ''}"></i>${esc(s.name)}</span>`).join('')}</div>` : '';
  return `<svg class="chsvg" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(o.label || '')}">${grid}${refs}${lines}${xt}</svg>${key}`;
}
/* vertical bars (histogram) with an optional benchmark marker between bins */
function chColumns(o) {
  const max = Math.max(1, ...o.bins.map(b => b.n));
  return `<div class="ch-cols" style="--n:${o.bins.length}">${o.bins.map((b, i) => `<div class="ch-col ${b.drill ? 'click' : ''}" ${b.drill ? `data-act="drill" data-arg="${b.drill}"` : ''} title="${esc(b.l)}: ${b.n}">${o.refAt === i ? `<span class="ch-ref"><b>${esc(o.refLabel || '')}</b></span>` : ''}<span class="ch-n tnum">${b.n || ''}</span><span class="ch-bar" style="height:${Math.max(b.n ? 4 : 0, b.n / max * 100)}%;background:${b.col || CH.brand}"></span><span class="ch-l">${esc(b.l)}</span></div>`).join('')}</div>`;
}
/* horizontal bars: label, value, optional drill and tone */
function chBars(rows, o = {}) {
  const max = o.max || Math.max(1, ...rows.map(r => r.v));
  return `<div class="ch-hbars">${rows.map(r => `<${r.drill ? `button data-act="drill" data-arg="${r.drill}"` : r.go ? `button data-act="open" data-arg="${esc(r.go)}"` : 'div'} class="ch-hb ${r.drill || r.go ? 'click' : ''}"><span class="ch-hl" title="${esc(r.l)}">${r.lh || esc(r.l)}</span><span class="ch-ht"><i style="width:${Math.max(r.v ? 2 : 0, r.v / max * 100)}%;background:${r.col || CH.brand}"></i></span><span class="ch-hv tnum">${r.vl ?? r.v}</span></${r.drill || r.go ? 'button' : 'div'}>`).join('')}</div>`;
}
/* stacked bars: parts of a whole per row */
function chStack(rows, parts, o = {}) {
  return `<div class="ch-stack">${o.key !== false ? `<div class="ch-key">${parts.map(p => `<span><i style="background:${p.col}"></i>${esc(p.l)}</span>`).join('')}</div>` : ''}${rows.map(r => { const tot = r.vals.reduce((a, v) => a + v.n, 0) || 1; return `<div class="ch-sr"><span class="ch-hl" title="${esc(r.l)}">${r.lh || esc(r.l)}</span><span class="ch-st">${r.vals.map((v, i) => v.n ? `<i class="${v.drill ? 'click' : ''}" ${v.drill ? `data-act="drill" data-arg="${v.drill}"` : ''} style="width:${v.n / tot * 100}%;background:${parts[i].col};color:${parts[i].ink || '#fff'}" title="${esc(parts[i].l)}: ${v.n}">${v.n / tot > 0.08 ? v.n : ''}</i>` : '').join('')}</span><span class="ch-hv tnum">${r.total ?? tot}</span></div>`; }).join('')}</div>`;
}
/* funnel: each stage as wide as its count against the first */
function chFunnel(stages) {
  const first = Math.max(1, stages[0].n);
  return `<div class="ch-funnel">${stages.map((s, i) => `<${s.drill ? `button data-act="drill" data-arg="${s.drill}"` : 'div'} class="ch-fs ${s.drill ? 'click' : ''}"><span class="ch-fl">${esc(s.l)}</span><span class="ch-ft"><i style="width:${Math.max(s.n ? 3 : 0, s.n / first * 100)}%"></i></span><span class="ch-fv tnum"><b>${s.n}</b>${i ? `<span class="muted"> · ${Math.round(s.n / first * 100)}%</span>` : ''}</span></${s.drill ? 'button' : 'div'}>`).join('')}</div>`;
}
/* heatmap: rows × columns of counts; colour by count, click opens who */
function chHeat(o) {
  const max = Math.max(1, ...o.rows.flatMap(r => r.cells.map(c => c.n)));
  return `<div class="tbl-wrap"><table class="ch-heat"><thead><tr><th></th>${o.cols.map(c => `<th title="${esc(c.t || c.l)}">${esc(c.l)}</th>`).join('')}</tr></thead><tbody>${o.rows.map(r => `<tr class="${r.sec ? 'sec' : ''}"><th class="${r.sec ? 'h-sec' : 'h-req'}" title="${esc(r.t || r.l)}">${r.lh || esc(r.l)}</th>${r.cells.map((c, i) => { const a = c.n / max; const col = o.cols[i].col || CH.bad; return `<td>${c.n ? `<button class="hc" data-act="drill" data-arg="${c.drill}" style="background:color-mix(in srgb, ${col} ${Math.round(12 + a * 70)}%, var(--surface))" title="${esc(r.t || r.l)} · ${esc(o.cols[i].t || o.cols[i].l)}: ${c.n}" data-test="hc-${r.key}-${o.cols[i].l}">${c.n}</button>` : '<span class="hc z">·</span>'}</td>`; }).join('')}</tr>`).join('')}</tbody></table></div>`;
}
/* before and after per row (dot plot) */
function chDots(rows, o) {
  const X = v => (v - o.min) / (o.max - o.min) * 100;
  return `<div class="ch-dots">${o.key ? `<div class="ch-key"><span><i style="background:${CH.prev}"></i>${esc(o.key[0])}</span><span><i style="background:${CH.brand}"></i>${esc(o.key[1])}</span>${o.ref != null ? `<span><i style="background:${CH.warn}"></i>Benchmark ${o.ref}</span>` : ''}</div>` : ''}${rows.map(r => `<${r.go ? `button data-act="open" data-arg="${esc(r.go)}"` : 'div'} class="ch-dr ${r.go ? 'click' : ''}"><span class="ch-hl" title="${esc(r.l)}">${esc(r.l)}</span><span class="ch-dt">${o.ref != null ? `<em style="left:${X(o.ref)}%"></em>` : ''}${r.a != null && r.b != null ? `<s style="left:${Math.min(X(r.a), X(r.b))}%;width:${Math.abs(X(r.b) - X(r.a))}%;background:${r.b >= r.a ? 'var(--ok-icon)' : 'var(--bad-icon)'}"></s>` : ''}${r.a != null ? `<i class="pa" style="left:${X(r.a)}%"></i>` : ''}${r.b != null ? `<i class="pb" style="left:${X(r.b)}%"></i>` : ''}</span><span class="ch-hv tnum">${r.a ?? '—'} → <b>${r.b ?? '—'}</b></span></${r.go ? 'button' : 'div'}>`).join('')}</div>`;
}
