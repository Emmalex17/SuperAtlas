/* ================= Sign-in, invitations, account (one universal sign-in, routed by account) ================= */

/* SuperAtlas-branded left panel: sells the product, never the tenant */
function authArt() {
  const pts = [['eye', 'One view of every organisation', 'Returns, evidence, assessments and findings, side by side.'], ['seal-check', 'Independent, accredited assessment', 'Assurance firms confirm outcomes before you publish.'], ['chart-line-up', 'Compliance strength over time', 'See who is improving, who is slipping, and why.']];
  return `<aside class="auth-art"><div class="grid-lines"></div>
    <a href="#home" data-go="home" style="position:relative" aria-label="SuperAtlas home">${lockup(true, 30)}</a>
    <div style="position:relative" class="col gap20"><h1 class="serif" style="font-size:30px;line-height:38px;letter-spacing:-.02em;max-width:20ch">Supervision that shows its working.</h1>
      <div class="col" style="gap:14px">${pts.map(([i, t, d]) => `<div class="row top" style="gap:12px"><span class="art-ic">${ic(i)}</span><div><div class="semi small">${t}</div><div class="cap" style="color:var(--brand-200);margin-top:2px">${d}</div></div></div>`).join('')}</div></div>
    <div class="art-extra art-card" aria-hidden="true"><div class="row between"><span class="cap" style="color:var(--brand-200)">Compliance strength</span><span class="cap" style="color:#86efac">+6 pts</span></div><div class="row" style="align-items:flex-end;gap:14px;margin-top:4px"><span class="serif" style="font-size:30px;font-weight:700;line-height:1">78</span>${spark([58, 59.5, 60, 61, 63, 66, 69, 72], '#a5b4fc', '#dba94d')}</div><div class="art-bars">${[['Governance', 84], ['Access control', 71], ['Incident response', 66]].map(([l, v]) => `<div><span>${l}</span><i><b style="width:${v}%"></b></i><em>${v}</em></div>`).join('')}</div></div>
    <div class="cap" style="position:relative;color:var(--brand-200)">© 2026 RegTech365 · Privacy · Terms</div>
  </aside>`;
}
function authPage(inner) { return `<div class="auth">${authArt()}<section class="auth-form"><div class="inner">${inner}</div></section></div>`; }
function pwRules(pw) {
  const r = [[pw.length >= 12, 'At least 12 characters'], [/[A-Z]/.test(pw) && /[a-z]/.test(pw), 'Upper and lower case'], [/\d/.test(pw), 'A number'], [/[^A-Za-z0-9]/.test(pw), 'A symbol']];
  const n = r.filter(x => x[0]).length;
  return { ok: n === 4, html: `<div class="pw-meter">${[1, 2, 3, 4].map(i => `<i class="${i <= n ? (n <= 1 ? 'on1' : n <= 3 ? 'on2' : 'on3') : ''}"></i>`).join('')}</div><div class="rules" style="margin-top:8px">${r.map(([m, t]) => `<span class="${m ? 'met' : ''}">${ic(m ? 'check-circle' : 'circle-dashed')}${t}</span>`).join('')}</div>` };
}
const pwField = (id, label, val, err, extra = '') => field(label, `<div class="inp-wrap" style="position:relative">${ic('lock-simple')}<input class="inp ${err ? 'invalid' : ''}" id="${id}" type="password" value="${esc(val || '')}" autocomplete="new-password" ${extra}></div>`, { err, for: id });
const isEmail = v => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
const ssoBtns = () => `<div class="col gap8">${btn('Continue with Google', { v: 'outline', size: 'lg', block: true, i: 'google-logo', act: 'sso', arg: 'Google', test: 'sso-google' })}${btn('Continue with Microsoft', { v: 'outline', size: 'lg', block: true, i: 'windows-logo', act: 'sso', arg: 'Microsoft' })}${btn('Single sign-on (SAML)', { v: 'outline', size: 'lg', block: true, i: 'key', act: 'samlStart', test: 'sso-saml' })}</div>`;

