import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const posterCropConfig: ComponentConfig = {
  componentName: "PosterCrop",
  importPath: "@/components/remocn/poster-crop",
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
      default: "Launch films,\nas code.",
      description: "Title",
    },
    kicker: {
      type: "text-content",
      default: "remocn 3.0",
      description: "Kicker",
    },
    meta: {
      type: "text-content",
      default: "Oct 24, 2026",
      description: "Meta",
    },
    note: {
      type: "text-content",
      default:
        "Production-ready motion for launch videos. Install a component, drop in your words, render.",
      description: "Note",
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
  durationInFrames: 140,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
