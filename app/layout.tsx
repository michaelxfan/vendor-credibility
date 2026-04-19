import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SuiteNav } from "@/components/SuiteNav";

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
      <body className="font-sans leading-relaxed h-screen flex flex-col overflow-hidden">
        <SuiteNav active="vendors" />
        <div className="flex-1 min-h-0">{children}</div>
      </body>
    </html>
  );
}
