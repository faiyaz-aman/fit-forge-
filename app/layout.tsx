import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SWRegister } from "@/components/shared/sw-register";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitForge — AI-Powered Personal Fitness Tracking",
  description: "A premium, minimal, AI-driven personal fitness coaching and tracking experience.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
    >
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&amp;family=Geist:wght@600;700;800&amp;family=JetBrains+Mono:wght@500&amp;display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <SWRegister />
        {children}
      </body>
    </html>
  );
}
