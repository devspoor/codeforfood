import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/Providers";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://codefor.food";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "codeforfood — Project Billing Tracker for Freelancers",
    template: "%s | codeforfood",
  },
  description:
    "Create projects with milestones, track payments, and share progress with clients via a single link. Billing tracker built for freelancers.",
  keywords: [
    "freelance billing",
    "project tracker",
    "milestone payments",
    "invoice tracker",
    "freelancer tools",
    "payment tracking",
    "client billing",
  ],
  authors: [{ name: "codeforfood" }],
  creator: "codeforfood",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: baseUrl,
    siteName: "codeforfood",
    title: "codeforfood — Project Billing Tracker for Freelancers",
    description:
      "Create projects with milestones, track payments, and share progress with clients via a single link.",
  },
  twitter: {
    card: "summary",
    title: "codeforfood — Project Billing Tracker for Freelancers",
    description:
      "Create projects with milestones, track payments, and share progress with clients via a single link.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: baseUrl,
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "codeforfood",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-background text-foreground antialiased font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
