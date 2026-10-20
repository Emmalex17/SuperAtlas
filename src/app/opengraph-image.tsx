import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "radial-gradient(1100px 650px at 85% -10%, #4f46e5 0%, rgba(79,70,229,0) 60%), #0f1240",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <svg width="44" height="44" viewBox="37 32 54 64">
            <path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="#ffffff" />
            <path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="#1B2056" strokeWidth="3" fill="none" />
            <path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="#1B2056" strokeWidth="2.2" fill="none" />
            <path d="M49.5 63H62" stroke="#1B2056" strokeWidth="2.2" />
            <path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </svg>
          <span style={{ fontSize: 30, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>
            Super<span style={{ fontWeight: 700 }}>Atlas</span>
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 56, maxWidth: 920 }}>
          <span style={{ fontSize: 60, fontWeight: 600, lineHeight: 1.12, color: "#fff", letterSpacing: "-0.02em" }}>
            See every organisation you supervise, and the evidence behind it.
          </span>
        </div>
        <div style={{ display: "flex", marginTop: 36 }}>
          <span style={{ fontSize: 24, color: "#b6b9e8", lineHeight: 1.5, maxWidth: 820 }}>
            Supervisory technology for regulators: returns, evidence, assessments and findings in one view.
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
