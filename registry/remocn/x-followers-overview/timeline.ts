import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The new followers' names flip by one after another, then the list fades
// and the total pops in with the account above it. Frames on the 30 fps scene
// timeline, after `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type XFollowersOverviewElementId = `name:${number}` | "reveal";

export interface XFollowerNotification {
  name: string;
  verified: boolean;
  /** Relative time label, e.g. "7h", "1d". */
  time: string;
}

export interface XFollowersOverviewTimingProps {
  notifications?: XFollowerNotification[];
}

/**
 * Hardcoded sample notifications so the composition renders immediately from
 * defaults. A future revision swaps this for live X API data.
 */
export const X_SAMPLE_FOLLOWERS: XFollowerNotification[] = [
  { name: "Andre Vitorio", verified: true, time: "7h" },
  { name: "Sarah Chen", verified: true, time: "7h" },
  { name: "marcus", verified: false, time: "8h" },
  { name: "Lena Powell", verified: true, time: "9h" },
  { name: "dev_jay", verified: false, time: "10h" },
  { name: "Priya Nair", verified: true, time: "11h" },
  { name: "Tomás Rivera", verified: true, time: "13h" },
  { name: "hana.eth", verified: false, time: "15h" },
  { name: "Will Carter", verified: true, time: "18h" },
  { name: "Yuki Tanaka", verified: true, time: "21h" },
  { name: "benoit", verified: false, time: "23h" },
  { name: "Amara Okafor", verified: true, time: "1d" },
  { name: "Leo Martins", verified: true, time: "1d" },
  { name: "sol", verified: false, time: "2d" },
];

/** Frames each name holds the line; it flips to the next in the back half. */
const SLOT = 13;

// A name runs for its slot and flips to the next over its back part. The
// reveal starts when the list is exhausted, capped so it always fits before
// the clip ends (`length` is the clip in raw frames, as before): the list
// fades from `fadeAt` to `faded`, the total springs from `pop` and blurs in
// from `inAt` to `in`.
export const xFollowersOverviewTimeline = defineTimeline<
  XFollowersOverviewElementId,
  XFollowersOverviewTimingProps
>(({ notifications = X_SAMPLE_FOLLOWERS }, { length }) => {
  const items = notifications.length > 0 ? notifications : X_SAMPLE_FOLLOWERS;
  const count = items.length;
  const listEnd = count * SLOT;
  const revealStart = Math.min(listEnd, Math.round(length * 0.82));
  const elements: TimelineElement<XFollowersOverviewElementId>[] = items.map(
    (item, i) => ({
      id: `name:${i}`,
      lane: "Names",
      label: item.name,
      start: i * SLOT,
      length: SLOT,
      follows: i > 0 ? `name:${i - 1}` : undefined,
    }),
  );
  elements.push({
    id: "reveal",
    lane: "Total",
    label: "total",
    start: revealStart,
    length: 28,
    follows: revealStart === listEnd ? `name:${count - 1}` : undefined,
    beats: { fadeAt: -4, faded: 8, pop: 2, inAt: 4, in: 28 },
  });
  return elements.sort((a, b) => a.start - b.start);
});
