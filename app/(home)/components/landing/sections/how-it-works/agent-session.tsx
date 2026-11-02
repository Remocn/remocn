import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ClaudeIcon } from "../../ui/brand-icons";
import { SessionPlayer } from "./session-player";

type SessionStep =
  | { kind: "command"; text: string }
  | {
      kind: "prompt";
      /** Rendered as one paragraph on desktop, one line each on mobile. */
      lines: string[];
      checks: string[];
    }
  | { kind: "preview"; status: string };

const BLOCK_AT = ["[--at:300ms]", "[--at:1600ms]", "[--at:3400ms]"];

const CHECK_AT = ["[--at:2100ms]", "[--at:2500ms]", "[--at:2900ms]"];

const SESSION_STEPS: SessionStep[] = [
  { kind: "command", text: "$ mkdir acme-launch && cd acme-launch && claude" },
  {
    kind: "prompt",
    lines: [
      "› Set up a new Remotion video project in this folder, then install the remocn agent skill:",
      "npx skills add Remocn/remocn --yes.",
      "When you're done, start the preview studio.",
    ],
    checks: [
      "✓ Remotion project created",
      "✓ remocn skill installed",
      "✓ Preview studio running",
    ],
  },
  { kind: "preview", status: "▸ localhost:3000 opened in your browser" },
];

/** The dark Claude Code window: title bar plus the three numbered blocks. */
export function AgentSession() {
  return (
    <figure
      aria-label="A Claude Code session that sets up remocn and opens a preview"
      data-reveal="scale"
      data-seq
      className="flex w-full min-w-0 flex-col rounded-panel bg-dark-surface p-1.5 md:rounded-shell md:p-2 xl:grow"
    >
      <SessionTitleBar />
      <ol>
        {SESSION_STEPS.map((step, i) => (
          <SessionBlock
            key={step.kind}
            index={i + 1}
            accent={i === SESSION_STEPS.length - 1}
            className={cn(
              BLOCK_AT[i],
              step.kind === "preview" &&
                "px-2 pt-3.5 pb-2 md:px-5 md:pt-4 md:pb-5",
            )}
          >
            <SessionStepBody step={step} />
          </SessionBlock>
        ))}
      </ol>
    </figure>
  );
}

function SessionTitleBar() {
  return (
    <div className="flex h-10 shrink-0 items-center justify-between px-3 md:h-11 md:px-4">
      <span aria-hidden="true" className="flex w-[42px] shrink-0 gap-1.5">
        {[0, 1, 2].map((dot) => (
          <span
            key={dot}
            className="size-[9px] shrink-0 rounded-full bg-[#3A3E42] md:size-2.5"
          />
        ))}
      </span>
      <span className="flex min-w-0 items-center gap-2">
        <ClaudeIcon className="size-4 shrink-0" />
        <span className="text-small leading-[18px] whitespace-nowrap text-[#FAFAFA]">
          Claude Code
        </span>
        <span className="truncate font-mono text-mono text-dark-muted">
          ~/acme-launch
        </span>
      </span>
      <span aria-hidden="true" className="w-[42px] shrink-0" />
    </div>
  );
}

/**
 * One numbered block of the session. A two-column grid: the badge, then the
 * content; anything after the first content row (the player) spans both
 * columns on mobile and stays in the content column on desktop.
 */
function SessionBlock({
  index,
  accent,
  className,
  children,
}: {
  index: number;
  accent?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <li
      className={cn(
        "seq-in grid grid-cols-[22px_minmax(0,1fr)] items-start gap-x-3 gap-y-3 overflow-clip border-t border-dark-control p-3.5 md:gap-x-4 md:px-5 md:py-4",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={`seq-pop flex size-[22px] shrink-0 items-center justify-center rounded-[7px] text-caption md:text-micro ${
          accent
            ? "ml-1.5 bg-primary text-white md:row-span-2 md:ml-0"
            : "bg-[#2A2D30] text-[#FAFAFA]"
        }`}
      >
        {index}
      </span>
      {children}
    </li>
  );
}

function SessionStepBody({ step }: { step: SessionStep }) {
  switch (step.kind) {
    case "command":
      return (
        <p className="seq-type font-mono text-mono leading-[22px] whitespace-nowrap text-dark-body [--at:450ms] [--dur:1000ms] [--steps:47] md:text-small md:leading-6">
          {step.text}
        </p>
      );
    case "prompt":
      return (
        <div className="flex min-w-0 flex-col gap-3 font-mono text-mono leading-5 md:text-small md:leading-6">
          <p className="text-[#FAFAFA]">
            {step.lines.map((line, i) => (
              <span key={line} className="block md:inline">
                {i > 0 && " "}
                {line}
              </span>
            ))}
          </p>
          <ul className="text-[#8A949A]">
            {step.checks.map((check, i) => (
              <li
                key={check}
                className={cn("seq-in whitespace-nowrap", CHECK_AT[i])}
              >
                {check}
              </li>
            ))}
          </ul>
        </div>
      );
    case "preview":
      return (
        <>
          <p className="seq-type self-center font-mono [--at:3500ms] [--dur:700ms] [--steps:39] text-mono leading-[18px] whitespace-nowrap text-primary-soft md:self-start md:text-small md:leading-[18px]">
            {step.status}
          </p>
          <div className="seq-in col-span-2 [--at:4000ms] md:col-span-1 md:col-start-2">
            <SessionPlayer />
          </div>
        </>
      );
  }
}
