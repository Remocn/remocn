import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const calendarBookingConfig: ComponentConfig = {
  componentName: "CalendarBooking",
  importPath: "@/components/remocn/calendar-booking",
  lists: {
    slots: {
      default: [
        "9:00am",
        "9:30am",
        "10:00am",
        "10:30am",
        "11:00am",
        "1:30pm",
        "2:00pm",
        "3:30pm",
      ],
      description: "Slots",
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
    confirmLabel: {
      type: "text-content",
      default: "Confirm",
      description: "Confirm button",
    },
    sentLabel: {
      type: "text-content",
      default: "Invite sent to your inbox",
      description: "Sent note",
    },
    bookedLabel: {
      type: "text-content",
      default: "You’re booked with",
      description: "Booked headline",
    },
    pick: {
      type: "text-content",
      default: "10:30am",
      description: "Picked slot",
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
  durationInFrames: 165,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
