import Link from "next/link";
import { Icon } from "@/lib/icons";
import { NAV_LINKS } from "@/lib/landingContent";

/** The landing page's top nav. A real component (not the page's usual dangerouslySetInnerHTML
 * strings) because position:sticky needs room to float within its containing block — wrapping
 * this in page.tsx's auto-sized innerHTML div left it no taller than the header itself, so the
 * header had nowhere to stick and scrolled away with the rest of the page. */
export function SiteHeader() {
  return (
    <header className="mk-nav">
      <input type="checkbox" id="mk-nav-toggle" className="mk-nav-cb" aria-hidden="true" />
      <div className="wrap">
        <Link href="/" aria-label="SuperAtlas home">
          <span className="row gap8" style={{ gap: 10 }}>
            <BrandMark size={30} />
            <span style={{ font: "600 22px/1 var(--sans)", letterSpacing: "-.01em", color: "#fff" }}>
              Super<span style={{ fontFamily: "var(--serif)", fontWeight: 700 }}>Atlas</span>
            </span>
          </span>
        </Link>
        <nav className="links" aria-label="Site">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <Link href="/signin" className="signin">
          Sign in
        </Link>
        <Link href="/demo" className="btn btn-white" data-test="nav-demo">
          <span>Book a demo</span>
          <Icon name="arrow-right" />
        </Link>
        <label htmlFor="mk-nav-toggle" className="mk-burger" aria-label="Open menu" role="button" tabIndex={0}>
          <span></span>
          <span></span>
          <span></span>
        </label>
      </div>
      <div className="mk-mobile-panel">
        <nav aria-label="Site">
          {NAV_LINKS.map(([href, label]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <div className="mk-mobile-acts">
          <Link href="/signin" className="mk-mobile-signin">
            Sign in
          </Link>
          <Link href="/demo" className="btn btn-white btn-block">
            <span>Book a demo</span>
            <Icon name="arrow-right" />
          </Link>
        </div>
      </div>
    </header>
  );
}

function BrandMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="37 32 54 64" aria-label="SuperAtlas" role="img">
      <path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="#ffffff" />
      <path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="#1B2056" strokeWidth={3} fill="none" />
      <path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="#1B2056" strokeWidth={2.2} fill="none" />
      <path d="M49.5 63H62" stroke="#1B2056" strokeWidth={2.2} />
      <path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
