/* ================= C6 · Landing: "many into one" hero and the mandates band ================= */
/* Regulators are named, never shown with emblems (no permission yet). Organisations mix real and fictional names. */
const MIO_REGS = {
  CBN: { name: 'Central Bank of Nigeria', strength: 78, find: 23, ret: '96%', vals: [61, 63, 64, 66, 69, 71, 74, 78], feed: [['Zenith Bank', 'filed its Q3 prudential return', 'returns'], ['Moniepoint', 'closed 2 findings with evidence', 'evidence'], ['Copperleaf Microfinance', 'has 1 overdue fix', 'findings']] },
  SEC: { name: 'Securities and Exchange Commission', strength: 71, find: 14, ret: '91%', vals: [64, 64, 65, 67, 66, 68, 70, 71], feed: [['Harbourline Securities', 'filed its quarterly CMO return', 'returns'], ['Kestrel Asset Management', 'uploaded its custody attestation', 'evidence'], ['Crestview Trustees', 'received 3 findings', 'findings']] },
  NITDA: { name: 'National Information Technology Development Agency', strength: 74, find: 31, ret: '88%', vals: [55, 58, 60, 62, 65, 67, 70, 74], feed: [['Northgate Cloud', 'submitted its ISR 2026 answers', 'returns'], ['Unity Health Records', 'sent proof for an access-control fix', 'evidence'], ['Ridgeline Bank', 'has a major nonconformity open', 'findings']] }
};
const MIO_ORGS = [
  ['Zenith Bank', 'ZB', '#c8102e', ['CBN', 'NITDA']], ['Northgate Cloud', 'NC', '#0e7490', ['NITDA']], ['Harbourline Securities', 'HS', '#1d4ed8', ['SEC']],
  ['Moniepoint', 'MP', '#0055ff', ['CBN', 'NITDA']], ['Kestrel Asset Mgmt', 'KA', '#7c3aed', ['SEC']], ['Unity Health Records', 'UH', '#0f766e', ['NITDA']],
  ['OPay', 'OP', '#0f9d58', ['CBN']], ['Crestview Trustees', 'CT', '#9a3412', ['SEC']], ['Ridgeline Bank', 'RB', '#1e3a8a', ['CBN', 'NITDA']],
  ['Copperleaf Microfinance', 'CM', '#a16207', ['CBN']], ['Brookfield Brokers', 'BB', '#be185d', ['SEC']], ['Meadow Pay', 'MD', '#15803d', ['CBN', 'NITDA']]
];
const MIO_COL = { returns: '#818cf8', evidence: '#34d399', findings: '#fbbf24' };
/* stage geometry in a 1000 × 440 box: six organisations each side, the dashboard card in the middle */
const mioPos = i => { const side = i % 2 ? 1 : 0, k = Math.floor(i / 2); return { side, x: side ? 812 : 8, y: 26 + k * 70, cx: side ? 812 : 188, cy: 26 + k * 70 + 22 }; };
const mioPath = i => { const p = mioPos(i), tx = p.side ? 724 : 276, ty = 130 + (Math.floor(i / 2)) * 36; const mx = (p.cx + tx) / 2; return `M${p.cx} ${p.cy} C${mx} ${p.cy} ${mx} ${ty} ${tx} ${ty}`; };
const mioReduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };

