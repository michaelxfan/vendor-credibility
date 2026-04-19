import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vendor Credibility",
  description:
    "Operator-grade vendor credibility assessments: score, risks, discovery questions.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans leading-relaxed min-h-screen">{children}</body>
    </html>
  );
}
