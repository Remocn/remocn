import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const videoCallConfig: ComponentConfig = {
  componentName: "VideoCall",
  importPath: "@/components/remocn/video-call",
  controls: {
    accent: {
      type: "color",
      default: "#3B5BFD",
      description: "Accent",
    },
    meetingCode: {
      type: "text-content",
      default: "kqv-mnrt-zpa",
      description: "Meeting code",
    },
    time: {
      type: "text-content",
      default: "10:42 AM",
      description: "Time",
    },
    present: {
      type: "boolean",
      default: true,
      description: "Present",
    },
    presenter: {
      type: "number",
      default: 1,
      min: 0,
      max: 10,
      step: 1,
      description: "Presenter",
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
