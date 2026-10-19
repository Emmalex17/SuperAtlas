import Link from "next/link";
import { Lockup, Button, Tile } from "@/components/ui";

export default function Home() {
  return (
    <div className="col" style={{ minHeight: "100vh", background: "var(--brand-900)", color: "#fff" }}>
      <header className="row between" style={{ padding: "20px 32px" }}>
        <Lockup dark size={26} />
        <Link href="/signin">
          <Button variant="ghost-light">Sign in</Button>
        </Link>
      </header>

      <main className="col gap32" style={{ flex: 1, justifyContent: "center", padding: "32px", maxWidth: 880, margin: "0 auto", textAlign: "center" }}>
        <h1 className="h-display" style={{ color: "#fff", fontSize: 44, lineHeight: "50px" }}>
          One platform for regulatory compliance
        </h1>
        <p className="muted" style={{ color: "var(--brand-200)", fontSize: 17, maxWidth: "56ch", margin: "0 auto" }}>
          Regulators, supervised organisations and assurance firms — each in their own workspace, scoped strictly to their own account.
        </p>
        <div className="row" style={{ justifyContent: "center" }}>
          <Link href="/signin">
            <Button size="lg" variant="gold">Sign in</Button>
          </Link>
        </div>

        <div className="grid g3" style={{ marginTop: 24, textAlign: "left" }}>
          {[
            { icon: "scales" as const, title: "Regulator", body: "Supervise organisations and assurance firms, publish requirements and programmes." },
            { icon: "buildings" as const, title: "Organisation", body: "See every obligation, answer with evidence, and track submissions." },
            { icon: "briefcase" as const, title: "Assurance firm", body: "Run engagements, review evidence, and submit findings." },
          ].map((a) => (
            <div key={a.title} className="card" style={{ background: "rgba(255,255,255,.06)", boxShadow: "none", border: "1px solid rgba(255,255,255,.14)" }}>
              <Tile icon={a.icon} tone="solid" />
              <h3 className="h3" style={{ color: "#fff", marginTop: 12 }}>{a.title}</h3>
              <p className="small" style={{ color: "var(--brand-200)", marginTop: 6 }}>{a.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
