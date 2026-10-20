import { ic, btnA } from "./markup";

const BRAND_SVG = `<svg width="30" height="30" viewBox="37 32 54 64" aria-label="SuperAtlas" role="img"><path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="#ffffff"/><path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="#1B2056" stroke-width="3" fill="none"/><path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="#1B2056" stroke-width="2.2" fill="none"/><path d="M49.5 63H62" stroke="#1B2056" stroke-width="2.2"/><path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`;

function lockupHtml(dark: boolean, size: number): string {
  return `<span class="row gap8" style="gap:10px"><svg width="${size}" height="${size}" viewBox="37 32 54 64" aria-label="SuperAtlas" role="img"><path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="${dark ? "#1B2056" : "#ffffff"}"/><path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="${dark ? "#fff" : "#1B2056"}" stroke-width="3" fill="none"/><path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="${dark ? "#fff" : "#1B2056"}" stroke-width="2.2" fill="none"/><path d="M49.5 63H62" stroke="${dark ? "#fff" : "#1B2056"}" stroke-width="2.2"/><path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg><span style="font:600 ${Math.round(size * 0.72)}px/1 var(--sans);letter-spacing:-.01em;color:${dark ? "#fff" : "var(--brand-700)"}">Super<span style="font-family:var(--serif);font-weight:700">Atlas</span></span></span>`;
}

export function mkNav(): string {
  return `<header class="mk-nav"><div class="wrap">
    <a href="/" aria-label="SuperAtlas home"><span class="row gap8" style="gap:10px">${BRAND_SVG}<span style="font:600 22px/1 var(--sans);letter-spacing:-.01em;color:#fff">Super<span style="font-family:var(--serif);font-weight:700">Atlas</span></span></span></a>
    <nav class="links" aria-label="Site"><a href="/#s-how">Product</a><a href="/#s-questions">For regulators</a><a href="/#s-audiences">For organisations</a><a href="/#s-audiences">For assessors</a><a href="/#s-security">Security</a></nav>
    <a href="/signin" class="signin">Sign in</a>${btnA("Book a demo", { v: "white", href: "/demo", ir: "arrow-right", testId: "nav-demo" })}
  </div></header>`;
}

export function mkFooter(): string {
  return `<footer class="mk-foot"><div class="wrap" style="max-width:1200px;margin:0 auto"><div class="cols">
    <div class="col gap16"><span class="row gap8" style="gap:10px">${BRAND_SVG}<span style="font:600 22px/1 var(--sans);letter-spacing:-.01em;color:#fff">Super<span style="font-family:var(--serif);font-weight:700">Atlas</span></span></span><p style="color:var(--brand-200);font-size:13px;line-height:20px;max-width:34ch">Supervisory technology for regulators: returns, evidence, assessments and findings in one view.</p></div>
    <div><h4>Product</h4><a href="/#s-how">Overview</a><a href="/#s-strength">Compliance strength</a><a href="/#s-configured">Scoring schemes</a><a href="/#s-configured">White-label</a></div>
    <div><h4>Who it's for</h4><a href="/#s-questions">Regulators</a><a href="/#s-audiences">Organisations</a><a href="/#s-audiences">Assurance firms</a></div>
    <div><h4>Company</h4><a href="/">About RegTech365</a><a href="/#s-security">Security</a><a href="/demo">Contact</a><a href="/demo">Book a demo</a></div>
  </div><div class="base"><span>© 2026 RegTech365 · SuperAtlas is a RegTech365 product</span><span>Privacy · Terms</span></div></div></footer>`;
}

export function heroCopyHtml(): string {
  return `<div class="copy"><span class="badge">${ic("seal-check")}Supervisory technology for regulators</span>
    <h1 id="hero-h">See every organisation you supervise, and the evidence behind it.</h1>
    <p class="lead">SuperAtlas brings regulatory returns, evidence, assessments and findings into one supervisory view, so you know who is compliant, where the gaps are, and where to act next.</p>
    <div class="ctas">${btnA("Book a demo", { href: "/demo", ir: "arrow-right", testId: "hero-demo" })}${btnA("Start a proof of value", { v: "ghost-light", href: "/pilot" })}</div>
    <p class="small-line">Configured to your framework · Your branding · Your data stays where you choose</p></div>`;
}

export function sectionProof(): string {
  return `<section class="sa-proof"><div class="sa-shell sa-proof-inner"><span class="sa-proof-lab">One platform for</span><div class="sa-proof-divider"></div><span>REGULATORY RETURNS</span><span>EVIDENCE &amp; ASSESSMENTS</span><span>FINDINGS &amp; REMEDIATION</span><span>EXECUTIVE INTELLIGENCE</span></div></section>`;
}

