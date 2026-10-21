/* ================= B5 · Data returns ================= */
const TODAY = '2026-10-19';
const tplOf = id => S.returnTemplates.find(t => t.id === id) || S.returnTemplates[0];
const filingOf = id => S.filings.find(f => f.id === id);
const dPlus = (d, n) => { const x = new Date(d + 'T12:00:00'); x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10); };
const daysBetween = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const graceOf = t => +(t.grace !== '' && t.grace != null ? t.grace : S.deadlines.returnsGrace || 0);
const FILED = ['Submitted', 'Resubmitted', 'Accepted', 'Queried'];
const isFiled = f => FILED.includes(f.status);
/* status a person sees: unfiled returns past due + grace are Late; past due inside grace are Overdue */
function retStatus(f) {
  if (isFiled(f)) return f.status;
  const t = tplOf(f.tpl); const left = daysBetween(TODAY, f.due);
  if (left < -graceOf(t)) return 'Late';
  if (left < 0) return 'Overdue';
  return f.status;
}
function retChip(f) {
  const st = retStatus(f);
  const m = { 'Not started': ['neu', 'circle-dashed'], Draft: ['neu', 'note-pencil'], Submitted: ['info', 'paper-plane-tilt'], Resubmitted: ['info', 'arrow-clockwise'], Queried: ['warn', 'chat-circle-dots'], Accepted: ['ok', 'check-circle'], Late: ['bad', 'clock'], Overdue: ['warn', 'clock'] };
  const [t, i] = m[st] || ['neu']; return chip(st, t, i);
}
function dueLine(f) {
  if (isFiled(f)) return `<span class="cap muted">Filed ${esc((f.filedAt || '').split(',')[0])}${f.lateBy ? ` · ${f.lateBy} day${f.lateBy > 1 ? 's' : ''} late` : ''}</span>`;
  const n = daysBetween(TODAY, f.due);
  return n < 0 ? `<span class="cap" style="color:var(--bad-fg)">${-n} day${n === -1 ? '' : 's'} overdue</span>` : n === 0 ? `<span class="cap" style="color:var(--warn-fg)">Due today</span>` : n <= 7 ? `<span class="cap" style="color:var(--warn-fg)">${n === 1 ? 'Due tomorrow' : 'Due in ' + n + ' days'}</span>` : `<span class="cap muted">Due in ${n} days</span>`;
}
const fmtNum = v => v === '' || v == null ? '—' : typeof v === 'number' || /^-?\d+(\.\d+)?$/.test(String(v)) ? Number(v).toLocaleString('en-GB', { maximumFractionDigits: 2 }) : esc(v);
function prevFiling(f) { const t = tplOf(f.tpl); return S.filings.filter(x => x.tpl === f.tpl && x.org === f.org && x.pkey < f.pkey && isFiled(x)).sort((a, b) => b.pkey.localeCompare(a.pkey))[0]; }
function variance(cur, prev) { if (cur === '' || cur == null || prev === '' || prev == null || isNaN(+cur) || isNaN(+prev)) return null; if (+prev === 0) return +cur === 0 ? 0 : null; return Math.round((+cur - +prev) / Math.abs(+prev) * 100); }
const VAR_FLAG = 50;
/* validation: required, numbers, min/max, "must not be more than" another field */
function retErrors(t, v) {
  const e = {};
  t.fields.forEach(fd => {
    const x = v[fd.key];
    if (x === '' || x == null) { if (fd.req) e[fd.key] = 'Enter ' + fd.label.toLowerCase() + '.'; return; }
    if (fd.type === 'number') {
      if (isNaN(+x)) { e[fd.key] = 'Enter a number.'; return; }
      if (fd.min !== '' && +x < +fd.min) e[fd.key] = `Must be ${fd.min} or more.`;
      else if (fd.max !== '' && +x > +fd.max) e[fd.key] = `Must be ${fd.max} or less.`;
      else if (fd.lte) { const o = t.fields.find(z => z.key === fd.lte); if (o && v[o.key] !== '' && v[o.key] != null && +x > +v[o.key]) e[fd.key] = `Cannot be more than ${o.label.toLowerCase()} (${fmtNum(v[o.key])}).`; }
    }
  });
  return e;
}
const periodCode = f => f.pkey.replace('-', '');
const retOrgs = t => Object.values(S.orgs).filter(o => o.status === 'Verified' && t.types.includes(o.type));
CAL_SOURCES.push(() => { const seen = {}; return S.filings.filter(f => { const k = f.tpl + f.period; if (seen[k]) return false; seen[k] = 1; return true; }).map(f => [f.due, 'Return due', tplOf(f.tpl).code + ' ' + f.period, 'ret', `returns:${f.tpl}|${f.period}`]); });

