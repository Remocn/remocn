import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tMinusConfig: ComponentConfig = {
  componentName: "TMinus",
  importPath: "@/components/remocn/t-minus",
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
      default: "Liftoff",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "remocn 2.0 is live",
      description: "Subtitle",
    },
    stage: {
      type: "text-content",
      default: "Stage 1",
      description: "Stage",
    },
    status: {
      type: "text-content",
      default: "Go",
      description: "Status",
    },
    from: {
      type: "number",
      default: 10,
      min: 0,
      max: 30,
      step: 1,
      description: "From",
      hiddenFromList: false,
    },
    beat: {
      type: "number",
      default: 8,
      min: 0,
      max: 24,
      step: 1,
      description: "Beat",
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
