import { FOOTER_NAV, SPONSORS_NAV } from "@/config/landing";
import { getGitHubStars } from "@/lib/github";
import { PageShell } from "../components/page-shell";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import { Hero } from "./components/sections/hero";
import { Tiers } from "./components/sections/tiers";
import { WallOfLove } from "./components/sections/wall-of-love";

export default async function SponsorsPage() {
  const githubStars = await getGitHubStars();

  return (
    <PageShell>
      <SiteHeader navLinks={SPONSORS_NAV} githubStars={githubStars} />
      <main className="relative flex-1">
        <Hero />
        <Tiers />
        <WallOfLove />
        <SiteFooter navLinks={FOOTER_NAV} className="mt-20" />
      </main>
    </PageShell>
  );
}
