import type { Metadata } from "next";
import { Hero } from "./components/sections/hero";
import { Tiers } from "./components/sections/tiers";
import { WallOfLove } from "./components/sections/wall-of-love";

const DESCRIPTION =
  "Support remocn and keep the components free and open source. Back the project monthly or one-time and get your logo in front of the community.";

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
      <Hero />
      <Tiers />
      <WallOfLove />
    </>
  );
}
