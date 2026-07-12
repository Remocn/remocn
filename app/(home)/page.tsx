import { FinalCTA } from "./components/sections/final-cta";
import { GetStarted } from "./components/sections/get-started";
import { Hero } from "./components/sections/hero";
import { LandingPartners } from "./components/sections/landing-partners";
import { Testimonials } from "./components/sections/testimonials";
import { WhatsInside } from "./components/sections/whats-inside";
import { WhyRemocn } from "./components/sections/why-remocn";

export default function Page() {
  return (
    <>
      <Hero />
      <WhyRemocn />
      <WhatsInside />
      <GetStarted />
      <LandingPartners />
      <Testimonials />
      <FinalCTA />
    </>
  );
}
