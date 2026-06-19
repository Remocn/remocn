"use client";

import { DropdownMenu } from "@/registry/remocn-ui/dropdown-menu";
import { useDropdownMenuTransition } from "@/registry/remocn-ui/dropdown-menu/use-dropdown-menu-transition";
import { useDropdownMenuItemTransition } from "@/registry/remocn-ui/dropdown-menu-item/use-dropdown-menu-item-transition";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { useCurrentState } from "@/lib/remocn-ui";

export const dropdownMenuExampleControls = ["label"] as const;

export interface DropdownMenuExampleProps {
  label?: string;
}

export const DropdownMenuExampleScene = (p: DropdownMenuExampleProps = {}) => {
  // The trigger: idle → hover → press, the press lands just before the menu
  // opens (the "click" that triggers it).
  const triggerStyle = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { variant: "outline" },
  );
  // The menu opens just after the "click", then closes near the end.
  const menu = useDropdownMenuTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 96, state: "closed", duration: 12 },
  ]);
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
  const row = useDropdownMenuItemTransition([{ at: 0, state: rowState }]);
  return (
    <DropdownMenu
      style={menu}
      label={p.label ?? "Options"}
      triggerStyle={triggerStyle}
      itemStyles={[undefined, row, undefined, undefined]}
    />
  );
};

export const dropdownMenuExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const label = values.label as string | undefined;

  const props: string[] = [];
  if (label !== undefined && label !== "Options") props.push(`label="${label}"`);
  const extraProps = props.length ? `\n      ${props.join("\n      ")}` : "";

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
    ],
    { variant: "outline" },
  );
  const menu = useDropdownMenuTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 96, state: "closed", duration: 12 },
  ]);
  const rowState = useCurrentState(
    [
      { at: 52, state: "hover" },
      { at: 70, state: "press" },
      { at: 82, state: "idle" },
    ],
    "idle",
  );
  const row = useDropdownMenuItemTransition([{ at: 0, state: rowState }]);

  return (
    <DropdownMenu${extraProps}
      style={menu}
      triggerStyle={triggerStyle}
      itemStyles={[undefined, row, undefined, undefined]}
    />
  );
};`;
};
