import { describe, expect, it } from "bun:test";
import {
  getIntroducingProductDuration,
  getIntroducingProductSceneStart,
  INTRODUCING_PRODUCT_DURATION,
  INTRODUCING_PRODUCT_TIMELINE,
  normalizeIntroducingProductProps,
} from "./types";

describe("Introducing Product timeline", () => {
  it("matches the 53.2 second reference at 30fps", () => {
    expect(INTRODUCING_PRODUCT_DURATION).toBe(1596);
  });

  it("keeps every scene boundary contiguous", () => {
    let expectedStart = 0;
    for (const [scene, duration] of Object.entries(
      INTRODUCING_PRODUCT_TIMELINE,
    )) {
      expect(
        getIntroducingProductSceneStart(
          scene as keyof typeof INTRODUCING_PRODUCT_TIMELINE,
        ),
      ).toBe(expectedStart);
      expectedStart += duration;
    }
    expect(expectedStart).toBe(INTRODUCING_PRODUCT_DURATION);
  });

  it("derives total duration from editable scene timings", () => {
    expect(
      getIntroducingProductDuration({
        ...INTRODUCING_PRODUCT_TIMELINE,
        hook: 150,
        outro: 240,
      }),
    ).toBe(1650);
  });
});

describe("normalizeIntroducingProductProps", () => {
  it("renders as-is with complete fallback content", () => {
    const props = normalizeIntroducingProductProps({});
    expect(props.content.productName).toBe("Northstar");
    expect(props.content.featureCards).toHaveLength(3);
    expect(props.content.topics.length).toBeGreaterThanOrEqual(5);
    expect(props.content.screenshotUrls).toEqual([]);
  });

  it("deeply merges Studio settings without dropping scene defaults", () => {
    const props = normalizeIntroducingProductProps({
      content: { productName: "Acme" },
      scenes: { command: { expandedWidth: 900 } },
      timeline: { hook: 150 },
    });
    expect(props.content.productName).toBe("Acme");
    expect(props.scenes.command.expandedWidth).toBe(900);
    expect(props.scenes.command.height).toBe(110);
    expect(props.timeline.hook).toBe(150);
    expect(props.timeline.outro).toBe(210);
  });

  it("keeps legacy flat content props working", () => {
    const props = normalizeIntroducingProductProps({
      productName: "Acme",
      accentColor: "#3366ff",
      speed: 1.5,
    });
    expect(props.content.productName).toBe("Acme");
    expect(props.theme.accentColor).toBe("#3366ff");
    expect(props.timeline.speed).toBe(1.5);
  });

  it("rejects unsafe Studio values", () => {
    expect(() =>
      normalizeIntroducingProductProps({ timeline: { hook: 0 } }),
    ).toThrow();
  });
});
