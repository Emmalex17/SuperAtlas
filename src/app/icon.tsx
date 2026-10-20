import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#1B2056",
          borderRadius: 14,
        }}
      >
        <svg width="46" height="46" viewBox="37 32 54 64">
          <path d="M64 35L87 43.5V62C87 76.5 77.5 87 64 93C50.5 87 41 76.5 41 62V43.5L64 35Z" fill="#ffffff" />
          <path d="M64 77.5C72 77.5 78.5 71 78.5 63C78.5 55 72 48.5 64 48.5C56 48.5 49.5 55 49.5 63C49.5 71 56 77.5 64 77.5Z" stroke="#1B2056" strokeWidth="3" fill="none" />
          <path d="M64 77.5C67.6 77.5 70.5 71 70.5 63C70.5 55 67.6 48.5 64 48.5C60.4 48.5 57.5 55 57.5 63C57.5 71 60.4 77.5 64 77.5Z" stroke="#1B2056" strokeWidth="2.2" fill="none" />
          <path d="M49.5 63H62" stroke="#1B2056" strokeWidth="2.2" />
          <path d="M59 64.5L64.5 70L77 56" stroke="#DBA94D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
