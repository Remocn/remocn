"use client";

import { useOpenPanel } from "@openpanel/nextjs";
import { useCallback } from "react";

export type PreviewSurface =
  | "hero"
  | "bento"
  | "landing_code_showcase"
  | "docs";

export type CtaId =
  | "hero_browse"
  | "hero_ui_badge"
  | "bento_browse"
  | "final_cta"
  | "github_header";

type AnalyticsEvents = {
  install_command_copied: {
    component: string;
    package_manager: "pnpm" | "npm" | "yarn" | "bun" | "prompt";
    surface: "docs" | "landing" | "bento";
  };
  preview_played: {
    component: string;
    surface: PreviewSurface;
    trigger: "click" | "hover";
  };
  preview_paused: {
    component: string;
    surface: PreviewSurface;
  };
  component_customized: {
    component: string;
    prop: string;
  };
  customized_link_shared: {
    component: string;
  };
  customizer_reset: {
    component: string;
  };
  cta_clicked: {
    cta: CtaId;
    destination: string;
  };
  docs_component_viewed: {
    component: string;
  };
};

export function useTrackEvent() {
  const op = useOpenPanel();
  return useCallback(
    <E extends keyof AnalyticsEvents>(
      event: E,
      ...args: AnalyticsEvents[E] extends Record<string, never>
        ? []
        : [AnalyticsEvents[E]]
    ) => {
      op.track(event, args[0] as Record<string, unknown> | undefined);
    },
    [op],
  );
}
