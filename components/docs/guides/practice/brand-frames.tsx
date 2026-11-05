import { cn } from "@/lib/utils";

/** The example brand used across this guide (a made-up product). */
export const TIDEPOOL = {
  name: "Tidepool",
  line: "A calm inbox for support teams",
  background: "#F6F4EF",
  text: "#1B1F23",
  accent: "#2F5BFF",
};

const DEFAULT_LOOK = {
  background: "#141318",
  text: "#F4F2EC",
  accent: "#D4F25C",
};

/** Tidepool's wave mark. */
export function TidepoolMark({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="7" fill={TIDEPOOL.accent} />
      <path
        d="M3.5 9.2c1.5-1.4 3-1.4 4.5 0s3 1.4 4.5 0"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** One beat, twice: remocn's default look, then the same frame on brand. */
export function GuideBrandFrames() {
  return (
    <ul className="not-prose mt-6 grid gap-4 pt-2 sm:grid-cols-2">
      <Frame
        caption="Remocn default"
        hex={DEFAULT_LOOK.background}
        look={DEFAULT_LOOK}
        className="dark:shadow-[0_0_0_1px_var(--color-hairline)]"
      />
      <Frame
        caption="Same frame, with your brand brief"
        hex={TIDEPOOL.background}
        look={TIDEPOOL}
        mark
        className="shadow-[0_0_0_1px_var(--color-hairline)]"
      />
    </ul>
  );
}

function Frame({
  caption,
  hex,
  look,
  mark,
  className,
}: {
  caption: string;
  hex: string;
  look: { background: string; text: string; accent: string };
  mark?: boolean;
  className?: string;
}) {
  return (
    <li className="flex flex-col gap-3">
      <div
        aria-hidden="true"
        className={cn(
          "relative flex aspect-[360/203] flex-col items-start justify-center gap-2.5 overflow-hidden rounded-card px-8",
          className,
        )}
        style={{ backgroundColor: look.background, color: look.text }}
      >
        <span className="flex items-center gap-[7px] text-caption opacity-60">
          {mark && <TidepoolMark />}
          Introducing
        </span>
        <span className="flex items-baseline gap-[9px] text-[34px] leading-[38px] font-semibold tracking-[-0.04em]">
          Meet <span style={{ color: look.accent }}>{TIDEPOOL.name}</span>
        </span>
        <span className="text-small opacity-70">{TIDEPOOL.line}</span>
        <span className="absolute bottom-3 left-3 flex h-6 items-center rounded-tile px-2 text-mono">
          <span
            className="absolute inset-0 rounded-tile opacity-10"
            style={{ backgroundColor: look.text }}
          />
          <span className="relative">Beat 2</span>
        </span>
      </div>
      <div className="flex items-baseline justify-between px-1">
        <span className="text-small font-medium text-foreground">
          {caption}
        </span>
        <span className="text-mono text-muted-foreground">{hex}</span>
      </div>
    </li>
  );
}
