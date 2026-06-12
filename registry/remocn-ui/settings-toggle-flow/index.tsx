"use client";

import { Button } from "@/components/remocn/button";
import { useButtonTransition } from "@/components/remocn/use-button-transition";
import { Cursor } from "@/components/remocn/cursor";
import { useCursorPath } from "@/components/remocn/use-cursor-path";
import { Select } from "@/components/remocn/select";
import { useSelectTransition } from "@/components/remocn/use-select-transition";
import { useSelectItemTransition } from "@/components/remocn/use-select-item-transition";
import { Slider } from "@/components/remocn/slider";
import { useSliderTransition } from "@/components/remocn/use-slider-transition";
import { Switch } from "@/components/remocn/switch";
import { useSwitchTransition } from "@/components/remocn/use-switch-transition";
import { Toast } from "@/components/remocn/toast";
import { useToastTransition } from "@/components/remocn/use-toast-transition";
import { useBlurInTransition } from "@/components/remocn/use-blur-in-transition";
import { type RemocnTheme, useRemocnTheme } from "@/lib/remocn-ui";

const DEFAULT_ROWS = [
  { label: "Notifications" },
  { label: "Theme" },
  { label: "Volume" },
];
const DEFAULT_SELECT_ITEMS = ["System", "Light", "Dark"];

const LEFT_X = 320;
const RIGHT_X = 700;
const COL_W = 300;

const NOTIF_LABEL_Y = 196;
const SWITCH_TOP = 222;
const SWITCH_W = 44;
const SWITCH_H = 28;
const SWITCH_CX = RIGHT_X + SWITCH_W / 2;
const SWITCH_CY = SWITCH_TOP + SWITCH_H / 2;

const THEME_LABEL_Y = 280;
const SELECT_W = 260;
const TRIGGER_TOP = 320;
const TRIGGER_H = 40;
const TRIGGER_CX = RIGHT_X + SELECT_W / 2;
const TRIGGER_CY = TRIGGER_TOP + TRIGGER_H / 2;
const ITEM_CX = TRIGGER_CX;
const PANEL_TOP = TRIGGER_TOP + TRIGGER_H + 6;
const PANEL_PAD = 4;
const ITEM_H = 33;
const ITEM_GAP = 2;

const VOL_LABEL_Y = 380;
const SLIDER_TOP = 400;
const SLIDER_W = 260;
const SLIDER_H = 16;
const SLIDER_CY = SLIDER_TOP + SLIDER_H / 2;
const SLIDER_X0 = RIGHT_X;
const THUMB_X_AT_20 = SLIDER_X0 + 0.2 * SLIDER_W;
const THUMB_X_AT_80 = SLIDER_X0 + 0.8 * SLIDER_W;

const SAVE_W = 160;
const SAVE_LEFT = RIGHT_X + SELECT_W - SAVE_W;
const SAVE_TOP = 544;
const SAVE_H = 40;
const SAVE_CX = SAVE_LEFT + SAVE_W / 2;
const SAVE_CY = SAVE_TOP + SAVE_H / 2;

const CARD_PAD = 44;
const CARD_LEFT = LEFT_X - CARD_PAD;
const CARD_TOP = NOTIF_LABEL_Y - CARD_PAD;
const CARD_W = RIGHT_X + SELECT_W + CARD_PAD - CARD_LEFT;
const CARD_H = SAVE_TOP + SAVE_H + CARD_PAD - CARD_TOP;

const DEMO = 44;

export interface SettingsToggleFlowProps {
  title?: string;
  description?: string;
  rows?: { label: string }[];
  selectItems?: string[];
  saveLabel?: string;
  toastTitle?: string;
  mode?: "light" | "dark";
  theme?: Partial<RemocnTheme>;
}

