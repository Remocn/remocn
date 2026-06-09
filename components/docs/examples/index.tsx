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
import { ButtonExampleScene, buttonExampleCode } from "./button-example";
import {
  CheckboxExampleScene,
  checkboxExampleCode,
} from "./checkbox-example";
import { RadioExampleScene, radioExampleCode } from "./radio-example";
import { SwitchExampleScene, switchExampleCode } from "./switch-example";
import { InputExampleScene, inputExampleCode } from "./input-example";

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
};
