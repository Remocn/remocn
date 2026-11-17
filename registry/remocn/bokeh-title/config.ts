import {
  type ComponentConfig,
  FPS,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const bokehTitleConfig: ComponentConfig = {
  componentName: "BokehTitle",
  importPath: "@/components/remocn/bokeh-title",
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
      default: "Launch films, made in code",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "remocn · Spring release",
      description: "Subtitle",
    },
    pattern: {
      type: "enum",
      default: "mark",
      variants: {
        mark: {},
        grid: {},
      },
      description: "Pattern",
    },
    shape: {
      type: "enum",
      default: "circle",
      variants: {
        circle: {},
        hexagon: {},
      },
      description: "Shape",
    },
    hold: {
      type: "number",
      default: 24,
      min: 0,
      max: 60,
      step: 1,
      description: "Hold (frames)",
      hiddenFromList: false,
    },
    ambient: {
      type: "number",
      default: 24,
      min: 0,
      max: 60,
      step: 1,
      description: "Ambient lights",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ...sceneControls({ font: "Instrument Serif", grain: true }),
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
  durationInFrames: 190,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
