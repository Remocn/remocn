import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Outfit } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { OpenPanelComponent } from "@openpanel/nextjs";
import { cn } from "@/lib/utils";
import { ThemeShortcut } from "./theme-shortcut";

const inter = Manrope({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

const SITE_URL = "https://remocn.dev";
const SITE_TITLE = "Remocn - Cinematic video components for React";
const SITE_DESCRIPTION =
  "Production-ready Remotion animations, transitions and backgrounds. Install with the shadcn CLI and own the code";

export const metadata: Metadata = {
  // Resolves the relative `/hero.png` below into an absolute URL for crawlers.
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s · Remocn",
  },
  description: SITE_DESCRIPTION,
  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: "Remocn",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 675,
        alt: SITE_TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: ["/hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        outfit.variable,
        "font-sans",
        inter.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <NuqsAdapter>
          <RootProvider
            theme={{
              defaultTheme: "system",
              enableSystem: true,
            }}
          >
            <ThemeShortcut />
            {children}
          </RootProvider>
        </NuqsAdapter>
        <OpenPanelComponent
          clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID as string}
          apiUrl={process.env.NEXT_PUBLIC_OPENPANEL_API_URL}
          trackScreenViews
          trackAttributes
          trackOutgoingLinks
        />
      </body>
    </html>
  );
}
