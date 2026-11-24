import { defineTimeline, type TimelineElement } from "@/lib/remocn/timeline";

// The launch post in a team channel: the window rises, the message posts and
// its link unfurls, a cursor hovers it and reacts, the reaction chips pop in
// one after another and count up, the thread line opens and the replies
// arrive. Frames on the 30 fps scene timeline, after `delay` and `speed`.
// The ids are public: a saved `timing` prop refers to them.

export type ChannelReactionsElementId =
  | "camera"
  | "panel"
  | "message"
  | "unfurl"
  | "cursor"
  | "react"
  | "reactions"
  | `pop:${number}`
  | "thread"
  | `reply:${number}`;

export interface ChannelAuthor {
  name: string;
  color: string;
}

export interface ChannelReaction {
  emoji: string;
  count: number;
}

export interface ChannelReply {
  author: ChannelAuthor;
  text: string;
}

export interface ChannelReactionsTimingProps {
  reactions?: ChannelReaction[];
  replies?: ChannelReply[];
  /** Frames between reaction chips popping in. */
  stagger?: number;
}

export const PEOPLE = {
  maya: { name: "Maya Chen", color: "#B4577E" },
  leo: { name: "Leo Park", color: "#3E7F62" },
  priya: { name: "Priya Raman", color: "#B26B2C" },
  sam: { name: "Sam Ortiz", color: "#4A6FA8" },
};

export const DEFAULT_REACTIONS: ChannelReaction[] = [
  { emoji: "🚀", count: 48 },
  { emoji: "🔥", count: 36 },
  { emoji: "🎉", count: 27 },
  { emoji: "👏", count: 19 },
  { emoji: "🙌", count: 12 },
];

export const DEFAULT_REPLIES: ChannelReply[] = [
  {
    author: PEOPLE.leo,
    text: "Already rebuilding our onboarding video with it.",
  },
  { author: PEOPLE.priya, text: "The captions tab alone is worth it." },
];

// `panel` fades in over its length and rises on a spring; the typing
// indicator fades out on its beats. A row (`message`, `unfurl`,
// `reactions`, `thread`, a reply) opens over its length. The cursor comes in
// over `cursor`, the hover bar shows on its beats, `react` is the click, and
// the cursor leaves at `leave`. A chip pops at its start and counts up from
// `countAt` over `count`; the thread line's counter runs over its `count`.
export const channelReactionsTimeline = defineTimeline<
  ChannelReactionsElementId,
  ChannelReactionsTimingProps
>(
  ({
    reactions = DEFAULT_REACTIONS,
    replies = DEFAULT_REPLIES,
    stagger = 6,
  }): TimelineElement<ChannelReactionsElementId>[] => {
    const elements: TimelineElement<ChannelReactionsElementId>[] = [
      {
        id: "camera",
        lane: "Camera",
        label: "slow push",
        start: 0,
        length: 220,
      },
      {
        id: "panel",
        lane: "Panel",
        label: "channel panel",
        start: 0,
        length: 12,
        beats: { headAt: 4, headEnd: 20, typingOutAt: 12, typingOutEnd: 18 },
      },
      {
        id: "message",
        lane: "Channel",
        label: "launch message",
        start: 16,
        length: 16,
        follows: "panel",
        beats: { fade: 10 },
      },
      {
        id: "unfurl",
        lane: "Channel",
        label: "link unfurl",
        start: 30,
        length: 16,
        follows: "message",
        beats: { fadeAt: 2, fadeEnd: 14 },
      },
      {
        id: "cursor",
        lane: "Cursor",
        label: "cursor to message",
        start: 44,
        length: 32,
        follows: "unfurl",
        beats: {
          fadeIn: 8,
          hoverAt: 12,
          hoverEnd: 20,
          barAt: 14,
          emojiAt: 24,
          emojiEnd: 30,
        },
      },
      {
        id: "react",
        lane: "Cursor",
        label: "react",
        start: 76,
        length: 10,
        follows: "cursor",
        beats: {
          release: 5,
          barOutAt: 14,
          barOutEnd: 22,
          hoverOutAt: 16,
          hoverOutEnd: 24,
          fadeOutAt: 28,
          leave: 36,
        },
      },
      {
        id: "reactions",
        lane: "Channel",
        label: "reactions row",
        start: 78,
        length: 12,
        follows: "react",
      },
    ];
    reactions.forEach((r, i) => {
      elements.push({
        id: `pop:${i}`,
        lane: "Reactions",
        label: r.emoji,
        start: i === 0 ? 80 : 86 + i * stagger,
        length: 4 + 62 + i * 3,
        follows: i > 0 ? `pop:${i - 1}` : "reactions",
        beats: { countAt: 4, count: 62 + i * 3, addEnd: 14 },
      });
    });
    elements.push({
      id: "thread",
      lane: "Channel",
      label: "thread line",
      start: 104,
      length: 14,
      follows: "reactions",
      beats: { avatarStep: 6, count: 72 },
    });
    replies.forEach((r, i) => {
      elements.push({
        id: `reply:${i}`,
        lane: "Replies",
        label: r.author.name,
        start: 120 + i * 24,
        length: 14,
        follows: i > 0 ? `reply:${i - 1}` : "thread",
        beats: { fade: 10 },
      });
    });
    return elements.sort((a, b) => a.start - b.start);
  },
);
