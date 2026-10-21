/* ================= B5–B6 data: periodic returns, findings and remediation ================= */
(function seedB56() {
  /* a second organisation account so the returns story can be signed in as Moniepoint */
  SEED.accounts['c.obi@moniepoint.example'] = { name: 'C. Obi', first: 'Chidi', ini: 'CO', role: 'Head of compliance', ws: 'organisation', memberships: [{ ws: 'organisation', id: 'moniepoint' }] };
  Object.assign(SEED.orgs.moniepoint, { email: 'compliance@moniepoint.example', rc: 'RC 000007 (sample)', officers: [{ ini: 'CO', name: 'C. Obi', role: 'Head of compliance', email: 'c.obi@moniepoint.example' }], colleagues: [{ email: 'b.afolabi@moniepoint.example', name: 'B. Afolabi', role: 'Contributor', status: 'Active' }] });
  /* three more microfinance banks (fictional) so returns have a realistic filing population */
  const mfb = (id, name, ini, col, tier, officer, hq) => ({ id, name, ini, col, web: id + 'mfb.example', sector: 'Banking', type: 'Microfinance bank', tier, status: 'Verified', officer, joined: 'Apr 2026', last: '12 Oct', hq, tags: [], invite: { email: 'compliance@' + id + 'mfb.example', history: [['1 Apr 2026', 'Invitation sent', 'J. Okeke'], ['3 Apr 2026', 'Invitation accepted', officer]] } });
  SEED.orgs.lagoon = mfb('lagoon', 'Lagoon Microfinance Bank Ltd', 'LM', '#00838F', 'National', 'S. Adewale', 'Lagos');
  SEED.orgs.savannah = mfb('savannah', 'Savannah Microfinance Bank Ltd', 'SM', '#9E6A03', 'State', 'A. Garba', 'Kaduna');
  SEED.orgs.unity = mfb('unity', 'Unity Community Microfinance Bank', 'UC', '#6D4C9F', 'Unit', 'E. Okon', 'Calabar');

  /* ---------- Returns: templates ---------- */
  const F = (key, label, type, o = {}) => Object.assign({ key, label, type, unit: '', req: true, min: '', max: '', lte: '', help: '' }, o);
  SEED.returnTemplates = [
    { id: 'rt1', code: 'MQR', name: 'MFB quarterly operations return', freq: 'Quarterly', types: ['Microfinance bank'], dueDays: 20, grace: '', status: 'Active', version: 'v1.1', source: 'Built online', updated: '2 Jun 2026', reminders: '7, 3, 1',
      desc: 'Customers, digital usage, transactions, fraud and complaints for the quarter.',
      fields: [F('customers', 'Total customers', 'number', { min: 0, help: 'Unique customers with an active account at quarter end.' }), F('digital', 'Active digital-channel customers', 'number', { min: 0, lte: 'customers', help: 'Used the app, USSD or web at least once in the quarter.' }), F('txValue', 'Transaction value', 'number', { unit: '₦ million', min: 0 }), F('failRate', 'Failed transaction rate', 'number', { unit: '%', min: 0, max: 100 }), F('fraudN', 'Fraud incidents', 'number', { min: 0 }), F('fraudLoss', 'Fraud losses', 'number', { unit: '₦ million', min: 0 }), F('cmpRecv', 'Complaints received', 'number', { min: 0 }), F('cmpRes', 'Complaints resolved within 14 days', 'number', { min: 0, lte: 'cmpRecv' }), F('officer', 'Reporting officer', 'text')] },
    { id: 'rt2', code: 'CIR', name: 'Monthly cyber incident return', freq: 'Monthly', types: ['Commercial bank', 'Non-interest bank', 'Microfinance bank'], dueDays: 10, grace: '', status: 'Active', version: 'v2.0', source: 'Built online', updated: '1 Jan 2026', reminders: '3, 1',
      desc: 'Security incidents in the month, how many were major, and how quickly they were reported.',
      fields: [F('incidents', 'Security incidents logged', 'number', { min: 0 }), F('major', 'Major incidents', 'number', { min: 0, lte: 'incidents' }), F('in24', 'Major incidents reported within 24 hours', 'number', { min: 0, lte: 'major' }), F('downtime', 'Customer-facing downtime', 'number', { unit: 'hours', min: 0 }), F('summary', 'Summary of major incidents', 'text', { req: false })] },
    { id: 'rt3', code: 'DPA', name: 'Annual data protection audit filing', freq: 'Yearly', types: ['Commercial bank', 'Data controller of major importance', 'Fintech platform'], dueDays: 90, grace: '', status: 'Active', version: 'v1.0', source: 'Uploaded template', file: 'dpa-filing-template.xlsx', updated: '5 Jan 2026', reminders: '30, 14, 7',
      desc: 'Yearly summary of processing activities, data subject requests and breaches.',
      fields: [F('activities', 'Processing activities on record', 'number', { min: 0 }), F('dsar', 'Data subject requests received', 'number', { min: 0 }), F('dsarMet', 'Requests answered within 30 days', 'number', { min: 0, lte: 'dsar' }), F('breaches', 'Breaches notified to the authority', 'number', { min: 0 }), F('dpo', 'Data protection officer', 'text')] },
    { id: 'rt4', code: 'ANR', name: 'Agent network return', freq: 'Quarterly', types: ['Payment solution service provider', 'Mobile money operator'], dueDays: 30, grace: '', status: 'Draft', version: 'v0.1', source: 'Built online', updated: '14 Oct 2026', reminders: '7, 3, 1',
      desc: 'Draft. Agents, locations and agent-related complaints.',
      fields: [F('agents', 'Active agents', 'number', { min: 0 }), F('states', 'States with at least one agent', 'number', { min: 0, max: 37 }), F('agentCmp', 'Agent-related complaints', 'number', { min: 0 })] }
  ];

  /* ---------- Returns: filings ---------- */
  const R = (o) => Object.assign({ values: {}, history: [], queries: [], reminders: 0, source: 'Online', ver: 1 }, o);
  const q3 = { tpl: 'rt1', period: 'Q3 2026', pkey: '2026-Q3', due: '2026-10-20' };
  const q2 = { tpl: 'rt1', period: 'Q2 2026', pkey: '2026-Q2', due: '2026-07-20' };
  const sep = { tpl: 'rt2', period: 'Sep 2026', pkey: '2026-09', due: '2026-10-10' };
  const oct = { tpl: 'rt2', period: 'Oct 2026', pkey: '2026-10', due: '2026-11-10' };
  const y25 = { tpl: 'rt3', period: '2025', pkey: '2025', due: '2026-03-31' };
  const acc = (who, when, extra = {}) => Object.assign({ status: 'Accepted', filedAt: when, filedBy: who, approvedBy: who, acceptedBy: 'J. Okeke', receipt: 'RET-' + String(Math.abs([...who + when].reduce((a, ch) => a * 31 + ch.charCodeAt(0) | 0, 7))).slice(0, 6) }, extra);
  const mq = (c, d, tx, fr, fn, fl, cr, cs) => ({ customers: c, digital: d, txValue: tx, failRate: fr, fraudN: fn, fraudLoss: fl, cmpRecv: cr, cmpRes: cs });
  SEED.filings = [
    /* MQR Q3 2026 — Moniepoint has not started (story); one submitted, one accepted, one not yet due */
    R(Object.assign({ id: 'r1', org: 'moniepoint', status: 'Not started' }, q3)),
    R(Object.assign({ id: 'r2', org: 'lagoon', status: 'Submitted', filedAt: '15 Oct 2026, 11:02', filedBy: 'S. Adewale', approvedBy: 'S. Adewale', receipt: 'RET-MQR-2026Q3-LM', values: Object.assign(mq(41200, 30900, 18400, 1.9, 6, 3.2, 512, 488), { officer: 'S. Adewale' }), history: [['15 Oct 2026', 'Submitted', 'S. Adewale']] }, q3)),
    R(Object.assign({ id: 'r3', org: 'savannah', values: Object.assign(mq(12800, 6100, 2900, 2.4, 2, 0.4, 140, 131), { officer: 'A. Garba' }), history: [['12 Oct 2026', 'Submitted', 'A. Garba'], ['14 Oct 2026', 'Accepted', 'J. Okeke']] }, q3, acc('A. Garba', '12 Oct 2026, 16:40'))),
    R(Object.assign({ id: 'r4', org: 'unity', status: 'Draft', values: { customers: 3100, digital: 900 }, history: [['17 Oct 2026', 'Draft saved', 'E. Okon']] }, q3)),
    /* MQR Q2 2026 — previous period (used for change-from-last-period checks) */
    R(Object.assign({ id: 'r5', org: 'moniepoint', values: Object.assign(mq(9800000, 8120000, 2940000, 0.8, 410, 96.5, 38100, 36900), { officer: 'C. Obi' }), history: [['16 Jul 2026', 'Submitted', 'C. Obi'], ['18 Jul 2026', 'Accepted', 'J. Okeke']] }, q2, acc('C. Obi', '16 Jul 2026, 10:05'))),
    R(Object.assign({ id: 'r6', org: 'lagoon', values: Object.assign(mq(39800, 29100, 17100, 2.1, 5, 2.8, 480, 455), { officer: 'S. Adewale' }), history: [['19 Jul 2026', 'Submitted', 'S. Adewale'], ['21 Jul 2026', 'Accepted', 'J. Okeke']] }, q2, acc('S. Adewale', '19 Jul 2026, 09:30'))),
    R(Object.assign({ id: 'r7', org: 'savannah', values: Object.assign(mq(12100, 5600, 2700, 2.6, 1, 0.1, 151, 140), { officer: 'A. Garba' }), history: [['14 Jul 2026', 'Submitted', 'A. Garba']] }, q2, acc('A. Garba', '14 Jul 2026, 12:00'))),
    R(Object.assign({ id: 'r8', org: 'unity', values: Object.assign(mq(2950, 820, 410, 3.9, 0, 0, 22, 22), { officer: 'E. Okon' }), lateBy: 13, history: [['2 Aug 2026', 'Submitted (13 days late)', 'E. Okon'], ['4 Aug 2026', 'Accepted', 'J. Okeke']] }, q2, acc('E. Okon', '2 Aug 2026, 15:12'))),
    /* CIR Sep 2026 — due 10 Oct, grace ends 15 Oct: UBA and Lagoon are late */
    R(Object.assign({ id: 'r9', org: 'zenith', values: { incidents: 14, major: 1, in24: 1, downtime: 2.5, summary: 'Card switch outage on 12 Sep, restored in 2.5 hours.' }, history: [['8 Oct 2026', 'Submitted', 'A. Okonkwo'], ['9 Oct 2026', 'Accepted', 'N. Adeyemi']] }, sep, acc('A. Okonkwo', '8 Oct 2026, 14:20'))),
    R(Object.assign({ id: 'r10', org: 'uba', status: 'Not started', reminders: 1, lastReminder: '11 Oct 2026' }, sep)),
    R(Object.assign({ id: 'r11', org: 'gtb', status: 'Submitted', filedAt: '9 Oct 2026, 17:55', filedBy: 'O. Bakare', approvedBy: 'O. Bakare', receipt: 'RET-CIR-202609-GT', values: { incidents: 22, major: 0, in24: 0, downtime: 0, summary: '' }, history: [['9 Oct 2026', 'Submitted', 'O. Bakare']] }, sep)),
    R(Object.assign({ id: 'r12', org: 'wema', status: 'Queried', filedAt: '10 Oct 2026, 09:12', filedBy: 'T. Lawal', approvedBy: 'T. Lawal', receipt: 'RET-CIR-202609-WB', values: { incidents: 9, major: 2, in24: 2, downtime: 31, summary: 'Two DDoS events on internet banking.' }, queries: [{ field: 'downtime', msg: '31 hours of downtime is much higher than your usual 1 to 3 hours. Please confirm the figure, or correct it.', by: 'N. Adeyemi', when: '13 Oct 2026', status: 'Open' }], history: [['10 Oct 2026', 'Submitted', 'T. Lawal'], ['13 Oct 2026', 'Queried: downtime', 'N. Adeyemi']] }, sep)),
    R(Object.assign({ id: 'r13', org: 'jaiz', status: 'Submitted', filedAt: '14 Oct 2026, 18:30', filedBy: 'H. Musa', approvedBy: 'H. Musa', receipt: 'RET-CIR-202609-JB', lateBy: 4, values: { incidents: 4, major: 0, in24: 0, downtime: 0.5, summary: '' }, history: [['14 Oct 2026', 'Submitted (4 days after the due date, within grace)', 'H. Musa']] }, sep)),
    R(Object.assign({ id: 'r14', org: 'moniepoint', values: { incidents: 31, major: 1, in24: 1, downtime: 1, summary: 'Credential stuffing attempt blocked; one account takeover reported.' }, history: [['9 Oct 2026', 'Submitted', 'C. Obi'], ['10 Oct 2026', 'Accepted', 'J. Okeke']] }, sep, acc('C. Obi', '9 Oct 2026, 08:44'))),
    R(Object.assign({ id: 'r15', org: 'lagoon', status: 'Not started', reminders: 2, lastReminder: '16 Oct 2026' }, sep)),
    R(Object.assign({ id: 'r16', org: 'savannah', values: { incidents: 2, major: 0, in24: 0, downtime: 0, summary: '' }, history: [['6 Oct 2026', 'Submitted', 'A. Garba'], ['7 Oct 2026', 'Accepted', 'J. Okeke']] }, sep, acc('A. Garba', '6 Oct 2026, 13:00'))),
    R(Object.assign({ id: 'r17', org: 'unity', status: 'Submitted', filedAt: '10 Oct 2026, 16:10', filedBy: 'E. Okon', approvedBy: 'E. Okon', receipt: 'RET-CIR-202609-UC', values: { incidents: 0, major: 0, in24: 0, downtime: 0, summary: '' }, history: [['10 Oct 2026', 'Submitted', 'E. Okon']] }, sep)),
    /* DPA 2025 — yearly, all accepted */
    ...['zenith', 'uba', 'gtb', 'wema'].map((o, i) => R(Object.assign({ id: 'r2' + i + 'd', org: o, source: 'Upload', values: { activities: [42, 55, 38, 29][i], dsar: [118, 140, 96, 51][i], dsarMet: [112, 131, 96, 47][i], breaches: [1, 2, 0, 1][i], dpo: ['K. Danjuma', 'R. Eke', 'L. Ojo', 'P. Nnaji'][i] }, history: [['2' + i + ' Mar 2026', 'Submitted (uploaded template)', 'Compliance officer'], ['2' + (i + 4) + ' Mar 2026', 'Accepted', 'N. Adeyemi']] }, y25, acc('Compliance officer', '2' + i + ' Mar 2026'))))
  ];
  /* CIR Oct 2026 — opens for every filer, due 10 Nov */
  ['zenith', 'uba', 'gtb', 'wema', 'jaiz', 'moniepoint', 'lagoon', 'savannah', 'unity'].forEach((o, i) => SEED.filings.push(R(Object.assign({ id: 'ro' + i, org: o, status: 'Not started' }, oct))));

  /* ---------- Findings and remediation (published 2025 consumer protection reports) ---------- */
  const h = id => SEED.cases.find(c => c.id === id);
  h('h0').firm = 'deloitte';
  const FD = (o) => Object.assign({ status: 'Open', plan: null, proof: [], updates: [], verify: null, closed: null, ext: null, detail: '' }, o);
  h('h0').findings = [
    FD({ id: 'f-h0', ref: 'CPR-3.1', cls: 'OBS', title: 'Complaint acknowledgement slipped past 48 hours in December', due: '2026-05-20', status: 'Closed', plan: { action: 'Auto-acknowledge every complaint by SMS and email.', owner: 'A. Okonkwo', target: '2026-04-30', steps: [['Configure auto-acknowledgement in the CRM', true], ['Test with all channels', true]] }, proof: [['CRM acknowledgement settings.pdf', '310 KB']], updates: [['2 Apr 2026', 'A. Okonkwo', 'Plan submitted'], ['28 Apr 2026', 'A. Okonkwo', 'Fix submitted with proof']], verify: { by: 'T. Adebayo', when: '10 May 2026', ok: true, note: 'Sampled 40 complaints from April; all acknowledged within 2 hours.' }, closed: { by: 'N. Adeyemi', when: '14 May 2026' } }),
    FD({ id: 'f-h0b', ref: 'CPR-3.1', cls: 'MiNC', title: 'USSD complaints are not logged in the complaints register', detail: 'Complaints raised through the USSD channel are handled by the contact centre but never reach the register, so resolution time is not measured.', due: '2026-11-15' }),
    FD({ id: 'f-h0c', ref: 'CPR-3.1', cls: 'OBS', title: 'No monthly complaints trend report to the board', due: '2026-12-31', status: 'In progress', plan: { action: 'Add a complaints dashboard to the monthly board risk pack.', owner: 'C. Eze', target: '2026-12-15', steps: [['Agree the report format with the risk committee', true], ['Produce the first report for November', false]] }, updates: [['20 Jun 2026', 'A. Okonkwo', 'Plan submitted'], ['30 Sep 2026', 'C. Eze', 'Format agreed with the risk committee']] })
  ];
  h('h1').findings = [
    FD({ id: 'f-h1a', ref: 'CPR-3.1', cls: 'MiNC', title: 'Resolution time not measured for branch complaints', due: '2026-09-30', status: 'In progress', plan: { action: 'Log branch complaints in the central register with timestamps.', owner: 'F. Adeyemi', target: '2026-09-30', steps: [['Roll out the register to 40 branches', false]] }, updates: [['15 Apr 2026', 'F. Adeyemi', 'Plan submitted']] }),
    FD({ id: 'f-h1b', ref: 'CPR-3.1', cls: 'OFI', title: 'Publish complaint statistics on the website', due: '', status: 'Noted' })
  ];
  h('h2').findings = [
    FD({ id: 'f-h2a', ref: 'CPR-3.1', cls: 'OBS', title: 'Complaints escalation matrix not signed off by management', due: '2026-08-30', status: 'Fix submitted', plan: { action: 'Get the escalation matrix approved by the executive committee.', owner: 'O. Bakare', target: '2026-08-15', steps: [['Present to EXCO', true], ['Publish to staff', true]] }, proof: [['EXCO minutes — escalation matrix.pdf', '540 KB'], ['Escalation matrix v2 (signed).pdf', '220 KB']], updates: [['10 Mar 2026', 'O. Bakare', 'Plan submitted'], ['14 Oct 2026', 'O. Bakare', 'Fix submitted with proof']] })
  ];
  h('h3').findings = [
    FD({ id: 'f-h3a', ref: 'CPR-3.1', cls: 'MaNC', title: 'Complaints older than 14 days were not escalated', due: '2026-04-30', status: 'Verified fixed', plan: { action: 'Automatic escalation to the head of customer experience on day 10.', owner: 'T. Lawal', target: '2026-04-15', steps: [['Build the escalation rule', true], ['Clear the backlog of 212 complaints', true]] }, proof: [['Escalation rule configuration.pdf', '400 KB'], ['Backlog clearance report.xlsx', '88 KB']], updates: [['1 Mar 2026', 'T. Lawal', 'Plan submitted'], ['14 Apr 2026', 'T. Lawal', 'Fix submitted with proof']], verify: { by: 'E. Ajayi', when: '17 Oct 2026', ok: true, note: 'Rule tested in production; no complaint older than 10 days without escalation since May.' } }),
    FD({ id: 'f-h3b', ref: 'CPR-3.1', cls: 'MiNC', title: 'Complaints register incomplete for agent channel', due: '2026-07-31', status: 'In progress', plan: { action: 'Integrate the agent app with the complaints register.', owner: 'T. Lawal', target: '2026-07-31', steps: [['Vendor change request', true], ['Pilot with 200 agents', false]] }, updates: [['5 Mar 2026', 'T. Lawal', 'Plan submitted'], ['20 Jul 2026', 'T. Lawal', 'Asked for more time']], ext: { date: '2026-12-31', reason: 'The agent app vendor moved the release to November. Pilot results will follow in December.', status: 'Requested', when: '20 Jul 2026', by: 'T. Lawal' } })
  ];
  h('h4').findings = [
    FD({ id: 'f-h4a', ref: 'CPR-3.1', cls: 'OBS', title: 'Complaint categories not mapped to products', due: '2026-08-31', status: 'Closed', plan: { action: 'Map categories to the product catalogue.', owner: 'C. Obi', target: '2026-07-31', steps: [['Map and publish', true]] }, proof: [['Category mapping.xlsx', '64 KB']], verify: { by: 'O. Fashola', when: '6 Aug 2026', ok: true, note: 'Mapping complete.' }, closed: { by: 'J. Okeke', when: '8 Aug 2026' }, updates: [['2 Apr 2026', 'C. Obi', 'Plan submitted'], ['30 Jul 2026', 'C. Obi', 'Fix submitted']] })
  ];
  h('h5').findings = [
    FD({ id: 'f-h5a', ref: 'CPR-3.1', cls: 'MaNC', title: 'No complaints register for wallet disputes', due: '2026-04-30', status: 'Open', detail: 'Wallet disputes are handled in a shared mailbox with no register or resolution tracking.' }),
    FD({ id: 'f-h5b', ref: 'CPR-3.1', cls: 'MiNC', title: 'Customers not told how to escalate to NITDA', due: '2026-06-30', status: 'In progress', plan: { action: 'Add escalation wording to the app and website.', owner: 'K. Sule', target: '2026-06-30', steps: [['Draft wording', true], ['Release app update', false]] }, updates: [['12 Mar 2026', 'K. Sule', 'Plan submitted']] })
  ];

  SEED.notifications.push(
    { id: 'nr1', ws: 'organisation', org: 'moniepoint', i: 'table', tone: 'warn', title: 'MFB quarterly operations return (Q3 2026) is due 20 Oct', when: 'Today, 08:00', unread: true, go: 'org/returns', kind: 'Reminders' },
    { id: 'nr2', ws: 'regulator', i: 'table', tone: 'warn', title: '2 organisations are late with the Sep 2026 cyber incident return', when: '16 Oct, 08:00', unread: true, go: 'returns', arg: 'late', kind: 'Reminders' },
    { id: 'nf1', ws: 'organisation', org: 'zenith', i: 'flag', tone: 'warn', title: 'Plan the fix for “USSD complaints are not logged” by 15 Nov', when: '18 Oct, 09:00', unread: true, go: 'org/findings', kind: 'Reminders' },
    { id: 'nf2', ws: 'firm', org: 'deloitte', i: 'seal-check', tone: 'info', title: 'Guaranty Trust Bank submitted a fix for you to verify', when: '14 Oct, 16:20', unread: true, go: 'firm/findings', kind: 'Approvals' },
    { id: 'nf3', ws: 'regulator', i: 'flag', tone: 'info', title: 'PwC verified a fix at Wema Bank. Ready to close', when: '17 Oct, 11:05', unread: true, go: 'findings', arg: 'close', kind: 'Approvals' }
  );
})();
