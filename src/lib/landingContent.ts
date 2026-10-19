import { ic, tile, btnA, esc } from "./markup";
import { lineChart, miniDash, AVG, LO, HI } from "./charts";

function card(i: string, t: string, p: string, cls = ""): string {
  return `<div class="mcard ${cls}"><span class="tl">${ic(i)}</span><b>${esc(t)}</b><p>${esc(p)}</p></div>`;
}

export function mkNav(): string {
  return `<header class="mk-nav"><div class="wrap">
    <a href="/" aria-label="SuperAtlas home"><span class="row gap8" style="gap:10px"><svg width="30" height="30" viewBox="37 32 54 64" aria-label="SuperAtlas" role="img"><path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="#ffffff"/><path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="#1B2056" stroke-width="3" fill="none"/><path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="#1B2056" stroke-width="2.2" fill="none"/><path d="M49.5 63H62" stroke="#1B2056" stroke-width="2.2"/><path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span style="font:600 22px/1 var(--sans);letter-spacing:-.01em;color:#fff">Super<span style="font-family:var(--serif);font-weight:700">Atlas</span></span></span></a>
    <nav class="links" aria-label="Site"><a href="/#s-how">Product</a><a href="/#s-questions">For regulators</a><a href="/#s-audiences">For organisations</a><a href="/#s-audiences">For assessors</a><a href="/#s-security">Security</a></nav>
    <a href="/signin" class="signin">Sign in</a>${btnA("Book a demo", { v: "white", href: "/demo", ir: "arrow-right", testId: "nav-demo" })}
  </div></header>`;
}

export function mkFooter(): string {
  return `<footer class="mk-foot"><div class="wrap" style="max-width:1200px;margin:0 auto"><div class="cols">
    <div class="col gap16"><span class="row gap8" style="gap:10px"><svg width="30" height="30" viewBox="37 32 54 64" aria-label="SuperAtlas" role="img"><path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="#ffffff"/><path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="#1B2056" stroke-width="3" fill="none"/><path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="#1B2056" stroke-width="2.2" fill="none"/><path d="M49.5 63H62" stroke="#1B2056" stroke-width="2.2"/><path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span style="font:600 22px/1 var(--sans);letter-spacing:-.01em;color:#fff">Super<span style="font-family:var(--serif);font-weight:700">Atlas</span></span></span><p style="color:var(--brand-200);font-size:13px;line-height:20px;max-width:34ch">Supervisory technology for regulators: returns, evidence, assessments and findings in one view.</p></div>
    <div><h4>Product</h4><a href="/#s-how">Overview</a><a href="/#s-strength">Compliance strength</a><a href="/#s-configured">Scoring schemes</a><a href="/#s-configured">White-label</a></div>
    <div><h4>Who it's for</h4><a href="/#s-questions">Regulators</a><a href="/#s-audiences">Organisations</a><a href="/#s-audiences">Assurance firms</a></div>
    <div><h4>Company</h4><a href="/">About RegTech365</a><a href="/#s-security">Security</a><a href="/demo">Contact</a><a href="/demo">Book a demo</a></div>
  </div><div class="base"><span>© 2026 RegTech365 · SuperAtlas is a RegTech365 product</span><span>Privacy · Terms</span></div></div></footer>`;
}

