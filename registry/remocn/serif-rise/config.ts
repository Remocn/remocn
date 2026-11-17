import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const serifRiseConfig: ComponentConfig = {
  componentName: "SerifRise",
  importPath: "@/components/remocn/serif-rise",
  lists: {
    lines: {
      default: ["From rough cut", "to final cut."],
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
      default: "final cut.",
      description: "Highlight",
    },
    stagger: {
      type: "number",
      default: 1.5,
      min: 0,
      max: 6,
      step: 0.5,
      description: "Letter stagger",
      hiddenFromList: false,
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ...sceneControls({ font: "Bricolage Grotesque", grain: true }),
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
  durationInFrames: 130,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
