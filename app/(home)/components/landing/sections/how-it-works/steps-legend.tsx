const STEPS = [
  "Open an agent in an empty folder",
  "Paste one prompt",
  "A player opens in your browser",
] as const;

/** Numbered 1-2-3 legend; the last step is the fuchsia "payoff" one. */
export function StepsLegend() {
  return (
    <ol
      data-reveal="stagger"
      className="flex flex-col gap-3 pt-1 [--stagger-base:240ms] md:pt-2.5"
    >
      {STEPS.map((label, i) => {
        const last = i === STEPS.length - 1;
        return (
          <li key={label} className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className={`flex size-[26px] shrink-0 items-center justify-center rounded-tile text-caption md:text-mono ${
                last ? "bg-primary text-white" : "bg-foreground text-background"
              }`}
            >
              {i + 1}
            </span>
            <span className="text-ui leading-[22px] text-foreground md:text-button-lg">
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