/* ---------- Regulator: Data returns ---------- */
OPEN_HOOKS['returns'] = (a, b) => { if (['due', 'review', 'queried', 'late', 'accepted'].includes(a)) { S.ui.retF = a; S.ui.retTab = 'filings'; S.ui.retTpl = 'all'; S.ui.retPer = 'all'; } else if (a === 'templates' || a === 'schedule') S.ui.retTab = a; else if (a) { S.ui.retTpl = a; S.ui.retPer = b || 'all'; S.ui.retTab = 'filings'; S.ui.retF = ''; } };
OPEN_HOOKS['returns/filing'] = a => { S.ui.filingId = a; };
OPEN_HOOKS['returns/template'] = a => { rtInit(a); };
OPEN_HOOKS['org/return'] = a => { S.ui.filingId = a; S.ui.retDraft = undefined; S.ui.retMode = 'online'; };
const RET_CARDS = [['due', 'Due', 'clock', f => !isFiled(f) && ['Not started', 'Draft'].includes(retStatus(f)) && daysBetween(TODAY, f.due) <= 31], ['review', 'To review', 'stamp', f => ['Submitted', 'Resubmitted'].includes(f.status)], ['queried', 'Queried', 'chat-circle-dots', f => f.status === 'Queried'], ['late', 'Late', 'warning', f => ['Late', 'Overdue'].includes(retStatus(f))], ['accepted', 'Accepted', 'check-circle', f => f.status === 'Accepted']];
screen('returns', {
  t: 'Data returns', layout: 'app', ws: 'regulator', crumbs: ['Data returns'],
  render() {
    const tab = ui('retTab', 'filings'); const fk = ui('retF', ''); const tp = ui('retTpl', 'all'); const per = ui('retPer', 'all'); const q = ui('retQ', '');
    const active = S.returnTemplates.filter(t => t.status === 'Active');
    const pool = S.filings.filter(f => tplOf(f.tpl).status === 'Active');
    const late = pool.filter(RET_CARDS[3][3]);
    let body = '';
    if (tab === 'filings') {
      const pers = [...new Set(pool.filter(f => tp === 'all' || f.tpl === tp).map(f => f.period))];
      const rows = pool.filter(f => (!fk || RET_CARDS.find(c => c[0] === fk)[3](f)) && (tp === 'all' || f.tpl === tp) && (per === 'all' || f.period === per) && (!q || S.orgs[f.org].name.toLowerCase().includes(q.toLowerCase()))).sort((a, b) => retRank(a) - retRank(b) || b.due.localeCompare(a.due) || S.orgs[a.org].name.localeCompare(S.orgs[b.org].name));
      body = `<div class="card p0"><div class="tbl-tools wrap"><form class="inp-wrap" data-form="retSearch" style="width:240px">${ic('magnifying-glass')}<input class="inp" id="ret-q" placeholder="Search organisations" value="${esc(q)}"></form>
          ${sel('ret-tpl', [['all', 'All returns'], ...active.map(t => [t.id, t.name])], tp, { attrs: 'data-change="retTpl" style="width:auto;max-width:260px" aria-label="Return"' })}${sel('ret-per', [['all', 'All periods'], ...pers.map(p => [p, p])], per, { attrs: 'data-change="retPer" style="width:auto" aria-label="Period"' })}
          <span class="grow"></span>
          ${fk === 'late' && rows.length ? btn(`Remind all (${rows.length})`, { v: 'secondary', size: 'sm', i: 'bell-ringing', act: 'retRemindAll', test: 'ret-remind-all' }) + btn('Escalate', { v: 'tertiary', size: 'sm', i: 'arrow-fat-line-up', act: 'retEscalate' }) : btn('Export', { v: 'tertiary', size: 'sm', i: 'export', act: 'savedToast', arg: 'Export started. You will get an email with the CSV file.' })}</div>
          ${fpills([['', 'All', pool.length, 'rf-all'], ...RET_CARDS.map(([k, l, i, fn]) => [k, l, pool.filter(fn).length, 'rf-' + k, k === 'late' ? 'bad' : k === 'review' ? 'warn' : ''])], fk, 'retF')}
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Organisation</th><th>Return</th><th>Period</th><th>Due</th><th>Status</th><th class="act-col"></th></tr></thead><tbody>${rows.map(f => { const t = tplOf(f.tpl); const o = S.orgs[f.org]; const st = retStatus(f); return `<tr class="click" data-act="open" data-arg="returns/filing:${f.id}" data-test="fil-${f.id}"><td>${orgCell(o, catLabel(o.type, o.tier))}</td><td><div class="strong small">${esc(t.name)}</div><div class="cap mono muted">${esc(t.code)} ${esc(t.version)}</div></td><td class="small">${esc(f.period)}</td><td class="small">${fmtD(f.due)}<div>${dueLine(f)}</div></td><td>${retChip(f)}${f.reminders && !isFiled(f) ? `<div class="cap muted" style="margin-top:2px">${f.reminders} reminder${f.reminders > 1 ? 's' : ''} sent</div>` : ''}</td><td class="act-col">${['Submitted', 'Resubmitted'].includes(f.status) ? btn('Review', { v: 'secondary', size: 'sm', act: 'open', arg: 'returns/filing:' + f.id }) : ['Late', 'Overdue'].includes(st) ? btn('Remind', { v: 'tertiary', size: 'sm', i: 'bell-ringing', act: 'retRemind', arg: f.id, test: 'remind-' + f.id }) : ''}</td></tr>`; }).join('') || `<tr><td colspan="6">${empty('table', 'No filings match', 'Change the filters to see more.')}</td></tr>`}</tbody></table></div><div class="tbl-foot">${rows.length} filing${rows.length === 1 ? '' : 's'}</div></div>`;
    } else if (tab === 'insights') { body = retInsights();
    } else if (tab === 'templates') {
      body = `<div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Return templates</div><div class="cap muted">Each template says what is filed, by whom and how often. Organisations fill it in online or upload the spreadsheet.</div></div>${btn('Upload a template', { v: 'secondary', size: 'sm', i: 'upload-simple', act: 'rtUpload', test: 'rt-upload' })}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Template</th><th>Frequency</th><th>Who files</th><th class="num">Fields</th><th>Built</th><th>Status</th><th class="act-col"></th></tr></thead><tbody>${S.returnTemplates.map(t => `<tr class="click" data-act="open" data-arg="returns/template:${t.id}" data-test="rt-${t.id}"><td><div class="row gap8">${tile('table', '', 'sm')}<div><div class="strong">${esc(t.name)}</div><div class="cap mono muted">${esc(t.code)} ${esc(t.version)} · updated ${esc(t.updated)}</div></div></div></td><td class="small">${esc(t.freq)}</td><td class="small wrap" style="max-width:260px">${esc(t.types.join(', '))}<div class="cap muted">${retOrgs(t).length} organisations</div></td><td class="num tnum">${t.fields.length}</td><td class="small">${t.source === 'Uploaded template' ? `${ic('file-xls')} Uploaded` : 'Online'}</td><td>${statusChip(t.status)}</td><td class="act-col">${btn(t.status === 'Draft' ? 'Continue' : 'Edit', { v: 'tertiary', size: 'sm', act: 'open', arg: 'returns/template:' + t.id })}</td></tr>`).join('')}</tbody></table></div></div>`;
    } else {
      body = `<div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Schedule and reminders</div><div class="cap muted">When each return is due and when filers are reminded. Default grace period: <b>${esc(S.deadlines.returnsGrace)} days</b> (<a href="#settings/deadlines" data-go="settings/deadlines">change</a>).</div></div></div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>Return</th><th>Frequency</th><th>Due</th><th>Grace period</th><th>Reminders</th><th>Next due</th><th class="act-col"></th></tr></thead><tbody>${S.returnTemplates.filter(t => t.status === 'Active').map(t => { const nx = S.filings.filter(f => f.tpl === t.id && f.due >= TODAY).sort((a, b) => a.due.localeCompare(b.due))[0]; return `<tr><td><div class="strong small">${esc(t.name)}</div><div class="cap mono muted">${esc(t.code)}</div></td><td class="small">${esc(t.freq)}</td><td class="small">${dueRule(t)}</td><td class="small">${graceOf(t)} days${t.grace === '' ? ' <span class="cap muted">(default)</span>' : ''}</td><td class="small">${esc(t.reminders)} days before</td><td class="small">${nx ? fmtD(nx.due) + ` <span class="cap muted">(${esc(nx.period)})</span>` : '—'}</td><td class="act-col">${btn('Edit', { v: 'tertiary', size: 'sm', act: 'rtSched', arg: t.id, test: 'sched-' + t.id })}</td></tr>`; }).join('')}</tbody></table></div></div>`;
    }
    return `${pageHead({ title: 'Data returns', sub: 'Periodic figures filed straight to ' + esc(S.tenant.short) + '. No firm involved.', actions: btn('New template', { i: 'plus', act: 'open', arg: 'returns/template:new', test: 'rt-new' }) })}
      ${tabs([{ id: 'filings', label: 'Filings', count: pool.filter(RET_CARDS[1][3]).length || undefined }, { id: 'insights', label: 'Insights', test: 'ret-insights' }, { id: 'templates', label: 'Templates', count: S.returnTemplates.length }, { id: 'schedule', label: 'Schedule' }], tab, 'retTab')}
      ${tab === 'filings' && late.length && !fk ? alertBox('bad', `${late.length} filing${late.length > 1 ? 's are' : ' is'} late`, 'Past the due date and the grace period. Remind them, or escalate to supervision.', btn('Show late filings', { size: 'sm', v: 'secondary', act: 'retF', arg: 'late', test: 'show-late' })) : ''}${body}`;
  }
});
const retRank = f => { const st = retStatus(f); return ['Submitted', 'Resubmitted'].includes(st) ? 0 : st === 'Late' ? 1 : st === 'Overdue' ? 2 : st === 'Queried' ? 3 : !isFiled(f) && daysBetween(TODAY, f.due) <= 7 ? 4 : !isFiled(f) ? 6 : 5; };
const dueRule = t => t.freq === 'Yearly' ? `${t.dueDays} days after year end` : t.freq === 'Monthly' ? `Day ${t.dueDays} of the next month` : `${t.dueDays} days after quarter end`;
ACT.retTab = t => { S.ui.retTab = t; render(); };
ACT.retF = k => { S.ui.retF = k; render(); };
ACT.chg_retTpl = v => { S.ui.retTpl = v; S.ui.retPer = 'all'; render(); };
ACT.chg_retPer = v => { S.ui.retPer = v; render(); };
ACT.form_retSearch = () => { S.ui.retQ = val('ret-q'); render(); };
function remindFiling(f) { f.reminders = (f.reminders || 0) + 1; f.lastReminder = '19 Oct 2026'; f.history.push(['19 Oct 2026', 'Reminder sent', persona().name]); const t = tplOf(f.tpl); notify({ ws: 'organisation', org: f.org, i: 'bell-ringing', tone: 'warn', title: `${S.tenant.short} reminded you: ${t.name} (${f.period}) is ${retStatus(f) === 'Late' ? 'late' : 'due'}`, go: 'org/return', arg: f.id, kind: 'Reminders' }); }
ACT.retRemind = id => { const f = filingOf(id); remindFiling(f); addAudit('Sent return reminder', `${S.orgs[f.org].name} · ${tplOf(f.tpl).code} ${f.period}`); render(); toast(`Reminder sent to ${esc(S.orgs[f.org].name)}`, 'ok', 'bell-ringing'); };
ACT.retRemindAll = () => { const late = S.filings.filter(f => tplOf(f.tpl).status === 'Active' && RET_CARDS[3][3](f)); late.forEach(remindFiling); addAudit('Sent return reminders', `${late.length} late filings`); render(); toast(`Reminders sent to ${late.length} organisation${late.length > 1 ? 's' : ''}`, 'ok', 'bell-ringing'); };
ACT.retEscalate = () => openDialog(`${dlgHead('Escalate late filings', 'Supervision leads are told and the late filings are flagged on each organisation’s profile.', 'arrow-fat-line-up', 'bad')}
  <div class="col gap12" style="margin-top:16px">${field('Escalate to', sel('esc-to', reviewers().map(t => [t.name, t.name + ' · ' + t.role]), reviewers()[0].name), { for: 'esc-to' })}${field('Note', ta('esc-note', 'Late with the Sep 2026 cyber incident return after reminders.', { attrs: 'rows="3"' }), { for: 'esc-note' })}</div>
  <div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Escalate', { act: 'retEscDo', test: 'esc-do' })}</div>`);
