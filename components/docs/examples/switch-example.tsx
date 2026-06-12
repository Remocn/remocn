"use client";

import { Switch } from "@/registry/remocn-ui/switch";
import { useSwitchTransition } from "@/registry/remocn-ui/switch/use-switch-transition";

export const switchExampleControls = ["label", "size", "primary", "mode"] as const;

export interface SwitchExampleProps {
  label?: string;
  size?: "sm" | "default" | "lg";
  primary?: string;
  mode?: "light" | "dark";
}

export const SwitchExampleScene = (p: SwitchExampleProps = {}) => {
  const style = useSwitchTransition([
    { at: 18, state: "checked", duration: 14 },
    { at: 78, state: "unchecked", duration: 12 },
  ], { mode: p.mode, primary: p.primary });
  return (
    <Switch
      label={p.label ?? "Enable notifications"}
      size={p.size ?? "default"}
      primary={p.primary}
      mode={p.mode ?? "light"}
      style={style}
    />
  );
};

export const switchExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;
  const size = values.size as string | undefined;
  const primary = values.primary as string | undefined;
  const mode = values.mode as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Enable notifications")
    props.push(`label="${label}"`);
  if (size !== undefined && size !== "default") props.push(`size="${size}"`);
  if (primary !== undefined) props.push(`primary="${primary}"`);
  if (mode !== undefined && mode !== "light") props.push(`mode="${mode}"`);

  const propsStr = props.length ? ` ${props.join(" ")}` : "";

  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  if (primary !== undefined) hookOpts.push(`primary: "${primary}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Switch } from "@/components/remocn/switch";
import { useSwitchTransition } from "@/components/remocn/use-switch-transition";

export const Scene = () => {
  const style = useSwitchTransition([
    { at: 18, state: "checked", duration: 14 },
    { at: 78, state: "unchecked", duration: 12 },
  ]${optsStr});

  return <Switch${propsStr} style={style} />;
};`;
};
