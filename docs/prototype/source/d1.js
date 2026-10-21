/* ================= D1 · My dashboard, task panel, hidden demo access ================= */
const plural = (n, one, many) => n === 1 ? one : (many || one + 's');

/* ---------- what is waiting for the signed-in person, grouped ---------- */
function myTasks() {
  const orgN = id => (S.orgs[id] || {}).name || '';
  if (S.ws === 'regulator') {
    const g = [
      { id: 'enf', i: 'gavel', l: 'Enforcement decisions', go: 'enforcement:', say: n => `${n} enforcement ${plural(n, 'decision')} waiting for you`,
        items: S.enfCases.filter(c => ['Awaiting sign-off', 'Response received'].includes(c.status)).map(c => ({ t: `${orgN(c.org)} · ${atOf(c.type).name}`, sub: c.status, go: 'enforcement/case:' + c.id })) },
      { id: 'rep', i: 'stamp', l: 'Reports to review', go: 'reviews:', say: n => `${n} ${plural(n, 'report')} to review before publishing`,
        items: S.cases.filter(c => c.stage === 'Report submitted').map(c => ({ t: orgN(c.org), sub: progOf(c.prog).name, go: 'reviews/report:' + c.id })) },
      { id: 'ret', i: 'table', l: 'Returns to review', go: 'returns:review', say: n => `${n} ${plural(n, 'return')} to review`,
        items: S.filings.filter(f => ['Submitted', 'Resubmitted'].includes(f.status)).map(f => ({ t: orgN(f.org), sub: `${tplOf(f.tpl).name} · ${f.period || ''}`, go: 'returns/filing:' + f.id })) },
      { id: 'fix', i: 'flag', l: 'Fixes to close', go: 'findings:close', say: n => `${n} ${plural(n, 'fix', 'fixes')} verified by the firm, ready to close`,
        items: fixesToClose().map(x => ({ t: x.f.title, sub: orgN(x.c.org), go: 'findings/view:' + x.f.id })) },
      { id: 'ver', i: 'seal-check', l: 'Organisations to verify', go: 'organisations:Pending verification', say: n => `${n} ${plural(n, 'organisation')} to verify`,
        items: Object.values(S.orgs).filter(o => o.status === 'Pending verification').map(o => ({ t: o.name, sub: catLabel(o.type, o.tier), go: 'organisations/profile:' + o.id + '|overview' })) },
      { id: 'cls', i: 'git-diff', l: 'Classification changes', go: 'organisations:Change requested', say: n => `${n} classification ${plural(n, 'change')} to decide`,
        items: S.classReqs.filter(r => r.status === 'Pending').map(r => ({ t: orgN(r.org), sub: 'Asked for a different category', go: 'organisations:Change requested' })) },
      { id: 'acc', i: 'certificate', l: 'Accreditation applications', go: 'firms:In review', say: n => `${n} accreditation ${plural(n, 'application')} to review`,
        items: S.accApps.filter(a => a.status === 'In review').map(a => ({ t: (S.firms[a.firm] || {}).name || 'Firm', sub: a.type, go: 'firms/profile:' + a.firm + '|accreditations' })) }];
    return g;
  }
  if (S.ws === 'organisation') {
    const td = orgTodo(S.orgId); const pick = is => td.filter(x => is.includes(x.i)).map(x => ({ t: x.t, sub: x.sub || '', go: x.go, due: x.due, test: x.test }));
    return [
      { id: 'act', i: 'gavel', l: 'Regulatory actions', go: 'org/actions', items: pick(['gavel', 'money']) },
      { id: 'ret', i: 'table', l: 'Data returns', go: 'org/returns', items: pick(['table', 'chat-circle-dots']) },
      { id: 'fix', i: 'flag', l: 'Findings to fix', go: 'org/findings', items: pick(['flag', 'wrench']) },
      { id: 'asm', i: 'list-checks', l: 'Assessments', go: 'org/obligations', items: pick(['handshake', 'pencil-simple', 'eye']) }];
  }
  if (S.ws === 'firm') {
    const cs = S.cases.filter(c => c.firm === S.firmId);
    return [
      { id: 'req', i: 'envelope-simple', l: 'Engagement requests', go: 'firm/engagements', say: n => `${n} engagement ${plural(n, 'request')} to accept or decline`,
        items: cs.filter(c => ENG_GROUP(c) === 'Requests').map(c => ({ t: orgN(c.org), sub: progOf(c.prog).name, go: 'firm/engagements', due: c.due })) },
      { id: 'asm', i: 'clipboard-text', l: 'Assessments to complete', go: 'firm/engagements', say: n => `${n} ${plural(n, 'assessment')} submitted and waiting for you`,
        items: cs.filter(c => ['Submitted', 'Assessing', 'In preview', 'Returned'].includes(c.stage)).sort((a, b) => (a.due || '').localeCompare(b.due || '')).map(c => ({ t: orgN(c.org), sub: `${progOf(c.prog).name} · ${c.stage}`, go: `firm/assess:${c.id}|requirements`, due: c.due, test: 'fsoon-' + c.id })) },
      { id: 'fix', i: 'flag', l: 'Fixes to verify', go: 'firm/findings', say: n => `${n} ${plural(n, 'fix', 'fixes')} sent with proof, waiting for you to verify`,
        items: allFindings().filter(x => x.c.firm === S.firmId && x.f.status === 'Fix submitted').map(x => ({ t: x.f.title, sub: orgN(x.c.org), go: 'firm/finding:' + x.f.id })) }];
  }
  return [];
}
const taskTotal = () => myTasks().reduce((a, g) => a + g.items.length, 0);

