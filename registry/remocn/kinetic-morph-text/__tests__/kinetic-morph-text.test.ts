import { describe, expect, it } from "bun:test";
import {
  getKineticMorphPose,
  getKineticMorphTextDuration,
  getKineticMorphTimeline,
  type KineticMorphGlyph,
  matchKineticMorphGlyphs,
  parseKineticMorphText,
} from "..";
import { kineticMorphTextConfig } from "../config";

const glyphs = (text: string): KineticMorphGlyph[] =>
  Array.from(text, (character, index) => ({ character, x: index * 50 - 100 }));
const options = { spread: 180, rotation: 110, morph: 0.75 };

describe("editable phrases", () => {
  it("preserves phrase boundaries and punctuation while ignoring empty entries", () => {
    expect(
      parseKineticMorphText(' Hello! |\n Make  "it" move \r\n | Go '),
    ).toEqual(["Hello!", 'Make "it" move', "Go"]);
    expect(parseKineticMorphText(" |\n\r ")).toEqual([]);
  });

  it("reserves all repeated matching letters before assigning replacements", () => {
    const source = glyphs("letter");
    const target = glyphs("better");
    const pairs = matchKineticMorphGlyphs(source, target);
    expect(pairs.map((pair) => pair.to)).toEqual(target);
    expect(new Set(pairs.map((pair) => pair.from)).size).toBe(source.length);
    expect(
      pairs.filter((pair) => pair.from?.character === pair.to?.character),
    ).toHaveLength(5);
    expect(pairs[0].from?.character).toBe("l");
  });

  it("reorders matching letters without duplicating or losing a source glyph", () => {
    const source = glyphs("loop");
    const pairs = matchKineticMorphGlyphs(source, glyphs("pool"));
    expect(
      pairs.every((pair) => pair.from?.character === pair.to?.character),
    ).toBe(true);
    expect(new Set(pairs.map((pair) => pair.from))).toEqual(new Set(source));
  });

  it("accounts for unequal lengths and completely empty input", () => {
    const growing = matchKineticMorphGlyphs(glyphs("A"), glyphs("MAGIC"));
    expect(growing.filter((pair) => !pair.from)).toHaveLength(4);
    const shrinking = matchKineticMorphGlyphs(glyphs("MAGIC"), glyphs("A"));
    expect(shrinking.filter((pair) => !pair.to)).toHaveLength(4);
    expect(matchKineticMorphGlyphs([], [])).toEqual([]);
  });
});

describe("timeline and preview duration", () => {
  it("keeps the last phrase after the sequence and allocates every phrase a hold", () => {
    expect(getKineticMorphTextDuration()).toBe(288);
    expect(getKineticMorphTimeline(0, 3)).toEqual({
      from: -1,
      to: 0,
      progress: 0,
    });
    expect(getKineticMorphTimeline(70, 3)).toEqual({
      from: 0,
      to: 1,
      progress: 0,
    });
    expect(getKineticMorphTimeline(123, 3)).toEqual({
      from: 0,
      to: 1,
      progress: 0.5,
    });
    expect(getKineticMorphTimeline(246, 3)).toEqual({
      from: 2,
      to: 2,
      progress: 1,
    });
    expect(getKineticMorphTimeline(10000, 3)).toEqual({
      from: 2,
      to: 2,
      progress: 1,
    });
  });

  it("loops continuously back to the initial readable phrase", () => {
    expect(getKineticMorphTimeline(0, 3, 54, 42, true)).toEqual({
      from: 0,
      to: 1,
      progress: 0,
    });
    expect(getKineticMorphTimeline(287, 3, 54, 42, true).to).toBe(0);
    expect(getKineticMorphTimeline(288, 3, 54, 42, true)).toEqual(
      getKineticMorphTimeline(0, 3, 54, 42, true),
    );
    expect(getKineticMorphTimeline(10000, 1, 54, 42, true)).toEqual({
      from: 0,
      to: 0,
      progress: 1,
    });
    expect(getKineticMorphTimeline(100, 0)).toEqual({
      from: -1,
      to: -1,
      progress: 1,
    });
  });

  it("extends the actual customizer preview for more phrases and slower playback", () => {
    const resolve = kineticMorphTextConfig.getDurationInFrames;
    expect(resolve?.({ text: "One | Two | Three | Four", speed: 0.5 })).toBe(
      768,
    );
    expect(
      resolve?.({
        text: "One",
        transitionFrames: 20,
        holdFrames: 10,
        speed: 2,
      }),
    ).toBe(15);
    expect(resolve?.({ text: "" })).toBe(1);
    expect(
      Number.isFinite(
        getKineticMorphTextDuration({
          transitionFrames: Number.NaN,
          holdFrames: -10,
          speed: 0,
        }),
      ),
    ).toBe(true);
  });

  it("generates valid JSX for edited quotes, newlines, and numeric font weight", () => {
    const code = kineticMorphTextConfig.snippet?.({
      text: 'Say "hello"\nLet\'s move',
      fontWeight: "600",
      loop: false,
    });
    expect(() =>
      new Bun.Transpiler({ loader: "tsx" }).transformSync(code ?? ""),
    ).not.toThrow();
    expect(code).toContain("fontWeight={600}");
    expect(code).toContain("loop={false}");
  });
});

describe("letter flight", () => {
  it("lands every source/target exactly at the measured positions", () => {
    for (const [index, pair] of matchKineticMorphGlyphs(
      glyphs("Hello"),
      glyphs("Goodbye!"),
    ).entries()) {
      const start = getKineticMorphPose(pair, index, 8, 0, options);
      const end = getKineticMorphPose(pair, index, 8, 1, options);
      if (pair.from) {
        expect(start.x).toBeCloseTo(pair.from.x);
        expect(start.y).toBeCloseTo(0);
        expect(start.opacity).toBe(1);
      } else expect(start.opacity).toBe(0);
      if (pair.to) {
        expect(end.x).toBeCloseTo(pair.to.x);
        expect(end.y).toBeCloseTo(0);
        expect(end.rotate).toBeCloseTo(0);
        expect(end.scaleX).toBeCloseTo(1);
        expect(end.scaleY).toBeCloseTo(1);
        expect(end.opacity).toBe(1);
      } else expect(end.opacity).toBe(0);
    }
  });

  it("preserves common glyphs and produces the same pose when seeking backward", () => {
    const pair = { from: glyphs("o")[0], to: { character: "o", x: 200 } };
    const middle = getKineticMorphPose(pair, 2, 8, 0.5, options);
    expect(middle.blend).toBe(0);
    expect(middle.melt).toBe(0);
    expect(Math.abs(middle.y)).toBeGreaterThan(1);
    getKineticMorphPose(pair, 2, 8, 1, options);
    expect(getKineticMorphPose(pair, 2, 8, 0.5, options)).toEqual(middle);
  });

  it("clears deformation and exposes independent motion controls", () => {
    const pair = { from: glyphs("a")[0], to: glyphs("b")[0] };
    const pose = getKineticMorphPose(pair, 0, 1, 0.55, {
      spread: 0,
      rotation: 0,
      morph: 0,
    });
    expect(pose.y).toBe(0);
    expect(pose.rotate).toBe(0);
    expect(pose.melt).toBe(0);
    expect(pose.blend).toBeGreaterThan(0);
    expect(pose.blend).toBeLessThan(1);
  });
});
