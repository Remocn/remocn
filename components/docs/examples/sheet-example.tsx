"use client";

import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Sheet } from "@/registry/remocn-ui/sheet";
import { useSheetTransition } from "@/registry/remocn-ui/sheet/use-sheet-transition";

export const sheetExampleControls = [
  "title", "description", "actionLabel", "cancelLabel",
] as const;

export interface SheetExampleProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  cancelLabel?: string;
}

export const SheetExampleScene = (p: SheetExampleProps = {}) => {
  // The trigger Button: idle → hover → press, the press lands just before the
  // sheet opens (the "click" that triggers it).
  const trigger = useButtonTransition([
    { at: 14, state: "hover" },
    { at: 26, state: "press" },
  ]);
  // The sheet slides in right after the press, then closes near the end.
  const sheet = useSheetTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 92, state: "closed", duration: 12 },
  ]);
  return (
    <>
      <Button label="Edit profile" style={trigger} />
      <Sheet
        title={p.title ?? "Edit profile"}
        description={p.description ?? "Make changes to your profile here. Click save when you're done."}
        actionLabel={p.actionLabel ?? "Save changes"}
        cancelLabel={p.cancelLabel ?? "Cancel"}
        style={sheet}
      />
    </>
  );
};

export const sheetExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const title = values.title as string | undefined;
  const description = values.description as string | undefined;
  const actionLabel = values.actionLabel as string | undefined;
  const cancelLabel = values.cancelLabel as string | undefined;

  const sheetProps: string[] = [];
  if (title !== undefined && title !== "Edit profile") sheetProps.push(`title="${title}"`);
  if (description !== undefined && description !== "Make changes to your profile here. Click save when you're done.") sheetProps.push(`description="${description}"`);
  if (actionLabel !== undefined && actionLabel !== "Save changes") sheetProps.push(`actionLabel="${actionLabel}"`);
  if (cancelLabel !== undefined && cancelLabel !== "Cancel") sheetProps.push(`cancelLabel="${cancelLabel}"`);

  const sheetPropsStr = sheetProps.length ? ` ${sheetProps.join(" ")}` : "";

  return `import { Sheet } from "@/components/remocn/sheet";
import { useSheetTransition } from "@/components/remocn/use-sheet-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

export const Scene = () => {
  const trigger = useButtonTransition([
    { at: 14, state: "hover" },
    { at: 26, state: "press" },
  ]);
  const sheet = useSheetTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 92, state: "closed", duration: 12 },
  ]);

  return (
    <>
      <Button label="Edit profile" style={trigger} />
      <Sheet${sheetPropsStr} style={sheet} />
    </>
  );
};`;
};
