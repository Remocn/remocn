import { cn } from "@/lib/utils";

export const SPEEDS = [0.5, 1, 2] as const;
export type Speed = (typeof SPEEDS)[number];

const formatSpeed = (speed: Speed) => `${speed}×`;

export function formatTime(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const RAISED_BUTTON =
  "flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-dark-raised text-dark-body outline-none transition-colors duration-150 hover:text-[#fafafa] focus-visible:ring-2 focus-visible:ring-white/40";

export function PlayButton({
  playing,
  ended,
  label,
  onClick,
}: {
  playing: boolean;
  ended: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${playing ? "Pause" : ended ? "Replay" : "Play"} ${label}`}
      className="flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-[#fafafa] outline-none transition-[background-color,transform] duration-150 hover:bg-white focus-visible:ring-3 focus-visible:ring-white/40 active:translate-y-px"
    >
      {playing ? (
        <span aria-hidden="true" className="flex gap-[3px]">
          <span className="h-3 w-[3px] rounded-[1px] bg-dark-surface" />
          <span className="h-3 w-[3px] rounded-[1px] bg-dark-surface" />
        </span>
      ) : (
        <span
          aria-hidden="true"
          className="ml-0.5 size-0 border-y-[5px] border-l-8 border-y-transparent border-l-dark-surface"
        />
      )}
    </button>
  );
}

/**
 * Playback speed: a segmented 0.5× / 1× / 2× from `md`, and a single button
 * that cycles through them on narrow screens.
 */
export function SpeedControl({
  speed,
  onChange,
}: {
  speed: Speed;
  onChange: (speed: Speed) => void;
}) {
  const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
  return (
    <>
      <fieldset className="flex h-10 shrink-0 items-center gap-0.5 rounded-[10px] bg-dark-raised p-1 max-md:hidden">
        <legend className="sr-only">Playback speed</legend>
        {SPEEDS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={option === speed}
            onClick={() => onChange(option)}
            className={cn(
              "h-8 rounded-[7px] px-2.5 text-mono tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white/40",
              option === speed
                ? "bg-white/[0.12] text-[#fafafa]"
                : "text-dark-body hover:text-[#fafafa]",
            )}
          >
            {formatSpeed(option)}
          </button>
        ))}
      </fieldset>
      <button
        type="button"
        onClick={() => onChange(next)}
        aria-label={`Playback speed ${formatSpeed(speed)}, switch to ${formatSpeed(next)}`}
        className={cn(
          RAISED_BUTTON,
          "w-auto px-2.5 text-mono text-[#fafafa] tabular-nums md:hidden",
        )}
      >
        {formatSpeed(speed)}
      </button>
    </>
  );
}

function FullscreenIcon({ exit }: { exit: boolean }) {
  // Four corners pointing out to enter, pointing in to exit.
  const corners = exit
    ? "M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
    : "M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5";
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="size-[18px]">
      <path
        d={corners}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function FullscreenButton({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Exit full screen" : "Full screen"}
      className={RAISED_BUTTON}
    >
      <FullscreenIcon exit={active} />
    </button>
  );
}
