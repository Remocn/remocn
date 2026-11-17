import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const lightBurnToLineConfig: ComponentConfig = {
  componentName: "LightBurnToLineDemo",
  importPath: "@/components/remocn/light-burn-to-line",
  lists: {
    headline: {
      default: ["Your next launch,", "already in motion."],
      description: "Headline",
      min: 2,
      max: 2,
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
    line: {
      type: "text-content",
      default: "Now ship your first film.",
      description: "Line",
    },
    cta: {
      type: "text-content",
      default: "Start free",
      description: "Cta",
    },
    url: {
      type: "text-content",
      default: "remocn.dev/new",
      description: "Url",
    },
    request: {
      type: "text-content",
      default: "Make the hero calmer and add the product shots.",
      description: "Request",
    },
    accent: { type: "color", default: undefined, description: "Accent" },
    ground: groundControl("Ground A"),
    groundB: groundControl("Ground B"),
    ...sceneControls({ font: "Geist" }),
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
  durationInFrames: 126,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
