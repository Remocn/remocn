import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

export type ClaudeChatElementId = "card" | "typing" | "send";

export interface ClaudeChatTimingProps {
  prompt?: string;
}

export const CLAUDE_CHAT_PROMPT = "Draft a launch tweet for our new release";
export const TYPING_START_AT = 42;
export const TYPING_RATE = 22;
/** Frames the card fades over, starting 6 frames into its bounce. */
const CARD_FADE_AT = 6;
const CARD_FADE_END = 22;
/** Frames the voice button's spring takes to turn into the send button. */
const SEND_MORPH = 15;

/** Frames the typewriter takes to type `prompt` at `cps`, at 30fps. */
export function claudeTypingLength(prompt: string, cps = TYPING_RATE) {
  return (prompt.length / cps) * 30;
}

// The composer card bounces up, the prompt types in and, as typing starts,
// the voice button morphs into the send button.
export const claudeChatTimeline = defineTimeline<
  ClaudeChatElementId,
  ClaudeChatTimingProps
>(({ prompt = CLAUDE_CHAT_PROMPT }): TimelineElement<ClaudeChatElementId>[] => [
  {
    id: "card",
    lane: "Composer",
    label: "Card",
    start: 0,
    length: CARD_FADE_END,
    beats: { fade: CARD_FADE_AT },
  },
  {
    id: "typing",
    lane: "Prompt",
    label: prompt,
    start: TYPING_START_AT,
    length: claudeTypingLength(prompt),
    follows: "card",
  },
  {
    id: "send",
    lane: "Send",
    label: "Send button",
    start: TYPING_START_AT,
    length: SEND_MORPH,
    follows: "card",
  },
]);
