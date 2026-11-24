import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type ChatGptElementId =
  | "intro"
  | "heading"
  | "pill"
  | "chips"
  | "typing"
  | "send";

export interface ChatGptTimingProps {
  prompt?: string;
}

export const CHAT_GPT_PROMPT = "Make a sunset over a calm ocean";
export const TYPING_START_AT = 42;
export const TYPING_RATE = 22;
/** Frames the shared bounce of the heading and the pill takes to settle. */
const BOUNCE = 20;
/** Frames each of the heading, the pill and the chips fades up over. */
const FADE = 16;
/** Frames the voice button's spring takes to turn into the send button. */
const SEND_MORPH = 15;

/** Frames the typewriter takes to type `prompt` at `cps`, at 30fps. */
export function chatGptTypingLength(prompt: string, cps = TYPING_RATE) {
  return (prompt.length / cps) * 30;
}

// The heading and the composer pill bounce up together while the heading,
// the pill and the suggestion chips fade up one after another. The prompt
// then types in and, as typing starts, the voice button morphs into the
// send button and the chips sink away.
export const chatGptTimeline = defineTimeline<
  ChatGptElementId,
  ChatGptTimingProps
>(({ prompt = CHAT_GPT_PROMPT }): TimelineElement<ChatGptElementId>[] => [
  { id: "intro", lane: "Bounce", label: "Bounce", start: 0, length: BOUNCE },
  { id: "heading", lane: "Fade", label: "Heading", start: 4, length: FADE },
  {
    id: "pill",
    lane: "Fade",
    label: "Prompt pill",
    start: 10,
    length: FADE,
    follows: "heading",
  },
  {
    id: "chips",
    lane: "Fade",
    label: "Chips",
    start: 16,
    length: FADE,
    follows: "pill",
  },
  {
    id: "typing",
    lane: "Prompt",
    label: prompt,
    start: TYPING_START_AT,
    length: chatGptTypingLength(prompt),
    follows: "chips",
  },
  {
    id: "send",
    lane: "Send",
    label: "Send button",
    start: TYPING_START_AT,
    length: SEND_MORPH,
    follows: "chips",
  },
]);
