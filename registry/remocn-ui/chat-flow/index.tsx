"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import {
  type RemocnTheme,
  mixOklch,
  revealedText,
  useRemocnTheme,
} from "@/lib/remocn-ui";
import { Caret } from "@/components/remocn/caret";
import {
  MessageBubble,
  type MessageBubbleReactionStyle,
  type MessageBubbleStyle,
} from "@/components/remocn/message-bubble";
import { useMessageBubbleTransition } from "@/components/remocn/use-message-bubble-transition";
import { TypingIndicator } from "@/components/remocn/typing-indicator";

export interface ChatMessage {
  from: "me" | "them";
  text: string;
  reaction?: string;
}

export interface ChatContact {
  name: string;
  avatar?: string;
}

export interface ChatFlowProps {
  messages?: ChatMessage[];
  contact?: ChatContact;
  accentColor?: string;
  speed?: number;
  theme?: Partial<RemocnTheme>;
}

const MOBILE_WIDTH = 460;
const LEAD_IN = 12;
const FRAMES_PER_CHAR = 2.2;
const MIN_TYPE = 18;
const MAX_TYPE = 86;
const SEND_GAP = 10;
const REVEAL = 14;
const REACT_DELAY = 8;
const REACT_DUR = 14;
const MSG_GAP = 18;
const TYPING_MIN = 34;
const TYPING_MAX = 70;
const TAIL = 28;
const PRESS_WINDOW = 7;

const DEFAULT_MESSAGES: ChatMessage[] = [
  { from: "me", text: "Hey — ready for the demo?" },
  { from: "them", text: "Yep, pushing it live now", reaction: "🔥" },
  { from: "me", text: "Perfect, sending the link over", reaction: "👍" },
];

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

export interface ScheduledMessage {
  index: number;
  from: "me" | "them";
  text: string;
  reaction?: string;
  presenceStart: number;
  typeStart?: number;
  sendAt?: number;
  typingStart?: number;
  revealAt: number;
  reactAt?: number;
}

export interface ChatFlowSchedule {
  items: ScheduledMessage[];
  duration: number;
}

export function chatFlowSchedule(messages: ChatMessage[]): ChatFlowSchedule {
  const items: ScheduledMessage[] = [];
  let cursor = LEAD_IN;

  messages.forEach((message, index) => {
    const hasReaction =
      message.reaction !== undefined && message.reaction !== "";
    if (message.from === "me") {
      const typeStart = cursor;
      const typeDur = clamp(
        Math.round(message.text.length * FRAMES_PER_CHAR),
        MIN_TYPE,
        MAX_TYPE,
      );
      const sendAt = typeStart + typeDur + SEND_GAP;
      const revealAt = sendAt;
      const reactAt = hasReaction ? revealAt + REVEAL + REACT_DELAY : undefined;
      items.push({
        index,
        from: "me",
        text: message.text,
        reaction: hasReaction ? message.reaction : undefined,
        presenceStart: sendAt - 2,
        typeStart,
        sendAt,
        revealAt,
        reactAt,
      });
      cursor =
        revealAt +
        REVEAL +
        (hasReaction ? REACT_DELAY + REACT_DUR : 0) +
        MSG_GAP;
    } else {
      const typingStart = cursor;
      const typingDur = clamp(
        Math.round(message.text.length * FRAMES_PER_CHAR),
        TYPING_MIN,
        TYPING_MAX,
      );
      const revealAt = typingStart + typingDur;
      const reactAt = hasReaction ? revealAt + REVEAL + REACT_DELAY : undefined;
      items.push({
        index,
        from: "them",
        text: message.text,
        reaction: hasReaction ? message.reaction : undefined,
        presenceStart: typingStart,
        typingStart,
        revealAt,
        reactAt,
      });
      cursor =
        revealAt +
        REVEAL +
        (hasReaction ? REACT_DELAY + REACT_DUR : 0) +
        MSG_GAP;
    }
  });

  const duration = Math.max(cursor - MSG_GAP + TAIL, LEAD_IN + TAIL);
  return { items, duration };
}

export function chatFlowDuration(
  messages: ChatMessage[] = DEFAULT_MESSAGES,
  speed = 1,
): number {
  const raw = chatFlowSchedule(messages).duration;
  return Math.ceil(raw / (speed <= 0 ? 1 : speed));
}

export function sendPulse(items: ScheduledMessage[], eff: number): number {
  let best = 0;
  for (const item of items) {
    if (item.sendAt === undefined) continue;
    const distance = Math.abs(eff - item.sendAt);
    if (distance <= PRESS_WINDOW) {
      best = Math.max(best, 1 - distance / PRESS_WINDOW);
    }
  }
  return best;
}

