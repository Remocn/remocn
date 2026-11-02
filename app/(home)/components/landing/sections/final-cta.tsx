import { GITHUB_URL } from "@/config/site";
import { LandingButton } from "../ui/landing-button";
import { LiveSilk } from "../ui/live-silk";

/** Shader panel darkened toward the centre so the headline reads. */
const PANEL_SHADE =
  "radial-gradient(ellipse var(--cta-spread) 60% at 50% 50% in oklab, #08040a99 0%, #08040a1a 100%)";

export function FinalCta() {
  return (
    <section
      data-section="final-cta"
      className="landing-container pt-[72px] pb-14 xl:pt-0 xl:pb-[100px]"
    >
      <div
        data-reveal="fade"
        data-seq
        className="relative isolate flex flex-col items-center justify-center gap-5 overflow-clip rounded-shell px-[22px] py-14 text-center [--cta-spread:80%] md:gap-7 md:px-10 md:py-24 md:[--cta-spread:55%] xl:h-[560px] xl:rounded-[36px] xl:py-0"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[url(/landing/shader-cta.png)] bg-cover bg-center"
        />
        <LiveSilk
          color="#8A2A94"
          sheenColor="#F5D0FE"
          className="bg-settle absolute inset-0 -z-10"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{ backgroundImage: PANEL_SHADE }}
        />
        <h2
          data-reveal="text"
          className="w-full max-w-[860px] [--reveal-i:1] text-[34px] leading-[36px] tracking-display text-white md:text-[56px] md:leading-[58px] md:text-balance xl:text-[72px] xl:leading-[74px] xl:text-wrap"
        >
          Your product deserves better than a screen recording.
        </h2>
        <p
          data-reveal
          className="text-[16px] leading-6 text-[#e9d5ff] [--reveal-i:2] md:text-[19px] md:text-balance"
        >
          An agent, an empty folder, ten minutes. Open source, all the way down.
        </p>
        <div
          data-reveal
          className="flex w-full flex-col gap-2.5 pt-1.5 [--reveal-i:3] md:w-auto md:flex-row"
        >
          <LandingButton href="/docs/guides/setup" variant="light" arrow="→">
            Make your first video
          </LandingButton>
          <LandingButton
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            variant="ink"
            className="dark:bg-dark-surface dark:text-white dark:hover:bg-dark-raised"
          >
            Star on GitHub
          </LandingButton>
        </div>
      </div>
    </section>
  );
}
