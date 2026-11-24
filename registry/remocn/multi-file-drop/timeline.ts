import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The heading and the prompt card come up, a fan of files flies in, hovers
// over the card and drops; the card grows a row of slots, the files deal
// into them and upload one by one, the cursor moves to send, the card turns
// ready, the send is pressed and the cursor leaves. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type MultiFileDropElementId =
  | "head"
  | "card"
  | "camera"
  | "fly"
  | "hover"
  | "drop"
  | "deal"
  | "push"
  | `file:${number}`
  | "cursor-out"
  | `upload:${number}`
  | "ready"
  | "send"
  | "leave";

export interface MultiFileDropTimingProps {
  files?: { name: string }[];
  resolveOrder?: number[];
}

/** The scene's own clip; the camera push runs to here. */
export const DROP_END = 144;
export const DEFAULT_RESOLVE_ORDER = [0, 2, 1, 3];
/** Names of the component's default files. */
const DEFAULT_FILE_NAMES = [
  "wireframe.png",
  "hero.jpg",
  "brief.pdf",
  "pricing.csv",
];
const DEAL = 40;
const DEAL_STEP = 2;
const LAND = 10;
const RESOLVE = [62, 74, 84, 92];

// The fly brings the fan in over its length (its opacity over `show`, the
// cursor's over `cursorIn`/`cursorInLength`), spreads it from `spread` over
// `spreadLength` and pops the count badge at `badge`. The hover sways the fan
// and lights the drop zone from `zone` over `zoneLength`. The drop settles the
// fan (`fall`/`fallLength`), clears the badge (`badgeOut`/`badgeOutLength`),
// stops the sway over `out` and clicks (`press`, `release`). The deal grows
// the card over its length, fades slot i out from `slotFade + i * step` over
// `slotFadeLength` and the drop zone over `zoneOut`. `file:<i>` flies file i
// into its slot, the last file first, as a chain, and starts loading at
// `loading` over `loadingLength`; `upload:<i>` finishes its upload over its
// length and counts as done `counted` frames in, as a chain in resolve order.
// The ready state fades in over `fade`. The send presses (`press`, `release`) and turns the button over `sent`.
export const multiFileDropTimeline = defineTimeline<
  MultiFileDropElementId,
  MultiFileDropTimingProps
>(({ files, resolveOrder = DEFAULT_RESOLVE_ORDER }) => {
  const names = files ? files.map((f) => f.name) : DEFAULT_FILE_NAMES;
  const n = Math.min(4, names.length);
  const order = resolveOrder.filter((k) => k < n);
  const resolveAt = (i: number) => {
    const k = order.indexOf(i);
    return RESOLVE[k >= 0 ? k : i] ?? RESOLVE[RESOLVE.length - 1];
  };

  const elements: TimelineElement<MultiFileDropElementId>[] = [
    { id: "head", lane: "Heading", label: "Heading", start: -12, length: 15 },
    { id: "card", lane: "Card", label: "Card rises", start: -8, length: 12 },
    {
      id: "camera",
      lane: "Camera",
      label: "Camera settles",
      start: -6,
      length: DEAL + 6,
    },
    {
      id: "fly",
      lane: "Files",
      label: "Files fly in",
      start: 4,
      length: 24,
      beats: {
        show: 4,
        cursorIn: 2,
        cursorInLength: 6,
        spread: 6,
        spreadLength: 18,
        badge: 8,
      },
    },
    {
      id: "hover",
      lane: "Files",
      label: "Files hover",
      start: 26,
      length: 12,
      follows: "fly",
      beats: { in: -4, inLength: 10, zone: -8, zoneLength: 10 },
    },
    {
      id: "drop",
      lane: "Files",
      label: "Drop",
      start: 38,
      length: DEAL - 38,
      follows: "hover",
      beats: {
        out: 4,
        fall: -3,
        fallLength: 4,
        badgeOut: -2,
        badgeOutLength: 5,
        press: -3,
        release: 1,
      },
    },
    {
      id: "deal",
      lane: "Card",
      label: "Card grows slots",
      start: DEAL,
      length: 16,
      follows: "drop",
      beats: { step: DEAL_STEP, slotFade: 6, slotFadeLength: 4, zoneOut: 8 },
    },
    {
      id: "push",
      lane: "Camera",
      label: "Camera pushes in",
      start: DEAL,
      length: DROP_END - DEAL,
      beats: { tilt: 40 },
    },
  ];
  for (let k = 0; k < n; k++) {
    const i = n - 1 - k;
    elements.push({
      id: `file:${i}`,
      lane: "Files",
      label: names[i],
      start: DEAL + k * DEAL_STEP,
      length: LAND,
      follows: k > 0 ? `file:${i + 1}` : "deal",
      beats: { loading: LAND - 4, loadingLength: 6 },
    });
  }
  elements.push({
    id: "cursor-out",
    lane: "Cursor",
    label: "Cursor to send",
    start: 52,
    length: 36,
    follows: "drop",
  });
  const uploads = names
    .slice(0, n)
    .map((name, i) => ({ name, i, at: resolveAt(i) }))
    .sort((a, b) => a.at - b.at);
  uploads.forEach(({ name, i, at }, k) => {
    elements.push({
      id: `upload:${i}`,
      lane: "Uploads",
      label: name,
      start: at,
      length: 6,
      follows: k > 0 ? `upload:${uploads[k - 1].i}` : "file:0",
      beats: { counted: 2 },
    });
  });
  elements.push(
    {
      id: "ready",
      lane: "Card",
      label: "Ready",
      start: 100,
      length: 12,
      beats: { fade: 8 },
    },
    {
      id: "send",
      lane: "Card",
      label: "Send",
      start: 112,
      length: 10,
      follows: "ready",
      beats: { press: -2, release: 2, sent: 1, sentLength: 8 },
    },
    {
      id: "leave",
      lane: "Cursor",
      label: "Cursor leaves",
      start: 122,
      length: DROP_END - 122,
      follows: "send",
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
