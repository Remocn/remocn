import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rulerScrubConfig: ComponentConfig = {
  componentName: "RulerScrub",
  importPath: "@/components/remocn/ruler-scrub",
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
    format: {
      type: "text-content",
      default: "{value}",
      description: "Format",
    },
    label: {
      type: "text-content",
      default: "The year launch videos became code",
      description: "Label",
    },
    from: {
      type: "number",
      default: 2012,
      min: 0,
      max: 6036,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    to: {
      type: "number",
      default: 2026,
      min: 0,
      max: 6078,
      step: 1,
      description: "To",
      hiddenFromList: false,
    },
    step: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Step",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
