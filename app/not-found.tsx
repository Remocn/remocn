import type { Metadata } from "next";
import { LandingButton } from "@/app/(home)/components/landing/ui/landing-button";
import { SectionTitle } from "@/app/(home)/components/landing/ui/section-title";
import { PageShell } from "@/app/(home)/components/page-shell";
import { SiteFooter } from "@/app/(home)/components/site-footer";
import { SiteHeader } from "@/app/(home)/components/site-header";
import { NotFoundVideo } from "./not-found-video";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: true },
};

const BUTTON = "h-12 w-full md:w-auto";

export default function NotFound() {
  return (
    <PageShell className="min-h-dvh">
      <SiteHeader />

      <main className="relative isolate flex flex-1 flex-col">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-grid-fade" />
        </div>

        <div className="relative min-h-[200px] flex-1">
          <NotFoundVideo />
        </div>

        <div className="landing-container flex shrink-0 flex-col items-center gap-4 pt-4 pb-10 text-center md:gap-5 md:pt-6 md:pb-14">
          <SectionTitle
            as="h1"
            align="center"
            title="This page doesn’t exist"
          />
          <p className="max-w-[560px] text-ui leading-6 text-muted-foreground text-balance md:text-lead md:leading-7">
            The link is broken, or the page moved. The components, docs and
            showcases are all still where you left them.
          </p>
          <div className="flex w-full flex-col gap-2.5 pt-2 md:w-auto md:flex-row">
            <LandingButton href="/" size="md" arrow="→" className={BUTTON}>
              Back home
            </LandingButton>
            <LandingButton
              href="/docs/typography"
              variant="secondary"
              size="md"
              className={BUTTON}
            >
              Browse components
            </LandingButton>
          </div>
        </div>
      </main>

      <SiteFooter />
    </PageShell>
  );
}
