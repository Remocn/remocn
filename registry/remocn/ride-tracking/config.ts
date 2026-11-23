import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const rideTrackingConfig: ComponentConfig = {
  componentName: "RideTracking",
  importPath: "@/components/remocn/ride-tracking",
  lists: {
    lines: {
      default: [
        "Book it in one tap.",
        "Watch it come to you.",
        "Your ride is here.",
      ],
      description: "Lines",
      min: 3,
      max: 3,
    },
  },
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
    pickup: {
      type: "text-content",
      default: "214 Linden St",
      description: "Pickup",
    },
    arrivedTitle: {
      type: "text-content",
      default: "Your driver has arrived",
      description: "Arrival title",
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
    drive: {
      type: "number",
      default: 162,
      min: 60,
      max: 240,
      step: 6,
      description: "Drive (frames)",
      hiddenFromList: false,
    },
    accent: {
      type: "color",
      default: "#276EF1",
      description: "Accent",
    },
    ground: groundControl(),
    ...sceneControls({ font: "Onest" }),
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
