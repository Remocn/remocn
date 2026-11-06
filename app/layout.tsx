import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import { Geist_Mono, Manrope } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { OpenPanelComponent } from "@openpanel/nextjs";
import { SITE_DESCRIPTION } from "@/config/site";
import { cn } from "@/lib/utils";
import { ThemeShortcut } from "./theme-shortcut";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

// The `geist` package ships the full Geist charset; the Google Fonts build
// lacks glyphs like "→" that the design uses throughout.
const geistSans = GeistSans;

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Paper Mono (SIL OFL 1.1, see ./fonts/PaperMono-OFL.txt) is the only mono
// face in the design system: commands, code, paths and `@remocn/...` names.
const paperMono = localFont({
  src: "./fonts/PaperMono-Variable.woff2",
  variable: "--font-paper-mono",
  weight: "100 800",
  display: "swap",
});

const SITE_URL = "https://remocn.dev";
const SITE_TITLE = "Remocn - Make a product demo video with your AI agent";

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
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(
        "h-full",
        "antialiased",
        geistSans.variable,
        geistMono.variable,
        paperMono.variable,
        "font-sans",
        manrope.variable,
      )}
    >
      <body className="min-h-full flex flex-col">
        <NuqsAdapter>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ThemeShortcut />
            {children}
          </ThemeProvider>
        </NuqsAdapter>
        <OpenPanelComponent
          clientId={process.env.NEXT_PUBLIC_OPENPANEL_CLIENT_ID as string}
          apiUrl={process.env.NEXT_PUBLIC_OPENPANEL_API_URL}
          trackScreenViews
          trackAttributes
          trackOutgoingLinks
          // /embed/* runs inside MCP App iframes in chat hosts; its URL carries
          // the user's props, so nothing there is tracked.
          filter="function () { return !window.location.pathname.startsWith('/embed/'); }"
        />
      </body>
    </html>
  );
}
