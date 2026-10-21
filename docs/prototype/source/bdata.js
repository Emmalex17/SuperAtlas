/* ================= Drop B data: programmes, per-organisation cases, engagements ================= */
/* A programme takes its own copy of the regulation's questions (editable until launch). */
function makeQSet(reg) {
  return { ver: reg.version, sections: jclone(reg.sections).map(s => ({ id: s.id, name: s.name, on: true, reqs: s.reqs.map(r => Object.assign({}, r, { questions: r.questions.map((q, i) => Object.assign({ id: r.ref + '#' + i }, q)) })) })) };
}
const qsetQs = qs => qs.sections.filter(s => s.on).flatMap(s => s.reqs.flatMap(r => r.questions.map(q => Object.assign({ ref: r.ref, sec: s.id }, q))));
const qsetReqs = qs => qs.sections.filter(s => s.on).flatMap(s => s.reqs.map(r => Object.assign({ sec: s.id, secName: s.name }, r)));
/* sample answers so the demo has work in progress; never used as AI suggestions */
function sampleAnswer(q, k) {
  const a = { status: 'answered', by: 'C. Eze', when: '14 Oct 2026' };
  if (q.choice === 'yn') a.v = k % 7 === 3 ? 'No' : 'Yes';
  if (q.choice === 'text') a.v = 'Chief information security officer; reviewed every quarter by the risk committee.';
  if (q.choice === 'number') a.v = String(2 + (k % 3));
  if (q.choice === 'date') a.v = '2026-06-30';
  if (q.comment) a.comment = k % 7 === 3 ? 'Rollout to remote users is planned for Q1 2027.' : 'In place and reviewed in the last cycle.';
  if (q.evidence) a.files = [['Policy and approval record.pdf', '1.2 MB']];
  if (q.interview) a.interview = 'requested';
  return a;
}
function sampleAnswers(qs, n) { const out = {}; qsetQs(qs).slice(0, n).forEach((q, k) => { out[q.id] = sampleAnswer(q, k); }); return out; }

