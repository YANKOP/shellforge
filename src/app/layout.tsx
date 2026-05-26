import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShellForge — AI Shell Command Builder",
  description: "Describe what you want to do in plain English. Get the exact shell command with explanation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#080c10] text-slate-200 antialiased">{children}</body>
    </html>
  );
}
