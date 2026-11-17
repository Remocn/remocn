import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const ideaSetConfig: ComponentConfig = {
  componentName: "IdeaSet",
  importPath: "@/components/remocn/idea-set",
  lists: {
    lines: {
      default: ["Napkin sketch.", "Keynote opener."],
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
    highlight: {
      type: "text-content",
      default: "Keynote opener.",
      description: "Highlight",
    },
    hold: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Hold",
      hiddenFromList: false,
    },
    wave: {
      type: "number",
      default: 26,
      min: 10,
      max: 60,
      step: 1,
      description: "Wave (frames)",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "IBM Plex Sans" }),
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
