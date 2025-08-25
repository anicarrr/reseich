import { Geist, Geist_Mono } from "next/font/google";
import "./index.css";
import Providers from "./lib/providers";
import { Navigation } from "@/components/Navigation";
import type { Metadata } from "next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ReSeich - Sei Research & DeSci Platform",
    template: "%s | ReSeich",
  },
  description:
    "Sei Research & DeSci Platform - Access advanced AI research tools, monetize your work, and discover groundbreaking insights on Sei Network",
  keywords: [
    "research",
    "DeSci",
    "Sei Network",
    "AI",
    "blockchain",
    "decentralized science",
    "cryptocurrency",
    "web3",
  ],
  authors: [{ name: "ReSeich Team" }],
  creator: "ReSeich",
  publisher: "ReSeich",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://reseich.xyz"),
  alternates: {
    canonical: "/",
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
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://reseich.xyz",
    title: "ReSeich - Sei Research & DeSci Platform",
    description:
      "Access advanced AI research tools, monetize your work, and discover groundbreaking insights on Sei Network",
    siteName: "ReSeich",
    images: [
      {
        url: "/logo-main.png",
        width: 1200,
        height: 630,
        alt: "ReSeich - Decentralized Science Platform on Sei Network",
        type: "image/png",
      },
      {
        url: "/logo-main.svg",
        width: 1200,
        height: 630,
        alt: "ReSeich Logo",
        type: "image/svg+xml",
      },
    ],
    videos: [],
    audio: [],
    determiner: "auto",
    countryName: "Global",
    emails: ["contact@reseich.xyz"],
    phoneNumbers: [],
    faxNumbers: [],
    alternateLocale: ["es_ES", "pt_BR", "fr_FR"],
  },
  twitter: {
    card: "summary_large_image",
    title: "ReSeich - Sei Research & DeSci Platform",
    description:
      "Access advanced AI research tools, monetize your work, and discover groundbreaking insights on Sei Network",
    images: [
      {
        url: "/logo-main.png",
        alt: "ReSeich - Decentralized Science Platform on Sei Network",
        width: 1200,
        height: 630,
      },
    ],
    creator: "@reseich",
    site: "@reseich",
  },
  icons: {
    icon: [
      {
        url: "/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
    shortcut: "/favicon_io/favicon.ico",
  },
  manifest: "/favicon_io/site.webmanifest",
  other: {
    "theme-color": "#1a2035",
    "color-scheme": "dark",
    "msapplication-TileColor": "#1a2035",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "ReSeich",
    // Additional OG tags for better sharing
    "og:image:secure_url": "https://reseich.xyz/logo-main.png",
    "og:image:width": "1200",
    "og:image:height": "630",
    "og:updated_time": new Date().toISOString(),
    "article:author": "ReSeich Team",
    "article:publisher": "https://reseich.xyz",
    "fb:app_id": "your-facebook-app-id",
    // LinkedIn specific
    "linkedin:owner": "ReSeich",
    // Additional meta tags for better SEO and sharing
    "og:rich_attachment": "true",
    "og:see_also": "https://reseich.xyz/explore",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="ReSeich" />
        <meta name="application-name" content="ReSeich" />
        <meta name="msapplication-TileColor" content="#1a2035" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="theme-color" content="#1a2035" />
        <meta name="color-scheme" content="dark" />
        
        {/* Additional meta tags for better sharing */}
        <meta name="referrer" content="origin-when-cross-origin" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="HandheldFriendly" content="true" />
        <meta name="MobileOptimized" content="320" />
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* Canonical URL */}
        <link rel="canonical" href="https://reseich.xyz" />
        
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://reseich.xyz" />
        
        {/* Additional structured data for rich snippets */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "ReSeich",
              "description": "Sei Research & DeSci Platform - Access advanced AI research tools, monetize your work, and discover groundbreaking insights on Sei Network",
              "url": "https://reseich.xyz",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "ReSeich Team"
              },
              "publisher": {
                "@type": "Organization",
                "name": "ReSeich",
                "logo": {
                  "@type": "ImageObject",
                  "url": "https://reseich.xyz/logo-main.png"
                }
              }
            })
          }}
        />
        
        <script
          defer
          data-website-id="68aa6fe1f36b2bd7d61347a7"
          data-domain="reseich.vercel.app"
          src="https://datafa.st/js/script.js"
        ></script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-900`}
      >
        <Providers>
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-[#1a2035] to-[#1f263e] relative">
            {/* Floating particles background */}
            <div className="particles">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="particle"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 8}s`,
                    animationDuration: `${8 + Math.random() * 4}s`,
                  }}
                />
              ))}
            </div>

            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-20 left-10 w-72 h-72 bg-[#e9407a]/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute top-40 right-20 w-96 h-96 bg-[#ff8a00]/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
              <div className="absolute bottom-20 left-1/4 w-80 h-80 bg-[#3b82f6]/10 rounded-full blur-3xl animate-pulse delay-2000"></div>

              {/* Circuit-like lines */}
              <div className="absolute top-0 left-0 w-full h-full">
                <svg
                  className="w-full h-full opacity-20"
                  viewBox="0 0 1200 800"
                  fill="none"
                >
                  <path
                    d="M0 200 Q300 150 600 200 T1200 200"
                    stroke="url(#gradient1)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M0 400 Q300 350 600 400 T1200 400"
                    stroke="url(#gradient2)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M0 600 Q300 550 600 600 T1200 600"
                    stroke="url(#gradient3)"
                    strokeWidth="2"
                    fill="none"
                  />
                  <defs>
                    <linearGradient
                      id="gradient1"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#e9407a" stopOpacity="0.6" />
                      <stop
                        offset="100%"
                        stopColor="#ff8a00"
                        stopOpacity="0.6"
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradient2"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#ff8a00" stopOpacity="0.6" />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity="0.6"
                      />
                    </linearGradient>
                    <linearGradient
                      id="gradient3"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                      <stop
                        offset="100%"
                        stopColor="#e9407a"
                        stopOpacity="0.6"
                      />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>

            {/* Global Navigation */}
            <Navigation />

            {/* Page Content */}
            <div className="relative z-10">{children}</div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
