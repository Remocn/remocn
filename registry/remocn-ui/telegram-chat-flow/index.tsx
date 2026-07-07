"use client";

import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Caret } from "@/components/remocn/caret";
import { type RemocnTheme, revealedText } from "@/lib/remocn-ui";

export interface TelegramMessage {
  from: "me" | "them";
  text: string;
  reaction?: string;
  time?: string;
}

export interface TelegramContact {
  name: string;
  avatar?: string;
}

export interface TelegramChatFlowProps {
  messages?: TelegramMessage[];
  contact?: TelegramContact;
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
const MSG_GAP = 16;
const TYPING_MIN = 34;
const TYPING_MAX = 70;
const TAIL = 28;
const PRESS_WINDOW = 7;

const TELEGRAM_BLUE = "#3390ec";
const INCOMING_BG = "#ffffff";
const INCOMING_FG = "#0f1419";
const INCOMING_META = "#8a99a5";
const OUTGOING_FG = "#ffffff";
const OUTGOING_META = "rgba(255,255,255,0.82)";

const DEFAULT_MESSAGES: TelegramMessage[] = [
  { from: "me", text: "Hey — ready for the demo?", time: "9:40" },
  {
    from: "them",
    text: "Yep, pushing it live now",
    reaction: "🔥",
    time: "9:41",
  },
  {
    from: "me",
    text: "Perfect, sending the link over",
    reaction: "👍",
    time: "9:41",
  },
];

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

export interface ScheduledMessage {
  index: number;
  from: "me" | "them";
  text: string;
  reaction?: string;
  time?: string;
  presenceStart: number;
  typeStart?: number;
  sendAt?: number;
  typingStart?: number;
  revealAt: number;
  reactAt?: number;
}

export interface TelegramChatFlowSchedule {
  items: ScheduledMessage[];
  duration: number;
}

export function telegramChatFlowSchedule(
  messages: TelegramMessage[],
): TelegramChatFlowSchedule {
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
        time: message.time,
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
        time: message.time,
        presenceStart: revealAt,
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

export function telegramChatFlowDuration(
  messages: TelegramMessage[] = DEFAULT_MESSAGES,
  speed = 1,
): number {
  const raw = telegramChatFlowSchedule(messages).duration;
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

function Avatar({ contact, size }: { contact: TelegramContact; size: number }) {
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
        background: `linear-gradient(180deg, #72d5fd 0%, ${TELEGRAM_BLUE} 100%)`,
        color: "#ffffff",
        fontSize: size * 0.42,
        fontWeight: 600,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {contact.avatar !== undefined ? (
        // biome-ignore lint/performance/noImgElement: Remotion output, not a Next.js app — next/image isn't available where this component ships
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

function DoubleCheck({ color }: { color: string }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 7 17l-5-5" />
      <path d="m22 10-7.5 7.5L13 16" />
    </svg>
  );
}

function PaperPlane({ color }: { color: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
      <path d="m21.854 2.147-10.94 10.939" />
    </svg>
  );
}

function MicIcon({ color }: { color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 19v3" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <rect x={9} y={2} width={6} height={13} rx={3} />
    </svg>
  );
}

function SmileIcon({ color }: { color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={10} />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1={9} x2={9.01} y1={9} y2={9} />
      <line x1={15} x2={15.01} y1={9} y2={9} />
    </svg>
  );
}

function AttachIcon({ color }: { color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m16 6-8.414 8.586a2 2 0 0 0 2.829 2.829l8.414-8.586a4 4 0 1 0-5.657-5.657l-8.379 8.551a6 6 0 1 0 8.485 8.485l8.379-8.551" />
    </svg>
  );
}

function PhoneIcon({ color }: { color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
    </svg>
  );
}

function MoreIcon({ color }: { color: string }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx={12} cy={12} r={1} />
      <circle cx={12} cy={5} r={1} />
      <circle cx={12} cy={19} r={1} />
    </svg>
  );
}

function BubbleTail({
  side,
  color,
}: {
  side: "left" | "right";
  color: string;
}) {
  const path =
    side === "right"
      ? "M0 0 H4 C4 7 7 12 13 13 C6 13 0 9 0 0 Z"
      : "M13 0 H9 C9 7 6 12 0 13 C7 13 13 9 13 0 Z";
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 13 13"
      style={{
        position: "absolute",
        bottom: 0,
        left: side === "left" ? -6 : undefined,
        right: side === "right" ? -6 : undefined,
      }}
    >
      <path d={path} fill={color} />
    </svg>
  );
}

export function TelegramChatFlow({
  messages = DEFAULT_MESSAGES,
  contact,
  accentColor,
  speed = 1,
}: TelegramChatFlowProps) {
  const frame = useCurrentFrame();
  const eff = frame * speed;
  const accent = accentColor ?? TELEGRAM_BLUE;

  const { items } = telegramChatFlowSchedule(messages);

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

  const themTyping = items.some(
    (item) =>
      item.from === "them" &&
      item.typingStart !== undefined &&
      eff >= item.typingStart &&
      eff < item.revealAt,
  );

  const sendActive = composerText.length > 0;
  const sendScale = 1 - 0.16 * sendPulse(items, eff);
  const present = items.filter((item) => eff >= item.presenceStart);

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
            gap: 12,
            padding: "12px 14px",
            background: "#ffffff",
            boxShadow: "0 1px 0 rgba(0,0,0,0.06)",
          }}
        >
          {contact !== undefined && <Avatar contact={contact} size={38} />}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              flex: 1,
            }}
          >
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                color: "#0f1419",
              }}
            >
              {contact?.name ?? "Chat"}
            </span>
            <span
              style={{
                fontSize: 13,
                lineHeight: 1.15,
                color: accent,
                fontStyle: themTyping ? "italic" : "normal",
              }}
            >
              {themTyping ? "typing…" : "online"}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <PhoneIcon color="#8a99a5" />
            <MoreIcon color="#8a99a5" />
          </div>
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
              gap: 4,
              minHeight: "100%",
              padding: "16px 12px 14px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: 8,
              }}
            >
              <span
                style={{
                  padding: "3px 11px",
                  borderRadius: 14,
                  background: "rgba(0,0,0,0.18)",
                  color: "#ffffff",
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                Today
              </span>
            </div>
            {present.map((item) => (
              <TelegramRow
                key={item.index}
                item={item}
                eff={eff}
                contact={contact}
                accent={accent}
              />
            ))}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 8,
            padding: "8px 10px 12px",
            background: "#ffffff",
            boxShadow: "0 -1px 0 rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              gap: 8,
              minHeight: 44,
              padding: "0 12px",
              borderRadius: 22,
              background: "#f1f3f5",
            }}
          >
            <SmileIcon color="#8a99a5" />
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                fontSize: 15,
                color: sendActive ? "#0f1419" : "#8a99a5",
              }}
            >
              <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                {sendActive ? composerText : "Message"}
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
            <AttachIcon color="#8a99a5" />
          </div>
          <div
            style={{
              flexShrink: 0,
              width: 46,
              height: 46,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: accent,
              transform: `scale(${sendScale})`,
            }}
          >
            {sendActive ? (
              <PaperPlane color="#ffffff" />
            ) : (
              <MicIcon color="#ffffff" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function TelegramRow({
  item,
  eff,
  contact,
  accent,
}: {
  item: ScheduledMessage;
  eff: number;
  contact?: TelegramContact;
  accent: string;
}) {
  const { fps } = useVideoConfig();
  const outgoing = item.from === "me";

  const enter = spring({
    fps,
    frame: eff - item.revealAt,
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
    reactionOpacity = interpolate(
      eff,
      [item.reactAt, item.reactAt + 5],
      [0, 1],
      {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      },
    );
  }

  const bg = outgoing ? accent : INCOMING_BG;
  const fg = outgoing ? OUTGOING_FG : INCOMING_FG;
  const metaColor = outgoing ? OUTGOING_META : INCOMING_META;
  const tailColor = outgoing ? accent : INCOMING_BG;

  const bubble = (
    <div
      style={{
        position: "relative",
        maxWidth: "76%",
        padding: "6px 11px 7px",
        background: bg,
        color: fg,
        borderRadius: 16,
        borderBottomRightRadius: outgoing ? 6 : 16,
        borderBottomLeftRadius: outgoing ? 16 : 6,
        boxShadow: outgoing ? "none" : "0 1px 1px rgba(0,0,0,0.1)",
        fontSize: 15,
        lineHeight: 1.35,
      }}
    >
      <span style={{ wordBreak: "break-word", overflowWrap: "break-word" }}>
        {item.text}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            item.reaction !== undefined ? "space-between" : "flex-end",
          gap: 8,
          marginTop: 2,
        }}
      >
        {item.reaction !== undefined && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              padding: "1px 7px",
              borderRadius: 11,
              background: outgoing
                ? "rgba(255,255,255,0.22)"
                : "rgba(51,144,236,0.12)",
              color: outgoing ? "#ffffff" : accent,
              fontSize: 13,
              fontWeight: 600,
              opacity: reactionOpacity,
              transform: `scale(${reactionScale})`,
              transformOrigin: "left center",
            }}
          >
            {item.reaction} 1
          </span>
        )}
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 3,
            fontSize: 12,
            color: metaColor,
            whiteSpace: "nowrap",
          }}
        >
          {item.time ?? "9:41"}
          {outgoing && <DoubleCheck color={metaColor} />}
        </span>
      </div>
      <BubbleTail side={outgoing ? "right" : "left"} color={tailColor} />
    </div>
  );

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        justifyContent: outgoing ? "flex-end" : "flex-start",
        gap: 7,
        width: "100%",
        opacity,
        transform: `translateY(${translateY}px) scale(${scale})`,
        transformOrigin: outgoing ? "bottom right" : "bottom left",
      }}
    >
      {!outgoing && contact !== undefined && (
        <Avatar contact={contact} size={30} />
      )}
      {bubble}
    </div>
  );
}
