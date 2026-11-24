import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// A voice agent on a call: the call window rises with its side panel, each
// turn of the conversation opens in the transcript and its words light up
// one after another (a turn can be cut off by the next), a tool call runs
// after a turn, the call ends and the summary card rises while the camera
// leans in. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type VoiceAgentElementId =
  | "call"
  | "panel"
  | `turn:${number}`
  | `word:${number}:${number}`
  | `tool:${number}`
  | "hangup"
  | "summary";

/** A turn as the schedule reads it. */
export interface VoiceTurnTiming {
  speaker: "agent" | "caller";
  text: string;
  interruptedAfter?: number;
  tool?: {
    name?: string;
    pending: string;
    done: string;
    detail?: string;
    result?: string;
  };
}

export interface VoiceAgentTimingProps {
  turns?: VoiceTurnTiming[];
  stagger?: number;
}

/** Frames between spoken words by default. */
export const WPF = 2.4;

export const DEFAULT_TURNS: VoiceTurnTiming[] = [
  {
    speaker: "agent",
    text: "Hi, this is Ava at Fernway. How can I help you tonight?",
  },
  {
    speaker: "caller",
    text: "Can I get a table for four this Saturday?",
  },
  {
    speaker: "agent",
    text: "Saturday works. I have 7:30 on the patio, or 8:15 inside if you would rather stay warm.",
    interruptedAfter: 12,
  },
  {
    speaker: "caller",
    text: "7:30 on the patio. It’s a birthday, too.",
  },
  {
    speaker: "agent",
    text: "Lovely, booking that for you now.",
    tool: {
      name: "book_table",
      pending: "Booking table at Fernway",
      done: "Booked table at Fernway",
      detail: "Sat · 7:30 pm · 4 guests",
      result: "FW-2841",
    },
  },
  {
    speaker: "agent",
    text: "You’re all set. Patio for four at 7:30, and I’ve added a birthday note.",
  },
];

/** The words a turn says; an interrupted turn stops on an em dash. */
export function turnWords(turn: VoiceTurnTiming) {
  const all = turn.text.split(" ");
  const n = Math.min(all.length, turn.interruptedAfter ?? all.length);
  const words = all.slice(0, n);
  if (turn.interruptedAfter) {
    words[n - 1] = `${words[n - 1].replace(/[,.]$/, "")}—`;
  }
  return words;
}

/** When each turn, word and tool call runs, as the scene first plans it. */
export function planVoiceTurns(turns: VoiceTurnTiming[], stagger = WPF) {
  let t = 12;
  const out: {
    words: string[];
    wordAt: number[];
    start: number;
    end: number;
    toolStart: number;
    toolDone: number;
  }[] = [];
  for (const turn of turns) {
    const words = turnWords(turn);
    const wordAt: number[] = [];
    let w = t;
    for (const word of words) {
      wordAt.push(w);
      w += stagger + (/[,.?!]$/.test(word) ? 3 : 0);
    }
    const end = w + 2;
    let toolStart = -1;
    let toolDone = -1;
    let next = end + 9;
    if (turn.tool) {
      toolStart = end + 3;
      toolDone = toolStart + 30;
      next = toolDone + 10;
    } else if (turn.interruptedAfter) {
      next = end - 5;
    }
    out.push({ words, wordAt, start: t, end, toolStart, toolDone });
    t = next;
  }
  const callEnd = (out[out.length - 1]?.end ?? 0) + 12;
  return { turns: out, callEnd, summaryAt: callEnd + 10 };
}

export const voiceAgentTimeline = defineTimeline<
  VoiceAgentElementId,
  VoiceAgentTimingProps
>(({ turns = DEFAULT_TURNS, stagger = WPF }) => {
  const plan = planVoiceTurns(turns, stagger);
  const elements: TimelineElement<VoiceAgentElementId>[] = [
    { id: "call", lane: "Call", label: "call", start: 0, length: 12 },
    {
      id: "panel",
      lane: "Call",
      label: "side panel",
      start: 6,
      length: 10,
      // Each part of the panel rises `stagger` after the one above it.
      beats: { stagger: 2 },
    },
  ];
  plan.turns.forEach((p, i) => {
    const turn = turns[i];
    const prev = turns[i - 1];
    elements.push({
      id: `turn:${i}`,
      lane: "Turns",
      label: `${turn.speaker}: ${p.words.join(" ")}`,
      start: p.start,
      length: p.end - p.start,
      follows:
        i === 0 ? undefined : prev?.tool ? `tool:${i - 1}` : `turn:${i - 1}`,
      beats: {
        // The row opens from `open` to `opened` and shows from `show` to
        // `shown`; the voice comes up from `voice` to `voiced`. Around the
        // turn's end the voice hushes over `hush` + `hushed` and an
        // interruption is marked over `cut` + `cutIn`.
        open: -3,
        opened: 7,
        show: -1,
        shown: 7,
        voice: -2,
        voiced: 2,
        hush: 3,
        hushed: 2,
        cut: 2,
        cutIn: 6,
      },
    });
    p.words.forEach((word, k) => {
      elements.push({
        id: `word:${i}:${k}`,
        lane: `Words ${i + 1}`,
        label: word,
        start: p.wordAt[k],
        length: (p.wordAt[k + 1] ?? p.end) - p.wordAt[k],
        follows: k === 0 ? `turn:${i}` : `word:${i}:${k - 1}`,
        beats: { fade: 5 },
      });
    });
    if (turn.tool) {
      elements.push({
        id: `tool:${i}`,
        lane: "Tools",
        label: turn.tool.name ?? turn.tool.pending,
        start: p.toolStart,
        length: p.toolDone - p.toolStart,
        follows: `turn:${i}`,
        // The row slides in over `in`; once done it swaps over `swap`.
        beats: { in: 10, swap: 8 },
      });
    }
  });
  const last = plan.turns.length - 1;
  elements.push(
    {
      id: "hangup",
      lane: "Call",
      label: "call ends",
      start: plan.callEnd,
      length: plan.summaryAt - plan.callEnd,
      follows: last >= 0 ? `turn:${last}` : undefined,
      // The end button dips at `press` and lets go at `release`; the call
      // winds down over `close`.
      beats: { press: -2, release: 3, close: 8 },
    },
    {
      id: "summary",
      lane: "Summary",
      label: "call summary",
      start: plan.summaryAt,
      length: 40,
      follows: "hangup",
      beats: {
        lean: -10,
        leanEnd: 40,
        open: -2,
        opened: 10,
        row: 4,
        rowIn: 14,
        stagger: 2,
        foot: 6,
        footIn: 16,
      },
    },
  );
  return elements.sort((a, b) => a.start - b.start);
});
