import { describe, expect, it } from "bun:test";
import {
  getProductDemoDuration,
  planTransitionTiming,
} from "../duration";
import type { ProductDemoConfig } from "../foundation";

const exampleConfig: ProductDemoConfig = {
  meta: { fps: 30, width: 1920, height: 1080 },
  theme: {
    accent: "#6366F1",
    background: "#0B0B0F",
    foreground: "#FAFAFA",
    muted: "rgba(250,250,250,0.55)",
  },
  scenes: [
    {
      type: "product-hero",
      durationInFrames: 150,
      content: { name: "Switchboard", pitch: "One inbox for every channel" },
    },
    {
      type: "feature-frame",
      durationInFrames: 180,
      content: { title: "Unified inbox", bullet: "Email, chat and SMS", side: "left" },
    },
    {
      type: "feature-frame",
      durationInFrames: 180,
      content: { title: "Auto routing", bullet: "The right person", side: "right" },
    },
    {
      type: "cta-scene",
      durationInFrames: 120,
      content: { line: "Try it free", domain: "switchboard.app" },
    },
  ],
};

describe("getProductDemoDuration", () => {
  it("sums scene frames minus transition overlaps for the example config", () => {
    expect(getProductDemoDuration(exampleConfig)).toBe(570);
  });

  it("returns a single scene's duration when there are no transitions", () => {
    expect(
      getProductDemoDuration({
        ...exampleConfig,
        scenes: [exampleConfig.scenes[0]],
      }),
    ).toBe(150);
  });

  it("scales with additional feature scenes", () => {
    const withExtraFeature: ProductDemoConfig = {
      ...exampleConfig,
      scenes: [
        exampleConfig.scenes[0],
        exampleConfig.scenes[1],
        exampleConfig.scenes[2],
        {
          type: "feature-frame",
          durationInFrames: 180,
          content: { title: "Third feature", bullet: "One more", side: "left" },
        },
        exampleConfig.scenes[3],
      ],
    };
    expect(getProductDemoDuration(withExtraFeature)).toBe(570 + 180 - 18);
  });
});

describe("planTransitionTiming", () => {
  it("uses shared-axis-z spring 22f from hero to first feature", () => {
    expect(
      planTransitionTiming(exampleConfig.scenes[0], exampleConfig.scenes[1]),
    ).toEqual({ kind: "spring", durationInFrames: 22 });
  });

  it("uses spatial-push linear 18f between feature frames", () => {
    expect(
      planTransitionTiming(exampleConfig.scenes[1], exampleConfig.scenes[2]),
    ).toEqual({ kind: "linear", durationInFrames: 18 });
  });

  it("uses zoom-through spring 20f from feature to cta", () => {
    expect(
      planTransitionTiming(exampleConfig.scenes[2], exampleConfig.scenes[3]),
    ).toEqual({ kind: "spring", durationInFrames: 20 });
  });
});
