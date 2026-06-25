"use client";

import { Switch } from "@/registry/remocn-ui/switch";
import { useSwitchTransition } from "@/registry/remocn-ui/switch/use-switch-transition";

export const switchExampleControls = ["label", "size", "primary"] as const;

export interface SwitchExampleProps {
  label?: string;
  size?: "sm" | "default" | "lg";
  primary?: string;
}

export const SwitchExampleScene = (p: SwitchExampleProps = {}) => {
  const style = useSwitchTransition([
    { at: 18, state: "checked", duration: 14 },
    { at: 78, state: "unchecked", duration: 12 },
  ], { primary: p.primary });
  return (
    <Switch
      label={p.label ?? "Enable notifications"}
      size={p.size ?? "default"}
      primary={p.primary}
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

  const props: string[] = [];
  if (label !== undefined && label !== "Enable notifications")
    props.push(`label="${label}"`);
  if (size !== undefined && size !== "default") props.push(`size="${size}"`);
  if (primary !== undefined) props.push(`primary="${primary}"`);

  const propsStr = props.length ? ` ${props.join(" ")}` : "";

  const hookOpts: string[] = [];
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
