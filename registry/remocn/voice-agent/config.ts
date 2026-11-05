import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const voiceAgentConfig: ComponentConfig = {
  componentName: "VoiceAgent",
  importPath: "@/components/remocn/voice-agent",
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
    agentName: {
      type: "text-content",
      default: "Ava",
      description: "Agent name",
    },
    agentRole: {
      type: "text-content",
      default: "Fernway concierge",
      description: "Agent role",
    },
    callerName: {
      type: "text-content",
      default: "Maya Chen",
      description: "Caller name",
    },
    callerLine: {
      type: "text-content",
      default: "+1 (415) ••• 0192",
      description: "Caller line",
    },
    summaryTitle: {
      type: "text-content",
      default: "Call summary",
      description: "Summary title",
    },
    summaryStatus: {
      type: "text-content",
      default: "Booked",
      description: "Summary status",
    },
    startSeconds: {
      type: "number",
      default: 41,
      min: 0,
      max: 123,
      step: 1,
      description: "Start seconds",
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
  durationInFrames: 340,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
