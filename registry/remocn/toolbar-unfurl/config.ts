import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const toolbarUnfurlConfig: ComponentConfig = {
  componentName: "ToolbarUnfurl",
  importPath: "@/components/remocn/toolbar-unfurl",
  lists: {
    lines: {
      default: [
        "Leave a note.",
        "Sketch the shot.",
        "Type on the frame.",
        "Select any layer.",
      ],
      description: "Lines",
    },
  },
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
    finalLine: {
      type: "text-content",
      default: "Every tool, one tap away.",
      description: "Final line",
    },
    fontWeight: {
      type: "number",
      default: 300,
      min: 300,
      max: 700,
      step: 100,
      description: "Weight",
      hiddenFromList: false,
    },
    cursor: {
      type: "boolean",
      default: true,
      description: "Cursor",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Figtree" }),
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
