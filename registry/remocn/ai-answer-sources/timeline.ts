import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The app rising in, the question typed and sent, the research steps, the
// answer streaming in block by block, then the pointer hovering a citation
// and opening the sources panel. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type AiAnswerSourcesElementId =
  | "app"
  | "type"
  | "cursor"
  | "submit"
  | "thread"
  | "search"
  | "read"
  | "review"
  | `unit:${number}`
  | "actions"
  | "bar"
  | "related"
  | "hover"
  | "click"
  | "panel";

type AnswerTimingBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ul"; items: string[] };

export interface AiAnswerSourcesTimingProps {
  query?: string;
  answer?: AnswerTimingBlock[];
  related?: string[];
}

export const DEFAULT_QUERY = "What is the fastest way to make a launch video?";

export const DEFAULT_ANSWER: AnswerTimingBlock[] = [
  {
    type: "p",
    text: "The fastest way is to skip the timeline editor and assemble the video from prebuilt motion components. With **remocn** you install animated scenes into a Remotion project and render them straight from code.[0,1,2] Most solo builders ship a 30-second launch video in a single afternoon.[3]",
  },
  { type: "h", text: "A one-afternoon workflow" },
  {
    type: "ul",
    items: [
      "**Pick your beats.** Hook, product, proof and call to action, one component each.[2]",
      "**Drop in your UI.** Every scene accepts your screenshots or live React.[4]",
      "**Render from the terminal.** One command gives you 1080p or 4K, no export dialog.[1,5]",
    ],
  },
  {
    type: "p",
    text: "If you already have a landing page, start with a device mockup and a URL-bar call to action; that pair alone covers most launch posts.[0,2,6]",
  },
];

export const DEFAULT_RELATED = [
  "How long should a launch video be?",
  "Which scenes work best for a SaaS demo?",
  "Can I render launch videos in CI?",
];

const TYPE_AT = 10;
/** Characters of the question typed per frame. */
export const TYPE_RATE = 1.5;
const CURSOR_AT = 30;
const SUBMIT = 60;
const THREAD = 64;
const STEP1 = 76;
const STEP2 = 94;
const STEPS_DONE = 120;
const ANSWER_AT = 132;
/** Characters of the answer streamed in per frame. */
export const RATE = 6;

export type AnswerTok =
  | { t: "w"; s: string; b: boolean; at: number }
  | { t: "c"; ids: number[]; at: number };

function tokenize(text: string) {
  const toks: AnswerTok[] = [];
  let n = 0;
  let bold = false;
  for (const part of text.split(/(\[\d+(?:,\d+)*\])/)) {
    const m = part.match(/^\[(\d+(?:,\d+)*)\]$/);
    if (m) {
      toks.push({ t: "c", ids: m[1].split(",").map(Number), at: n });
      continue;
    }
    part.split("**").forEach((seg, i) => {
      if (i > 0) bold = !bold;
      for (const w of seg.match(/\S+\s*|\s+/g) ?? []) {
        toks.push({ t: "w", s: w, b: bold, at: n });
        n += w.length;
      }
    });
  }
  return { toks, len: n };
}

export interface AnswerUnit {
  kind: "p" | "h" | "li";
  toks: AnswerTok[];
  len: number;
  start: number;
  end: number;
}

/**
 * The answer as the units it streams in (a paragraph, a heading, a list
 * item), when each starts and ends, and the last citation the pointer hovers.
 */
export function planAnswer(answer: AnswerTimingBlock[]) {
  const units: AnswerUnit[] = [];
  let t = ANSWER_AT;
  const add = (kind: AnswerUnit["kind"], text: string) => {
    const { toks, len } = tokenize(text);
    const end = t + len / RATE;
    units.push({ kind, toks, len, start: t, end });
    t = end + (kind === "h" ? 2 : 5);
  };
  for (const b of answer) {
    if (b.type === "ul") for (const it of b.items) add("li", it);
    else add(b.type, b.text);
  }
  let hover = { u: -1, k: -1, from: 0 };
  units.forEach((u, ui) => {
    let prev = -1;
    u.toks.forEach((tk, k) => {
      if (tk.t !== "c") return;
      hover = { u: ui, k, from: prev + 1 };
      prev = k;
    });
  });
  return { units, end: t, hover };
}

