import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  guideCard,
  guidePanel,
  PlayIcon,
} from "../guide-ui";

/** Poster of the launch video, the clip every guide uses as its example. */
const PREVIEW_POSTER = "https://cdn.remocn.dev/posters/intoducing-remocn.png";

type Stage = { title: string; text: string; art: ReactNode };

const STAGES: Stage[] = [
  {
    title: "Preview",
    text: "Plays in your browser, but it isn't a file yet",
    art: <PreviewArt />,
  },
  {
    title: "Render",
    text: "Frame by frame, a few minutes for thirty seconds",
    art: <RenderArt />,
  },
  {
    title: "A real mp4",
    text: "Your agent tells you the full path",
    art: <FileArt />,
  },
];

/** Preview → render → mp4: what the one prompt does, as three stages. */
export function GuideExportPipeline() {
  return (
    <ol className="not-prose mt-5 flex flex-col sm:flex-row">
      {STAGES.map((stage, index) => (
        <Fragment key={stage.title}>
          {index > 0 && (
            <li
              aria-hidden="true"
              className="flex h-8 shrink-0 items-center justify-center text-subtle sm:h-auto sm:w-8 sm:pb-[60px]"
            >
              <ArrowDownIcon size={16} className="sm:hidden" />
              <ArrowRightIcon size={16} className="hidden sm:block" />
            </li>
          )}
          <li
            className={cn(
              "flex min-w-0 flex-col rounded-card p-1.5 sm:basis-0 sm:grow",
              guideCard,
            )}
          >
            {stage.art}
            <div className="flex flex-col gap-1 px-3 pt-3.5 pb-3">
              <span className="text-[15px] leading-5 font-medium text-foreground">
                {stage.title}
              </span>
              <span className="text-small text-muted-foreground">
                {stage.text}
              </span>
            </div>
          </li>
        </Fragment>
      ))}
    </ol>
  );
}

function PreviewArt() {
  return (
    <div
      aria-hidden="true"
      className={cn("flex flex-col gap-2 rounded-control p-2", guidePanel)}
    >
      <span
        className="aspect-[196/110] rounded-tag bg-cover bg-center"
        style={{ backgroundImage: `url(${PREVIEW_POSTER})` }}
      />
      <span className="flex h-7 shrink-0 items-center gap-2">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-tag bg-[#fafafa] text-[#0e1012]">
          <PlayIcon size={11} />
        </span>
        <span className="flex h-7 grow items-center rounded-tag bg-dark-raised px-1">
          <span className="h-5 w-[62px] rounded-[3px] bg-[#fafafa]/22" />
          <span className="h-5 w-[3px] rounded-[2px] bg-[#fafafa]" />
        </span>
      </span>
    </div>
  );
}

/** Frames already drawn; the next one is mid-render. */
const DONE = 13;

function RenderArt() {
  return (
    <div
      className={cn(
        "flex h-[162px] shrink-0 flex-col justify-center gap-3 rounded-control px-3.5",
        guidePanel,
      )}
    >
      <span aria-hidden="true" className="grid grid-cols-8 gap-1">
        {Array.from({ length: 24 }, (_, i) => (
          <span
            key={i}
            className={cn(
              "h-[13px] rounded-[3px]",
              i < DONE
                ? "bg-[#fafafa]"
                : i === DONE
                  ? "bg-primary-soft"
                  : "bg-[#2a2d30]",
            )}
          />
        ))}
      </span>
      <span className="text-caption text-[#c9ced1]">
        Drawing frame 584 of 1,050
      </span>
    </div>
  );
}

function FileArt() {
  return (
    <div className="flex h-[162px] shrink-0 flex-col justify-center gap-3 rounded-control bg-surface-muted px-3.5">
      <span className="flex items-center gap-2.5">
        <span
          aria-hidden="true"
          className={cn(
            "relative flex h-[46px] w-[38px] shrink-0 items-end justify-center rounded-[7px] pb-[7px] text-[9px] leading-[10px] font-semibold text-[#fafafa]",
            guidePanel,
          )}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            className="absolute top-3 left-3"
          >
            <path d="M3 1.5v11l9-5.5z" fill="#F0ABFC" />
          </svg>
          mp4
        </span>
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate font-mono text-caption leading-[18px] text-foreground">
            launch-video.mp4
          </span>
          <span className="text-caption text-muted-foreground">
            About 15 MB
          </span>
        </span>
      </span>
      <span className="rounded-tile bg-surface px-2.5 py-2 font-mono text-mono leading-[17px] break-all text-body dark:bg-surface-sunken dark:shadow-[0_0_0_1px_var(--color-hairline)]">
        ~/my-video/out/
        <br />
        launch-video.mp4
      </span>
    </div>
  );
}
