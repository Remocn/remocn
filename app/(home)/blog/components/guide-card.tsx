import { LandingButton } from "../../components/landing/ui/landing-button";

const BUTTON =
  "h-12 rounded-control-sm px-4 text-[15px] leading-5 font-medium md:h-10";

/** Closing card of the index: where the recipe behind every cut lives. */
export function GuideCard() {
  return (
    <aside className="flex flex-col justify-between gap-7 rounded-card bg-surface p-6 shadow-[0_0_0_1px_var(--hairline)] md:bg-surface-muted md:p-7 md:shadow-none">
      <div className="flex flex-col gap-3">
        <p className="text-caption text-primary">Make one for your product</p>
        <h3 className="text-[24px] leading-[30px] font-medium tracking-title text-foreground md:text-[26px] md:leading-8">
          Every cut here ships with the prompt that rebuilds it.
        </h3>
        <p className="text-[15px] leading-[22px] text-muted-foreground md:text-small md:leading-[21px]">
          The generic recipe is the launch video guide. Pointing your agent at
          your site’s own tokens is the part that makes a spot feel like it came
          from inside the company.
        </p>
      </div>
      <div className="flex flex-col gap-2 md:flex-row">
        <LandingButton href="/docs/guides/launch-video" className={BUTTON}>
          Launch video guide
        </LandingButton>
        <LandingButton
          href="/docs/guides/your-brand"
          variant="secondary"
          className={BUTTON}
        >
          Your brand
        </LandingButton>
      </div>
    </aside>
  );
}
