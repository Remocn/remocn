"use client";

import { easings, type Step, useStateTransition } from "@/lib/remocn-ui";
import {
  messageBubbleStyle,
  type MessageBubbleState,
  type MessageBubbleStyle,
} from "@/components/remocn/message-bubble";

export const DEFAULT_DURATION = 14;

export function tweenMessageBubbleStyle(
  a: MessageBubbleStyle,
  b: MessageBubbleStyle,
  t: number,
): MessageBubbleStyle {
  return {
    opacity: a.opacity + (b.opacity - a.opacity) * t,
    translateY: a.translateY + (b.translateY - a.translateY) * t,
    scale: a.scale + (b.scale - a.scale) * t,
  };
}

export interface MessageBubbleTransitionOptions {
  speed?: number;
  defaultDuration?: number;
}

export function useMessageBubbleTransition(
  steps: Step<MessageBubbleState>[],
  opts: MessageBubbleTransitionOptions = {},
): MessageBubbleStyle {
  const { speed = 1, defaultDuration = DEFAULT_DURATION } = opts;
  const { from, to, progress } = useStateTransition(
    steps,
    "hidden",
    speed,
    defaultDuration,
  );
  const t = easings.out(progress);
  return tweenMessageBubbleStyle(messageBubbleStyle(from), messageBubbleStyle(to), t);
}