function typingBubbleStyle(
  eff: number,
  typingStart: number,
  revealAt: number,
): MessageBubbleStyle {
  const inOpacity = interpolate(eff, [typingStart, typingStart + 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const outOpacity = interpolate(eff, [revealAt - 6, revealAt], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(eff, [typingStart, typingStart + 8], [10, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return { opacity: inOpacity * outOpacity, translateY, scale: 1 };
}

function Avatar({
  contact,
  theme,
}: {
  contact: ChatContact;
  theme: RemocnTheme;
}) {
  const initial = contact.name.trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        flexShrink: 0,
        width: 32,
        height: 32,
        minWidth: 32,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: theme.muted,
        color: theme.mutedForeground,
        fontSize: 14,
        fontWeight: 600,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {contact.avatar !== undefined ? (
        <img
          src={contact.avatar}
          alt={contact.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initial
      )}
    </div>
  );
}

function SendIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 19V5M12 5l-6 6M12 5l6 6"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PlusIcon({ color }: { color: string }) {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <path
        d="M12 5v14M5 12h14"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ChatFlow({
  messages = DEFAULT_MESSAGES,
  contact,
  accentColor,
  speed = 1,
  theme: themeOverride,
}: ChatFlowProps) {
  const frame = useCurrentFrame();
  const eff = frame * speed;

  const themeProp = {
    ...themeOverride,
    ...(accentColor ? { primary: accentColor } : {}),
  };
  const resolved = useRemocnTheme(themeProp, "light");

  const { items } = chatFlowSchedule(messages);

  const activeMe = items.find(
    (item) =>
      item.from === "me" &&
      item.typeStart !== undefined &&
      item.sendAt !== undefined &&
      eff >= item.typeStart &&
      eff < item.sendAt,
  );
  let composerText = "";
  let typing = false;
  if (
    activeMe &&
    activeMe.typeStart !== undefined &&
    activeMe.sendAt !== undefined
  ) {
    const typeDur = Math.max(
      activeMe.sendAt - SEND_GAP - activeMe.typeStart,
      1,
    );
    const progress = clamp((eff - activeMe.typeStart) / typeDur, 0, 1);
    composerText = revealedText(
      activeMe.text,
      Math.floor(progress * activeMe.text.length),
    );
    typing = true;
  }

  const sendActive = composerText.length > 0;
  const sendScale = 1 - 0.16 * sendPulse(items, eff);
  const present = items.filter((item) => eff >= item.presenceStart);

  const composerBackground = mixOklch(
    resolved.background,
    resolved.muted,
    0.55,
  );

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        background: "transparent",
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: MOBILE_WIDTH,
          height: "100%",
          padding: "24px 16px 18px",
          boxSizing: "border-box",
        }}
      >
        {contact !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              paddingBottom: 16,
              marginBottom: 8,
              borderBottom: `1px solid ${resolved.border}`,
            }}
          >
            <Avatar contact={contact} theme={resolved} />
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  lineHeight: 1.25,
                  letterSpacing: "-0.01em",
                  color: resolved.foreground,
                }}
              >
                {contact.name}
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  lineHeight: 1.2,
                  color: "oklch(0.62 0.17 150)",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "oklch(0.62 0.17 150)",
                  }}
                />
                online
              </span>
            </div>
          </div>
        )}

        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0, #000 48px, #000 100%)",
            maskImage:
              "linear-gradient(to bottom, transparent 0, #000 48px, #000 100%)",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 20,
              minHeight: "100%",
              paddingTop: 24,
              paddingBottom: 22,
            }}
          >
            {present.map((item) => (
              <ChatRow
                key={item.index}
                item={item}
                eff={eff}
                speed={speed}
                contact={contact}
                themeProp={themeProp}
                theme={resolved}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginTop: 14,
            padding: 14,
            borderRadius: 24,
            background: composerBackground,
            border: `1px solid ${resolved.border}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              minHeight: 24,
              fontSize: 15,
              lineHeight: 1.45,
              letterSpacing: "-0.01em",
              color: sendActive
                ? resolved.foreground
                : resolved.mutedForeground,
            }}
          >
            <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
              {sendActive ? composerText : "Message"}
            </span>
            {typing && (
              <Caret
                color={resolved.foreground}
                height={18}
                radius={1}
                blink
                marginLeft={composerText.length > 0 ? 2 : 0}
              />
            )}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${resolved.border}`,
                background: "transparent",
              }}
            >
              <PlusIcon color={resolved.mutedForeground} />
            </div>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: sendActive
                  ? resolved.primary
                  : mixOklch(resolved.background, resolved.muted, 0.6),
                transform: `scale(${sendScale})`,
              }}
            >
              <SendIcon
                color={
                  sendActive
                    ? resolved.primaryForeground
                    : resolved.mutedForeground
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatRow({
  item,
  eff,
  speed,
  contact,
  themeProp,
  theme,
}: {
  item: ScheduledMessage;
  eff: number;
  speed: number;
  contact?: ChatContact;
  themeProp: Partial<RemocnTheme>;
  theme: RemocnTheme;
}) {
  const { fps } = useVideoConfig();
  const variant = item.from === "me" ? "outgoing" : "incoming";
  const showTyping =
    item.from === "them" &&
    item.typingStart !== undefined &&
    eff < item.revealAt;

  const bubbleStyle = useMessageBubbleTransition(
    [{ at: item.revealAt, state: "visible", duration: REVEAL }],
    { speed },
  );

  let reactionStyle: MessageBubbleReactionStyle | undefined;
  if (item.reactAt !== undefined) {
    const reactAt = item.reactAt;
    const pop = spring({
      fps,
      frame: eff - reactAt,
      config: { damping: 11, stiffness: 220, mass: 0.6 },
    });
    const opacity = interpolate(eff, [reactAt, reactAt + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    reactionStyle = { opacity, scale: pop };
  }

  const bubbleNode = showTyping ? (
    <MessageBubble
      variant="incoming"
      style={typingBubbleStyle(eff, item.typingStart ?? 0, item.revealAt)}
      theme={themeProp}
    >
      <TypingIndicator color={theme.mutedForeground} />
    </MessageBubble>
  ) : (
    <MessageBubble
      variant={variant}
      style={bubbleStyle}
      reaction={item.reaction}
      reactionStyle={reactionStyle}
      theme={themeProp}
    >
      {item.text}
    </MessageBubble>
  );

  if (item.from === "them" && contact !== undefined) {
    return (
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <Avatar contact={contact} theme={theme} />
        <div style={{ flex: 1, minWidth: 0 }}>{bubbleNode}</div>
      </div>
    );
  }

  return bubbleNode;
}
