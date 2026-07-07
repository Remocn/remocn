"use client";

import { Radio } from "@/registry/remocn-ui/radio";
import { useRadioTransition } from "@/registry/remocn-ui/radio/use-radio-transition";

export const radioExampleControls = ["label", "size", "primary"] as const;

export interface RadioExampleProps {
  label?: string;
  size?: "sm" | "default" | "lg";
  primary?: string;
}

export const RadioExampleScene = (p: RadioExampleProps = {}) => {
  const style = useRadioTransition(
    [
      { at: 18, state: "checked", duration: 14 },
      { at: 78, state: "unchecked", duration: 12 },
    ],
    { primary: p.primary },
  );
  return (
    <Radio
      label={p.label ?? "Subscribe to updates"}
      size={p.size ?? "default"}
      primary={p.primary}
      style={style}
    />
  );
};

export const radioExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;
  const size = values.size as string | undefined;
  const primary = values.primary as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Subscribe to updates")
    props.push(`label="${label}"`);
  if (size !== undefined && size !== "default") props.push(`size="${size}"`);
  if (primary !== undefined) props.push(`primary="${primary}"`);

  const propsStr = props.length ? ` ${props.join(" ")}` : "";

  const hookOpts: string[] = [];
  if (primary !== undefined) hookOpts.push(`primary: "${primary}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Radio } from "@/components/remocn/radio";
import { useRadioTransition } from "@/components/remocn/use-radio-transition";

export const Scene = () => {
  const style = useRadioTransition([
    { at: 18, state: "checked", duration: 14 },
    { at: 78, state: "unchecked", duration: 12 },
  ]${optsStr});

  return <Radio${propsStr} style={style} />;
};`;
};
