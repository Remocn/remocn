import { tinyPlanetExampleCode } from "@/components/docs/examples/tiny-planet-example";
import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tinyPlanetConfig: ComponentConfig = {
  componentName: "TinyPlanet",
  importPath: "@/components/remocn/tiny-planet",
  controls: {
    buildings: {
      type: "number",
      default: 26,
      min: 8,
      max: 48,
      step: 1,
      description: "Buildings",
      hiddenFromList: false,
    },
    spin: {
      type: "number",
      default: 0.7,
      min: 0,
      max: 3,
      step: 0.1,
      description: "Spin",
      hiddenFromList: false,
    },
    seed: {
      type: "number",
      default: 4,
      min: 1,
      max: 24,
      step: 1,
      description: "Seed",
      hiddenFromList: false,
    },
    skyColor: { type: "color", default: "#111111", description: "Sky" },
    sunColor: { type: "color", default: "#E5322D", description: "Sun" },
    buildingColor: {
      type: "color",
      default: "#FFFFFF",
      description: "Buildings",
    },
    groundColor: { type: "color", default: "#262626", description: "Ground" },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#111111" },
  snippet: tinyPlanetExampleCode,
};
