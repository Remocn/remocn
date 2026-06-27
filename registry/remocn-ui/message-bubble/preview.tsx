"use client";

import {
  MessageBubble,
  type MessageBubbleState,
  type MessageBubbleVariant,
} from "@/registry/remocn-ui/message-bubble";

export interface MessageBubblePreviewProps {
  text?: string;
  variant?: MessageBubbleVariant;
  reaction?: string;
  state?: MessageBubbleState;
}

export function MessageBubblePreview({
  text = "Yep, pushing it live now",
  variant = "incoming",
  reaction = "🔥",
  state = "visible",
}: MessageBubblePreviewProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
        background: "transparent",
      }}
    >
      <div style={{ width: 520 }}>
        <MessageBubble
          state={state}
          variant={variant}
          reaction={reaction === "" ? undefined : reaction}
        >
          {text}
        </MessageBubble>
      </div>
    </div>
  );
}
