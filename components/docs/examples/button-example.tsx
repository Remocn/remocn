"use client";

import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";

/**
 * Honored display props the scene threads straight into `<Button>`. The button's
 * full flat-prop surface is label/variant/size/state/mode/primary; `state` is
 * owned by the timeline (`useButtonTransition` → `style`, which takes precedence
 * over `state`) so it is EXCLUDED, and the shared `speed` knob is excluded too.
 * This list IS the per-component honored allowlist consumed by UiComponentPreview.
 */
export const buttonExampleControls = [
  "label",
  "variant",
  "size",
  "primary",
  "mode",
] as const;

export interface ButtonExampleProps {
  label?: string;
  variant?: "default" | "secondary" | "destructive" | "outline" | "ghost";
  size?: "sm" | "default" | "lg";
  primary?: string;
  mode?: "light" | "dark";
}

export const ButtonExampleScene = (p: ButtonExampleProps = {}) => {
  // Timeline owns `state` via the interpolated style — never a flat prop.
  // Forward the honored color props into the hook so the interpolated background
  // tracks the current variant/mode/primary. Without this the style bakes the
  // default-variant light background and `style` (which wins over the component's
  // own variant/mode) makes those toggles no-ops on the button surface.
  const style = useButtonTransition(
    [
      { at: 12, state: "hover" },
      { at: 30, state: "press" },
      { at: 48, state: "loading", duration: 6 },
      { at: 96, state: "success", duration: 16 },
    ],
    { variant: p.variant, mode: p.mode, primary: p.primary },
  );
  return (
    <Button
      label={p.label ?? "Continue"}
      variant={p.variant ?? "default"}
      size={p.size ?? "default"}
      primary={p.primary}
      mode={p.mode ?? "light"}
      style={style}
    />
  );
};

/**
 * Code template for the Code tab. Emits the same `useButtonTransition([...])`
 * timeline form the scene runs, interpolating ONLY honored props and ONLY when
 * a value differs from its control default — never a prop the component ignores.
 */
export const buttonExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;
  const variant = values.variant as string | undefined;
  const size = values.size as string | undefined;
  const mode = values.mode as string | undefined;
  const primary = values.primary as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Continue")
    props.push(`label="${label}"`);
  if (variant !== undefined && variant !== "default")
    props.push(`variant="${variant}"`);
  if (size !== undefined && size !== "default") props.push(`size="${size}"`);
  if (mode !== undefined && mode !== "light") props.push(`mode="${mode}"`);
  if (primary !== undefined && primary !== "#171717")
    props.push(`primary="${primary}"`);

  // Default scene renders `<Button label="Continue" style={style} />`; honored
  // overrides are appended before `style` so the timeline prop stays last.
  const propsStr = props.length ? `${props.join(" ")} ` : "";

  // Color-affecting props are ALSO forwarded into the transition hook so the
  // animated background tracks them (size/label only need the component prop).
  const hookOpts: string[] = [];
  if (variant !== undefined && variant !== "default")
    hookOpts.push(`variant: "${variant}"`);
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  if (primary !== undefined && primary !== "#171717")
    hookOpts.push(`primary: "${primary}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

export const Scene = () => {
  const style = useButtonTransition([
    { at: 12, state: "hover" },
    { at: 30, state: "press" },
    { at: 48, state: "loading", duration: 6 },
    { at: 96, state: "success", duration: 16 },
  ]${optsStr});

  return <Button ${propsStr}style={style} />;
};`;
};
