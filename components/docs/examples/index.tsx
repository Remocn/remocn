import type { ComponentType } from "react";
import { FPS, H, W } from "@/lib/customizer-config";
import type { BackdropFill } from "@/registry/remocn/backdrop";
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
  MessageBubbleExampleScene,
  messageBubbleExampleCode,
} from "./message-bubble-example";
import {
  TypingIndicatorExampleScene,
  typingIndicatorExampleCode,
} from "./typing-indicator-example";
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
import {
  SliderExampleScene,
  sliderExampleCode,
} from "./slider-example";
import {
  ComboboxExampleScene,
  comboboxExampleCode,
} from "./combobox-example";
import {
  PopoverExampleScene,
  popoverExampleCode,
} from "./popover-example";
import {
  ContextMenuExampleScene,
  contextMenuExampleCode,
} from "./context-menu-example";
import {
  ToggleGroupExampleScene,
  toggleGroupExampleCode,
} from "./toggle-group-example";
import {
  StepperExampleScene,
  stepperExampleCode,
} from "./stepper-example";
import {
  ResizableExampleScene,
  resizableExampleCode,
} from "./resizable-example";
import { BlurInExampleScene, blurInExampleCode } from "./blur-in-example";
import {
  FadeThroughExampleScene,
  fadeThroughExampleCode,
} from "./fade-through-example";
import {
  SharedAxisYExampleScene,
  sharedAxisYExampleCode,
} from "./shared-axis-y-example";
import {
  SharedAxisZExampleScene,
  sharedAxisZExampleCode,
} from "./shared-axis-z-example";
import {
  PerWordCrossfadeExampleScene,
  perWordCrossfadeExampleCode,
} from "./per-word-crossfade-example";

export interface ExampleEntry {
  Component: ComponentType;
  /**
   * Vestigial after the LiveExample → UiComponentPreview migration. The Code tab
   * now sources its template from `UI_SCENE_META[name].code` (the scene's own
   * `…ExampleCode` function), so nothing reads this field anymore — it is kept
   * only to avoid churn across all 26 entries. Safe to drop in a later cleanup.
   * Migrated entries hold a function template; any legacy entry holds a string.
   */
  code: string | ((values: Record<string, unknown>) => string);
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  previewBackdrop?: BackdropFill;
}

