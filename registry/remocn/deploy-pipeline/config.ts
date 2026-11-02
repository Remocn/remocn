import { type ComponentConfig, FPS, H, W } from "@/lib/customizer-config";

export const deployPipelineConfig: ComponentConfig = {
  componentName: "DeployPipeline",
  importPath: "@/components/remocn/deploy-pipeline",
  controls: {
    theme: {
      type: "enum",
      default: "dark",
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
    project: {
      type: "text-content",
      default: "remocn-web",
      description: "Project",
    },
    deploymentId: {
      type: "text-content",
      default: "7Hq2xKfaW",
      description: "Deployment id",
    },
    commitMessage: {
      type: "text-content",
      default: "feat: launch video components",
      description: "Commit message",
    },
    commitSha: {
      type: "text-content",
      default: "a4f9c21",
      description: "Commit sha",
    },
    branch: {
      type: "text-content",
      default: "main",
      description: "Branch",
    },
    domain: {
      type: "text-content",
      default: "remocn-web.kitebase.app",
      description: "Domain",
    },
    buildSeconds: {
      type: "number",
      default: 21,
      min: 0,
      max: 63,
      step: 1,
      description: "Build seconds",
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
  durationInFrames: 180,
  fps: FPS,
  compositionWidth: W,
  compositionHeight: H,
};
