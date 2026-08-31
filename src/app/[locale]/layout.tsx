import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, Inter, Amiri } from "next/font/google";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { locales } from "@/i18n/request";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import ErrorBoundary from "@/components/error-boundary";
import StoreHydrator from "@/components/store-hydrator";
import TopNav from "@/components/top-nav";
import RadioPlayer from "@/components/radio-player";
import AudioPlayer from "@/components/audio-player";
import RadioPanel from "@/components/radio-panel";
import ReciterPanel from "@/components/reciter-panel";
import Footer from "@/components/footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const SEO: Record<string, Metadata> = {
  en: {
    title: "Quran Kareem - Listen to Full Surah Audio & Translations",
    description:
      "A premium Quran streaming application by MedTechAI Arab Organization. Listen to the Holy Quran recited by world-renowned Qaris with beautiful gapless audio streaming, reading mode, and more.",
    keywords: ["Quran", "Quran Kareem", "Islamic", "Quran Streaming", "Qari", "Recitation", "MedTechAI"],
  },
  ar: {
    title: "قرآن كريم — استمع إلى ترتيل السور الكامل والترجمات",
    description:
      "تطبيق ترتيل القرآن الكريم من مؤسسة ميدتك عرب. استمع إلى القرآن الكريم يتلوه قراء عالميون بصوت متصل خالٍ من التوقف، مع وضع القراءة والمزيد.",
    keywords: ["قرآن", "قرآن كريم", "إسلامي", "بث القرآن", "قارئ", "ترتيل", "ميدتك عرب"],
  },
};

export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const seo = SEO[locale] || SEO.en;

  return {
    ...seo,
    metadataBase: new URL("https://quran.medtechai.net"),
    icons: {
      icon: [
        { url: "/logo.svg?v=2", type: "image/svg+xml" },
        { url: "/favicon.ico?v=2", sizes: "any" },
      ],
      apple: "/logo.svg",
    },
    manifest: "/manifest.json",
    openGraph: {
      title: seo.title,
      description: seo.description,
      type: "website",
      url: "https://quran.medtechai.net",
      siteName: "Quran Kareem",
      locale: locale === "ar" ? "ar_SA" : "en_US",
      alternateLocale: locale === "ar" ? "en_US" : "ar_SA",
      images: [
        {
          url: "/logo.svg",
          width: 512,
          height: 512,
          alt: "Quran Kareem App",
        },
      ],
    },
    alternates: {
      canonical: "https://quran.medtechai.net",
      languages: {
        en: "/en",
        ar: "/ar",
      },
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "Quran Kareem",
    },
    applicationName: "Quran Kareem",
  };
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  if (!locales.includes(locale as "en" | "ar")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#1A2E4A" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Quran Kareem" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="format-detection" content="telephone=no" />
        <link rel="icon" href="/logo.svg?v=2" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="apple-touch-icon" href="/logo.svg" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body
        className={`${cormorant.variable} ${lora.variable} ${inter.variable} ${amiri.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ErrorBoundary>
            <StoreHydrator />
            <TopNav />
            {children}
            <Toaster />
            <RadioPlayer />
            <AudioPlayer />
            <RadioPanel />
            <ReciterPanel />
            <Footer />
          </ErrorBoundary>
        </NextIntlClientProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then((registration) => {
                    console.log('SW registered: ', registration);
                    if (registration.waiting) {
                      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
                    }
                    registration.addEventListener('updatefound', () => {
                      const newWorker = registration.installing;
                      if (newWorker) {
                        newWorker.addEventListener('statechange', () => {
                          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            newWorker.postMessage({ type: 'SKIP_WAITING' });
                          }
                        });
                      }
                    });
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
