import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const calendarBookingConfig: ComponentConfig = {
  componentName: "CalendarBooking",
  importPath: "@/components/remocn/calendar-booking",
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
    day: {
      type: "number",
      default: 18,
      min: 0,
      max: 54,
      step: 1,
      description: "Day",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
