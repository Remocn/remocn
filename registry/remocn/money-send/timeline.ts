import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// Sending money on a phone: the phone rises under a slow push, the amount is
// tapped in digit by digit, the note field is tapped and the keyboard swaps
// in, the note is typed letter by letter and an emoji picked, send is
// tapped, the amount flies up, a progress ring runs and the sent screen
// settles. Three lines beside the phone change with it. Frames on the 30 fps
// scene timeline, after `delay` and `speed`. The ids are public: a saved
// `timing` prop refers to them.

export type MoneySendElementId =
  | "phone"
  | `line:${number}`
  | "push"
  | `key:${number}`
  | "note"
  | "keyboard"
  | `letter:${number}`
  | "emoji"
  | "send"
  | "progress"
  | "done";

export interface MoneySendTimingProps {
  amount?: number;
  note?: string;
  stagger?: number;
}

export const DEFAULT_AMOUNT = 120;
export const DEFAULT_NOTE = "Dinner 🍜";
export const DEFAULT_STAGGER = 11;

/** A note's letters, typed on the keyboard, and a trailing emoji, picked. */
export function splitNote(note: string) {
  const chars = Array.from(note);
  const idx = chars.findIndex((ch) => (ch.codePointAt(0) ?? 0) > 0x2100);
  if (idx < 0) return { word: chars, emoji: "" };
  return {
    word: Array.from(chars.slice(0, idx).join("").trimEnd()),
    emoji: chars.slice(idx).join("").trim(),
  };
}

/** The digits typed on the keypad, at most six. */
export function amountDigits(amount: number) {
  return String(Math.max(1, Math.round(amount))).slice(0, 6);
}

const LINE_LABELS = ["amount line", "note line", "sent line"];

export const moneySendTimeline = defineTimeline<
  MoneySendElementId,
  MoneySendTimingProps
>(
  ({
    amount = DEFAULT_AMOUNT,
    note = DEFAULT_NOTE,
    stagger = DEFAULT_STAGGER,
  }) => {
    const digits = amountDigits(amount);
    const { word, emoji } = splitNote(note);
    const keyTimes = digits.split("").map((_, i) => 30 + i * stagger);
    const NOTE_TAP = keyTimes[keyTimes.length - 1] + 22;
    const KB_SWAP = NOTE_TAP + 3;
    const gap = Math.min(5, 36 / Math.max(1, word.length));
    const letterTimes = word.map((_, i) => KB_SWAP + 18 + i * gap);
    const typeEnd = letterTimes.length
      ? letterTimes[letterTimes.length - 1]
      : KB_SWAP + 12;
    const SUGG_TAP = emoji ? typeEnd + 11 : typeEnd;
    const SEND_TAP = SUGG_TAP + 18;
    const PROG = SEND_TAP + 6;
    const DONE = PROG + 30;
    const lastKey = `key:${keyTimes.length - 1}` as const;
    const lastLetter =
      letterTimes.length > 0
        ? (`letter:${letterTimes.length - 1}` as const)
        : undefined;

    const elements: TimelineElement<MoneySendElementId>[] = [
      {
        id: "phone",
        lane: "Phone",
        label: "phone rises",
        start: 0,
        length: 16,
      },
      { id: "push", lane: "Camera", label: "push in", start: 16, length: 54 },
    ];
    // The copy beside the phone: each line slides in over `in`, and out from
    // `leave` to `gone` around the next line's start.
    const lineBeats = { in: 14, leave: -2, gone: 6 };
    elements.push({
      id: "line:0",
      lane: "Copy",
      label: LINE_LABELS[0],
      start: 0 + 6,
      length: NOTE_TAP - 6,
      beats: lineBeats,
    });
    keyTimes.forEach((at, i) => {
      elements.push({
        id: `key:${i}`,
        lane: "Keypad",
        label: digits[i],
        start: at,
        length: (keyTimes[i + 1] ?? NOTE_TAP) - at,
        follows: i > 0 ? `key:${i - 1}` : undefined,
        // The key lights from `lit` to `litEnd`. The touch sets off at
        // `approach` and fades in over `touchIn`; the send button enables
        // over `enable` once the first digit lands.
        beats: { lit: -1, litEnd: 10, approach: -16, touchIn: 8, enable: 6 },
      });
    });
    elements.push(
      {
        id: "note",
        lane: "Note",
        label: "tap the note field",
        start: NOTE_TAP,
        length: KB_SWAP - NOTE_TAP,
        follows: lastKey,
        beats: { label: 6 },
      },
      {
        id: "line:1",
        lane: "Copy",
        label: LINE_LABELS[1],
        start: NOTE_TAP,
        length: PROG - NOTE_TAP,
        follows: lastKey,
        beats: lineBeats,
      },
      {
        id: "keyboard",
        lane: "Note",
        label: "keyboard swaps in",
        start: KB_SWAP,
        length: 18,
        follows: "note",
        // The keypad leaves over `out`; the keyboard rises from `rise`. With
        // no letters to type the note is done at `empty`.
        beats: { out: 8, rise: 5, empty: 12 },
      },
    );
    letterTimes.forEach((at, i) => {
      elements.push({
        id: `letter:${i}`,
        lane: "Keyboard",
        label: word[i],
        start: at,
        length: gap,
        follows: i > 0 ? `letter:${i - 1}` : "keyboard",
        beats: { lit: -1, litEnd: 7 },
      });
    });
    const beforeSend = lastLetter ?? "keyboard";
    if (emoji) {
      elements.push({
        id: "emoji",
        lane: "Keyboard",
        label: emoji,
        start: SUGG_TAP,
        length: SEND_TAP - SUGG_TAP,
        follows: beforeSend,
      });
    }
    elements.push(
      {
        id: "send",
        lane: "Send",
        label: "send",
        start: SEND_TAP,
        length: PROG - SEND_TAP,
        follows: emoji ? "emoji" : beforeSend,
        // The touch fades from `touchOut` to `touchGone`; the keyboard drops
        // from `kbDown` to `kbDownEnd`; the field and button leave from `away`
        // to `awayEnd`; the amount flies up at `fly` and the camera pushes
        // on over `push`.
        beats: {
          touchOut: 2,
          touchGone: 7,
          kbDown: 2,
          kbDownEnd: 11,
          away: 2,
          awayEnd: 9,
          fly: 3,
          push: 50,
        },
      },
      {
        id: "progress",
        lane: "Send",
        label: "progress ring",
        start: PROG,
        length: DONE - PROG,
        follows: "send",
        beats: { copy: 4 },
      },
      {
        id: "line:2",
        lane: "Copy",
        label: LINE_LABELS[2],
        start: PROG,
        length: 40,
        follows: "send",
        beats: lineBeats,
      },
      {
        id: "done",
        lane: "Send",
        label: "sent",
        start: DONE,
        length: 40,
        follows: "progress",
        // The ring closes from `settle` to `close`; the disc, the swap, the
        // tick and the pulse follow; the title, the receipt rows (one every
        // `stagger`) and the button rise last.
        beats: {
          settle: -4,
          close: 2,
          disc: 1,
          swap: 4,
          tick: 5,
          tickEnd: 15,
          pulse: 6,
          pulseEnd: 40,
          title: 8,
          rows: 12,
          stagger: 3,
          button: 24,
        },
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
