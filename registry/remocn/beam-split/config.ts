import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const beamSplitConfig: ComponentConfig = {
  componentName: "BeamSplit",
  importPath: "@/components/remocn/beam-split",
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
    title: {
      type: "text-content",
      default: "Ship the story",
      description: "Title",
    },
    inner: {
      type: "text-content",
      default: "with motion you own",
      description: "Inner",
    },
    hold: {
      type: "number",
      default: 32,
      min: 0,
      max: 90,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    innerColor: {
      type: "color",
      default: "#f4f7ff",
      description: "Inner color",
    },
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
