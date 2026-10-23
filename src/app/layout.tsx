import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4 } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ToastProvider } from "@/components/Toast";
import "./globals.css";

const sans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
});

const serif = Source_Serif_4({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://superatlas-green.vercel.app"),
  title: {
    default: "SuperAtlas — Supervisory technology for regulators",
    template: "%s · SuperAtlas",
  },
  description: "SuperAtlas brings regulatory returns, evidence, assessments and findings into one supervisory view, so you know who is compliant, where the gaps are, and where to act next.",
  openGraph: {
    type: "website",
    siteName: "SuperAtlas",
    title: "SuperAtlas — Supervisory technology for regulators",
    description: "See every organisation you supervise, and the evidence behind it. Returns, evidence, assessments and findings in one view.",
  },
  twitter: {
    card: "summary_large_image",
    title: "SuperAtlas — Supervisory technology for regulators",
    description: "See every organisation you supervise, and the evidence behind it.",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable} ${serif.variable} antialiased`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
        <Analytics />
      </body>
    </html>
  );
}
