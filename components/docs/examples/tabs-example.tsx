"use client";

import { Tabs } from "@/registry/remocn-ui/tabs";
import { useTabsTransition } from "@/registry/remocn-ui/tabs/use-tabs-transition";

export interface TabsExampleProps {
  variant?: "pill" | "underline";
  mode?: "light" | "dark";
}

export const tabsExampleControls = ["variant", "mode"] as const;

export const TabsExampleScene = (p: TabsExampleProps = {}) => {
  const style = useTabsTransition([
    { at: 18, state: "Account", duration: 16 },
    { at: 58, state: "Password", duration: 18 },
    { at: 94, state: "Settings", duration: 12 },
  ], { variant: p.variant, mode: p.mode });
  return (
    <Tabs
      style={style}
      variant={p.variant ?? "pill"}
      mode={p.mode ?? "light"}
    />
  );
};

export const tabsExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const variant = values.variant as string | undefined;
  const mode = values.mode as string | undefined;

  const props: string[] = [];
  if (variant !== undefined && variant !== "pill") props.push(`variant="${variant}"`);
  if (mode !== undefined && mode !== "light") props.push(`mode="${mode}"`);
  const extraProps = props.length ? `\n    ${props.join("\n    ")}` : "";

  const hookOpts: string[] = [];
  if (variant !== undefined && variant !== "pill") hookOpts.push(`variant: "${variant}"`);
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Tabs } from "@/components/remocn/tabs";
import { useTabsTransition } from "@/components/remocn/use-tabs-transition";

export const Scene = () => {
  const style = useTabsTransition([
    { at: 18, state: "Account", duration: 16 },
    { at: 58, state: "Password", duration: 18 },
    { at: 94, state: "Settings", duration: 12 },
  ]${optsStr});

  return <Tabs style={style}${extraProps} />;
};`;
};
