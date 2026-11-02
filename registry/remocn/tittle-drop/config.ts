import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tittleDropConfig: ComponentConfig = {
  componentName: "TittleDrop",
  importPath: "@/components/remocn/tittle-drop",
  controls: {
    theme: {
      type: "enum",
      default: "light",
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
      default: "Ship it in minutes.",
      description: "Title",
    },
    subline: {
      type: "text-content",
      default: "Launch videos from ready-made Remotion components.",
      description: "Subline",
    },
    accentDot: {
      type: "number",
      default: -1,
      min: -10,
      max: 10,
      step: 1,
      description: "Accent dot",
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
  durationInFrames: 225,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