export const examples: Record<string, ExampleEntry> = {
  "button-example": {
    Component: ButtonExampleScene,
    code: buttonExampleCode,
    durationInFrames: 132,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "accordion-example": {
    Component: AccordionExampleScene,
    code: accordionExampleCode,
    // Last transition (close) completes at frame 90; a short settle then loop.
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "alert-dialog-example": {
    Component: AlertDialogExampleScene,
    code: alertDialogExampleCode,
    // Dialog closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "dialog-example": {
    Component: DialogExampleScene,
    code: dialogExampleCode,
    // Dialog closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "sheet-example": {
    Component: SheetExampleScene,
    code: sheetExampleCode,
    // Sheet closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "drawer-example": {
    Component: DrawerExampleScene,
    code: drawerExampleCode,
    // Drawer closes at 92 + dur 12 = 104; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "checkbox-example": {
    Component: CheckboxExampleScene,
    code: checkboxExampleCode,
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "radio-example": {
    Component: RadioExampleScene,
    code: radioExampleCode,
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "switch-example": {
    Component: SwitchExampleScene,
    code: switchExampleCode,
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "input-example": {
    Component: InputExampleScene,
    code: inputExampleCode,
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "select-example": {
    Component: SelectExampleScene,
    code: selectExampleCode,
    // Panel closes at 96 + dur 12 = 108; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "dropdown-menu-example": {
    Component: DropdownMenuExampleScene,
    code: dropdownMenuExampleCode,
    // Panel closes at 96 + dur 12 = 108; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "tabs-example": {
    Component: TabsExampleScene,
    code: tabsExampleCode,
    // Settings transition completes at 94 + dur 12 = 106; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "cursor-example": {
    Component: CursorExampleScene,
    code: cursorExampleCode,
    // success transition completes at 108 + dur 16 = 124; a short settle then loop.
    durationInFrames: 140,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "toast-example": {
    Component: ToastExampleScene,
    code: toastExampleCode,
    // Toast dismiss completes at 144 + dur 12 = 156; a short settle then loop.
    durationInFrames: 170,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "message-bubble-example": {
    Component: MessageBubbleExampleScene,
    code: messageBubbleExampleCode,
    // Bubble reveal 16 + reaction pop ~44 + settle, then loop.
    durationInFrames: 90,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "typing-indicator-example": {
    Component: TypingIndicatorExampleScene,
    code: typingIndicatorExampleCode,
    // Continuous loop; one bounce cycle is ~27 frames at 1.1 cps.
    durationInFrames: 90,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "command-menu-example": {
    Component: CommandMenuExampleScene,
    code: commandMenuExampleCode,
    // Panel closes at 108 + dur 12 = 120; a short settle then loop.
    durationInFrames: 130,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "tooltip-example": {
    Component: TooltipExampleScene,
    code: tooltipExampleCode,
    // Tooltip hides at 100 + dur 8 = 108; cursor parks at 110; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "progress-example": {
    Component: ProgressExampleScene,
    code: progressExampleCode,
    // Fill completes at 130 + dur 30 = 160; a short settle then loop.
    durationInFrames: 160,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
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
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "slider-example": {
    Component: SliderExampleScene,
    code: sliderExampleCode,
    // Drag completes at 100; thumb releases at 108; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "combobox-example": {
    Component: ComboboxExampleScene,
    code: comboboxExampleCode,
    // Panel closes at 100 + dur 12 = 112; a short settle then loop.
    durationInFrames: 120,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "popover-example": {
    Component: PopoverExampleScene,
    code: popoverExampleCode,
    // Popover closes at 100 + dur 10 = 110; cursor parks at 110; short settle then loop.
    durationInFrames: 130,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "context-menu-example": {
    Component: ContextMenuExampleScene,
    code: contextMenuExampleCode,
    // Cursor selects row 1, menu closes at 102, cursor leaves (arrives 104+20=124);
    // a short settle then loop.
    durationInFrames: 135,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "toggle-group-example": {
    Component: ToggleGroupExampleScene,
    code: toggleGroupExampleCode,
    // Second toggle completes at 92 + dur 14 = 106; a short settle then loop.
    durationInFrames: 115,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "stepper-example": {
    Component: StepperExampleScene,
    code: stepperExampleCode,
    // Final step (index 2) ease completes at 110 + 24 = 134; a short settle then loop.
    durationInFrames: 150,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "resizable-example": {
    Component: ResizableExampleScene,
    code: resizableExampleCode,
    // Sweep right→left→center ends at 176; handle idle at 184+8=192; settle then loop.
    durationInFrames: 205,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "oklch(1 0 0)" },
  },
  "blur-in-example": {
    Component: BlurInExampleScene,
    code: blurInExampleCode,
    // Reveal completes at 8 + dur 18 = 26; a short settle then loop.
    durationInFrames: 40,
    fps: FPS,
    width: W,
    height: H,
  },
  "fade-through-example": {
    Component: FadeThroughExampleScene,
    code: fadeThroughExampleCode,
    // Two chained A→B transitions, 40 frames each — tight delay for a dynamic feel.
    durationInFrames: 80,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "#ffffff" },
  },
  "shared-axis-y-example": {
    Component: SharedAxisYExampleScene,
    code: sharedAxisYExampleCode,
    // Two chained A→B transitions, 40 frames each — tight delay for a dynamic feel.
    durationInFrames: 80,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "#ffffff" },
  },
  "shared-axis-z-example": {
    Component: SharedAxisZExampleScene,
    code: sharedAxisZExampleCode,
    // Two chained A→B transitions, 40 frames each — tight delay for a dynamic feel.
    durationInFrames: 80,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "#ffffff" },
  },
  "per-word-crossfade-example": {
    Component: PerWordCrossfadeExampleScene,
    code: perWordCrossfadeExampleCode,
    // Two chained A→B transitions, 50 frames each — slower enter needs a touch more room.
    durationInFrames: 100,
    fps: FPS,
    width: W,
    height: H,
    previewBackdrop: { type: "color", value: "#ffffff" },
  },
};
