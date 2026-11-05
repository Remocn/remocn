import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const tileSnakeLoaderConfig: ComponentConfig = {
  componentName: "TileSnakeLoader",
  importPath: "@/components/remocn/tile-snake-loader",
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
    name: {
      type: "text-content",
      default: "Lumen Studio",
      description: "Name",
    },
    label: {
      type: "text-content",
      default: "Initializing",
      description: "Label",
    },
    product: {
      type: "text-content",
      default: "Lumen Studio",
      description: "Product",
    },
    url: {
      type: "text-content",
      default: "lumen.studio",
      description: "Url",
    },
    headline: {
      type: "text-content",
      default: "Launch films,\ncut in minutes.",
      description: "Headline",
    },
    sub: {
      type: "text-content",
      default: "Drop your screens in. Ship the film by Friday.",
      description: "Sub",
    },
  },
  durationInFrames: 178,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
