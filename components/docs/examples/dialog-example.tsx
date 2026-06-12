"use client";

import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Dialog } from "@/registry/remocn-ui/dialog";
import { useDialogTransition } from "@/registry/remocn-ui/dialog/use-dialog-transition";

export const dialogExampleControls = [
  "title", "description", "actionLabel", "cancelLabel", "mode",
] as const;

export interface DialogExampleProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
  mode?: "light" | "dark";
}

export const DialogExampleScene = (p: DialogExampleProps = {}) => {
  // The trigger Button: idle → hover → press, the press lands just before the
  // dialog opens (the "click" that triggers it).
  const trigger = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { mode: p.mode },
  );
  // The dialog opens right after the press, then closes near the end.
  const dialog = useDialogTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 92, state: "closed", duration: 12 },
    ],
    { mode: p.mode },
  );
  return (
    <>
      <Button label="Edit profile" mode={p.mode ?? "light"} style={trigger} />
      <Dialog
        title={p.title ?? "Edit profile"}
        description={p.description ?? "Make changes to your profile here. Click save when you're done."}
        actionLabel={p.actionLabel ?? "Save changes"}
        cancelLabel={p.cancelLabel ?? "Cancel"}
        mode={p.mode ?? "light"}
        style={dialog}
      />
    </>
  );
};

export const dialogExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const title = values.title as string | undefined;
  const description = values.description as string | undefined;
  const actionLabel = values.actionLabel as string | undefined;
  const cancelLabel = values.cancelLabel as string | undefined;
  const mode = values.mode as string | undefined;

  const dialogProps: string[] = [];
  if (title !== undefined && title !== "Edit profile") dialogProps.push(`title="${title}"`);
  if (description !== undefined && description !== "Make changes to your profile here. Click save when you're done.") dialogProps.push(`description="${description}"`);
  if (actionLabel !== undefined && actionLabel !== "Save changes") dialogProps.push(`actionLabel="${actionLabel}"`);
  if (cancelLabel !== undefined && cancelLabel !== "Cancel") dialogProps.push(`cancelLabel="${cancelLabel}"`);
  if (mode !== undefined && mode !== "light") dialogProps.push(`mode="${mode}"`);

  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  const buttonModeStr = mode !== undefined && mode !== "light" ? ` mode="${mode}"` : "";
  const dialogPropsStr = dialogProps.length ? ` ${dialogProps.join(" ")}` : "";

  return `import { Dialog } from "@/components/remocn/dialog";
import { useDialogTransition } from "@/components/remocn/use-dialog-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

export const Scene = () => {
  const trigger = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ]${optsStr},
  );
  const dialog = useDialogTransition(
    [
      { at: 32, state: "opened", duration: 16 },
      { at: 92, state: "closed", duration: 12 },
    ]${optsStr},
  );

  return (
    <>
      <Button label="Edit profile"${buttonModeStr} style={trigger} />
      <Dialog${dialogPropsStr} style={dialog} />
    </>
  );
};`;
};
