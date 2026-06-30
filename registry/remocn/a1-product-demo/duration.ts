import type {
  ProductDemoConfig,
  ProductDemoScene,
  SceneTiming,
} from "./foundation";

export function planTransitionTiming(
  from: ProductDemoScene,
  to: ProductDemoScene,
): SceneTiming {
  if (from.type === "product-hero" && to.type === "feature-frame") {
    return { kind: "spring", durationInFrames: 22 };
  }
  if (from.type === "feature-frame" && to.type === "feature-frame") {
    return { kind: "linear", durationInFrames: 18 };
  }
  if (from.type === "feature-frame" && to.type === "cta-scene") {
    return { kind: "spring", durationInFrames: 20 };
  }
  return { kind: "spring", durationInFrames: 18 };
}

export function getProductDemoDuration(config: ProductDemoConfig): number {
  const total = config.scenes.reduce(
    (sum, scene) => sum + scene.durationInFrames,
    0,
  );
  let overlap = 0;
  for (let i = 0; i < config.scenes.length - 1; i++) {
    overlap += planTransitionTiming(
      config.scenes[i],
      config.scenes[i + 1],
    ).durationInFrames;
  }
  return total - overlap;
}
