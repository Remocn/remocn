import Link from "next/link";
import type { ReactNode } from "react";
import { LandingButton } from "@/app/(home)/components/landing/ui/landing-button";
import { cn } from "@/lib/utils";
import {
  getEntry,
  getGuideMedia,
  getSeparatedGroups,
  loadDocsSource,
} from "../data";
import { IndexSection, indexCard } from "../index-section";

const button =
  "h-12 w-full rounded-control-sm px-4 text-[15px] leading-[18px] font-medium sm:h-10 sm:w-auto sm:text-small";

/**
 * "Make a video": the guides section as one card, fronted by the poster of a
 * featured guide's finished video. Counts come from the guides page tree.
 */
export async function GuidesFeature({
  guide,
  children,
}: {
  /** Guide whose video poster fronts the card, e.g. "showcase-reel". */
  guide: string;
  children: ReactNode;
}) {
  await loadDocsSource();
  const groups = getSeparatedGroups("/docs/guides");
  const pages = groups.flatMap((group) => group.entries);
  const guides = pages.filter((entry) => entry.url !== "/docs/guides");
  const videos = groups.find((group) => group.title === "Videos")?.entries;
  const index = getEntry("/docs/guides");
  const setup = getEntry("/docs/guides/setup");
  const featured = getEntry(`/docs/guides/${guide}`);
  const media = featured ? await getGuideMedia(featured.url) : {};

  return (
    <IndexSection heading={children} count={guides.length}>
      <div
        className={cn(
          indexCard,
          "flex flex-col gap-1 p-2 sm:flex-row sm:gap-6 sm:py-2 sm:pr-7 sm:pl-2",
        )}
      >
        {featured && (
          <Link
            href={featured.url}
            className="group/poster relative h-[196px] shrink-0 overflow-hidden rounded-control-sm bg-dark-surface outline-none focus-visible:ring-3 focus-visible:ring-ring sm:h-[236px] sm:w-[300px]"
          >
            {media.poster && (
              // biome-ignore lint/performance/noImgElement: remote CDN poster, sized by its box
              <img
                src={media.poster}
                alt=""
                loading="lazy"
                className="absolute inset-0 size-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/poster:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover/poster:scale-100"
              />
            )}
            <span
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(180deg,#0e101200_30%,#0e1012d9_100%)]"
            />
            <span className="absolute bottom-4 left-4 flex flex-col gap-1 sm:bottom-[18px] sm:left-[18px]">
              {media.seconds && (
                <span className="text-caption leading-4 text-[#fafafab8] sm:text-mono">
                  ~{media.seconds} seconds
                </span>
              )}
              <span className="text-[22px] leading-[26px] font-medium tracking-title text-[#fafafa]">
                {featured.title}
              </span>
            </span>
          </Link>
        )}
        <div className="flex grow flex-col justify-between gap-[18px] px-2.5 pt-3.5 pb-2.5 sm:px-0 sm:py-5">
          <div className="flex flex-col gap-2 sm:gap-2.5">
            <h3 className="text-[20px] leading-[26px] font-medium tracking-title text-foreground">
              {index?.title}
            </h3>
            <p className="text-[15px] leading-[22px] text-muted-foreground">
              {index?.description}. Your AI agent builds the video, you direct
              it.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
            {setup && (
              <LandingButton href={setup.url} arrow="→" className={button}>
                Start with setup
              </LandingButton>
            )}
            {videos && (
              <LandingButton
                href="/docs/guides#the-videos"
                variant="secondary"
                className={button}
              >
                Browse {videos.length} videos
              </LandingButton>
            )}
          </div>
        </div>
      </div>
    </IndexSection>
  );
}