ACT.retEscDo = () => { const n = S.filings.filter(f => RET_CARDS[3][3](f)).length; addAudit('Escalated late returns', `${n} filings to ${val('esc-to')}`); closeDialog(); toast(`Escalated to ${esc(val('esc-to') || 'supervision lead')}`, 'ok', 'arrow-fat-line-up'); };
ACT.rtSched = id => { const t = tplOf(id); openDialog(`${dlgHead('Schedule: ' + esc(t.name), 'Changes apply from the next period. Filings already open keep their due date.', 'calendar-blank')}
  <div class="grid g2" style="gap:14px;margin-top:16px">${field('Frequency', sel('sc-freq', ['Monthly', 'Quarterly', 'Yearly'], t.freq), { for: 'sc-freq' })}${field(t.freq === 'Monthly' ? 'Due on day' : 'Due, days after period end', inp('sc-due', t.dueDays, { type: 'number' }), { for: 'sc-due' })}${field('Grace period (days)', inp('sc-grace', t.grace, { type: 'number', ph: S.deadlines.returnsGrace + ' (default)' }), { for: 'sc-grace', hint: 'Leave empty to use the default.' })}${field('Reminders, days before due', inp('sc-rem', t.reminders), { for: 'sc-rem' })}</div>
  <div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Save schedule', { act: 'rtSchedSave', arg: id, test: 'sched-save' })}</div>`); };
ACT.rtSchedSave = id => { const t = tplOf(id); Object.assign(t, { freq: val('sc-freq'), dueDays: +val('sc-due') || t.dueDays, grace: val('sc-grace'), reminders: val('sc-rem') }); addAudit('Changed return schedule', t.name); closeDialog(); render(); toast('Schedule saved'); };
ACT.rtUpload = () => openDialog(`${dlgHead('Upload a return template', 'Upload the spreadsheet organisations already use. SuperAtlas reads the column headings and turns them into fields you can check.', 'upload-simple')}
  <div class="col gap12" style="margin-top:16px"><button class="drop" data-act="rtUpParse" data-test="rt-up-file">${tile('file-xls', 'ok', 'sm')}<b class="small">Choose an Excel or CSV file</b><span class="cap muted">.xlsx or .csv · first row holds the headings</span></button>
  ${note('Example file: <b>agent-network-return.xlsx</b> with 5 headings.')}</div>`);
ACT.rtUpParse = () => { closeDialog(); const F = (key, label, type, o = {}) => Object.assign({ key, label, type, unit: '', req: true, min: '', max: '', lte: '', help: '' }, o); S.ui.rt = { isNew: true, t: { id: 'rt' + (S.returnTemplates.length + 1), code: 'AGN', name: 'Agent network return', freq: 'Quarterly', types: ['Payment solution service provider'], dueDays: 30, grace: '', status: 'Draft', version: 'v0.1', source: 'Uploaded template', file: 'agent-network-return.xlsx', updated: '19 Oct 2026', reminders: '7, 3, 1', desc: 'Read from agent-network-return.xlsx.', fields: [F('agents', 'Active agents', 'number', { min: 0 }), F('newAgents', 'New agents this quarter', 'number', { min: 0 }), F('states', 'States covered', 'number', { min: 0, max: 37 }), F('agentTx', 'Agent transaction value', 'number', { unit: '₦ million', min: 0 }), F('agentCmp', 'Agent-related complaints', 'number', { min: 0 })] }, parsed: true }; go('returns/template'); };

