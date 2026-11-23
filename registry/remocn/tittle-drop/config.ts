import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    stagger: {
      type: "number",
      default: 5,
      min: 0,
      max: 15,
      step: 1,
      description: "Word stagger",
      hiddenFromList: false,
    },
    hopGap: {
      type: "number",
      default: 12,
      min: 4,
      max: 30,
      step: 1,
      description: "Hop gap (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "DM Sans" }),
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
