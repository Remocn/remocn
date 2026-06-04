import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import { Geist, Geist_Mono, Manrope, Outfit } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import "./globals.css";
import { OpenPanelComponent } from "@openpanel/nextjs";
import { cn } from "@/lib/utils";

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

export const metadata: Metadata = {
  title: {
    default: "remocn — Cinematic video components for React",
    template: "%s · remocn",
  },
  description:
    "Production-ready Remotion animations, transitions and backgrounds. Install with the shadcn CLI and own the code.",
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