/* ---------- Regulator: template builder ---------- */
function rtInit(id) {
  S.ui.rtView = 'edit';
  if (id && id !== 'new') { const t = tplOf(id); S.ui.rt = { isNew: false, t: clone(t) }; return; }
  S.ui.rt = { isNew: true, t: { id: 'rt' + (S.returnTemplates.length + 1), code: '', name: '', freq: 'Quarterly', types: [], dueDays: 30, grace: '', status: 'Draft', version: 'v0.1', source: 'Built online', updated: '19 Oct 2026', reminders: '7, 3, 1', desc: '', fields: [{ key: 'f1', label: '', type: 'number', unit: '', req: true, min: '0', max: '', lte: '', help: '' }] } };
}
const RT_TYPES = [['number', 'Number'], ['text', 'Text'], ['date', 'Date'], ['yn', 'Yes or no']];
function rtSync() {
  const st = S.ui.rt; if (!st || !$('#rt-name')) return; const t = st.t;
  Object.assign(t, { name: val('rt-name'), code: val('rt-code').toUpperCase(), freq: val('rt-freq'), dueDays: val('rt-due'), desc: val('rt-desc') });
  t.types = typeOpts().filter((n, i) => val('rt-ty-' + i));
  if ($('#rf-0-l')) t.fields.forEach((fd, i) => { Object.assign(fd, { label: val(`rf-${i}-l`), type: val(`rf-${i}-t`), unit: val(`rf-${i}-u`), req: val(`rf-${i}-r`), min: val(`rf-${i}-min`), max: val(`rf-${i}-max`), lte: val(`rf-${i}-lte`) }); if (!fd.key || /^f\d+$/.test(fd.key)) fd.key = 'f' + (i + 1); });
}
function rtPreview(t) {
  return `<div class="col gap12">${t.fields.filter(f => f.label).map(fd => field(esc(fd.label) + (fd.unit ? ` <span class="muted" style="font-weight:400">(${esc(fd.unit)})</span>` : ''), fd.type === 'yn' ? `<div class="seg sm"><button>Yes</button><button>No</button></div>` : fd.type === 'text' ? inp('pv-' + fd.key, '', { ro: true }) : inp('pv-' + fd.key, '', { type: fd.type === 'date' ? 'date' : 'text', ro: true, ph: fd.type === 'number' ? '0' : '' }), { opt: !fd.req, hint: [fd.min !== '' && fd.type === 'number' ? 'Minimum ' + fd.min : '', fd.max !== '' && fd.type === 'number' ? 'maximum ' + fd.max : '', fd.lte ? 'not more than ' + esc((t.fields.find(z => z.key === fd.lte) || {}).label || '').toLowerCase() : ''].filter(Boolean).join(', ') })).join('') || `<p class="cap muted">Add a field to see it here.</p>`}</div>`;
}
screen('returns/template', {
  t: 'Return template', layout: 'app', ws: 'regulator', crumbs: () => [['Data returns', 'returns'], (S.ui.rt && S.ui.rt.t.name) || 'New template'],
  render() {
    if (!S.ui.rt) rtInit('new');
    const st = S.ui.rt; const t = st.t; const errs = st.errs || {}; const pv = ui('rtView', 'edit');
    const live = t.status === 'Active';
    return `<div class="rh"><div class="rh-main"><div class="overline">Data returns · ${st.isNew ? 'new template' : esc(t.code) + ' ' + esc(t.version)}</div><div class="rh-title"><h1 class="h1">${esc(t.name || 'New return template')}</h1>${statusChip(t.status)}</div></div></div>
      ${st.parsed ? alertBox('ok', `Read ${t.fields.length} fields from ${esc(t.file)}`, 'Check each field’s type and rules. Organisations can fill this in online or upload the same spreadsheet.') : ''}${live ? note(`This template is live. Saving creates version ${nextVer(t.version)}; filings already open keep the version they started with.`, 'info') : ''}
      <div class="col gap16" id="rt-form">
        <div class="card col gap16"><div class="h4">Basics</div><div class="grid g2" style="gap:14px">${field('Name', inp('rt-name', t.name, { ph: 'e.g. Agent network return', invalid: errs.name }), { for: 'rt-name', err: errs.name })}${field('Short code', inp('rt-code', t.code, { ph: 'e.g. ANR', invalid: errs.code }), { for: 'rt-code', err: errs.code, hint: 'Used on receipts.' })}${field('Frequency', sel('rt-freq', ['Monthly', 'Quarterly', 'Yearly'], t.freq), { for: 'rt-freq' })}${field(t.freq === 'Monthly' ? 'Due on day of next month' : 'Due, days after period end', inp('rt-due', t.dueDays, { type: 'number' }), { for: 'rt-due' })}</div>
          ${field('Description', ta('rt-desc', t.desc, { attrs: 'rows="2"', ph: 'What this return collects' }), { for: 'rt-desc', opt: true })}
          ${field('Who files', `<div class="grid g3" style="gap:6px 14px">${typeOpts().map((n, i) => ck('rt-ty-' + i, esc(n), t.types.includes(n))).join('')}</div>`, { err: errs.types })}</div>
        <div class="card p0"><div class="tbl-tools"><div class="grow"><div class="h4">Fields</div><div class="cap muted">What the organisation enters. Rules are checked before they can submit.</div></div><div class="seg sm">${[['edit', 'Edit', 'pencil-simple'], ['preview', 'Preview', 'eye']].map(([k, l, i]) => `<button class="${pv === k ? 'on' : ''}" data-act="rtView" data-arg="${k}" data-test="rtv-${k}">${ic(i)} ${l}</button>`).join('')}</div>${pv === 'edit' ? btn('Add field', { v: 'secondary', size: 'sm', i: 'plus', act: 'rtAdd', test: 'rt-add' }) : ''}</div>${pv === 'preview' ? `<div style="padding:20px;max-width:640px" id="rt-prev">${rtPreview(t)}</div>` : `
          <div class="tbl-wrap"><table class="tbl keep rt-tbl"><thead><tr><th>Label</th><th>Type</th><th>Unit</th><th>Min</th><th>Max</th><th>Not more than</th><th>Required</th><th class="act-col"></th></tr></thead><tbody>${t.fields.map((fd, i) => `<tr><td style="min-width:220px">${inp(`rf-${i}-l`, fd.label, { ph: 'Field label', invalid: errs['f' + i], attrs: `data-test="rf-l-${i}"` })}</td><td>${sel(`rf-${i}-t`, RT_TYPES, fd.type, { attrs: 'style="width:120px"' })}</td><td>${inp(`rf-${i}-u`, fd.unit, { ph: '—', attrs: 'style="width:100px"' })}</td><td>${inp(`rf-${i}-min`, fd.min, { attrs: 'style="width:70px"' })}</td><td>${inp(`rf-${i}-max`, fd.max, { attrs: 'style="width:70px"' })}</td><td>${sel(`rf-${i}-lte`, [['', '—'], ...t.fields.filter((z, k) => k !== i && z.type === 'number' && z.label).map(z => [z.key, z.label])], fd.lte, { attrs: 'style="width:170px"' })}</td><td style="text-align:center"><input type="checkbox" id="rf-${i}-r" ${fd.req ? 'checked' : ''} aria-label="Required"></td><td class="act-col">${t.fields.length > 1 ? btnIc('trash', 'rtDel', i, 'Remove field') : ''}</td></tr>`).join('')}</tbody></table></div>`}</div>
        <div class="row end">${btn('Cancel', { v: 'tertiary', go: 'returns' })}${btn('Save draft', { v: 'secondary', act: 'rtSave', arg: 'draft', test: 'rt-draft' })}${btn(live ? 'Publish ' + nextVer(t.version) : 'Publish template', { i: 'paper-plane-tilt', act: 'rtSave', arg: 'publish', test: 'rt-publish' })}</div></div>`;
  },
  mount() { const f = $('#rt-form'); f && f.addEventListener('change', () => rtSync()); }
});
const nextVer = v => { const m = /v(\d+)\.(\d+)/.exec(v || 'v1.0'); return m ? `v${m[1]}.${+m[2] + 1}` : 'v1.1'; };
ACT.rtView = v => { rtSync(); S.ui.rtView = v; render(); };
ACT.rtAdd = () => { rtSync(); S.ui.rtView = 'edit'; const t = S.ui.rt.t; t.fields.push({ key: 'f' + (t.fields.length + 1), label: '', type: 'number', unit: '', req: true, min: '0', max: '', lte: '', help: '' }); render(); const el = $(`#rf-${t.fields.length - 1}-l`); el && el.focus(); };
ACT.rtDel = i => { rtSync(); S.ui.rt.t.fields.splice(+i, 1); render(); };
ACT.rtSave = mode => {
  rtSync(); const st = S.ui.rt; const t = st.t; const errs = {};
  if (!t.name) errs.name = 'Enter a name.'; if (!t.code) errs.code = 'Enter a short code.';
  if (mode === 'publish') { if (!t.types.length) errs.types = 'Choose at least one type of organisation.'; t.fields.forEach((f, i) => { if (!f.label) errs['f' + i] = 1; }); }
  st.errs = errs; if (Object.keys(errs).length) { render(); toast('Check the highlighted fields', 'bad', 'warning'); return; }
  t.dueDays = +t.dueDays || 30; t.updated = '19 Oct 2026';
  if (mode === 'publish') { t.version = t.status === 'Active' ? nextVer(t.version) : 'v1.0'; t.status = 'Active'; }
  const ix = S.returnTemplates.findIndex(x => x.id === t.id);
  if (ix >= 0) S.returnTemplates[ix] = clone(t); else S.returnTemplates.push(clone(t));
  if (mode === 'publish' && !S.filings.some(f => f.tpl === t.id)) { const per = t.freq === 'Monthly' ? ['Nov 2026', '2026-11', '2026-12-' + String(Math.min(28, t.dueDays)).padStart(2, '0')] : t.freq === 'Yearly' ? ['2026', '2026', dPlus('2026-12-31', t.dueDays)] : ['Q4 2026', '2026-Q4', dPlus('2026-12-31', t.dueDays)]; retOrgs(t).forEach((o, i) => S.filings.push({ id: 'rn' + t.id + i, tpl: t.id, period: per[0], pkey: per[1], due: per[2], org: o.id, status: 'Not started', values: {}, history: [], queries: [], reminders: 0, source: 'Online', ver: 1 })); }
  addAudit(mode === 'publish' ? 'Published return template' : 'Saved return template', `${t.name} ${t.version}`);
  S.ui.rt = undefined; S.ui.retTab = 'templates';
  toast(mode === 'publish' ? `${esc(t.name)} published. ${retOrgs(t).length} organisations will file it.` : 'Draft saved', 'ok', mode === 'publish' ? 'paper-plane-tilt' : 'check');
  go('returns');
};

