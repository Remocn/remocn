"use client";

import { DropdownMenu } from "@/registry/remocn-ui/dropdown-menu";
import { useDropdownMenuTransition } from "@/registry/remocn-ui/dropdown-menu/use-dropdown-menu-transition";
import { useDropdownMenuItemTransition } from "@/registry/remocn-ui/dropdown-menu-item/use-dropdown-menu-item-transition";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { useCurrentState } from "@/lib/remocn-ui";

export const dropdownMenuExampleControls = ["label", "mode"] as const;

export interface DropdownMenuExampleProps {
  label?: string;
  mode?: "light" | "dark";
}

export const DropdownMenuExampleScene = (p: DropdownMenuExampleProps = {}) => {
  // The trigger: idle → hover → press, the press lands just before the menu
  // opens (the "click" that triggers it).
  const triggerStyle = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { variant: "outline", mode: p.mode },
  );
  // The menu opens just after the "click", then closes near the end.
  const menu = useDropdownMenuTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 96, state: "closed", duration: 12 },
    ],
    { mode: p.mode },
  );
  // One row walks hover → press while the panel is open (no persistent
  // selection — a menu commits the action and dismisses).
  const rowState = useCurrentState(
    [
      { at: 52, state: "hover" },
      { at: 70, state: "press" },
      { at: 82, state: "idle" },
    ],
    "idle",
  );
  const row = useDropdownMenuItemTransition([{ at: 0, state: rowState }], { mode: p.mode });
  return (
    <DropdownMenu
      style={menu}
      label={p.label ?? "Options"}
      triggerStyle={triggerStyle}
      itemStyles={[undefined, row, undefined, undefined]}
      mode={p.mode ?? "light"}
    />
  );
};

export const dropdownMenuExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;
  const mode = values.mode as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Options") props.push(`label="${label}"`);
  if (mode !== undefined && mode !== "light") props.push(`mode="${mode}"`);
  const extraProps = props.length ? `\n      ${props.join("\n      ")}` : "";

  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";
  const triggerOptsStr = hookOpts.length
    ? `, { variant: "outline", ${hookOpts.join(", ")} }`
    : `, { variant: "outline" }`;

  return `import { DropdownMenu } from "@/components/remocn/dropdown-menu";
import { useDropdownMenuTransition } from "@/components/remocn/use-dropdown-menu-transition";
import { useDropdownMenuItemTransition } from "@/components/remocn/use-dropdown-menu-item-transition";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { useCurrentState } from "@/lib/remocn-ui";

export const Scene = () => {
  const triggerStyle = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ]${triggerOptsStr},
  );
  const menu = useDropdownMenuTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 96, state: "closed", duration: 12 },
    ]${optsStr},
  );
  const rowState = useCurrentState(
    [
      { at: 52, state: "hover" },
      { at: 70, state: "press" },
      { at: 82, state: "idle" },
    ],
    "idle",
  );
  const row = useDropdownMenuItemTransition([{ at: 0, state: rowState }]${optsStr});

  return (
    <DropdownMenu${extraProps}
      style={menu}
      triggerStyle={triggerStyle}
      itemStyles={[undefined, row, undefined, undefined]}
    />
  );
};`;
};
