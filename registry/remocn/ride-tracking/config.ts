import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const rideTrackingConfig: ComponentConfig = {
  componentName: "RideTracking",
  importPath: "@/components/remocn/ride-tracking",
  controls: {
    theme: {
      type: "enum",
      default: "light",
      variants: {
        light: {},
        dark: {},
      },
      description: "Theme",
    },
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    pickup: {
      type: "text-content",
      default: "214 Linden St",
      description: "Pickup",
    },
    eta: {
      type: "number",
      default: 4,
      min: 0,
      max: 12,
      step: 1,
      description: "Eta",
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
  durationInFrames: 270,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
