import { BentoRegistry } from "./components/sections/bento-registry";
import { FinalCTA } from "./components/sections/final-cta";
import { GetStarted } from "./components/sections/get-started";
import { Hero } from "./components/sections/hero";
import { InteractiveCode } from "./components/sections/interactive-code";
import { LandingPartners } from "./components/sections/landing-partners";
import { Testimonials } from "./components/sections/testimonials";
import { UiRegistry } from "./components/sections/ui-registry";

export default function Page() {
  return (
    <>
      <Hero />
      <InteractiveCode />
      <BentoRegistry />
      <UiRegistry />
      <GetStarted />
      <LandingPartners />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
