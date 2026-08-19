import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const claudeCodeConfig: ComponentConfig = {
  componentName: "ClaudeCode",
  importPath: "@/components/remocn/claude-code",
  controls: {
    title: {
      type: "text-content",
      default: "Claude Code v2.0.0",
      description: "Title",
    },
    userName: {
      type: "text-content",
      default: "Remocn",
      description: "User name",
    },
    model: {
      type: "text-content",
      default: "Opus 4.8 • Max 20x",
      description: "Model",
    },
    cwd: {
      type: "text-content",
      default: "/users/remocn/code/apps",
      description: "Cwd",
    },
    placeholder: {
      type: "text-content",
      default: 'Try "edit <filepath> to ..."',
      description: "Placeholder",
    },
    prompt: {
      type: "text-content",
      default: "edit src/theme.ts to add a dark mode toggle",
      description: "Prompt",
    },
    accentColor: {
      type: "color",
      default: "#D97757",
      description: "Accent",
    },
  },
  durationInFrames: 160,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
  previewBackdrop: { type: "color", value: "#2B2A28" },
};
