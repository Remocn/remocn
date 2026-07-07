import { describe, expect, it } from "bun:test";
import { TYPING_CPS, TYPING_START_FRAME, WHATS_NEW } from "../index";

describe("claude-code timing constants", () => {
  it("exposes a positive typing start frame", () => {
    expect(TYPING_START_FRAME).toBeGreaterThan(0);
  });

  it("exposes a positive typing speed", () => {
    expect(TYPING_CPS).toBeGreaterThan(0);
  });
});

describe("WHATS_NEW", () => {
  it("is non-empty", () => {
    expect(WHATS_NEW.length).toBeGreaterThan(0);
  });

  it("has a non-empty string for every entry", () => {
    for (const entry of WHATS_NEW) {
      expect(typeof entry).toBe("string");
      expect(entry.length).toBeGreaterThan(0);
    }
  });
});
