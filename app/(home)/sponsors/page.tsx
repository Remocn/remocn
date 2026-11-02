import type { Metadata } from "next";
import { CreditsSection } from "./components/credits";
import { SponsorsHero } from "./components/hero";
import { TiersSection } from "./components/tiers";
import { TrafficSection } from "./components/traffic";

const DESCRIPTION =
  "Support remocn and keep the components free and open source. Back the project monthly, from a name in the README to your logo on the landing page.";

export const metadata: Metadata = {
  title: "Sponsors",
  description: DESCRIPTION,
  alternates: { canonical: "/sponsors" },
  openGraph: {
    type: "website",
    url: "/sponsors",
    siteName: "Remocn",
    title: "Sponsors · remocn",
    description: DESCRIPTION,
    locale: "en_US",
    images: [
      { url: "/hero.png", width: 1200, height: 675, alt: "Sponsors · remocn" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sponsors · remocn",
    description: DESCRIPTION,
    images: ["/hero.png"],
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
