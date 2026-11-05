import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const borderBeamConfig: ComponentConfig = {
  componentName: "BorderBeam",
  importPath: "@/components/remocn/border-beam",
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
      default: "Version 2.0",
      description: "Title",
    },
    description: {
      type: "text-content",
      default: "Launch videos, written in React. Installed like shadcn.",
      description: "Description",
    },
    command: {
      type: "text-content",
      default: "npx shadcn add @remocn/launch-film",
      description: "Command",
    },
    showLogo: {
      type: "boolean",
      default: true,
      description: "Show logo",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
