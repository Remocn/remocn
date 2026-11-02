import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const landingConfirmedConfig: ComponentConfig = {
  componentName: "LandingConfirmed",
  importPath: "@/components/remocn/landing-confirmed",
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
    confirm: {
      type: "text-content",
      default: "Touchdown confirmed",
      description: "Confirm",
    },
    title: {
      type: "text-content",
      default: "Shipped.",
      description: "Title",
    },
    subtitle: {
      type: "text-content",
      default: "Nailed the landing.",
      description: "Subtitle",
    },
    from: {
      type: "number",
      default: 1200,
      min: 0,
      max: 3600,
      step: 1,
      description: "From",
      hiddenFromList: false,
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
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
