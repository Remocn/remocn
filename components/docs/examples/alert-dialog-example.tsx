"use client";

import { AlertDialog } from "@/registry/remocn-ui/alert-dialog";
import { useAlertDialogTransition } from "@/registry/remocn-ui/alert-dialog/use-alert-dialog-transition";
import { Button } from "@/registry/remocn-ui/button";
import { useButtonTransition } from "@/registry/remocn-ui/button/use-button-transition";

export const AlertDialogExampleScene = () => {
  // The trigger Button: idle → hover → press, the press lands just before the
  // dialog opens (the "click" that triggers it).
  const trigger = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { variant: "destructive" },
  );
  // The dialog opens right after the press, then closes near the end.
  const dialog = useAlertDialogTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 92, state: "closed", duration: 12 },
  ]);
  return (
    <>
      <Button label="Delete account" variant="destructive" style={trigger} />
      <AlertDialog style={dialog} />
    </>
  );
};

export const alertDialogExampleCode = `import { AlertDialog } from "@/components/remocn/alert-dialog";
import { useAlertDialogTransition } from "@/components/remocn/use-alert-dialog-transition";
import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";

export const Scene = () => {
  const trigger = useButtonTransition(
    [
      { at: 14, state: "hover" },
      { at: 26, state: "press" },
    ],
    { variant: "destructive" },
  );
  const dialog = useAlertDialogTransition([
    { at: 32, state: "opened", duration: 16 },
    { at: 92, state: "closed", duration: 12 },
  ]);

  return (
    <>
      <Button label="Delete account" variant="destructive" style={trigger} />
      <AlertDialog style={dialog} />
    </>
  );
};`;
