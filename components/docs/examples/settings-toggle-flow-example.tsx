"use client";

import { SettingsToggleFlow } from "@/registry/remocn-ui/settings-toggle-flow";

export const SettingsToggleFlowExampleScene = () => <SettingsToggleFlow />;

export const settingsToggleFlowExampleCode = (): string => {
  return `import { SettingsToggleFlow } from "@/components/remocn/settings-toggle-flow";

export const Scene = () => <SettingsToggleFlow />;`;
};
