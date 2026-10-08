import { describe, expect, it } from "bun:test";
import type { Caption } from "@remotion/captions";
import {
  buildCaptionPages,
  captionWordText,
  createKeywordMatcher,
  getCaptionsState,
  getExitWindowMs,
  groupCaptionWords,
  type SpeakerCaption,
} from "..";

const cap = (
  text: string,
  startMs: number,
  endMs: number,
  extra: Partial<Caption> = {},
): Caption => ({
  text,
  startMs,
  endMs,
  timestampMs: null,
  confidence: null,
  ...extra,
});

const SENTENCES = [
  cap(" So", 0, 200),
  cap(" here's", 200, 400),
  cap(" the", 400, 500),
  cap(" thing.", 500, 800),
  cap(" Most", 900, 1100),
  cap(" demo", 1100, 1300),
];

const paged = (captions: SpeakerCaption[], holdMs = 600) =>
  buildCaptionPages(captions, {
    combineTokensWithinMilliseconds: 1200,
    holdMs,
  });

describe("buildCaptionPages", () => {
  it("returns no pages for an empty transcript", () => {
    expect(paged([])).toEqual([]);
    expect(getCaptionsState([], 0)).toBeNull();
  });

  it("breaks a page at the end of a sentence", () => {
    const windows = paged(SENTENCES);
    expect(windows.map((w) => w.page.text)).toEqual([
      "So here's the thing.",
      "Most demo",
    ]);
  });

  it("respects an explicit pageBreakAfter of false", () => {
    const captions = SENTENCES.map((c) =>
      c.text === " thing." ? { ...c, pageBreakAfter: false } : c,
    );
    expect(paged(captions)).toHaveLength(1);
  });

  it("cuts straight to the next page when it starts within the hold", () => {
    const [first, second] = paged(SENTENCES);
    expect(first.speechEndMs).toBe(800);
    expect(first.endMs).toBe(900);
    expect(first.endsInSilence).toBe(false);
    expect(second.endMs).toBe(1900);
    expect(second.endsInSilence).toBe(true);
  });

  it("breaks on a silence longer than the hold and leaves after holding", () => {
    const windows = paged([cap(" One", 0, 300), cap(" two", 1000, 1300)]);
    expect(windows).toHaveLength(2);
    expect(windows[0].endMs).toBe(900);
    expect(windows[0].endsInSilence).toBe(true);
    expect(getCaptionsState(windows, 950)).toBeNull();
    expect(getCaptionsState(windows, 1000)?.pageIndex).toBe(1);
  });

  it("treats a silence exactly as long as the hold as a cut", () => {
    const windows = paged([cap(" a", 0, 400), cap(" b", 1000, 1200)]);
    expect(windows).toHaveLength(2);
    expect(windows[0].endMs).toBe(1000);
    expect(windows[0].endsInSilence).toBe(false);
  });

  it("keeps tiny gaps on one page even with no hold", () => {
    const windows = paged([cap(" a", 0, 100), cap(" b", 150, 250)], 0);
    expect(windows).toHaveLength(1);
    expect(windows[0].endMs).toBe(250);
    expect(getCaptionsState(windows, 249)).not.toBeNull();
    expect(getCaptionsState(windows, 250)).toBeNull();
  });
});