function mioPackets(reg) {
  if (mioReduced()) return '';
  const kinds = ['returns', 'evidence', 'findings'];
  return MIO_ORGS.map((o, i) => o[3].includes(reg) ? [0, 1].map(n => { const k = kinds[(i + n) % 3]; const d = 2.6 + (i % 3) * 0.35; return `<circle r="4.5" opacity="0" fill="${MIO_COL[k]}"><animateMotion dur="${d}s" begin="${(n * d / 2 + i * 0.17).toFixed(2)}s" repeatCount="indefinite" path="${mioPath(i)}" keyPoints="0;1" keyTimes="0;1" calcMode="spline" keySplines=".4 0 .6 1"/><animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.85;1" dur="${d}s" begin="${(n * d / 2 + i * 0.17).toFixed(2)}s" repeatCount="indefinite"/></circle>`; }).join('') : '').join('');
}
function mioCard(reg) {
  const r = MIO_REGS[reg]; const n = MIO_ORGS.filter(o => o[3].includes(reg)).length;
  return `<div class="row top" style="gap:12px"><div class="grow" style="min-width:0"><div class="overline" style="color:var(--text-2)">Supervision overview</div><b class="mio-title">${esc(r.name)}</b></div><span class="mio-own">${ic('eye')}Only its own organisations</span></div>
    <div class="mio-k">${[['Organisations', n], ['Compliance strength', r.strength], ['Open findings', r.find], ['Returns on time', r.ret]].map(([l, v]) => `<div><span>${l}</span><b class="tnum">${v}</b></div>`).join('')}</div>
    <div class="mio-chart">${chLine({ w: 460, h: 140, x: { min: 0, max: 7, ticks: [[0, "Q1 '25"], [2, "Q3 '25"], [4, "Q1 '26"], [6, "Q3 '26"]] }, y: { min: 50, max: 85, ticks: [50, 65, 80] }, series: [{ name: 'Compliance strength', col: '#4f46e5', w: 2.4, pts: r.vals.map((v, i) => [i, v]), end: String(r.vals[7]) }], label: 'Compliance strength by quarter' })}</div>
    <div class="mio-feed">${r.feed.map(([o, t, k]) => `<div><span class="dot" style="background:${MIO_COL[k]}"></span><b>${esc(o)}</b> ${esc(t)}</div>`).join('')}</div>`;
}
function heroStage() {
  const reg = ui('mioReg', 'CBN');
  return `<div class="mio" data-test="mio" data-reg="${reg}">
    <div class="mio-tabs" role="tablist" aria-label="Show a regulator's view">${Object.keys(MIO_REGS).map(k => `<button role="tab" aria-selected="${k === reg}" class="${k === reg ? 'on' : ''}" data-act="mioPick" data-arg="${k}" data-test="mio-${k}">${k}</button>`).join('')}</div>
    <div class="mio-stage">
      <svg class="mio-svg" viewBox="0 0 1000 440" preserveAspectRatio="none" aria-hidden="true"><g class="mio-paths">${MIO_ORGS.map((o, i) => `<path d="${mioPath(i)}" class="${o[3].includes(reg) ? 'on' : ''}" data-i="${i}"/>`).join('')}</g><g class="mio-pk">${mioPackets(reg)}</g></svg>
      <div class="mio-nodes">${MIO_ORGS.map((o, i) => { const p = mioPos(i); return `<div class="mio-node ${o[3].includes(reg) ? 'on' : ''} ${p.side ? 'r' : ''}" style="--x:${p.x / 10}%;--y:${p.y}px" data-i="${i}"><span class="mio-ini" style="background:${o[2]}">${o[1]}</span><span class="ell">${esc(o[0])}</span></div>`; }).join('')}</div>
      <div class="mio-card" aria-live="polite">${mioCard(reg)}</div>
    </div>
    <div class="mio-legend">${Object.entries(MIO_COL).map(([k, c]) => `<span><span class="dot" style="background:${c}"></span>${k[0].toUpperCase() + k.slice(1)}</span>`).join('')}<span class="mio-note">Each regulator sees only the organisations it supervises</span></div>
  </div>`;
}
/* switch regulator in place, so the animation keeps its rhythm and nothing else on the page moves */
function mioPaint(reg) {
  S.ui.mioReg = reg; const m = $('.mio'); if (!m) return; m.dataset.reg = reg;
  m.querySelectorAll('.mio-tabs button').forEach(b => { const on = b.dataset.arg === reg; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  m.querySelectorAll('.mio-paths path').forEach(p => p.classList.toggle('on', MIO_ORGS[+p.dataset.i][3].includes(reg)));
  m.querySelectorAll('.mio-node').forEach(n => n.classList.toggle('on', MIO_ORGS[+n.dataset.i][3].includes(reg)));
  const g = m.querySelector('.mio-pk'); if (g) g.innerHTML = mioPackets(reg);
  const c = m.querySelector('.mio-card'); if (c) c.innerHTML = mioCard(reg);
}
ACT.mioPick = reg => { S._mioUser = true; mioPaint(reg); };
let MIO_T = null, MIO_IO = null, MIO_VIS = true;
function mioMount() {
  clearInterval(MIO_T); if (MIO_IO) MIO_IO.disconnect();
  const m = $('.mio'); if (!m) return; S._mioUser = false;
  const svg = m.querySelector('svg');
  if ('IntersectionObserver' in window) { MIO_IO = new IntersectionObserver(es => { MIO_VIS = es[0].isIntersecting; try { MIO_VIS ? svg.unpauseAnimations() : svg.pauseAnimations(); } catch (e) {} }); MIO_IO.observe(m); }
  if (mioReduced()) return;
  MIO_T = setInterval(() => { if (S.route !== 'home' || !document.body.contains(m)) { clearInterval(MIO_T); return; } if (S._mioUser || !MIO_VIS || document.hidden) return; const ks = Object.keys(MIO_REGS); mioPaint(ks[(ks.indexOf(ui('mioReg', 'CBN')) + 1) % ks.length]); }, 3200);
}

/* ---------- regulators and sectors band ---------- */
const MANDATES = [
  ['CBN', 'Central Bank of Nigeria', ['bank', 'mfb', 'pay']], ['SEC', 'Securities and Exchange Commission', ['cap']], ['NAICOM', 'National Insurance Commission', ['ins']],
  ['PenCom', 'National Pension Commission', ['pen']], ['NITDA', 'National Information Technology Development Agency', ['cloud', 'pub']], ['NDIC', 'Nigeria Deposit Insurance Corporation', ['bank', 'mfb']],
  ['NDPC', 'Nigeria Data Protection Commission', ['bank', 'mfb', 'pay', 'cap', 'ins', 'pen', 'cloud', 'pub', 'tel', 'health']]
];
const SECTORS = [['bank', 'Commercial banks', 'bank'], ['mfb', 'Microfinance banks', 'piggy-bank'], ['pay', 'Payments and fintech', 'credit-card'], ['cap', 'Capital market operators', 'chart-line-up'], ['ins', 'Insurers', 'umbrella'], ['pen', 'Pension administrators', 'hand-coins'], ['cloud', 'Cloud and IT services', 'cloud'], ['tel', 'Telecoms', 'cell-signal-full'], ['pub', 'Public institutions', 'buildings'], ['health', 'Health data holders', 'first-aid-kit']];
function mandateBand() {
  const a = ui('mandate', 'CBN'); const m = MANDATES.find(x => x[0] === a);
  return `<section class="band b-canvas" id="s-mandate"><div class="wrap"><div class="head"><div class="eyebrow">Configured for your mandate</div><h2 class="mk-h2">One platform, set up for each regulator</h2><p class="lead">Each regulator gets its own workspace, its own frameworks and only the organisations it supervises. Pick a regulator to see the sectors it would configure.</p></div>
    <div class="mand" data-test="mandate">
      <div class="mand-regs" role="tablist" aria-label="Regulators">${MANDATES.map(([k, n]) => `<button role="tab" aria-selected="${k === a}" class="${k === a ? 'on' : ''}" data-act="mandPick" data-arg="${k}" data-hover="${k}" data-test="mand-${k}"><b>${k}</b><span>${esc(n)}</span></button>`).join('')}</div>
      <div class="mand-sec"><div class="mand-cap" aria-live="polite"><b>${esc(m[1])}</b> · ${m[2].length} sector${m[2].length > 1 ? 's' : ''}</div><div class="mand-grid">${SECTORS.map(([id, l, i]) => `<span class="${m[2].includes(id) ? 'on' : ''}" data-sec="${id}">${ic(i)}${esc(l)}</span>`).join('')}</div>
        <p class="mand-note">Regulator names show the kinds of mandate SuperAtlas is configured for. They do not mean these regulators use SuperAtlas or endorse it.</p></div>
    </div></div></section>`;
}
function mandPaint(k) {
  const m = MANDATES.find(x => x[0] === k); const el = $('.mand'); if (!m || !el) return;
  el.querySelectorAll('.mand-regs button').forEach(b => { const on = b.dataset.arg === k; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  el.querySelectorAll('.mand-grid>span').forEach(s => s.classList.toggle('on', m[2].includes(s.dataset.sec)));
  el.querySelector('.mand-cap').innerHTML = `<b>${esc(m[1])}</b> · ${m[2].length} sector${m[2].length > 1 ? 's' : ''}`;
}
ACT.mandPick = k => { S.ui.mandate = k; mandPaint(k); };
document.addEventListener('mouseover', e => { const b = e.target.closest && e.target.closest('.mand-regs button'); if (b && matchMedia('(hover:hover)').matches) mandPaint(b.dataset.hover); });
document.addEventListener('mouseout', e => { const r = e.target.closest && e.target.closest('.mand-regs'); if (r && !r.contains(e.relatedTarget)) mandPaint(ui('mandate', 'CBN')); });
