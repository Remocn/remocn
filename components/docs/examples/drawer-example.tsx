"use client";

import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Drawer } from "@/registry/remocn-ui/drawer";
import { useDrawerTransition } from "@/registry/remocn-ui/drawer/use-drawer-transition";

export const drawerExampleControls = [
  "title", "description", "actionLabel", "cancelLabel", "mode",
] as const;

export interface DrawerExampleProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  mode?: "light" | "dark";
}

export const DrawerExampleScene = (p: DrawerExampleProps = {}) => {
  // The trigger Button: idle → hover → press, the press lands just before the
  // drawer opens (the "click" that triggers it).
  const trigger = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { mode: p.mode },
  );
  // The drawer slides up right after the press, then closes near the end.
  const drawer = useDrawerTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 92, state: "closed", duration: 12 },
    ],
    { mode: p.mode },
  );
  return (
    <>
      <Button label="Edit profile" mode={p.mode ?? "light"} style={trigger} />
      <Drawer
        title={p.title ?? "Edit profile"}
        description={p.description ?? "Make changes to your profile here. Click save when you're done."}
        actionLabel={p.actionLabel ?? "Save changes"}
        cancelLabel={p.cancelLabel ?? "Cancel"}
        mode={p.mode ?? "light"}
        style={drawer}
      />
    </>
  );
};

export const drawerExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const title = values.title as string | undefined;
  const description = values.description as string | undefined;
  const actionLabel = values.actionLabel as string | undefined;
  const cancelLabel = values.cancelLabel as string | undefined;
  const mode = values.mode as string | undefined;

  const drawerProps: string[] = [];
  if (title !== undefined && title !== "Edit profile") drawerProps.push(`title="${title}"`);
  if (description !== undefined && description !== "Make changes to your profile here. Click save when you're done.") drawerProps.push(`description="${description}"`);
  if (actionLabel !== undefined && actionLabel !== "Save changes") drawerProps.push(`actionLabel="${actionLabel}"`);
  if (cancelLabel !== undefined && cancelLabel !== "Cancel") drawerProps.push(`cancelLabel="${cancelLabel}"`);
  if (mode !== undefined && mode !== "light") drawerProps.push(`mode="${mode}"`);

  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  const buttonModeStr = mode !== undefined && mode !== "light" ? ` mode="${mode}"` : "";
  const drawerPropsStr = drawerProps.length ? ` ${drawerProps.join(" ")}` : "";

  return `import { Drawer } from "@/components/remocn/drawer";
import { useDrawerTransition } from "@/components/remocn/use-drawer-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

export const Scene = () => {
  const trigger = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ]${optsStr},
  );
  const drawer = useDrawerTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 92, state: "closed", duration: 12 },
    ]${optsStr},
  );

  return (
    <>
      <Button label="Edit profile"${buttonModeStr} style={trigger} />
      <Drawer${drawerPropsStr} style={drawer} />
    </>
  );
};`;
};
