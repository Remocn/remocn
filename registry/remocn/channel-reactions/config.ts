import {
  type ComponentConfig,
  FPS,
  groundControl,
  H,
  sceneControls,
  W,
} from "@/lib/customizer-config";

export const channelReactionsConfig: ComponentConfig = {
  componentName: "ChannelReactions",
  importPath: "@/components/remocn/channel-reactions",
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
    message: {
      type: "text-content",
      default:
        "remocn v2 is live. Thirty new components, a captions tab, and a studio that renders right in your browser. Take it for a spin:",
      description: "Message",
    },
    workspace: {
      type: "text-content",
      default: "remocn",
      description: "Workspace",
    },
    channel: {
      type: "text-content",
      default: "launch",
      description: "Channel",
    },
    headline: {
      type: "text-content",
      default: "Launch day, live",
      description: "Headline",
    },
    time: {
      type: "text-content",
      default: "10:30 AM",
      description: "Time",
    },
    lastReplyLabel: {
      type: "text-content",
      default: "Last reply just now",
      description: "Last reply note",
    },
    replyCount: {
      type: "number",
      default: 14,
      min: 0,
      max: 42,
      step: 1,
      description: "Reply count",
      hiddenFromList: false,
    },
    stagger: {
      type: "number",
      default: 6,
      min: 0,
      max: 20,
      step: 1,
      description: "Reaction stagger",
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
  durationInFrames: 220,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
