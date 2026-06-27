"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  MessageBubble,
  type MessageBubbleReactionStyle,
  type MessageBubbleVariant,
} from "@/registry/remocn-ui/message-bubble";
import { useMessageBubbleTransition } from "@/registry/remocn-ui/message-bubble/use-message-bubble-transition";

const REVEAL_AT = 16;
const REACT_AT = 44;

export const messageBubbleExampleControls = ["text", "variant", "reaction"] as const;

export interface MessageBubbleExampleProps {
  text?: string;
  variant?: MessageBubbleVariant;
  reaction?: string;
}

export const MessageBubbleExampleScene = (
  p: MessageBubbleExampleProps = {},
) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const variant = p.variant ?? "incoming";
  const text = p.text ?? "Yep, pushing it live now";
  const reaction = p.reaction === "" ? undefined : p.reaction ?? "🔥";

  const bubbleStyle = useMessageBubbleTransition([
    { at: REVEAL_AT, state: "visible", duration: 14 },
  ]);

  const reactionStyle: MessageBubbleReactionStyle | undefined =
    reaction !== undefined
      ? {
          opacity: interpolate(frame, [REACT_AT, REACT_AT + 5], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
          scale: spring({
            fps,
            frame: frame - REACT_AT,
            config: { damping: 11, stiffness: 220, mass: 0.6 },
          }),
        }
      : undefined;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 96,
      }}
    >
      <div style={{ width: 560 }}>
        <MessageBubble
          variant={variant}
          style={bubbleStyle}
          reaction={reaction}
          reactionStyle={reactionStyle}
        >
          {text}
        </MessageBubble>
      </div>
    </div>
  );
};

export const messageBubbleExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const text = (values.text as string | undefined) ?? "Yep, pushing it live now";
  const variant = (values.variant as string | undefined) ?? "incoming";
  const reaction = values.reaction as string | undefined;

  const props: string[] = [`    variant="${variant}"`, "    style={bubbleStyle}"];
  if (reaction !== undefined && reaction !== "")
    props.push(`    reaction="${reaction}"`);

  return `import { MessageBubble } from "@/components/remocn/message-bubble";
import { useMessageBubbleTransition } from "@/components/remocn/use-message-bubble-transition";

export const Scene = () => {
  const bubbleStyle = useMessageBubbleTransition([
    { at: 16, state: "visible", duration: 14 },
  ]);

  return (
    <MessageBubble
${props.join("\n")}
    >
      ${text}
    </MessageBubble>
  );
};`;
};
