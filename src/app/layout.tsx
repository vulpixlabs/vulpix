import type { Metadata, Viewport } from "next";
import { Figtree, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { TrailCanvas } from "@/components/trail-canvas";
import { SiteNavbar } from "@/components/site-navbar";
import { PWA } from "@/components/pwa";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  fallback: ["system-ui", "arial"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  preload: true,
  fallback: ["ui-serif", "Georgia"],
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://vulpixlabs.vercel.app";
const DESCRIPTION = "The intelligent gateway to AI.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: "Vulpix",
  title: {
    default: "Vulpix",
    template: "%s | Vulpix",
  },
  description: DESCRIPTION,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Vulpix",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "Vulpix",
    title: "Vulpix",
    description: DESCRIPTION,
    url: "/",
  },
  twitter: {
    card: "summary",
    title: "Vulpix",
    description: DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#F54F1B",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${figtree.variable} ${instrumentSerif.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <PWA>
          <TrailCanvas />
          <SiteNavbar />
          <main className="flex-1">{children}</main>
        </PWA>
      </body>
    </html>
  );
}
