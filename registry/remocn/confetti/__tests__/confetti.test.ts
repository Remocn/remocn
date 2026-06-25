/**
 * Unit tests for pure helpers in registry/remocn/confetti/index.tsx.
 *
 * Run with:
 *   bun add -d vitest
 *   bunx vitest run registry/remocn/confetti/__tests__/confetti.test.ts
 *
 * No React DOM or Remotion player needed — only pure JS logic is exercised.
 */

import { describe, expect, it } from "vitest";

import { makeParticles, mulberry32, particleOpacity } from "../index";

describe("mulberry32", () => {
  it("is deterministic for a given seed", () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = [a(), a(), a()];
    const seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
  });

  it("yields values in [0, 1)", () => {
    const r = mulberry32(7);
    for (let i = 0; i < 50; i++) {
      const v = r();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it("differs across seeds", () => {
    expect(mulberry32(1)()).not.toEqual(mulberry32(2)());
  });
});

describe("makeParticles", () => {
  const colors = ["#111", "#222", "#333"];

  it("produces exactly `count` particles", () => {
    expect(makeParticles({ count: 0, seed: 1, colors })).toHaveLength(0);
    expect(makeParticles({ count: 25, seed: 1, colors })).toHaveLength(25);
  });

  it("is deterministic for a seed and only uses palette colors", () => {
    const a = makeParticles({ count: 30, seed: 9, colors });
    const b = makeParticles({ count: 30, seed: 9, colors });
    expect(a).toEqual(b);
    for (const p of a) {
      expect(colors).toContain(p.color);
      expect(p.angle).toBeGreaterThanOrEqual(0);
      expect(p.angle).toBeLessThanOrEqual(Math.PI * 2);
      expect(p.size).toBeGreaterThan(0);
    }
  });

  it("changes with the seed", () => {
    const a = makeParticles({ count: 10, seed: 1, colors });
    const b = makeParticles({ count: 10, seed: 2, colors });
    expect(a).not.toEqual(b);
  });

  it("falls back to default colors when none supplied", () => {
    const p = makeParticles({ count: 5, seed: 1, colors: [] });
    expect(p).toHaveLength(5);
    for (const piece of p) {
      expect(typeof piece.color).toBe("string");
      expect(piece.color.length).toBeGreaterThan(0);
    }
  });
});

describe("particleOpacity", () => {
  it("is 0 outside the lifetime window", () => {
    expect(particleOpacity(-1, 90)).toBe(0);
    expect(particleOpacity(91, 90)).toBe(0);
  });

  it("fades in quickly and out toward the end", () => {
    expect(particleOpacity(0, 90)).toBe(0);
    expect(particleOpacity(4, 90)).toBeCloseTo(1, 6);
    expect(particleOpacity(45, 90)).toBeCloseTo(1, 6);
    expect(particleOpacity(90, 90)).toBeCloseTo(0, 6);
    expect(particleOpacity(81, 90)).toBeLessThan(1);
  });
});
