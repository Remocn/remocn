import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

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
    ctaLabel: {
      type: "text-content",
      default: "Start a film",
      description: "Primary button",
    },
    secondaryLabel: {
      type: "text-content",
      default: "See examples",
      description: "Secondary button",
    },
    publishLabel: {
      type: "text-content",
      default: "Publish",
      description: "Publish button",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Instrument Sans" }),
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
  durationInFrames: 178,
  fps: FPS,
  // Does not hold 60 fps in the browser yet (`audit:playback`: pixels).
  previewFps: 30,
  compositionWidth: W,
  compositionHeight: H,
};
