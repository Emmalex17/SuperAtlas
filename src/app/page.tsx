"use client";

import { useEffect, useRef } from "react";
import { mkFooter, heroCopyHtml, sectionProof, sectionIntro, storyFeature1Html, storyFeature2Html, tailSectionsHtml } from "@/lib/landingContent";
import { MioHero } from "@/components/landing/MioHero";
import { FeatureVideo } from "@/components/landing/FeatureVideo";
import { SiteHeader } from "@/components/landing/SiteHeader";

export default function Home() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.slice(1));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    }
  }, []);

  return (
    <div className="mk" ref={ref}>
      <SiteHeader />

      <section className="band hero" aria-labelledby="hero-h">
        <span className="glow g1" />
        <span className="glow g2" />
        <span className="glow g3" />
        <div className="wrap">
          <div dangerouslySetInnerHTML={{ __html: heroCopyHtml() }} />
          <MioHero />
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: sectionProof() + sectionIntro() }} />

      <section className="sa-section sa-feature sa-feature-purple" id="s-strength">
        <div className="sa-shell sa-split">
          <div dangerouslySetInnerHTML={{ __html: storyFeature1Html() }} />
          <div className="sa-motion-shell">
            <div className="sa-motion-tag">Watch the workflow</div>
            <FeatureVideo src="/media/feature-0.mp4" poster="/media/feature-0-poster.jpg" label="Supervisory overview: NITDA opens My dashboard, clicks Non-compliant, opens an organisation and its compliance history" />
            <div className="sa-motion-meta">
              <strong>Supervisory overview</strong>
              <span className="sa-motion-notice">Real prototype · demo data</span>
            </div>
          </div>
        </div>
      </section>

      <section className="sa-section sa-feature" id="s-evidence">
        <div className="sa-shell sa-split sa-reverse">
          <div dangerouslySetInnerHTML={{ __html: storyFeature2Html() }} />
          <div className="sa-motion-shell">
            <div className="sa-motion-tag">Watch the workflow</div>
            <FeatureVideo src="/media/feature-1.mp4" poster="/media/feature-1-poster.jpg" label="Evidence review: an assurance firm reviews evidence on a requirement and records the outcome" />
            <div className="sa-motion-meta">
              <strong>Evidence review</strong>
              <span className="sa-motion-notice">Real prototype · demo data</span>
            </div>
          </div>
        </div>
      </section>

      <div dangerouslySetInnerHTML={{ __html: tailSectionsHtml() }} />
      <div dangerouslySetInnerHTML={{ __html: mkFooter() }} />
    </div>
  );
}