/* ---------- Regulator: review one filing ---------- */
screen('returns/filing', {
  t: 'Filing', layout: 'app', ws: 'regulator', crumbs: () => { const f = filingOf(S.ui.filingId) || S.filings[0]; return [['Data returns', 'returns'], S.orgs[f.org].name + ' · ' + tplOf(f.tpl).code + ' ' + f.period]; },
  render() {
    const f = filingOf(S.ui.filingId) || S.filings[1]; const t = tplOf(f.tpl); const o = S.orgs[f.org]; const pv = prevFiling(f); const filed = isFiled(f); const st = retStatus(f);
    const openQ = f.queries.filter(q => q.status === 'Open');
    const rows = t.fields.map(fd => { const v = f.values[fd.key]; const p = pv ? pv.values[fd.key] : null; const vr = fd.type === 'number' ? variance(v, p) : null; const flag = vr != null && Math.abs(vr) >= VAR_FLAG; const q = f.queries.find(x => x.field === fd.key && x.status === 'Open'); return `<tr class="${q ? 'row-warn' : ''}"><td class="wrap"><div class="small strong">${esc(fd.label)}</div>${fd.unit ? `<div class="cap muted">${esc(fd.unit)}</div>` : ''}</td><td class="num tnum strong">${fd.type === 'number' ? fmtNum(v) : `<span class="small" style="font-weight:400">${esc(v || '—')}</span>`}</td><td class="num tnum muted">${pv && fd.type === 'number' ? fmtNum(p) : '—'}</td><td>${vr == null ? '<span class="cap muted">—</span>' : flag ? chip(`${vr > 0 ? '+' : ''}${vr}%`, 'warn', 'warning') : `<span class="cap tnum muted">${vr > 0 ? '+' : ''}${vr}%</span>`}</td><td class="act-col">${q ? chip('Queried', 'warn', 'chat-circle-dots') : filed && f.status !== 'Accepted' ? btn('Query', { v: 'tertiary', size: 'sm', i: 'chat-circle-dots', act: 'retQuery', arg: fd.key, test: 'q-' + fd.key }) : ''}</td></tr>`; }).join('');
    const nFlag = t.fields.filter(fd => fd.type === 'number' && pv && Math.abs(variance(f.values[fd.key], pv.values[fd.key]) ?? 0) >= VAR_FLAG).length;
    return `<div class="rh">${logo(o, 48)}<div class="rh-main"><div class="overline">${esc(t.name)} · ${esc(f.period)}</div><div class="rh-title"><h1 class="h1">${esc(o.name)}</h1>${retChip(f)}</div><div class="rh-meta">${esc(catLabel(o.type, o.tier))} · due ${fmtD(f.due)}${f.ver > 1 ? ' · version ' + f.ver : ''}</div></div></div>
      <div class="grid side"><div class="col gap16">
        ${!filed ? `<div class="card">${empty('hourglass', 'Not filed yet', `${esc(o.name)} has ${f.status === 'Draft' ? 'started a draft but not submitted' : 'not started this return'}. ${st === 'Late' ? 'It is past the due date and the grace period.' : ''}`, btn('Send a reminder', { v: 'secondary', i: 'bell-ringing', act: 'retRemind', arg: f.id, test: 'remind-one' }))}</div>` : `
        ${nFlag && f.status !== 'Accepted' ? alertBox('warn', `${nFlag} figure${nFlag > 1 ? 's' : ''} changed by ${VAR_FLAG}% or more since ${esc(pv.period)}`, 'Large changes are not always wrong. Query a figure if you want the organisation to confirm or correct it.') : ''}
        <div class="card p0"><div class="tbl-tools"><span class="h4 grow">Figures</span><span class="cap muted">${pv ? 'Compared with ' + esc(pv.period) : 'No earlier period to compare with'}</span></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Field</th><th class="num">${esc(f.period)}</th><th class="num">${pv ? esc(pv.period) : 'Last period'}</th><th>Change</th><th class="act-col"></th></tr></thead><tbody>${rows}</tbody></table></div></div>`}
        ${f.queries.length ? `<div class="card col gap12"><div class="h4">Queries</div>${f.queries.map(q => { const fd = t.fields.find(x => x.key === q.field) || { label: 'Whole return' }; return `<div class="oa"><div class="row"><span class="small strong grow">${esc(fd.label)}</span>${chip(q.status === 'Open' ? 'Waiting for reply' : 'Answered', q.status === 'Open' ? 'warn' : 'ok')}</div><p class="small" style="margin-top:4px">${esc(q.msg)}</p><div class="cap muted">${esc(q.by)} · ${esc(q.when)}</div>${q.reply ? `<div class="reply"><div class="cap muted">${esc(o.name)} replied${q.from ? ` · changed ${fmtNum(q.from)} → ${fmtNum(q.to)}` : ''}</div><p class="small">${esc(q.reply)}</p></div>` : ''}</div>`; }).join('')}</div>` : ''}
        <div class="card col gap12"><div class="h4">History</div><div class="timeline">${[...f.history].reverse().map(([w, a, b]) => `<div class="tl">${tile(/Accept/.test(a) ? 'check-circle' : /Quer/.test(a) ? 'chat-circle-dots' : /Remind/.test(a) ? 'bell-ringing' : 'paper-plane-tilt', /Accept/.test(a) ? 'ok' : /Quer/.test(a) ? 'warn' : '', 'sm')}<div><div class="small strong">${esc(a)}</div><div class="cap muted">${esc(b)} · ${esc(w)}</div></div></div>`).join('') || '<p class="cap muted">Nothing yet.</p>'}</div></div></div>
      <div class="col gap16"><div class="card col gap12"><div class="h4">Decision</div>
        ${['Submitted', 'Resubmitted'].includes(f.status) ? `<p class="small muted">Accept the return, or query a figure. A query sends it back to the organisation to confirm or correct.</p>${btn('Accept return', { block: true, i: 'check-circle', act: 'retAccept', test: 'ret-accept' })}${btn('Query a figure', { v: 'secondary', block: true, i: 'chat-circle-dots', act: 'retQuery', arg: '', test: 'ret-query' })}${btn('Ask to resubmit', { v: 'tertiary', block: true, i: 'arrow-u-up-left', act: 'retResub', test: 'ret-resub' })}`
        : f.status === 'Queried' ? alertBox('warn', `${openQ.length} quer${openQ.length === 1 ? 'y' : 'ies'} open`, `Waiting for ${esc(o.name)} to reply and resubmit.`)
        : f.status === 'Accepted' ? alertBox('ok', 'Accepted', `${esc(f.acceptedBy || '')}${f.acceptedAt ? ' · ' + esc(f.acceptedAt) : ''}`)
        : `${alertBox(st === 'Late' ? 'bad' : 'info', st === 'Late' ? 'Late' : 'Not filed yet', `${f.reminders || 0} reminder${f.reminders === 1 ? '' : 's'} sent${f.lastReminder ? ', last on ' + esc(f.lastReminder) : ''}.`)}${btn('Send a reminder', { block: true, v: 'secondary', i: 'bell-ringing', act: 'retRemind', arg: f.id })}`}</div>
        <div class="card col gap8"><div class="h4">Filing</div>${kv([['Receipt', `<span class="mono small">${esc(f.receipt || '—')}</span>`], ['Filed', esc(f.filedAt || '—')], ['Prepared by', esc(f.filedBy || '—')], ['Approved by', esc(f.approvedBy || '—')], ['How', f.source === 'Upload' ? 'Uploaded template' : 'Filled in online'], ['Template', esc(t.code + ' ' + t.version)], ['Due', fmtD(f.due) + (f.lateBy ? ` <span class="cap" style="color:var(--warn-fg)">(${f.lateBy} days late)</span>` : '')]])}</div>
        <div class="card col gap8"><div class="h4">Other periods</div>${S.filings.filter(x => x.tpl === f.tpl && x.org === f.org && x.id !== f.id).sort((a, b) => b.pkey.localeCompare(a.pkey)).map(x => `<button class="list-row" style="padding:8px 0;border-top:0;min-height:0" data-act="open" data-arg="returns/filing:${x.id}"><span class="grow small">${esc(x.period)}</span>${retChip(x)}</button>`).join('') || '<p class="cap muted">None.</p>'}</div></div></div>`;
  }
});
ACT.retAccept = () => { const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); f.status = 'Accepted'; f.acceptedBy = persona().name; f.acceptedAt = '19 Oct 2026'; f.history.push(['19 Oct 2026', 'Accepted', persona().name]); notify({ ws: 'organisation', org: f.org, i: 'check-circle', tone: 'ok', title: `${S.tenant.short} accepted your ${t.name} (${f.period})`, go: 'org/return', arg: f.id, kind: 'Updates' }); addAudit('Accepted return', `${S.orgs[f.org].name} · ${t.code} ${f.period}`); render(); toast('Return accepted. The organisation has been told.', 'ok', 'check-circle'); };
ACT.retQuery = key => { const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); const pv = prevFiling(f); const fd = t.fields.find(x => x.key === key) || t.fields.find(x => x.type === 'number' && pv && Math.abs(variance(f.values[x.key], pv.values[x.key]) ?? 0) >= VAR_FLAG) || t.fields[0];
  const sug = pv && fd.type === 'number' ? `${fd.label} is ${fmtNum(f.values[fd.key])}${fd.unit ? ' ' + fd.unit : ''}, against ${fmtNum(pv.values[fd.key])} in ${pv.period}. Please confirm the figure, or correct it, and tell us what changed.` : '';
  openDialog(`${dlgHead('Query a figure', `${esc(S.orgs[f.org].name)} is asked to confirm or correct it, then resubmit.`, 'chat-circle-dots', 'warn')}
  <div class="col gap12" style="margin-top:16px">${field('Figure', sel('rq-field', t.fields.map(x => [x.key, x.label]), fd.key), { for: 'rq-field' })}${field('Question', ta('rq-msg', sug, { attrs: 'rows="4" data-test="rq-msg"', ph: 'What do you want them to check?' }), { for: 'rq-msg' })}${field('Reply by', inp('rq-by', dPlus(TODAY, 5), { type: 'date' }), { for: 'rq-by' })}</div>
  <div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Send query', { act: 'retQueryDo', test: 'rq-send' })}</div>`); };
