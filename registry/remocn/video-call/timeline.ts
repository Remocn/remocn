import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// People joining the call one by one, the call controls fading in, whoever
// talks lighting up their tile, the presenter sharing their screen and the
// reaction tray with its floating reactions. Frames on the 30 fps scene
// timeline, after `delay` and `speed`. The ids are public: a saved `timing`
// prop refers to them.

export type VideoCallElementId =
  | `join:${number}`
  | "ui"
  | `speak:${number}`
  | "present"
  | "tray"
  | `react:${number}`;

export interface VideoCallTimingParticipant {
  name: string;
  color: string;
  camera?: boolean;
  muted?: boolean;
}

export interface VideoCallTimingProps {
  participants?: VideoCallTimingParticipant[];
  presenter?: number;
  present?: boolean;
}

export const DEFAULT_PARTICIPANTS: VideoCallTimingParticipant[] = [
  { name: "You", color: "#5B7A99", camera: true },
  { name: "Maya Chen", color: "#C98A55", camera: true },
  { name: "Leo Park", color: "#12A594", camera: false, muted: true },
  { name: "Priya Raman", color: "#8E6CC9", camera: true },
  { name: "Sam Okafor", color: "#D9644A", camera: false },
  { name: "Noor Haddad", color: "#4F8FD6", camera: true, muted: true },
];

const JOINS = [-30, 22, 46, 54, 80, 88];
/** Who talks before the screen share, in order; the presenter talks last. */
export const SPEAKERS = [1, 0, 3, 4];
const SPEAK_AT = [30, 66, 100, 126];
const PRESENT_AT = 150;
const TRAY_AT = 196;

/** A reaction floating up: the tray button, who sent it and where it rises. */
export const FLOATS = [
  { at: 0, k: 2, who: 2, x: 0.04 },
  { at: 7, k: 1, who: 4, x: 0.3 },
  { at: 12, k: 0, who: 0, x: 0.56 },
  { at: 20, k: 2, who: 3, x: 0.16 },
  { at: 27, k: 1, who: 5, x: 0.44 },
  { at: 33, k: 3, who: 0, x: 0.02 },
  { at: 40, k: 4, who: 2, x: 0.62 },
  { at: 48, k: 2, who: 4, x: 0.24 },
  { at: 56, k: 0, who: 3, x: 0.5 },
];

/** The tile index of speaker `k`: the fixed list, then the presenter. */
export function speakerOf(k: number, presenter: number, n: number): number {
  return k < SPEAKERS.length
    ? SPEAKERS[k]
    : Math.min(n - 1, Math.max(0, presenter));
}

// `join:<i>` is participant `i` joining (a chain): the grid reflows from its
// start, the tile appears at `appear` and the head count ticks at `count`.
// `ui` fades the call controls in. `speak:<k>` is speaker `k` talking (a
// chain): the level rises over `rise` and falls over `fall` before the next
// speaker starts; the presenter keeps talking to the end. `present` moves the
// tiles to the strip (tile `i` at `i * stagger`, over `swap`), brings the
// shared screen in at `screen` and draws its chart from `chart` over `draw`.
// `tray` pops the reaction tray in and fades it from `out` to its end.
// `react:<k>` is one reaction floating up (a chain after the tray), fading in
// over `fadeIn` and out from `fade`.
export const videoCallTimeline = defineTimeline<
  VideoCallElementId,
  VideoCallTimingProps
>(
  (
    { participants = DEFAULT_PARTICIPANTS, presenter = 1, present = true },
    { length },
  ) => {
    const people = participants.slice(0, 6);
    const n = people.length;
    const elements: TimelineElement<VideoCallElementId>[] = [];

    JOINS.slice(0, n).forEach((at, i) => {
      elements.push({
        id: `join:${i}`,
        lane: "People",
        label: people[i].name,
        start: at,
        length: 24,
        follows: i > 0 ? `join:${i - 1}` : undefined,
        beats: { appear: 4, count: 6 },
      });
    });
    elements.push({
      id: "ui",
      lane: "Controls",
      label: "Call controls",
      start: 6,
      length: 30,
    });

    const sched = [...SPEAK_AT, PRESENT_AT + 6]
      .map((at, k) => ({ at, k, i: speakerOf(k, presenter, n) }))
      .filter((s) => s.i < n);
    sched.forEach((s, j) => {
      const next = sched[j + 1];
      const prev = sched[j - 1];
      const last = s.k === SPEAKERS.length;
      elements.push({
        id: `speak:${s.k}`,
        lane: "Speaking",
        label: people[s.i]?.name ?? "",
        start: s.at,
        length: next ? next.at - s.at : Math.max(1, length - s.at),
        follows:
          last && present ? "present" : prev ? `speak:${prev.k}` : undefined,
        beats: { rise: 5, fall: 4 },
      });
    });

    if (present) {
      elements.push({
        id: "present",
        lane: "Screen",
        label: "Share screen",
        start: PRESENT_AT,
        length: 34,
        beats: { stagger: 1, swap: 10, screen: 3, chart: 8, draw: 26 },
      });
    }
    elements.push({
      id: "tray",
      lane: "Reactions",
      label: "Reaction tray",
      start: TRAY_AT,
      length: 60,
      follows: present ? "present" : undefined,
      beats: { out: 52 },
    });
    FLOATS.forEach((f, k) => {
      elements.push({
        id: `react:${k}`,
        lane: "Reactions",
        label: people[f.who % n]?.name.split(" ")[0] ?? "",
        start: TRAY_AT + 6 + f.at,
        length: 84,
        follows: k > 0 ? `react:${k - 1}` : "tray",
        beats: { fadeIn: 4, fade: 64 },
      });
    });

    return elements.sort((a, b) => a.start - b.start);
  },
);
