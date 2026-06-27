
import { describe, expect, it } from "bun:test";
import {
  chatFlowSchedule,
  chatFlowDuration,
  sendPulse,
  type ChatMessage,
} from "../index";

const MESSAGES: ChatMessage[] = [
  { from: "me", text: "hi" },
  { from: "them", text: "yo", reaction: "🔥" },
];

describe("chatFlowSchedule: items length", () => {
  it("returns 2 items for 2 messages", () => {
    const { items } = chatFlowSchedule(MESSAGES);
    expect(items.length).toBe(2);
  });
});

describe("chatFlowSchedule: item 0 (from='me', text='hi')", () => {
  const { items } = chatFlowSchedule(MESSAGES);
  const item0 = items[0];

  it("from is 'me'", () => {
    expect(item0.from).toBe("me");
  });

  it("typeStart is 12 (LEAD_IN)", () => {
    expect(item0.typeStart).toBe(12);
  });

  it("sendAt is 40 (typeStart + MIN_TYPE + SEND_GAP = 12 + 18 + 10)", () => {
    expect(item0.sendAt).toBe(40);
  });

  it("revealAt equals sendAt (40)", () => {
    expect(item0.revealAt).toBe(40);
    expect(item0.revealAt).toBe(item0.sendAt);
  });

  it("presenceStart equals sendAt - 2 (38)", () => {
    expect(item0.presenceStart).toBe(38);
    expect(item0.presenceStart).toBe((item0.sendAt ?? 0) - 2);
  });

  it("reactAt is undefined (no reaction)", () => {
    expect(item0.reactAt).toBeUndefined();
  });

  it("reaction is undefined", () => {
    expect(item0.reaction).toBeUndefined();
  });
});

describe("chatFlowSchedule: item 1 (from='them', text='yo', reaction='🔥')", () => {
  const { items } = chatFlowSchedule(MESSAGES);
  const item1 = items[1];

  it("from is 'them'", () => {
    expect(item1.from).toBe("them");
  });

  it("typingStart is 72 (after item 0 window)", () => {
    expect(item1.typingStart).toBe(72);
  });

  it("revealAt is 106 (typingStart + TYPING_MIN = 72 + 34)", () => {
    expect(item1.revealAt).toBe(106);
  });

  it("revealAt equals typingStart + typingDur (72 + 34)", () => {
    expect(item1.revealAt).toBe((item1.typingStart ?? 0) + 34);
  });

  it("reactAt is 128 (revealAt + REVEAL + REACT_DELAY = 106 + 14 + 8)", () => {
    expect(item1.reactAt).toBe(128);
  });

  it("reaction is '🔥'", () => {
    expect(item1.reaction).toBe("🔥");
  });

  it("presenceStart equals typingStart (72)", () => {
    expect(item1.presenceStart).toBe(72);
    expect(item1.presenceStart).toBe(item1.typingStart);
  });
});

describe("chatFlowSchedule: monotonic ordering", () => {
  const { items } = chatFlowSchedule(MESSAGES);

  it("item1.typingStart >= item0.revealAt", () => {
    expect(items[1].typingStart ?? 0).toBeGreaterThanOrEqual(items[0].revealAt);
  });

  it("item1.revealAt > item0.revealAt", () => {
    expect(items[1].revealAt).toBeGreaterThan(items[0].revealAt);
  });

  it("item1.reactAt > item1.revealAt", () => {
    expect(items[1].reactAt ?? 0).toBeGreaterThan(items[1].revealAt);
  });
});

describe("chatFlowSchedule: duration", () => {
  const { duration } = chatFlowSchedule(MESSAGES);

  it("duration is a positive integer", () => {
    expect(duration).toBeGreaterThan(0);
    expect(Number.isInteger(duration)).toBe(true);
  });

  it("duration (170) is greater than all revealAt values", () => {
    const { items } = chatFlowSchedule(MESSAGES);
    expect(duration).toBe(170);
    for (const item of items) {
      expect(duration).toBeGreaterThan(item.revealAt);
    }
  });

  it("duration is 170", () => {
    expect(duration).toBe(170);
  });
});

describe("chatFlowDuration", () => {
  it("chatFlowDuration(messages) with default speed=1 equals schedule duration (170)", () => {
    expect(chatFlowDuration(MESSAGES)).toBe(170);
  });

  it("chatFlowDuration(messages) equals chatFlowSchedule(messages).duration", () => {
    expect(chatFlowDuration(MESSAGES)).toBe(chatFlowSchedule(MESSAGES).duration);
  });

  it("chatFlowDuration(messages, 2) equals Math.ceil(schedule.duration / 2)", () => {
    const raw = chatFlowSchedule(MESSAGES).duration;
    expect(chatFlowDuration(MESSAGES, 2)).toBe(Math.ceil(raw / 2));
  });

  it("chatFlowDuration(messages, 2) is 85", () => {
    expect(chatFlowDuration(MESSAGES, 2)).toBe(85);
  });
});

describe("sendPulse: at sendAt of a 'me' item (eff === sendAt)", () => {
  const { items } = chatFlowSchedule(MESSAGES);

  it("sendPulse equals 1 when eff exactly equals sendAt (40)", () => {
    expect(sendPulse(items, 40)).toBeCloseTo(1, 10);
  });
});

describe("sendPulse: far from any sendAt", () => {
  const { items } = chatFlowSchedule(MESSAGES);

  it("sendPulse is 0 when eff is 100 frames away from the only sendAt", () => {
    expect(sendPulse(items, 140)).toBe(0);
  });

  it("sendPulse is 0 at eff=0 (before any sendAt and outside PRESS_WINDOW)", () => {
    expect(sendPulse(items, 0)).toBe(0);
  });
});

describe("sendPulse: partial pulse within PRESS_WINDOW", () => {
  const { items } = chatFlowSchedule(MESSAGES);

  it("sendPulse is > 0 when eff is within 7 frames of sendAt", () => {
    expect(sendPulse(items, 43)).toBeGreaterThan(0);
    expect(sendPulse(items, 43)).toBeLessThan(1);
  });

  it("sendPulse is 0 when eff is exactly PRESS_WINDOW+1 frames past sendAt", () => {
    expect(sendPulse(items, 48)).toBe(0);
  });
});

describe("chatFlowSchedule: empty messages", () => {
  it("returns empty items array", () => {
    expect(chatFlowSchedule([]).items).toEqual([]);
  });

  it("duration is positive (LEAD_IN + TAIL)", () => {
    expect(chatFlowSchedule([]).duration).toBeGreaterThan(0);
  });
});
