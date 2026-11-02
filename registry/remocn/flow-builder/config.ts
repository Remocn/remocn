import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const flowBuilderConfig: ComponentConfig = {
  componentName: "FlowBuilder",
  importPath: "@/components/remocn/flow-builder",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
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
      default: "Welcome new signups",
      description: "Title",
    },
    workspace: {
      type: "text-content",
      default: "remocn",
      description: "Workspace",
    },
    toast: {
      type: "text-content",
      default: "Live · runs on every signup",
      description: "Toast",
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
  durationInFrames: 205,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