/* ---------- top bar button and side panel ---------- */
function taskBtn() {
  if (!['regulator', 'organisation', 'firm'].includes(S.ws)) return '';
  const n = taskTotal();
  return `<button class="icon-btn tb-tasks" data-act="tasks" aria-label="Tasks waiting for you${n ? ': ' + n : ''}" title="Waiting for you" data-test="tasks-btn">${ic('check-square-offset')}${n ? `<span class="tb-n tnum">${n > 99 ? '99+' : n}</span>` : ''}</button>`;
}
ACT.tasks = () => {
  const gs = myTasks().filter(g => g.items.length); const n = gs.reduce((a, g) => a + g.items.length, 0);
  const row = x => `<button class="list-row tp-row" data-act="taskGo" data-arg="${esc(x.go)}"${x.test ? ` data-test="${x.test}"` : ''}><span class="grow" style="min-width:0"><span class="strong small" style="display:block">${esc(x.t)}</span>${x.sub || x.due ? `<span class="cap muted">${esc(x.sub || '')}${x.sub && x.due ? ' · ' : ''}${x.due ? dueText(x.due) : ''}</span>` : ''}</span>${ic('caret-right')}</button>`;
  openDrawer(`<div class="col gap16" data-test="task-panel"><div class="row top"><div class="grow"><div class="overline">Waiting for you</div><h2 class="h3" style="margin-top:4px">${n ? `${n} ${plural(n, 'task')}` : 'All clear'}</h2></div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div>
    ${gs.map(g => `<section class="tp-g" data-test="tg-${g.id}"><div class="row gap8">${tile(g.i, 'brand', 'sm')}<b class="grow">${esc(g.l)}</b><span class="count">${g.items.length}</span><button class="link small strong" data-act="taskGo" data-arg="${esc(g.go)}" data-test="tg-open-${g.id}">Open</button></div><div class="list">${g.items.slice(0, 5).map(row).join('')}${g.items.length > 5 ? `<button class="list-row small strong tp-more" data-act="taskGo" data-arg="${esc(g.go)}">See all ${g.items.length}</button>` : ''}</div></section>`).join('') || empty('check-circle', 'Nothing is waiting for you', 'New work appears here as soon as it arrives.')}</div>`);
};
ACT.taskGo = a => { closeDrawer(); const i = a.indexOf(':'); if (i < 0) go(a); else openRoute(a.slice(0, i), a.slice(i + 1)); };

