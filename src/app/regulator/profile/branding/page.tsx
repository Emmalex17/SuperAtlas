"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { PageHead, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { TENANT, THEMES } from "@/lib/mockData";

function BrandPreview({ view, themeKey }: { view: "app" | "email"; themeKey: (typeof THEMES)[number]["key"] }) {
  const th = THEMES.find((t) => t.key === themeKey)!.swatches;
  if (view === "app") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", minHeight: 300 }}>
        <div style={{ background: th[0], padding: "12px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
          {["Home", "Organisations", "Firms", "Library"].map((l, i) => (
            <div key={l} style={{ padding: "6px 8px", borderRadius: 8, color: "#fff", fontSize: 11, background: i === 1 ? th[1] : undefined }}>{l}</div>
          ))}
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <b className="serif" style={{ fontSize: 18 }}>Directory</b>
          <div className="row gap8">
            <span style={{ height: 28, padding: "0 12px", borderRadius: 99, background: th[1], color: "#fff", fontSize: 11, display: "inline-flex", alignItems: "center" }}>All</span>
            <span className="tag">Banks</span>
            <span className="tag">Payments</span>
          </div>
          {[1, 2, 3].map((i) => <div key={i} className="skel" style={{ height: 30, animation: "none" }} />)}
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: 20, background: "#f4f5fb" }}>
      <div className="mail">
        <div className="mh">
          <b style={{ color: "var(--text)" }}>You are invited to {TENANT.name} on SuperAtlas</b>
          <span>From: {TENANT.name} &lt;no-reply@{TENANT.domain}&gt;</span>
        </div>
        <div style={{ height: 6, background: th[1] }} />
        <div className="mb col gap12">
          <div className="row gap8">
            <span className="logo s32" style={{ background: th[1] }}>{TENANT.initials}</span>
            <b>{TENANT.name}</b>
          </div>
          <p>Hello, you have been invited to join {TENANT.name}&rsquo;s supervision portal.</p>
          <span style={{ alignSelf: "flex-start", padding: "8px 14px", borderRadius: 10, background: th[1], color: "#fff", fontWeight: 600, fontSize: 13 }}>Accept invitation</span>
          <p className="cap muted">Powered by SuperAtlas</p>
        </div>
      </div>
    </div>
  );
}

export default function BrandingPage() {
  const toast = useToast();
  const [theme, setTheme] = useState<(typeof THEMES)[number]["key"]>(TENANT.theme);
  const [view, setView] = useState<"app" | "email">("app");
  const [short, setShort] = useState(TENANT.short);
  const [domain, setDomain] = useState(TENANT.domain);

  useEffect(() => {
    if (theme === "default") document.documentElement.removeAttribute("data-brand");
    else document.documentElement.setAttribute("data-brand", theme);
    return () => {
      document.documentElement.removeAttribute("data-brand");
    };
  }, [theme]);

  return (
    <AppShell workspace="regulator">
      <PageHead title="Profile" sub="How NITDA appears to organisations and assurance firms, on screen and in emails." />
      <div className="tabs" role="tablist">
        <Link href="/regulator/profile" role="tab">Details</Link>
        <button role="tab" className="on">Branding</button>
      </div>
      <p className="muted small">Your name, logo and colours appear inside the workspace and on every email you send. Sign-in stays SuperAtlas-branded, so everyone has one place to sign in.</p>

      <div className="grid side">
        <div className="card col gap20">
          <div className="h4">Preview</div>
          <div className="tabs" role="tablist">
            <button role="tab" className={view === "app" ? "on" : ""} onClick={() => setView("app")}>Workspace</button>
            <button role="tab" className={view === "email" ? "on" : ""} onClick={() => setView("email")}>Invitation email</button>
          </div>
          <div className="preview-box" style={{ padding: 0 }}>
            <BrandPreview view={view} themeKey={theme} />
          </div>
        </div>
        <form
          className="col gap24"
          onSubmit={(e) => {
            e.preventDefault();
            toast(`Branding saved. Theme: ${THEMES.find((t) => t.key === theme)!.name}`);
          }}
        >
          <div className="card col gap12">
            <div className="h4">Theme</div>
            {THEMES.map((t) => (
              <button key={t.key} type="button" className={`choice ${theme === t.key ? "on" : ""}`} onClick={() => setTheme(t.key)}>
                <span className="radio" />
                <span className="grow">
                  <b>{t.name}</b>
                  <br />
                  <span className="cap muted">{t.desc}</span>
                </span>
                <span className="row gap4">
                  {t.swatches.map((c) => (
                    <span key={c} style={{ width: 20, height: 20, borderRadius: 6, background: c, display: "inline-block" }} />
                  ))}
                </span>
              </button>
            ))}
          </div>
          <div className="card col gap16">
            <div className="h4">Name and web address</div>
            <Field label="Short name in status text" hint={`Shown in status text such as "With ${short}".`} htmlFor="b-short">
              <input className="inp" id="b-short" maxLength={8} value={short} onChange={(e) => setShort(e.target.value)} />
            </Field>
            <Field label="Web address" hint="We will give you a DNS record to add. Until then the default address works." htmlFor="b-dom">
              <div className="inp-wrap">
                <Icon name="globe" />
                <input className="inp" id="b-dom" value={domain} onChange={(e) => setDomain(e.target.value)} />
              </div>
            </Field>
            <div><span className="chip ok"><Icon name="check-circle" />DNS verified</span></div>
          </div>
          <div className="row end">
            <Button type="submit">Save branding</Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
