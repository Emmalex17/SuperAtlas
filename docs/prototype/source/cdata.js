/* ================= Drop C data: more organisations, programme cycles, past results ================= */
(function seedC() {
  /* deterministic random numbers so the demo is the same on every load */
  let seed = 20261019; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const pad = n => String(n).padStart(2, '0');
  const iso = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
  const plus = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
  const human = d => { const x = new Date(d + 'T12:00:00'); return x.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); };

  /* ---------- accounts: one person, one regulator, organisation or firm ---------- */
  SEED.accounts['b.nwosu@halcyon.example'].memberships = [{ ws: 'firm', id: 'halcyon', role: 'Lead assessor' }];
  SEED.accounts['k.sule@opay.example'] = { name: 'K. Sule', first: 'Kemi', ini: 'KS', role: 'Head of compliance', ws: 'organisation', memberships: [{ ws: 'organisation', id: 'opay' }] };
  Object.assign(SEED.orgs.opay, { officers: [{ ini: 'KS', name: 'K. Sule', role: 'Head of compliance', email: 'k.sule@opay.example' }] });

  /* ---------- 26 more verified organisations (fictional) so analytics read properly ---------- */
  const mk = (id, name, ini, col, sector, type, tier, officer, hq, joined) => ({ id, name, ini, col, web: id + '.example', sector, type, tier, status: 'Verified', officer, joined, last: pick(['Today', 'Yesterday', '2 days ago', '4 days ago', '12 Oct']), hq, tags: [], invite: { email: 'compliance@' + id + '.example', history: [['1 Mar 2024', 'Invitation sent', 'J. Okeke'], ['4 Mar 2024', 'Invitation accepted', officer]] } });
  [['palmgrove', 'Palmgrove Bank Plc', 'PB', '#2F6B3A', 'National', 'R. Ade'], ['cedarwood', 'Cedarwood Bank Plc', 'CB', '#7A4B2A', 'Regional', 'U. Nnamdi'], ['orchid', 'Orchid Commercial Bank Ltd', 'OC', '#8E3B8C', 'National', 'F. Bello'], ['ridgeline', 'Ridgeline Bank Plc', 'RB', '#1F4E79', 'International', 'T. Okafor'], ['tidewater', 'Tidewater Bank Plc', 'TB', '#0E7C86', 'Regional', 'S. Ibe'], ['ironwood', 'Ironwood Bank Ltd', 'IB', '#4A4A4A', 'National', 'D. Musa'], ['harbourline', 'Harbourline Bank Plc', 'HB', '#2B5DA8', 'National', 'G. Eke'], ['sahel', 'Sahel Commercial Bank Ltd', 'SC', '#B5651D', 'Regional', 'A. Lawan']]
    .forEach(([id, n, i, c, t, o]) => { SEED.orgs[id] = mk(id, n, i, c, 'Banking', 'Commercial bank', t, o, pick(['Lagos', 'Abuja', 'Port Harcourt', 'Kano']), pick(['Mar 2024', 'Apr 2024', 'Jun 2024'])); });
  [['harmattan', 'Harmattan Microfinance Bank', 'HM', '#A35C2B', 'State'], ['riverbend', 'Riverbend Microfinance Bank', 'RM', '#2D7D6F', 'National'], ['kolanut', 'Kolanut Microfinance Bank', 'KM', '#7B2D26', 'Unit'], ['ember', 'Ember Microfinance Bank', 'EM', '#C2410C', 'State'], ['weaver', 'Weaver Microfinance Bank', 'WM', '#5B4B8A', 'Unit'], ['copperleaf', 'Copperleaf Microfinance Bank', 'CL', '#9A5B13', 'National'], ['tamarind', 'Tamarind Microfinance Bank', 'TM', '#6B7A1E', 'State'], ['hilltop', 'Hilltop Community Microfinance Bank', 'HC', '#3E6A8A', 'Unit'], ['mangrove', 'Mangrove Microfinance Bank', 'MM', '#1E6B52', 'State'], ['okrahill', 'Okra Hill Microfinance Bank', 'OH', '#7A8B2E', 'Unit']]
    .forEach(([id, n, i, c, t]) => { SEED.orgs[id] = mk(id, n, i, c, 'Banking', 'Microfinance bank', t, pick(['B. Yusuf', 'C. Nwankwo', 'E. Adamu', 'I. Peters', 'L. Okoro', 'M. Danladi', 'N. Uche', 'O. Salami']), pick(['Ibadan', 'Enugu', 'Jos', 'Abeokuta', 'Benin City', 'Owerri']), pick(['Mar 2024', 'May 2024', 'Jan 2025', 'Mar 2025'])); });
  [['tollgate', 'Tollgate Payments Ltd', 'TP', '#334155', 'Payments', 'Payment solution service provider', 'PSSP'], ['linkbridge', 'Linkbridge Payments Ltd', 'LP', '#0F766E', 'Payments', 'Payment solution service provider', 'PTSP'], ['signalpay', 'Signalpay Ltd', 'SP', '#B91C1C', 'Payments', 'Payment solution service provider', 'PSSP'], ['cascade', 'Cascade Mobile Money Ltd', 'CM', '#0369A1', 'Payments', 'Mobile money operator', ''], ['pocketline', 'Pocketline Mobile Money Ltd', 'PM', '#7C3AED', 'Payments', 'Mobile money operator', ''], ['ledgerline', 'Ledgerline Technologies Ltd', 'LT', '#15803D', 'Digital economy', 'Fintech platform', ''], ['quillfin', 'Quillfin Ltd', 'QF', '#BE185D', 'Digital economy', 'Fintech platform', ''], ['stratus', 'Stratus Cloud Nigeria Ltd', 'SN', '#475569', 'Digital economy', 'Cloud service provider', '']]
    .forEach(([id, n, i, c, s, t, tr]) => { SEED.orgs[id] = mk(id, n, i, c, s, t, tr, pick(['P. Akin', 'Y. Bala', 'Z. Eze', 'H. Obi']), 'Lagos', pick(['Feb 2025', 'Apr 2025', 'Jul 2025'])); });

  /* ---------- programme series: a programme runs again as a new cycle ---------- */
  SEED.series = [
    { id: 'isr', name: 'ISR annual assessment', reg: 'isr', freq: 'Yearly' },
    { id: 'dpc', name: 'Data protection compliance', reg: 'dpf', freq: 'Yearly' },
    { id: 'cpr', name: 'Consumer protection review', reg: 'cpr', freq: 'Yearly' },
    { id: 'aml', name: 'AML guidelines readiness', reg: 'aml', freq: 'One-off' },
    { id: 'cps', name: 'Cloud and payments security check', reg: 'isr', freq: 'Yearly' }
  ];
  const P = id => SEED.programmes.find(p => p.id === id);
  [['p1', 'isr', '2026'], ['p2', 'dpc', '2026'], ['p3', 'cpr', '2025'], ['p4', 'aml', '2027'], ['p5', 'cps', '2027']].forEach(([id, s, c]) => Object.assign(P(id), { series: s, cycle: c }));
  SEED.compliance = { bench: { isr: 70, dpc: 70, cpr: 70, aml: 70, cps: 70 }, watchDays: '', cyclesRunning: '2', lateRuns: '3' };

  const p1 = P('p1'); const p3 = P('p3');
  const past = (id, base, series, cycle, name, opens, closes, published) => { const p = jclone(base); Object.assign(p, { id, series, cycle, name, status: 'Closed', opens, closes, created: human(plus(opens, -30)), locked: human(opens), published, desc: `Results published ${published}.`, activity: [[published, 'M. Bello', 'published the results'], [human(opens), 'M. Bello', 'launched the programme']], edited: 0 }); return p; };
  const pI24 = past('pI24', p1, 'isr', '2024', 'ISR 2024 annual assessment', '2024-10-01', '2024-11-30', '21 Feb 2025');
  const pI25 = past('pI25', p1, 'isr', '2025', 'ISR 2025 annual assessment', '2025-10-01', '2025-11-30', '18 Feb 2026');
  const pC24 = past('pC24', p3, 'cpr', '2024', 'Consumer protection review 2024', '2024-10-01', '2024-12-15', '19 Feb 2025');
  SEED.programmes.push(pI24, pI25, pC24);

  /* ---------- outcomes, scores and findings for published cycles ---------- */
  const reqs = qsetReqs(p1.qset);
  const wt = r => /High/.test(r.weight || '') ? 3 : /Low/.test(r.weight || '') ? 1 : 2;
  const PTS = { Compliant: 100, 'Partially compliant': 50, 'Non-compliant': 0 };
  const scoreOf = outs => { let n = 0, d = 0; reqs.forEach(r => { const o = outs[r.ref]; if (!o || PTS[o.o] == null) return; n += PTS[o.o] * wt(r); d += wt(r); }); return d ? Math.round(n / d) : null; };
  const TITLES = {
    'ISR-1.1': ['Information security policy not approved by the board', 'Policy past its yearly board review'],
    'ISR-1.2': ['No named chief information security officer', 'CISO role combined with IT operations'],
    'ISR-1.3': ['No information security risk assessment this year', 'Risk assessment leaves out key systems'],
    'ISR-2.1': ['No inventory of critical information assets', 'Asset inventory incomplete for branch systems'],
    'ISR-4.1': ['MFA not enforced for privileged access', 'MFA not enforced for remote vendor access'],
    'ISR-4.2': ['Quarterly access reviews not carried out', 'Access reviews missed for two quarters'],
    'ISR-7.1': ['Major incidents reported after 24 hours', 'Incident reporting steps not written down'],
    'ISR-7.2': ['Incident response plan never tested', 'Incident response test not documented']
  };
  /* each organisation has a baseline strength that improves a little each cycle; access control is the sector's weak spot */
  const base = {}; const strength = id => base[id] ?? (base[id] = 0.45 + rnd() * 0.45);
  Object.assign(base, { zenith: 0.86, uba: 0.74, gtb: 0.9, wema: 0.66, moniepoint: 0.72, lagoon: 0.62, savannah: 0.55, unity: 0.48, ironwood: 0.4, kolanut: 0.42, sahel: 0.5, weaver: 0.46 });
  const REAL = ['zenith', 'uba', 'gtb', 'wema', 'moniepoint', 'lagoon', 'savannah', 'unity', 'opay'];
  const firmsFor = ['deloitte', 'kpmg', 'pwc', 'ey'];
  const C = (o) => Object.assign({ firm: '', firmStatus: 'Accepted', team: [], lead: '', answers: {}, assign: {}, outcomes: {}, findings: [], threads: [], interviews: [], stage: 'Published', due: '' }, o);
  const LEADS = { deloitte: 'T. Adebayo', kpmg: 'O. Fashola', pwc: 'E. Ajayi', ey: 'R. Okon' };
  let fid = 0;
  function cycleCase(p, org, yearIdx, pubISO, pubHuman, closedBy) {
    const s = Math.min(0.97, strength(org) + yearIdx * 0.05 + (rnd() - 0.5) * 0.08);
    const outs = {}; reqs.forEach(r => { const hard = r.ref === 'ISR-4.1' ? 0.32 : r.ref === 'ISR-7.2' ? 0.12 : 0; const x = rnd() + hard; outs[r.ref] = { o: x < s ? 'Compliant' : x < s + 0.2 ? 'Partially compliant' : 'Non-compliant', note: x < s ? 'Evidence reviewed and sufficient.' : 'Gaps found; see finding.' }; });
    const sc = scoreOf(outs); const firm = org === 'gtb' ? pick(['deloitte', 'kpmg', 'ey']) : pick(firmsFor);
    const sub = plus(p.opens, Math.min(58, Math.floor(10 + rnd() * 50)));
    const c = C({ id: 'g' + p.id + '-' + org, prog: p.id, org, firm, lead: LEADS[firm], due: p.closes, outcomes: outs, score: sc, published: pubHuman, opened: true, openedAt: pubHuman, reviewer: 'N. Adeyemi', approved: { by: 'M. Bello', when: pubHuman }, submitted: human(sub), subDate: sub, reportAt: human(plus(sub, 21)), answers: sampleAnswers(p.qset, 99) });
    reqs.forEach(r => {
      const o = outs[r.ref].o; let cls = null, t = null;
      if (o === 'Non-compliant') { cls = wt(r) === 3 ? 'MaNC' : 'MiNC'; t = TITLES[r.ref][0]; }
      else if (o === 'Partially compliant') { cls = wt(r) === 3 ? 'MiNC' : 'OBS'; t = TITLES[r.ref][1]; }
      else if (rnd() < 0.08) { cls = 'OFI'; t = 'Automate evidence collection for ' + r.t.toLowerCase(); }
      if (!cls) return;
      const days = { MaNC: 30, MiNC: 60, OBS: 90, OFI: 0 }[cls]; const due = days ? plus(pubISO, days) : '';
      let status = cls === 'OFI' ? 'Noted' : 'Closed';
      if (cls !== 'OFI' && closedBy === 'mixed' && !REAL.includes(org)) { const x = rnd(); status = x < 0.55 ? 'Closed' : x < 0.82 ? 'In progress' : 'Open'; }
      const f = { id: 'gf' + (++fid), ref: r.ref, cls, title: t, due, status, plan: null, proof: [], updates: [], verify: null, closed: null, ext: null, detail: '' };
      if (status !== 'Open' && status !== 'Noted') { f.plan = { action: 'Fix agreed with the assessor.', owner: S_officer(org), target: due, steps: [] }; f.updates.push([human(plus(pubISO, 14)), S_officer(org), 'Plan submitted']); }
      if (status === 'Closed') { const cd = plus(due, -Math.floor(rnd() * 20)); f.verify = { by: LEADS[firm], when: human(plus(cd, -5)), ok: true, note: 'Fix checked and working.' }; f.closed = { by: 'N. Adeyemi', when: human(cd) }; f.closedDate = cd; f.updates.push([human(plus(cd, -12)), S_officer(org), 'Fix submitted with proof']); }
      c.findings.push(f);
    });
    return c;
  }
  function S_officer(org) { return (SEED.orgs[org] || {}).officer || 'Compliance officer'; }
  const isrScope = Object.values(SEED.orgs).filter(o => o.status === 'Verified' && ['Commercial bank', 'Microfinance bank'].includes(o.type)).map(o => o.id);
  const in24 = isrScope.filter((o, i) => !['copperleaf', 'tamarind', 'mangrove', 'okrahill', 'sahel', 'hilltop'].includes(o));
  const in25 = isrScope.filter(o => !['okrahill', 'mangrove'].includes(o));
  in24.forEach(o => SEED.cases.push(cycleCase(pI24, o, 0, '2025-02-21', '21 Feb 2025', 'all')));
  in25.forEach(o => SEED.cases.push(cycleCase(pI25, o, 1, '2026-02-18', '18 Feb 2026', 'mixed')));
  pI24.scopeCount = in24.length; pI25.scopeCount = in25.length;

  /* ---------- the live ISR 2026 cycle: every bank in scope has a case ---------- */
  const have = new Set(SEED.cases.filter(c => c.prog === 'p1').map(c => c.org));
  const plan26 = ['Firm to assign', 'Firm to assign', 'Awaiting firm', 'Answering', 'Answering', 'Answering', 'Answering', 'Answering', 'Answering', 'Answering', 'Answering', 'Answering', 'Submitted', 'Submitted', 'Submitted', 'Submitted', 'Assessing', 'Assessing', 'Assessing', 'Signed off', 'Signed off'];
  let k = 0;
  isrScope.filter(o => !have.has(o)).forEach(o => {
    const stage = plan26[k++ % plan26.length]; const firm = stage === 'Firm to assign' ? '' : pick(['kpmg', 'pwc', 'ey']);
    const sub = ['Submitted', 'Assessing', 'Signed off'].includes(stage) ? plus('2026-10-01', 6 + Math.floor(rnd() * 12)) : '';
    const c = C({ id: 'g26-' + o, prog: 'p1', org: o, firm, firmStatus: !firm ? '' : stage === 'Awaiting firm' ? 'Requested' : 'Accepted', lead: firm ? LEADS[firm] : '', due: '2026-11-30', stage, answers: stage === 'Answering' ? sampleAnswers(p1.qset, 2 + Math.floor(rnd() * 13)) : sub ? sampleAnswers(p1.qset, 99) : {} });
    if (sub) { c.submitted = human(sub) + ', 10:00'; c.subDate = sub; c.receipt = 'SUB-P1-' + SEED.orgs[o].ini + '-' + (1000 + k); }
    if (stage === 'Signed off') { reqs.forEach(r => { c.outcomes[r.ref] = { o: rnd() < strength(o) ? 'Compliant' : 'Partially compliant', note: 'Reviewed.' }; }); c.signed = { by: LEADS[firm], when: '18 Oct 2026' }; }
    SEED.cases.push(c);
  });
  /* submission dates for the original cases */
  const cs = id => SEED.cases.find(c => c.id === id);
  cs('c4').subDate = '2026-10-16'; cs('c5').subDate = '2026-10-09';
  p1.activity[p1.activity.length - 1][2] = `launched the programme to ${isrScope.length} organisations`;

  /* ---------- consumer protection 2024 (same organisations as 2025) ---------- */
  ['zenith', 'uba', 'gtb', 'wema', 'moniepoint', 'opay'].forEach((o, i) => {
    const sc = [74, 70, 84, 58, 66, 52][i]; const out = sc >= 80 ? 'Compliant' : sc >= 60 ? 'Partially compliant' : 'Non-compliant';
    const firm = ['kpmg', 'deloitte', 'deloitte', 'pwc', 'kpmg', 'ey'][i];
    SEED.cases.push(C({ id: 'gpC24-' + o, prog: 'pC24', org: o, firm, lead: LEADS[firm], due: '2024-12-15', score: sc, published: '19 Feb 2025', opened: true, openedAt: '20 Feb 2025', reviewer: 'N. Adeyemi', approved: { by: 'M. Bello', when: '18 Feb 2025' }, submitted: human(plus('2024-10-01', 20 + i * 6)), subDate: plus('2024-10-01', 20 + i * 6), outcomes: { 'CPR-3.1': { o: out, note: 'Complaints register reviewed for 2024.' } }, findings: out === 'Compliant' ? [] : [{ id: 'gf' + (++fid), ref: 'CPR-3.1', cls: out === 'Non-compliant' ? 'MaNC' : 'OBS', title: out === 'Non-compliant' ? 'Complaints not resolved within 14 days' : 'Complaint resolution times not reported to management', due: '2025-05-20', status: 'Closed', plan: { action: 'Fix agreed with the assessor.', owner: S_officer(o), target: '2025-05-20', steps: [] }, proof: [], updates: [], verify: { by: LEADS[firm], when: '2 May 2025', ok: true, note: 'Checked.' }, closed: { by: 'N. Adeyemi', when: '9 May 2025' }, closedDate: '2025-05-09', ext: null, detail: '' }] }));
  });
  ['h0', 'h1', 'h2', 'h3', 'h4', 'h5'].forEach((id, i) => { cs(id).subDate = plus('2025-10-01', 18 + i * 7); });

  /* ---------- enforcement: action types and past cases ---------- */
  SEED.actionTypes = [
    { id: 'advisory', name: 'Advisory letter', d: 'Points out a gap and expects it fixed. No formal sanction.', days: 21, penalty: false, level: 1 },
    { id: 'warning', name: 'Warning letter', d: 'Formal warning that further action follows if the gap is not fixed.', days: 14, penalty: false, level: 2 },
    { id: 'directive', name: 'Compliance directive', d: 'Orders specific steps by a set date.', days: 30, penalty: false, level: 3 },
    { id: 'penalty', name: 'Monetary penalty', d: 'A fine under the regulation, with a payment deadline.', days: 30, penalty: true, level: 4 },
    { id: 'restrict', name: 'Restriction or suspension', d: 'Limits or suspends an activity or licence until the gap is fixed.', days: 14, penalty: false, level: 5 },
    { id: 'referral', name: 'Referral', d: 'Refers the matter to another authority or to prosecution.', days: 0, penalty: false, level: 6 }
  ];
  const E = (o) => Object.assign({ evidence: [], timeline: [], response: null, decision: null, penalty: null, approver: 'M. Bello', by: 'N. Adeyemi', from: 'watchlist' }, o);
  SEED.enfCases = [
    E({ id: 'ec1', ref: 'EC-2025-011', org: 'ironwood', type: 'warning', status: 'Closed', opened: '2025-03-10', issued: '2025-03-12', respondBy: '2025-03-26', reason: 'Below the ISR benchmark in the 2024 cycle with a major nonconformity on multi-factor authentication.', evidence: [{ kind: 'result', label: 'ISR 2024 annual assessment: score below benchmark' }], response: { kind: 'accept', text: 'MFA roll-out to all privileged accounts by June.', when: '2025-03-24', by: 'D. Musa' }, decision: { outcome: 'Complied', note: 'Fix verified by the assessor.', when: '2025-06-02', by: 'M. Bello' }, timeline: [['2025-03-10', 'N. Adeyemi', 'Case opened'], ['2025-03-12', 'M. Bello', 'Signed off and issued the notice'], ['2025-03-24', 'D. Musa', 'Accepted with a fix plan'], ['2025-06-02', 'M. Bello', 'Closed: complied']] }),
    E({ id: 'ec2', ref: 'EC-2025-019', org: 'tidewater', type: 'directive', status: 'Closed', opened: '2025-04-20', issued: '2025-04-22', respondBy: '2025-05-22', reason: 'Incident response plan never tested; major incidents reported late.', evidence: [{ kind: 'result', label: 'ISR 2024 annual assessment: score below benchmark' }], response: { kind: 'accept', text: 'Tabletop exercise held; reporting procedure updated.', when: '2025-05-15', by: 'S. Ibe' }, decision: { outcome: 'Complied', note: '', when: '2025-07-30', by: 'M. Bello' }, timeline: [['2025-04-20', 'N. Adeyemi', 'Case opened'], ['2025-04-22', 'M. Bello', 'Signed off and issued the notice'], ['2025-05-15', 'S. Ibe', 'Accepted with a fix plan'], ['2025-07-30', 'M. Bello', 'Closed: complied']] }),
    E({ id: 'ec3', ref: 'EC-2026-003', org: 'ironwood', type: 'penalty', status: 'Awaiting payment', opened: '2026-04-02', issued: '2026-04-06', respondBy: '2026-05-06', reason: 'Below the ISR benchmark in two cycles running (2024 and 2025).', penalty: { amount: 5000000, paid: false }, evidence: [{ kind: 'result', label: 'ISR 2024 annual assessment: score below benchmark' }, { kind: 'result', label: 'ISR 2025 annual assessment: score below benchmark' }], response: { kind: 'accept', text: 'We accept the penalty and will pay within the period.', when: '2026-04-28', by: 'D. Musa' }, decision: { outcome: 'Penalty confirmed', note: 'Payment due by 6 May 2026.', when: '2026-04-30', by: 'M. Bello' }, timeline: [['2026-04-02', 'N. Adeyemi', 'Case opened'], ['2026-04-06', 'M. Bello', 'Signed off and issued the notice'], ['2026-04-28', 'D. Musa', 'Accepted'], ['2026-04-30', 'M. Bello', 'Penalty confirmed; waiting for payment']] }),
    E({ id: 'ec4', ref: 'EC-2026-007', org: 'sahel', type: 'warning', status: 'Response received', opened: '2026-05-15', issued: '2026-05-18', respondBy: '2026-06-01', reason: 'Score of 39 in the ISR 2025 cycle with four open findings.', evidence: [{ kind: 'result', label: 'ISR 2025 annual assessment: score 39' }], response: { kind: 'contest', text: 'Two of the findings were fixed before the report was published. We attach the evidence and ask NITDA to reconsider.', files: [['Access review records Q4 2025.pdf', '310 KB']], when: '2026-05-30', by: 'A. Lawan' }, timeline: [['2026-05-15', 'N. Adeyemi', 'Case opened'], ['2026-05-18', 'M. Bello', 'Signed off and issued the notice'], ['2026-05-30', 'A. Lawan', 'Contested with documents']] }),
    E({ id: 'ec5', ref: 'EC-2026-009', org: 'kolanut', type: 'advisory', status: 'Closed', opened: '2026-05-20', issued: '2026-05-21', respondBy: '2026-06-11', reason: 'Quarterly access reviews missed for two quarters.', response: { kind: 'accept', text: 'Reviews now scheduled monthly.', when: '2026-06-05', by: 'C. Nwankwo' }, decision: { outcome: 'No further action', note: '', when: '2026-06-30', by: 'J. Okeke' }, timeline: [['2026-05-20', 'J. Okeke', 'Case opened'], ['2026-05-21', 'M. Bello', 'Signed off and issued the notice'], ['2026-06-05', 'C. Nwankwo', 'Accepted with a fix plan'], ['2026-06-30', 'J. Okeke', 'Closed: no further action']] })
  ];
  SEED.watchDismissed = {}; SEED.watchManual = [];

  /* ---------- firm ratings by organisations, and outcomes NITDA changed ---------- */
  let r2 = 77; const rr = () => { r2 = (r2 * 16807) % 2147483647; return r2 / 2147483647; };
  const COMM = ['Thorough and clear about what evidence was needed.', 'Good communication; the interview was well run.', 'Took longer than agreed to send the report.', 'Helpful feedback on our access controls.', 'Asked for documents we had already uploaded.', 'Professional team, sensible findings.'];
  const firmQual = { deloitte: 0.85, kpmg: 0.75, pwc: 0.7, ey: 0.55 };
  SEED.ratings = [];
  SEED.cases.filter(c => c.stage === 'Published' && c.firm && c.id !== 'h0').forEach(c => {
    const q = firmQual[c.firm] ?? 0.7;
    if (rr() < 0.75) { const stars = Math.max(1, Math.min(5, Math.round(2.6 + q * 2.4 + (rr() - 0.5) * 1.6))); SEED.ratings.push({ id: 'rt-' + c.id, firm: c.firm, org: c.org, case: c.id, stars, comment: stars <= 3 ? COMM[2 + Math.floor(rr() * 2) * 2] : COMM[[0, 1, 3, 5][Math.floor(rr() * 4)]], when: c.openedAt || c.published }); }
    Object.keys(c.outcomes || {}).forEach(ref => { if (rr() < (1 - q) * 0.12) c.outcomes[ref].override = { by: 'N. Adeyemi', reason: 'Evidence did not support the firm\'s outcome.' }; });
    if (!c.reportDays) c.reportDays = Math.max(7, Math.round(10 + (1 - q) * 30 + rr() * 10));
  });
})();