export function sectionIntro(): string {
  return `<section class="sa-section sa-intro" id="s-questions"><div class="sa-shell"><div class="sa-intro-grid"><div><div class="sa-kicker">FROM FRAGMENTED INFORMATION TO COMPLETE CLARITY</div><h2>Regulation moves faster when everything connects.</h2></div><div class="sa-intro-aside">See beyond submitted reports. Bring obligations, evidence, assessments and supervisory action into a shared system of record, giving every decision the context it deserves.<div class="sa-arrowline">Built for the way regulators actually work</div></div></div><div class="sa-question-grid"><div class="sa-qtile"><span class="sa-qicon">01</span><h3>Who is compliant?</h3><p>Understand assessed compliance across every organisation and applicable requirement.</p></div><div class="sa-qtile"><span class="sa-qicon">02</span><h3>Where are the gaps?</h3><p>Pinpoint material weaknesses, recurring findings and areas that need attention.</p></div><div class="sa-qtile"><span class="sa-qicon">03</span><h3>What proves it?</h3><p>Trace every reported position back to the supporting evidence and assessment.</p></div><div class="sa-qtile"><span class="sa-qicon">04</span><h3>What happens next?</h3><p>Prioritise interventions, assign corrective actions and track progress to closure.</p></div></div></div></section>`;
}

export function storyFeature1Html(): string {
  return `<div class="sa-story"><div class="sa-kicker">01 / SUPERVISORY INTELLIGENCE</div><h2>See the whole picture. Find the detail that matters.</h2><p>Move from a portfolio-wide view to an individual organisation, regulation or requirement. Spot trends and know where to direct supervisory attention.</p><div class="sa-checkline"><span>✓</span> Portfolio to requirement visibility</div><div class="sa-checkline"><span>✓</span> Clear trends and compliance comparisons</div><div class="sa-checkline"><span>✓</span> Risk-informed supervisory priorities</div><a href="#s-how" class="sa-link">Explore how supervision works <span>↗</span></a></div>`;
}

export function storyFeature2Html(): string {
  return `<div class="sa-story"><div class="sa-kicker">02 / EVIDENCE-LED SUPERVISION</div><h2>Every compliance claim. Backed by evidence.</h2><p>Review responses, supporting files, assessor observations and supervisory decisions within a connected workspace, with no chasing of documents across inboxes.</p><div class="sa-checkline"><span>✓</span> Evidence attached to specific requirements</div><div class="sa-checkline"><span>✓</span> Clear version and review history</div><div class="sa-checkline"><span>✓</span> A traceable supervisory decision trail</div></div>`;
}

export function sectionFindings(): string {
  return `<section class="sa-section sa-feature sa-feature-mint" id="s-findings"><div class="sa-shell sa-split"><div class="sa-story"><div class="sa-kicker">03 / ACTION &amp; ACCOUNTABILITY</div><h2>Don't just find the gaps. Close them.</h2><p>Turn supervisory findings into clear action. Assign remediation owners, set deadlines and keep a connected record from issue to verified resolution.</p><div class="sa-checkline"><span>✓</span> Findings tied to assessments and evidence</div><div class="sa-checkline"><span>✓</span> Owners, actions and due dates in one view</div><div class="sa-checkline"><span>✓</span> Follow through from discovery to closure</div></div><div class="sa-rem-scene"><div class="sa-rem-board"><div class="sa-rem-top"><div><small>FINDINGS &amp; REMEDIATION</small><h3>From identified to resolved</h3></div><span>All organisations ⌄</span></div><div class="sa-rem-columns"><div><div class="sa-rem-colhead">Open <span>04</span></div><article><span class="sa-rem-priority">● HIGH PRIORITY</span><b>Access review overdue</b><p>Identity &amp; access controls</p><small>Due 24 Oct</small></article><article><span class="sa-rem-priority">● MEDIUM PRIORITY</span><b>Policy documentation gap</b><p>Governance controls</p></article></div><div><div class="sa-rem-colhead">In progress <span>06</span></div><article><span class="sa-rem-priority amber">● IN REMEDIATION</span><b>Continuity plan update</b><p>Business continuity</p><div class="sa-progress"><i></i></div><small>Owner assigned</small></article></div><div><div class="sa-rem-colhead">Verified <span>12</span></div><article><span class="sa-rem-priority green">● VERIFIED</span><b>Evidence review complete</b><p>Risk management</p><small>Closed with evidence ✓</small></article></div></div></div></div></div></section>`;
}