export function landingPageHtml(): string {
  return `<div class="mk">${mkNav()}
    <!-- Hero -->
    <section class="band hero" aria-labelledby="hero-h"><span class="glow g1"></span><span class="glow g2"></span><span class="glow g3"></span><div class="wrap">
      <div class="copy"><span class="badge">${ic("seal-check")}Supervisory technology for regulators</span>
        <h1 id="hero-h">See every organisation you supervise, and the evidence behind it.</h1>
        <p class="lead">SuperAtlas brings regulatory returns, evidence, assessments and findings into one supervisory view, so you know who is compliant, where the gaps are, and where to act next.</p>
        <div class="ctas">${btnA("Book a demo", { href: "/demo", ir: "arrow-right", testId: "hero-demo" })}${btnA("Start a proof of value", { v: "ghost-light", href: "/pilot" })}</div>
        <p class="small-line">Configured to your framework · Your branding · Your data stays where you choose</p></div>
      <div class="hero-stage">
        <div class="hero-chart"><div class="row top"><div class="grow"><b style="font-size:16px">Compliance strength · all organisations</b><div class="cap muted" style="margin-top:2px">Average score per quarter · band = middle 50% of organisations · Information Security Regulation 2026</div></div><div style="text-align:right"><div class="serif" style="font:700 30px/34px var(--serif)">78</div><div class="cap" style="color:var(--ok-fg)">+6 pts vs last quarter</div></div></div>
          <div style="margin-top:12px">${lineChart({ w: 600, h: 230, series: [{ vals: AVG, col: "#4f46e5" }], band: [LO, HI] })}</div>
          <div class="row cap muted" style="gap:16px;margin-top:6px"><span class="row gap6"><span class="dot" style="background:#4f46e5"></span>Average</span><span class="row gap6"><span class="dot" style="background:#c7d2fe"></span>Middle 50%</span></div></div>
        <div class="hero-float ws-stat" style="left:0;top:150px;width:232px"><div class="lab">${tile("chart-line-up", "", "sm")}Compliance strength</div><div class="num">78</div><span class="trend up">${ic("trend-up")}6 pts this quarter</span><div class="cap muted" style="margin-top:10px">Portfolio average · 42 organisations</div></div>
        <div class="hero-float ai-card" style="right:-40px;top:-50px;width:300px"><div class="row between" style="flex-wrap:nowrap"><span class="tagl" style="white-space:nowrap">${ic("sparkle")}Suggested requirement</span><span class="chip ok" style="height:20px;font-size:11px">High confidence</span></div><div class="strong" style="margin-top:8px;font-size:14px;line-height:20px;font-weight:600">Test disaster recovery at least once every 12 months</div><blockquote>"4.2 (a) A licensee shall test its disaster-recovery arrangements at least once in every twelve-month period…"</blockquote><div class="cap muted" style="margin-top:8px">Source: Information-Security-Regulation-2026.pdf · clause 4.2(a)</div><div class="row gap4" style="margin-top:10px">${["Accept", "Edit", "Split", "Reject"].map((l, i) => `<span class="btn btn-${i ? (i === 1 ? "secondary" : "tertiary") : "primary"} btn-sm" style="box-shadow:none;height:28px;padding:0 10px;font-size:12px">${l}</span>`).join("")}</div></div>
        <div class="hero-float ws-stat" style="right:0;top:265px;width:232px"><div class="lab">${tile("flag", "", "sm")}Open findings</div><div class="num">23</div><span class="trend down">${ic("trend-down")}5 more than last quarter</span><div class="cap muted" style="margin-top:10px">9 high severity · 4 organisations</div></div>
      </div></div></section>
    <!-- Trust strip -->
    <section class="band b-white trust"><div class="wrap"><div class="t">Built by RegTech365 · Regulatory technology in use across financial-sector supervision</div><div class="chips">${["Regulatory reporting", "Compliance monitoring", "Evidence management", "Audits & assessments", "Findings & remediation", "Risk-based supervision"].map((x) => `<span>${x}</span>`).join("")}</div></div></section>
    <!-- Questions -->
    <section class="band b-canvas" id="s-questions"><div class="wrap"><div class="head"><div class="eyebrow">The supervisory questions</div><h2 class="mk-h2">Answer the questions that matter, with evidence</h2></div>
      <div class="cgrid c3">${[
        ["check-circle", "Which organisations are compliant?", "A compliance-strength score per organisation and regulation, based on assessed outcomes, not self-declaration."],
        ["warning", "Which have material gaps?", "Section-level scores and requirement history show exactly where the gaps are."],
        ["files", "What evidence supports their position?", "Every answer links to its evidence, with file hashes, versions and who reviewed it."],
        ["flag", "Which findings remain unresolved?", "Findings and corrective actions are tracked to verified closure, with ageing and owners."],
        ["gauge", "Who presents heightened risk?", "Biggest drops, overdue actions and low coverage surface automatically."],
        ["target", "Where should we direct resources?", "A supervisory calendar and queue focus your team on the organisations that need it."],
      ]
        .map((x) => card(x[0], x[1], x[2]))
        .join("")}</div></div></section>
    <!-- How it works -->
    <section class="band b-white" id="s-how"><div class="wrap"><div class="head"><div class="eyebrow">How it works</div><h2 class="mk-h2">From regulation to supervisory insight in four steps</h2><p class="lead">The same flow for any regulation, standard or guideline. No custom build per framework.</p></div>
      <div class="cgrid c4">${[
        ["upload-simple", "Upload your regulation", "AI suggests requirements with their source clauses; your team reviews and publishes."],
        ["chat-circle-dots", "Organisations respond", "Yes, No or Not applicable, with evidence and comments, on one consistent form."],
        ["clipboard-text", "Assessors record outcomes", "Licensed assurance firms review the evidence and conclude on your scoring scheme."],
        ["chart-line-up", "You see and act", "Compliance strength over time, findings and corrective actions through to verified closure."],
      ]
        .map(([i, t, p], n) => `<div class="mcard soft"><div class="row"><span class="tl">${ic(i)}</span><span class="num">0${n + 1}</span></div><b>${t}</b><p>${p}</p></div>`)
        .join("")}</div></div></section>
    <!-- Capabilities -->
    <section class="band b-canvas"><div class="wrap"><div class="head"><div class="eyebrow">Capabilities</div><h2 class="mk-h2">Everything a supervisory team needs, in one place</h2></div>
      <div class="cgrid c4">${[
        ["tray", "Regulatory reporting oversight", "Periods, submissions, outstanding returns and receipts in one view."],
        ["gauge", "Compliance monitoring", "A consolidated position against every applicable regulation and standard."],
        ["files", "Evidence-based supervision", "Evidence linked to each requirement, reusable, versioned and verifiable."],
        ["file-magnifying-glass", "Audits & assessments", "Engagements with licensed assurance firms, outcomes and reports."],
        ["scales", "Risk-based supervision", "Gaps, recurring findings and overdue actions focus your attention."],
        ["flag", "Findings & remediation", "Findings, corrective-action plans and deadlines tracked to closure."],
        ["clock-counter-clockwise", "Regulatory history", "A continuous record of every submission, assessment and decision."],
        ["chart-bar", "Management intelligence", "Trends and comparisons across the whole supervised population."],
      ]
        .map((x) => card(x[0], x[1], x[2], "sm"))
        .join("")}</div></div></section>
    <!-- Compliance strength showcase -->
    <section class="band showcase" id="s-strength"><div class="wrap grid2">
      <div><div class="eyebrow">Compliance strength</div><h2 class="mk-h2">Watch compliance strengthen, or slip, over time</h2><p class="lead">A score from 0 to 100 for every organisation and regulation, based only on assessed outcomes. Drill from the whole portfolio down to a single requirement's history.</p>
        <div class="crumbs-chips"><span>Portfolio</span>${ic("caret-right")}<span>Organisation</span>${ic("caret-right")}<span>Regulation</span>${ic("caret-right")}<span class="on">Requirement</span></div>
        <div class="checks">${["Scores comparable across regulations with different scoring schemes", "Coverage and open findings always shown alongside", "Method set by the regulator, visible on every chart"].map((t) => `<div><span class="ck">${ic("check")}</span>${t}</div>`).join("")}</div></div>
      <div style="position:relative;padding-bottom:40px"><div class="chart-card"><div class="row top"><div class="grow"><b style="font-size:15px">Compliance strength by regulation</b><div class="cap muted">Demo Hosting Ltd · per quarter · assessor outcomes only</div></div><div style="text-align:right"><div style="font:700 28px/32px var(--serif)">81</div><div class="cap" style="color:var(--ok-fg)">+3 pts vs last quarter</div></div></div>
        <div style="margin-top:10px">${lineChart({ w: 560, h: 200, series: [{ vals: [62, 64, 66, 70, 73, 75, 77, 81], col: "#4f46e5" }, { vals: [70, 68, 72, 73, 74, 76, 78, 80], col: "#8651cd" }, { vals: [55, 58, 57, 60, 63, 61, 66, 69], col: "#63a9b9" }], marks: [{ i: 5, y: 26, label: "Finding issued", w: 88, tone: "bad" }, { i: 6, y: 46, label: "Assessment closed", w: 108, tone: "ok" }] })}</div>
        <div class="row wrap cap muted" style="gap:14px;margin-top:6px"><span class="row gap6"><span class="dot" style="background:#4f46e5"></span>Information Security Reg. 2026 <b style="color:var(--text)">81</b></span><span class="row gap6"><span class="dot" style="background:#63a9b9"></span>Data Protection Reg. <b style="color:var(--text)">69</b></span></div></div>
        <div class="sec-score"><b style="font-size:15px">Score by section</b>${[["Part 3 · Access control", 71, "#c97d24"], ["Part 4 · Business continuity", 55, "#c97d24"], ["Part 5 · Incident management", 84, "#1e7a46"]].map(([l, v, c]) => `<div class="r"><span class="grow">${l}</span><i style="background:${c}"></i><b class="tnum" style="width:22px;text-align:right">${v}</b></div>`).join("")}</div></div>
    </div></section>
    <!-- Configured to you -->
    <section class="band b-white" id="s-configured"><div class="wrap"><div class="head"><div class="eyebrow">Configured to you</div><h2 class="mk-h2">Your framework, your branding, your way of supervising</h2><p class="lead">SuperAtlas adapts to the regulator, not the other way round.</p></div>
      <div class="cgrid c4">${[
        ["book-open-text", "Any regulation or standard", "Upload laws, regulations, guidelines and standards; they become requirements."],
        ["sliders-horizontal", "Your scoring scheme", "4-point, maturity, pass/fail or satisfactory scales, set per regulation."],
        ["sparkle", "Your branding", "Logo, colours and name across the app, emails, receipts and reports."],
        ["list-checks", "Your workflow", "Reporting cycles, assessment programmes, approvals and roles."],
      ]
        .map((x) => card(x[0], x[1], x[2], "sm soft"))
        .join("")}</div>
      <div class="thumbs">${[["default", "SuperAtlas default"], ["forest", "Forest Supervisory Authority"], ["ocean", "Ocean Markets Commission"]].map(([k, n]) => `<div><div class="thumb" aria-label="${n} theme"><div class="inner">${miniDash(k as "default" | "forest" | "ocean")}</div></div><div class="thumb-cap">${n}</div></div>`).join("")}</div></div></section>
    <!-- Audiences -->
    <section class="band b-canvas" id="s-audiences"><div class="wrap"><div class="head"><div class="eyebrow">One platform, three roles</div><h2 class="mk-h2">Built for everyone in the supervision chain</h2></div>
      <div class="cgrid c2">${[
        ["buildings", "For regulated organisations", "One place for every obligation", ["See every obligation, due date and next step", "Answer Yes / No / Not applicable with evidence", "Reuse evidence across requirements and periods", "A receipt for every submission"], "Invited by your regulator? Sign in", "/signin"],
        ["briefcase", "For assurance firms", "Structured engagements, clear reporting", ["Engagements and request lists in one workspace", "Review evidence and record outcomes on the regulator's scheme", "Draft findings and submit reports for acceptance", "Work across the organisations assigned to your firm"], "Join as an assessor", "/firm/apply"],
      ]
        .map(([i, w, h, li, a, g]) => `<div class="aud"><div class="who">${tile(i as string, "", "sm")}${w}</div><h3>${h}</h3><ul>${(li as string[]).map((x) => `<li><span class="checks" style="margin:0"><span class="ck">${ic("check")}</span></span>${x}</li>`).join("")}</ul><a href="${g}">${a}${ic("arrow-right")}</a></div>`)
        .join("")}</div></div></section>
    <!-- Security -->
    <section class="band b-navy" id="s-security"><div class="wrap"><div class="head"><div class="eyebrow">Security & governance</div><h2 class="mk-h2">Built for institutions that are audited themselves</h2><p class="lead">Security details to be confirmed with engineering before publication.</p></div>
      <div class="cgrid c3">${[
        ["key", "Role-based access", "Every action is limited to the right role, workspace and organisation."],
        ["clock-counter-clockwise", "Complete audit trail", "Every submission, decision and change is recorded with who, what and when."],
        ["lock-simple", "Encryption", "Data encrypted in transit and at rest; evidence files hashed on upload."],
        ["database", "Data residency options", "Host in the region your mandate requires."],
        ["fingerprint", "Single sign-on", "Connect your identity provider; enforce multi-factor authentication."],
        ["shield-check", "Separation of tenants", "Each regulator's data, branding and users are isolated."],
      ]
        .map(([i, t, p]) => `<div class="scard"><span class="tl">${ic(i)}</span><b>${t}</b><p>${p}</p></div>`)
        .join("")}</div></div></section>
    <!-- Proof of value -->
    <section class="band b-white"><div class="wrap"><div class="head"><div class="eyebrow">Proof of value</div><h2 class="mk-h2">See it working on your own use case first</h2><p class="lead">Start with one supervisory use case and a selected group of organisations, then decide on wider rollout.</p></div>
      <div class="cgrid c3">${[
        ["Configure", "We map one regulation or standard, your workflow and branding into SuperAtlas."],
        ["Run", "A selected group of organisations respond; assessors review; your team supervises."],
        ["Decide", "Review results, compliance strength and feedback with your stakeholders."],
      ]
        .map(([t, p], n) => `<div class="mcard soft"><span class="numc">${n + 1}</span><b>${t}</b><p>${p}</p></div>`)
        .join("")}</div>
      <div style="text-align:center;margin-top:32px">${btnA("Start a proof of value", { v: "secondary", href: "/pilot", ir: "arrow-right" })}</div></div></section>
    <!-- FAQ -->
    <section class="band b-canvas"><div class="wrap"><div class="head"><div class="eyebrow">FAQ</div><h2 class="mk-h2">Questions we often hear</h2></div>
      <div class="faq">${[
        ["Can SuperAtlas work with our existing regulations and processes?", "Yes. You upload your own regulations and standards, choose a scoring scheme, and configure reporting cycles, assessment programmes and approvals. We configure the platform around your methodology rather than asking you to change it."],
        ["Where is our data hosted?", "In the region your mandate requires. Each regulator's data is isolated from every other tenant."],
        ["How are regulated organisations onboarded?", "You invite them one by one or from a spreadsheet, mapped to your categories. Organisations can also register and choose their category, and you verify them."],
        ["Can assurance firms work on the platform?", "Yes. Firms apply for accreditation by type. Once accredited, they are assigned to organisations, record outcomes and submit reports for your acceptance."],
        ["How is SuperAtlas priced?", "Pricing depends on the number of supervised organisations and modules. A proof of value comes first, so you can decide on evidence."],
      ]
        .map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${q}<span class="minus">${ic("minus")}</span><span class="plus">${ic("plus")}</span></summary><p>${a}</p></details>`)
        .join("")}</div></div></section>
    <!-- Final CTA -->
    <section class="band b-white final"><div class="wrap"><div class="box"><h2>Bring every supervised organisation into one view</h2><p>See SuperAtlas configured for a supervisory use case like yours.</p><div class="ctas">${btnA("Book a demo", { v: "white", href: "/demo", ir: "arrow-right" })}${btnA("Start a proof of value", { v: "ghost-light", href: "/pilot" })}</div></div></div></section>
    ${mkFooter()}</div>`;
}
