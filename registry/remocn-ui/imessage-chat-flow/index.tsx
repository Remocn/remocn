"use client";

import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { ArrowUp, ChevronLeft, Plus, Video } from "lucide-react";
import { type RemocnTheme, revealedText } from "@/lib/remocn-ui";
import { Caret } from "@/components/remocn/caret";
import { TypingIndicator } from "@/components/remocn/typing-indicator";

export interface ImessageMessage {
  from: "me" | "them";
  text: string;
  reaction?: string;
}

export interface ImessageContact {
  name: string;
  avatar?: string;
}

export interface ImessageChatFlowProps {
  messages?: ImessageMessage[];
  contact?: ImessageContact;
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

const IMESSAGE_BLUE = "#0a7cff";
const SYSTEM_BLUE = "#007aff";
const INCOMING_BG = "#e9e9eb";
const INCOMING_FG = "#000000";
const OUTGOING_FG = "#ffffff";
const META_GRAY = "#8e8e93";

const DEFAULT_MESSAGES: ImessageMessage[] = [
  { from: "me", text: "Hey — ready for the demo?" },
  { from: "them", text: "Yep, pushing it live now", reaction: "❤️" },
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

export interface ImessageChatFlowSchedule {
  items: ScheduledMessage[];
  duration: number;
}

export function imessageChatFlowSchedule(
  messages: ImessageMessage[],
): ImessageChatFlowSchedule {
  const items: ScheduledMessage[] = [];
  let cursor = LEAD_IN;

  messages.forEach((message, index) => {
    const hasReaction = message.reaction !== undefined && message.reaction !== "";
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
        revealAt + REVEAL + (hasReaction ? REACT_DELAY + REACT_DUR : 0) + MSG_GAP;
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
        revealAt + REVEAL + (hasReaction ? REACT_DELAY + REACT_DUR : 0) + MSG_GAP;
    }
  });

  const duration = Math.max(cursor - MSG_GAP + TAIL, LEAD_IN + TAIL);
  return { items, duration };
}

export function imessageChatFlowDuration(
  messages: ImessageMessage[] = DEFAULT_MESSAGES,
  speed = 1,
): number {
  const raw = imessageChatFlowSchedule(messages).duration;
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

function Avatar({ contact, size }: { contact: ImessageContact; size: number }) {
  const initial = contact.name.trim().charAt(0).toUpperCase();
  return (
    <div
      style={{
        flexShrink: 0,
        width: size,
        height: size,
        minWidth: size,
        borderRadius: "50%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(180deg, #b8c0c9 0%, #8e99a4 100%)",
        color: "#ffffff",
        fontSize: size * 0.42,
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

function BubbleTail({ side, color }: { side: "left" | "right"; color: string }) {
  const path =
    side === "right"
      ? "M0 0 C2 8 6 12 12 13 C7 14 1 13 0 8 Z"
      : "M13 0 C11 8 7 12 1 13 C6 14 12 13 13 8 Z";
  return (
    <svg
      width={13}
      height={14}
      viewBox="0 0 13 14"
      style={{
        position: "absolute",
        bottom: 0,
        left: side === "left" ? -5 : undefined,
        right: side === "right" ? -5 : undefined,
      }}
    >
      <path d={path} fill={color} />
    </svg>
  );
}

export function ImessageChatFlow({
  messages = DEFAULT_MESSAGES,
  contact,
  accentColor,
  speed = 1,
}: ImessageChatFlowProps) {
  const frame = useCurrentFrame();
  const eff = frame * speed;
  const accent = accentColor ?? IMESSAGE_BLUE;

  const { items } = imessageChatFlowSchedule(messages);

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
    const typeDur = Math.max(activeMe.sendAt - SEND_GAP - activeMe.typeStart, 1);
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

  let lastMeIndex = -1;
  items.forEach((item) => {
    if (item.from === "me") lastMeIndex = item.index;
  });
  const deliveredIndex =
    lastMeIndex === messages.length - 1 ? lastMeIndex : -1;

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
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 12px",
            background: "rgba(255,255,255,0.82)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
          }}
        >
          <ChevronLeft size={28} color={SYSTEM_BLUE} strokeWidth={2.25} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              flex: 1,
            }}
          >
            {contact !== undefined && <Avatar contact={contact} size={30} />}
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#000000",
              }}
            >
              {contact?.name ?? "Chat"}
            </span>
          </div>
          <Video size={24} color={SYSTEM_BLUE} strokeWidth={2} />
        </div>