describe("getCaptionsState", () => {
  const windows = paged(SENTENCES);

  it("shows nothing before the first word", () => {
    expect(getCaptionsState(paged([cap(" late", 500, 800)]), 499)).toBeNull();
  });

  it("tracks the word being spoken and how far into it the voice is", () => {
    const state = getCaptionsState(windows, 300);
    expect(state?.activeIndex).toBe(1);
    expect(state?.tokens.map((t) => t.status)).toEqual([
      "spoken",
      "active",
      "upcoming",
      "upcoming",
    ]);
    expect(state?.tokens[1].progress).toBeCloseTo(0.5, 10);
    expect(state?.tokens[0].progress).toBe(1);
    expect(state?.tokens[2].progress).toBe(0);
  });

  it("keeps the last word active through a gap before the next page", () => {
    const state = getCaptionsState(windows, 850);
    expect(state?.pageIndex).toBe(0);
    expect(state?.activeIndex).toBe(3);
    expect(state?.tokens[3].progress).toBe(1);
  });

  it("reports time since the page started and until it ends", () => {
    const state = getCaptionsState(windows, 1000);
    expect(state?.pageIndex).toBe(1);
    expect(state?.sinceStartMs).toBe(100);
    expect(state?.untilEndMs).toBe(900);
    expect(state?.endsInSilence).toBe(true);
  });

  it("hands the previous page over only on a cut, not after a silence", () => {
    const state = getCaptionsState(windows, 1000);
    expect(state?.previous?.pageIndex).toBe(0);
    expect(state?.previous?.tokens.every((t) => t.status !== "upcoming")).toBe(
      true,
    );
    const silent = paged([cap(" One", 0, 300), cap(" two", 1000, 1300)]);
    expect(getCaptionsState(silent, 1000)?.previous).toBeNull();
    expect(getCaptionsState(windows, 300)?.previous).toBeNull();
  });

  it("fills a zero-length word as soon as it is reached", () => {
    const state = getCaptionsState(paged([cap(" x", 100, 100)]), 100);
    expect(state?.tokens[0].progress).toBe(1);
  });
});

describe("groupCaptionWords", () => {
  it("keeps sub-word tokens together and splits on spaces", () => {
    const state = getCaptionsState(
      paged([
        cap(" Remot", 0, 200),
        cap("ion", 200, 300),
        cap(" rocks", 300, 600),
      ]),
      250,
    );
    expect(state?.tokens.map((t) => t.spaceBefore)).toEqual([
      false,
      false,
      true,
    ]);
    const words = groupCaptionWords(state?.tokens ?? []);
    expect(words.map((w) => w.map(({ index }) => index))).toEqual([
      [0, 1],
      [2],
    ]);
  });
});

describe("speakers", () => {
  it("breaks the page when the speaker changes and reports who speaks", () => {
    const windows = paged([
      { ...cap(" Ready", 0, 300), speaker: "host" },
      { ...cap(" when", 300, 500), speaker: "host" },
      { ...cap(" Always", 500, 800), speaker: "guest" },
    ]);
    expect(windows.map((w) => w.page.text)).toEqual(["Ready when", "Always"]);
    expect(windows.map((w) => w.speaker)).toEqual(["host", "guest"]);
    expect(getCaptionsState(windows, 600)?.speaker).toBe("guest");
  });

  it("leaves the speaker undefined for plain captions", () => {
    expect(paged(SENTENCES)[0].speaker).toBeUndefined();
  });
});

describe("keywords", () => {
  it("matches ignoring case and punctuation", () => {
    const isKeyword = createKeywordMatcher(["Sound", "three"]);
    expect(isKeyword("sound.")).toBe(true);
    expect(isKeyword("THREE,")).toBe(true);
    expect(isKeyword("seconds")).toBe(false);
    expect(createKeywordMatcher(["here's"])("Here\u2019s")).toBe(true);
    expect(createKeywordMatcher()("anything")).toBe(false);
  });

  it("joins sub-word tokens into one word", () => {
    const state = getCaptionsState(
      paged([cap(" Remot", 0, 200), cap("ion", 200, 300)]),
      250,
    );
    const [word] = groupCaptionWords(state?.tokens ?? []);
    expect(captionWordText(word)).toBe("Remotion");
  });
});

describe("getExitWindowMs", () => {
  it("never lets the exit fade start before the last word ends", () => {
    const short = getCaptionsState(paged([cap(" a", 0, 400)], 100), 450);
    expect(short?.holdRoomMs).toBe(100);
    expect(short && getExitWindowMs(short, 220)).toBe(100);
    const none = getCaptionsState(paged([cap(" a", 0, 400)], 0), 399);
    expect(none && getExitWindowMs(none, 220)).toBe(1);
    const roomy = getCaptionsState(paged([cap(" a", 0, 400)]), 450);
    expect(roomy && getExitWindowMs(roomy, 220)).toBe(220);
  });
});
