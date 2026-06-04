import { FOOTER_NAV, HOME_NAV } from "@/config/landing";
import { getGitHubStars } from "@/lib/github";
import { PageShell } from "./components/page-shell";
import { BentoRegistry } from "./components/sections/bento-registry";
import { FinalCTA } from "./components/sections/final-cta";
import { GetStarted } from "./components/sections/get-started";
import { Hero } from "./components/sections/hero";
import { LandingCodeShowcase } from "./components/sections/landing-code-showcase";
import { LandingPartners } from "./components/sections/landing-partners";
import { WorksWith } from "./components/sections/works-with";
import { SiteFooter } from "./components/site-footer";
import { SiteHeader } from "./components/site-header";

export default async function Page() {
  const githubStars = await getGitHubStars();

  return (
    <PageShell>
      <SiteHeader navLinks={HOME_NAV} githubStars={githubStars} />
      <main className="relative flex-1">
        <Hero />
        <WorksWith />
        <LandingCodeShowcase />
        <BentoRegistry />
        <GetStarted />
        <LandingPartners />
        <FinalCTA />
        <SiteFooter navLinks={FOOTER_NAV} className="mt-12" />
      </main>
    </PageShell>
  );
}
