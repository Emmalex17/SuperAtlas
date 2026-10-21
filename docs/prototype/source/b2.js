/* ================= B2 · Answering (organisation) ================= */
const PREV = { 'ISR-1.1#0': ['Yes', 'Policy v4.1 approved by the board on 12 Sep 2025.', 'ISR self-assessment 2025 (imported)'], 'ISR-4.1#0': ['No', 'MFA covered administrators only; remote users were planned for 2026.', 'ISR self-assessment 2025 (imported)'], 'ISR-7.1#0': ['Yes', 'Plan in place; tested in November 2025.', 'ISR self-assessment 2025 (imported)'] };
function orgPeople(o) { return [...(o.officers || []).map(p => p.name), ...(o.colleagues || []).filter(c => (c.status || 'Active') === 'Active').map(c => c.name || c.email)]; }
const curCase = () => caseOf(S.ui.caseId) || S.cases.find(c => c.org === S.orgId && c.stage === 'Answering') || S.cases[0];
function answerComplete(q, a) {
  if (!a) return false;
  if (q.choice && !a.v) return false;
  const neg = q.choice === 'yn' && (a.v === 'No' || a.v === 'Not applicable');
  if (neg && !(a.comment || '').trim()) return false;
  if (q.comment && !q.choice && !(a.comment || '').trim()) return false;
  if (q.evidence && !neg && !((a.files || []).length || a.link)) return false;
  return true;
}
const readOnlyCase = c => isSubmitted(c);
ACT.openCase = (id) => { S.ui.caseId = id; S.ui.qIdx = 0; const c = caseOf(id); const qs = caseQs(c); const k = qs.findIndex(q => !answerComplete(q, c.answers[q.id])); S.ui.qIdx = k < 0 ? 0 : k; go('org/answer'); };

/* AI help: explain the question, rephrase the organisation's own words. Never an answer. */
function aiExplain(q, req) {
  const ev = (req.evidence || []).join('; ');
  return `<p><b>What this asks:</b> ${esc(S.tenant.short)} wants to know whether “${esc(req.t)}” is in place and working. ${q.choice === 'yn' ? 'Answer Yes only if it is fully in place today. If it is partly in place, answer No and explain what is missing and when it will be done.' : 'Give a short, specific answer.'}</p>${ev ? `<p><b>Evidence that usually works:</b> ${esc(ev)}.</p>` : ''}${req.guidance ? `<p><b>${esc(S.tenant.short)} guidance:</b> ${esc(req.guidance)}</p>` : ''}`;
}
function aiRephrase(t) {
  let s = t.trim().replace(/\s+/g, ' ');
  const map = [[/\bdont\b/gi, 'do not'], [/\bdon't\b/gi, 'do not'], [/\bwe've\b/gi, 'we have'], [/\bit's\b/gi, 'it is'], [/\bcant\b|\bcan't\b/gi, 'cannot'], [/\bmgt\b/gi, 'management'], [/\bQ([1-4]) (\d{2})\b/g, 'Q$1 20$2'], [/\bpls\b/gi, 'please'], [/\bbcos\b|\bbcoz\b/gi, 'because'], [/ ,/g, ',']];
  map.forEach(([a, b]) => { s = s.replace(a, b); });
  s = s.charAt(0).toUpperCase() + s.slice(1);
  if (!/^(we|our|the|this|it)\b/i.test(s)) s = 'We confirm that ' + s.charAt(0).toLowerCase() + s.slice(1);
  if (!/[.!?]$/.test(s)) s += '.';
  return s;
}

