import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const videoCallConfig: ComponentConfig = {
  componentName: "VideoCall",
  importPath: "@/components/remocn/video-call",
  controls: {
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
    callTitle: {
      type: "text-content",
      default: "Launch sync",
      description: "Call title",
    },
    screenTitle: {
      type: "text-content",
      default: "Launch week",
      description: "Screen title",
    },
    leaveLabel: {
      type: "text-content",
      default: "Leave",
      description: "Leave label",
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
    accent: {
      type: "color",
      default: "#3B5BFD",
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
  durationInFrames: 300,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
