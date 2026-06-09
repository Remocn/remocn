"use client";

import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";
import { Dialog } from "@/registry/remocn-ui/dialog";
import { useDialogTransition } from "@/registry/remocn-ui/dialog/use-dialog-transition";

export const DialogExampleScene = () => {
  // The trigger Button: idle → hover → press, the press lands just before the
  // dialog opens (the "click" that triggers it).
  const trigger = useButtonTransition([
    { at: 14, state: "hover" },
    { at: 26, state: "press" },
  ]);
  // The dialog opens right after the press, then closes near the end.
  const dialog = useDialogTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 92, state: "closed", duration: 12 },
  ]);
  return (
    <>
      <Button label="Edit profile" style={trigger} />
      <Dialog style={dialog} />
    </>
  );
};

export const dialogExampleCode = `import { Dialog } from "@/components/remocn/dialog";
import { useDialogTransition } from "@/components/remocn/use-dialog-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

export const Scene = () => {
  const trigger = useButtonTransition([
    { at: 14, state: "hover" },
    { at: 26, state: "press" },
  ]);
  const dialog = useDialogTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 92, state: "closed", duration: 12 },
  ]);

  return (
    <>
      <Button label="Edit profile" style={trigger} />
      <Dialog style={dialog} />
    </>
  );
};`;
