/* ================= Demo data =================
   Demo tenant: NITDA. Real institution and firm names appear only on onboarding, directory and profile screens.
   Anything with a score (dashboard) uses fictional organisations. */
const SEED = {
  route: 'home', ws: 'public', me: 'm.bello@nitda.gov.ng', orgId: 'zenith', firmId: 'deloitte',
  tenant: { name: 'NITDA', full: 'National Information Technology Development Agency', short: 'NITDA', ini: 'NI', col: '#0B7A3E', legal: 'National Information Technology Development Agency', domain: 'superatlas.nitda.gov.ng', mandate: 'Develops and regulates information technology in Nigeria, and supervises organisations for compliance with the frameworks and guidelines published in the requirements library.', email: 'supervision@nitda.gov.ng', phone: '+234 9 000 0000', address: 'No. 28 Port Harcourt Crescent, Area 11, Garki, Abuja', sectors: ['Banking', 'Payments', 'Digital economy'], theme: 'default', logoUploaded: true, signinMsg: 'Supervision on SuperAtlas', onboarded: true },
  /* sign-in routing: one universal sign-in, routed by account */
  accounts: {
    'm.bello@nitda.gov.ng': { name: 'M. Bello', first: 'Musa', ini: 'MB', role: 'Supervision lead', ws: 'regulator', memberships: [{ ws: 'regulator', id: 'nitda' }] },
    'a.okonkwo@zenith.example': { name: 'A. Okonkwo', first: 'Adaeze', ini: 'AO', role: 'Chief compliance officer', ws: 'organisation', memberships: [{ ws: 'organisation', id: 'zenith' }] },
    't.adebayo@deloitte.example': { name: 'T. Adebayo', first: 'Tunde', ini: 'TA', role: 'Partner, risk advisory', ws: 'firm', memberships: [{ ws: 'firm', id: 'deloitte' }] },
    'b.nwosu@halcyon.example': { name: 'B. Nwosu', first: 'Bola', ini: 'BN', role: 'Lead assessor', ws: 'firm', memberships: [{ ws: 'firm', id: 'halcyon', role: 'Lead assessor' }, { ws: 'firm', id: 'meridale', role: 'Assessor (associate)' }] }
  },
  /* three-level taxonomy: sector → institution type → authorisation tier */
  categories: [
    { id: 'bank', name: 'Banking', types: [
      { id: 'cb', name: 'Commercial bank', plural: 'Commercial banks', count: 24, tiers: ['International', 'National', 'Regional'] },
      { id: 'nib', name: 'Non-interest bank', plural: 'Non-interest banks', count: 5, tiers: ['National', 'Regional'] },
      { id: 'mb', name: 'Merchant bank', plural: 'Merchant banks', count: 6, tiers: ['National'] },
      { id: 'mfb', name: 'Microfinance bank', plural: 'Microfinance banks', count: 58, tiers: ['National', 'State', 'Unit'] }
    ] },
    { id: 'pay', name: 'Payments', types: [
      { id: 'mmo', name: 'Mobile money operator', count: 22, tiers: [] },
      { id: 'sp', name: 'Switching and processing', count: 6, tiers: [] },
      { id: 'pssp', name: 'Payment solution service provider', count: 12, tiers: ['PSSP', 'PTSP', 'Super-agent'] }
    ] },
    { id: 'dig', name: 'Digital economy', types: [
      { id: 'dc', name: 'Data controller of major importance', count: 21, tiers: ['Ultra-high level', 'Extra-high level', 'Ordinary-high level'] },
      { id: 'csp', name: 'Cloud service provider', count: 7, tiers: [] },
      { id: 'fp', name: 'Fintech platform', count: 6, tiers: [] }
    ] }
  ],
  tags: ['Listed', 'D-SIB', 'Systemically important', 'Foreign-owned'],
  groups: [{ name: 'DMBs (deposit money banks)', rule: 'Commercial bank + Non-interest bank + Merchant bank', count: 35 }, { name: 'Tier-1 banks', rule: 'Commercial bank · International', count: 8 }],
  catHistory: [
    { when: '12 Oct 2026', who: 'M. Bello', what: 'Added tier "Super-agent" under Payment solution service provider' },
    { when: '3 Oct 2026', who: 'N. Adeyemi', what: 'Created saved group "Tier-1 banks"' },
    { when: '1 Mar 2026', who: 'M. Bello', what: 'Imported 3 sectors, 10 types and 19 tiers from spreadsheet' }
  ],
  /* every organisation, whatever its stage, lives here; status drives the directory filters */
  orgs: {
    zenith: { id: 'zenith', name: 'Zenith Bank Plc', ini: 'ZB', col: '#C8102E', web: 'zenithbank.com', sector: 'Banking', type: 'Commercial bank', tier: 'National', status: 'Verified', officer: 'A. Okonkwo', joined: 'Mar 2026', last: 'Today', hq: 'Lagos', tags: ['Listed', 'D-SIB'], rc: 'RC 000000 (sample)', email: 'compliance@zenith.example', logoUp: false,
      onboard: { profile: true, logo: false, officers: false, people: false, group: false },
      officers: [{ ini: 'AO', name: 'A. Okonkwo', role: 'Chief compliance officer', email: 'a.okonkwo@zenith.example' }], colleagues: [{ email: 'c.eze@zenith.example', name: 'C. Eze', role: 'Contributor', status: 'Active' }], links: [],
      invite: { email: 'a.okonkwo@zenith.example', history: [['1 Mar 2026', 'Invitation sent', 'M. Bello'], ['2 Mar 2026', 'Invitation accepted', 'A. Okonkwo']] } },
    uba: { id: 'uba', name: 'United Bank for Africa Plc', ini: 'UB', col: '#D71920', web: 'ubagroup.com', sector: 'Banking', type: 'Commercial bank', tier: 'International', status: 'Verified', officer: 'F. Adeyemi', joined: 'Mar 2026', last: 'Yesterday', hq: 'Lagos', tags: ['Listed', 'D-SIB'], invite: { email: 'compliance@ubagroup.example', history: [['1 Mar 2026', 'Invitation sent', 'M. Bello'], ['4 Mar 2026', 'Invitation accepted', 'F. Adeyemi']] } },
    gtb: { id: 'gtb', name: 'Guaranty Trust Bank Ltd', ini: 'GT', col: '#E35205', web: 'gtbank.com', sector: 'Banking', type: 'Commercial bank', tier: 'International', status: 'Verified', officer: 'O. Bakare', joined: 'Apr 2026', last: '2 days ago', hq: 'Lagos', tags: ['D-SIB'], invite: { email: 'compliance@gtbank.example', history: [['2 Apr 2026', 'Invitation sent', 'N. Adeyemi'], ['3 Apr 2026', 'Invitation accepted', 'O. Bakare']] } },
    stanbic: { id: 'stanbic', name: 'Stanbic IBTC Bank Plc', ini: 'SI', col: '#0033A1', web: 'stanbicibtcbank.com', sector: 'Banking', type: 'Commercial bank', tier: 'National', status: 'Pending verification', officer: 'N. Eze', joined: 'Oct 2026', last: '15 Oct', hq: 'Lagos', tags: ['Foreign-owned'],
      invite: { email: 'compliance@stanbicibtc.example', history: [['2 Oct 2026', 'Invitation sent', 'M. Bello'], ['15 Oct 2026', 'Invitation accepted', 'N. Eze'], ['15 Oct 2026', 'Profile submitted for verification', 'N. Eze']] },
      application: { route: 'Invitation', submitted: '15 Oct 2026', rc: 'RC 000001 (sample)', licence: 'Banking licence — national authorisation.pdf', contact: 'N. Eze · Chief compliance officer', checks: [['RC number format', true], ['Licence category matches chosen category', true], ['No duplicate organisation', true], ['Contact email on organisation domain', true]] } },
    wema: { id: 'wema', name: 'Wema Bank Plc', ini: 'WB', col: '#5C2D91', web: 'wemabank.com', sector: 'Banking', type: 'Commercial bank', tier: 'Regional', status: 'Verified', officer: 'T. Lawal', joined: 'May 2026', last: '6 Oct', hq: 'Lagos', tags: ['Listed'], invite: { email: 'compliance@wemabank.example', history: [['2 May 2026', 'Invitation sent', 'N. Adeyemi'], ['5 May 2026', 'Invitation accepted', 'T. Lawal']] } },
    jaiz: { id: 'jaiz', name: 'Jaiz Bank Plc', ini: 'JB', col: '#006A4E', web: 'jaizbankplc.com', sector: 'Banking', type: 'Non-interest bank', tier: 'National', status: 'Verified', officer: 'H. Musa', joined: 'Jun 2026', last: '4 days ago', hq: 'Abuja', tags: ['Listed'], invite: { email: 'compliance@jaizbank.example', history: [['1 Jun 2026', 'Invitation sent', 'M. Bello'], ['2 Jun 2026', 'Invitation accepted', 'H. Musa']] } },
    moniepoint: { id: 'moniepoint', name: 'Moniepoint Microfinance Bank', ini: 'MP', col: '#0357EE', web: 'moniepoint.com', sector: 'Banking', type: 'Microfinance bank', tier: 'National', status: 'Verified', officer: 'C. Obi', joined: 'Feb 2026', last: 'Today', hq: 'Lagos', tags: [], invite: { email: 'compliance@moniepoint.example', history: [['3 Feb 2026', 'Invitation sent', 'M. Bello'], ['4 Feb 2026', 'Invitation accepted', 'C. Obi']] } },
    opay: { id: 'opay', name: 'OPay Digital Services Ltd', ini: 'OP', col: '#1DCF9F', web: 'opayweb.com', sector: 'Payments', type: 'Mobile money operator', tier: '', status: 'Verified', officer: 'K. Sule', joined: 'Jan 2026', last: '3 days ago', hq: 'Lagos', tags: [], rc: 'RC 000004 (sample)', email: 'compliance@opay.example', invite: { email: 'compliance@opay.example', history: [['10 Jan 2026', 'Invitation sent', 'M. Bello'], ['12 Jan 2026', 'Invitation accepted', 'K. Sule']] } },
    crestfield: { id: 'crestfield', name: 'Crestfield Microfinance Bank Ltd', ini: 'CM', col: '#6B4FA0', web: 'crestfieldmfb.example', sector: 'Banking', type: 'Microfinance bank', tier: 'State', status: 'Pending verification', officer: 'R. Ibrahim', joined: 'Oct 2026', last: '17 Oct', hq: 'Kano', tags: [], selfReg: true,
      application: { route: 'Self-registration', submitted: '17 Oct 2026', rc: 'RC 000002 (sample)', licence: 'MFB licence — state.pdf', contact: 'R. Ibrahim · Compliance officer', checks: [['RC number format', true], ['Licence category matches chosen category', true], ['No duplicate organisation', true], ['Contact email on organisation domain', false]] } },
    lumen: { id: 'lumen', name: 'Lumen Digital Services Ltd', ini: 'LD', col: '#0F766E', web: 'lumendigital.example', sector: 'Digital economy', type: 'Cloud service provider', tier: '', status: 'Info requested', officer: 'E. Johnson', joined: 'Oct 2026', last: '18 Oct', hq: 'Abuja', tags: [], selfReg: true, infoMsg: 'Please upload your cloud service provider licence. The certificate of incorporation does not show the licensed activity.',
      application: { route: 'Self-registration', submitted: '18 Oct 2026', rc: 'RC 000003 (sample)', licence: 'Certificate of incorporation.pdf', contact: 'E. Johnson · Head of risk', checks: [['RC number format', true], ['Licence category matches chosen category', false], ['No duplicate organisation', true], ['Contact email on organisation domain', true]] } },
    kestrel: { id: 'kestrel', name: 'Kestrel Payments Ltd', ini: 'KP', col: '#8A5A00', web: 'kestrel.example', sector: 'Payments', type: 'Payment solution service provider', tier: 'PSSP', status: 'Invited', officer: '—', joined: '—', last: '14 Oct', hq: '—', tags: [], invite: { email: 'compliance@kestrel.example', sent: '14 Oct 2026', expires: '28 Oct 2026', by: 'M. Bello', history: [['14 Oct 2026', 'Invitation sent', 'M. Bello']] } },
    northgate: { id: 'northgate', name: 'Northgate Bank Plc', ini: 'NB', col: '#1F4E79', web: 'northgate.example', sector: 'Banking', type: 'Commercial bank', tier: 'National', status: 'Invited', officer: '—', joined: '—', last: '16 Oct', hq: '—', tags: [], invite: { email: 'compliance@northgate.example', sent: '16 Oct 2026', expires: '30 Oct 2026', by: 'N. Adeyemi', history: [['16 Oct 2026', 'Invitation sent', 'N. Adeyemi']] } },
    brightwater: { id: 'brightwater', name: 'Brightwater Finance Ltd', ini: 'BF', col: '#2E6F95', web: 'brightwater.example', sector: 'Digital economy', type: 'Fintech platform', tier: '', status: 'Invite expired', officer: '—', joined: '—', last: '15 Sep', hq: '—', tags: [], invite: { email: 'admin@brightwater.example', sent: '1 Sep 2026', expires: '15 Sep 2026', by: 'N. Adeyemi', history: [['1 Sep 2026', 'Invitation sent', 'N. Adeyemi'], ['15 Sep 2026', 'Invitation expired', 'System']] } },
    corvid: { id: 'corvid', name: 'Corvid Quick Loans Ltd', ini: 'CQ', col: '#7A4E2D', web: 'corvidloans.example', sector: 'Digital economy', type: 'Fintech platform', tier: '', status: 'Rejected', officer: 'P. Okon', joined: '—', last: '9 Oct', hq: 'Lagos', tags: [], selfReg: true, rejectMsg: 'The licence uploaded belongs to a different company. You can apply again with the correct licence.',
      application: { route: 'Self-registration', submitted: '7 Oct 2026', rc: 'RC 000006 (sample)', licence: 'Operating licence.pdf', contact: 'P. Okon · Director', checks: [['RC number format', true], ['Licence category matches chosen category', false], ['No duplicate organisation', true], ['Contact email on organisation domain', false]] } }
  },
  importRows: [
    { org: 'Zenith Bank Plc', email: 'compliance@zenith.example', ini: 'ZB', col: '#C8102E', sector: 'Banking', type: 'Commercial bank', tier: 'National', flag: 'exists' },
    { org: 'United Bank for Africa Plc', email: 'compliance@ubagroup.example', ini: 'UB', col: '#D71920', sector: 'Banking', type: 'Commercial bank', tier: 'International', flag: 'exists' },
    { org: 'TAJ Bank Ltd', email: 'compliance@tajbank.example', ini: 'TB', col: '#7A1F5C', sector: 'Banking', type: 'Non-interest bank', tier: '', flag: 'tier' },
    { org: 'OPay Digital Services Ltd', email: 'compliance@opay.example', ini: 'OP', col: '#1DCF9F', sector: 'Banking', type: 'Microfinance bank', tier: 'National', flag: 'category' },
    { org: 'Sterling Bank Plc', email: 'compliance@sterling.example', ini: 'SB', col: '#D2232A', sector: 'Banking', type: 'Commercial bank', tier: 'National', flag: '' },
    { org: 'Harbour Trust Microfinance Bank', email: 'risk@harbourtrust.example', ini: 'HT', col: '#00796B', sector: 'Banking', type: 'Microfinance bank', tier: 'State', flag: '' },
    { org: 'Brightwater Finance Ltd', email: 'admin@brightwater.example', ini: 'BF', col: '#2E6F95', sector: 'Digital economy', type: 'Fintech platform', tier: '', flag: 'expired' }
  ],
  classReqs: [
    { id: 'cc211', ref: 'CC-0211', org: 'wema', by: 'T. Lawal, Chief compliance officer', date: '6 Oct 2026', from: { sector: 'Banking', type: 'Commercial bank', tier: 'Regional' }, to: { sector: 'Banking', type: 'Commercial bank', tier: 'National' }, reason: 'We received national authorisation in September. The new licence is attached.', file: 'National authorisation letter.pdf', status: 'Pending', impact: 'Wema Bank moves into the National tier. 12 additional requirements apply from the next cycle.' },
    { id: 'cc188', ref: 'CC-0188', org: 'moniepoint', by: 'C. Obi, Head of compliance', date: '2 Jun 2026', from: { sector: 'Banking', type: 'Microfinance bank', tier: 'State' }, to: { sector: 'Banking', type: 'Microfinance bank', tier: 'National' }, reason: 'National MFB licence granted in May.', file: 'National MFB licence.pdf', status: 'Approved', decided: '9 Jun 2026', note: 'Approved. Effective from the next cycle.', impact: '' }
  ],
  firms: {
    deloitte: { id: 'deloitte', name: 'Deloitte & Touche (Nigeria)', ini: 'D', col: '#4E8A12', web: 'deloitte.com/ng', types: ['Audit & assurance', 'Cybersecurity assessor'], status: 'Accredited', assigned: 14, renews: 'Jan 2027', since: 'Feb 2024', city: 'Lagos · Abuja', real: true, email: 'regulatory@deloitte.example', logoUp: false,
      onboard: { profile: true, logo: false, people: false, clients: false },
      people: [
        { name: 'T. Adebayo', ini: 'TA', role: 'Lead auditor', title: 'Partner, risk advisory', cred: 'FCA, CISA', expires: 'Dec 2027', status: 'Active' },
        { name: 'I. Okafor', ini: 'IO', role: 'Assessor', title: 'Director, cyber', cred: 'CISSP, ISO 27001 Lead Auditor', expires: 'Jun 2027', status: 'Active' },
        { name: 'R. Salami', ini: 'RS', role: 'Assessor', title: 'Senior manager, audit', cred: 'CIPP/E (in progress)', expires: '—', status: 'Pending credential' }
      ],
      clients: [
        { org: 'Northgate Bank Plc', ini: 'NB', col: '#1F4E79', service: 'IT strategy advisory', since: 'Jan 2026' },
        { org: 'Kestrel Payments Ltd', ini: 'KP', col: '#8A5A00', service: 'Remediation support', since: 'Jul 2025' }
      ] },
    kpmg: { id: 'kpmg', name: 'KPMG Professional Services', ini: 'K', col: '#00338D', web: 'kpmg.com/ng', types: ['Audit & assurance', 'Data protection (DPCO)'], status: 'Accredited', assigned: 11, renews: 'Mar 2027', since: 'Mar 2024', city: 'Lagos', real: true,
      people: [{ name: 'O. Fashola', ini: 'OF', role: 'Lead auditor', title: 'Partner', cred: 'FCA, CIPP/E', expires: 'Mar 2028', status: 'Active' }, { name: 'G. Uche', ini: 'GU', role: 'Assessor', title: 'Manager', cred: 'CISA', expires: 'Aug 2027', status: 'Active' }], clients: [] },
    pwc: { id: 'pwc', name: 'PricewaterhouseCoopers Nigeria', ini: 'PwC', col: '#D04A02', web: 'pwc.com/ng', types: ['Audit & assurance', 'Advisory & remediation'], status: 'Accredited', assigned: 9, renews: 'Feb 2027', since: 'Feb 2025', city: 'Lagos', real: true,
      people: [{ name: 'E. Ajayi', ini: 'EA', role: 'Lead auditor', title: 'Partner', cred: 'FCA', expires: 'Feb 2028', status: 'Active' }], clients: [] },
    ey: { id: 'ey', name: 'Ernst & Young Nigeria', ini: 'EY', col: '#2E2E38', web: 'ey.com/ng', types: ['Audit & assurance', 'Data protection (DPCO)'], status: 'Renewal due', assigned: 7, renews: 'Nov 2026', since: 'Nov 2024', city: 'Lagos', real: true,
      people: [{ name: 'S. Bello', ini: 'SB', role: 'Lead auditor', title: 'Partner', cred: 'FCA, CIPM', expires: 'Jan 2027', status: 'Active' }], clients: [] },
    halcyon: { id: 'halcyon', name: 'Halcyon Assurance Ltd', ini: 'HA', col: '#3B5BA5', web: 'halcyon.example', types: ['Cybersecurity assessor'], status: 'In review', assigned: 0, renews: '—', since: '—', city: 'Lagos', email: 'hello@halcyon.example',
      onboard: { profile: true, logo: true, people: true, clients: true },
      people: [{ name: 'B. Nwosu', ini: 'BN', role: 'Lead auditor', title: 'Lead assessor', cred: 'OSCP, CISSP', expires: 'Apr 2028', status: 'Active' }, { name: 'F. Olatunji', ini: 'FO', role: 'Assessor', title: 'Security consultant', cred: 'CEH', expires: 'Sep 2027', status: 'Active' }], clients: [] },
    northpoint: { id: 'northpoint', name: 'Northpoint DPCO', ini: 'NP', col: '#7A5C3E', web: 'northpoint.example', types: ['Data protection (DPCO)'], status: 'Suspended', assigned: 0, renews: '—', since: 'Jun 2025', city: 'Ibadan', suspendReason: 'Licence lapsed with the data protection authority',
      people: [{ name: 'L. Ade', ini: 'LA', role: 'Lead auditor', title: 'Principal', cred: 'CIPP/E', expires: 'Expired', status: 'Active' }], clients: [] },
    meridale: { id: 'meridale', name: 'Meridale Partners', ini: 'MP', col: '#5B6B2F', web: 'meridale.example', types: ['Audit & assurance'], status: 'In review', assigned: 0, renews: '—', since: '—', city: 'Port Harcourt', email: 'office@meridale.example',
      onboard: { profile: true, logo: true, people: true, clients: true },
      people: [{ name: 'P. Eke', ini: 'PE', role: 'Lead auditor', title: 'Managing partner', cred: 'FCA', expires: 'Oct 2027', status: 'Active' }, { name: 'S. Ojo', ini: 'SO', role: 'Assessor', title: 'Senior associate', cred: 'ACA, CISA', expires: 'Jan 2028', status: 'Active' }, { name: 'B. Nwosu', ini: 'BN', role: 'Assessor', title: 'Associate assessor', cred: 'OSCP, CISSP', expires: 'Apr 2028', status: 'Active' }], clients: [{ org: 'Harbour Trust Microfinance Bank', ini: 'HT', col: '#00796B', service: 'Policy review', since: 'Mar 2026' }] }
  },
  firmAccreditations: {
    deloitte: [{ type: 'Audit & assurance', ref: 'ACC-2026-0142', from: '1 Feb 2026', to: '31 Jan 2027', status: 'Active' }, { type: 'Cybersecurity assessor', ref: 'ACC-2026-0187', from: '1 Mar 2026', to: '28 Feb 2027', status: 'Active' }],
    kpmg: [{ type: 'Audit & assurance', ref: 'ACC-2026-0110', from: '1 Apr 2026', to: '31 Mar 2027', status: 'Active' }, { type: 'Data protection (DPCO)', ref: 'ACC-2026-0111', from: '1 Apr 2026', to: '31 Mar 2027', status: 'Active' }],
    pwc: [{ type: 'Audit & assurance', ref: 'ACC-2026-0098', from: '1 Mar 2026', to: '28 Feb 2027', status: 'Active' }, { type: 'Advisory & remediation', ref: 'ACC-2026-0099', from: '1 Mar 2026', to: '28 Feb 2027', status: 'Active' }],
    ey: [{ type: 'Audit & assurance', ref: 'ACC-2025-0301', from: '1 Dec 2025', to: '30 Nov 2026', status: 'Renewal due' }, { type: 'Data protection (DPCO)', ref: 'ACC-2025-0302', from: '1 Dec 2025', to: '30 Nov 2026', status: 'Renewal due' }],
    northpoint: [{ type: 'Data protection (DPCO)', ref: 'ACC-2025-0207', from: '1 Jul 2025', to: '30 Jun 2026', status: 'Suspended' }]
  },
  accApps: [
    { id: 'acc2', firm: 'halcyon', type: 'Cybersecurity assessor', submitted: '11 Oct 2026', due: '8 Nov 2026', status: 'In review', docs: [['Company registration', true], ['Professional indemnity insurance', false], ['Methodology document', true], ['Assessor CVs and certificates (2)', true]], assessors: [['B. Nwosu', 'OSCP, CISSP', true], ['F. Olatunji', 'CEH', true]], decl: 'Independence declaration signed. Advisory clients declared: 0.' },
    { id: 'acc3', firm: 'meridale', type: 'Audit & assurance', submitted: '16 Oct 2026', due: '13 Nov 2026', status: 'In review', docs: [['Company registration', true], ['Professional indemnity insurance', true], ['Audit methodology', true], ['Assessor CVs and certificates (3)', true]], assessors: [['P. Eke', 'FCA', true], ['S. Ojo', 'ACA, CISA', true]], decl: 'Independence declaration signed. Advisory clients declared: 1.' }
  ],
  firmTypes: [
    { id: 'audit', name: 'Audit & assurance', icon: 'certificate', criteria: ['Registered audit firm in good standing', 'Professional indemnity insurance of at least ₦500m', 'At least 2 partners with FCA or equivalent'], creds: 'FCA, ACA, CISA', docs: 'Registration, insurance, methodology, assessor CVs' },
    { id: 'dpco', name: 'Data protection (DPCO)', icon: 'lock-simple', criteria: ['Current DPCO licence from the data protection authority', 'Named data protection lead', 'Documented audit methodology'], creds: 'CIPP/E, CIPM, CDPO', docs: 'DPCO licence, insurance, methodology, assessor CVs' },
    { id: 'cyber', name: 'Cybersecurity assessor', icon: 'shield-check', criteria: ['At least 3 certified assessors', 'Penetration testing methodology', 'Secure evidence handling procedure'], creds: 'CISSP, OSCP, ISO 27001 Lead Auditor', docs: 'Registration, insurance, methodology, assessor CVs' },
    { id: 'advisory', name: 'Advisory & remediation', icon: 'users', criteria: ['Registered consulting firm', 'Conflict-of-interest policy', 'Cannot assess an organisation it advised in the last 24 months'], creds: 'Relevant professional certification', docs: 'Registration, conflict policy, team CVs' }
  ],
  firmRules: { renewal: '12', grace: '30', conflictMonths: '24' },
  team: [
    { name: 'M. Bello', ini: 'MB', email: 'm.bello@nitda.gov.ng', role: 'Admin', portfolio: 'All categories', status: 'Active', last: 'Now' },
    { name: 'N. Adeyemi', ini: 'NA', email: 'n.adeyemi@nitda.gov.ng', role: 'Supervisor', portfolio: 'Commercial bank, Non-interest bank', status: 'Active', last: '2 hours ago' },
    { name: 'J. Okeke', ini: 'JO', email: 'j.okeke@nitda.gov.ng', role: 'Reviewer', portfolio: 'Microfinance bank', status: 'Active', last: 'Yesterday' },
    { name: 'S. Danjuma', ini: 'SD', email: 's.danjuma@nitda.gov.ng', role: 'Viewer', portfolio: 'All categories', status: 'Active', last: '3 days ago' }
  ],
  roles: [
    { name: 'Admin', d: 'Everything, including settings, team and branding' },
    { name: 'Supervisor', d: 'Manage organisations and firms in their portfolio; approve and publish' },
    { name: 'Reviewer', d: 'Review reports and returns assigned to them' },
    { name: 'Viewer', d: 'Read-only access to dashboards and records' }
  ],
  perms: [
    ['Invite and verify organisations', 1, 1, 0, 0], ['Approve classification changes', 1, 1, 0, 0], ['Accredit assurance firms', 1, 1, 0, 0],
    ['Edit requirements and scoring', 1, 0, 0, 0], ['Review reports and returns', 1, 1, 1, 0], ['Publish reports', 1, 1, 0, 0],
    ['Manage branding and team', 1, 0, 0, 0], ['View dashboards', 1, 1, 1, 1]
  ],
  /* requirements library: regulation → sections → requirements → questions and evidence */
  regs: [
    { id: 'isr', ref: 'ISR', name: 'Information Security Regulation 2026', category: 'Information security', version: 'v2.0', effective: '1 Jan 2026', updated: '12 Sep 2026', status: 'Published', file: 'information-security-regulation-2026.pdf', applies: ['Commercial bank', 'Microfinance bank', 'Payment solution service provider', 'Cloud service provider'],
      desc: 'Sets the minimum information security controls for supervised organisations: governance, asset management, access control, operations and incident response. Organisations answer each requirement once a year and attach evidence; an accredited assessor confirms the outcome.',
      sections: [
        { id: 's1', name: '1. Governance', reqs: [
          { ref: 'ISR-1.1', t: 'Board-approved information security policy', text: 'The organisation shall maintain an information security policy approved by its board and reviewed at least once a year.', guidance: 'Upload the policy and the board resolution that approved the current version. If the review is overdue, say when it is scheduled.', weight: 'High (3)', evidence: ['Board resolution approving the policy', 'Current policy document'], questions: [['Does the board approve the information security policy?', 'Yes / No / Not applicable'], ['When did the board last review the policy?', 'Date'], ['Who owns the policy day to day?', 'Short text']] },
          { ref: 'ISR-1.2', t: 'Named chief information security officer', text: 'The organisation shall appoint a chief information security officer who reports to executive management.', guidance: 'Give the name and reporting line. If the role is outsourced, describe the arrangement.', weight: 'Normal (2)', evidence: ['Appointment letter', 'Organisation chart'], questions: [['Has a chief information security officer been appointed?', 'Yes / No / Not applicable'], ['To whom does the CISO report?', 'Short text']] },
          { ref: 'ISR-1.3', t: 'Annual information security risk assessment', text: 'The organisation shall carry out an information security risk assessment at least once a year and after any major change.', guidance: 'Summarise the method used and the top risks identified.', weight: 'Normal (2)', evidence: ['Latest risk assessment report', 'Risk register extract'], questions: [['Was a risk assessment completed in the last 12 months?', 'Yes / No / Not applicable'], ['Describe the method used', 'Long text']] } ] },
        { id: 's2', name: '2. Asset management', reqs: [
          { ref: 'ISR-2.1', t: 'Inventory of critical information assets', text: 'Keep an up-to-date inventory of critical information assets, with a named owner for each.', guidance: 'Upload the inventory or an extract showing critical assets and owners.', weight: 'Normal (2)', evidence: ['Asset inventory extract'], questions: [['Is there a current inventory of critical assets?', 'Yes / No / Not applicable'], ['How many critical assets are listed?', 'Number']] } ] },
        { id: 's4', name: '4. Access control', reqs: [
          { ref: 'ISR-4.1', t: 'Multi-factor authentication for privileged access', text: 'All privileged and remote access to production systems shall require multi-factor authentication.', guidance: 'Explain how MFA is enforced for administrators and remote users. Include any exceptions and how they are approved.', weight: 'High (3)', evidence: ['MFA configuration export', 'List of privileged accounts'], questions: [['Is MFA enforced for all privileged access?', 'Yes / No / Not applicable'], ['Is MFA enforced for all remote access?', 'Yes / No / Not applicable'], ['List any approved exceptions', 'Long text']] },
          { ref: 'ISR-4.2', t: 'Quarterly access review', text: 'Access rights to critical systems shall be reviewed at least quarterly and unused accounts removed within 30 days.', guidance: 'Attach the last two signed access reviews.', weight: 'Normal (2)', evidence: ['Signed access review reports for the last two quarters'], questions: [['Are access rights reviewed every quarter?', 'Yes / No / Not applicable'], ['Date of the last review', 'Date']] } ] },
        { id: 's7', name: '7. Incident response', reqs: [
          { ref: 'ISR-7.1', t: 'Report major incidents within 24 hours', text: 'Major security incidents shall be reported to the regulator within 24 hours of detection.', guidance: 'Describe how incidents are classified and who reports them.', weight: 'High (3)', evidence: ['Incident response plan', 'Incident log for the period'], questions: [['Is there a documented incident response plan?', 'Yes / No / Not applicable'], ['How many major incidents were reported in the period?', 'Number']] },
          { ref: 'ISR-7.2', t: 'Test the incident response plan yearly', text: 'The incident response plan shall be tested at least once a year through a tabletop or live exercise.', guidance: 'Attach the exercise report and the actions that came out of it.', weight: 'Normal (2)', evidence: ['Exercise report'], questions: [['Was the plan tested in the last 12 months?', 'Yes / No / Not applicable']] } ] } ] },
    { id: 'dpf', ref: 'DPF', name: 'Data Protection Compliance Framework', category: 'Data protection', version: 'v1.3', effective: '1 Jun 2025', updated: '2 Jun 2025', status: 'Published', file: 'data-protection-compliance-framework.pdf', applies: ['Data controller of major importance', 'Fintech platform', 'Commercial bank'],
      desc: 'How organisations that process personal data show lawful processing, records of processing, data subject rights and breach handling.',
      sections: [
        { id: 's2', name: '2. Lawful processing', reqs: [
          { ref: 'DPF-2.1', t: 'Record of processing activities', text: 'Maintain a current record of processing activities covering purpose, lawful basis and retention.', guidance: 'An extract is enough if the full record is long.', weight: 'Normal (2)', evidence: ['Record of processing activities'], questions: [['Is the record of processing activities current?', 'Yes / No / Not applicable']] },
          { ref: 'DPF-2.2', t: 'Lawful basis for each purpose', text: 'Each processing purpose shall have a documented lawful basis.', guidance: '', weight: 'Normal (2)', evidence: ['Lawful basis register'], questions: [['Is a lawful basis recorded for every purpose?', 'Yes / No / Not applicable']] } ] },
        { id: 's5', name: '5. Breach handling', reqs: [
          { ref: 'DPF-5.1', t: 'Notify personal data breaches within 72 hours', text: 'Notify the authority of personal data breaches within 72 hours of becoming aware of them.', guidance: '', weight: 'High (3)', evidence: ['Breach procedure', 'Breach log'], questions: [['Is there a breach notification procedure?', 'Yes / No / Not applicable']] } ] } ] },
    { id: 'cpr', ref: 'CPR', name: 'Consumer Protection Rules', category: 'Consumer protection', version: 'v1.0', effective: '1 Sep 2025', updated: '1 Sep 2025', status: 'Published', file: 'consumer-protection-rules.pdf', applies: ['Commercial bank', 'Microfinance bank', 'Mobile money operator'],
      desc: 'Fair treatment of customers of digital financial services: complaints, disclosure and redress.',
      sections: [{ id: 's3', name: '3. Complaints', reqs: [{ ref: 'CPR-3.1', t: 'Resolve complaints within 14 days', text: 'Customer complaints shall be acknowledged within 48 hours and resolved within 14 days.', guidance: 'Give average resolution time for the period.', weight: 'Normal (2)', evidence: ['Complaints register', 'Monthly complaints report'], questions: [['Are complaints resolved within 14 days?', 'Yes / No / Not applicable'], ['Average resolution time (days)', 'Number']] }] }] },
    { id: 'aml', ref: 'AML', name: 'Anti-Money Laundering Guidelines', category: 'Financial crime', version: 'v3.1', effective: '1 Jan 2027', updated: '14 Oct 2026', status: 'Draft', file: 'aml-guidelines-v3-1.pdf', applies: ['Commercial bank', 'Microfinance bank', 'Mobile money operator', 'Payment solution service provider'],
      desc: 'Risk-based customer due diligence, monitoring and reporting of suspicious transactions. Draft for consultation.',
      sections: [{ id: 's5', name: '5. Customer due diligence', reqs: [{ ref: 'AML-5.1', t: 'Risk-based customer due diligence', text: 'Apply customer due diligence measures proportionate to the assessed money-laundering risk.', guidance: '', weight: 'High (3)', evidence: ['CDD procedure', 'Risk assessment methodology'], questions: [['Is CDD applied on a risk basis?', 'Yes / No / Not applicable']] }] }] }
  ],
  aiExtract: [
    { ref: 'CRR-2.1', t: 'Maintain a cyber resilience strategy approved by the board', page: 4, conf: 96, state: '' },
    { ref: 'CRR-2.2', t: 'Test the business continuity plan at least once a year', page: 5, conf: 93, state: '' },
    { ref: 'CRR-3.1', t: 'Keep an up-to-date inventory of critical information assets', page: 7, conf: 91, state: '' },
    { ref: 'CRR-3.4', t: 'Encrypt customer data at rest and in transit', page: 9, conf: 88, state: '' },
    { ref: 'CRR-4.2', t: 'Run vulnerability scans monthly and fix critical findings within 14 days', page: 12, conf: 84, state: '' },
    { ref: 'CRR-5.1', t: 'Report cyber incidents that affect customers within 24 hours', page: 15, conf: 79, state: '' },
    { ref: 'CRR-6.3', t: 'Third-party providers should be reviewed periodically', page: 18, conf: 62, state: '', warn: 'Vague wording: "periodically" has no frequency. Consider setting one.' }
  ],
  schemes: [
    { id: 'four', name: '4-point compliance scale', def: true, kind: 'Outcome scale', used: 3, levels: [['Compliant', 100, 'ok'], ['Partially compliant', 50, 'warn'], ['Non-compliant', 0, 'bad'], ['Not applicable', null, 'neu']], bands: [['Strong', 85], ['Satisfactory', 70], ['Needs improvement', 50], ['Weak', 0]] },
    { id: 'maturity', name: 'Maturity scale', kind: 'Maturity', used: 1, levels: [['5 · Optimised', 100, 'ok'], ['4 · Managed', 75, 'ok'], ['3 · Defined', 50, 'warn'], ['2 · Developing', 25, 'warn'], ['1 · Initial', 0, 'bad']], bands: [['Advanced', 80], ['Established', 60], ['Emerging', 0]] },
    { id: 'pf', name: 'Pass / fail', kind: 'Binary', used: 0, levels: [['Pass', 100, 'ok'], ['Fail', 0, 'bad'], ['Not applicable', null, 'neu']], bands: [['Pass', 100], ['Fail', 0]] },
    { id: 'sat', name: 'Satisfactory scale', kind: 'Rating', used: 0, levels: [['Satisfactory', 100, 'ok'], ['Needs improvement', 50, 'warn'], ['Unsatisfactory', 0, 'bad']], bands: [['Satisfactory', 75], ['Needs improvement', 50], ['Unsatisfactory', 0]] }
  ],
  deadlines: { window: '30', reminders: '14, 7, 3, 1', escalate: '3', inviteExpiry: '14', returnsGrace: '5', tz: 'West Africa Time (WAT, UTC+1)', digest: 'Daily at 08:00' },
  /* fictional supervision data for the dashboard (Figma: Supervision overview) */
  dash: {
    quarter: 'Q3 2026', strength: 78, strengthDelta: 6, coverage: 86, findings: 23, findingsHigh: 9, overdue: 7, overdueOrgs: 4,
    series: [58, 59.5, 60, 61, 63, 66, 69, 72], band: [[52, 64], [53, 66], [54, 67], [55, 68], [57, 70], [60, 72], [63, 75], [67, 79]],
    attention: [['Example Cloud Services Ltd', 'Down 8 pts · 2 findings', [76, 75, 74, 74, 72, 70, 68, 62], 'bad'], ['Eastport Payments', 'Down 5 pts · coverage 64%', [68, 67, 67, 65, 64, 63, 61, 58], 'bad'], ['Harbour Fintech', '3 actions overdue', [68, 69, 67, 68, 70, 69, 69, 69], 'neu']],
    rows: [
      ['Riverside Digital Bank', 'Commercial bank', [72, 74, 74, 77, 79, 81, 83, 85], 85, 2, 96, 1, 'Monitoring'],
      ['Demo Hosting Ltd', 'Cloud service provider', [68, 70, 70, 73, 75, 77, 79, 81], 81, 3, 92, 2, 'Assessment closed'],
      ['Northgate Data Centres', 'Data centre operator', [60, 62, 61, 64, 66, 68, 71, 74], 74, 6, 88, 4, 'CAP in progress'],
      ['Harbour Fintech', 'Fintech platform', [68, 69, 67, 68, 70, 69, 69, 69], 69, 0, 80, 3, '3 actions overdue'],
      ['Example Cloud Services Ltd', 'Cloud service provider', [76, 75, 74, 74, 72, 70, 68, 62], 62, -8, 71, 7, 'Findings issued'],
      ['Eastport Payments', 'Payment service provider', [68, 67, 67, 65, 64, 63, 61, 58], 58, -5, 64, 6, 'Assessment due']
    ]
  },
  notifications: [
    { id: 'n1', ws: 'regulator', i: 'git-diff', tone: 'warn', title: 'Wema Bank requested a classification change', when: '6 Oct, 10:12', unread: true, go: 'organisations/profile', arg: 'wema|classification', kind: 'Approvals' },
    { id: 'n2', ws: 'regulator', i: 'seal-check', tone: 'info', title: '2 organisations are waiting for verification', when: '18 Oct, 16:40', unread: true, go: 'organisations', arg: 'Pending verification', kind: 'Approvals' },
    { id: 'n3', ws: 'regulator', i: 'certificate', tone: 'info', title: 'Halcyon Assurance applied for Cybersecurity assessor accreditation', when: '11 Oct, 09:05', unread: true, go: 'firms/profile', arg: 'halcyon|accreditations', kind: 'Approvals' },
    { id: 'n4', ws: 'regulator', i: 'envelope-simple', tone: '', title: 'Stanbic IBTC Bank accepted your invitation', when: '15 Oct, 11:30', unread: false, go: 'organisations/profile', arg: 'stanbic|invitations', kind: 'Updates' },
    { id: 'n5', ws: 'regulator', i: 'clock', tone: 'warn', title: 'Ernst & Young Nigeria accreditation renews in 30 days', when: '12 Oct, 08:00', unread: false, go: 'firms/profile', arg: 'ey|accreditations', kind: 'Reminders' },
    { id: 'n6', ws: 'regulator', i: 'chat-circle-dots', tone: '', title: 'N. Adeyemi mentioned you on Crestfield MFB', when: '18 Oct, 17:02', unread: false, go: 'organisations/profile', arg: 'crestfield|verification', kind: 'Mentions' },
    { id: 'n7', ws: 'organisation', i: 'buildings', tone: 'info', title: 'Finish setting up: add your logo and key officers', when: 'Today, 09:00', unread: true, go: 'org/welcome', kind: 'Reminders' },
    { id: 'n8', ws: 'organisation', i: 'seal-check', tone: 'ok', title: 'NITDA verified your organisation', when: '1 Mar, 14:20', unread: false, go: 'org/profile', kind: 'Updates' },
    { id: 'n9', ws: 'firm', i: 'certificate', tone: 'info', title: 'Your Audit & assurance accreditation renews in January 2027', when: '2 Oct, 09:06', unread: true, go: 'firm/profile', arg: 'accreditations', kind: 'Reminders' },
    { id: 'n10', ws: 'firm', i: 'users', tone: '', title: 'Add your assessors to finish setting up', when: 'Today, 09:00', unread: true, go: 'firm/welcome', kind: 'Reminders' }
  ],
  audit: [
    { when: '18 Oct 2026, 16:41', who: 'System', ini: 'SA', action: 'Sent reminder', record: 'Verification queue (2 waiting)', ws: 'regulator', ip: '—', detail: 'Daily digest to supervisors' },
    { when: '15 Oct 2026, 11:30', who: 'N. Eze', ini: 'NE', action: 'Accepted invitation', record: 'Stanbic IBTC Bank Plc', ws: 'organisation', ip: '102.89.xx.xx', detail: 'Account created, MFA set up' },
    { when: '12 Oct 2026, 09:14', who: 'M. Bello', ini: 'MB', action: 'Added category tier', record: 'Payment solution service provider · Super-agent', ws: 'regulator', ip: '41.58.xx.xx', detail: 'Before: 2 tiers. After: 3 tiers.' },
    { when: '9 Oct 2026, 15:02', who: 'M. Bello', ini: 'MB', action: 'Sent invitation', record: 'Kestrel Payments Ltd', ws: 'regulator', ip: '41.58.xx.xx', detail: 'Category: Payment solution service provider · PSSP' },
    { when: '6 Oct 2026, 10:12', who: 'T. Lawal', ini: 'TL', action: 'Requested classification change', record: 'Wema Bank Plc · CC-0211', ws: 'organisation', ip: '105.112.xx.xx', detail: 'Commercial bank · Regional → National' },
    { when: '3 Oct 2026, 10:44', who: 'N. Adeyemi', ini: 'NA', action: 'Created saved group', record: 'Tier-1 banks', ws: 'regulator', ip: '41.58.xx.xx', detail: 'Rule: Commercial bank · International' },
    { when: '2 Oct 2026, 09:05', who: 'T. Adebayo', ini: 'TA', action: 'Updated firm profile', record: 'Deloitte & Touche (Nigeria)', ws: 'firm', ip: '102.88.xx.xx', detail: 'Website and offices updated' },
    { when: '1 Oct 2026, 08:00', who: 'System', ini: 'SA', action: 'Sent renewal notice', record: 'Ernst & Young Nigeria', ws: 'regulator', ip: '—', detail: 'Accreditation renews Nov 2026' }
  ],
  sessions: [
    { dev: 'Chrome on Windows', where: 'Abuja, NG', when: 'Active now', cur: true },
    { dev: 'Safari on iPhone', where: 'Abuja, NG', when: '2 hours ago' },
    { dev: 'Edge on Windows', where: 'Lagos, NG', when: '3 days ago' }
  ],
  mfaDevices: [{ name: 'Authenticator app (iPhone)', added: '1 Mar 2026', last: 'Today' }]
};

/* Questions: each question ticks the answer parts it needs (Drop B rule).
   choice: 'yn' (Yes / No / Not applicable) | 'text' | 'number' | 'date' | '' (no choice) · comment · evidence · interview */
function normQ(x, i, req) {
  if (!Array.isArray(x)) return x;
  const [q, ty] = x; const yn = /Yes/.test(ty);
  return { q, choice: yn ? 'yn' : /text/i.test(ty) ? 'text' : ty === 'Number' ? 'number' : ty === 'Date' ? 'date' : '', comment: yn || /Long/.test(ty), evidence: (i === 0 && req.evidence.length > 0) || ty === 'File upload', interview: false };
}
SEED.regs.forEach(r => r.sections.forEach(s => s.reqs.forEach(req => { req.questions = (req.questions || []).map((x, i) => normQ(x, i, req)); })));
(function () { const isr = SEED.regs.find(r => r.id === 'isr'); const f = ref => isr.sections.flatMap(s => s.reqs).find(q => q.ref === ref); f('ISR-1.2').questions[1].interview = true; f('ISR-7.1').questions[0].interview = true; })();

const jclone = o => JSON.parse(JSON.stringify(o));
