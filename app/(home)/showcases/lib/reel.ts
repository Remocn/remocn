import { cache } from "react";
import { getShowcases, type Showcase } from "@/lib/showcases";
import { getVideoDuration } from "@/lib/video-duration";
import remocnRegistry from "@/registry/remocn/registry.json";
import remocnIconsRegistry from "@/registry/remocn-icons/registry.json";
import remocnUiRegistry from "@/registry/remocn-ui/registry.json";
import { getDocsUrlsByComponent } from "./docs-urls";
import type { Reel, ReelClip, ReelComponent, ReelTrack } from "./reel-types";

export * from "./reel-types";

const TRACK_LIMIT = 8;
/** Used for a clip whose file can't be measured, so the reel stays whole. */
const FALLBACK_DURATION = 30;

/** Product sites by showcase slug. The manager has no field for them. */
const PRODUCT_URLS: Record<string, string> = {
  "introducing-videorc": "https://www.videorc.com/",
};

const REGISTRY_NAMES = new Set(
  [remocnRegistry, remocnUiRegistry, remocnIconsRegistry].flatMap((registry) =>
    registry.items.map((item) => item.name),
  ),
);

export const showcaseDateFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: "UTC",
  year: "numeric",
  month: "short",
  day: "numeric",
});

function toComponent(
  component: Showcase["components"][number],
  docs: Map<string, string>,
): ReelComponent {
  const slug = component.url.replace(/\/+$/, "").split("/").pop() ?? "";
  const registryName = REGISTRY_NAMES.has(slug) ? slug : null;
  return {
    name: component.name,
    registryName,
    href: (registryName && docs.get(registryName)) ?? component.url,
  };
}

/** Rows for the most used components, most used first. */
function topTracks(clips: ReelClip[]): ReelTrack[] {
  const counts = new Map<string, number>();
  for (const clip of clips) {
    for (const name of new Set(clip.components.map((c) => c.name))) {
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, TRACK_LIMIT);
}

/**
 * Every showcase laid end to end on one reel, in the manager's order, with
 * clip lengths read from the video files.
 */
export const getReel = cache(async (): Promise<Reel> => {
  const showcases = await getShowcases();
  const durations = await Promise.all(
    showcases.map((showcase) => getVideoDuration(showcase.videoUrl)),
  );
  const docs = await getDocsUrlsByComponent();

  let start = 0;
  const clips = showcases.map((showcase, index): ReelClip => {
    const duration = durations[index] ?? FALLBACK_DURATION;
    const createdAt = new Date(showcase.createdAt);
    const clip: ReelClip = {
      slug: showcase.slug,
      title: showcase.title,
      video: showcase.videoUrl,
      poster: showcase.posterUrl,
      author: showcase.author,
      iso: createdAt.toISOString().slice(0, 10),
      dateLabel: showcaseDateFormatter.format(createdAt),
      githubUrl: showcase.githubUrl ?? null,
      productUrl: PRODUCT_URLS[showcase.slug] ?? null,
      components: showcase.components.map((c) => toComponent(c, docs)),
      start,
      duration,
    };
    start += duration;
    return clip;
  });

  return { clips, total: start, tracks: topTracks(clips) };
});