        <div
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              gap: 18,
              minHeight: "100%",
              padding: "16px 14px 12px",
            }}
          >
            {present.map((item) => (
              <ImessageRow
                key={item.index}
                item={item}
                eff={eff}
                contact={contact}
                accent={accent}
                showDelivered={item.index === deliveredIndex}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "8px 12px 12px",
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#e9e9eb",
            }}
          >
            <Plus size={22} color="#3c3c43" strokeWidth={2} />
          </div>
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
              minHeight: 36,
              padding: "0 6px 0 14px",
              borderRadius: 18,
              border: "1px solid #d1d1d6",
              background: "#ffffff",
            }}
          >
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                fontSize: 16,
                color: sendActive ? "#000000" : "#9b9ba1",
              }}
            >
              <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {sendActive ? composerText : "iMessage"}
              </span>
              {typing && (
                <Caret
                  color={accent}
                  height={18}
                  radius={1}
                  blink
                  marginLeft={composerText.length > 0 ? 2 : 0}
                />
              )}
            </div>
            <div
              style={{
                flexShrink: 0,
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: sendActive ? accent : "#c6c6cc",
                transform: `scale(${sendScale})`,
              }}
            >
              <ArrowUp size={20} color="#ffffff" strokeWidth={2.75} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ImessageRow({
  item,
  eff,
  contact,
  accent,
  showDelivered,
}: {
  item: ScheduledMessage;
  eff: number;
  contact?: ImessageContact;
  accent: string;
  showDelivered: boolean;
}) {
  const { fps } = useVideoConfig();
  const outgoing = item.from === "me";
  const showTyping =
    item.from === "them" &&
    item.typingStart !== undefined &&
    eff < item.revealAt;

  const enter = spring({
    fps,
    frame: eff - (showTyping ? (item.typingStart ?? 0) : item.revealAt),
    config: { damping: 16, stiffness: 200, mass: 0.7 },
  });
  const opacity = interpolate(enter, [0, 1], [0, 1]);
  const translateY = interpolate(enter, [0, 1], [10, 0]);
  const scale = interpolate(enter, [0, 1], [0.92, 1]);

  let reactionScale = 0;
  let reactionOpacity = 0;
  if (item.reactAt !== undefined) {
    reactionScale = spring({
      fps,
      frame: eff - item.reactAt,
      config: { damping: 11, stiffness: 220, mass: 0.6 },
    });
    reactionOpacity = interpolate(eff, [item.reactAt, item.reactAt + 5], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }

  const bg = outgoing ? accent : INCOMING_BG;
  const fg = outgoing ? OUTGOING_FG : INCOMING_FG;
  const delivered =
    showDelivered && !showTyping && eff > item.revealAt + REVEAL;

  const bubble = (
    <div
      style={{
        position: "relative",
        maxWidth: "72%",
        padding: showTyping ? "11px 14px" : "7px 13px 8px",
        background: bg,
        color: fg,
        borderRadius: 19,
        borderBottomRightRadius: outgoing ? 7 : 19,
        borderBottomLeftRadius: outgoing ? 19 : 7,
        fontSize: 16,
        lineHeight: 1.32,
      }}
    >
      {showTyping ? (
        <TypingIndicator color={META_GRAY} />
      ) : (
        <span style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
          {item.text}
        </span>
      )}
      {!showTyping && <BubbleTail side={outgoing ? "right" : "left"} color={bg} />}
      {item.reaction !== undefined && (
        <div
          style={{
            position: "absolute",
            top: -16,
            left: outgoing ? -14 : undefined,
            right: outgoing ? undefined : -14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 30,
            height: 30,
            borderRadius: "50%",
            background: INCOMING_BG,
            fontSize: 15,
            boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
            opacity: reactionOpacity,
            transform: `scale(${reactionScale})`,
            transformOrigin: outgoing ? "bottom left" : "bottom right",
          }}
        >
          {item.reaction}
        </div>
      )}
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: outgoing ? "flex-end" : "flex-start",
        gap: 2,
        width: "100%",
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: outgoing ? "bottom right" : "bottom left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: outgoing ? "flex-end" : "flex-start",
          gap: 7,
          width: "100%",
        }}
      >
        {!outgoing && contact !== undefined && (
          <Avatar contact={contact} size={28} />
        )}
        {bubble}
      </div>
      {delivered && (
        <span
          style={{
            fontSize: 11,
            color: META_GRAY,
            paddingRight: 4,
          }}
        >
          Delivered
        </span>
      )}
    </div>
  );
}