export function sectionCapabilities(): string {
  const caps: [string, string, string][] = [
    ["tray", "Regulatory reporting", "Monitor submissions, deadlines, exceptions and reporting history."],
    ["gauge", "Compliance monitoring", "Track organisations against obligations and supervisory requirements."],
    ["files", "Evidence management", "Collect, review and connect supporting evidence to requirements."],
    ["file-magnifying-glass", "Audits & assessments", "Plan assessments, document outcomes and review findings."],
    ["scales", "Risk-based supervision", "Direct attention to gaps, emerging risks and overdue actions."],
    ["flag", "Findings & remediation", "Assign corrective action and follow progress through closure."],
    ["clock-counter-clockwise", "Regulatory history", "Keep a connected record of submissions, assessments and decisions."],
    ["chart-bar", "Management intelligence", "Understand trends and compare performance across the portfolio."],
  ];
  return `<section class="sa-section sa-capabilities" id="s-capabilities"><div class="sa-shell"><div class="sa-center"><div class="sa-kicker">ONE CONNECTED PLATFORM</div><h2>All your supervisory work, working together.</h2><p>Eight essential capabilities, connected in one place, so your team spends less time navigating systems and more time making informed decisions.</p></div><div class="sa-cap-grid">${caps
    .map(([i, t, p]) => `<div class="sa-cap"><div class="sa-cap-ico">${ic(i)}</div><h3>${t}</h3><p>${p}</p></div>`)
    .join("")}</div></div></section>`;
}

export function sectionFramework(): string {
  return `<section class="sa-section sa-framework" id="s-configured"><div class="sa-shell"><div class="sa-split"><div class="sa-story"><div class="sa-kicker">BUILT AROUND YOUR MANDATE</div><h2>Your rules. Your workflows. Your SuperAtlas.</h2><p>There is no one-size-fits-all approach to supervision. Configure SuperAtlas around your regulatory framework, reporting cycles, scoring method and operating model, rather than changing the way your institution works.</p><div class="sa-framework-tags"><span>Regulations &amp; standards</span><span>Scoring schemes</span><span>Approval workflows</span><span>Regulator branding</span></div></div><div class="sa-theme-scene"><div class="sa-theme-main"><div class="sa-theme-window"><div class="sa-theme-sidebar"><div class="sa-theme-logo">${lockupHtml(true, 18)}</div><span>▣ Overview</span><span>▤ Organisations</span><span>▥ Assessments</span><span>◷ Findings</span></div><div class="sa-theme-content"><small>SUPERVISORY WORKSPACE</small><h3>Configured for your authority</h3><div class="sa-theme-numbers"><div>96<small>Organisations</small></div><div>18<small>Open reviews</small></div><div>9<small>Due this week</small></div></div><div class="sa-theme-bars"><i></i><i></i><i></i><i></i></div></div></div></div><div class="sa-theme-switch"><span class="sa-theme-color purple"></span><span class="sa-theme-color green"></span><span class="sa-theme-color blue"></span><b>One platform. Your identity.</b></div></div></div></div></section>`;
}

export function sectionAudiences(): string {
  const roles: [string, string, string, string, string][] = [
    ["◎", "FOR REGULATORS", "Confidence in every decision.", "See your full supervised landscape, identify risk, commission assessments and drive action.", "Explore regulatory oversight"],
    ["▦", "FOR REGULATED ORGANISATIONS", "Clarity in every obligation.", "Know what is required, submit returns and supporting evidence, and stay ahead of deadlines.", "Access your workspace"],
    ["◈", "FOR ASSESSORS", "Evidence for every assessment.", "Review submissions, record findings and keep assessment outcomes organised.", "Explore assessor access"],
  ];
  const hrefs = ["/demo", "/signin", "/signin"];
  return `<section class="sa-section sa-audiences" id="s-audiences"><div class="sa-shell"><div class="sa-center"><div class="sa-kicker">CONNECTED FROM END TO END</div><h2>One shared view. A better way to work together.</h2><p>SuperAtlas connects the people who set requirements, provide evidence and independently assess compliance.</p></div><div class="sa-role-grid">${roles
    .map(([sym, label, h, p, cta], i) => `<div class="sa-role"><span class="sa-role-symbol">${sym}</span><div class="sa-role-label">${label}</div><h3>${h}</h3><p>${p}</p><a href="${hrefs[i]}">${cta} ↗</a></div>`)
    .join("")}</div></div></section>`;
}

export function sectionProcess(): string {
  const steps: [string, string][] = [
    ["Define", "Structure your requirements, reporting obligations and supervisory framework."],
    ["Collect", "Invite organisations to submit returns, responses and supporting evidence."],
    ["Assess", "Review evidence, carry out assessments and document supervisory findings."],
    ["Act", "Understand the results, prioritise risk and track remediation over time."],
  ];
  return `<section class="sa-section sa-process" id="s-how"><div class="sa-shell"><div class="sa-center"><div class="sa-kicker">HOW SUPERATLAS WORKS</div><h2>From obligations to insight, in four clear steps.</h2><p>A continuous supervisory process that keeps requirements, responses, assessments and decisions connected.</p></div><div class="sa-steps">${steps
    .map(([t, p], i) => `<div><b>0${i + 1}</b><h3>${t}</h3><p>${p}</p></div>`)
    .join("")}</div></div></section>`;
}