ACT.retQueryDo = () => { const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); const key = val('rq-field'); const msg = val('rq-msg'); if (!msg) { toast('Write the question', 'bad', 'warning'); return; } const fd = t.fields.find(x => x.key === key);
  f.queries.push({ field: key, msg, by: persona().name, when: '19 Oct 2026', status: 'Open', replyBy: val('rq-by') }); f.status = 'Queried'; f.history.push(['19 Oct 2026', 'Queried: ' + fd.label.toLowerCase(), persona().name]);
  notify({ ws: 'organisation', org: f.org, i: 'chat-circle-dots', tone: 'warn', title: `${S.tenant.short} queried “${fd.label}” in your ${t.name} (${f.period})`, go: 'org/return', arg: f.id, kind: 'Approvals' });
  addAudit('Queried return figure', `${S.orgs[f.org].name} · ${t.code} ${f.period} · ${fd.label}`); closeDialog(); render(); toast('Query sent', 'ok', 'chat-circle-dots'); };
ACT.retResub = () => openDialog(`${dlgHead('Ask to resubmit', 'Use this when the whole return needs redoing, for example the wrong period was filed.', 'arrow-u-up-left', 'warn')}<div class="col gap12" style="margin-top:16px">${field('Reason', ta('rs-msg', '', { attrs: 'rows="3"', ph: 'Tell them what is wrong' }), { for: 'rs-msg' })}</div><div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn('Send back', { act: 'retResubDo' })}</div>`);
ACT.retResubDo = () => { const f = filingOf(S.ui.filingId); const msg = val('rs-msg') || 'Please resubmit the return.'; f.queries.push({ field: '', msg, by: persona().name, when: '19 Oct 2026', status: 'Open' }); f.status = 'Queried'; f.history.push(['19 Oct 2026', 'Asked to resubmit', persona().name]); notify({ ws: 'organisation', org: f.org, i: 'arrow-u-up-left', tone: 'warn', title: `${S.tenant.short} asked you to resubmit ${tplOf(f.tpl).name} (${f.period})`, go: 'org/return', arg: f.id, kind: 'Approvals' }); closeDialog(); render(); toast('Sent back to the organisation'); };

/* ---------- Organisation: returns list ---------- */
const myFilings = () => S.filings.filter(f => f.org === S.orgId && tplOf(f.tpl).status === 'Active');
const ORG_RC = [['due', 'Due soon', 'clock', f => !isFiled(f) && daysBetween(TODAY, f.due) >= 0 && daysBetween(TODAY, f.due) <= 31], ['late', 'Overdue', 'warning', f => !isFiled(f) && daysBetween(TODAY, f.due) < 0], ['queried', 'Queried', 'chat-circle-dots', f => f.status === 'Queried'], ['filed', 'Filed', 'check-circle', f => ['Submitted', 'Resubmitted', 'Accepted'].includes(f.status)]];
screen('org/returns', {
  t: 'Data returns', layout: 'app', ws: 'organisation', crumbs: ['Data returns'],
  render() {
    const fk = ui('oRetF', ''); const all = myFilings();
    const rows = all.filter(f => !fk || ORG_RC.find(c => c[0] === fk)[3](f)).sort((a, b) => (isFiled(a) - isFiled(b)) || (a.status === 'Queried' ? -1 : b.status === 'Queried' ? 1 : 0) || a.due.localeCompare(b.due));
    const todo = rows.filter(f => !isFiled(f) || f.status === 'Queried'); const done = rows.filter(f => isFiled(f) && f.status !== 'Queried');
    const row = f => { const t = tplOf(f.tpl); const act = f.status === 'Queried' ? btn('Respond', { size: 'sm', act: 'open', arg: 'org/return:' + f.id, test: 'oret-' + f.id }) : isFiled(f) ? btn('View', { v: 'tertiary', size: 'sm', act: 'open', arg: 'org/return:' + f.id, test: 'oret-' + f.id }) : btn(f.status === 'Draft' ? 'Continue' : 'Start', { v: daysBetween(TODAY, f.due) <= 7 ? 'primary' : 'secondary', size: 'sm', act: 'open', arg: 'org/return:' + f.id, test: 'oret-' + f.id }); return `<tr class="click" data-act="open" data-arg="org/return:${f.id}"><td><div class="row gap8">${tile('table', f.status === 'Queried' ? 'warn' : '', 'sm')}<div><div class="strong">${esc(t.name)}</div><div class="cap muted">${esc(t.freq)} · ${esc(t.code)}</div></div></div></td><td class="small">${esc(f.period)}</td><td class="small">${fmtD(f.due)}<div>${dueLine(f)}</div></td><td>${retChip(f)}</td><td class="act-col">${act}</td></tr>`; };
    const pl = fpills([['', 'All', all.length, 'orc-all'], ...ORG_RC.map(([k, l, i, fn]) => [k, l, all.filter(fn).length, 'orc-' + k, k === 'late' ? 'bad' : k === 'queried' ? 'warn' : ''])], fk, 'oRetF');
    let first = true;
    const tbl = (rs, h) => { const top = first ? pl : ''; first = false; return `<div class="card p0">${top}<div class="tbl-tools"><span class="h4 grow">${h}</span>${count(rs.length)}</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Return</th><th>Period</th><th>Due</th><th>Status</th><th class="act-col"></th></tr></thead><tbody>${rs.map(row).join('') || `<tr><td colspan="5">${empty('check-circle', 'Nothing here', 'You are up to date.')}</td></tr>`}</tbody></table></div></div>`; };
    return `${pageHead({ title: 'Data returns', sub: `Periodic figures you file straight to ${esc(S.tenant.short)}. Fill them in online or upload the template.` })}
      ${fk ? tbl(rows, ORG_RC.find(c => c[0] === fk)[1]) : tbl(todo, 'To do') + tbl(done, 'Filed')}`;
  }
});
ACT.oRetF = k => { S.ui.oRetF = k; render(); };

