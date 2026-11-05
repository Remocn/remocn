import type { Metadata } from "next";
import { SITE_PAGES, sitePageOgImage } from "@/config/site-pages";
import { CreditsSection } from "./components/credits";
import { SponsorsHero } from "./components/hero";
import { TiersSection } from "./components/tiers";
import { TrafficSection } from "./components/traffic";

const DESCRIPTION = SITE_PAGES.sponsors.description;

export const metadata: Metadata = {
  title: "Sponsors",
  description: DESCRIPTION,
  alternates: { canonical: "/sponsors" },
  openGraph: {
    type: "website",
    url: "/sponsors",
    siteName: "Remocn",
    title: "Sponsors · Remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [sitePageOgImage("sponsors")],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsors · Remocn",
    description: DESCRIPTION,
    images: [sitePageOgImage("sponsors").url],
  },
};

export default function SponsorsPage() {
  return (
    <>
      <SponsorsHero />
      <TrafficSection />
      <TiersSection />
      <CreditsSection />
    </>
  );
}
