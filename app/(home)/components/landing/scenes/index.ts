import type { ComponentType } from "react";
import type { PreviewManifestEntry } from "@/registry/__manifest__";

type SceneEntry = {
  preview: PreviewManifestEntry;
  load: () => Promise<{ default: ComponentType<Record<string, unknown>> }>;
};

export const LANDING_SCENES: Record<string, SceneEntry> = {
  "crt-wordmark": {
    preview: {
      durationInFrames: 180,
      fps: 30,
      compositionWidth: 1280,
      compositionHeight: 720,
      previewBackdrop: { type: "color", value: "#050505" },
      defaults: { text: "emocn", fontSize: 220 },
    },
    load: () =>
      import("./crt-wordmark").then((module) => ({
        default: module.CrtWordmark,
      })),
  },
};
