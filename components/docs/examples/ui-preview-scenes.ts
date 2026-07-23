import type { ComponentType } from "react";
import { FPS, H, W } from "@/lib/customizer-config";
import type { BackdropFill } from "@/registry/remocn/backdrop";

/**
 * Code-splitting source for `UiComponentPreview`. The preview renders ONE
 * component (`name`) but previously reached it through the `./examples` barrel
 * plus 28 direct `import { …ExampleCode, …ExampleControls }` statements — every
 * `/docs/ui/components/*` page therefore shipped the JS of ALL 28 scenes.
 *
 * Here the heavy part of each scene (the Remotion `…ExampleScene` component,
 * its honored-control list, and its code template) sits behind a `() => import`
 * so only the requested component's chunk is fetched. Timing metadata is tiny
 * (four numbers + a backdrop) so it stays eager in `UI_PREVIEW_TIMING`.
 *
 * Adding a UI component = one line in `UI_PREVIEW_TIMING` + one line in
 * `UI_SCENE_LOADERS`. The numbers here mirror the ui-tier entries in
 * `./examples/index.tsx` (still the source for the `ComponentExample` path);
 * keep the two in sync when a scene's duration changes.
 */

export interface UiPreviewTiming {
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  previewBackdrop?: BackdropFill;
}

export interface LoadedUiScene {
  Scene: ComponentType;
  /** Function template emitting timeline code for the honored props. */
  code: (values: Record<string, unknown>) => string;
  /** Honored control keys (visible knobs); everything else is timeline-owned. */
  controls: readonly string[];
}

const WHITE: BackdropFill = { type: "color", value: "oklch(1 0 0)" };

const timing = (
  durationInFrames: number,
  previewBackdrop?: BackdropFill,
): UiPreviewTiming => ({
  durationInFrames,
  fps: FPS,
  width: W,
  height: H,
  previewBackdrop,
});

export const UI_PREVIEW_TIMING: Record<string, UiPreviewTiming> = {
  accordion: timing(100, WHITE),
  "alert-dialog": timing(120, WHITE),
  "blur-in": timing(40),
  button: timing(132, WHITE),
  checkbox: timing(100, WHITE),
  combobox: timing(120, WHITE),
  "command-menu": timing(130, WHITE),
  "context-menu": timing(135, WHITE),
  cursor: timing(140, WHITE),
  dialog: timing(120, WHITE),
  drawer: timing(120, WHITE),
  "dropdown-menu": timing(120, WHITE),
  input: timing(120, WHITE),
  "message-bubble": timing(90, WHITE),
  popover: timing(130, WHITE),
  progress: timing(160, WHITE),
  radio: timing(100, WHITE),
  resizable: timing(205, WHITE),
  select: timing(120, WHITE),
  sheet: timing(120, WHITE),
  skeleton: timing(220, WHITE),
  slider: timing(120, WHITE),
  stepper: timing(150, WHITE),
  switch: timing(100, WHITE),
  tabs: timing(120, WHITE),
  toast: timing(170, WHITE),
  "toggle-group": timing(115, WHITE),
  tooltip: timing(120, WHITE),
  "typing-indicator": timing(90, WHITE),
};

