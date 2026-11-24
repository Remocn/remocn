import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Each exchange: the objection rising in word by word, the reply rising
// under it, and the pair leaving before the next objection. Frames on the
// 30 fps scene timeline, after `delay` and `speed`. When the exchanges run
// past the clip, their schedule is compressed to fit. The ids are public:
// a saved `timing` prop refers to them.

export type NoButsElementId =
  | `objection:${number}`
  | `reply:${number}`
  | `leave:${number}`;

/** One objection and its reply (`NoButsExchange`). */
export interface Exchange {
  objection: string;
  reply: string;
}

export interface NoButsTimingProps {
  exchanges?: Exchange[];
  stagger?: number;
  pause?: number;
}

export const DEFAULT_EXCHANGES: Exchange[] = [
  {
    objection: "But I’m not a motion designer.",
    reply: "You don’t need to be.",
  },
  { objection: "But I’m busy.", reply: "It takes one lunch." },
  { objection: "But…", reply: "Go on. We’ll wait." },
];

const OBJ_WORD = 3;
export const REPLY_WORD = 2.5;
const RISE = 13;
const EXIT = 10;

/** The exchanges to show; an empty list falls back to the defaults. */
export function exchangesOf(exchanges: Exchange[]) {
  return exchanges.length > 0 ? exchanges : DEFAULT_EXCHANGES;
}

/** The words of an objection or a reply. */
export function wordsOf(s: string) {
  return s.trim().split(/\s+/);
}

// `objection:<i>` and `reply:<i>` rise a word every `word` beat, each word
// over `rise` frames; `leave:<i>` moves the exchange out before the next
// objection (the last exchange stays). They form one chain in time order.
// `length` here is the clip length without `speed`, as the fit is counted.
export const noButsTimeline = defineTimeline<
  NoButsElementId,
  NoButsTimingProps
>(
  (
    { exchanges = DEFAULT_EXCHANGES, stagger = REPLY_WORD, pause = 26 },
    { length },
  ) => {
    const T = length;
    const list = exchangesOf(exchanges);
    const objWords = list.map((e) => wordsOf(e.objection));
    const replyWords = list.map((e) => wordsOf(e.reply));
    const objStart: number[] = [];
    const replyStart: number[] = [];
    let clock = 6;
    list.forEach((_, i) => {
      objStart.push(clock);
      const nO = objWords[i].length;
      clock += nO * OBJ_WORD + RISE;
      clock += nO <= 1 ? 22 : 4;
      replyStart.push(clock);
      clock += replyWords[i].length * stagger + RISE;
      clock += i < list.length - 1 ? pause : 0;
    });
    const room = Math.max(1, T - Math.max(30, T * 0.18));
    const k = clock > room ? room / clock : 1;

    const elements: TimelineElement<NoButsElementId>[] = [];
    list.forEach((ex, i) => {
      const obj = objStart[i] * k;
      const reply = replyStart[i] * k;
      elements.push(
        {
          id: `objection:${i}`,
          lane: "Objections",
          label: ex.objection,
          start: obj,
          length: reply - obj,
          follows: i > 0 ? `leave:${i - 1}` : undefined,
          beats: { word: OBJ_WORD * k, rise: RISE },
        },
        {
          id: `reply:${i}`,
          lane: "Replies",
          label: ex.reply,
          start: reply,
          length: (replyWords[i].length - 1) * stagger * k + RISE,
          follows: `objection:${i}`,
          beats: { word: stagger * k, rise: RISE },
        },
      );
      if (i < list.length - 1) {
        elements.push({
          id: `leave:${i}`,
          lane: "Exits",
          label: "leave",
          start: (objStart[i + 1] - EXIT - 2) * k,
          length: EXIT * k,
          follows: `reply:${i}`,
        });
      }
    });
    return elements;
  },
);
