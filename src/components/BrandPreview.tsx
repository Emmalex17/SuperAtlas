import { TENANT, THEMES } from "@/lib/mockData";

/** The live "how your branding will look" preview — workspace sidebar mock or an invitation-email mock,
 * tinted by the chosen theme. The prototype's brandPreview(). Shared by /welcome and /regulator/profile/branding. */
export function BrandPreview({ view, themeKey }: { view: "app" | "email"; themeKey: (typeof THEMES)[number]["key"] }) {
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
