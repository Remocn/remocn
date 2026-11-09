import { LandingButton } from "../ui/landing-button";
import { HeroHeadline } from "./hero/hero-headline";
import { PromptStage } from "./hero/prompt-stage";
import { StudioPill } from "./hero/studio-pill";

export function Hero() {
  return (
    <section data-section="hero" className="relative">
      {/* Page-top wash, starts under the transparent 92px header. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -top-[92px] -z-10 h-[1502px] bg-[linear-gradient(180deg,#E9E9EA_0%,#F4F4F5_30%,#FAFAFA_55%)] dark:hidden"
      />

      <div className="flex flex-col items-center px-5 pt-8 md:px-10 md:pt-20">
        <StudioPill />
        <HeroHeadline />
        <div className="flex w-full flex-col items-center gap-6 pt-5 md:gap-[30px] md:pt-[30px]">
          <p className="hero-in max-w-[640px] text-center [--reveal-i:3] text-[18px] leading-[26px] text-body md:text-lead md:leading-7">
            Remocn is shadcn/ui for video. Describe your product to your AI
            agent, and it builds the demo video from{" "}
            <span className="whitespace-nowrap">ready-made</span> pieces while
            you watch in the browser.
          </p>
          <div className="hero-in hero-rise flex w-full flex-col gap-2.5 [--reveal-i:4] md:w-auto md:flex-row">
            <LandingButton
              href="/docs/guides/setup"
              arrow="→"
              className="w-full md:w-auto"
            >
              Make your first video
            </LandingButton>
            <LandingButton
              href="/showcases"
              variant="secondary"
              className="w-full md:w-auto"
            >
              See what ships
            </LandingButton>
          </div>
        </div>
      </div>

      <PromptStage />
    </section>
  );
}
