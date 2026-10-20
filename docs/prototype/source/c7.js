/* ================= C7 · Search, quick switcher, polish ================= */
/* one index per workspace: each person only finds what their workspace can open */
function searchIndex() {
  const R = S.ws === 'regulator', O = S.ws === 'organisation', F = S.ws === 'firm';
  const it = [], add = (g, i, t, s, go, extra = '') => it.push({ g, i, t, s, go, k: (t + ' ' + s + ' ' + extra).toLowerCase() });
  const orgN = id => (S.orgs[id] || {}).name || '';
  /* pages from the sidebar */
  (NAV[S.ws] || []).filter(n => n.go && (!n.show || n.show())).forEach(n => add('Pages', n.i || 'arrow-right', n.l, 'Go to page', n.go));
  if (R) {
    Object.values(S.orgs).forEach(o => add('Organisations', 'buildings', o.name, catLabel(o.type, o.tier), `organisations/profile:${o.id}|overview`, o.ini));
    Object.values(S.firms).forEach(f => add('Assurance firms', 'briefcase', f.name, (f.types || []).join(', '), `firms/profile:${f.id}|overview`));
  }
  const progs = S.programmes.filter(p => p.status !== 'Draft' || R);
  if (R) progs.forEach(p => add('Programmes', 'calendar-check', p.name, `${p.status} · cycle ${p.cycle}`, `programmes/view:${p.id}|overview`));
  if (O) mySeries(S.orgId).forEach(sr => add('Programmes', 'calendar-check', sr.name, 'Your results over time', `org/compliance/programme:${sr.id}`));
  if (O) myCases().filter(c => c.stage !== 'Published').forEach(c => add('Programmes', 'clipboard-text', progOf(c.prog).name, `In progress · ${c.stage}`, `org/assessment:${c.id}`));
  if (F) S.cases.filter(c => c.firm === S.firmId && c.stage !== 'Published').forEach(c => add('Engagements', 'clipboard-text', `${orgN(c.org)} · ${progOf(c.prog).name}`, c.stage, ['Submitted', 'Assessing', 'In preview', 'Signed off', 'Returned'].includes(c.stage) ? `firm/assess:${c.id}|requirements` : 'firm/engagements'));
  allFindings().filter(x => R || (O && x.c.org === S.orgId) || (F && x.c.firm === S.firmId)).forEach(x => add('Findings', 'flag', x.f.title, `${x.f.cls} · ${R || F ? orgN(x.c.org) + ' · ' : ''}${x.f.status}`, R ? `findings/view:${x.f.id}` : O ? `org/finding:${x.f.id}` : `firm/finding:${x.f.id}`, x.f.ref || ''));
  if (R) S.returnTemplates.forEach(t => add('Returns', 'table', t.name, `Return template · ${t.status}`, `returns/template:${t.id}`));
  if (R) S.filings.filter(f => isFiled(f)).slice(0, 400).forEach(f => add('Returns', 'file-text', `${orgN(f.org)} · ${tplOf(f.tpl).name}`, `${f.period || ''} · ${retStatus(f)}`, `returns/filing:${f.id}`));
  if (O) myFilings().forEach(f => add('Returns', 'file-text', tplOf(f.tpl).name, `${f.period || ''} · ${retStatus(f)}`, `org/return:${f.id}`));
  S.cases.filter(c => c.stage === 'Published' && (R || (O && c.org === S.orgId) || (F && c.firm === S.firmId))).forEach(c => add('Reports', 'file-text', `${R || F ? orgN(c.org) + ' · ' : ''}${progOf(c.prog).name}`, `Published report · score ${c.score ?? 'not given'}`, R ? `reviews/report:${c.id}` : O ? `org/report:${c.id}` : `firm/assess:${c.id}|requirements`));
  if (R) S.enfCases.forEach(c => add('Enforcement', 'gavel', `${orgN(c.org)} · ${(S.actionTypes.find(a => a.id === c.type) || {}).name || 'Action'}`, c.status, `enforcement/case:${c.id}`));
  S.regs.forEach(r => r.sections.forEach(s => s.reqs.forEach(q => add('Requirements', 'book-open-text', `${q.ref} ${q.t}`, r.name, `req:${q.ref}`, q.text || ''))));
  return it;
}
const SEARCH_GROUPS = ['Pages', 'Organisations', 'Programmes', 'Engagements', 'Findings', 'Returns', 'Reports', 'Enforcement', 'Assurance firms', 'Requirements'];
function searchRun(q, max) {
  q = (q || '').trim().toLowerCase(); if (!q) return [];
  const words = q.split(/\s+/);
  return searchIndex().filter(x => words.every(w => x.k.includes(w))).map(x => ({ ...x, sc: (x.t.toLowerCase().startsWith(q) ? 0 : x.t.toLowerCase().includes(q) ? 1 : 2) + SEARCH_GROUPS.indexOf(x.g) / 100 })).sort((a, b) => a.sc - b.sc).slice(0, max || 999);
}
function searchOpen(goArg) {
  closeDialog();
  if (goArg.startsWith('req:')) { S.ui.reqRef = goArg.slice(4); go('library/requirement'); return; }
  const i = goArg.indexOf(':'); if (i < 0) go(goArg); else openRoute(goArg.slice(0, i), goArg.slice(i + 1));
}
ACT.searchGo = a => searchOpen(a);

