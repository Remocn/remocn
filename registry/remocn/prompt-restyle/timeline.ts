import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The draft headline fading up, then each instruction typed into the prompt
// and applied to the headline. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type PromptRestyleElementId =
  | "enter"
  | `prompt:${number}`
  | `apply:${number}`;

export interface PromptRestyleTimingProps {
  headline?: string;
  highlight?: string;
  instructions?: string[];
  stepGap?: number;
}

export const DEFAULT_HEADLINE = "Launch videos from parts you own.";
export const DEFAULT_HIGHLIGHT = "you own";
/** Characters typed per frame. */
export const TYPE_RATE = 1.6;

const ENTER = 12;
const ENTER_PAUSE = 6;
const APPLY = 24;
const NEXT_GAP = 20;
const FIRST_AT = 16;
const GONE = 10;
const SHOW = 5;

export interface Token {
  text: string;
  hero: boolean;
}

/** The headline as words, with the highlight as one hero token. */
export function tokenize(headline: string, highlight: string): Token[] {
  const words = headline.split(/\s+/).filter(Boolean);
  const hw = highlight.split(/\s+/).filter(Boolean);
  if (hw.length > 0) {
    for (let i = 0; i + hw.length <= words.length; i++) {
      const slice = words.slice(i, i + hw.length);
      const ok = slice.every((w, k) =>
        k === hw.length - 1
          ? w.replace(/[.,!?;:]+$/, "") === hw[k]
          : w === hw[k],
      );
      if (!ok) continue;
      const last = slice[slice.length - 1];
      const tail = last.slice(hw[hw.length - 1].length);
      const out: Token[] = words
        .slice(0, i)
        .map((text) => ({ text, hero: false }));
      out.push({ text: hw.join(" "), hero: true });
      if (tail) out.push({ text: tail, hero: false });
      for (const text of words.slice(i + hw.length))
        out.push({ text, hero: false });
      return out;
    }
  }
  return words.map((text) => ({ text, hero: false }));
}

/** The instructions typed: two, or three when the highlight is found. */
export function instructionsOf(
  instructions: string[] | undefined,
  highlight: string,
  heroOn: boolean,
) {
  const d = ["make it bigger", "tighten it up", `set “${highlight}” in serif`];
  return (instructions ?? d).slice(0, heroOn ? 3 : 2);
}

// `prompt:<i>` is instruction `i` typed into the prompt, `TYPE_RATE`
// characters a frame, fading in over `show`, then a pause. `apply:<i>` is the
// headline taking that instruction, with the prompt leaving over `gone`. Each
// instruction's prompt follows the apply before it.
export const promptRestyleTimeline = defineTimeline<
  PromptRestyleElementId,
  PromptRestyleTimingProps
>(
  ({
    headline = DEFAULT_HEADLINE,
    highlight = DEFAULT_HIGHLIGHT,
    instructions,
    stepGap = NEXT_GAP,
  }) => {
    const heroOn = tokenize(headline, highlight).some((tk) => tk.hero);
    const list = instructionsOf(instructions, highlight, heroOn);
    const elements: TimelineElement<PromptRestyleElementId>[] = [
      {
        id: "enter",
        lane: "Headline",
        label: "enter",
        start: 0,
        length: ENTER,
      },
    ];
    let at = FIRST_AT;
    list.forEach((text, i) => {
      const enter = at + Math.ceil(text.length / TYPE_RATE) + ENTER_PAUSE;
      elements.push(
        {
          id: `prompt:${i}`,
          lane: "Prompt",
          label: text,
          start: at,
          length: enter - at,
          follows: i > 0 ? `apply:${i - 1}` : "enter",
          beats: { show: SHOW },
        },
        {
          id: `apply:${i}`,
          lane: "Headline",
          label: text,
          start: enter,
          length: APPLY,
          follows: `prompt:${i}`,
          beats: { gone: GONE },
        },
      );
      at = enter + stepGap;
    });
    return elements;
  },
);
