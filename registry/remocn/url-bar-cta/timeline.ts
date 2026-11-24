import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The bar appearing, each key of the URL typed, the suggestions opening,
// the Enter hint, the Enter press, the bar docking into the browser and the
// page rising in, with the slow camera push under it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type UrlBarCtaElementId =
  | "camera"
  | "appear"
  | `key:${number}`
  | "suggest"
  | "hint"
  | "enter"
  | "dock"
  | "hero";

export interface UrlBarCtaTimingProps {
  url?: string;
  typingSpeed?: number;
}

export const DEFAULT_URL = "remocn.dev";

/** The first key lands just after this frame. */
const TYPE_START = 8;
const APPEAR = -2;
const APPEAR_LEN = 10;
const CAMERA = 120;
/** The Enter hint shows this long before the last key, Enter this after. */
const HINT_LEAD = 6;
const ENTER_GAP = 6;
const DOCK_GAP = 5;
const DOCK = 22;
const HERO_GAP = 1;
/** The page's five lines rise in 3 frames apart, 14 frames each. */
const HERO_LEN = 4 * 3 + 14;

function hash(n: number) {
  const x = Math.sin(n * 91.7 + 17.3) * 43758.5453;
  return x - Math.floor(x);
}

/** When each key of `text` lands: a typist's uneven rhythm. */
function keyTimes(text: string, start: number, typingSpeed: number) {
  const times: number[] = [];
  let t = start;
  for (let i = 0; i < text.length; i++) {
    const prev = text[i - 1];
    let gap = 2.1 + (hash(i) - 0.4) * 2.2;
    if (prev === "." || prev === "/") gap += 3;
    if (i === 0) gap = 0;
    t += Math.max(0.8, gap) / typingSpeed;
    times.push(t);
  }
  return times;
}

// `key:<i>` is character `i` landing, a chain; `suggest` opens with the
// second key. `enter` follows the last key: the press releases at
// `release`, the hint hides from `hide` to `hideEnd`, the suggestions close
// from `close`. `dock` follows Enter (the page loads over `load`, the bar
// fades at `loadFade`, the suggestions are shut by `closeEnd`), and the
// page (`hero`, its lines `stagger` apart, each rising over `rise`, the
// card at `card` to `cardEnd`, the clip's playhead over `playhead`)
// follows the dock.
export const urlBarCtaTimeline = defineTimeline<
  UrlBarCtaElementId,
  UrlBarCtaTimingProps
>(({ url = DEFAULT_URL, typingSpeed = 1 }) => {
  const times = keyTimes(url, TYPE_START, typingSpeed);
  const typeEnd = times[times.length - 1] ?? TYPE_START;
  const keyIn = typeEnd - HINT_LEAD;
  const enter = typeEnd + ENTER_GAP;
  const dock = enter + DOCK_GAP;
  const heroStart = dock + HERO_GAP;
  const elements: TimelineElement<UrlBarCtaElementId>[] = [
    {
      id: "camera",
      lane: "Camera",
      label: "Push in",
      start: 0,
      length: CAMERA,
    },
    {
      id: "appear",
      lane: "Bar",
      label: "Bar appears",
      start: APPEAR,
      length: APPEAR_LEN,
    },
  ];
  times.forEach((t, i) => {
    elements.push({
      id: `key:${i}`,
      lane: "Keys",
      label: url[i],
      start: t,
      length: (i + 1 < times.length ? times[i + 1] : enter) - t,
      follows: i > 0 ? `key:${i - 1}` : undefined,
    });
    if (i === 1) {
      elements.push({
        id: "suggest",
        lane: "Suggestions",
        label: "Suggestions open",
        start: t,
        length: enter - t,
        follows: "key:1",
      });
    }
  });
  if (times.length < 2) {
    elements.push({
      id: "suggest",
      lane: "Suggestions",
      label: "Suggestions open",
      start: TYPE_START,
      length: enter - TYPE_START,
    });
  }
  elements.push(
    {
      id: "hint",
      lane: "Enter",
      label: "Enter hint",
      start: keyIn,
      length: enter - keyIn,
    },
    {
      id: "enter",
      lane: "Enter",
      label: "Enter",
      start: enter,
      length: DOCK_GAP,
      follows: times.length > 0 ? `key:${times.length - 1}` : undefined,
      beats: { release: 4, hide: 3, hideEnd: 9, close: 1 },
    },
    {
      id: "dock",
      lane: "Browser",
      label: "Bar docks",
      start: dock,
      length: DOCK,
      follows: "enter",
      beats: { load: 24, loadFade: 30, closeEnd: 3 },
    },
    {
      id: "hero",
      lane: "Browser",
      label: "Page rises in",
      start: heroStart,
      length: HERO_LEN,
      follows: "dock",
      beats: { stagger: 3, rise: 14, card: 6, cardEnd: 14, playhead: 120 },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