/* Sign in */
screen('signin', {
  t: 'Sign in', layout: 'public', ws: 'public',
  render() {
    const st = ui('signin', { email: '', err: {}, show: false, fails: 0, saml: false });
    const e = st.err; const locked = st.fails >= 5;
    let banner = '';
    if (S.ui.resetBanner) banner = alertBox('ok', 'Password changed', 'Sign in with your new password. You were signed out of other devices.');
    else if (S.ui.timedOut) banner = alertBox('warn', 'You were signed out', 'Your session ended after 15 minutes without activity. Sign in again to continue.', '', 'clock');
    else if (S.ui.signedOut) banner = alertBox('info', 'You have signed out', '');
    if (st.saml) return authPage(`<div>${lockup(false, 26)}<h2 class="h1" style="margin-top:28px">Single sign-on</h2><p class="muted" style="margin-top:6px">Enter your work email. We will send you to your organisation's sign-in page.</p></div>
      <form class="col gap16" data-form="saml" novalidate>${field('Work email', inp('saml-email', st.email, { type: 'email', ph: 'name@organisation.gov.ng', invalid: e.saml }), { err: e.saml, for: 'saml-email' })}${btn('Continue', { type: 'submit', size: 'lg', block: true, test: 'saml-go' })}</form>
      <button class="link-btn small" style="align-self:flex-start" data-act="samlBack">${ic('arrow-left')} Back to sign in</button>`);
    return authPage(`
      <div>${lockup(false, 26)}<h2 class="h1" style="margin-top:28px">Sign in</h2><p class="muted" style="margin-top:6px">Regulators, supervised organisations and assurance firms all sign in here. We take you to your workspace.</p></div>
      ${banner}
      ${locked ? alertBox('bad', 'Too many attempts', 'This account is locked for 15 minutes to keep it safe. Reset your password to get back in sooner.', btn('Reset password', { v: 'secondary', size: 'sm', go: 'reset' }), 'lock-simple') : e.form ? alertBox('bad', 'Email or password is incorrect', `Check both and try again. ${5 - st.fails} attempt${5 - st.fails === 1 ? '' : 's'} left before the account locks for 15 minutes.`) : ''}
      <form class="col gap16" data-form="signin" novalidate>
        ${field('Email', inp('si-email', st.email, { type: 'email', ph: 'name@organisation.com', invalid: e.email, attrs: 'autocomplete="username"' + (locked ? ' disabled' : '') }), { err: e.email, for: 'si-email' })}
        ${field('Password', `<div class="inp-wrap" style="position:relative">${ic('lock-simple')}<input class="inp ${e.pw ? 'invalid' : ''}" id="si-pw" type="${st.show ? 'text' : 'password'}" autocomplete="current-password" placeholder="Your password" ${locked ? 'disabled' : ''}><span class="suffix"><button type="button" class="icon-btn" data-act="togglePw" aria-label="${st.show ? 'Hide' : 'Show'} password">${ic(st.show ? 'eye-slash' : 'eye')}</button></span></div>`, { err: e.pw, for: 'si-pw' })}
        <div class="row between">${ck('si-rem', 'Keep me signed in', true)}<a href="#reset" data-go="reset" class="small strong" data-test="forgot">Forgot password?</a></div>
        ${btn('Sign in', { type: 'submit', size: 'lg', block: true, test: 'signin-submit', disabled: locked })}
      </form>
      <div class="col gap6 small muted"><span>Organisation not invited yet? <a href="#register" data-go="register" class="strong">Register your organisation</a></span><span>New to SuperAtlas? <a href="#demo" data-go="demo" class="strong">Book a demo</a></span></div>
      ${demoAccounts()}
    `);
  }
});
ACT.togglePw = () => { const st = ui('signin'); st.email = val('si-email'); st.show = !st.show; render(); };
function clearAuthBanners() { S.ui.resetBanner = S.ui.timedOut = S.ui.signedOut = false; }
ACT.form_signin = () => {
  const st = ui('signin'); const em = val('si-email').toLowerCase(), pw = $('#si-pw').value; const e = {};
  st.email = em;
  if (!isEmail(em)) e.email = 'Enter the email address you were invited with';
  if (!pw) e.pw = 'Enter your password';
  if (!e.email && !e.pw && !S.accounts[em]) { st.fails++; e.form = true; }
  st.err = e; clearAuthBanners();
  if (Object.keys(e).length) return render();
  st.fails = 0; signInAs(em); S.ui.mfaNext = WS[S.ws].home; go('verify');
};
ACT.sso = (provider) => {
  const em = (val('si-email') || '').toLowerCase();
  signInAs(S.accounts[em] ? em : DEFAULT_ACCT.regulator); clearAuthBanners();
  toast(`Signed in with ${provider}. Your ${provider} account handles the second step.`, 'ok', 'key');
  addAudit('Signed in', `${provider} single sign-on`); go(WS[S.ws].home);
};
ACT.samlStart = () => { const st = ui('signin'); st.email = val('si-email'); st.saml = true; st.err = {}; render(); };
ACT.samlBack = () => { ui('signin').saml = false; render(); };
ACT.form_saml = () => {
  const st = ui('signin'); const em = val('saml-email').toLowerCase(); st.email = em;
  if (!isEmail(em)) { st.err = { saml: 'Enter your work email' }; return render(); }
  const dom = em.split('@')[1];
  if (!Object.keys(S.accounts).some(a => a.endsWith('@' + dom))) { st.err = { saml: `Single sign-on is not set up for ${dom}. Sign in with your password instead.` }; return render(); }
  st.saml = false; st.err = {}; clearAuthBanners();
  signInAs(S.accounts[em] ? em : Object.keys(S.accounts).find(a => a.endsWith('@' + dom)));
  toast(`Redirected to ${dom} sign-in and back`, 'ok', 'key'); addAudit('Signed in', 'SAML single sign-on'); go(WS[S.ws].home);
};