export const UI_SCENE_LOADERS: Record<string, () => Promise<LoadedUiScene>> = {
  accordion: () =>
    import("./accordion-example").then((m) => ({
      Scene: m.AccordionExampleScene,
      code: m.accordionExampleCode,
      controls: m.accordionExampleControls,
    })),
  "alert-dialog": () =>
    import("./alert-dialog-example").then((m) => ({
      Scene: m.AlertDialogExampleScene,
      code: m.alertDialogExampleCode,
      controls: m.alertDialogExampleControls,
    })),
  "blur-in": () =>
    import("./blur-in-example").then((m) => ({
      Scene: m.BlurInExampleScene,
      code: m.blurInExampleCode,
      controls: m.blurInExampleControls,
    })),
  button: () =>
    import("./button-example").then((m) => ({
      Scene: m.ButtonExampleScene,
      code: m.buttonExampleCode,
      controls: m.buttonExampleControls,
    })),
  checkbox: () =>
    import("./checkbox-example").then((m) => ({
      Scene: m.CheckboxExampleScene,
      code: m.checkboxExampleCode,
      controls: m.checkboxExampleControls,
    })),
  combobox: () =>
    import("./combobox-example").then((m) => ({
      Scene: m.ComboboxExampleScene,
      code: m.comboboxExampleCode,
      controls: m.comboboxExampleControls,
    })),
  "command-menu": () =>
    import("./command-menu-example").then((m) => ({
      Scene: m.CommandMenuExampleScene,
      code: m.commandMenuExampleCode,
      controls: m.commandMenuExampleControls,
    })),
  "context-menu": () =>
    import("./context-menu-example").then((m) => ({
      Scene: m.ContextMenuExampleScene,
      code: m.contextMenuExampleCode,
      controls: m.contextMenuExampleControls,
    })),
  cursor: () =>
    import("./cursor-example").then((m) => ({
      Scene: m.CursorExampleScene,
      code: m.cursorExampleCode,
      controls: m.cursorExampleControls,
    })),
  dialog: () =>
    import("./dialog-example").then((m) => ({
      Scene: m.DialogExampleScene,
      code: m.dialogExampleCode,
      controls: m.dialogExampleControls,
    })),
  drawer: () =>
    import("./drawer-example").then((m) => ({
      Scene: m.DrawerExampleScene,
      code: m.drawerExampleCode,
      controls: m.drawerExampleControls,
    })),
  "dropdown-menu": () =>
    import("./dropdown-menu-example").then((m) => ({
      Scene: m.DropdownMenuExampleScene,
      code: m.dropdownMenuExampleCode,
      controls: m.dropdownMenuExampleControls,
    })),
  input: () =>
    import("./input-example").then((m) => ({
      Scene: m.InputExampleScene,
      code: m.inputExampleCode,
      controls: m.inputExampleControls,
    })),
  "message-bubble": () =>
    import("./message-bubble-example").then((m) => ({
      Scene: m.MessageBubbleExampleScene,
      code: m.messageBubbleExampleCode,
      controls: m.messageBubbleExampleControls,
    })),
  popover: () =>
    import("./popover-example").then((m) => ({
      Scene: m.PopoverExampleScene,
      code: m.popoverExampleCode,
      controls: m.popoverExampleControls,
    })),
  progress: () =>
    import("./progress-example").then((m) => ({
      Scene: m.ProgressExampleScene,
      code: m.progressExampleCode,
      controls: m.progressExampleControls,
    })),
  radio: () =>
    import("./radio-example").then((m) => ({
      Scene: m.RadioExampleScene,
      code: m.radioExampleCode,
      controls: m.radioExampleControls,
    })),
  resizable: () =>
    import("./resizable-example").then((m) => ({
      Scene: m.ResizableExampleScene,
      code: m.resizableExampleCode,
      controls: m.resizableExampleControls,
    })),
  select: () =>
    import("./select-example").then((m) => ({
      Scene: m.SelectExampleScene,
      code: m.selectExampleCode,
      controls: m.selectExampleControls,
    })),
  sheet: () =>
    import("./sheet-example").then((m) => ({
      Scene: m.SheetExampleScene,
      code: m.sheetExampleCode,
      controls: m.sheetExampleControls,
    })),
  skeleton: () =>
    import("./skeleton-example").then((m) => ({
      Scene: m.SkeletonExampleScene,
      code: m.skeletonExampleCode,
      controls: m.skeletonExampleControls,
    })),
  slider: () =>
    import("./slider-example").then((m) => ({
      Scene: m.SliderExampleScene,
      code: m.sliderExampleCode,
      controls: m.sliderExampleControls,
    })),
  stepper: () =>
    import("./stepper-example").then((m) => ({
      Scene: m.StepperExampleScene,
      code: m.stepperExampleCode,
      controls: m.stepperExampleControls,
    })),
  switch: () =>
    import("./switch-example").then((m) => ({
      Scene: m.SwitchExampleScene,
      code: m.switchExampleCode,
      controls: m.switchExampleControls,
    })),
  tabs: () =>
    import("./tabs-example").then((m) => ({
      Scene: m.TabsExampleScene,
      code: m.tabsExampleCode,
      controls: m.tabsExampleControls,
    })),
  toast: () =>
    import("./toast-example").then((m) => ({
      Scene: m.ToastExampleScene,
      code: m.toastExampleCode,
      controls: m.toastExampleControls,
    })),
  "toggle-group": () =>
    import("./toggle-group-example").then((m) => ({
      Scene: m.ToggleGroupExampleScene,
      code: m.toggleGroupExampleCode,
      controls: m.toggleGroupExampleControls,
    })),
  tooltip: () =>
    import("./tooltip-example").then((m) => ({
      Scene: m.TooltipExampleScene,
      code: m.tooltipExampleCode,
      controls: m.tooltipExampleControls,
    })),
  "typing-indicator": () =>
    import("./typing-indicator-example").then((m) => ({
      Scene: m.TypingIndicatorExampleScene,
      code: m.typingIndicatorExampleCode,
      controls: m.typingIndicatorExampleControls,
    })),
};

const sceneCache = new Map<string, Promise<LoadedUiScene>>();

/**
 * Cached module loader for `use()` — returns the SAME promise per name so the
 * hook resolves synchronously after the first suspend instead of re-fetching.
 */
export function loadUiScene(name: string): Promise<LoadedUiScene> {
  let promise = sceneCache.get(name);
  if (!promise) {
    promise = UI_SCENE_LOADERS[name]();
    sceneCache.set(name, promise);
  }
  return promise;
}
