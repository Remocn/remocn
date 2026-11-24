import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The list scrolling in and landing on the focus entry, the band behind it,
// the band expanding into the mist panel, the tag taking the accent and the
// labels rising in. Frames on the 30 fps scene timeline, after `delay` and
// `speed`. The ids are public: a saved `timing` prop refers to them.

export type ChangelogScrollElementId =
  | "scroll"
  | "band"
  | "land"
  | "expand"
  | "accent"
  | "labels";

export interface ChangelogScrollTimingProps {
  scrollLength?: number;
}

export const LAND = 58;
const EXPAND = 64;
const EXPAND_END = 92;

// `scroll` fades the rows in over `intro` while it scrolls; `land` brightens
// the focus row, its hairlines brightening from `hair` over `hairIn`.
// `expand` opens the panel from `panel` over `panelIn`. The later beats
// follow the scroll, so a longer scroll moves them all.
export const changelogScrollTimeline = defineTimeline<
  ChangelogScrollElementId,
  ChangelogScrollTimingProps
>(({ scrollLength = LAND }): TimelineElement<ChangelogScrollElementId>[] => {
  const landAt = scrollLength;
  const expandAt = EXPAND + (scrollLength - LAND);
  const expandEnd = EXPAND_END + (scrollLength - LAND);
  return [
    {
      id: "scroll",
      lane: "List",
      label: "scroll",
      start: 0,
      length: landAt,
      beats: { intro: 8 },
    },
    { id: "band", lane: "Band", label: "band", start: 4, length: 20 },
    {
      id: "land",
      lane: "List",
      label: "land on focus",
      start: landAt,
      length: 14,
      follows: "scroll",
      beats: { hair: -4, hairIn: 16 },
    },
    {
      id: "expand",
      lane: "Band",
      label: "expand",
      start: expandAt,
      length: expandEnd - expandAt,
      follows: "scroll",
      beats: { panel: -2, panelIn: 24 },
    },
    {
      id: "accent",
      lane: "Hero",
      label: "accent tag",
      start: expandEnd - 8,
      length: 16,
      follows: "expand",
    },
    {
      id: "labels",
      lane: "Labels",
      label: "labels",
      start: expandEnd - 4,
      length: 20,
      follows: "expand",
    },
  ];
});