/* results page */
screen('search', {
  t: 'Search results', d: 'Results across programmes, findings, returns and reports', layout: 'app', ws: 'any', crumbs: () => ['Search'],
  render() {
    const q = S.ui.q || ''; const f = ui('sf', 'All'); const all = searchRun(q);
    const groups = SEARCH_GROUPS.map(g => [g, all.filter(x => x.g === g)]).filter(([, l]) => l.length);
    const shown = f === 'All' ? groups : groups.filter(([g]) => g === f);
    return `${pageHead({ over: 'Search', title: q ? `Results for “${esc(q)}”` : 'Search', sub: q ? `${all.length} result${all.length === 1 ? '' : 's'}` : 'Search programmes, findings, returns, reports and more' })}
      <form class="inp-wrap" data-form="search2" style="max-width:520px">${ic('magnifying-glass')}<input class="inp" id="q2" value="${esc(q)}" placeholder="Search" aria-label="Search" data-test="search-q"></form>
      ${groups.length ? `<div class="pills"><button class="pill ${f === 'All' ? 'on' : ''}" data-act="sf" data-arg="All">All${count(all.length)}</button>${groups.map(([g, l]) => `<button class="pill ${f === g ? 'on' : ''}" data-act="sf" data-arg="${g}" data-test="sg-${g}">${g}${count(l.length)}</button>`).join('')}</div>` : ''}
      ${shown.map(([g, l]) => `<div class="card p0" data-test="sres-${g}"><div class="tbl-tools"><div class="h4 grow">${g}</div><span class="cap muted">${l.length}</span></div><div class="list">${l.slice(0, f === 'All' ? 6 : 200).map(x => `<button class="list-row" data-act="searchGo" data-arg="${esc(x.go)}">${tile(x.i, '', 'sm')}<span class="grow" style="min-width:0"><span class="strong small" style="display:block">${hl(x.t, q.toLowerCase())}</span><span class="cap muted">${esc(x.s)}</span></span>${ic('caret-right')}</button>`).join('')}${f === 'All' && l.length > 6 ? `<button class="list-row small strong" style="color:var(--link)" data-act="sf" data-arg="${g}">Show all ${l.length} ${g.toLowerCase()}</button>` : ''}</div></div>`).join('')}
      ${q && !all.length ? `<div class="card">${empty('magnifying-glass', 'No results', 'Try a shorter word, or a reference such as ISR-4.1.')}</div>` : ''}`;
  }
});
ACT.form_search2 = () => { S.ui.q = val('q2'); S.ui.sf = 'All'; render(); };
ACT.form_search = () => { S.ui.q = val('q'); S.ui.sf = 'All'; go('search'); };

