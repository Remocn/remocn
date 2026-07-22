import { describe, expect, it } from "bun:test";

import { qf, qstep } from "@/lib/remocn/stop-motion";
import { handwriteDuration } from "../index";

const shownAt = (frame: number, { perStep = 1.6, step = 3, delay = 0 } = {}) =>
  Math.floor(
    Math.max(0, qstep(Math.max(0, qf(frame, step) - delay), step)) * perStep,
  );

describe("handwriteDuration", () => {
  it("computes exact frame math with the defaults", () => {
    expect(handwriteDuration("hello")).toBe(15);
    expect(handwriteDuration("hi")).toBe(9);
    expect(handwriteDuration("")).toBe(3);
  });

  it("ends one step after the last letter lands", () => {
    for (const text of ["hello", "a", "Made by hand"]) {
      for (const opts of [{}, { perStep: 1 }, { perStep: 3, step: 5 }]) {
        const step = opts.step ?? 3;
        const total = Array.from(text).length;
        const duration = handwriteDuration(text, opts);
        expect(shownAt(duration - step, opts)).toBeGreaterThanOrEqual(total);
        expect(shownAt(duration - step - 1, opts)).toBeLessThan(total);
      }
    }
  });

  it("shortens as perStep grows", () => {
    expect(handwriteDuration("hello", { perStep: 1 })).toBe(18);
    expect(handwriteDuration("hello", { perStep: 5 })).toBe(6);
    expect(handwriteDuration("hello", { perStep: 4 })).toBe(9);
  });

  it("scales with step", () => {
    expect(handwriteDuration("hello", { step: 6 })).toBe(30);
    expect(handwriteDuration("hello", { step: 1 })).toBe(5);
    expect(handwriteDuration("hello", { perStep: 1, step: 2 })).toBe(12);
  });

  it("counts unicode glyphs, not UTF-16 code units", () => {
    expect("👋".length).toBe(2);
    expect(handwriteDuration("👋", { perStep: 1 })).toBe(6);
    expect(handwriteDuration("👋👋", { perStep: 1 })).toBe(9);
    expect(handwriteDuration("héllo", { perStep: 1 })).toBe(18);
  });

  it("counts newlines and spaces as glyphs", () => {
    expect(handwriteDuration("a b", { perStep: 1 })).toBe(12);
    expect(handwriteDuration("a\nb", { perStep: 1 })).toBe(12);
  });

  it("is deterministic", () => {
    expect(handwriteDuration("Made by hand")).toBe(
      handwriteDuration("Made by hand"),
    );
  });
});