screen('org/answer', {
  t: 'Answer', layout: 'app', ws: 'organisation', crumbs: () => [['Obligations', 'org/obligations'], progOf(curCase().prog).name],
  render() {
    const c = curCase(); const p = progOf(c.prog); const o = S.orgs[c.org]; const qs = caseQs(c); const ro = readOnlyCase(c);
    const reqs = qsetReqs(p.qset); const secs = p.qset.sections.filter(s => s.on);
    const flt = ui('ansF', 'All'); const me = persona().name;
    let idx = Math.min(ui('qIdx', 0), qs.length - 1); const q = qs[idx]; const req = reqs.find(r => r.ref === q.ref); const a = c.answers[q.id] || {};
    const done = qs.filter(x => answerComplete(x, c.answers[x.id])).length; const pct = Math.round(done / qs.length * 100);
    const assignee = x => c.answers[x.id] && c.answers[x.id].assignee || c.assign[x.sec] || '';
    const shown = x => flt === 'All' || (flt === 'Unanswered' ? !answerComplete(x, c.answers[x.id]) : flt === 'Mine' ? assignee(x) === me : flt === 'Flagged' ? (c.answers[x.id] || {}).flag : true);
    const open = ui('ansOpen', () => ({ [q.sec]: true }));
    const people = orgPeople(o);
    const nav = `<aside class="ans-nav"><div class="ans-prog"><div class="row between"><b class="small">${esc(regOfProg(p).ref)} ${esc(p.ver)}</b><span class="chip brand">${secs.length} sections</span></div><div class="pbar" style="margin-top:8px"><div class="bar"><i style="width:${pct}%"></i></div><span class="cap tnum">${pct}%</span></div><div class="cap muted">${done} of ${qs.length} answered</div></div>
      <div class="seg sm ans-flt">${['All', 'Unanswered', 'Mine', 'Flagged'].map(f => `<button class="${flt === f ? 'on' : ''}" data-act="ansF" data-arg="${f}">${f}</button>`).join('')}</div>
      <div class="ans-secs">${secs.map(s => { const sq = qs.filter(x => x.sec === s.id); const sd = sq.filter(x => answerComplete(x, c.answers[x.id])).length; const vis = sq.filter(shown); if (!vis.length && flt !== 'All') return ''; return `<div class="ans-sec"><button class="ans-sh" data-act="ansSec" data-arg="${s.id}">${ic(open[s.id] ? 'caret-down' : 'caret-right')}<span class="grow">${esc(s.name)}</span><span class="cap tnum ${sd === sq.length ? 'ok-t' : 'muted'}">${sd}/${sq.length}</span>${c.assign[s.id] ? `<span class="av s20" title="Section assigned to ${esc(c.assign[s.id])}">${esc(initials(c.assign[s.id]))}</span>` : ''}</button>
        ${open[s.id] ? vis.map(x => { const k = qs.indexOf(x); const ok = answerComplete(x, c.answers[x.id]); const as_ = assignee(x); return `<button class="ans-q ${k === idx ? 'on' : ''}" data-act="ansGo" data-arg="${k}" data-test="aq-${k}"><span class="ans-dot ${ok ? 'ok' : (c.answers[x.id] ? 'part' : '')}"></span><span class="grow ell">${k + 1}. ${esc(x.q)}</span>${(c.answers[x.id] || {}).flag ? ic('flag') : ''}${as_ ? `<span class="av s20" title="${esc(as_)}">${esc(initials(as_))}</span>` : ''}</button>`; }).join('') : ''}</div>`; }).join('')}</div>
      ${ro ? '' : btn('Review and submit', { block: true, go: 'org/submit', test: 'go-submit', v: pct === 100 ? 'primary' : 'secondary' })}</aside>`;
    const choice = !q.choice ? '' : q.choice === 'yn' ? `<div class="field"><label>Your answer</label><div class="yn">${['Yes', 'No', 'Not applicable'].map(v => `<label class="yn-o ${a.v === v ? 'on' : ''}" data-test="yn-${v.split(' ')[0]}"><input type="radio" name="an-v" value="${v}" ${a.v === v ? 'checked' : ''} ${ro ? 'disabled' : ''} data-act="anPick"><span class="radio"></span>${v}</label>`).join('')}</div></div>`
      : field('Your answer', q.choice === 'text' ? ta('an-v', a.v || '', { attrs: `rows="2" ${ro ? 'readonly' : ''}` }) : inp('an-v', a.v || '', { type: q.choice === 'number' ? 'number' : 'date', attrs: ro ? 'readonly' : '' }), { for: 'an-v' });
    const neg = q.choice === 'yn' && (a.v === 'No' || a.v === 'Not applicable');
    const comment = q.comment || neg ? `<div class="field"><div class="row between"><label for="an-c">${neg ? (a.v === 'No' ? 'What is missing, and when will it be fixed?' : 'Why does this not apply?') : 'Explain your answer'}${neg ? '' : ' <span class="muted" style="font-weight:400">(optional)</span>'}</label>${ro ? '' : btn('Rephrase with AI', { v: 'tertiary', size: 'sm', i: 'sparkle', act: 'anRephrase', test: 'an-rephrase' })}</div>${ta('an-c', a.comment || '', { attrs: `rows="3" ${ro ? 'readonly' : ''}`, ph: 'Write in your own words. AI can tidy the wording, not the facts.' })}<div id="rephrase-box"></div></div>` : '';
    const ev = q.evidence ? `<div class="field"><label>Attach the proof ${neg ? '<span class="muted" style="font-weight:400">(optional for this answer)</span>' : ''}</label><div class="ev-box">${(a.files || []).map((f, i) => `<div class="file">${tile('file-text', 'ok', 'sm')}<div class="grow"><div class="strong small">${esc(f[0])}</div><div class="cap muted">${esc(f[1])}</div></div>${ro ? '' : btnIc('x', 'anFileDel', i, 'Remove')}</div>`).join('')}${a.link ? `<div class="file">${tile('link', 'info', 'sm')}<div class="grow"><div class="strong small ell">${esc(a.link)}</div><div class="cap muted">Link</div></div>${ro ? '' : btnIc('x', 'anLinkDel', '', 'Remove')}</div>` : ''}
        ${ro ? '' : `<div class="ev-acts">${btn('Upload', { v: 'outline', size: 'sm', i: 'upload-simple', act: 'anUpload', test: 'an-upload' })}${btn('Add a link', { v: 'outline', size: 'sm', i: 'link', act: 'anLink', test: 'an-link' })}${btn('From evidence library', { v: 'outline', size: 'sm', i: 'folder-open', act: 'anLib', test: 'an-lib' })}</div>`}${(req.evidence || []).length ? `<div class="cap muted">Expected: ${esc(req.evidence.join('; '))}</div>` : ''}</div></div>` : '';
    const iv = q.interview ? `<div class="iv-note">${tile('video-camera', 'ai', 'sm')}<div class="grow"><b class="small">Interview</b><div class="cap muted">${(c.interviews || []).some(x => x.qid === q.id) ? 'Interview arranged. See it under Interviews when your assessor confirms a time.' : 'Your assessor will ask to speak to the person responsible. You choose a time when they propose slots.'}</div></div></div>` : '';
    const prev = PREV[q.id];
    const card = `<section class="ans-card"><div class="ans-qh"><button class="icon-btn" data-act="ansGo" data-arg="${idx - 1}" ${idx === 0 ? 'disabled' : ''} aria-label="Previous question">${ic('caret-left')}</button><span class="cap" style="color:var(--brand-200)">Question ${idx + 1} of ${qs.length} · ${esc(q.ref)}</span><button class="icon-btn" data-act="ansGo" data-arg="${idx + 1}" ${idx === qs.length - 1 ? 'disabled' : ''} aria-label="Next question">${ic('caret-right')}</button><span class="grow"></span>${ro ? '' : `<button class="icon-btn" data-act="anFlag" title="${a.flag ? 'Remove flag' : 'Flag for the compliance officer'}" aria-label="Flag">${ic(a.flag ? 'flag-banner' : 'flag')}</button>`}</div>
        <div class="ans-qt">${esc(q.q)}</div></section>
      <div class="card col gap16">
        <div class="ctx"><div class="row top"><div class="grow"><div class="cap muted">${esc(req.secName)} · ${esc(req.ref)} ${esc(req.t)}</div><p class="small" style="margin-top:4px">${esc(req.text)}</p></div>${btn('Explain this question', { v: 'tertiary', size: 'sm', i: 'sparkle', act: 'anExplain', test: 'an-explain' })}</div>${S.ui.explainFor === q.id ? `<div class="ai-box">${aiExplain(q, req)}<div class="cap muted">${ic('sparkle')} AI explanation from the regulation and ${esc(S.tenant.short)}'s guidance. It does not answer for you.</div></div>` : ''}</div>
        ${choice}${comment}${ev}${iv}
        <div class="ans-foot"><div class="row gap8 wrap">${ro ? '' : `<span class="cap muted">Assigned to</span>${sel('an-as', [['', 'Nobody'], ...people.map(n => [n, n])], assignee(q), { attrs: 'data-change="anAssign" style="width:170px;height:32px"' })}`}${prev ? btn('Previous answer', { v: 'tertiary', size: 'sm', i: 'clock-counter-clockwise', act: 'anPrev' }) : ''}</div>
          <div class="row gap8">${answerComplete(q, a) ? chip('Answered', 'ok', 'check') : a.by ? chip('Incomplete', 'warn') : ''}${ro ? '' : btn(idx === qs.length - 1 ? 'Save' : 'Save and next', { act: 'anSave', ir: idx === qs.length - 1 ? '' : 'arrow-right', test: 'an-save' })}</div></div></div>`;
    const ass = Object.values(c.assign).filter(Boolean).length;
    return `<div class="rh"><div class="rh-main"><div class="overline">${esc(o.name)}</div><div class="rh-title"><h1 class="h1">${esc(p.name)}</h1>${statusChip(c.stage)}</div><div class="rh-meta">Due ${fmtD(c.due)} · ${S.firms[c.firm] ? 'Assessed by ' + esc(S.firms[c.firm].name) : 'Needs a firm'} · ${p.preview ? 'Outcome preview on' : 'Results when published'}</div></div><div class="rh-act">${ro ? '' : btn(`Assign questions${ass ? ' (' + ass + ')' : ''}`, { v: 'outline', i: 'users', act: 'anAssignDlg', test: 'an-assign' })}</div></div>
      ${ro ? alertBox('ok', `Submitted ${esc(c.submitted || '')}`, 'Answers are locked. Your assessor may ask for more information.', SCREENS['org/preview'] && c.stage === 'In preview' ? btn('Open outcome preview', { size: 'sm', act: 'openPreview', arg: c.id }) : '') : ''}
      <button class="ans-mnav" data-act="ansNavDrawer" data-test="ans-mnav">${ic('list-numbers')}<span class="grow">Question ${idx + 1} of ${qs.length}</span><span class="cap muted">All questions</span>${ic('caret-down')}</button><div class="ans-grid">${nav}<div class="col gap12" style="min-width:0">${card}</div></div>`;
  }
});
function anRead() {
  const c = curCase(); if (readOnlyCase(c)) return; const qs = caseQs(c); const q = qs[Math.min(S.ui.qIdx || 0, qs.length - 1)]; if (!$('.ans-card')) return;
  const a = c.answers[q.id] = Object.assign({}, c.answers[q.id] || {});
  const r = $$('input[name=an-v]').find(x => x.checked); if (r) a.v = r.value; else if ($('#an-v')) a.v = val('an-v');
  if ($('#an-c')) a.comment = $('#an-c').value;
  if (a.v || a.comment || (a.files || []).length || a.link) { a.by = a.by || persona().name; a.when = '19 Oct 2026'; a.status = answerComplete(q, a) ? 'answered' : 'draft'; }
  else if (!a.assignee && !a.flag) delete c.answers[q.id];
}
ACT.ansGo = (k) => { anRead(); const qs = caseQs(curCase()); k = Math.max(0, Math.min(+k, qs.length - 1)); S.ui.qIdx = k; const o = ui('ansOpen', {}); o[qs[k].sec] = true; S.ui.explainFor = null; render(); };
ACT.ansSec = (id) => { anRead(); const o = ui('ansOpen', {}); o[id] = !o[id]; render(); };
ACT.ansF = (f) => { anRead(); S.ui.ansF = f; render(); };
ACT.anPick = () => { setTimeout(() => { anRead(); render(); }); };
ACT.anSave = () => { anRead(); const c = curCase(); const qs = caseQs(c); const k = S.ui.qIdx || 0; const q = qs[k]; const a = c.answers[q.id];
  if (!answerComplete(q, a)) { toast(q.choice && !(a && a.v) ? 'Choose an answer first' : (a && (a.v === 'No' || a.v === 'Not applicable')) ? 'Explain your answer before saving' : q.evidence ? 'Attach evidence, or answer No and explain' : 'Complete the answer', 'bad'); render(); return; }
  if (c.stage === 'Awaiting firm' || c.stage === 'Firm to assign') { /* answering can start before the firm is confirmed */ }
  if (k < qs.length - 1) ACT.ansGo(k + 1); else { render(); toast('Saved'); } };
ACT.anExplain = () => { anRead(); const q = caseQs(curCase())[S.ui.qIdx || 0]; S.ui.explainFor = S.ui.explainFor === q.id ? null : q.id; render(); };
ACT.anRephrase = () => { const t = val('an-c'); if (!t) { toast('Write your explanation first. AI only tidies your own words.', 'info', 'sparkle'); return; } const r = aiRephrase(t); $('#rephrase-box').innerHTML = `<div class="ai-box"><div class="cap muted">${ic('sparkle')} Suggested wording (same facts)</div><p class="small">${esc(r)}</p><div class="row gap8">${btn('Use this', { size: 'sm', act: 'anRephraseUse', test: 'an-rephrase-use' })}${btn('Keep mine', { v: 'tertiary', size: 'sm', act: 'anRephraseNo' })}</div></div>`; S._reph = r; };
ACT.anRephraseUse = () => { $('#an-c').value = S._reph; $('#rephrase-box').innerHTML = ''; anRead(); toast('Wording updated'); };
ACT.anRephraseNo = () => { $('#rephrase-box').innerHTML = ''; };
const curQA = () => { anRead(); const c = curCase(); const q = caseQs(c)[S.ui.qIdx || 0]; return [c, q, c.answers[q.id] = c.answers[q.id] || {}]; };
ACT.anUpload = () => { const [c, q, a] = curQA(); const req = qsetReqs(progOf(c.prog).qset).find(r => r.ref === q.ref); const nm = (req.evidence[((a.files || []).length) % Math.max(1, req.evidence.length)] || 'Supporting document') + '.pdf'; a.files = (a.files || []).concat([[nm, '820 KB · uploaded just now']]); S.evidence.unshift({ id: uid('e'), org: c.org, name: nm, size: '820 KB', kind: 'Upload', by: persona().name, when: '19 Oct 2026', expires: '', links: [q.id] }); anRead(); render(); toast('File uploaded and saved to your evidence library', 'ok', 'upload-simple'); };
ACT.anLink = () => openDialog(`${dlgHead('Add a link', 'For example a SharePoint or Google Drive document your assessor can open.', 'link')}<form class="col gap16" data-form="anLink">${field('Link', inp('al-url', '', { ph: 'https://' }), { for: 'al-url' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Add link', { type: 'submit', test: 'al-go' })}</div></form>`);
ACT.form_anLink = () => { const u = val('al-url'); if (!/^https?:\/\/\S+\.\S+/.test(u)) { toast('Enter a full link starting with https://', 'bad'); return; } closeDialog(); const [, , a] = curQA(); a.link = u; anRead(); render(); toast('Link added'); };
ACT.anLib = () => { const c = curCase(); const list = S.evidence.filter(e => e.org === c.org); openDialog(`${dlgHead('Choose from your evidence library', 'Files you uploaded before. One file can support many questions.', 'folder-open')}<div class="col gap8">${list.map(e => `<label class="choice"><input type="checkbox" class="sr" data-libf="${e.id}"><span class="radio" style="border-radius:6px"></span>${tile('file-text', '', 'sm')}<span class="grow"><b class="small">${esc(e.name)}</b><br><span class="cap muted">${esc(e.kind)} · ${esc(e.when)}${e.links.length ? ' · used ' + e.links.length + ' time' + (e.links.length > 1 ? 's' : '') : ''}</span></span></label>`).join('')}</div><div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Attach selected', { act: 'anLibGo', test: 'lib-go' })}</div>`, { wide: true }); };
ACT.anLibGo = () => { const ids = $$('[data-libf]').filter(x => x.checked).map(x => x.dataset.libf); if (!ids.length) { toast('Choose at least one file', 'bad'); return; } closeDialog(); const [, q, a] = curQA(); ids.forEach(id => { const e = S.evidence.find(x => x.id === id); a.files = (a.files || []).concat([[e.name, e.size + ' · from library']]); if (!e.links.includes(q.id)) e.links.push(q.id); }); anRead(); render(); toast(`${ids.length} file${ids.length > 1 ? 's' : ''} attached`); };
ACT.anFileDel = (i) => { const [, , a] = curQA(); a.files.splice(+i, 1); anRead(); render(); };
ACT.anLinkDel = () => { const [, , a] = curQA(); a.link = ''; anRead(); render(); };
ACT.anFlag = () => { const [, , a] = curQA(); a.flag = !a.flag; render(); toast(a.flag ? 'Flagged for the compliance officer' : 'Flag removed', 'info', 'flag'); };
ACT.chg_anAssign = (v) => { const [, , a] = curQA(); a.assignee = v; render(); toast(v ? `Assigned to ${esc(v)}` : 'Unassigned'); };
ACT.anPrev = () => { const q = caseQs(curCase())[S.ui.qIdx || 0]; const [v, cm, src] = PREV[q.id]; openDialog(`${dlgHead('Previous answer', esc(src), 'clock-counter-clockwise')}${kv([['Answer', esc(v)], ['Explanation', esc(cm)]])}<p class="cap muted">Shown for reference. Answer for today.</p><div class="row end">${btn('Close', { v: 'outline', act: 'closeDialog' })}</div>`); };
ACT.anAssignDlg = () => { anRead(); const c = curCase(); const p = progOf(c.prog); const people = orgPeople(S.orgs[c.org]); const qs = caseQs(c);
  openDialog(`${dlgHead('Assign questions', 'Give each section to a colleague. You can change single questions on the question itself.', 'users')}<div class="col gap8">${p.qset.sections.filter(s => s.on).map(s => `<div class="row" style="padding:8px 0;border-top:1px solid var(--border)"><span class="grow"><b class="small">${esc(s.name)}</b><br><span class="cap muted">${qs.filter(x => x.sec === s.id).length} questions</span></span>${sel('as-' + s.id, [['', 'Nobody'], ...people.map(n => [n, n])], c.assign[s.id] || '', { attrs: `data-asec="${s.id}" style="width:190px"` })}</div>`).join('')}</div>${people.length < 2 ? note('Invite colleagues from Team to share the work.', 'user-plus') : ''}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Save assignments', { act: 'anAssignGo', test: 'as-go' })}</div>`, { wide: true }); };
ACT.anAssignGo = () => { const c = curCase(); $$('[data-asec]').forEach(el => { c.assign[el.dataset.asec] = el.value; }); closeDialog(); addAudit('Assigned questions', progOf(c.prog).name); notify({ ws: 'organisation', i: 'users', tone: 'info', title: `You have questions to answer in ${progOf(c.prog).name}`, go: 'org/obligations', kind: 'Reminders' }); render(); toast('Assignments saved. Colleagues are emailed.', 'ok', 'users'); };

/* Review and submit (compliance officer) */
screen('org/submit', {
  t: 'Review and submit', layout: 'app', ws: 'organisation', crumbs: () => [['Obligations', 'org/obligations'], [progOf(curCase().prog).name, 'org/answer'], 'Review and submit'],
  render() {
    const c = curCase(); const p = progOf(c.prog); const qs = caseQs(c); const secs = p.qset.sections.filter(s => s.on);
    if (c.receipt) return `${pageHead({ title: 'Submitted', sub: esc(p.name) })}<div class="card col gap16" style="max-width:720px">${tile('check-circle', 'solid ok', 'lg')}<div class="h3">Your answers are with ${esc(S.firms[c.firm] ? S.firms[c.firm].name : 'your assessor')}</div>${kv([['Receipt', `<span class="mono">${esc(c.receipt)}</span>`], ['Submitted', `${esc(c.submitted)} by ${esc(c.submittedBy)}`], ['Questions', `${qs.length} answered`], ['Evidence', `${qs.reduce((n, q) => n + ((c.answers[q.id] || {}).files || []).length + ((c.answers[q.id] || {}).link ? 1 : 0), 0)} files and links`]])}<div class="row">${btn('Download a copy (PDF)', { v: 'outline', i: 'download-simple', act: 'savedToast', arg: 'Copy downloaded' })}${btn('Back to obligations', { v: 'secondary', go: 'org/obligations' })}</div></div>`;
    const unans = qs.filter(q => !answerComplete(q, c.answers[q.id])); const noA = qs.filter(q => (c.answers[q.id] || {}).v === 'No'); const flagged = qs.filter(q => (c.answers[q.id] || {}).flag);
    const done = qs.length - unans.length;
    const li = (list, emptyT) => list.length ? `<div class="list" style="margin:0 -20px -20px">${list.map(q => `<button class="list-row" data-act="ansJump" data-arg="${qs.indexOf(q)}"><span class="mono small" style="color:var(--brand-600);min-width:60px">${esc(q.ref)}</span><span class="grow ell">${esc(q.q)}</span>${ic('caret-right')}</button>`).join('')}</div>` : `<p class="small muted">${emptyT}</p>`;
    return `${pageHead({ title: 'Review and submit', sub: `${esc(p.name)} · due ${fmtD(c.due)}. Check the answers, then submit them to your assessor. You cannot change them afterwards.` })}
      <div class="grid side"><div class="col gap16">
        <div class="card col gap12"><div class="row"><span class="h4 grow">By section</span><span class="cap muted">${done} of ${qs.length} answered</span></div>${secs.map(s => { const sq = qs.filter(q => q.sec === s.id); const sd = sq.filter(q => answerComplete(q, c.answers[q.id])).length; return `<div class="row small"><span class="grow">${esc(s.name)}</span><span style="width:220px">${progBar(Math.round(sd / sq.length * 100), sd + '/' + sq.length)}</span></div>`; }).join('')}</div>
        <div class="card col gap8"><div class="row"><span class="h4 grow">Not answered yet</span>${count(unans.length)}</div>${li(unans, 'Every question is answered.')}</div>
        <div class="card col gap8"><div class="row"><span class="h4 grow">Answered No</span>${count(noA.length)}</div>${li(noA, 'None.')}</div>
        <div class="card col gap8"><div class="row"><span class="h4 grow">Flagged for you</span>${count(flagged.length)}</div>${li(flagged, 'Nothing flagged.')}</div></div>
      <div class="col gap16"><div class="card col gap12"><div class="h4">Submit</div>${unans.length ? alertBox('warn', `${unans.length} question${unans.length > 1 ? 's' : ''} to finish`, 'Submit unlocks when every question is answered.') : alertBox('ok', 'Ready to submit', 'Every question has an answer.')}
        ${ck('sb-decl', 'I confirm these answers are accurate and complete, and I am authorised to submit them.', false, { attrs: unans.length ? 'disabled' : '' })}
        ${btn('Submit to assessor', { block: true, i: 'paper-plane-tilt', act: 'anSubmit', disabled: unans.length > 0, test: 'an-submit' })}<p class="cap muted">Only the compliance officer or organisation admin can submit.</p></div></div></div>`;
  }
});
ACT.ansJump = (k) => { S.ui.qIdx = +k; const qs = caseQs(curCase()); const o = ui('ansOpen', {}); o[qs[+k].sec] = true; go('org/answer'); };
ACT.anSubmit = () => {
  if (!val('sb-decl')) { toast('Tick the confirmation to submit', 'bad'); return; }
  const c = curCase(); const p = progOf(c.prog); const o = S.orgs[c.org];
  c.stage = 'Submitted'; c.submitted = '19 Oct 2026, 21:40'; c.submittedBy = persona().name; c.receipt = 'SUB-' + p.id.toUpperCase() + '-' + o.ini + '-0419';
  progActivity(p, persona().name, `submitted answers for ${o.name}`); addAudit('Submitted answers', `${o.name} · ${p.name}`);
  notify({ ws: 'firm', i: 'paper-plane-tilt', tone: 'info', title: `${o.name} submitted answers for ${p.name}`, go: 'firm/engagements', kind: 'Approvals' });
  render(); toast('Submitted. Receipt ' + c.receipt, 'ok', 'paper-plane-tilt');
};

/* Evidence library */
screen('org/evidence', {
  t: 'Evidence library', layout: 'app', ws: 'organisation', crumbs: ['Evidence library'],
  render() {
    const list = S.evidence.filter(e => e.org === S.orgId); const q = ui('evQ', ''); const f = ui('evF', 'All');
    const soon = e => e.expires && e.expires <= '2026-12-31';
    const rows = list.filter(e => (!q || e.name.toLowerCase().includes(q.toLowerCase())) && (f === 'All' || (f === 'Expiring' ? soon(e) : f === 'Unused' ? !e.links.length : e.links.length)));
    return `${pageHead({ title: 'Evidence library', sub: 'Upload a document once and use it for any question. Files keep their integrity record.', actions: btn('Upload', { i: 'upload-simple', act: 'evUpload', test: 'ev-upload' }) })}
      <div class="card p0"><div class="tbl-tools"><form class="inp-wrap" data-form="evSearch" style="width:280px">${ic('magnifying-glass')}<input class="inp" id="ev-q" placeholder="Search files" value="${esc(q)}"></form></div>${fpills([['All', 'All files', list.length], ['In use', 'In use', list.filter(e => e.links.length).length], ['Unused', 'Unused', list.filter(e => !e.links.length).length], ['Expiring', 'Expiring by 31 Dec', list.filter(soon).length, '', 'warn']], f, 'evF')}
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>File</th><th>Type</th><th class="num">Used in</th><th>Added</th><th>Expires</th><th class="act-col"></th></tr></thead><tbody>${rows.map(e => `<tr class="click" data-act="evOpen" data-arg="${e.id}"><td><div class="row gap8">${tile('file-text', '', 'sm')}<div><div class="strong">${esc(e.name)}</div><div class="cap muted">${esc(e.size)}</div></div></div></td><td class="small">${esc(e.kind)}</td><td class="num tnum">${e.links.length}</td><td class="small muted">${esc(e.when)} · ${esc(e.by)}</td><td class="small">${e.expires ? (soon(e) ? chip(fmtD(e.expires), 'warn', 'clock') : fmtD(e.expires)) : '<span class="muted">—</span>'}</td><td class="act-col">${btnIc('download-simple', 'savedToast', 'Download started', 'Download')}</td></tr>`).join('') || `<tr><td colspan="6">${empty('folder-open', 'No files here', 'Upload a document, or attach one while answering.')}</td></tr>`}</tbody></table></div><div class="tbl-foot">${rows.length} of ${list.length} files</div></div>`;
  }
});
ACT.evF = (f) => { S.ui.evF = S.ui.evF === f ? 'All' : f; render(); };
ACT.form_evSearch = () => { S.ui.evQ = val('ev-q'); render(); };
ACT.evUpload = () => openDialog(`${dlgHead('Upload to the evidence library', 'PDF, Word, Excel or images up to 25 MB.', 'upload-simple')}<form class="col gap16" data-form="evUp"><button type="button" class="drop">${tile('cloud-arrow-up', '', 'lg')}<b>Drop a file here</b><span class="cap muted">or click to choose</span></button><div class="grid g2" style="gap:12px">${field('Name', inp('eu-n', 'Business continuity plan 2026.pdf'), { for: 'eu-n' })}${field('Type', sel('eu-k', ['Policy', 'Plan', 'Report', 'Board record', 'System export', 'Certificate', 'Other'], 'Plan'), { for: 'eu-k' })}</div>${field('Expires', inp('eu-x', '', { type: 'date' }), { opt: true, hint: 'We remind you 30 days before.', for: 'eu-x' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Upload', { type: 'submit', test: 'eu-go' })}</div></form>`);
ACT.form_evUp = () => { const n = val('eu-n'); if (!n) { toast('Name the file', 'bad'); return; } S.evidence.unshift({ id: uid('e'), org: S.orgId, name: n, size: '1.1 MB', kind: val('eu-k'), by: persona().name, when: '19 Oct 2026', expires: val('eu-x'), links: [] }); closeDialog(); render(); toast('Uploaded', 'ok', 'upload-simple'); };
ACT.evOpen = (id) => { const e = S.evidence.find(x => x.id === id); const qs = S.cases.filter(c => c.org === e.org).flatMap(c => caseQs(c).filter(q => e.links.includes(q.id)).map(q => [progOf(c.prog).name, q]));
  openDrawer(`<div class="row top"><div class="grow"><div class="overline">Evidence</div><h2 class="h3" style="margin-top:4px">${esc(e.name)}</h2></div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div>${kv([['Type', esc(e.kind)], ['Size', esc(e.size)], ['Added', `${esc(e.when)} by ${esc(e.by)}`], ['Expires', e.expires ? fmtD(e.expires) : '—'], ['Integrity', '<span class="mono small">SHA-256 recorded</span>']])}<div class="h4">Used in</div>${qs.map(([pn, q]) => `<div class="file">${tile('question', '', 'sm')}<div class="grow"><div class="small strong">${esc(q.q)}</div><div class="cap muted">${esc(pn)} · ${esc(q.ref)}</div></div></div>`).join('') || '<p class="small muted">Not used yet. Attach it from any question with “From evidence library”.</p>'}`); };


/* phones: the question comes first; the question list opens as a drawer */
ACT.ansNavDrawer = () => { const nav = $('.ans-nav'); if (!nav) return; openDrawer(`<div class="row"><b class="grow">Questions</b><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div><div class="ans-nav in-drawer">${nav.innerHTML}</div>`); const d = $('#drw'); d && d.addEventListener('click', e => { if (e.target.closest('.ans-q')) setTimeout(closeDrawer, 0); }); };
