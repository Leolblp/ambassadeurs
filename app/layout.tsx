import type { Metadata, Viewport } from "next";
import { Anton, Instrument_Serif, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Consentement from "./_components/Consentement";
import "./globals.css";

const display = Anton({ weight: "400", subsets: ["latin"], variable: "--font-display" });
const serif = Instrument_Serif({ weight: "400", style: ["normal", "italic"], subsets: ["latin"], variable: "--font-serif" });
const body = Manrope({ subsets: ["latin"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "XOXO Club · La Commerciale",
  description: "Le cercle privé de La Commerciale. Sur invitation uniquement.",
  robots: { index: false, follow: false },
  applicationName: "XOXO Club",
  appleWebApp: { capable: true, title: "XOXO Club", statusBarStyle: "black" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0707",
  colorScheme: "dark",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${display.variable} ${serif.variable} ${body.variable}`}>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
        <Consentement />
      </body>
    </html>
  );
}
