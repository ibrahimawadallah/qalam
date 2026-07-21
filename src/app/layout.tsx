import type { Metadata } from "next";
import { Space_Grotesk, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";
import StoreHydrator from "@/components/store-hydrator";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quran Kareem - Listen to Full Surah Audio & Translations",
  description:
    "Quran Kareem - A premium Quran streaming application by MedTechAI Arab Organization. Listen to the Holy Quran recited by world-renowned Qaris with beautiful gapless audio streaming, reading mode, and more.",
  keywords: [
    "Quran",
    "Quran Kareem",
    "Islamic",
    "Quran Streaming",
    "Qari",
    "Recitation",
    "MedTechAI",
  ],
  metadataBase: new URL("https://quran.medtechai.net"),
  icons: {
    icon: [
      { url: "/logo.svg?v=2", type: "image/svg+xml" },
      { url: "/favicon.ico?v=2", sizes: "any" },
    ],
    apple: "/logo.jpg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "Quran Kareem - Full Surah Audio & Translations",
    description: "A premium Quran streaming application by MedTechAI Arab Organization",
    type: "website",
    url: "https://quran.medtechai.net",
    siteName: "Quran Kareem",
    images: [
      {
        url: "/logo.jpg",
        width: 512,
        height: 512,
        alt: "Quran Kareem App",
      },
    ],
  },
  alternates: {
    canonical: "https://quran.medtechai.net",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Quran Kareem",
  },
  mobileWebAppCapable: true,
  applicationName: "Quran Kareem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#fbbf24" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quran Kareem" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/logo.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.jpg" />
        <link
          href="https://fonts.googleapis.com/css2?family=Scheherazade+New:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${spaceGrotesk.variable} ${outfit.variable} font-sans antialiased`}
        style={{
          fontFamily:
            'var(--font-outfit), "Outfit", system-ui, sans-serif',
        }}
      >
        <ErrorBoundary>
          <StoreHydrator />
          {children}
          <Toaster />
        </ErrorBoundary>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((registration) => {
                    console.log('SW registered: ', registration);
                  }).catch((registrationError) => {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

