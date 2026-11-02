import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/video-duration";
import type { ReelClip } from "../../lib/reel-types";

/**
 * Every clip with its in and out on the reel, what it was built with and
 * its source. A row's thumbnail cues the clip in the editor above; the
 * title opens the showcase. Below `xl` the rows hang off a vertical rail.
 */
export function ClipList({
  clips,
  index,
  onSelect,
}: {
  clips: ReelClip[];
  index: number;
  onSelect: (index: number) => void;
}) {
  return (
    <section
      aria-labelledby="clip-list"
      className="landing-container flex flex-col gap-7 py-[72px] xl:gap-0 xl:pt-24 xl:pb-section"
    >
      <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between xl:border-b xl:border-divider xl:pb-5">
        <h2
          id="clip-list"
          className="text-[34px] leading-9 tracking-heading text-foreground xl:text-quote xl:tracking-title"
        >
          Clip list
        </h2>
        <p className="text-small text-muted-foreground">
          in and out on the reel, built with, source
        </p>
      </div>

      <ol className="relative flex flex-col gap-7 xl:gap-0">
        <li
          aria-hidden="true"
          className="absolute top-[29px] bottom-[60px] left-[5px] w-0.5 bg-divider xl:hidden"
        />
        {clips.map((clip, i) => (
          <ClipRow
            key={clip.slug}
            clip={clip}
            number={String(i + 1).padStart(2, "0")}
            selected={i === index}
            onSelect={() => onSelect(i)}
          />
        ))}
      </ol>
    </section>
  );
}

function ClipRow({
  clip,
  number,
  selected,
  onSelect,
}: {
  clip: ReelClip;
  number: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const [first, ...rest] = clip.components;
  const range = `${formatDuration(clip.start)} to ${formatDuration(clip.start + clip.duration)}`;

  return (
    <li className="relative flex gap-3.5 xl:h-[84px] xl:items-center xl:gap-0 xl:border-b xl:border-divider">
      {/* Rail dot (mobile) */}
      <span className="flex w-3 shrink-0 justify-center pt-[23px] xl:hidden">
        <span
          className={cn(
            "size-3 rounded-full border-2",
            selected
              ? "border-primary bg-primary"
              : "border-subtle-line bg-background",
          )}
        />
      </span>
      <span
        className={cn(
          "hidden w-12 shrink-0 text-caption tabular-nums xl:block",
          selected ? "text-primary" : "text-subtle",
        )}
      >
        {number}
      </span>

      <div className="flex min-w-0 grow flex-col gap-3 xl:contents">
        <div className="flex items-center gap-3 xl:contents">
          <span className="shrink-0 xl:w-[136px]">
            <button
              type="button"
              onClick={onSelect}
              aria-label={`Cue ${clip.title} in the reel`}
              className={cn(
                "block h-[58px] w-[104px] overflow-hidden rounded-tile bg-dark-surface outline-none transition-shadow duration-150 focus-visible:ring-3 focus-visible:ring-ring",
                selected && "shadow-[0_0_0_2px_var(--color-primary)]",
              )}
            >
              {/* biome-ignore lint/performance/noImgElement: remote showcase posters of arbitrary origin */}
              <img
                src={clip.poster}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
          </span>
          <div className="flex min-w-0 flex-col gap-1 xl:w-[400px] xl:shrink-0 xl:pr-6">
            <span className="flex gap-2 text-caption tabular-nums xl:hidden">
              <span className={selected ? "text-foreground" : "text-subtle"}>
                {number}
              </span>
              <span className="text-muted-foreground">{range}</span>
            </span>
            <Link
              href={`/showcases/${clip.slug}`}
              className="-mx-1 w-fit rounded-tag px-1 text-[17px] leading-[22px] tracking-title text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring xl:text-lead xl:leading-[26px]"
            >
              {clip.title}
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 xl:contents">
          <span className="flex min-w-0 items-center gap-2 xl:w-[240px] xl:shrink-0">
            {first && (
              <Link
                href={first.href}
                className="relative flex h-7 min-w-0 items-center rounded-tile border border-hairline bg-surface px-2.5 text-caption text-foreground outline-none transition-colors hover:bg-muted after:absolute after:inset-x-0 after:-inset-y-2 focus-visible:ring-2 focus-visible:ring-ring xl:border-0 xl:bg-surface-muted xl:hover:bg-secondary"
              >
                <span className="truncate">{first.name}</span>
              </Link>
            )}
            {rest.length > 0 && (
              <span className="shrink-0 text-caption text-subtle">
                +{rest.length}
              </span>
            )}
          </span>
          <span className="hidden w-[180px] shrink-0 text-caption text-muted-foreground tabular-nums xl:block">
            {range}
          </span>
          <span className="flex shrink-0 justify-end xl:grow">
            {clip.githubUrl ? (
              <a
                href={clip.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex h-11 items-center rounded-control-sm bg-secondary px-4 text-small text-foreground outline-none transition-colors hover:bg-[#dcdde0] focus-visible:ring-3 focus-visible:ring-ring xl:h-8 xl:rounded-[10px] xl:px-3 dark:hover:bg-[#33363b]"
              >
                Source
              </a>
            ) : (
              <span className="flex h-11 items-center text-small text-subtle xl:h-8">
                No source
              </span>
            )}
          </span>
        </div>
      </div>
    </li>
  );
}
