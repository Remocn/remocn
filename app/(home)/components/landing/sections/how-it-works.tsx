import { LandingButton } from "../ui/landing-button";
import { SectionTitle } from "../ui/section-title";
import { AgentSession } from "./how-it-works/agent-session";
import { StepsLegend } from "./how-it-works/steps-legend";

const SETUP_GUIDE_HREF = "/docs/guides/setup";

export function HowItWorks() {
  return (
    <section
      data-section="how-it-works"
      className="pt-[72px] xl:pt-[120px] xl:pb-[140px]"
    >
      <div className="landing-container flex flex-col gap-8 xl:flex-row xl:items-center xl:gap-[60px]">
        <div className="flex flex-col gap-[18px] md:gap-[22px] xl:w-[420px] xl:shrink-0 xl:pt-3">
          <SectionTitle
            title="How it works"
            continuation="The whole setup is one session."
            className="text-[34px]/[36px] text-wrap md:text-h2"
          />
          <p
            data-reveal
            className="text-ui leading-6 text-paragraph [--reveal-i:2] md:text-[18px] md:leading-[27px]"
          >
            An agent, an empty folder and a single prompt. You describe, it
            builds, you watch it happen.
          </p>
          <StepsLegend />
          <div data-reveal className="pt-1.5 [--reveal-i:6] md:pt-2">
            <LandingButton
              href={SETUP_GUIDE_HREF}
              variant="secondary"
              size="md"
              meta="10 min"
              arrow="→"
              className="w-full md:w-auto"
              data-track="cta_clicked"
              data-cta="how_it_works_setup"
              data-destination={SETUP_GUIDE_HREF}
            >
              Read the setup guide
            </LandingButton>
          </div>
        </div>
        <AgentSession />
      </div>
    </section>
  );
}
