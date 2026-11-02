import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Stage = {
  name: string;
  description: string;
} & (
  | { state: "done" }
  | { state: "active"; progress: number }
  | { state: "pending" }
);

const STAGES: Stage[] = [
  { name: "Analysis", description: "Reads your site and repo", state: "done" },
  { name: "Brand", description: "Pulls colors, type and logo", state: "done" },
  { name: "Script", description: "Writes the beats and copy", state: "done" },
  { name: "Motion", description: "Picks blocks for each beat", state: "done" },
  {
    name: "Build",
    description: "Writes the Remotion project",
    state: "active",
    progress: 62,
  },
  {
    name: "Choreography",
    description: "Times every entrance",
    state: "pending",
  },
  {
    name: "Review",
    description: "Watches it back, fixes issues",
    state: "pending",
  },
];

const ROW_AT = [
  "[--at:200ms]",
  "[--at:270ms]",
  "[--at:340ms]",
  "[--at:410ms]",
  "[--at:480ms]",
  "[--at:550ms]",
  "[--at:620ms]",
];

/** Colours per state: [number, name, description]. The panel is always dark. */
const TONE: Record<Stage["state"], [string, string, string]> = {
  done: ["text-dark-muted", "text-white", "text-dark-muted"],
  active: ["text-primary-soft", "text-white", "text-[#c4c9cc]"],
  pending: ["text-dark-muted", "text-dark-subtle", "text-dark-muted"],
};

function StageLine({ stage, index }: { stage: Stage; index: number }) {
  const [numberTone, nameTone, descriptionTone] = TONE[stage.state];
  const status =
    stage.state === "done" ? (
      <span className="shrink-0 text-[12px] leading-[22px] text-success-soft md:leading-4">
        done
      </span>
    ) : stage.state === "active" ? (
      <span className="shrink-0 text-[12px] leading-[22px] text-primary-soft tabular-nums md:leading-4">
        <span
          aria-hidden="true"
          className="seq-count [--at:900ms] [--dur:1600ms]"
          style={{ "--count": stage.progress } as CSSProperties}
        />
        <span className="sr-only">{stage.progress}%</span>
      </span>
    ) : null;

  return (
    <div className="flex items-start gap-3 md:items-baseline md:gap-[18px]">
      <span
        aria-hidden="true"
        className={`w-6 shrink-0 text-[12px] leading-[22px] tabular-nums md:w-7 md:leading-4 ${numberTone}`}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 md:contents">
        <span
          className={`text-[17px] leading-[22px] md:w-[150px] md:shrink-0 md:text-[18px] md:leading-6 ${nameTone}`}
        >
          {stage.name}
        </span>
        <span className={`text-[14px] leading-5 md:flex-1 ${descriptionTone}`}>
          {stage.description}
        </span>
      </div>
      {status}
    </div>
  );
}

function StageProgress({ name, value }: { name: string; value: number }) {
  return (
    <div
      role="progressbar"
      aria-label={`${name} progress`}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      className="h-[3px] shrink-0 overflow-hidden rounded-[2px] bg-white/8"
    >
      <div
        className="seq-draw h-full origin-left bg-primary-soft [--at:900ms] [--dur:1600ms]"
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

/** The seven Studio stages: done rows, the active row with progress, pending rows. */
export function PipelineStages() {
  return (
    <ol
      data-reveal="trigger"
      data-seq
      className="flex flex-col xl:w-[560px] xl:shrink-0"
    >
      {STAGES.map((stage, index) => {
        if (stage.state === "active") {
          return (
            <li
              key={stage.name}
              className={cn(
                "seq-in flex flex-col gap-3 rounded-control bg-[#1a1d20] px-3 py-3.5 md:-mx-4 md:px-4 md:py-[17px]",
                ROW_AT[index],
              )}
            >
              <StageLine stage={stage} index={index} />
              <StageProgress name={stage.name} value={stage.progress} />
            </li>
          );
        }
        const afterActive = STAGES[index - 1]?.state === "active";
        return (
          <li
            key={stage.name}
            className={cn(
              "seq-in border-dark-line px-3 py-3.5 last:pb-1 md:border-t md:px-0 md:py-[17px] md:last:pb-[17px]",
              !afterActive && "border-t",
              ROW_AT[index],
            )}
          >
            <StageLine stage={stage} index={index} />
          </li>
        );
      })}
    </ol>
  );
}