/* ---------- the greeting: what needs attention today, then quick actions ---------- */
function myHero(o) {
  const p = persona(); const gs = myTasks(); const total = gs.reduce((a, g) => a + g.items.length, 0);
  let top;
  if (S.ws === 'organisation') top = orgTodo(S.orgId).slice(0, 3).map((x, k) => ({ t: x.t, due: x.due, go: x.go, i: x.i, test: 'ht-' + k }));
  else top = gs.filter(g => g.items.length).slice(0, 3).map(g => ({ t: g.say(g.items.length), go: g.go, i: g.i, test: 'ht-' + g.id }));
  const over = o.ent ? `${esc(o.ent.name)} · ${fmtD(TODAY)}` : fmtD(TODAY);
  return `<section class="my-hero" data-test="my-hero">${o.ent ? `<div class="mh-logo">${logo(o.ent, 48)}</div>` : ''}<div class="grow" style="min-width:0">
    <div class="overline" style="color:var(--brand-200)">${over}</div><h1 class="serif">${dashGreeting()}, ${esc(p.first || p.name)}</h1>
    ${o.line ? `<p class="mh-line">${o.line}</p>` : ''}
    ${top.length ? `<div class="mh-h">Needs your attention</div><ul class="mh-list">${top.map(x => `<li><button data-act="taskGo" data-arg="${esc(x.go)}" data-test="${x.test}">${ic(x.i)}<span class="grow">${esc(x.t)}</span>${x.due ? `<span class="mh-due">${dueText(x.due)}</span>` : ''}${ic('arrow-right')}</button></li>`).join('')}</ul>` : `<p class="mh-line">Nothing is waiting for you right now.</p>`}
    <div class="mh-acts">${total ? btn(`See all ${total} ${plural(total, 'task')}`, { v: 'white', size: 'sm', i: 'check-square-offset', act: 'tasks', test: 'hero-tasks' }) : ''}${o.actions || ''}</div></div></section>`;
}
const heroBtn = (l, i, o) => btn(l, Object.assign({ v: 'ghost-light', size: 'sm', i }, o));

/* ---------- rename to My dashboard ---------- */
['regulator', 'organisation', 'firm'].forEach(w => { const n = (NAV[w] || []).find(x => /dashboard$/.test(x.go || '')); if (n) n.l = 'My dashboard'; });
['dashboard', 'org/dashboard', 'firm/dashboard'].forEach(id => { if (SCREENS[id]) { SCREENS[id].t = 'My dashboard'; SCREENS[id].crumbs = ['My dashboard']; } });

/* ---------- hidden demo access on the sign-in page ---------- */
function demoAccounts() {
  const open = !!S.ui.demoOpen;
  return `<div class="demo-wrap" data-test="demo-accts"><button type="button" class="demo-link" data-act="demoToggle" aria-expanded="${open}" data-test="demo-link">Demo access ${ic(open ? 'caret-up' : 'caret-down')}</button>
    ${open ? `<div class="demo-pop" role="region" aria-label="Demo accounts"><div class="cap muted" style="padding:2px 4px 6px">Prototype only. Any password and any 6-digit code work.</div>${DEMO_ACCTS.map(([w, n, em]) => `<div class="demo-row"><span class="grow" style="min-width:0"><b>${esc(n)}</b><span>${esc(w)} · ${esc(em)}</span></span><button type="button" class="btn btn-secondary btn-sm" data-act="demoCopy" data-arg="${em}" aria-label="Copy ${esc(em)}" data-test="copy-${em.split('@')[0]}">${ic('copy')}<span>Copy</span></button><button type="button" class="btn btn-primary btn-sm" data-act="demoFill" data-arg="${em}" data-test="demo-${em.split('@')[0]}"><span>Use</span></button></div>`).join('')}</div>` : ''}</div>`;
}
ACT.demoToggle = () => { S.ui.demoOpen = !S.ui.demoOpen; const v = $('#si-email') ? $('#si-email').value : null; render(); if (v != null && $('#si-email')) $('#si-email').value = v; };
ACT.demoCopy = em => {
  const done = () => toast(`Copied ${esc(em)}`, 'ok', 'copy'); S._copied = em;
  try { navigator.clipboard.writeText(em).then(done, () => { fallbackCopy(em); done(); }); } catch (e) { fallbackCopy(em); done(); }
};
function fallbackCopy(t) { try { const a = document.createElement('textarea'); a.value = t; a.style.position = 'fixed'; a.style.opacity = '0'; document.body.appendChild(a); a.select(); document.execCommand('copy'); a.remove(); } catch (e) {} }
const _demoFill = ACT.demoFill; ACT.demoFill = em => { S.ui.demoOpen = false; _demoFill(em); };
document.addEventListener('click', e => { if (S.ui && S.ui.demoOpen && !e.target.closest('.demo-wrap')) { S.ui.demoOpen = false; const p = $('.demo-pop'); if (p) { p.remove(); const l = $('.demo-link'); l && l.setAttribute('aria-expanded', 'false'); } } });
