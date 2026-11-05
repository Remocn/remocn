import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bandShiftConfig: ComponentConfig = {
  componentName: "BandShift",
  importPath: "@/components/remocn/band-shift",
  controls: {
    theme: {
      type: "text-content",
      default: "dark",
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    from: {
      type: "text-content",
      default: "Before.",
      description: "From",
    },
    to: {
      type: "text-content",
      default: "remocn",
      description: "To",
    },
    bands: {
      type: "number",
      default: 6,
      min: 0,
      max: 18,
      step: 1,
      description: "Bands",
      hiddenFromList: false,
    },
    delay: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Delay",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 3,
      min: 0,
      max: 10,
      step: 1,
      description: "Stagger",
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
  durationInFrames: 90,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