/* ---------- Organisation: fill in, upload, sign off, respond to a query ---------- */
const UPLOAD_SAMPLE = { rt1: { customers: 10450000, digital: 8790000, txValue: 3310000, failRate: 0.7, fraudN: 380, fraudLoss: 212.4, cmpRecv: 40200, cmpRes: 41900, officer: 'C. Obi' }, rt2: { incidents: 12, major: 0, in24: 0, downtime: 0.5, summary: '' }, rt3: { activities: 40, dsar: 90, dsarMet: 88, breaches: 0, dpo: 'Data protection officer' } };
function retDraft(f) { if (!S.ui.retDraft || S.ui.retDraft.id !== f.id) S.ui.retDraft = { id: f.id, v: clone(f.values || {}), touched: false, file: null }; return S.ui.retDraft; }
function retSync() { const f = filingOf(S.ui.filingId); const d = retDraft(f); tplOf(f.tpl).fields.forEach(fd => { const el = document.getElementById('rv-' + fd.key); if (el) d.v[fd.key] = el.type === 'number' && el.value !== '' ? +el.value : el.value.trim(); }); }
screen('org/return', {
  t: 'Return', layout: 'app', ws: 'organisation', crumbs: () => { const f = filingOf(S.ui.filingId) || S.filings[0]; return [['Data returns', 'org/returns'], tplOf(f.tpl).name + ' · ' + f.period]; },
  render() {
    const f = filingOf(S.ui.filingId) || myFilings()[0]; if (!f) return empty('table', 'No returns', ''); S.ui.filingId = f.id;
    const t = tplOf(f.tpl); const pv = prevFiling(f); const editable = !isFiled(f) || f.status === 'Queried';
    const openQ = f.queries.filter(q => q.status === 'Open');
    const head = `<div class="rh"><div class="rh-main"><div class="overline">${esc(t.code)} ${esc(t.version)} · ${esc(t.freq)}</div><div class="rh-title"><h1 class="h1">${esc(t.name)} · ${esc(f.period)}</h1>${retChip(f)}</div><div class="rh-meta">Due ${fmtD(f.due)} · ${dueLine(f)}</div></div></div>`;
    if (!editable) {
      return `${head}${S.ui.justFiled === f.id ? alertBox('ok', `Filed. Receipt ${esc(f.receipt)}`, `${esc(S.tenant.short)} has your return and will review it. You will be told if they have questions.`, btn('Download filed copy', { size: 'sm', v: 'secondary', i: 'download-simple', act: 'savedToast', arg: 'Filed copy downloaded (PDF)' }), 'seal-check') : ''}
        <div class="grid side"><div class="col gap16"><div class="card p0"><div class="tbl-tools"><span class="h4 grow">What you filed</span>${f.ver > 1 ? chip('Version ' + f.ver, 'info') : ''}</div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Field</th><th class="num">${esc(f.period)}</th><th class="num">${pv ? esc(pv.period) : ''}</th></tr></thead><tbody>${t.fields.map(fd => `<tr><td class="wrap small">${esc(fd.label)}${fd.unit ? ` <span class="cap muted">(${esc(fd.unit)})</span>` : ''}</td><td class="num tnum strong">${fd.type === 'number' ? fmtNum(f.values[fd.key]) : `<span class="small" style="font-weight:400">${esc(f.values[fd.key] || '—')}</span>`}</td><td class="num tnum muted">${pv && fd.type === 'number' ? fmtNum(pv.values[fd.key]) : ''}</td></tr>`).join('')}</tbody></table></div></div>
          ${f.queries.length ? `<div class="card col gap12"><div class="h4">Queries from ${esc(S.tenant.short)}</div>${f.queries.map(q => `<div class="oa"><div class="small strong">${esc((t.fields.find(x => x.key === q.field) || { label: 'Whole return' }).label)}</div><p class="small">${esc(q.msg)}</p>${q.reply ? `<div class="reply"><div class="cap muted">Your reply</div><p class="small">${esc(q.reply)}</p></div>` : ''}</div>`).join('')}</div>` : ''}</div>
        <div class="col gap16"><div class="card col gap8"><div class="h4">Receipt</div>${kv([['Receipt', `<span class="mono small" data-test="ret-receipt">${esc(f.receipt)}</span>`], ['Filed', esc(f.filedAt)], ['Prepared by', esc(f.filedBy)], ['Approved by', esc(f.approvedBy)], ['Status', retChip(f)]])}${btn('Download filed copy', { v: 'secondary', block: true, i: 'download-simple', act: 'savedToast', arg: 'Filed copy downloaded (PDF)' })}</div>
          <div class="card col gap12"><div class="h4">History</div><div class="timeline">${[...f.history].reverse().map(([w, a, b]) => `<div class="tl">${tile(/Accept/.test(a) ? 'check-circle' : /Quer/.test(a) ? 'chat-circle-dots' : 'paper-plane-tilt', /Accept/.test(a) ? 'ok' : '', 'sm')}<div><div class="small strong">${esc(a)}</div><div class="cap muted">${esc(b)} · ${esc(w)}</div></div></div>`).join('')}</div></div></div></div>`;
    }
    const d = retDraft(f); const mode = ui('retMode', 'online'); const errs = d.touched ? retErrors(t, d.v) : {}; const nErr = Object.keys(errs).length;
    const qByField = {}; openQ.forEach(q => { qByField[q.field] = q; });
    const fieldHtml = fd => { const v = d.v[fd.key]; const p = pv ? pv.values[fd.key] : null; const vr = fd.type === 'number' ? variance(v, p) : null; const q = qByField[fd.key];
      const hint = [fd.help ? esc(fd.help) : '', pv && fd.type === 'number' && p != null ? `${esc(pv.period)}: ${fmtNum(p)}${vr != null && Math.abs(vr) >= VAR_FLAG ? ` · <span style="color:var(--warn-fg)">${vr > 0 ? '+' : ''}${vr}%, add a note if this is right</span>` : ''}` : ''].filter(Boolean).join(' · ');
      return `<div class="ret-f ${q ? 'q' : ''}">${q ? `<div class="cap" style="color:var(--warn-fg);margin-bottom:4px">${ic('chat-circle-dots')} ${esc(S.tenant.short)} asked: ${esc(q.msg)}</div>` : ''}${field(esc(fd.label) + (fd.unit ? ` <span class="muted" style="font-weight:400">(${esc(fd.unit)})</span>` : ''), fd.type === 'text' ? inp('rv-' + fd.key, v ?? '', { invalid: errs[fd.key] }) : inp('rv-' + fd.key, v ?? '', { type: fd.type === 'date' ? 'date' : 'number', invalid: errs[fd.key], attrs: `step="any" inputmode="decimal" data-test="rv-${fd.key}"` }), { for: 'rv-' + fd.key, opt: !fd.req, err: errs[fd.key], hint })}</div>`; };
    return `${head}
      ${openQ.length ? alertBox('warn', `${esc(S.tenant.short)} has ${openQ.length} quer${openQ.length > 1 ? 'ies' : 'y'} on this return`, 'Correct the figure or confirm it, explain in your reply, then resubmit. Your first filing is kept in the history.', '', 'chat-circle-dots') : ''}
      <div class="grid side"><div class="col gap16">
        <div class="row"><div class="seg" role="tablist" aria-label="How to file">${[['online', 'Fill in online', 'pencil-simple'], ['upload', 'Upload template', 'upload-simple']].map(([k, l, i]) => `<button class="${mode === k ? 'on' : ''}" data-act="retMode" data-arg="${k}" data-test="rm-${k}">${ic(i)} ${l}</button>`).join('')}</div><span class="grow"></span>${d.file ? chip(d.file, 'neu', 'file-xls') : ''}</div>
        ${mode === 'upload' ? `<div class="card col gap12"><div class="h4">Upload the filled-in template</div><p class="small muted">Download the template, fill it in, then upload it. We read the figures and check them before you submit.</p><div class="row">${btn('Download template (.xlsx)', { v: 'secondary', size: 'sm', i: 'download-simple', act: 'savedToast', arg: 'Template downloaded' })}</div><button class="drop" data-act="retUpload" data-test="ret-upload">${tile('file-xls', 'ok', 'sm')}<b class="small">Choose your file</b><span class="cap muted">.xlsx or .csv · up to 10 MB</span></button></div>`
        : `<div class="card col gap16" id="ret-form"><div id="ret-sum"${nErr ? '' : ' hidden'}>${retSummary(t, errs)}</div><div class="grid g2" style="gap:16px 18px">${t.fields.map(fd => fd.type === 'text' ? `<div style="grid-column:1/-1">${fieldHtml(fd)}</div>` : fieldHtml(fd)).join('')}</div>
          ${openQ.length ? field('Your reply to ' + esc(S.tenant.short), ta('rv-reply', d.reply || '', { attrs: 'rows="3" data-test="rv-reply"', ph: 'Explain the change, or why the figure is right' }), { for: 'rv-reply' }) : ''}</div>`}
        <div class="row end">${btn('Save draft', { v: 'secondary', act: 'retSaveDraft', test: 'ret-draft' })}${btn(f.status === 'Queried' ? 'Resubmit' : 'Check and submit', { i: 'paper-plane-tilt', act: 'retSubmit', test: 'ret-submit' })}</div></div>
      <div class="col gap16"><div class="card col gap8"><div class="h4">About this return</div><p class="small muted">${esc(t.desc)}</p>${kv([['Period', esc(f.period)], ['Due', fmtD(f.due)], ['Grace period', graceOf(t) + ' days'], ['Template', esc(t.code + ' ' + t.version)]])}</div>
        <div class="card col gap8"><div class="h4">Before you submit</div><p class="small muted">Someone must approve the return. You can approve it yourself if you are allowed to sign for ${esc(myOrg().name)}.</p><p class="small muted">After you submit you get a receipt. You can’t change a filed return unless ${esc(S.tenant.short)} queries it.</p></div></div></div>`;
  },
  mount() { const f = $('#ret-form'); f && f.addEventListener('change', e => { if (e.target.id === 'rv-reply') { retDraft(filingOf(S.ui.filingId)).reply = e.target.value; return; } retSync(); if (retDraft(filingOf(S.ui.filingId)).touched) retPaint(); }); }
});
function retSummary(t, errs) { const n = Object.keys(errs).length; return n ? alertBox('bad', `${n} problem${n > 1 ? 's' : ''} to fix before you submit`, Object.entries(errs).map(([k, m]) => `<a href="#" data-act="retFocus" data-arg="${k}">${esc(t.fields.find(x => x.key === k).label)}</a>: ${esc(m)}`).join('<br>')) : ''; }
/* update errors in place, so a click that caused the change (e.g. on Submit) still lands */
function retPaint() { const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); const errs = retErrors(t, retDraft(f).v);
  t.fields.forEach(fd => { const el = document.getElementById('rv-' + fd.key); if (!el) return; const box = el.closest('.field'); el.classList.toggle('invalid', !!errs[fd.key]); const old = box.querySelector('.err'); old && old.remove(); const h = box.querySelector('.hint'); if (h) h.hidden = !!errs[fd.key]; if (errs[fd.key]) el.insertAdjacentHTML('afterend', `<div class="err">${ic('warning-circle')}${esc(errs[fd.key])}</div>`); });
  const sm = $('#ret-sum'); if (sm) { sm.innerHTML = retSummary(t, errs); sm.hidden = !Object.keys(errs).length; } }
