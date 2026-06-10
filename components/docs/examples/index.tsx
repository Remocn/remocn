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
import { SheetExampleScene, sheetExampleCode } from "./sheet-example";
import { DrawerExampleScene, drawerExampleCode } from "./drawer-example";
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
import { TabsExampleScene, tabsExampleCode } from "./tabs-example";
import { CursorExampleScene, cursorExampleCode } from "./cursor-example";
import { ToastExampleScene, toastExampleCode } from "./toast-example";
import {
  CommandMenuExampleScene,
  commandMenuExampleCode,
} from "./command-menu-example";
import { TooltipExampleScene, tooltipExampleCode } from "./tooltip-example";
import {
  ProgressExampleScene,
  progressExampleCode,
} from "./progress-example";
import {
  SkeletonExampleScene,
  skeletonExampleCode,
} from "./skeleton-example";

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
  "sheet-example": {
    Component: SheetExampleScene,
    code: sheetExampleCode,
    // Sheet closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "drawer-example": {
    Component: DrawerExampleScene,
    code: drawerExampleCode,
    // Drawer closes at 92 + dur 12 = 104; a short settle then loop.
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
  "tabs-example": {
    Component: TabsExampleScene,
    code: tabsExampleCode,
    // Settings transition completes at 94 + dur 12 = 106; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "cursor-example": {
    Component: CursorExampleScene,
    code: cursorExampleCode,
    // success transition completes at 108 + dur 16 = 124; a short settle then loop.
    durationInFrames: 140,
    fps: FPS,
    width: W,
    height: H,
  },
  "toast-example": {
    Component: ToastExampleScene,
    code: toastExampleCode,
    // Toast dismiss completes at 144 + dur 12 = 156; a short settle then loop.
    durationInFrames: 170,
    fps: FPS,
    width: W,
    height: H,
  },
  "command-menu-example": {
    Component: CommandMenuExampleScene,
    code: commandMenuExampleCode,
    // Panel closes at 108 + dur 12 = 120; a short settle then loop.
    durationInFrames: 130,
    fps: FPS,
    width: W,
    height: H,
  },
  "tooltip-example": {
    Component: TooltipExampleScene,
    code: tooltipExampleCode,
    // Tooltip hides at 100 + dur 8 = 108; cursor parks at 110; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
  },
  "progress-example": {
    Component: ProgressExampleScene,
    code: progressExampleCode,
    // Fill completes at 130 + dur 30 = 160; a short settle then loop.
    durationInFrames: 160,
    fps: FPS,
    width: W,
    height: H,
  },
  "skeleton-example": {
    Component: SkeletonExampleScene,
    code: skeletonExampleCode,
    // ~3 shimmer cycles (180), crossfade completes at 180 + 16 = 196; a short
    // settle on the revealed content then loop.
    durationInFrames: 220,
    fps: FPS,
    width: W,
    height: H,
  },
};
