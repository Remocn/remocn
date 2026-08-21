import { describe, expect, it } from "bun:test";
import {
  STAGE_PRESETS,
  stageExampleCode,
} from "@/components/docs/examples/stage-example";
import { resolveStagePose } from "@/registry/remocn/stage";

const moves = STAGE_PRESETS["smooth-descent"];
const yAt = (frame: number) => resolveStagePose(frame, moves).y;

describe("smooth-descent Stage preset", () => {
  it("moves strictly downward for the full preview without holds", () => {
    for (let frame = 0; frame < 299; frame++) {
      expect(yAt(frame + 1)).toBeGreaterThan(yAt(frame));
    }
  });

  it("keeps velocity continuous around both ramp boundaries", () => {
    const beforeAccelerationEnd = yAt(30) - yAt(29);
    const afterAccelerationEnd = yAt(31) - yAt(30);
    const beforeDecelerationStart = yAt(269) - yAt(268);
    const afterDecelerationStart = yAt(270) - yAt(269);

    expect(beforeAccelerationEnd).toBeCloseTo(afterAccelerationEnd, 3);
    expect(beforeDecelerationStart).toBeCloseTo(afterDecelerationStart, 3);
  });

  it("prints editable easing expressions in the generated snippet", () => {
    const snippet = stageExampleCode({ preset: "smooth-descent" });
    expect(snippet).toContain("Easing.in(Easing.cubic)");
    expect(snippet).toContain("Easing.linear");
    expect(snippet).toContain("Easing.out(Easing.cubic)");
    expect(snippet).not.toContain("function");
  });
});