/* Ctrl/⌘ K quick switcher */
let QS_SEL = 0;
function qsList(q) {
  const res = q.trim() ? searchRun(q, 9) : searchIndex().filter(x => x.g === 'Pages').slice(0, 8);
  return res;
}
function qsPaint() {
  const box = $('#qs-res'); if (!box) return; const q = val('qs'); const res = qsList(q); S._qs = res;
  QS_SEL = Math.min(QS_SEL, Math.max(0, res.length - 1));
  let last = '';
  box.innerHTML = res.map((x, i) => { const h = x.g !== last ? `<div class="qs-g">${x.g}</div>` : ''; last = x.g; return `${h}<button class="qs-row ${i === QS_SEL ? 'on' : ''}" role="option" aria-selected="${i === QS_SEL}" data-act="searchGo" data-arg="${esc(x.go)}" data-i="${i}" data-test="qs-${i}">${ic(x.i)}<span class="grow ell"><b>${hl(x.t, q.trim().toLowerCase())}</b><span class="cap muted"> · ${esc(x.s)}</span></span>${i === QS_SEL ? `<kbd>Enter</kbd>` : ''}</button>`; }).join('')
    + (q.trim() ? `<button class="qs-row qs-all" data-act="qsAll" data-test="qs-all">${ic('magnifying-glass')}<span class="grow">See all results for “${esc(q.trim())}”</span></button>` : '')
    + (q.trim() && !res.length ? `<div class="qs-empty">Nothing matches. Try a shorter word.</div>` : '');
  const on = box.querySelector('.qs-row.on'); on && on.scrollIntoView({ block: 'nearest' });
}
ACT.qsOpen = () => {
  if (S.ws === 'public' || !$('.app')) return; QS_SEL = 0;
  openDialog(`<div class="qs" data-test="qs" role="combobox" aria-expanded="true"><div class="qs-in">${ic('magnifying-glass')}<input id="qs" placeholder="Search or jump to a page" autocomplete="off" aria-label="Search or jump to a page" aria-controls="qs-res"><kbd>Esc</kbd></div><div id="qs-res" class="qs-res" role="listbox"></div><div class="qs-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>Enter</kbd> open</span><span><kbd>${/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'}</kbd><kbd>K</kbd> open this anywhere</span></div></div>`, { qs: true });
  const d = $('#dlg .dialog'); d && d.classList.add('qs-dialog');
  const inp = $('#qs'); inp.addEventListener('input', () => { QS_SEL = 0; qsPaint(); });
  inp.addEventListener('keydown', e => { const n = (S._qs || []).length; if (e.key === 'ArrowDown') { e.preventDefault(); QS_SEL = (QS_SEL + 1) % Math.max(n, 1); qsPaint(); } if (e.key === 'ArrowUp') { e.preventDefault(); QS_SEL = (QS_SEL - 1 + n) % Math.max(n, 1); qsPaint(); } if (e.key === 'Enter') { e.preventDefault(); const x = (S._qs || [])[QS_SEL]; if (x) searchOpen(x.go); else if (inp.value.trim()) ACT.qsAll(); } });
  qsPaint(); inp.focus(); setTimeout(() => inp.focus(), 0);
};
ACT.qsAll = () => { S.ui.q = val('qs'); S.ui.sf = 'All'; closeDialog(); go('search'); };
document.addEventListener('keydown', e => { if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); if ($('#qs')) closeDialog(); else ACT.qsOpen(); } }, true);
/* the top bar search opens the switcher; "/" too */
document.addEventListener('focusin', e => { if (e.target && e.target.id === 'q') { e.target.blur(); ACT.qsOpen(); } });

/* ---------- polish: words, not dashes, for missing values ---------- */
function polishDom(root) {
  if (!root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); const hits = [];
  while (w.nextNode()) { const t = w.currentNode; if (t.nodeValue.trim() === '—' || t.nodeValue.trim() === '-') hits.push(t); }
  hits.forEach(t => { const p = t.parentElement; if (!p || p.closest('svg,code,kbd')) return; const big = p.closest('.kt-v,.kpi-n,.num,.sc-kpis b,.mio-k b'); t.nodeValue = big ? 'None yet' : 'None'; p.classList.add('na'); });
}
const _openDialog = openDialog; openDialog = function (h, o) { _openDialog(h, o); polishDom($('#dlg')); };
const _openDrawer = typeof openDrawer === 'function' ? openDrawer : null; if (_openDrawer) openDrawer = function (...a) { const r = _openDrawer(...a); polishDom($('.drawer') || document.body); return r; };

/* ---------- loading placeholders on the first visit to a dashboard ---------- */
const SKEL_SCREENS = ['dashboard', 'org/dashboard', 'firm/dashboard'];
function skeletonBody() {
  const b = (w, h, r = 8) => `<span class="skel" style="width:${w};height:${h}px;border-radius:${r}px"></span>`;
  return `<div class="col gap16" aria-busy="true" aria-label="Loading" data-test="skeleton">${b('100%', 150, 20)}<div class="ktiles">${[1, 2, 3, 4].map(() => `<div class="card col gap8">${b('50%', 12)}${b('35%', 28)}${b('70%', 10)}</div>`).join('')}</div><div class="ch-grid2"><div class="card col gap12">${b('40%', 14)}${b('100%', 180)}</div><div class="card col gap12">${b('40%', 14)}${b('100%', 180)}</div></div></div>`;
}
(function () {
  const r0 = render; S._seenScr = S._seenScr || {};
  render = function () {
    const id = S.route;
    if (SKEL_SCREENS.includes(id) && !S._seenScr[id + S.ws] && !window.__TEST && SCREENS[id] && SCREENS[id].layout === 'app') {
      S._seenScr[id + S.ws] = true; const real = SCREENS[id].render; SCREENS[id].render = () => skeletonBody(); r0(); SCREENS[id].render = real;
      setTimeout(() => { if (S.route === id) render(); }, 420); return;
    }
    r0(); polishDom($('#app'));
  };
})();
document.documentElement.lang = 'en-GB';
