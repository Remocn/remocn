import type { ComponentType } from "react";
import { FPS, H, W } from "@/lib/customizer-config";
import {
  AccordionExampleScene,
  accordionExampleCode,
} from "./accordion-example";
import {
  AlertDialogExampleScene,
  alertDialogExampleCode,
} from "./alert-dialog-example";
import { DialogExampleScene, dialogExampleCode } from "./dialog-example";
import { ButtonExampleScene, buttonExampleCode } from "./button-example";
import {
  CheckboxExampleScene,
  checkboxExampleCode,
} from "./checkbox-example";
import { RadioExampleScene, radioExampleCode } from "./radio-example";
import { SwitchExampleScene, switchExampleCode } from "./switch-example";
import { InputExampleScene, inputExampleCode } from "./input-example";
import { SelectExampleScene, selectExampleCode } from "./select-example";
import {
  DropdownMenuExampleScene,
  dropdownMenuExampleCode,
} from "./dropdown-menu-example";

export interface ExampleEntry {
  Component: ComponentType;
  code: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
}

export const examples: Record<string, ExampleEntry> = {
  "button-example": {
    Component: ButtonExampleScene,
    code: buttonExampleCode,
    durationInFrames: 132,
    fps: FPS,
    width: W,
    height: H,
  },
  "accordion-example": {
    Component: AccordionExampleScene,
    code: accordionExampleCode,
    // Last transition (close) completes at frame 90; a short settle then loop.
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
  },
  "alert-dialog-example": {
    Component: AlertDialogExampleScene,
    code: alertDialogExampleCode,
    // Dialog closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "dialog-example": {
    Component: DialogExampleScene,
    code: dialogExampleCode,
    // Dialog closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "checkbox-example": {
    Component: CheckboxExampleScene,
    code: checkboxExampleCode,
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
  },
  "radio-example": {
    Component: RadioExampleScene,
    code: radioExampleCode,
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
  },
  "switch-example": {
    Component: SwitchExampleScene,
    code: switchExampleCode,
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
  },
  "input-example": {
    Component: InputExampleScene,
    code: inputExampleCode,
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "select-example": {
    Component: SelectExampleScene,
    code: selectExampleCode,
    // Panel closes at 96 + dur 12 = 108; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "dropdown-menu-example": {
    Component: DropdownMenuExampleScene,
    code: dropdownMenuExampleCode,
    // Panel closes at 96 + dur 12 = 108; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
};
