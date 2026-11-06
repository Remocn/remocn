import type { Metadata } from "next";
import { JsonLd } from "@/components/json-ld";
import { SITE_DESCRIPTION } from "@/config/site";
import { HOME_KEYWORDS, homeJsonLd } from "@/lib/structured-data";
import { FinalCta } from "./components/landing/sections/final-cta";
import { Hero } from "./components/landing/sections/hero";
import { HowItWorks } from "./components/landing/sections/how-it-works";
import { SponsorsStrip } from "./components/landing/sections/sponsors-strip";
import { StudioPipeline } from "./components/landing/sections/studio-pipeline";
import { TestimonialsWall } from "./components/landing/sections/testimonials-wall";
import { WhatsInside } from "./components/landing/sections/whats-inside";
import { WhyRemocn } from "./components/landing/sections/why-remocn";
import { PauseOffscreen } from "./components/landing/ui/pause-offscreen";
import { RevealScope } from "./components/landing/ui/reveal-scope";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  keywords: HOME_KEYWORDS,
};

export default function Page() {
  return (
    <>
      <JsonLd data={homeJsonLd(SITE_DESCRIPTION)} />
      <Hero />
      <SponsorsStrip />
      <HowItWorks />
      <WhatsInside />
      <StudioPipeline />
      <WhyRemocn />
      <TestimonialsWall />
      <FinalCta />
      <RevealScope />
      <PauseOffscreen />
    </>
  );
}