// `app` rises the app in. `type` types the question; `stream` is a unit beat
// whose stretch slows the typing. `cursor` brings the pointer to the send
// button, fading in over `fadeIn`; `submit` presses it, fades the pointer from
// `cursorOut` to `cursorGone`, the home view out from `homeAt` to `homeEnd`
// and the thread in from `threadAt` to `threadEnd`. `thread` raises the
// question. `search` is the first research step (its chips at `chip1` and
// `chip2`, done at `done`); `read` the second (favicons at `favs`, the tile
// row opening at `tilesOpen`, tile `i` at `tiles + i * tileStagger`, done at
// its end); `review` collapses both into one line at `collapse`.
// `unit:<i>` streams answer unit `i` in (a chain); stretching its `stream`
// beat slows the stream, and it stops clipping `settle` after its end. After
// the last unit: `actions`, the follow-up `bar`, the `related` questions (row
// `i` at `rows + i * rowStagger`). `hover` moves the pointer onto the last
// citation (in over `fadeIn`, the mark from `markAt` to `markEnd`, the pill
// lit at `lit`, the card at `card`); `click` presses it, fading the card over
// `cardOut`; `panel` opens the sources panel, row `i` at `rows + i *
// rowStagger`.
export const aiAnswerSourcesTimeline = defineTimeline<
  AiAnswerSourcesElementId,
  AiAnswerSourcesTimingProps
>(
  ({
    query = DEFAULT_QUERY,
    answer = DEFAULT_ANSWER,
    related = DEFAULT_RELATED,
  }) => {
    const { units, end } = planAnswer(answer);
    const HOVER = end + 34;
    const CLICK = HOVER + 50;
    const PANEL_AT = CLICK + 2;
    const elements: TimelineElement<AiAnswerSourcesElementId>[] = [
      { id: "app", lane: "App", label: "App", start: 0, length: 12 },
      {
        id: "type",
        lane: "Search box",
        label: "Type the question",
        start: TYPE_AT,
        length: Math.max(1, query.length / TYPE_RATE),
        beats: { stream: 1 },
      },
      {
        id: "cursor",
        lane: "Pointer",
        label: "Reach for send",
        start: CURSOR_AT,
        length: SUBMIT - CURSOR_AT,
        beats: { fadeIn: 6 },
      },
      {
        id: "submit",
        lane: "Pointer",
        label: "Send",
        start: SUBMIT,
        length: THREAD - SUBMIT,
        follows: "cursor",
        beats: {
          cursorOut: 4,
          cursorGone: 8,
          homeAt: 1,
          homeEnd: 7,
          threadAt: 2,
          threadEnd: 12,
        },
      },
      {
        id: "thread",
        lane: "Thread",
        label: "Question",
        start: THREAD,
        length: STEP1 - THREAD,
        follows: "submit",
      },
      {
        id: "search",
        lane: "Thread",
        label: "Search the web",
        start: STEP1,
        length: STEP2 - STEP1,
        follows: "thread",
        beats: { chip1: 4, chip2: 9, done: STEP2 - 2 - STEP1 },
      },
      {
        id: "read",
        lane: "Thread",
        label: "Read the sources",
        start: STEP2,
        length: STEPS_DONE - STEP2,
        follows: "search",
        beats: { favs: 4, tilesOpen: 6, tiles: 8, tileStagger: 4 },
      },
      {
        id: "review",
        lane: "Thread",
        label: "Sources reviewed",
        start: STEPS_DONE,
        length: ANSWER_AT - STEPS_DONE,
        follows: "read",
        beats: { collapse: 2 },
      },
    ];
    units.forEach((u, i) => {
      const words = u.toks.flatMap((tk) => (tk.t === "w" ? [tk.s] : []));
      elements.push({
        id: `unit:${i}`,
        lane: "Answer",
        label: words.join("").trim().slice(0, 40),
        start: u.start,
        length: u.len / RATE,
        follows: i > 0 ? `unit:${i - 1}` : "review",
        beats: { stream: 1, settle: 8 },
      });
    });
    const last: AiAnswerSourcesElementId =
      units.length > 0 ? `unit:${units.length - 1}` : "review";
    elements.push(
      {
        id: "actions",
        lane: "Answer",
        label: "Actions",
        start: end + 4,
        length: 6,
        follows: last,
      },
      {
        id: "bar",
        lane: "Follow-up",
        label: "Follow-up bar",
        start: end + 8,
        length: 24,
        follows: last,
      },
      {
        id: "related",
        lane: "Answer",
        label: "Related",
        start: end + 10,
        length: 4 + related.length * 4 + 16,
        follows: last,
        beats: { rows: 4, rowStagger: 4 },
      },
      {
        id: "hover",
        lane: "Citation",
        label: "Hover a citation",
        start: HOVER,
        length: CLICK - HOVER,
        follows: "related",
        beats: { fadeIn: 6, markAt: 18, markEnd: 26, lit: 20, card: 22 },
      },
      {
        id: "click",
        lane: "Citation",
        label: "Open the sources",
        start: CLICK,
        length: PANEL_AT - CLICK,
        follows: "hover",
        beats: { cardOut: 6 },
      },
      {
        id: "panel",
        lane: "Citation",
        label: "Sources panel",
        start: PANEL_AT,
        length: 30,
        follows: "click",
        beats: { rows: 6, rowStagger: 4 },
      },
    );
    return elements;
  },
);