export function sectionSecurity(): string {
  const items: [string, string, string][] = [
    ["⌁", "Role-based access", "Align access with responsibilities across supervision teams."],
    ["◷", "Audit-ready history", "Keep submissions, reviews and decisions connected in a clear record."],
    ["▤", "Data governance", "Plan hosting and access requirements for your institution."],
    ["◇", "Controlled workspaces", "Support structured engagement across supervised entities."],
  ];
  return `<section class="sa-section sa-security" id="s-security"><div class="sa-shell sa-split"><div class="sa-story"><div class="sa-kicker">GOVERNANCE BY DESIGN</div><h2>Built for the responsibilities of supervision.</h2><p>Regulatory work demands accountability, appropriate access and a defensible history of decisions. SuperAtlas is designed to help institutions bring governance into everyday workflows.</p><p class="sa-safety-note">Specific security controls, hosting arrangements and integrations are confirmed during technical scoping.</p></div><div class="sa-security-grid">${items
    .map(([sym, t, p]) => `<div><span>${sym}</span><h3>${t}</h3><p>${p}</p></div>`)
    .join("")}</div></div></section>`;
}

export function sectionPov(): string {
  const steps: [string, string][] = [
    ["Configure your framework", "Map a regulation or supervisory process into the platform."],
    ["Run a real use case", "Collect returns and evidence, review and assess outcomes."],
    ["Evaluate the evidence", "Review visibility, findings, usability and priorities for rollout."],
  ];
  return `<section class="sa-section sa-pov"><div class="sa-shell sa-split"><div class="sa-story"><div class="sa-kicker">START WITH A PROOF OF VALUE</div><h2>See what better supervision looks like on your own terms.</h2><p>Start with one regulatory use case and a selected group of organisations. Test your actual workflow, evaluate the results and make a considered decision about broader deployment.</p><div class="sa-pov-cta">${btnA("Start a proof of value", { href: "/pilot", ir: "arrow-right" })}</div></div><div class="sa-pov-list">${steps
    .map(([t, p], i) => `<div><span>0${i + 1}</span><div><h3>${t}</h3><p>${p}</p></div></div>`)
    .join("")}</div></div></section>`;
}

export function sectionFaq(): string {
  const qs: [string, string][] = [
    ["Can SuperAtlas support our existing framework?", "Yes. SuperAtlas is designed to be configured around an institution's regulations, reporting requirements, assessment processes and supervisory methodology."],
    ["Is SuperAtlas only for one regulator or sector?", "No. SuperAtlas supports regulatory use cases across sectors. The applicable regulations, processes and operating model are configured for each institution."],
    ["How does the proof of value work?", "We work with your team to select a supervisory use case, configure the framework and involve a selected group of organisations so you can evaluate the results."],
    ["What about data hosting and security?", "Specific hosting, data residency, security and integration requirements are reviewed with your technical and governance teams during deployment planning."],
    ["How is SuperAtlas priced?", "Commercial terms are discussed based on institutional scope, deployment requirements and the proposed solution configuration."],
  ];
  return `<section class="sa-section sa-faq" id="s-faq"><div class="sa-shell sa-split"><div class="sa-story"><div class="sa-kicker">FREQUENTLY ASKED QUESTIONS</div><h2>Good questions deserve clear answers.</h2><p>Explore how SuperAtlas fits existing regulatory environments and supervisory processes.</p></div><div class="sa-faq-list">${qs
    .map(([q, a], i) => `<details ${i === 0 ? "open" : ""}><summary>${q}<span>+</span></summary><p>${a}</p></details>`)
    .join("")}</div></div></section>`;
}

export function sectionFinal(): string {
  return `<section class="sa-final"><div class="sa-shell"><div class="sa-final-inner"><div><div class="sa-kicker">MAKE SUPERVISION MORE CONNECTED</div><h2>See every organisation.<br>Act with confidence.</h2><p>Discover SuperAtlas in the context of your supervisory priorities.</p></div><div class="sa-final-actions">${btnA("Book a demo", { v: "white", href: "/demo", ir: "arrow-right" })}${btnA("Start a proof of value", { v: "ghost-light", href: "/pilot" })}</div></div></div></section>`;
}

export function tailSectionsHtml(): string {
  return sectionFindings() + sectionCapabilities() + sectionFramework() + sectionAudiences() + sectionProcess() + sectionSecurity() + sectionPov() + sectionFaq() + sectionFinal();
}

/** @deprecated kept only so older imports don't break; the page is now composed in app/page.tsx from the section functions above */
export function landingPageHtml(): string {
  return `<div class="mk">${mkNav()}${sectionProof()}${sectionIntro()}${tailSectionsHtml()}${mkFooter()}</div>`;
}
