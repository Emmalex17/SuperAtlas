"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SettingsShell } from "@/components/SettingsShell";
import { BrandPreview } from "@/components/BrandPreview";
import { PageHead, Button, Field } from "@/components/ui";
import { useToast } from "@/components/Toast";
import { Icon } from "@/lib/icons";
import { TENANT, THEMES } from "@/lib/mockData";

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
    <AppShell workspace="regulator" crumbs={[{ label: "Profile", href: "/regulator/profile" }, { label: "Branding" }]}>
      <SettingsShell active="profile/branding">
      <PageHead title="Branding" sub="Your name, logo and colours inside the workspace and in every email." />
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
      </SettingsShell>
    </AppShell>
  );
}
