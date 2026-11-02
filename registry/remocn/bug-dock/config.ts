import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const bugDockConfig: ComponentConfig = {
  componentName: "BugDock",
  importPath: "@/components/remocn/bug-dock",
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
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
    },
    headline: {
      type: "text-content",
      default: "Playing on every screen you ship.",
      description: "Headline",
    },
    highlight: {
      type: "text-content",
      default: "every screen",
      description: "Highlight",
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
