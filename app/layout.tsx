import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CredAI — Interactive AI Spend Audit",
  description: "Identify overspend, redundancies, and unlock discount opportunities on your startup's AI stack.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
