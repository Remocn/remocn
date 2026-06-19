"use client";

import { Checkbox } from "@/registry/remocn-ui/checkbox";
import { useCheckboxTransition } from "@/registry/remocn-ui/checkbox/use-checkbox-transition";

export const checkboxExampleControls = ["label", "size", "primary"] as const;

export interface CheckboxExampleProps {
  label?: string;
  size?: "sm" | "default" | "lg";
  primary?: string;
}

export const CheckboxExampleScene = (p: CheckboxExampleProps = {}) => {
  const style = useCheckboxTransition([
    { at: 18, state: "checked", duration: 14 },
    { at: 78, state: "unchecked", duration: 12 },
  ], { primary: p.primary });
  return (
    <Checkbox
      label={p.label ?? "Accept terms and conditions"}
      size={p.size ?? "default"}
      primary={p.primary}
      style={style}
    />
  );
};

export const checkboxExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;
  const size = values.size as string | undefined;
  const primary = values.primary as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Accept terms and conditions")
    props.push(`label="${label}"`);
  if (size !== undefined && size !== "default") props.push(`size="${size}"`);
  if (primary !== undefined) props.push(`primary="${primary}"`);

  const propsStr = props.length ? ` ${props.join(" ")}` : "";

  const hookOpts: string[] = [];
  if (primary !== undefined) hookOpts.push(`primary: "${primary}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Checkbox } from "@/components/remocn/checkbox";
import { useCheckboxTransition } from "@/components/remocn/use-checkbox-transition";

export const Scene = () => {
  const style = useCheckboxTransition([
    { at: 18, state: "checked", duration: 14 },
    { at: 78, state: "unchecked", duration: 12 },
  ]${optsStr});

  return <Checkbox${propsStr} style={style} />;
};`;
};
