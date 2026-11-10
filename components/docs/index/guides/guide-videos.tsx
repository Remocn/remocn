import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { getGuideMedia, getSeparatedGroups, loadDocsSource } from "../data";
import { IndexSection, indexCard, indexCardLink } from "../index-section";
import { FallbackArt, VIDEO_ART } from "./video-art";

/**
 * "The videos": one card per guide in the guides section's "Videos" group,
 * fronted by the guide's own video poster (or still art until it has one).
 */
export async function GuideVideos({ children }: { children: ReactNode }) {
  await loadDocsSource();
  const videos =
    getSeparatedGroups("/docs/guides").find((group) => group.title === "Videos")
      ?.entries ?? [];
  const media = await Promise.all(
    videos.map((entry) => getGuideMedia(entry.url)),
  );

  return (
    <IndexSection
      heading={children}
      count={videos.length}
      className="mt-8 sm:mt-11"
    >
      <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5">
        {videos.map((entry, index) => {
          const { poster, seconds } = media[index];
          const slug = entry.url.split("/").pop() ?? "";
          return (
            <li key={entry.url}>
              <Link
                href={entry.url}
                className={cn(
                  indexCard,
                  indexCardLink,
                  "group/video flex h-full flex-col rounded-[18px] p-[5px] pb-4 sm:rounded-card sm:p-1.5 sm:pb-4",
                )}
              >
                <span
                  aria-hidden="true"
                  className="relative block aspect-[346/196] overflow-hidden rounded-control bg-dark-surface"
                >
                  {poster ? (
                    // biome-ignore lint/performance/noImgElement: remote CDN poster, sized by its box
                    <img
                      src={poster}
                      alt=""
                      loading="lazy"
                      className="absolute inset-0 size-full object-cover transition-transform duration-200 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover/video:scale-[1.02] motion-reduce:transition-none motion-reduce:group-hover/video:scale-100"
                    />
                  ) : (
                    (VIDEO_ART[slug] ?? <FallbackArt title={entry.title} />)
                  )}
                  {seconds && (
                    <span className="absolute bottom-3 left-3 flex h-[26px] items-center rounded-tile bg-[#0e1012b8] px-[9px] text-mono leading-4 font-medium text-[#fafafa]">
                      ~{seconds} s
                    </span>
                  )}
                </span>
                <span className="flex flex-col gap-1.5 px-2.5 pt-3.5">
                  <span className="text-button-lg leading-[22px] font-medium text-foreground">
                    {entry.title}
                  </span>
                  <span className="line-clamp-2 text-small text-muted-foreground">
                    {entry.description}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </IndexSection>
  );
}