ACT.retMode = m => { if ($('#ret-form')) retSync(); S.ui.retMode = m; render(); };
ACT.retFocus = k => { const el = document.getElementById('rv-' + k); el && (el.focus(), el.scrollIntoView({ block: 'center' })); };
ACT.retUpload = () => { const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); const d = retDraft(f); d.v = Object.assign({}, UPLOAD_SAMPLE[t.id] || {}); d.touched = true; d.file = `${t.code.toLowerCase()}-${periodCode(f).toLowerCase()}.xlsx`; d.fromUpload = true; S.ui.retMode = 'online'; render(); const n = Object.keys(retErrors(t, d.v)).length; toast(n ? `Read ${t.fields.length} figures from your file. ${n} needs fixing.` : `Read ${t.fields.length} figures from your file`, n ? 'warn' : 'ok', 'file-xls'); };
ACT.retSaveDraft = () => { const f = filingOf(S.ui.filingId); retSync(); const d = retDraft(f); if (f.status === 'Not started') f.status = 'Draft'; f.values = clone(d.v); f.history.push(['19 Oct 2026', 'Draft saved', persona().name]); render(); toast('Draft saved'); };
ACT.retSubmit = () => {
  const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); if ($('#ret-form')) retSync(); const d = retDraft(f); d.touched = true; if ($('#rv-reply')) d.reply = val('rv-reply');
  const errs = retErrors(t, d.v); if (Object.keys(errs).length) { S.ui.retMode = 'online'; render(); toast('Fix the problems first', 'bad', 'warning'); return; }
  if (f.status === 'Queried' && !d.reply) { render(); toast('Add a reply to the query', 'bad', 'warning'); const el = $('#rv-reply'); el && el.focus(); return; }
  const me = persona().name; const people = orgPeople(myOrg());
  openDialog(`${dlgHead(f.status === 'Queried' ? 'Resubmit return' : 'Sign off and submit', `${esc(t.name)} · ${esc(f.period)} to ${esc(S.tenant.short)}`, 'seal-check')}
    <div class="col gap12" style="margin-top:16px">${field('Prepared by', inp('so-prep', me, { ro: true }), { for: 'so-prep' })}${field('Approved by', sel('so-appr', people.map(n => [n, n === me ? n + ' (you)' : n]), me), { for: 'so-appr', hint: 'The person who confirms the figures are right.' })}
    ${ck('so-decl', `I confirm these figures are complete and correct to the best of my knowledge, and that ${esc(myOrg().name)} has approved them for filing.`, false, { attrs: 'data-test="so-decl"' })}</div>
    <div class="row end" style="margin-top:20px">${btn('Cancel', { v: 'tertiary', act: 'closeDialog' })}${btn(f.status === 'Queried' ? 'Resubmit' : 'Submit return', { i: 'paper-plane-tilt', act: 'retFile', test: 'so-submit' })}</div>`);
};
ACT.retFile = () => {
  if (!val('so-decl')) { toast('Tick the declaration to submit', 'bad', 'warning'); return; }
  const f = filingOf(S.ui.filingId); const t = tplOf(f.tpl); const d = retDraft(f); const me = persona().name; const re = f.status === 'Queried';
  if (re) { f.queries.filter(q => q.status === 'Open').forEach(q => { q.status = 'Answered'; q.reply = d.reply; if (q.field && f.values[q.field] !== d.v[q.field]) { q.from = f.values[q.field]; q.to = d.v[q.field]; } }); f.ver = (f.ver || 1) + 1; }
  f.values = clone(d.v); f.status = re ? 'Resubmitted' : 'Submitted'; f.filedAt = '19 Oct 2026, ' + (re ? '16:05' : '11:42'); f.filedBy = me; f.approvedBy = val('so-appr'); f.source = d.fromUpload ? 'Upload' : 'Online';
  const late = daysBetween(f.due, TODAY); if (late > 0) f.lateBy = late;
  f.receipt = `RET-${t.code}-${periodCode(f)}-${myOrg().ini}-${String(4100 + S.filings.indexOf(f)).padStart(4, '0')}${f.ver > 1 ? '-v' + f.ver : ''}`;
  f.history.push(['19 Oct 2026', re ? `Resubmitted (version ${f.ver})` : 'Submitted', me]);
  notify({ ws: 'regulator', i: 'table', tone: 'info', title: `${myOrg().name} ${re ? 'resubmitted' : 'filed'} ${t.name} (${f.period})`, go: 'returns/filing', arg: f.id, kind: 'Approvals' });
  addAudit(re ? 'Resubmitted return' : 'Filed return', `${t.code} ${f.period} · ${f.receipt}`);
  S.ui.retDraft = undefined; S.ui.justFiled = f.id; closeDialog(); render(); window.scrollTo(0, 0); toast(`${re ? 'Resubmitted' : 'Filed'}. Receipt ${esc(f.receipt)}`, 'ok', 'seal-check');
};

/* ---------- dashboard cards ---------- */
function returnsCard() {
  const fs = myFilings().filter(f => !isFiled(f) || f.status === 'Queried').sort((a, b) => (b.status === 'Queried') - (a.status === 'Queried') || a.due.localeCompare(b.due)).slice(0, 3);
  return `<div class="card p0"><div class="tbl-tools"><span class="h4 grow">Data returns</span><a href="#org/returns" data-go="org/returns" class="small strong">View all</a></div>${fs.length ? `<div class="list">${fs.map(f => `<button class="list-row" data-act="open" data-arg="org/return:${f.id}" data-test="dret-${f.id}">${tile('table', f.status === 'Queried' ? 'warn' : '', 'sm')}<span class="grow" style="min-width:0"><span class="strong ell" style="display:block">${esc(tplOf(f.tpl).name)}</span><span class="cap muted">${esc(f.period)} · ${dueLine(f)}</span></span>${retChip(f)}</button>`).join('')}</div>` : `<div style="padding:12px 20px 20px">${empty('check-circle', 'All returns filed', 'New periods appear here when they open.')}</div>`}</div>`;
}
