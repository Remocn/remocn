import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The line rising in word by word, the prompt card sliding in and pushing
// it aside, the command typed, the command chip popping, the prompt typed
// and the send button arming. Frames on the 30 fps scene timeline, after
// `delay` and `speed`. The ids are public: a saved `timing` prop refers to
// them.

export type CardPushLineElementId =
  | `word:${number}`
  | "card"
  | "command"
  | "chip"
  | "prompt"
  | "arm";

export interface CardPushLineTimingProps {
  line?: string;
  command?: string;
  prompt?: string;
  stagger?: number;
}

export const DEFAULT_LINE = "You can just write it";
export const DEFAULT_COMMAND = "/launch-video";
export const DEFAULT_PROMPT = "a teaser for the 2.0 release";

const WORD_STEP = 3;
/** The first word starts this many frames before the scene does. */
const WORD_LEAD = -4;
const WORD_ENTER = 12;
const CARD = 36;
const CMD = 60;
const CHIP = 72;
const PROMPT = 76;
const ARM = 108;
const ARM_LEN = 12;

/** Characters per frame the command is typed at. */
export function commandTypeRate(command: string) {
  return Math.max(1.2, command.length / 11);
}

/** Characters per frame the prompt is typed at. */
export function promptTypeRate(prompt: string) {
  return Math.max(1.2, prompt.length / 28);
}

// `word:<i>` is word `i` of the line, a chain. On `card`, the attachment
// pops at `attach`, the toolbar buttons from `tools` one `toolStagger`
// apart, and the caret shows from `caret`. `command` and `prompt` run as
// long as their typing; the placeholder fades out over the `placeholder`
// beat before the command. Command, chip, prompt and arm follow each other.
export const cardPushLineTimeline = defineTimeline<
  CardPushLineElementId,
  CardPushLineTimingProps
>(
  ({
    line = DEFAULT_LINE,
    command = DEFAULT_COMMAND,
    prompt = DEFAULT_PROMPT,
    stagger = WORD_STEP,
  }) => {
    const elements: TimelineElement<CardPushLineElementId>[] = [];
    line.split(" ").forEach((word, k) => {
      elements.push({
        id: `word:${k}`,
        lane: "Line",
        label: word,
        start: k * stagger + WORD_LEAD,
        length: WORD_ENTER,
        follows: k > 0 ? `word:${k - 1}` : undefined,
      });
    });
    elements.push(
      {
        id: "card",
        lane: "Card",
        label: "Card slides in",
        start: CARD,
        length: CMD - CARD,
        beats: { attach: 8, tools: 12, toolStagger: 2, caret: 18 },
      },
      {
        id: "command",
        lane: "Typing",
        label: command,
        start: CMD,
        length: command.length / commandTypeRate(command),
        follows: "card",
        beats: { placeholder: -4 },
      },
      {
        id: "chip",
        lane: "Typing",
        label: "Command chip",
        start: CHIP,
        length: PROMPT - CHIP,
        follows: "command",
      },
      {
        id: "prompt",
        lane: "Typing",
        label: prompt,
        start: PROMPT,
        length: prompt.length / promptTypeRate(prompt),
        follows: "chip",
      },
      {
        id: "arm",
        lane: "Card",
        label: "Send arms",
        start: ARM,
        length: ARM_LEN,
        follows: "prompt",
      },
    );
    return elements.sort((a, b) => a.start - b.start);
  },
);
