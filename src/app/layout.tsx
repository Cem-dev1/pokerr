// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Casino Poker - Deck Builder",
  description: "1v1 Stratejik Deck-Builder Poker Oyunu",
  keywords: ["poker", "casino", "deck-builder", "strateji", "kart", "oyun"],
  authors: [{ name: "Casino Poker Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Casino Poker - Deck Builder",
    description: "1v1 Stratejik Deck-Builder Poker Oyunu",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Casino Poker - Deck Builder",
    description: "1v1 Stratejik Deck-Builder Poker Oyunu",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-white overflow-hidden h-screen`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}