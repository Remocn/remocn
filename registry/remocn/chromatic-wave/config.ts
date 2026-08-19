import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const chromaticWaveConfig: ComponentConfig = {
  componentName: "ChromaticWave",
  importPath: "@/components/remocn/chromatic-wave",
  controls: {
    headline: {
      type: "text-content",
      default: "MUSIC",
      description: "Headline",
    },
    kicker: {
      type: "text-content",
      default: "APPLES",
      description: "Kicker",
    },
    fill: {
      type: "color",
      default: "#ffffff",
      description: "Fill",
    },
    waveHeight: {
      type: "number",
      min: 0,
      max: 40,
      step: 1,
      default: 28,
      description: "Wave height",
      hiddenFromList: false,
    },
    maxDisplacementPx: {
      type: "number",
      min: 0,
      max: 60,
      step: 1,
      default: 39,
      description: "Displacement (px)",
      hiddenFromList: false,
    },
    turbulentAmount: {
      type: "number",
      min: 0,
      max: 200,
      step: 2,
      default: 130,
      description: "Turbulence",
      hiddenFromList: false,
    },
  },
  durationInFrames: 100,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
