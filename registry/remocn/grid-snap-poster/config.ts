import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const gridSnapPosterConfig: ComponentConfig = {
  componentName: "GridSnapPoster",
  importPath: "@/components/remocn/grid-snap-poster",
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
      default: "Launch films,\nset in motion.",
      description: "Title",
    },
    number: {
      type: "text-content",
      default: "3.0",
      description: "Number",
    },
    body: {
      type: "text-content",
      default:
        "Production-ready motion for launch videos. Install a component, drop in your words, render.",
      description: "Body",
    },
    name: {
      type: "text-content",
      default: "remocn",
      description: "Name",
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
  durationInFrames: 150,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
