/* ================= Question model helpers (library, programmes, answering) ================= */
const CHOICES = [['yn', 'Yes / No / Not applicable'], ['text', 'Text'], ['number', 'Number'], ['date', 'Date'], ['', 'No choice']];
const PARTS = [['comment', 'Comment', 'chat-text'], ['evidence', 'Evidence', 'paperclip'], ['interview', 'Interview', 'video-camera']];
const choiceLabel = c => (CHOICES.find(x => x[0] === c) || CHOICES[4])[1];
function qParts(q) {
  return `<span class="qp">${q.choice ? `<span class="qp-c">${esc(choiceLabel(q.choice))}</span>` : ''}${PARTS.filter(([k]) => q[k]).map(([k, l, i]) => `<span class="qp-p">${ic(i)}${l}</span>`).join('')}</span>`;
}
/* editable row used by the library editor and the programme question set */
function qEditRow(q, i, keyAttr) {
  return `<div class="q-edit" ${keyAttr}="${i}"><div class="row"><span class="q-n">${i + 1}</span><input class="inp grow" data-qf="q" value="${esc(q.q)}" placeholder="Question text"><button type="button" class="icon-btn" data-act="qeDel" data-arg="${i}" aria-label="Remove question" title="Remove">${ic('trash')}</button></div>
    <div class="q-parts"><span class="cap muted">Answer parts</span>${sel('qc' + i, CHOICES, q.choice, { attrs: 'data-qf="choice" style="width:220px;height:32px"' })}${PARTS.map(([k, l, ico]) => `<label class="part-tog"><input type="checkbox" data-qf="${k}" ${q[k] ? 'checked' : ''}>${ic(ico)}${l}</label>`).join('')}</div></div>`;
}
function readQEdits(sel_) { return $$(sel_).map(row => { const o = {}; row.querySelectorAll('[data-qf]').forEach(el => { o[el.dataset.qf] = el.type === 'checkbox' ? el.checked : el.value.trim(); }); return o; }); }
/* AI: draft questions for a requirement (never answers) */
function suggestQs(req) {
  const t = req.t.charAt(0).toLowerCase() + req.t.slice(1);
  return [
    { q: `Is there ${/^(a|an|the)\b/i.test(t) ? '' : 'a '}${t} in place today?`, choice: 'yn', comment: true, evidence: true, interview: false },
    { q: `Who is accountable for this, and how often is it reviewed?`, choice: 'text', comment: false, evidence: false, interview: false },
    { q: `When was it last reviewed, tested or approved?`, choice: 'date', comment: false, evidence: true, interview: false },
    { q: `Walk the assessor through how this works in practice.`, choice: '', comment: false, evidence: false, interview: true }
  ];
}
function openSuggest(req, onAdd) {
  S._suggest = { list: suggestQs(req), onAdd };
  openDialog(`${dlgHead('Suggested questions', 'Drafted from ' + esc(req.ref) + '. Keep, edit or drop each one; nothing is added until you choose.', 'sparkle', 'ai')}
    <div class="col gap8">${S._suggest.list.map((q, i) => `<label class="sug-row"><input type="checkbox" data-sug="${i}" checked><span class="grow"><span class="strong" style="display:block">${esc(q.q)}</span>${qParts(q)}</span></label>`).join('')}</div>
    <p class="cap muted">${ic('info')} AI drafts questions only. It never suggests answers for organisations.</p>
    <div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Add selected', { i: 'plus', act: 'sugAdd', test: 'sug-add' })}</div>`, { wide: true });
}
ACT.sugAdd = () => { const pick = $$('[data-sug]').filter(x => x.checked).map(x => S._suggest.list[+x.dataset.sug]); closeDialog(); if (pick.length) S._suggest.onAdd(pick); };

