import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const calendarPickConfig: ComponentConfig = {
  componentName: "CalendarPick",
  importPath: "@/components/remocn/calendar-pick",
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
      default: "#F26A2E",
      description: "Accent",
    },
    title: {
      type: "text-content",
      default: "Launch day, booked.",
      description: "Title",
    },
    month: {
      type: "text-content",
      default: "June",
      description: "Month",
    },
    year: {
      type: "text-content",
      default: "2026",
      description: "Year",
    },
    timeRange: {
      type: "text-content",
      default: "10:00 AM – 4:00 PM",
      description: "Time range",
    },
    eventLabel: {
      type: "text-content",
      default: "Launch",
      description: "Event label",
    },
    firstWeekday: {
      type: "number",
      default: 0,
      min: 0,
      max: 10,
      step: 1,
      description: "First weekday",
      hiddenFromList: false,
    },
    daysInMonth: {
      type: "number",
      default: 30,
      min: 0,
      max: 90,
      step: 1,
      description: "Days in month",
      hiddenFromList: false,
    },
    today: {
      type: "number",
      default: 9,
      min: 0,
      max: 27,
      step: 1,
      description: "Today",
      hiddenFromList: false,
    },
  },
  durationInFrames: 168,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
