import { SectionTitle } from "../../components/landing/ui/section-title";
import { HeroActions } from "./hero/hero-actions";

export function SponsorsHero() {
  return (
    <section
      data-section="sponsors-hero"
      className="landing-container flex flex-col gap-6 pt-12 pb-14 md:pt-20 md:pb-16 xl:gap-10 xl:pt-28 xl:pb-[72px]"
    >
      <p className="text-caption text-primary">Sponsors</p>
      <div className="flex flex-col gap-6 md:gap-8 xl:flex-row xl:items-end xl:justify-between">
        <SectionTitle
          as="h1"
          title="Support the"
          continuation="future of video."
          className="text-[52px]/[52px] tracking-display md:text-[72px]/[72px] xl:w-[740px] xl:shrink-0 xl:text-[96px]/[96px]"
          continuationClassName="text-subtle xl:leading-[100px]"
        />
        <div className="flex flex-col gap-6 md:max-w-[440px] md:gap-7 xl:w-[440px] xl:shrink-0 xl:pb-2">
          <p className="text-[20px] leading-7 text-body">
            Remocn is open-source and free. Your sponsorship helps us spend more
            time building premium animations and keeping the project alive.
          </p>
          <HeroActions />
        </div>
      </div>
    </section>
  );
}