(function seedB() {
  const reg = id => SEED.regs.find(r => r.id === id);
  const P = (o) => Object.assign({ scheme: 'four', reminders: SEED.deadlines.reminders, escalate: SEED.deadlines.escalate, firmMode: 'regulator', preview: true, publisher: 'regulator', by: 'M. Bello', activity: [] }, o);
  SEED.programmes = [
    P({ id: 'p1', name: 'ISR 2026 annual assessment', reg: 'isr', status: 'Open', opens: '2026-10-01', closes: '2026-11-30', created: '12 Sep 2026', types: ['Commercial bank', 'Microfinance bank'], desc: 'Yearly information security assessment for banks, assessed by accredited firms.', locked: '1 Oct 2026',
      activity: [['20 Oct 2026', 'C. Eze', 'answered 7 questions for Zenith Bank'], ['18 Oct 2026', 'KPMG', 'submitted the report for Wema Bank'], ['3 Oct 2026', 'Deloitte', 'accepted the engagement for Zenith Bank'], ['1 Oct 2026', 'M. Bello', 'launched the programme to 5 organisations']] }),
    P({ id: 'p2', name: 'Data protection compliance 2026', reg: 'dpf', status: 'Open', opens: '2026-10-15', closes: '2026-12-15', created: '1 Oct 2026', types: ['Commercial bank'], firmMode: 'organisation', preview: false, publisher: 'firm', desc: 'Organisations engage their own data protection assessor.', locked: '15 Oct 2026',
      activity: [['17 Oct 2026', 'F. Adeyemi', 'asked to use Clearwater Assurance (not accredited) for UBA'], ['16 Oct 2026', 'O. Bakare', 'engaged PwC for Guaranty Trust Bank'], ['15 Oct 2026', 'M. Bello', 'launched the programme to 3 organisations']] }),
    P({ id: 'p3', name: 'Consumer protection review 2025', reg: 'cpr', status: 'Closed', opens: '2025-10-01', closes: '2025-12-15', created: '1 Sep 2025', types: ['Commercial bank', 'Microfinance bank', 'Mobile money operator'], desc: 'Annual consumer protection review. Results published 20 Feb 2026.', locked: '1 Oct 2025', activity: [['20 Feb 2026', 'M. Bello', 'published 6 reports']] }),
    P({ id: 'p4', name: 'AML guidelines readiness 2027', reg: 'aml', status: 'Draft', opens: '2027-02-01', closes: '2027-04-30', created: '14 Oct 2026', types: ['Commercial bank', 'Microfinance bank', 'Mobile money operator'], desc: 'Draft. Waiting for the AML guidelines to be published.' }),
    P({ id: 'p5', name: 'Cloud and payments security check 2027', reg: 'isr', status: 'Scheduled', opens: '2027-01-15', closes: '2027-03-15', created: '10 Oct 2026', types: ['Mobile money operator', 'Cloud service provider'], desc: 'Opens automatically on 15 Jan 2027.', locked: '' })
  ];
  SEED.programmes.forEach(p => { p.qset = makeQSet(reg(p.reg)); p.ver = reg(p.reg).version; });
  /* p1: questions edited for this programme only (shows the master-copy rule) */
  const p1 = SEED.programmes[0]; p1.qset.sections[0].reqs[0].questions[1].q = 'On what date did the board last approve the policy?';
  p1.qset.sections[1].on = true; p1.edited = 2;
  const C = (o) => Object.assign({ firm: '', firmStatus: '', team: [], lead: '', answers: {}, assign: {}, outcomes: {}, findings: [], threads: [], interviews: [], stage: 'Firm to assign', due: '' }, o);
  SEED.cases = [
    C({ id: 'c1', prog: 'p1', org: 'zenith', firm: 'deloitte', firmStatus: 'Accepted', lead: 'T. Adebayo', team: ['I. Okafor'], stage: 'Answering', due: '2026-11-30', answers: sampleAnswers(p1.qset, 7), assign: { s1: 'C. Eze', s2: 'A. Okonkwo' } }),
    C({ id: 'c2', prog: 'p1', org: 'uba', due: '2026-11-30' }),
    C({ id: 'c3', prog: 'p1', org: 'gtb', due: '2026-11-30' }),
    C({ id: 'c4', prog: 'p1', org: 'moniepoint', firm: 'deloitte', firmStatus: 'Accepted', lead: 'T. Adebayo', team: ['I. Okafor'], stage: 'Submitted', due: '2026-11-30', answers: sampleAnswers(p1.qset, 99), submitted: '16 Oct 2026, 15:20', submittedBy: 'C. Obi', receipt: 'SUB-P1-MP-0416' }),
    C({ id: 'c5', prog: 'p1', org: 'wema', firm: 'kpmg', firmStatus: 'Accepted', lead: 'O. Fashola', team: ['G. Uche'], stage: 'Report submitted', due: '2026-11-30', answers: sampleAnswers(p1.qset, 99), submitted: '9 Oct 2026', reportAt: '18 Oct 2026' }),
    C({ id: 'c6', prog: 'p2', org: 'zenith', stage: 'Firm to choose', due: '2026-12-15' }),
    C({ id: 'c7', prog: 'p2', org: 'uba', stage: 'Firm approval', due: '2026-12-15', firmStatus: 'Requested', reqFirm: { name: 'Clearwater Assurance Ltd', contact: 'audit@clearwater.example', reason: 'Clearwater audited our data protection controls in 2025 and knows our systems. It is applying for DPCO accreditation this quarter.', file: 'Clearwater firm profile.pdf', creds: 'CIPP/E (2), CIPM (1)', when: '17 Oct 2026', by: 'F. Adeyemi' } }),
    C({ id: 'c8', prog: 'p2', org: 'gtb', firm: 'pwc', firmStatus: 'Accepted', lead: 'E. Ajayi', stage: 'Answering', due: '2026-12-15' })
  ];
  /* KPMG outcomes for Wema (report waiting for NITDA review in B4) */
  const outs = ['Compliant', 'Compliant', 'Partially compliant', 'Compliant', 'Compliant', 'Non-compliant', 'Compliant', 'Partially compliant'];
  qsetReqs(p1.qset).forEach((r, i) => { SEED.cases[4].outcomes[r.ref] = { o: outs[i % outs.length], note: outs[i % outs.length] === 'Compliant' ? 'Evidence reviewed and sufficient.' : 'Gaps found; see finding.' }; });
  SEED.cases[4].findings = [{ id: 'f-w1', ref: 'ISR-4.1', cls: 'MiNC', title: 'MFA not enforced for remote vendor access', due: '2027-01-31' }, { id: 'f-w2', ref: 'ISR-1.3', cls: 'OBS', title: 'Risk assessment not updated after core banking change', due: '2027-02-28' }];
  /* closed programme p3: published reports with scores */
  [['zenith', 82, 'kpmg'], ['uba', 76, 'deloitte'], ['gtb', 88, 'deloitte'], ['wema', 64, 'pwc'], ['moniepoint', 71, 'kpmg'], ['opay', 59, 'ey']].forEach(([o, sc, f], i) => SEED.cases.push(C({ id: 'h' + i, prog: 'p3', org: o, firm: f, firmStatus: 'Accepted', stage: 'Published', due: '2025-12-15', score: sc, published: '20 Feb 2026', opened: i !== 5 })));
  /* p2 is delegated to firms for publishing: Deloitte may publish this approved report */
  const p2 = SEED.programmes[1];
  SEED.cases.push(C({ id: 'c9', prog: 'p2', org: 'wema', firm: 'deloitte', firmStatus: 'Accepted', lead: 'T. Adebayo', stage: 'Approved', due: '2026-12-15', answers: sampleAnswers(p2.qset, 99), submitted: '20 Oct 2026', reportAt: '24 Oct 2026', approved: { by: 'N. Adeyemi', when: '26 Oct 2026' }, reviewer: 'N. Adeyemi', signed: { by: 'T. Adebayo', when: '24 Oct 2026' } }));
  qsetReqs(p2.qset).forEach((r, i) => { SEED.cases[SEED.cases.length - 1].outcomes[r.ref] = { o: i === 2 ? 'Partially compliant' : 'Compliant', note: 'Reviewed.' }; });
  SEED.cases[SEED.cases.length - 1].score = 83;
  /* p3 published reports: outcome for the single CPR requirement */
  SEED.cases.filter(c => c.prog === 'p3').forEach(c => { c.outcomes['CPR-3.1'] = { o: c.score >= 80 ? 'Compliant' : c.score >= 60 ? 'Partially compliant' : 'Non-compliant', note: 'Complaints register reviewed for Q3 and Q4 2025.' }; c.reviewer = 'N. Adeyemi'; c.approved = { by: 'M. Bello', when: '18 Feb 2026' }; c.openedAt = c.opened ? '21 Feb 2026' : ''; });
  SEED.cases.find(c => c.id === 'h0').findings = [{ id: 'f-h0', ref: 'CPR-3.1', cls: 'OBS', title: 'Complaint acknowledgement slipped past 48 hours in December', due: '2026-05-20', status: 'Verified fixed' }];
  /* PwC advised GTB recently: assigning PwC to GTB in a firm-assigned programme is blocked */
  SEED.firms.pwc.clients = [{ org: 'Guaranty Trust Bank Ltd', orgId: 'gtb', ini: 'GT', col: '#E35205', service: 'Core banking security advisory', since: 'Mar 2026' }];
  SEED.firms.deloitte.clients.forEach(c => { c.orgId = c.org.startsWith('Northgate') ? 'northgate' : 'kestrel'; });
  const E = (id, org, name, size, kind, by, when, expires, links) => ({ id, org, name, size, kind, by, when, expires, links });
  SEED.evidence = [
    E('e1', 'zenith', 'Information security policy v4.2.pdf', '1.4 MB', 'Policy', 'C. Eze', '2 Sep 2026', '2027-09-01', ['ISR-1.1#0']),
    E('e2', 'zenith', 'Board resolution — ISMS policy approval.pdf', '420 KB', 'Board record', 'A. Okonkwo', '2 Sep 2026', '', ['ISR-1.1#0']),
    E('e3', 'zenith', 'MFA configuration export — Okta.xlsx', '96 KB', 'System export', 'C. Eze', '10 Oct 2026', '2026-12-31', []),
    E('e4', 'zenith', 'Incident response plan 2026.pdf', '2.1 MB', 'Plan', 'C. Eze', '5 Aug 2026', '2026-11-30', []),
    E('e5', 'zenith', 'Quarterly access review Q3 2026.pdf', '640 KB', 'Report', 'C. Eze', '8 Oct 2026', '', [])
  ];
  SEED.findingClasses = [
    { code: 'MaNC', name: 'Major nonconformity', d: 'A requirement is not met and the risk is significant.', days: 30, tone: 'bad' },
    { code: 'MiNC', name: 'Minor nonconformity', d: 'A requirement is partly met; the gap is contained.', days: 60, tone: 'warn' },
    { code: 'OBS', name: 'Observation', d: 'Not a breach yet, but could become one.', days: 90, tone: 'info' },
    { code: 'OFI', name: 'Opportunity for improvement', d: 'Good practice the organisation may adopt. No fix deadline.', days: 0, tone: 'neu' }
  ];
  SEED.notifications.push(
    { id: 'nb1', ws: 'regulator', i: 'handshake', tone: 'warn', title: 'UBA asked to use a firm that is not accredited (Data protection 2026)', when: '17 Oct, 14:05', unread: true, go: 'programmes/view', arg: 'p2|organisations', kind: 'Approvals' },
    { id: 'nb2', ws: 'organisation', i: 'list-checks', tone: 'info', title: 'ISR 2026 annual assessment is open. Due 30 Nov 2026', when: '1 Oct, 09:00', unread: true, go: 'org/obligations', kind: 'Reminders' },
    { id: 'nb3', ws: 'organisation', i: 'handshake', tone: 'warn', title: 'Choose an assessor for Data protection compliance 2026', when: '15 Oct, 09:00', unread: true, go: 'org/obligations', kind: 'Reminders' }
  );
})();

