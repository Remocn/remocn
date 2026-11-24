import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The remocn logo pops in and its word types on, the camera leans in, an
// accent flood rises from below as the logo balloons into a giant backdrop,
// then a prompt card springs up, the prompt types in and the send button
// lights. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type GiantMarkBackdropElementId =
  | "mark"
  | "push"
  | `char:${number}`
  | "flood"
  | "balloon"
  | "card"
  | "drift"
  | "prompt"
  | "send";

const B = {
  mark: -3,
  type: 6,
  typeStep: 3,
  flood: 40,
  floodLen: 16,
  balloon: 42,
  card: 54,
  prompt: 66,
  promptEnd: 94,
  send: 100,
  end: 126,
};

/** Frames the demo runs. */
export const GIANT_MARK_LENGTH = B.end;
/** The word typed after the R. */
export const GIANT_MARK_WORD = "emocn";

// `mark` pops the R in with a spring. `char:<i>` fades letter `i` of the
// word in over its length (a chain). `push` leans the camera in until the
// balloon. `flood` grows the accent flood over its length. `balloon`
// springs the logo up into the backdrop; `drift` then pushes everything in
// slowly to the end. `card` springs the prompt card up. `prompt` types the
// prompt over its length; the caret then blinks every `blink`. `send`
// lights the send button.
export const giantMarkBackdropTimeline = defineTimeline<
  GiantMarkBackdropElementId,
  object
>(() => {
  const elements: TimelineElement<GiantMarkBackdropElementId>[] = [
    {
      id: "mark",
      lane: "Mark",
      label: "Mark",
      start: B.mark,
      length: B.type - B.mark,
    },
    { id: "push", lane: "Logo", label: "Lean in", start: 0, length: B.balloon },
  ];
  Array.from(GIANT_MARK_WORD).forEach((ch, i) => {
    elements.push({
      id: `char:${i}`,
      lane: "Word",
      label: ch,
      start: B.type + i * B.typeStep,
      length: 3,
      follows: i > 0 ? `char:${i - 1}` : "mark",
    });
  });
  elements.push(
    {
      id: "flood",
      lane: "Flood",
      label: "Flood",
      start: B.flood,
      length: B.floodLen,
    },
    {
      id: "balloon",
      lane: "Logo",
      label: "Balloon",
      start: B.balloon,
      length: 12,
      follows: "push",
    },
    {
      id: "card",
      lane: "Card",
      label: "Card",
      start: B.card,
      length: B.prompt - B.card,
    },
    {
      id: "drift",
      lane: "Logo",
      label: "Drift",
      start: B.balloon + 12,
      length: B.end - (B.balloon + 12),
      follows: "balloon",
    },
    {
      id: "prompt",
      lane: "Card",
      label: "Prompt",
      start: B.prompt,
      length: B.promptEnd - B.prompt,
      follows: "card",
      beats: { blink: 8 },
    },
    {
      id: "send",
      lane: "Card",
      label: "Send",
      start: B.send,
      length: B.end - B.send,
      follows: "prompt",
    },
  );
  return elements;
});
