import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

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
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
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