export function SettingsToggleFlow({
  title = "Notification settings",
  description = "Manage how you receive alerts, set your theme, and tune the volume.",
  rows = DEFAULT_ROWS,
  selectItems = DEFAULT_SELECT_ITEMS,
  saveLabel = "Save settings",
  toastTitle = "Settings saved",
  mode = "light",
  theme,
}: SettingsToggleFlowProps) {
  const resolved = useRemocnTheme(theme, mode);
  const opts = { mode, theme };

  const lastItem = selectItems.length - 1;
  const ITEM_CY =
    PANEL_TOP + PANEL_PAD + lastItem * (ITEM_H + ITEM_GAP) + ITEM_H / 2;

  const cardEnter = useBlurInTransition(
    [{ at: 0, state: "revealed", duration: 18 }],
    { distance: 0 },
  );
  const enterHeader = useBlurInTransition([
    { at: 18, state: "revealed", duration: 16 },
  ]);
  const enterSwitch = useBlurInTransition([
    { at: 24, state: "revealed", duration: 16 },
  ]);
  const enterTheme = useBlurInTransition([
    { at: 30, state: "revealed", duration: 16 },
  ]);
  const enterVolume = useBlurInTransition([
    { at: 36, state: "revealed", duration: 16 },
  ]);
  const enterSave = useBlurInTransition([
    { at: 42, state: "revealed", duration: 16 },
  ]);

  const reveal = (e: { opacity: number; blur: number; translateX: number; translateY: number }) => ({
    opacity: e.opacity,
    filter: e.blur > 0 ? `blur(${e.blur}px)` : "none",
    transform: `translate(${e.translateX}px, ${e.translateY}px)`,
  });

  const cursorStyle = useCursorPath([
    { at: 0, x: 220, y: 130 },
    { at: 24 + DEMO, x: SWITCH_CX, y: SWITCH_CY, duration: 20 },
    { at: 24 + DEMO, x: SWITCH_CX, y: SWITCH_CY, click: true, duration: 0 },
    { at: 55 + DEMO, x: TRIGGER_CX, y: TRIGGER_CY, duration: 22 },
    { at: 55 + DEMO, x: TRIGGER_CX, y: TRIGGER_CY, click: true, duration: 0 },
    { at: 80 + DEMO, x: ITEM_CX, y: ITEM_CY, duration: 18 },
    { at: 80 + DEMO, x: ITEM_CX, y: ITEM_CY, click: true, duration: 0 },
    { at: 105 + DEMO, x: THUMB_X_AT_20, y: SLIDER_CY, duration: 18 },
    { at: 105 + DEMO, x: THUMB_X_AT_20, y: SLIDER_CY, press: true, duration: 0 },
    { at: 150 + DEMO, x: THUMB_X_AT_80, y: SLIDER_CY, press: true, duration: 45 },
    { at: 158 + DEMO, x: THUMB_X_AT_80, y: SLIDER_CY, duration: 0 },
    { at: 180 + DEMO, x: SAVE_CX, y: SAVE_CY, duration: 18 },
    { at: 180 + DEMO, x: SAVE_CX, y: SAVE_CY, click: true, duration: 0 },
  ]);

  const switchStyle = useSwitchTransition(
    [{ at: 24 + DEMO, state: "checked", duration: 12 }],
    opts,
  );

  const panelStyle = useSelectTransition(
    [
      { at: 55 + DEMO, state: "opened", duration: 14 },
      { at: 90 + DEMO, state: "closed", duration: 12 },
    ],
    opts,
  );

  const triggerStyle = useButtonTransition(
    [
      { at: 45 + DEMO, state: "hover", duration: 8 },
      { at: 55 + DEMO, state: "press", duration: 8 },
    ],
    { variant: "outline", ...opts },
  );

  const itemStyle = useSelectItemTransition(
    [
      { at: 68 + DEMO, state: "hover", duration: 8 },
      { at: 78 + DEMO, state: "press", duration: 6 },
      { at: 80 + DEMO, state: "selected", duration: 10 },
    ],
    opts,
  );

  const sliderStyle = useSliderTransition([
    { at: 0, value: 20, thumbState: "idle" },
    { at: 105 + DEMO, thumbState: "press", duration: 6 },
    { at: 105 + DEMO, value: 20 },
    { at: 150 + DEMO, value: 80, duration: 45, easing: "inOut" },
    { at: 158 + DEMO, thumbState: "idle", duration: 8 },
  ]);

  const saveStyle = useButtonTransition(
    [
      { at: 172 + DEMO, state: "hover", duration: 8 },
      { at: 180 + DEMO, state: "press", duration: 6 },
      { at: 188 + DEMO, state: "success", duration: 14 },
    ],
    opts,
  );

  const toastStyle = useToastTransition(
    [
      { at: 196 + DEMO, state: "visible", duration: 12 },
      { at: 256 + DEMO, state: "hidden", duration: 12 },
    ],
    { mode },
  );

  const rowLabelStyle = {
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: "-0.01em",
    color: resolved.foreground,
  } as const;

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background: resolved.muted,
        fontFamily:
          "var(--font-geist-sans), -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {}
      <div
        style={{
          position: "absolute",
          left: CARD_LEFT,
          top: CARD_TOP,
          width: CARD_W,
          height: CARD_H,
          boxSizing: "border-box",
          background: resolved.background,
          border: `1px solid ${resolved.border}`,
          borderRadius: 16,
          boxShadow:
            "0 10px 30px -12px rgba(0,0,0,0.22), 0 2px 8px -3px rgba(0,0,0,0.10)",
          opacity: cardEnter.opacity,
          filter: cardEnter.blur > 0 ? `blur(${cardEnter.blur}px)` : "none",
        }}
      />

      {}
      <div
        style={{
          position: "absolute",
          left: LEFT_X,
          top: NOTIF_LABEL_Y,
          width: COL_W,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          ...reveal(enterHeader),
        }}
      >
        <div
          style={{
            fontSize: 22,
            lineHeight: "28px",
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: resolved.foreground,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 14,
            lineHeight: "22px",
            color: resolved.mutedForeground,
          }}
        >
          {description}
        </div>
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: RIGHT_X,
          top: NOTIF_LABEL_Y,
          ...rowLabelStyle,
          ...reveal(enterSwitch),
        }}
      >
        {rows[0]?.label ?? "Notifications"}
      </div>
      <div
        style={{
          position: "absolute",
          left: RIGHT_X,
          top: SWITCH_TOP,
          width: SWITCH_W,
          height: SWITCH_H,
          ...reveal(enterSwitch),
        }}
      >
        <Switch style={switchStyle} mode={mode} theme={theme} />
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: RIGHT_X,
          top: VOL_LABEL_Y,
          ...rowLabelStyle,
          ...reveal(enterVolume),
        }}
      >
        {rows[2]?.label ?? "Volume"}
      </div>
      <div
        style={{
          position: "absolute",
          left: SLIDER_X0,
          top: SLIDER_TOP,
          ...reveal(enterVolume),
        }}
      >
        <Slider style={sliderStyle} width={SLIDER_W} mode={mode} theme={theme} />
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: RIGHT_X,
          top: THEME_LABEL_Y,
          ...rowLabelStyle,
          ...reveal(enterTheme),
        }}
      >
        {rows[1]?.label ?? "Theme"}
      </div>
      <div
        style={{
          position: "absolute",
          left: RIGHT_X,
          top: TRIGGER_TOP,
          width: SELECT_W,
          height: TRIGGER_H,
          ...reveal(enterTheme),
        }}
      >
        <Select
          style={panelStyle}
          label={selectItems[0] ?? "System"}
          items={selectItems}
          triggerStyle={triggerStyle}
          itemStyles={selectItems.map((_, i) =>
            i === selectItems.length - 1 ? itemStyle : undefined,
          )}
          mode={mode}
          theme={theme}
        />
      </div>

      {}
      <div
        style={{
          position: "absolute",
          left: SAVE_LEFT,
          top: SAVE_TOP,
          width: SAVE_W,
          height: SAVE_H,
          ...reveal(enterSave),
        }}
      >
        <Button label={saveLabel} style={saveStyle} mode={mode} theme={theme} />
      </div>

      {}
      <div style={{ position: "absolute", right: 24, bottom: 24 }}>
        <Toast
          style={toastStyle}
          title={toastTitle}
          variant="success"
          mode={mode}
          theme={theme}
        />
      </div>

      <Cursor style={cursorStyle} variant="pointer" mode={mode} theme={theme} />
    </div>
  );
}
