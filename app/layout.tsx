import type { Metadata } from "next";
import "./globals.css";
import PageLoader from "@/components/PageLoader";
import AIChat from "@/components/AIChat";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://help.lime.mn';

export const metadata: Metadata = {
  title: "LIME тусламж - Knowledge Base",
  description: "LIME-ийн тусламж, зааварчилгаа болон түгээмэл асуултууд",
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'LIME тусламж - Knowledge Base',
    description: 'LIME-ийн тусламж, зааварчилгаа болон түгээмэл асуултууд',
    url: siteUrl,
    siteName: 'LIME тусламж',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'LIME тусламж - Зааварчилгаа • Тусламж • Асуулт хариулт',
      },
    ],
    locale: 'mn_MN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LIME тусламж - Knowledge Base',
    description: 'LIME-ийн тусламж, зааварчилгаа болон түгээмэл асуултууд',
    images: [`${siteUrl}/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="mn">
      <body
        className="font-sans antialiased"
        style={{ fontFamily: "'Mulish', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
      >
        <PageLoader/>
        {children}
        <AIChat/>
      </body>
    </html>
  );
}
