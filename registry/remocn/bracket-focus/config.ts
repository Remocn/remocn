import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bracketFocusConfig: ComponentConfig = {
  componentName: "BracketFocus",
  importPath: "@/components/remocn/bracket-focus",
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
    subject: {
      type: "text-content",
      default: "1.8s",
      description: "Subject",
    },
    tag: {
      type: "text-content",
      default: "Render time",
      description: "Tag",
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
  durationInFrames: 120,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
