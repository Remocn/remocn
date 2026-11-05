/** Timeline marks; the 1px ticks sit between them. */
const MARKS = ["0s", "4s", "8s", "13s"] as const;
const ACTIVE_MARK = "4s";

/**
 * The preview the agent opens in block 3: the violet shader with a title
 * and a mini scrubber (play glyph, marked timeline with a selected range,
 * timecode). Static mock, no playback.
 */
export function SessionPlayer() {
  return (
    <div
      className="flex h-[190px] shrink-0 flex-col justify-end gap-2.5 overflow-clip rounded-cta bg-cover p-3.5 md:h-[200px] md:px-5 md:py-[18px]"
      style={{
        backgroundImage:
          "linear-gradient(in oklab 0deg, #0A040E99 0%, #0A040E00 60%), url(/landing/shader-violet.png)",
        backgroundPosition: "50%",
      }}
    >
      <p className="seq-arrive text-[28px] leading-[28px] [--at:4300ms] font-medium tracking-display text-white md:text-[34px] md:leading-[34px]">
        Ship it on Tuesday.
      </p>
      <div aria-hidden="true" className="flex items-center gap-2 md:gap-2.5">
        <span className="size-0 shrink-0 border-y-[5px] border-l-8 border-y-transparent border-l-white" />
        <div className="relative flex h-8 min-w-0 grow items-center justify-between overflow-clip rounded-[9px] bg-[#0E1012B8] px-2.5 text-mono tabular-nums leading-[14px] md:h-[34px] md:px-3 md:text-micro">
          {MARKS.map((mark, i) => (
            <Mark key={mark} label={mark} withTick={i > 0} />
          ))}
          <span className="seq-draw absolute top-1 left-[24%] origin-left [--at:4600ms] [--dur:900ms] h-6 w-[30%] rounded-[7px] border border-white/12 bg-white/14 md:left-[18%] md:h-[26px] md:w-[32%]">
            <span className="absolute top-1/2 left-[3px] h-[11px] w-[3px] -translate-y-1/2 rounded-[2px] bg-[#FAFAFA]" />
            <span className="absolute top-1/2 right-[3px] h-[11px] w-[3px] -translate-y-1/2 rounded-[2px] bg-[#FAFAFA]" />
          </span>
        </div>
        <span className="shrink-0 text-mono leading-[14px] whitespace-nowrap text-white/80 tabular-nums md:text-micro">
          0:04 / 0:13
        </span>
      </div>
    </div>
  );
}

function Mark({ label, withTick }: { label: string; withTick: boolean }) {
  return (
    <>
      {withTick && <span className="h-2.5 w-px shrink-0 bg-[#4A4E52]" />}
      <span
        className={label === ACTIVE_MARK ? "text-[#FAFAFA]" : "text-dark-body"}
      >
        {label}
      </span>
    </>
  );
}
