import { describe, expect, it } from "bun:test";

import { THEMES, TYPING_CPS, TYPING_START_FRAME } from "../index";

describe("typing constants", () => {
  it("starts typing on a positive frame offset", () => {
    expect(TYPING_START_FRAME).toBeGreaterThan(0);
  });

  it("types at a positive characters-per-second rate", () => {
    expect(TYPING_CPS).toBeGreaterThan(0);
  });
});

describe("THEMES", () => {
  it("exposes dark and light entries", () => {
    expect(THEMES.dark).toBeDefined();
    expect(THEMES.light).toBeDefined();
  });

  it("has non-empty string fields for every theme entry", () => {
    const fields = [
      "page",
      "boxBg",
      "fg",
      "fgMuted",
      "fgQuery",
      "logoOpen",
      "logoCode",
    ] as const;
    for (const theme of Object.values(THEMES)) {
      for (const field of fields) {
        expect(typeof theme[field]).toBe("string");
        expect(theme[field].length).toBeGreaterThan(0);
      }
    }
  });
});
