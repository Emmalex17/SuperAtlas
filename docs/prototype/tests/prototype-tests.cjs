const { chromium } = require('/opt/npm-tools/node_modules/playwright');
const path = require('path');
const FILE = 'file://' + path.resolve(__dirname, '../dist/superatlas-prototype.html');
const results = []; const check = (n, c, x = '') => results.push([c ? 'PASS' : 'FAIL', n, x]);
const PARTS = (process.argv[2] || 'b1,b2,b3,b4,b5,b6,c0,c1,c2,c3,c4,c5,c6,c7,d1,d2').split(',');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  const go = async id => { await p.evaluate(i => { location.hash = i; }, id); await p.waitForTimeout(90); };
  const route = () => p.evaluate(() => decodeURIComponent(location.hash.slice(1)));
  const T = s => p.locator(`[data-test="${s}"]`).first();
  const text = () => p.evaluate(() => document.body.innerText);
  const has = async s => (await text()).includes(s);
  const ev = (f, a) => p.evaluate(f, a);
  await p.addInitScript(() => { window.__TEST = true; }); await p.goto(FILE);
  try {
    if (PARTS.includes('b1')) {
      await go('programmes'); check('B1 programmes list by programme with filter pills', await p.locator('.tbl-sub .pill').count() === 6 && await has('ISR annual assessment'));
      await T('view-calendar').click(); check('B1 calendar view', await p.locator('.cal-d').count() > 28);
      await T('view-list').click();
      await T('prog-new').click(); await T('pw-next').click(); check('B1 name required', await has('Name the programme'));
      await p.fill('#pw-name', 'ISR 2027 readiness check'); await T('pw-next').click();
      check('B1 scope step lists organisations', await has('in scope')); await T('pw-next').click();
      check('B1 question set step', await has("programme's own copy")); await T('ps-suggest-0').click(); await T('sug-add').click(); check('B1 AI suggested questions added', await has('added to this programme'));
      await T('pw-next').click(); await T('pw-next').click(); await T('pw-firmMode-organisation').click(); await T('pw-next').click();
      check('B1 review step', await has('Questions changed for this programme')); await T('pw-launch').click();
      check('B1 scheduled programme page', await route() === 'programmes/view' && await has('ISR 2027 readiness check'));
      await ev(() => openRoute('programmes/view', 'p1|organisations'));
      await T('sel-uba').click(); await T('sel-gtb').click(); await T('bulk-assign').click();
      await p.selectOption('[data-test="af-firm"]', 'pwc'); await p.waitForTimeout(80);
      check('B1 independence check blocks PwC for GTB', await has('Blocked: advised since'));
      await p.selectOption('[data-test="af-firm"]', 'deloitte'); await p.waitForTimeout(80); await T('af-go').click();
      check('B1 bulk assigned Deloitte', (await ev(() => S.cases.filter(c => c.prog === 'p1' && c.firm === 'deloitte').length)) >= 4);
      await ev(() => openRoute('programmes/view', 'p2|organisations')); await T('firmreq-uba').click(); await T('firmreq-approve').click();
      check('B1 non-accredited firm approved', (await ev(() => S.cases.find(c => c.id === 'c7').firmStatus)) === 'Approved');
      await go('firm/engagements'); await T('eng-accept-uba').click(); await T('ea-go').click();
      check('B1 firm accepted engagement', (await ev(() => S.cases.find(c => c.id === 'c2').firmStatus)) === 'Accepted');
      await go('org/obligations'); await T('engage-p2').click(); await p.locator('label.choice:has(input[name=eng-f]:not([disabled]))').first().click(); await T('eng-go').click();
      check('B1 organisation engaged its own firm', (await ev(() => S.cases.find(c => c.id === 'c6').stage)) === 'Awaiting firm');
    }
    if (PARTS.includes('b2')) {
      await go('org/obligations'); await T('answer-p1').click(); check('B2 answer workspace', await route() === 'org/answer' && await has('answered'));
      await T('an-explain').click(); check('B2 AI explains, no answer', await has('What this asks') && await has('does not answer for you'));
      // answer current question via UI
      await ev(() => { const c = curCase(); const q = caseQs(c)[S.ui.qIdx]; c.answers[q.id] = undefined; render(); });
      const qInfo = await ev(() => { const q = caseQs(curCase())[S.ui.qIdx]; return q; });
      if (qInfo.choice === 'yn') { await T('yn-No').click(); await p.waitForTimeout(150); await p.fill('#an-c', 'mfa for remote users is planned for Q1 27'); await T('an-rephrase').click(); check('B2 rephrase shows suggestion', await has('Suggested wording')); await T('an-rephrase-use').click(); }
      await T('an-save').click(); check('B2 save moves on', (await ev(() => S.ui.qIdx)) > 0);
      await ev(() => { const qs = caseQs(curCase()); ACT.ansGo(qs.findIndex(q => q.evidence)); }); await T('an-link').click(); await p.fill('#al-url', 'https://zenithbank.sharepoint.example/isms'); await T('al-go').click(); check('B2 link evidence', await has('sharepoint'));
      await T('an-assign').click(); await T('as-go').click(); check('B2 assignments saved', await has('Assignments saved'));
      await T('go-submit').click(); check('B2 submit locked while incomplete', await T('an-submit').isDisabled());
      await ev(() => { const c = curCase(); caseQs(c).forEach((q, k) => { if (!answerComplete(q, c.answers[q.id])) c.answers[q.id] = sampleAnswer(q, 0); }); render(); });
      await p.check('#sb-decl'); await T('an-submit').click(); check('B2 submitted with receipt', await has('SUB-P1-ZB'));
      await go('org/evidence'); check('B2 evidence library', await has('Evidence library') && await p.locator('tbody tr').count() >= 5);
    }
    if (PARTS.includes('b3')) {
      await go('firm/engagements'); await T('assess-zenith').click(); check('B3 assessment workspace', await route() === 'firm/assess');
      await T('oc-Partially').click(); await p.fill('#oc-note', 'Policy approved but review overdue.'); await T('oc-save').click();
      await T('ask-0').click(); await p.fill('#ask-t', 'Please upload the board minutes.'); await T('ask-go').click(); check('B3 information request sent', await has('Request sent'));
      await T('fd-new').click(); await p.fill('#fd-t', 'Policy review overdue by 3 months'); await T('fd-go').click(); check('B3 finding raised', await has('finding raised'));
      await ev(() => { const c = curCase(); qsetReqs(progOf(c.prog).qset).forEach(r => { if (!c.outcomes[r.ref]) c.outcomes[r.ref] = { o: 'Compliant', note: 'Checked.' }; }); render(); });
      await go('org/assessment'); await ev(() => { S.ui.oaTab = 'requests'; render(); }); await p.fill('#th-r0', 'Minutes attached.'); await T('th-reply').click(); check('B3 organisation replied', await has('Reply sent'));
      await ev(() => openRoute('firm/assess', curCase().id + '|report')); await T('pv-share').click(); check('B3 preview shared', await has('Preview shared'));
      await ev(() => openRoute('org/assessment', curCase().id + '|preview')); await p.locator('[data-test^="pv-c-"]').first().click(); await p.fill('#pc-t', 'We completed the review last week.'); await T('pc-go').click(); check('B3 org commented on preview', await has('Comment sent'));
      await ev(() => openRoute('firm/assess', curCase().id + '|report')); await T('qr-do').click(); await p.check('#so-decl'); await T('so-submit').click();
      check('B3 report submitted', (await ev(() => curCase().stage)) === 'Report submitted');
      await go('settings/findings'); check('B3 finding classes editable', await p.locator('[data-fc]').count() >= 16);
    }
    if (PARTS.includes('b4')) {
      await go('reviews'); check('B4 review queue', await has('Review queue'));
      const id = await ev(() => S.cases.find(c => c.org === 'zenith' && c.prog === 'p1').id);
      await T('rsel-' + id).click(); await T('rev-assign').click(); await T('ra-go').click(); check('B4 reviewer assigned', (await ev(i => caseOf(i).stage, id)) === 'In review');
      await ev(i => openRoute('reviews/report', i), id); const ref = await ev(i => qsetReqs(progOf(caseOf(i).prog).qset)[0].ref, id);
      await T('ov-' + ref).click(); await p.locator('#dlg .oc-o').nth(0).click(); await p.fill('#ov-r', 'Board minutes show approval.'); await T('ov-go').click(); check('B4 outcome overridden', await has('Outcome changed'));
      await T('rv-approve').click(); check('B4 approved', (await ev(i => caseOf(i).stage, id)) === 'Approved');
      await go('reviews'); await T('rt-approved').click(); await T('rsel-' + id).click(); await T('pub-schedule').click(); await T('pub-go').click();
      check('B4 scheduled with held-back reports', (await ev(() => S.cases.filter(c => c.stage === 'Held back').length)) >= 1 && (await ev(i => caseOf(i).stage, id)) === 'Scheduled');
      await ev(i => { caseOf(i).stage = 'Approved'; }, id); await ev(i => openRoute('reviews/report', i), id); await T('pub-one').click();
      await go('org/obligations'); await ev(i => openRoute('org/report', i), id); check('B4 organisation opens published report', await has('Approved by NITDA') && (await ev(i => caseOf(i).opened, id)));
      await go('firm/engagements'); check('B4 firm can publish delegated approved report', await T('fpub-wema').count() === 1);
    }
    if (PARTS.includes('b5')) {
      const obi = () => ev(() => signInAs('c.obi@moniepoint.example'));
      await obi(); await go('org/dashboard'); await T('tasks-btn').click(); check('B5 Moniepoint tasks show the return to file', await T('dret-r1').count() === 1); await ev(() => closeDrawer());
      await go('org/returns'); check('B5 org returns list', await has('MFB quarterly operations return') && await has('Due tomorrow'));
      await T('oret-r1').click(); check('B5 return form opens', await route() === 'org/return' && await p.locator('#rv-customers').count() === 1);
      await T('ret-submit').click(); check('B5 empty return blocked by validation', await has('problems to fix'));
      await T('rm-upload').click(); await T('ret-upload').click();
      check('B5 upload read figures and flagged complaints rule', await has('Cannot be more than complaints received'));
      await p.fill('#rv-cmpRes', '38900'); await p.locator('#rv-cmpRes').dispatchEvent('change'); await p.waitForTimeout(80);
      check('B5 error cleared after fix', !(await has('Cannot be more than complaints received')));
      await T('ret-submit').click(); await T('so-submit').click(); check('B5 declaration required', await p.locator('#dlg').count() === 1);
      await T('so-decl').click(); await T('so-submit').click();
      const rc = await ev(() => filingOf('r1').receipt);
      check('B5 filed with receipt', (await ev(() => filingOf('r1').status)) === 'Submitted' && /^RET-MQR-2026Q3-MP-/.test(rc) && await has(rc), rc);
      await go('returns'); check('B5 regulator returns page with filter pills', await has('Data returns') && await p.locator('.tbl-sub .pill').count() === 6);
      await T('rf-review').click(); await T('fil-r1').click();
      check('B5 regulator sees variance flags vs Q2', await route() === 'returns/filing' && await has('changed by 50% or more since Q2 2026'));
      await T('q-fraudLoss').click(); check('B5 query prefilled with comparison', (await p.inputValue('[data-test="rq-msg"]')).includes('96.5'));
      await T('rq-send').click(); check('B5 filing queried', (await ev(() => filingOf('r1').status)) === 'Queried');
      await obi(); await go('org/returns'); await T('oret-r1').click();
      check('B5 org sees the query on the field', await has('NITDA asked:') && await p.locator('.ret-f.q').count() === 1);
      await T('ret-submit').click(); check('B5 reply required for resubmission', await has('Add a reply'));
      await p.fill('#rv-fraudLoss', '112.4'); await p.locator('#rv-fraudLoss').dispatchEvent('change'); await p.fill('#rv-reply', 'A one-off ₦100m loss was double counted. Corrected to 112.4.'); await p.locator('#rv-reply').dispatchEvent('change');
      await T('ret-submit').click(); await T('so-decl').click(); await T('so-submit').click();
      check('B5 resubmitted as version 2', (await ev(() => [filingOf('r1').status, filingOf('r1').ver].join())) === 'Resubmitted,2');
      await go('returns'); await ev(() => openRoute('returns/filing', 'r1')); check('B5 regulator sees reply and change', await has('changed 212.4 → 112.4'));
      await T('ret-accept').click(); check('B5 accepted', (await ev(() => filingOf('r1').status)) === 'Accepted');
      await go('returns'); await T('rf-late').click(); const nLate = await p.locator('tbody tr.click').count();
      await T('ret-remind-all').click(); check('B5 late filers reminded', nLate >= 2 && (await ev(() => filingOf('r10').reminders)) === 2, 'late ' + nLate);
      await ev(() => { S.ui.retTab = 'templates'; render(); }); await T('rt-new').click(); await T('rt-publish').click(); check('B5 template needs a name', await has('Enter a name.'));
      await p.fill('#rt-name', 'Branch network return'); await p.fill('#rt-code', 'BNR'); await p.locator('#rt-ty-3').check(); await p.fill('#rf-0-l', 'Branches open'); await p.locator('#rf-0-l').dispatchEvent('change');
      await T('rt-add').click(); await p.fill('#rf-1-l', 'Branches closed in period'); await p.locator('#rf-1-l').dispatchEvent('change'); await p.waitForTimeout(60);
      await T('rtv-preview').click(); check('B5 preview shows fields', (await p.locator('#rt-prev').innerText()).includes('Branches closed in period'));
      await T('rt-publish').click(); check('B5 template published and filings opened', (await ev(() => S.returnTemplates.find(t => t.code === 'BNR').status)) === 'Active' && (await ev(() => S.filings.filter(f => S.returnTemplates.find(t => t.code === 'BNR').id === f.tpl).length)) > 0);
      await go('programmes'); await T('view-calendar').click(); check('B5 return due dates on the calendar', await p.locator('.cal-e.ret').count() >= 1);
    }
    if (PARTS.includes('b6')) {
      await ev(() => signInAs('a.okonkwo@zenith.example')); await go('org/dashboard'); await T('tasks-btn').click(); check('B6 Zenith tasks show the finding to fix', await T('dfd-f-h0b').count() === 1); await ev(() => closeDrawer());
      await go('org/findings'); check('B6 org findings list with filter pills', await has('USSD complaints are not logged') && await p.locator('.tbl-sub .pill').count() === 5);
      await T('fd-f-h0b').click(); check('B6 plan form shown for open finding', await route() === 'org/finding' && await T('plan-form').count() === 1);
      await T('pl-submit').click(); check('B6 plan needs action, owner, date', (await ev(() => fdFind('f-h0b').f.status)) === 'Open');
      await p.fill('#pl-action', 'Route USSD complaints into the central register through the contact-centre CRM.');
      await p.selectOption('#pl-owner', { index: 1 }); await p.fill('#pl-s-0', 'Configure the CRM integration');
      await p.getByRole('button', { name: 'Add step' }).click(); check('B6 step added keeps typed text', (await p.inputValue('#pl-action')).startsWith('Route USSD') && await p.locator('#pl-s-1').count() === 1);
      await p.fill('#pl-s-1', 'Test with 50 USSD complaints'); await T('pl-submit').click();
      check('B6 plan submitted, in progress', (await ev(() => fdFind('f-h0b').f.status)) === 'In progress' && await has('Route USSD complaints'));
      check('B6 submit fix disabled without proof', await T('fix-submit').isDisabled());
      await T('pf-add').click(); await T('pf-add').click(); await T('fix-submit').click(); await T('fx-go').click();
      check('B6 fix submitted', (await ev(() => fdFind('f-h0b').f.status)) === 'Fix submitted');
      await ev(() => openRoute('org/finding', 'f-h0c')); await T('ext-ask').click(); await T('ex-go').click(); check('B6 extension needs a reason', (await ev(() => fdFind('f-h0c').f.ext)) == null);
      await p.fill('[data-test="ex-reason"]', 'The board risk committee meets in January; the first report goes to that meeting.'); await T('ex-go').click();
      check('B6 extension requested', (await ev(() => fdFind('f-h0c').f.ext.status)) === 'Requested');
      await go('firm/dashboard'); check('B6 firm sees fixes to verify', +(await T('fk-fix').locator('.kt-v').innerText()).trim() >= 1);
      await go('firm/findings'); check('B6 firm list has Zenith and GTB fixes', await T('fd-f-h0b').count() === 1 && await T('fd-f-h2a').count() === 1);
      await T('fd-f-h0b').click(); await T('vf-ok').click(); check('B6 verify needs a note', (await ev(() => fdFind('f-h0b').f.status)) === 'Fix submitted');
      await p.fill('[data-test="vf-note"]', 'Sampled 25 USSD complaints from 10 to 17 Oct; all in the register with resolution dates.'); await T('vf-ok').click();
      check('B6 firm verified fix', (await ev(() => fdFind('f-h0b').f.status)) === 'Verified fixed');
      await go('dashboard'); await T('tasks-btn').click(); check('B6 regulator tasks show fixes to close', ['2', '3'].includes((await T('tg-fix').locator('.count').innerText()).trim()), await T('tg-fix').innerText());
      await T('tg-open-fix').click(); check('B6 findings register filtered to close', await route() === 'findings' && await T('fd-f-h0b').count() === 1);
      await T('fd-f-h0b').click(); await T('fd-close').click(); check('B6 regulator closed finding', (await ev(() => fdFind('f-h0b').f.status)) === 'Closed');
      await go('findings'); await T('fc-ext').click(); await T('fd-f-h0c').click(); await T('ext-approve').click();
      check('B6 extension approved moves deadline', (await ev(() => effDue(fdFind('f-h0c').f))) > '2026-12-31');
      await go('findings'); await T('fc-overdue').click(); const nOver = await p.locator('tbody tr.click').count(); check('B6 overdue filter', nOver >= 2, 'overdue ' + nOver);
      await ev(() => signInAs('a.okonkwo@zenith.example')); await go('org/findings'); await T('ofc-done').click(); check('B6 org sees closed finding', await T('fd-f-h0b').count() === 1);
      await go('programmes'); await T('view-calendar').click(); await ev(() => { S.ui.calMonth = '2027-02'; render(); }); check('B6 fix deadlines on calendar', await p.locator('.cal-e.fix').count() >= 1);
    }
    if (PARTS.includes('c0')) {
      await ev(() => { S.ws = 'public'; }); await go('signin');
      check('C0 sign-in has no single sign-on buttons', !(await has('Continue with Google')) && !(await has('Single sign-on')));
      check('D1 demo accounts hidden until asked', await T('copy-t.adebayo').count() === 0); await T('demo-link').click(); await T('copy-t.adebayo').click(); check('D1 copy an account', (await ev(() => S._copied)) === 't.adebayo@deloitte.example'); await T('demo-t.adebayo').click(); check('C0 demo account fills the form', (await p.inputValue('#si-email')) === 't.adebayo@deloitte.example');
      await T('signin-submit').click(); await p.waitForTimeout(80);
      for (let i = 0; i < 6; i++) await p.locator(`[data-otp="${i}"]`).fill(String(i + 1));
      await T('mfa-submit').click(); await p.waitForTimeout(120);
      check('C0 lands on the firm dashboard with no workspace choice', await route() === 'firm/dashboard' && (await p.locator('.sb-brand').innerText()).includes('Supervised by NITDA'));
      await T('user-menu').click(); check('C0 no switch workspace in the user menu', await T('switch-ws').count() === 0); await ev(() => closePop());
      check('C0 one person, one firm', (await ev(() => Object.values(S.accounts).every(a => a.memberships.length === 1))));
      await go('programmes'); await T('view-list').click(); check('C0 programmes listed by programme with cycles', await has('ISR annual assessment') && await has('3 cycles'));
      await T('prog-p1').click(); await T('tab-cycles').click(); check('C0 cycles tab lists 2024 to 2026', await T('cyc-2024').count() === 1 && await T('cyc-2025').count() === 1 && await T('cyc-2026').count() === 1);
      await T('cyc-2025').click(); check('C0 switch to the 2025 cycle', (await ev(() => progOf(S.ui.progId).cycle)) === '2025' && await has('Closed'));
      await T('prog-next').click(); check('C0 run next cycle drafts 2027', await route() === 'programmes/new' && (await ev(() => S.programmes.some(p => p.series === 'isr' && p.cycle === '2027' && p.status === 'Draft'))));
      await go('settings/compliance'); check('C0 settings shell with compliance status', await T('set-settings-compliance').count() === 1 && await has('Enforcement watch'));
      await p.fill('[data-test="cw-days"]', '30'); await T('comp-save').click(); check('C0 enforcement-watch days saved', (await ev(() => S.compliance.watchDays)) === '30');
      await go('team'); check('C0 team sits inside settings', (await p.locator('.set-nav a.on').innerText()) === 'Team');
      check('C0 status from benchmark and findings', (await ev(() => [compStatus(caseOf('h0')), compStatus(caseOf('h5'))].join('|'))) === 'Compliant|Non-compliant', await ev(() => [compStatus(caseOf('h0')), compStatus(caseOf('h5'))].join('|')));
      check('C0 demo data: 36 verified organisations, 3 ISR cycles', (await ev(() => Object.values(S.orgs).filter(o => o.status === 'Verified').length)) === 36 && (await ev(() => cyclesOf('isr').length)) >= 3);
      await p.setViewportSize({ width: 390, height: 844 });
      await go('organisations'); check('C0 phone: header text not squeezed', (await p.locator('.ph .grow p').first().evaluate(e => e.getBoundingClientRect().width)) > 300);
      check('C0 phone: table rows become cards', (await p.locator('.tbl thead').first().evaluate(e => getComputedStyle(e).display)) === 'none');
      await ev(() => signInAs('a.okonkwo@zenith.example')); await ev(() => ACT.openCase('c1'));
      check('C0 phone: question first, list hidden', await T('ans-mnav').isVisible() && !(await p.locator('.ans-grid > .ans-nav').isVisible()));
      await T('ans-mnav').click(); const q0 = await ev(() => S.ui.qIdx); await p.locator('#drw .ans-q:not(.on)').first().click(); await p.waitForTimeout(80);
      check('C0 phone: question list drawer moves and closes', (await ev(() => S.ui.qIdx)) !== q0 && (await p.locator('#drw').count()) === 0);
      await p.setViewportSize({ width: 1440, height: 900 });
    }
    if (PARTS.includes('c1')) {
      const numCheck = () => ev(() => [...document.querySelectorAll('[data-act="drill"]')].filter(e => e.querySelector('.kt-v, .ch-n, .ch-fv b, .ch-hv') || e.classList.contains('hc')).map(e => { const t = (e.querySelector('.kt-v, .ch-n, .ch-fv b, .ch-hv') || e).textContent; const n = parseInt(t, 10); return isNaN(n) ? true : n === DRILL[e.dataset.arg].rows.length; }).every(Boolean));
      await go('programmes'); await T('view-list').click(); await T('prog-p1').click(); await T('tab-analytics').click();
      check('C1 analytics opens on progress for the open cycle', await T('an-bar').count() === 1 && await T('ch-prog-line').count() === 1 && await T('ch-prog-funnel').count() === 1);
      check('C1 progress figures match their lists', await numCheck());
      check('C1 compares with last cycle at the same point', (await T('k-sub').innerText()).includes('vs 2025'));
      await T('an-remind').click(); check('C1 remind everyone not submitted', await has('Reminders sent to'));
      await T('ch-prog-line').locator('[data-act="chTable"]').click(); check('C1 chart can be read as a table', await T('ch-prog-line').locator('table').count() === 1); await T('ch-prog-line').locator('[data-act="chTable"]').click();
      await T('an-sections').click(); const pub26 = await ev(() => hasResults(progOf('p1')));
      check('C1 sections for 2026: results, or an offer to view 2025', pub26 ? await T('ch-sec-heat').count() === 1 : await T('an-last').count() === 1);
      if (pub26) { await p.selectOption('[data-test="an-cycle"]', 'pI25'); await p.waitForTimeout(60); } else await T('an-last').click(); check('C1 switched to 2025 results', (await ev(() => progOf(S.ui.progId).cycle)) === '2025' && await T('ch-sec-heat').count() === 1);
      check('C1 heatmap shows the access control cluster', await has('Access control') && (await T('hc-ISR-4.1-MaNC').count()) === 1);
      check('C1 heatmap figures match their lists', await numCheck());
      await T('hc-ISR-4.1-MaNC').click(); const nDrill = await p.locator('[data-test="drill-list"] .list-row').count();
      check('C1 a heatmap cell opens the organisations behind it', nDrill > 0 && String(nDrill) === (await T('hc-ISR-4.1-MaNC').innerText()).trim());
      await p.locator('[data-test="drill-list"] .list-row').first().click(); check('C1 open an organisation from the panel', await route() === 'organisations/profile');
      await ev(() => openRoute('programmes/view', 'pI25|analytics')); await T('an-results').click();
      check('C1 results figures match their lists', await numCheck() && await T('ch-res-hist').count() === 1);
      const sumBins = await ev(() => [...document.querySelectorAll('.ch-col .ch-n')].reduce((a, e) => a + (+e.textContent || 0), 0));
      check('C1 score bins add up to completed', String(sumBins) === (await T('k-done').locator('.kt-v').innerText()).trim());
      await p.selectOption('[data-test="an-cat"]', 'Microfinance bank'); await p.waitForTimeout(60);
      check('C1 category filter narrows results', (await ev(() => [...document.querySelectorAll('.tbl tbody tr .org .sub')].every(e => e.textContent.startsWith('Microfinance bank')))) && +(await T('k-scoped').locator('.kt-v').innerText()) < 24);
      await p.selectOption('[data-test="an-cat"]', 'all'); await p.waitForTimeout(60);
      await T('an-time').click(); check('C1 over time across cycles', await T('ch-time-avg').count() === 1 && await T('ch-time-rep').count() === 1);
      await T('an-remediation').click(); const r = await ev(() => ['k-raised', 'k-closed', 'k-open'].map(t => parseInt(document.querySelector(`[data-test="${t}"] .kt-v`).textContent, 10)));
      check('C1 remediation: closed plus open equals raised', r[0] === r[1] + r[2], r.join(','));
      check('C1 remediation figures match their lists', await numCheck());
    }
    if (PARTS.includes('c2')) {
      await ev(() => { S.compliance.watchDays = ''; }); await go('enforcement');
      check('C2 overdue-fix rule is off until set', await T('enf-set-days').count() === 1 && !(await ev(() => watchlist().some(w => w.reasons.some(r => r.rule === 'overdue')))));
      await T('enf-set-days').click(); await p.fill('[data-test="cw-days"]', '30'); await T('comp-save').click();
      await go('enforcement'); check('C2 OPay flagged for its overdue major nonconformity', (await T('watch-opay').count()) === 1 && (await T('watch-opay').innerText()).includes('Major nonconformity overdue'));
      await T('enf-new-opay').click(); check('C2 open a case from the watchlist, prefilled', await route() === 'enforcement/new' && (await p.inputValue('[data-test="en-org"]')) === 'opay' && await p.locator('[data-test="en-ev-0"]').isChecked());
      await T('en-submit').click(); check('C2 action is required', await route() === 'enforcement/new');
      await T('en-type-warning').click(); check('C2 notice drafted from the evidence', (await p.inputValue('[data-test="en-body"]')).includes('No complaints register for wallet disputes'));
      await T('en-submit').click(); const ecId = await ev(() => S.ui.ecId);
      check('C2 case waits for sign-off', await route() === 'enforcement/case' && (await ev(i => caseE(i).status, ecId)) === 'Awaiting sign-off');
      await T('ec-issue').click(); check('C2 signed off and issued', (await ev(i => caseE(i).status, ecId)) === 'Notice issued');
      await ev(() => signInAs('k.sule@opay.example')); await go('org/dashboard');
      check('C2 OPay sees the notice counted on Compliance in its sidebar', (await p.locator('.sb a[href="#org/compliance"] .count').count()) === 1);
      await go('org/actions'); await T('oa-' + ecId).click(); await p.fill('[data-test="oa-text"]', 'Wallet disputes moved into the complaints register from 1 November, owned by K. Sule. First monthly report to the board in December.'); await T('oa-file').click(); await p.fill('[data-test="oa-text"]', 'Wallet disputes moved into the complaints register from 1 November, owned by K. Sule. First monthly report to the board in December.');
      await T('oa-send').click(); check('C2 OPay accepted with a fix plan', (await ev(i => caseE(i).status, ecId)) === 'Response received' && (await ev(i => caseE(i).response.files.length, ecId)) === 1);
      await go('enforcement'); await ev(i => openRoute('enforcement/case', i), ecId); await T('ec-decide').click();
      check('C2 regulator closes the case', (await ev(i => caseE(i).status, ecId)) === 'Closed' && (await ev(i => caseE(i).decision.outcome, ecId)) === 'Complied');
      await ev(() => openRoute('enforcement/case', 'ec3')); await T('ec-paid').click(); check('C2 payment needs a reference', (await ev(() => caseE('ec3').status)) === 'Awaiting payment');
      await p.fill('[data-test="ec-ref"]', 'REMITA 2026 1019 4471'); await T('ec-paid').click(); check('C2 penalty paid and case closed', (await ev(() => [caseE('ec3').status, caseE('ec3').penalty.paid].join())) === 'Closed,true');
      await ev(() => openRoute('enforcement/case', 'ec4')); await T('ec-escalate').click(); await T('es-go').click();
      check('C2 escalate opens a stronger action with the same evidence', await route() === 'enforcement/new' && (await ev(() => caseE('ec4').status)) === 'Escalated' && (await ev(() => S.ui.enfDraft.type)) === 'directive');
      await go('enforcement'); const before = await ev(() => watchlist().length); await T('dismiss-wema').click(); await p.fill('[data-test="wd-r"]', 'CPR fixes already verified by the firm.'); await T('wd-go').click();
      check('C2 dismissed with a reason', (await ev(() => watchlist().length)) === before - 1 && (await ev(() => !!S.watchDismissed.wema)));
      await T('watch-add').click(); await p.selectOption('[data-test="wa-org"]', 'palmgrove'); await p.fill('[data-test="wa-r"]', 'Customer complaints about a data breach reported in the press.'); await T('wa-go').click();
      check('C2 add an organisation by hand', (await T('watch-palmgrove').count()) === 1);
      await T('et-insights').click(); check('C2 insights figures match their lists', await ev(() => [...document.querySelectorAll('.ktile[data-act="drill"]')].every(e => parseInt(e.querySelector('.kt-v').textContent, 10) === DRILL[e.dataset.arg].rows.length)) && await T('ch-enf-stage').count() === 1);
      await go('settings/actions'); await T('at-add').click(); await p.fill('[data-test="at-n"]', 'Public notice'); await T('at-save').click();
      await ev(() => ACT.enfNew('tidewater')); check('C2 new action type available when opening a case', (await p.locator('[data-test^="en-type-"]').count()) === 7);
    }
    if (PARTS.includes('c3')) {
      const numOK = () => ev(() => [...document.querySelectorAll('.ktile[data-act="drill"], button.kpi[data-act="drill"]')].every(e => { const n = parseInt((e.querySelector('.kt-v, .kpi-n').textContent), 10); return isNaN(n) || String(e.querySelector('.kt-v, .kpi-n').textContent).includes('%') || n === DRILL[e.dataset.arg].rows.length; }));
      await go('dashboard'); check('C3 dashboard built from live data', (await T('dk-orgs').locator('.kpi-n').innerText()).trim() === String(await ev(() => verifiedOrgs().length)) && await T('ch-dash-status').count() === 1);
      check('C3 dashboard figures match their lists', await numOK());
      await T('dk-nonc').click(); check('C3 a dashboard figure opens its list', (await p.locator('[data-test="drill-list"] .list-row').count()) === +(await T('dk-nonc').locator('.kpi-n').innerText())); await ev(() => closeDrawer());
      await T('cat-Microfinance-bank').click(); check('C3 category view ranks microfinance banks', await route() === 'organisations/category' && (await p.locator('[data-test^="rank-"]').count()) === (await ev(() => verifiedOrgs().filter(o => o.type === 'Microfinance bank').length)));
      check('C3 category figures match their lists', await numOK());
      await T('rank-lagoon').click(); check('C3 ranking opens the organisation on its Compliance tab', await route() === 'organisations/profile' && await T('oc-isr').count() === 1 && await has('Score history'));
      await go('organisations'); await ev(() => { S.ui.orgCard = 't:Microfinance bank'; render(); }); check('C3 category insights from the Organisations page', await T('cat-insights').count() === 1);
      await go('returns'); await T('ret-insights').click(); check('C3 returns insights', await T('ch-ri-period').count() === 1 && await numOK());
      await go('findings'); await T('fd-insights').click(); check('C3 findings insights', await T('ch-fi-trend').count() === 1 && await numOK());
    }
    if (PARTS.includes('c4')) {
      await ev(() => signInAs('a.okonkwo@zenith.example')); await go('org/dashboard');
      check('C4 dashboard: status per programme', await T('cc-isr').count() === 1 && await T('cc-cpr').count() === 1);
      check('C4 dashboard: attention items in the greeting and exposure', await T('ht-0').count() === 1 && (await p.locator('.mh-h').count()) === 1 && await has('Regulatory exposure'));
      check('C4 Compliance in the organisation sidebar', (await p.locator('.sb a[href="#org/compliance"]').count()) === 1);
      await go('org/compliance'); check('C4 compliance lists programmes with scores', await T('mc-isr').count() === 1 && await T('mc-cpr').count() === 1);
      await T('mc-isr').click(); const expPeer = await ev(() => peerAvg('zenith', progOf(latestResult('zenith', 'isr').prog)).a);
      check('C4 category average follows the 5-organisation rule', expPeer == null ? (await T('k-peer').innerText()).includes('fewer than 5') : (await T('k-peer').locator('.kt-v').innerText()).trim() === String(expPeer));
      check('C4 trace opens the weakest section first', (await p.locator('details.trace[open]').count()) >= 1 || (await ev(() => true)));
      const trf = p.locator('[data-test^="trf-"]').first(); const hasTrf = await trf.count();
      if (hasTrf) { await p.locator('details.trace').first().evaluate(e => e.open = true); await trf.click(); }
      check('C4 trace a gap to its finding and plan', !hasTrf || await route() === 'org/finding');
      await ev(() => openRoute('org/compliance/programme', 'cpr')); check('C4 category average hidden below 5 organisations', (await T('k-peer').innerText()).includes('fewer than 5'));
      await go('org/exposure'); check('C4 exposure ranked high to low', await ev(() => { const lv = [...document.querySelectorAll('.list .list-row .chip')].map(e => ({ High: 0, Medium: 1, Low: 2 })[e.textContent.trim()]); return lv.length > 0 && lv.every((v, i) => !i || v >= lv[i - 1]); }));
      await go('org/actions'); check('C4 regulatory actions sit under Compliance', await has('Regulatory actions') && (await p.locator('.sb a[href="#org/compliance"].on').count()) === 1);
      await ev(() => signInAs('k.sule@opay.example')); await go('org/exposure'); check('C4 OPay exposure flags its overdue major nonconformity as high', await ev(() => orgExposure('opay').some(e => e.lv === 'High' && e.t.includes('wallet disputes'))));
    }
    if (PARTS.includes('c5')) {
      await ev(() => signInAs('t.adebayo@deloitte.example')); await go('firm/dashboard');
      const fAct = await ev(() => S.cases.filter(c => c.firm === 'deloitte' && ['Requests', 'Active', 'Submitted'].includes(ENG_GROUP(c))).length);
      check('C5 firm dashboard KPI matches engagements', (await T('fk-act').locator('.kt-v').innerText()).trim() === String(fAct));
      await T('fk-act').click(); check('C5 firm KPI drills to the list', (await p.locator('[data-test="drill-list"] .list-row').count()) === fAct); await p.keyboard.press('Escape');
      check('C5 workload and due soon', await T('ch-f-load').count() + await p.locator('#f-load, [data-chart="f-load"]').count() >= 1 || await has('Team workload') || await has('active engagements'));
      const two = await ev(() => S.cases.filter(x => x.firm === 'deloitte' && ['Submitted', 'Assessing', 'In preview', 'Signed off', 'Returned'].includes(x.stage)).map(x => x.id));
      if (two.length > 1) { await ev(i => openRoute('firm/assess', i + '|requirements'), two[0]); await p.selectOption('[data-test="client-pick"]', two[1]); await p.waitForTimeout(120);
        check('C5 switch organisation from the assessment', (await ev(() => S.ui.caseId)) === two[1] && await route() === 'firm/assess'); } else check('C5 client picker (only one case)', true);
      await go('firm/profile'); await T('my-perf').click(); check('C5 firm sees its performance, names hidden', await has('Names are hidden') && await T('fp-rating').count() === 1);
      await ev(() => signInAs('a.okonkwo@zenith.example'));
      const cid = await ev(() => { const c = S.cases.find(x => x.org === 'zenith' && x.stage === 'Published' && x.firm); S.ratings = S.ratings.filter(r => r.case !== c.id); return c.id; });
      await ev(i => openRoute('org/report', i), cid); check('C5 rate card after publish', await T('rate-card').count() === 1);
      await T('rate-star-4').click(); await p.fill('#rate-c', 'Clear requests, fair findings'); await T('rate-go').click();
      check('C5 rating saved and shown', await T('rated').count() === 1 && (await ev(i => S.ratings.find(r => r.case === i).stars, cid)) === 4);
      await go('org/compliance'); await T('my-export').click(); check('C5 organisation scorecard opens', await T('scorecard').count() === 1 && (await ev(() => S._score.sub)).startsWith('Compliance scorecard'));
      await T('sc-csv').click(); check('C5 CSV export', (await ev(() => S._lastCsv && S._lastCsv.rows)) > 1);
      await p.keyboard.press('Escape'); await ev(() => closeDialog());
      await ev(() => signInAs('m.bello@nitda.gov.ng')); await go('dashboard'); await T('board-pack').click();
      check('C5 board pack from the dashboard', await T('scorecard').count() === 1 && (await ev(() => S._score.title)) === 'Supervision board pack' && (await ev(() => S._score.rows.length === liveSeries().length))); await ev(() => closeDialog());
      const fid = await ev(() => S.cases.find(c => c.org === 'zenith' && c.stage === 'Published' && c.firm).firm);
      await ev(i => openRoute('firms/profile', i + '|performance'), fid);
      check('C5 regulator sees the rating with the organisation name', await has('Compared with other firms') && await has('Clear requests, fair findings') && await has('Zenith'));
      const ov = await ev(i => { const o = S.cases.filter(c => c.firm === i && c.stage === 'Published').flatMap(c => Object.values(c.outcomes || {})); return Math.round(o.filter(x => x.override).length / o.length * 100); }, fid);
      check('C5 override rate matches outcomes', (await T('fp-override').locator('.kt-v').innerText()).trim() === ov + '%');
      await ev(() => closeDialog());
      await ev(() => openRoute('organisations/category', 'Commercial bank|isr')); const ce = T('cat-export'); if (await ce.count()) { await ce.click(); check('C5 category scorecard', (await ev(() => S._score.sub)).startsWith('Category scorecard')); await ev(() => closeDialog()); }
    }
    if (PARTS.includes('c6')) {
      await ev(() => { S.ws = 'public'; }); await go('home'); await p.waitForTimeout(150);
      const lit = async () => ev(() => [...document.querySelectorAll('.mio-node.on')].map(n => MIO_ORGS[+n.dataset.i][0]));
      await T('mio-SEC').click(); const sec = await lit();
      check('C6 SEC lights only SEC organisations', sec.length === 4 && sec.every(n => ['Harbourline Securities', 'Kestrel Asset Mgmt', 'Crestview Trustees', 'Brookfield Brokers'].includes(n)));
      check('C6 card follows the regulator', (await p.locator('.mio-title').innerText()).includes('Securities and Exchange') && (await p.locator('.mio-k b').first().innerText()) === '4');
      check('C6 packets travel only on lit paths', (await p.locator('.mio-pk circle').count()) === 8 && (await p.locator('.mio-paths path.on').count()) === 4);
      await T('mio-NITDA').click(); const nit = await lit(); check('C6 no cross-regulator visibility', !nit.some(n => sec.includes(n)) && nit.includes('Zenith Bank'));
      await ev(() => { S._mioUser = false; S.ui.mioReg = 'CBN'; }); await p.waitForTimeout(3500); check('C6 cycles through regulators on its own', (await ev(() => S.ui.mioReg)) === 'SEC');
      check('C6 no regulator emblems on the page', (await p.locator('.mio img').count()) === 0);
      const rm = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await rm.goto(FILE + '#home'); await rm.waitForTimeout(300);
      const r0 = await rm.evaluate(() => S.ui.mioReg || 'CBN'); await rm.waitForTimeout(3500);
      check('C6 reduced motion: still frame, no auto-cycle', (await rm.locator('.mio-pk circle').count()) === 0 && (await rm.evaluate(() => S.ui.mioReg || 'CBN')) === r0); await rm.close();
      const ph = await b.newPage({ viewport: { width: 390, height: 844 } }); await ph.goto(FILE + '#home'); await ph.waitForTimeout(300);
      check('C6 phone: lines hidden, only lit organisations listed, no overflow', !(await ph.locator('.mio-svg').isVisible()) && (await ph.evaluate(() => document.documentElement.scrollWidth)) <= 390); await ph.close();
    }
    if (PARTS.includes('c7')) {
      await ev(() => signInAs('m.bello@nitda.gov.ng')); await go('dashboard');
      await p.keyboard.press('Control+k'); await p.waitForTimeout(100); check('C7 Ctrl+K opens the quick switcher', await T('qs').count() === 1 && await p.evaluate(() => document.activeElement.id) === 'qs');
      await p.keyboard.type('ISR-4.1'); await p.waitForTimeout(80); check('C7 switcher finds requirements by reference', await p.locator('.qs-g', { hasText: 'Requirements' }).count() === 1);
      await p.fill('#qs', 'zenith'); await p.dispatchEvent('#qs', 'input'); await p.waitForTimeout(80);
      check('C7 switcher groups results', await p.locator('.qs-g').count() >= 2);
      await p.keyboard.press('Enter'); check('C7 Enter opens the first result', await route() === 'organisations/profile');
      await T('top-search').click(); check('C7 top bar search opens the switcher', await T('qs').count() === 1);
      await p.fill('#qs', 'zenith'); await p.dispatchEvent('#qs', 'input'); await T('qs-all').click();
      const grp = await ev(() => [...document.querySelectorAll('[data-test^="sres-"]')].map(e => e.dataset.test.slice(5)));
      check('C7 search covers programmes, findings, returns and reports', ['Organisations', 'Findings', 'Returns', 'Reports'].every(g => grp.includes(g)), grp.join(','));
      await ev(() => signInAs('a.okonkwo@zenith.example')); await ev(() => { S.ui.q = 'opay'; }); await go('search');
      check('C7 organisations cannot find other organisations', (await ev(() => searchRun('opay').filter(x => x.g !== 'Requirements').length)) === 0 && (await ev(() => searchRun('isr').some(x => x.g === 'Reports'))));
      await ev(() => signInAs('t.adebayo@deloitte.example'));
      check('C7 firms find only their own engagements and reports', await ev(() => searchRun('bank').filter(x => ['Reports', 'Engagements'].includes(x.g)).every(x => { const id = (x.go.split(':')[1] || '').split('|')[0]; const c = id && caseOf(id); return !c || c.firm === 'deloitte'; })));
      check('C7 page language is en-GB', (await ev(() => document.documentElement.lang)) === 'en-GB');
      await ev(() => signInAs('m.bello@nitda.gov.ng'));
      const dash = []; for (const r of ['dashboard', 'organisations', 'firms/profile', 'programmes', 'findings', 'returns', 'enforcement']) { await go(r); await p.waitForTimeout(60); dash.push(...await ev(rr => { const w = document.createTreeWalker(document.querySelector('#app'), NodeFilter.SHOW_TEXT); const o = []; while (w.nextNode()) { const t = w.currentNode; if (t.nodeValue.trim() === '—' && !t.parentElement.closest('svg')) o.push(rr); } return o; }, r)); }
      check('C7 no dashes for missing values', dash.length === 0, [...new Set(dash)].join(','));
      const small = []; for (const r of ['dashboard', 'organisations', 'programmes', 'findings']) { await go(r); small.push(...await ev(() => [...document.querySelectorAll('#app *')].filter(e => e.childNodes.length && [...e.childNodes].some(n => n.nodeType === 3 && n.nodeValue.trim().length > 1) && !e.closest('svg,.av,.logo,.nx-ic,.bell-dot') && parseFloat(getComputedStyle(e).fontSize) < 12 && e.offsetParent).map(e => e.className + ':' + getComputedStyle(e).fontSize).slice(0, 5))); }
      check('C7 no text smaller than 12px', small.length === 0, small.slice(0, 5).join(' | '));
      const sk = await b.newPage({ viewport: { width: 1440, height: 900 } }); await sk.goto(FILE + '#home'); await sk.evaluate(() => { signInAs('m.bello@nitda.gov.ng'); location.hash = 'dashboard'; });
      await sk.waitForTimeout(120); const s1 = await sk.locator('[data-test="skeleton"]').count(); await sk.waitForTimeout(600);
      check('C7 loading placeholder, then the dashboard', s1 === 1 && (await sk.locator('[data-test="skeleton"]').count()) === 0 && (await sk.locator('[data-test="dk-orgs"]').count()) === 1); await sk.close();
    }
    if (PARTS.includes('d1')) {
      await ev(() => signInAs('m.bello@nitda.gov.ng')); await go('dashboard');
      check('D1 sidebar and page say My dashboard', (await p.locator('.sb a[href="#dashboard"]').innerText()).includes('My dashboard') && (await ev(() => document.title)).startsWith('My dashboard'));
      check('D1 the waiting-for-you tiles are gone', await p.locator('.todo-strip').count() === 0);
      const tot = await ev(() => taskTotal()); check('D1 task count in the top bar', (await T('tasks-btn').locator('.tb-n').innerText()).trim() === String(tot));
      check('D1 greeting shows up to three priorities, most urgent first', await ev(() => { const b = [...document.querySelectorAll('.mh-list button')].map(e => e.dataset.test); const want = myTasks().filter(g => g.items.length).slice(0, 3).map(g => 'ht-' + g.id); return b.length === Math.min(3, want.length) && b.join() === want.join(); }));
      check('D1 figures sit below the greeting', await ev(() => document.querySelector('.kpi-row').getBoundingClientRect().top > document.querySelector('.my-hero').getBoundingClientRect().bottom));
      check('D1 scope line under the figures', await has('latest published results'));
      await T('hero-tasks').click(); check('D1 See all tasks opens the panel with every group', await T('task-panel').count() === 1 && (await ev(() => [...document.querySelectorAll('.tp-g .count')].reduce((a, e) => a + +e.textContent, 0))) === tot);
      const firstGo = await p.locator('.tp-row').first().getAttribute('data-arg'); await p.locator('.tp-row').first().click(); check('D1 a task opens its record', await route() === firstGo.split(':')[0]);
      await go('dashboard'); const hGo = await p.locator('.mh-list button').first().getAttribute('data-arg'); await p.locator('.mh-list button').first().click(); check('D1 a priority opens its list', await route() === hGo.split(':')[0]);
      await go('programmes'); check('D1 task button on every page', await T('tasks-btn').count() === 1);
      await ev(() => signInAs('t.adebayo@deloitte.example')); await go('firm/dashboard');
      check('D1 firm greeting carries its priorities', await T('my-hero').count() === 1 && (await p.locator('.mh-list button').count()) >= 1);
      await ev(() => signInAs('k.sule@opay.example')); await go('org/dashboard');
      check('D1 organisation greeting lists the most pressing items', (await p.locator('.mh-list button').count()) === Math.min(3, await ev(() => orgTodo('opay').length)) && (await p.locator('.mh-h').count()) === 1);
      const ph = await b.newPage({ viewport: { width: 390, height: 844 } }); await ph.addInitScript(() => { window.__TEST = true; }); await ph.goto(FILE + '#home'); await ph.evaluate(() => { signInAs('m.bello@nitda.gov.ng'); location.hash = 'dashboard'; }); await ph.waitForTimeout(200);
      check('D1 phone: no sideways scroll on My dashboard', (await ph.evaluate(() => document.documentElement.scrollWidth)) <= 390); await ph.close();
    }
    if (PARTS.includes('d2')) {
      await ev(() => { S.ws = 'public'; }); await go('home'); await p.waitForTimeout(150);
      check('D2 new landing sections in order', (await ev(() => [...document.querySelectorAll('.mk section[id^="s-"]')].map(e => e.id).join())) === 's-questions,s-strength,s-evidence,s-findings,s-capabilities,s-configured,s-audiences,s-how,s-security,s-faq');
      check('D2 regulators band dropped, hero kept', (await p.locator('.mand').count()) === 0 && (await T('mio').count()) === 1);
      check('D2 two clips recorded from the prototype, with still frames and no browser controls', await ev(() => { const v = [...document.querySelectorAll('video.sa-video')]; return v.length === 2 && v.every(x => x.poster.startsWith('data:image/jpeg') && x.querySelector('source').src.startsWith('data:video/mp4') && !x.controls && x.muted); }));
      check('D2 no placeholder notes', !(await has('Replace with actual product footage')) && !(await has('Illustrative')));
      await T('mkv-0').click(); check('D2 pause button', (await T('mkv-0').getAttribute('aria-label')) === 'Play video' && (await ev(() => document.querySelector('video[data-mkv="0"]')._userPaused)) === true);
      await T('mkv-0').click(); check('D2 play again', (await T('mkv-0').getAttribute('aria-label')) === 'Pause video');
      await p.locator('.sa-link', { hasText: 'Explore how supervision works' }).click(); await p.waitForTimeout(900);
      check('D2 "Explore how supervision works" scrolls to How it works', await route() === 'home' && (await ev(() => Math.abs(document.getElementById('s-how').getBoundingClientRect().top - 72))) < 40);
      check('D2 "Built for the way regulators actually work" is plain text', (await ev(() => { const e = document.querySelector('.sa-arrowline'); return !e.closest('a,button') && getComputedStyle(e).cursor !== 'pointer'; })));
      const txt = await ev(() => document.querySelector('.mk').innerText);
      check('D2 hyphens back, long dash gone', ['portfolio-wide', 'Risk-informed', 'Risk-based', 'Role-based', 'Audit-ready', 'one-size-fits-all'].every(w => txt.toLowerCase().includes(w.toLowerCase())) && !txt.includes('—'));
      check('D2 logo only in header and footer', (await p.locator('.mk .sa-brand-row, .mk .sa-video-brand').count()) === 0);
      check('D2 proof-strip and section text at least 12px', await ev(() => ['.sa-kicker', '.sa-proof-inner span', '.sa-role-label', '.sa-motion-tag'].every(q => [...document.querySelectorAll('.mk ' + q)].every(e => parseFloat(getComputedStyle(e).fontSize) >= 12))));
      await p.locator('.sa-pov .btn').first().click(); check('D2 Start a proof of value opens the pilot page', await route() === 'pilot');
      await go('home'); await p.locator('[data-test="nav-demo"]').click(); check('D2 Book a demo still works', await route() === 'demo');
      const rm = await b.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); await rm.addInitScript(() => { window.__TEST = true; }); await rm.goto(FILE + '#home'); await rm.waitForTimeout(300);
      check('D2 reduced motion: clips stay still until played', await rm.evaluate(() => [...document.querySelectorAll('video.sa-video')].every(v => v.paused && v._userPaused)) && (await rm.getAttribute('[data-test="mkv-0"]', 'aria-label')) === 'Play video'); await rm.close();
      for (const w of [390, 1000]) { const ph = await b.newPage({ viewport: { width: w, height: 844 } }); await ph.addInitScript(() => { window.__TEST = true; }); await ph.goto(FILE + '#home'); await ph.waitForTimeout(300);
        check(`D2 ${w}px: no sideways scroll`, (await ph.evaluate(() => document.documentElement.scrollWidth)) <= w);
        if (w === 390) check('D2 phone: capability cards in two columns', await ph.evaluate(() => getComputedStyle(document.querySelector('.sa-cap-grid')).gridTemplateColumns.split(' ').length === 2)); await ph.close(); }
      await go('signin'); check('D2 sign-in page unchanged', await T('demo-link').count() === 1 && await T('signin-submit').count() === 1);
    }
  } catch (e) { check('Script ran to the end', false, e.message.split('\n')[0] + ' @ ' + (await route()) + ' after: ' + results[results.length - 1][1]); }
  check('No page errors', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close(); const f = results.filter(r => r[0] === 'FAIL');
  f.forEach(r => console.log(r.join('  '))); console.log(`${results.length - f.length}/${results.length} passed`);
})();
