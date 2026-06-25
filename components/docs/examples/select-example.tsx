"use client";

import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Select } from "@/registry/remocn-ui/select";
import { useSelectTransition } from "@/registry/remocn-ui/select/use-select-transition";
import { useSelectItemTransition } from "@/registry/remocn-ui/select-item/use-select-item-transition";

export const selectExampleControls = ["label"] as const;

export interface SelectExampleProps {
  label?: string;
}

export const SelectExampleScene = (p: SelectExampleProps = {}) => {
  // The trigger: idle → hover → press, the press lands just before the panel
  // opens (the "click" that triggers it). Fed to the Select via `triggerStyle`.
  const triggerStyle = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { variant: "outline" },
  );
  // The panel reveals right after the press, then collapses near the end.
  const panel = useSelectTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 96, state: "closed", duration: 12 },
  ]);
  // One row (index 1) is highlighted, pressed, then committed as selected.
  const row = useSelectItemTransition([
    { at: 52, state: "hover" },
    { at: 64, state: "press" },
    { at: 72, state: "selected", duration: 10 },
  ]);
  return (
    <Select
      style={panel}
      label={p.label ?? "Select a fruit"}
      triggerStyle={triggerStyle}
      itemStyles={[undefined, row, undefined, undefined]}
    />
  );
};

export const selectExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Select a fruit")
    props.push(`label="${label}"`);
  const extraProps = props.length ? `\n      ${props.join("\n      ")}` : "";

  const optsStr = "";
  const triggerOptsStr = `, { variant: "outline" }`;

  return `import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Select } from "@/components/remocn/select";
import { useSelectTransition } from "@/components/remocn/use-select-transition";
import { useSelectItemTransition } from "@/components/remocn/use-select-item-transition";

export const Scene = () => {
  const triggerStyle = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ]${triggerOptsStr},
  );
  const panel = useSelectTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 96, state: "closed", duration: 12 },
    ]${optsStr},
  );
  const row = useSelectItemTransition(
    [
      { at: 52, state: "hover" },
      { at: 64, state: "press" },
      { at: 72, state: "selected", duration: 10 },
    ]${optsStr},
  );

  return (
    <Select${extraProps}
      style={panel}
      triggerStyle={triggerStyle}
      itemStyles={[undefined, row, undefined, undefined]}
    />
  );
};`;
};
