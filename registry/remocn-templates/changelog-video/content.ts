/**
 * Data for the changelog video. Everything a release changes lives in these
 * props, so CI can render a new edition with `npx remotion render --props`
 * and no code edits. Props stay JSON-serializable for that reason.
 */

export type ChangelogVideoItem = {
  /** The change, as a name: "Dark mode". */
  title: string;
  /** What it does for the viewer, six words or fewer: "Easy on the eyes at night". */
  payoff?: string;
};

export type ChangelogVideoProps = {
  product?: string;
  /** Release tag, e.g. "v2.4.0". An empty string hides it. */
  version?: string;
  /** Release date as you want it printed, e.g. "Nov 9, 2026". An empty string hides it. */
  date?: string;
  /** One beat per item. Up to eight; extras are dropped. */
  items?: ChangelogVideoItem[];
  /** Where the full changelog lives, printed in the closing beat. */
  url?: string;
  closing?: string;
  accent?: string;
  theme?: "dark" | "light";
};

export const CHANGELOG_VIDEO_FPS = 30;
export const CHANGELOG_VIDEO_WIDTH = 1920;
export const CHANGELOG_VIDEO_HEIGHT = 1080;
export const CHANGELOG_VIDEO_MAX_ITEMS = 8;

/** Beat lengths in frames at 30 fps. */
export const STAMP_FRAMES = 105;
export const ITEM_FRAMES = 135;
export const OUTRO_FRAMES = 120;

export const changelogVideoDefaults = {
  product: "Northwind",
  version: "v2.4.0",
  date: "Nov 9, 2026",
  items: [
    { title: "Dark mode", payoff: "Easy on the eyes at night" },
    { title: "CSV export", payoff: "Every report, one click" },
    { title: "Faster search", payoff: "Results in under 100 ms" },
  ],
  url: "northwind.example/changelog",
  closing: "Shipping every week.",
  accent: "#7CC4A4",
  theme: "dark",
} satisfies Required<ChangelogVideoProps>;

export const changelogVideoThemes = {
  dark: {
    background: "#0E0E10",
    foreground: "#F4F3EF",
    muted: "#8C8B91",
    hairline: "rgba(244,243,239,0.14)",
  },
  light: {
    background: "#F4F3EF",
    foreground: "#141416",
    muted: "#6E6D72",
    hairline: "rgba(20,20,22,0.14)",
  },
} as const;

export type ResolvedChangelogVideo = Required<
  Omit<ChangelogVideoProps, "items">
> & {
  items: Required<ChangelogVideoItem>[];
};

/**
 * Fills blanks with defaults and cleans the items list. An explicit empty
 * `items` array falls back to the defaults so a bad release body never
 * renders a video with no changes in it.
 */
export function resolveChangelogVideoProps(
  props: ChangelogVideoProps,
): ResolvedChangelogVideo {
  const items = (props.items ?? [])
    .filter((item) => item && typeof item.title === "string")
    .map((item) => ({
      title: item.title.trim(),
      payoff: (item.payoff ?? "").trim(),
    }))
    .filter((item) => item.title.length > 0)
    .slice(0, CHANGELOG_VIDEO_MAX_ITEMS);
  return {
    product: props.product?.trim() || changelogVideoDefaults.product,
    version: props.version ?? changelogVideoDefaults.version,
    date: props.date ?? changelogVideoDefaults.date,
    items: items.length > 0 ? items : changelogVideoDefaults.items,
    url: props.url ?? changelogVideoDefaults.url,
    closing: props.closing ?? changelogVideoDefaults.closing,
    accent: props.accent || changelogVideoDefaults.accent,
    theme: props.theme === "light" ? "light" : "dark",
  };
}

/** Total length for a given number of items: stamp, one beat each, outro. */
export function changelogVideoDuration(itemCount: number): number {
  const count = Math.min(Math.max(itemCount, 1), CHANGELOG_VIDEO_MAX_ITEMS);
  return STAMP_FRAMES + count * ITEM_FRAMES + OUTRO_FRAMES;
}

/**
 * Pass as `calculateMetadata` on the Composition so the video grows or
 * shrinks with the release: three items render 21 s, five render 30 s.
 */
export function calculateChangelogVideoMetadata({
  props,
}: {
  props: ChangelogVideoProps;
}) {
  return {
    durationInFrames: changelogVideoDuration(
      resolveChangelogVideoProps(props).items.length,
    ),
  };
}
