import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const waveformTitleConfig: ComponentConfig = {
  componentName: "WaveformTitle",
  importPath: "@/components/remocn/waveform-title",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
      variants: {
        dark: {},
        light: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Your voice, captioned",
      description: "Title",
    },
    accentWords: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Accent words",
      hiddenFromList: false,
    },
    speed: {
      type: "number",
      default: 1,
      min: 0.25,
      max: 4,
      step: 0.25,
      description: "Speed",
      hiddenFromList: false,
    },
  },
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
