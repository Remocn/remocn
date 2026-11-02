import { LandingButton } from "../../ui/landing-button";

/** Dark strip under the bento: the install line + "Browse N+ blocks". */
export function InstallStrip({
  component,
  browseHref,
  browseLabel,
}: {
  component: string;
  browseHref: string;
  browseLabel: string;
}) {
  const command = `npx shadcn@latest add @remocn/${component}`;

  return (
    <div
      data-reveal
      data-seq
      className="flex flex-col gap-2.5 rounded-[22px] bg-dark-surface p-2.5 lg:h-[76px] lg:flex-row lg:items-center lg:justify-between lg:gap-0 lg:py-0 lg:pr-3.5 lg:pl-7"
    >
      <div className="flex h-[52px] shrink-0 items-center gap-2.5 pr-1.5 pl-3 lg:h-auto lg:gap-3.5 lg:p-0">
        <code className="flex min-w-0 grow items-center gap-2.5 overflow-clip font-mono text-[13px] leading-[18px] whitespace-nowrap lg:gap-3.5 lg:text-[15px]">
          <span aria-hidden="true" className="shrink-0 text-dark-muted">
            $
          </span>
          <span className="seq-type shrink-0 text-[#E6E8E9] [--at:350ms] [--dur:900ms] [--steps:42]">
            {command}
          </span>
        </code>
      </div>
      <LandingButton
        href={browseHref}
        variant="fuchsia"
        size="md"
        arrow="→"
        className="h-[50px] w-full lg:w-auto"
      >
        {browseLabel}
      </LandingButton>
    </div>
  );
}