/* A02 MFA code */
screen('verify', {
  t: 'Enter MFA code', d: '6-digit code with error state', layout: 'public', ws: 'public',
  render() {
    const st = ui('mfa', { err: false, recovery: false });
    return authPage(st.recovery ? `
      <div>${tile('key', '', 'lg')}<h2 class="h1" style="margin-top:16px">Use a recovery code</h2><p class="muted" style="margin-top:6px">Enter one of the 10 codes you saved when you set up MFA. Each code works once.</p></div>
      <form class="col gap16" data-form="recovery">${field('Recovery code', inp('rc', '', { ph: 'XXXX-XXXX', attrs: 'style="font-family:var(--mono);letter-spacing:.1em"' }), { for: 'rc' })}${btn('Continue', { type: 'submit', size: 'lg', block: true })}</form>
      <button class="link-btn small" data-act="mfaRecovery">Use authenticator code instead</button>` : `
      <div>${tile('fingerprint', '', 'lg')}<h2 class="h1" style="margin-top:16px">Enter your 6-digit code</h2><p class="muted" style="margin-top:6px">Open your authenticator app and enter the code for <b style="color:var(--text)">SuperAtlas</b>.</p></div>
      ${st.err ? alertBox('bad', 'That code did not work', 'Codes change every 30 seconds. Enter the newest code from your app.') : ''}
      <form class="col gap20" data-form="mfa" novalidate>
        <div class="otp ${st.err ? 'invalid' : ''}" id="otp">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" data-otp="${i}">`).join('')}</div>
        ${ck('mfa-trust', 'Trust this device for 30 days', false)}
        ${btn('Verify', { type: 'submit', size: 'lg', block: true, test: 'mfa-submit' })}
      </form>
      <div class="col gap8"><button class="link-btn small" style="align-self:flex-start" data-act="mfaRecovery">Use a recovery code</button><span class="cap muted">Lost your device? Ask your workspace admin to reset MFA.</span></div>
      ${demoNote('Demo: any 6 digits work, except 000000, which shows the error.')}`);
  },
  mount() { bindOtp(); }
});
function bindOtp() {
  const ins = $$('[data-otp]');
  ins.forEach((el, i) => {
    el.addEventListener('input', () => { el.value = el.value.replace(/\D/g, '').slice(-1); if (el.value && ins[i + 1]) ins[i + 1].focus(); });
    el.addEventListener('keydown', e => { if (e.key === 'Backspace' && !el.value && ins[i - 1]) ins[i - 1].focus(); });
    el.addEventListener('paste', e => { const t = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6); if (t.length) { e.preventDefault(); ins.forEach((x, j) => x.value = t[j] || ''); (ins[t.length] || ins[5]).focus(); } });
  });
  ins[0] && ins[0].focus();
}
const otpVal = () => $$('[data-otp]').map(x => x.value).join('');
ACT.mfaRecovery = () => { const st = ui('mfa'); st.recovery = !st.recovery; st.err = false; render(); };
ACT.form_recovery = () => { toast('Recovery code accepted. 9 codes left.', 'ok', 'key'); finishSignin(); };
ACT.form_mfa = () => {
  const st = ui('mfa'); const code = otpVal();
  if (code.length < 6 || code === '000000') { st.err = true; render(); return; }
  st.err = false; finishSignin();
};
function finishSignin() { const next = S.ui.mfaNext || WS[S.ws].home; S.ui.mfaNext = null; addAudit('Signed in', 'Session started'); toast(`Signed in as ${persona().name}`, 'ok', 'sign-in'); go(next); }

/* A03 Set up MFA */
screen('mfa-setup', {
  t: 'Set up MFA', d: 'QR code, confirm, recovery codes', layout: 'public', ws: 'public',
  render() {
    const st = ui('mfaSetup', { step: 0, err: false, copied: false });
    const codes = ['7KQ2-M9XD', 'P4TR-8WNA', 'H3VB-2LCE', 'Q9ZF-6YKS', 'D8MJ-4RPU', 'N2XW-7GHT', 'B6CL-3QVE', 'W5KA-9DMR', 'T7YP-1FSN', 'J4EG-8BUL'];
    const steps = stepper(['Scan', 'Confirm', 'Save codes'], st.step);
    let inner;
    if (st.step === 0) inner = `<div><h2 class="h1">Set up multi-factor authentication</h2><p class="muted" style="margin-top:6px">Every SuperAtlas account uses a second step. It takes about a minute.</p></div>${steps}
      <div class="row top gap20 wrap"><div class="qr">${qrSvg()}</div><div class="col gap8 grow" style="min-width:200px"><b>1. Open an authenticator app</b><span class="muted small">Microsoft Authenticator, Google Authenticator or similar.</span><b style="margin-top:8px">2. Scan this code</b><span class="muted small">Can't scan? Enter this key instead:</span><span class="mono" style="background:var(--surface-subtle);padding:8px 10px;border-radius:8px;overflow-wrap:anywhere">JBSW Y3DP EHPK 3PXP</span></div></div>
      ${btn('I have scanned the code', { size: 'lg', block: true, act: 'mfaStep', arg: '1', test: 'mfa-scanned' })}`;
    else if (st.step === 1) inner = `<div><h2 class="h1">Enter the code from your app</h2><p class="muted" style="margin-top:6px">This confirms the app is set up correctly.</p></div>${steps}
      ${st.err ? alertBox('bad', 'That code did not match', 'Make sure you scanned the code on the previous step, then enter the newest code.') : ''}
      <form class="col gap20" data-form="mfaSetup"><div class="otp ${st.err ? 'invalid' : ''}">${[0, 1, 2, 3, 4, 5].map(i => `<input inputmode="numeric" maxlength="1" aria-label="Digit ${i + 1}" data-otp="${i}">`).join('')}</div>
      <div class="row">${btn('Back', { v: 'outline', act: 'mfaStep', arg: '0' })}${btn('Confirm', { type: 'submit', cls: 'grow', test: 'mfa-confirm' })}</div></form>${demoNote('Demo: any 6 digits work, except 000000.')}`;
    else inner = `<div><h2 class="h1">Save your recovery codes</h2><p class="muted" style="margin-top:6px">If you lose your phone, each code lets you sign in once. Store them somewhere safe, away from your phone.</p></div>${steps}
      <div class="codes" id="codes">${codes.map(c => `<span>${c}</span>`).join('')}</div>
      <div class="row">${btn(st.copied ? 'Copied' : 'Copy codes', { v: 'secondary', i: st.copied ? 'check' : 'copy', act: 'copyCodes' })}</div>
      ${ck('mfa-saved', 'I have saved my recovery codes', false, { attrs: 'data-test="codes-saved"' })}
      ${btn('Finish setup', { size: 'lg', block: true, act: 'mfaFinish', test: 'mfa-finish' })}`;
    return authPage(inner);
  },
  mount() { bindOtp(); }
});
function qrSvg() {
  let s = ''; let seed = 7;
  const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  for (let y = 0; y < 25; y++) for (let x = 0; x < 25; x++) {
    const finder = (x < 7 && y < 7) || (x > 17 && y < 7) || (x < 7 && y > 17);
    if (finder) continue;
    if (rnd() > .52) s += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
  }
  const f = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg viewBox="0 0 25 25" width="100%" height="100%" shape-rendering="crispEdges" fill="#101115" role="img" aria-label="QR code for authenticator app">${s}${f(0, 0)}${f(18, 0)}${f(0, 18)}</svg>`;
}
ACT.mfaStep = (n) => { ui('mfaSetup').step = +n; ui('mfaSetup').err = false; render(); };
ACT.form_mfaSetup = () => { const st = ui('mfaSetup'); const c = otpVal(); if (c.length < 6 || c === '000000') { st.err = true; return render(); } st.step = 2; st.err = false; render(); };
ACT.copyCodes = () => {
  const txt = $$('#codes span').map(x => x.textContent).join('\n');
  const done = () => { ui('mfaSetup').copied = true; render(); toast('Recovery codes copied'); };
  try { navigator.clipboard.writeText(txt).then(done, () => { selectCodes(); }); } catch (e) { selectCodes(); }
};
function selectCodes() { const r = document.createRange(); r.selectNodeContents($('#codes')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('Codes selected. Press Ctrl+C to copy.', 'info', 'copy'); }
ACT.mfaFinish = () => {
  if (!val('mfa-saved')) { toast('Tick the box to confirm you saved your codes', 'warn'); return; }
  S.mfaDevices = [{ name: 'Authenticator app', added: 'Today', last: 'Just now' }];
  addAudit('Set up MFA', 'Authenticator app added'); toast('Multi-factor authentication is on', 'ok', 'shield-check');
  const nx = S.ui.inviteNext || WS[S.ws].home; S.ui.inviteNext = null; go(nx);
};

/* Invitations: the email, then accept and set a password, then MFA, then first-time setup */
const INVITES = {
  invitation: { ws: 'regulator', acct: 'm.bello@nitda.gov.ng', fromName: 'RegTech365 onboarding', fromAddr: 'onboarding@superatlas.example', brand: 'superatlas', subject: 'Set up NITDA on SuperAtlas', ent: 'NITDA', entFull: 'National Information Technology Development Agency', role: 'Workspace admin', by: 'RegTech365 onboarding team', next: 'welcome',
    body: 'RegTech365 has created a SuperAtlas workspace for the National Information Technology Development Agency. As the workspace admin, you will confirm your profile and branding, then invite your team.' },
  'invitation/zenith': { ws: 'organisation', acct: 'a.okonkwo@zenith.example', org: 'zenith', fromName: 'NITDA', fromAddr: 'no-reply@superatlas.nitda.gov.ng', brand: 'tenant', subject: 'NITDA invites Zenith Bank Plc to SuperAtlas', ent: 'Zenith Bank Plc', role: 'Organisation admin', by: 'M. Bello, NITDA', next: 'org/welcome',
    body: 'NITDA supervises Zenith Bank Plc as a Commercial bank · National. Accept this invitation to set up your organisation. You will answer requirements and file returns here.' },
  'invitation/deloitte': { ws: 'firm', acct: 't.adebayo@deloitte.example', firm: 'deloitte', fromName: 'NITDA', fromAddr: 'no-reply@superatlas.nitda.gov.ng', brand: 'tenant', subject: 'NITDA invites Deloitte & Touche (Nigeria) to SuperAtlas', ent: 'Deloitte & Touche (Nigeria)', role: 'Firm admin', by: 'M. Bello, NITDA', next: 'firm/welcome',
    body: 'Deloitte & Touche (Nigeria) is accredited by NITDA for Audit & assurance and Cybersecurity assessor work. Accept this invitation to set up your firm and add your assessors.' }
};
function inviteEmail(inv, id) {
  const t = S.tenant; const sa = inv.brand === 'superatlas';
  const mark = sa ? meridian(30) : tenantMark(32);
  return `<div class="mail" style="box-shadow:var(--e1)"><div class="mh"><b style="color:var(--text);font-size:14px">${esc(inv.subject)}</b><span>From: ${esc(inv.fromName)} &lt;${esc(inv.fromAddr)}&gt;</span><span>To: ${esc(inv.acct)}</span></div>
    <div style="height:5px;background:${sa ? 'var(--brand-500)' : t.col}"></div>
    <div class="mb col gap16"><div class="row gap8">${mark}<b>${sa ? 'SuperAtlas' : esc(t.name)}</b></div><p class="small">Hello ${esc(S.accounts[inv.acct].first)},</p><p class="small">${esc(inv.body)}</p>
      ${kv([['Workspace', esc(inv.ent)], ['Your role', esc(inv.role)], ['Invited by', esc(inv.by)]])}
      ${btn('Accept invitation', { act: 'invOpen', arg: id, test: 'inv-open' })}
      <p class="cap muted">This link expires in ${esc(S.deadlines.inviteExpiry)} days and works once. If you were not expecting it, ignore this email.${sa ? '' : ' Powered by SuperAtlas.'}</p></div></div>`;
}
function inviteScreen(id) {
  return {
    t: 'Accept invitation', layout: 'public', ws: 'public',
    render() {
      const inv = INVITES[id]; const st = ui('accept_' + id, { step: 0, pw: '', err: {} }); const e = st.err;
      if (st.step === 0) return `<div class="inbox"><div class="inbox-bar">${ic('envelope-simple')}<b>Inbox</b><span class="cap muted">${esc(inv.acct)}</span></div><div class="inbox-body">${inviteEmail(inv, id)}</div></div>`;
      const r = pwRules(st.pw);
      return authPage(`
        <div>${lockup(false, 26)}<h2 class="h1" style="margin-top:28px">Accept your invitation</h2><p class="muted" style="margin-top:6px">Create a password for ${esc(inv.acct)}. Next, you will set up multi-factor authentication.</p></div>
        <div class="card flat tight row">${inv.ws === 'regulator' ? tenantMark(40) : logo(inv.org ? S.orgs[inv.org] : S.firms[inv.firm], 40)}<div class="grow"><div class="strong">${esc(inv.ent)}</div><div class="cap muted">${esc(inv.role)} · invited by ${esc(inv.by)}</div></div></div>
        <form class="col gap16" data-form="accept" data-arg="${id}" novalidate>
          ${field('Full name', inp('ac-name', S.accounts[inv.acct].name, { invalid: e.name }), { err: e.name, for: 'ac-name' })}
          ${pwField('ac-pw', 'Create a password', st.pw, e.pw)}
          <div id="pw-rules">${r.html}</div>
          ${pwField('ac-pw2', 'Confirm password', '', e.pw2)}
          ${ck('ac-terms', 'I accept the <a href="#signin">terms of use</a> and <a href="#signin">privacy notice</a>.', false)}${e.terms ? `<div class="field"><div class="err">${ic('warning-circle')}${e.terms}</div></div>` : ''}
          ${btn('Accept and continue', { type: 'submit', size: 'lg', block: true, ir: 'arrow-right', test: 'accept-submit' })}
        </form>`);
    },
    mount() { const p = $('#ac-pw'); p && p.addEventListener('input', () => { ui('accept_' + id).pw = p.value; $('#pw-rules').innerHTML = pwRules(p.value).html; }); }
  };
}
Object.keys(INVITES).forEach(id => screen(id, inviteScreen(id)));
ACT.invOpen = (id) => { ui('accept_' + id, { step: 0, pw: '', err: {} }).step = 1; render(); window.scrollTo(0, 0); };
ACT.form_accept = (f) => {
  const id = f.dataset.arg; const inv = INVITES[id]; const st = ui('accept_' + id); const pw = $('#ac-pw').value, pw2 = $('#ac-pw2').value; const e = {};
  st.pw = pw;
  if (!val('ac-name')) e.name = 'Enter your full name';
  if (!pwRules(pw).ok) e.pw = 'Your password needs to meet all four rules';
  else if (pw !== pw2) e.pw2 = 'The two passwords do not match';
  if (!val('ac-terms')) e.terms = 'Accept the terms to continue';
  st.err = e;
  if (Object.keys(e).length) return render();
  signInAs(inv.acct);
  if (inv.ws === 'regulator') { S.tenant.onboarded = false; S.ui.wiz = undefined; }
  if (inv.org) { S.orgId = inv.org; S.orgs[inv.org].onboard = { profile: false, logo: false, officers: false, people: false, group: false }; S.ui.obStep = undefined; }
  if (inv.firm) { S.firmId = inv.firm; S.firms[inv.firm].onboard = { profile: false, logo: false, people: false, clients: false }; S.ui.fbStep = undefined; }
  S.ui.inviteNext = inv.next; S.ui.mfaSetup = undefined; S.ui['accept_' + id] = undefined;
  addAudit('Accepted invitation', inv.ent); toast('Password set. Now protect your account.', 'ok', 'lock-simple'); go('mfa-setup');
};

/* Forgot password: request → email sent → open link → new password → success → sign in with banner.
   Edge states: link expired (older email), resend, too many requests. */
screen('reset', {
  t: 'Reset password', layout: 'public', ws: 'public',
  render() {
    const st = ui('reset', { step: 'request', email: '', err: {}, pw: '', sends: 0 }); const e = st.err;
    const back = `<a href="#signin" data-go="signin" class="small strong">${ic('arrow-left')} Back to sign in</a>`;
    let inner;
    if (st.step === 'request') inner = `<div>${lockup(false, 26)}<h2 class="h1" style="margin-top:28px">Reset your password</h2><p class="muted" style="margin-top:6px">Enter the email you sign in with. If it matches an account, we will send a link that works once, for 30 minutes.</p></div>
      <form class="col gap16" data-form="resetReq" novalidate>${field('Email', inp('rs-email', st.email, { type: 'email', ph: 'name@organisation.com', invalid: e.email }), { err: e.email, for: 'rs-email' })}${btn('Send reset link', { type: 'submit', size: 'lg', block: true, test: 'reset-send' })}</form>${back}`;
    else if (st.step === 'sent') inner = `${tile('envelope-simple', 'info', 'lg')}<div><h2 class="h1">Check your email</h2><p class="muted" style="margin-top:6px">If <b style="color:var(--text)">${esc(st.email)}</b> has an account, a reset link is on its way. It expires in 30 minutes. Check your spam folder if it does not arrive.</p></div>
      ${st.sends > 1 ? alertBox('info', 'New link sent', 'Only the newest link works. Older links have stopped working.') : ''}
      <div class="col gap8"><div class="overline">Your inbox</div>${Array.from({ length: st.sends }, (_, i) => st.sends - 1 - i).map((n, i) => `<div class="mail-row ${i ? 'old' : ''}">${ic('envelope-simple')}<div class="grow"><div class="strong small">Reset your SuperAtlas password</div><div class="cap muted">no-reply@superatlas.example · ${i === 0 ? 'just now' : (i * 2) + ' minutes ago'}</div></div>${btn('Open link', { v: i ? 'outline' : 'secondary', size: 'sm', act: i ? 'resetExpired' : 'resetOpen', test: i ? 'reset-old' : 'reset-open' })}</div>`).join('')}</div>
      <div class="row between"><button class="link-btn small" data-act="resetResend" data-test="reset-resend">Resend link</button><button class="link-btn small" data-act="resetStep" data-arg="request">Use a different email</button></div>${back}`;
    else if (st.step === 'expired') inner = `${tile('link-break', 'warn', 'lg')}<div><h2 class="h1">This link has expired</h2><p class="muted" style="margin-top:6px">Reset links work once and stop working after 30 minutes, or when a newer link is sent. Ask for a new one.</p></div>${btn('Send a new link', { size: 'lg', block: true, act: 'resetResend', test: 'reset-new' })}${back}`;
    else if (st.step === 'limit') inner = `${tile('lock-simple', 'bad', 'lg')}<div><h2 class="h1">Too many requests</h2><p class="muted" style="margin-top:6px">We have sent 3 reset links in the last 15 minutes. To protect the account, wait 15 minutes before asking again. Use the newest link if you have it.</p></div>${btn('Back to sign in', { v: 'outline', size: 'lg', block: true, go: 'signin' })}`;
    else if (st.step === 'set') { const r = pwRules(st.pw); inner = `<div>${lockup(false, 26)}<h2 class="h1" style="margin-top:28px">Choose a new password</h2><p class="muted" style="margin-top:6px">For ${esc(st.email)}. Saving signs you out of every other device.</p></div>
      <form class="col gap16" data-form="resetSet" novalidate>${pwField('rs-pw', 'New password', st.pw, e.pw)}<div id="pw-rules">${r.html}</div>${pwField('rs-pw2', 'Confirm new password', '', e.pw2)}${btn('Save new password', { type: 'submit', size: 'lg', block: true, test: 'reset-save' })}</form>`; }
    else inner = `${tile('check-circle', 'solid ok', 'lg')}<div><h2 class="h1">Password changed</h2><p class="muted" style="margin-top:6px">Your new password is saved and other devices have been signed out. Sign in to continue.</p></div>${btn('Go to sign in', { size: 'lg', block: true, act: 'resetDone', test: 'reset-done' })}`;
    return authPage(inner);
  },
  mount() { const p = $('#rs-pw'); p && p.addEventListener('input', () => { ui('reset').pw = p.value; $('#pw-rules').innerHTML = pwRules(p.value).html; }); }
});
ACT.form_resetReq = () => { const st = ui('reset'); st.email = val('rs-email'); st.err = {}; if (!isEmail(st.email)) { st.err.email = 'Enter a valid email address'; return render(); } st.sends = 1; st.step = 'sent'; render(); };
ACT.resetStep = (n) => { ui('reset').step = n; render(); };
ACT.resetOpen = () => { ui('reset').step = 'set'; render(); };
ACT.resetExpired = () => { ui('reset').step = 'expired'; render(); };
ACT.resetResend = () => { const st = ui('reset'); if (st.sends >= 3) { st.step = 'limit'; return render(); } st.sends++; st.step = 'sent'; render(); toast('New reset link sent', 'ok', 'envelope-simple'); };
ACT.form_resetSet = () => { const st = ui('reset'); const pw = $('#rs-pw').value, pw2 = $('#rs-pw2').value; st.pw = pw; st.err = {}; if (!pwRules(pw).ok) st.err.pw = 'Your password needs to meet all four rules'; else if (pw !== pw2) st.err.pw2 = 'The two passwords do not match'; if (Object.keys(st.err).length) return render(); st.step = 'done'; render(); };
ACT.resetDone = () => { const em = ui('reset').email; S.ui.reset = undefined; S.ui.signin = { email: em, err: {}, show: false, fails: 0 }; clearAuthBanners(); S.ui.resetBanner = true; go('signin'); };

/* Switch workspace: only for people with more than one membership */

ACT.switchWs = (arg) => { const [ws, id] = arg.split('|'); S.ws = ws; if (ws === 'organisation') S.orgId = id; if (ws === 'firm') S.firmId = id; toast(`Switched to ${esc(ws === 'firm' ? S.firms[id].name : S.orgs[id].name)}`, 'ok', 'arrows-down-up'); go(WS[ws].home); };

/* A08 Notifications */
screen('notifications', {
  t: 'Notifications', d: 'Filter, read, open linked item', layout: 'app', ws: 'any', crumbs: () => ['Notifications'],
  render() {
    const f = ui('nf', 'All');
    const mine = S.notifications.filter(notifMine);
    const list = mine.filter(n => f === 'All' ? true : f === 'Unread' ? n.unread : n.kind === f);
    const kinds = ['All', 'Unread', 'Approvals', 'Mentions', 'Reminders', 'Updates'];
    return `${pageHead({ over: 'Inbox', title: 'Notifications', sub: 'Everything that needs your attention, newest first. Email digests follow your preferences in My account.', actions: btn('Mark all as read', { v: 'secondary', i: 'check', act: 'markAll' }) + btn('Preferences', { v: 'outline', i: 'gear-six', act: 'notifPrefs' }) })}
      <div class="pills">${kinds.map(k => { const c = k === 'All' ? mine.length : k === 'Unread' ? mine.filter(n => n.unread).length : mine.filter(n => n.kind === k).length; return `<button class="pill ${f === k ? 'on' : ''}" data-act="nf" data-arg="${k}">${k}${count(c)}</button>`; }).join('')}</div>
      <div class="card p0">${list.length ? list.map(n => `<button class="row" style="width:100%;border:0;background:${n.unread ? 'var(--brand-50)' : 'transparent'};padding:16px 24px;border-top:1px solid var(--border);text-align:left;cursor:pointer" data-act="openNotif" data-arg="${n.id}" data-test="notif-${n.id}">${tile(n.i, n.tone || '', '')}<div class="grow"><div class="${n.unread ? 'semi' : ''}">${esc(n.title)}</div><div class="cap muted" style="margin-top:2px">${esc(n.when)} · ${esc(n.kind)}</div></div>${n.unread ? '<span class="dot" style="background:var(--brand-500)"></span>' : ''}${ic('caret-right')}</button>`).join('') : empty('tray', 'Nothing here', 'No notifications match this filter.')}</div>`;
  }
});
ACT.nf = (k) => { S.ui.nf = k; render(); };
ACT.notifPrefs = () => { S.ui.acctTab = 'notif'; go('account'); };

/* A09 My account */
screen('account', {
  t: 'My account', d: 'Profile, security, notifications, sessions', layout: 'app', ws: 'any', crumbs: () => ['Account', 'My account'],
  render() {
    const p = persona(); const t = ui('acctTab', 'profile');
    let body = '';
    if (t === 'profile') body = `<div class="card col gap20"><div class="row">${av(p.ini, 40)}<div class="grow"><div class="h4">${esc(p.name)}</div><div class="muted small">${esc(p.email)}</div></div>${btn('Change photo', { v: 'outline', size: 'sm', i: 'upload-simple', act: 'fakeUpload', arg: 'Profile photo updated' })}</div>
      <form class="grid g2" data-form="profile" style="gap:16px">${field('Full name', inp('pf-name', p.name), { for: 'pf-name' })}${field('Job title', inp('pf-role', p.role), { for: 'pf-role' })}${field('Email', inp('pf-email', p.email, { ro: true }), { hint: 'Your workspace admin can change your email.', for: 'pf-email' })}${field('Phone', inp('pf-phone', '+234 803 000 0000'), { opt: true, for: 'pf-phone' })}<div class="row end" style="grid-column:1/-1">${btn('Save changes', { type: 'submit' })}</div></form></div>`;
    if (t === 'security') body = `<div class="card col gap16"><div class="h4">Password</div><p class="muted small">Last changed 3 months ago.</p><div>${btn('Change password', { v: 'secondary', act: 'changePw' })}</div></div>
      <div class="card col gap16"><div class="row"><div class="grow"><div class="h4">Multi-factor authentication</div><p class="muted small">Required by your workspace. You cannot turn it off.</p></div>${chip('On', 'ok', 'shield-check')}</div>
        ${S.mfaDevices.map(d => `<div class="file">${tile('fingerprint', '', 'sm')}<div class="grow"><div class="strong">${esc(d.name)}</div><div class="cap muted">Added ${esc(d.added)} · last used ${esc(d.last)}</div></div>${btn('Remove', { v: 'tertiary', size: 'sm', act: 'removeMfa' })}</div>`).join('')}
        <div class="row">${btn('Add another device', { v: 'outline', i: 'plus', go: 'mfa-setup' })}${btn('New recovery codes', { v: 'tertiary', i: 'key', act: 'newCodes' })}</div></div>`;
    if (t === 'notif') { const ev = [['Approvals waiting for me', 1, 1], ['Mentions and comments', 1, 1], ['Deadlines and reminders', 1, 1], ['Status updates', 1, 0], ['Weekly summary', 0, 1]]; body = `<div class="card p0"><div class="tbl-wrap"><table class="tbl perm"><thead><tr><th>Event</th><th>In the app</th><th>Email</th></tr></thead><tbody>${ev.map(([n, a, b], i) => `<tr><td>${n}</td><td>${sw('ne-a' + i, a)}</td><td>${sw('ne-b' + i, b)}</td></tr>`).join('')}</tbody></table></div></div>
      <div class="card col gap16" style="max-width:520px">${field('Email digest', sel('dig', ['Off', 'Daily at 08:00', 'Weekly on Monday'], 'Daily at 08:00'), { for: 'dig' })}<div class="row end">${btn('Save preferences', { act: 'savedToast', arg: 'Notification preferences saved' })}</div></div>`; }
    if (t === 'sessions') body = `<div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Device</th><th>Location</th><th>Last active</th><th></th></tr></thead><tbody>${S.sessions.map((s, i) => `<tr><td><div class="row gap8">${ic(s.dev.includes('iPhone') ? 'phone' : 'cpu')}${esc(s.dev)}</div></td><td>${esc(s.where)}</td><td>${s.cur ? chip('This device', 'ok') : esc(s.when)}</td><td style="text-align:right">${s.cur ? '' : btn('Sign out', { v: 'tertiary', size: 'sm', act: 'killSession', arg: i })}</td></tr>`).join('')}</tbody></table></div></div><div>${btn('Sign out of all other devices', { v: 'danger-soft', i: 'sign-out', act: 'killAll' })}</div>`;
    return `${pageHead({ over: 'Account', title: 'My account' })}${tabs([{ id: 'profile', label: 'Profile' }, { id: 'security', label: 'Security' }, { id: 'notif', label: 'Notifications' }, { id: 'sessions', label: 'Sessions', count: S.sessions.length }], t, 'acctTab')}${body}`;
  }
});
ACT.acctTab = (t) => { S.ui.acctTab = t; render(); };
ACT.form_profile = () => { toast('Profile saved'); addAudit('Updated profile', 'My account'); };
ACT.savedToast = (m) => toast(m || 'Saved');
ACT.fakeUpload = (m) => toast(m || 'Uploaded', 'ok', 'upload-simple');
ACT.changePw = () => openDialog(`${dlgHead('Change password', 'You will stay signed in on this device.', 'lock-simple')}<form class="col gap16" data-form="chgPw">${field('Current password', '<input class="inp" type="password" id="cp0">', { for: 'cp0' })}${field('New password', '<input class="inp" type="password" id="cp1">', { hint: 'At least 12 characters with upper and lower case, a number and a symbol.', for: 'cp1' })}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Change password', { type: 'submit' })}</div></form>`);
ACT.form_chgPw = () => { if (!pwRules($('#cp1').value).ok) { toast('The new password does not meet the rules', 'bad'); return; } closeDialog(); toast('Password changed'); addAudit('Changed password', 'My account'); };
ACT.removeMfa = () => openDialog(`${dlgHead('You need at least one device', 'MFA is required by your workspace. Add a new device before removing this one.', 'warning', 'warn')}<div class="row end">${btn('Add a device', { go: 'mfa-setup' })}</div>`);
ACT.newCodes = () => openDialog(`${dlgHead('Create new recovery codes?', 'Your old codes will stop working immediately.', 'key')}<div class="row end">${btn('Cancel', { v: 'outline', act: 'closeDialog' })}${btn('Create new codes', { act: 'newCodesGo' })}</div>`);
ACT.newCodesGo = () => { closeDialog(); S.ui.mfaSetup = { step: 2, err: false, copied: false }; go('mfa-setup'); };
ACT.killSession = (i) => { S.sessions.splice(+i, 1); render(); toast('Device signed out'); };
ACT.killAll = () => { S.sessions = S.sessions.filter(s => s.cur); render(); toast('Signed out of all other devices'); addAudit('Signed out other sessions', 'My account'); };

/* A10 Audit trail */
screen('audit', {
  t: 'Audit trail', d: 'Filter by person, record and date', layout: 'app', ws: 'any', crumbs: () => ['Audit trail'],
  render() {
    const f = ui('af', { who: 'Anyone', q: '', range: 'Last 30 days' });
    const scope = S.ws === 'regulator' ? S.audit : S.audit.filter(a => a.ws === S.ws || a.ws === 'all');
    const people = ['Anyone', ...new Set(scope.map(a => a.who))];
    const rows = scope.filter(a => (f.who === 'Anyone' || a.who === f.who) && (!f.q || (a.record + a.action).toLowerCase().includes(f.q.toLowerCase())));
    return `${pageHead({ over: 'Records', title: 'Audit trail', sub: S.ws === 'regulator' ? 'Every action across your workspace, organisations and firms. Entries cannot be edited or deleted.' : 'Every action in your workspace. Entries cannot be edited or deleted.', actions: btn('Export CSV', { v: 'outline', i: 'export', act: 'savedToast', arg: 'Export started. You will get an email when it is ready.' }) })}
      <form class="card tight row wrap" data-form="auditFilter" style="gap:12px"><div class="inp-wrap grow" style="min-width:220px">${ic('magnifying-glass')}<input class="inp" id="af-q" placeholder="Search records and actions" value="${esc(f.q)}"></div>${sel('af-who', people, f.who, { attrs: 'style="width:200px"' })}${sel('af-range', ['Today', 'Last 7 days', 'Last 30 days', 'This year'], f.range, { attrs: 'style="width:170px"' })}${btn('Apply', { type: 'submit', v: 'secondary', i: 'funnel' })}</form>
      <div class="card p0"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>When</th><th>Who</th><th>Action</th><th>Record</th><th></th></tr></thead><tbody>${rows.map((a, i) => `<tr class="click" data-act="auditRow" data-arg="${S.audit.indexOf(a)}"><td class="tnum muted small" style="white-space:nowrap">${esc(a.when)}</td><td><div class="row gap8">${av(a.ini, 24)}<span>${esc(a.who)}</span></div></td><td class="strong">${esc(a.action)}</td><td>${esc(a.record)}</td><td>${ic('caret-right')}</td></tr>`).join('') || `<tr><td colspan="5">${empty('funnel', 'No matching entries', 'Try a different person or search.')}</td></tr>`}</tbody></table></div></div>
      <p class="cap muted">Showing ${rows.length} of ${scope.length} entries.</p>`;
  }
});
ACT.form_auditFilter = () => { S.ui.af = { q: val('af-q'), who: val('af-who'), range: val('af-range') }; render(); };
ACT.auditRow = (i) => {
  const a = S.audit[+i];
  openDrawer(`<div class="row top"><div class="grow"><div class="overline">Audit entry</div><h2 class="h3" style="margin-top:4px">${esc(a.action)}</h2></div><button class="icon-btn" data-act="closeDrawer" aria-label="Close">${ic('x')}</button></div>
    ${kv([['When', esc(a.when)], ['Who', esc(a.who)], ['Workspace', esc(WS[a.ws] ? WS[a.ws].label : a.ws)], ['Record', esc(a.record)], ['IP address', esc(a.ip || '—')], ['Details', esc(a.detail || '—')]])}
    ${note('Audit entries are read-only. They are kept for 7 years.', 'lock-simple')}`);
};

/* A11 Search results */
screen('search', {
  t: 'Search results', d: 'Grouped results with filters', layout: 'app', ws: 'any', crumbs: () => ['Search'],
  render() {
    const q = (S.ui.q || 'bank').toLowerCase(); const f = ui('sf', 'All');
    const R = S.ws === 'regulator';
    const orgs = !R ? [] : Object.values(S.orgs).filter(o => (o.name + o.type).toLowerCase().includes(q));
    const reqs = S.regs.flatMap(r => r.sections.flatMap(s => s.reqs.map(x => Object.assign({ reg: r.name }, x)))).filter(x => (x.t + x.ref + x.text).toLowerCase().includes(q));
    const firms = !R ? [] : Object.values(S.firms).filter(o => (o.name + o.types.join(' ')).toLowerCase().includes(q));
    const people = !R ? [] : S.team.filter(p => (p.name + p.role + p.email).toLowerCase().includes(q));
    const groups = [['Organisations', orgs.length], ['Requirements', reqs.length], ['Assurance firms', firms.length], ['People', people.length]];
    const show = k => f === 'All' || f === k;
    return `${pageHead({ over: 'Search', title: `Results for “${esc(S.ui.q || 'bank')}”`, sub: `${orgs.length + reqs.length + firms.length + people.length} results` })}
      <div class="pills"><button class="pill ${f === 'All' ? 'on' : ''}" data-act="sf" data-arg="All">All</button>${groups.map(([g, c]) => `<button class="pill ${f === g ? 'on' : ''}" data-act="sf" data-arg="${g}">${g}${count(c)}</button>`).join('')}</div>
      ${show('Organisations') && orgs.length ? `<div class="card p0"><div style="padding:16px 24px" class="h4">Organisations</div>${orgs.map(o => `<button class="row" style="width:100%;border:0;background:none;padding:12px 24px;border-top:1px solid var(--border);cursor:pointer;text-align:left" data-act="openOrg" data-arg="${o.id}">${logo(o, 32)}<div class="grow"><div class="strong">${hl(o.name, q)}</div><div class="cap muted">${esc(o.type)}${o.tier ? ' · ' + esc(o.tier) : ''}</div></div>${statusChip(o.status)}</button>`).join('')}</div>` : ''}
      ${show('Requirements') && reqs.length ? `<div class="card p0"><div style="padding:16px 24px" class="h4">Requirements</div>${reqs.map(r => `<button class="row" style="width:100%;border:0;background:none;padding:12px 24px;border-top:1px solid var(--border);cursor:pointer;text-align:left" data-act="openReq" data-arg="${r.ref}">${tile('book-open-text', '', 'sm')}<div class="grow"><div class="strong">${hl(r.t, q)}</div><div class="cap muted">${r.ref} · ${esc(r.reg)}</div></div></button>`).join('')}</div>` : ''}
      ${show('Assurance firms') && firms.length ? `<div class="card p0"><div style="padding:16px 24px" class="h4">Assurance firms</div>${firms.map(o => `<button class="row" style="width:100%;border:0;background:none;padding:12px 24px;border-top:1px solid var(--border);cursor:pointer;text-align:left" data-act="openFirm" data-arg="${o.id}">${logo(o, 32)}<div class="grow"><div class="strong">${hl(o.name, q)}</div><div class="cap muted">${o.types.join(' · ')}</div></div>${statusChip(o.status)}</button>`).join('')}</div>` : ''}
      ${show('People') && people.length ? `<div class="card p0"><div style="padding:16px 24px" class="h4">People</div>${people.map(p => `<div class="row" style="padding:12px 24px;border-top:1px solid var(--border)">${av(p.ini)}<div class="grow"><div class="strong">${hl(p.name, q)}</div><div class="cap muted">${esc(p.role)} · ${esc(p.email)}</div></div></div>`).join('')}</div>` : ''}
      ${!(orgs.length + reqs.length + firms.length + people.length) ? `<div class="card">${empty('magnifying-glass', 'No results', 'Try a shorter word, or search by reference such as ISR-4.1.')}</div>` : ''}`;
  }
});
function hl(t, q) { const i = t.toLowerCase().indexOf(q); if (i < 0 || !q) return esc(t); return esc(t.slice(0, i)) + `<mark style="background:var(--accent-soft);border-radius:3px">${esc(t.slice(i, i + q.length))}</mark>` + esc(t.slice(i + q.length)); }
ACT.sf = (k) => { S.ui.sf = k; render(); };
ACT.openOrg = (id) => openRoute('organisations/profile', id + '|overview');
ACT.openFirm = (id) => openRoute('firms/profile', id + '|overview');
ACT.openReq = (ref) => { S.ui.reqRef = ref; go('library/requirement'); };


/* demo sign-ins: one click fills the form; the account decides which workspace opens */
const DEMO_ACCTS = [['Regulator', 'NITDA', 'm.bello@nitda.gov.ng', 'scales'], ['Organisation', 'Zenith Bank', 'a.okonkwo@zenith.example', 'buildings'], ['Organisation', 'Moniepoint (data returns)', 'c.obi@moniepoint.example', 'buildings'], ['Organisation', 'OPay (enforcement)', 'k.sule@opay.example', 'buildings'], ['Assurance firm', 'Deloitte', 't.adebayo@deloitte.example', 'briefcase']];
function demoAccounts() {
  return `<div class="demo-accts" data-test="demo-accts"><div class="row between"><span class="overline">Demo accounts</span><span class="cap muted">Prototype only · any password and any 6-digit code</span></div>${DEMO_ACCTS.map(([w, n, em, i]) => `<button class="demo-acct" data-act="demoFill" data-arg="${em}" data-test="demo-${em.split('@')[0]}">${tile(i, '', 'sm')}<span class="grow"><b>${esc(n)}</b><span>${esc(w)} · ${esc(em)}</span></span>${ic('arrow-right')}</button>`).join('')}</div>`;
}
ACT.demoFill = em => { const st = ui('signin'); st.email = em; st.err = {}; render(); const pw = $('#si-pw'); if (pw) pw.value = 'demo-password'; const b = $('[data-test="signin-submit"]'); b && b.focus(); };
