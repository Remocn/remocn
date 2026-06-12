"use client";

import { useCurrentFrame } from "remotion";
import { revealCount } from "@/lib/remocn-ui";
import { Combobox } from "@/registry/remocn-ui/combobox";
import { useComboboxTransition } from "@/registry/remocn-ui/combobox/use-combobox-transition";
import { useSelectItemTransition } from "@/registry/remocn-ui/select-item/use-select-item-transition";

// Typing "ba" filters the default list ["Apple","Banana","Orange","Grape"] to ["Banana"].
const QUERY = "ba";
const TYPE_START = 32;
const FPS = 30;
const CPS = 4;

export const comboboxExampleControls = ["placeholder", "mode"] as const;

export interface ComboboxExampleProps {
  placeholder?: string;
  mode?: "light" | "dark";
}

export const ComboboxExampleScene = (p: ComboboxExampleProps = {}) => {
  const frame = useCurrentFrame();

  // Panel: opens at frame 16, closes at frame 100.
  const panelStyle = useComboboxTransition(
    [
      { at: 16, state: "opened", duration: 12 },
      { at: 100, state: "closed", duration: 12 },
    ],
    { mode: p.mode },
  );

  // Reveal "ba" character by character starting at frame 32.
  const revealed = revealCount(
    Math.max(0, frame - TYPE_START),
    FPS,
    QUERY.length,
    CPS,
  );

  // Animate the first row of the filtered list: idle → hover → press → selected.
  // Once "ba" is fully revealed, only Banana remains; row 0 of the filtered list.
  const itemStyle = useSelectItemTransition(
    [
      { at: 60, state: "hover",    duration: 8 },
      { at: 72, state: "press",    duration: 6 },
      { at: 80, state: "selected", duration: 8 },
    ],
    { mode: p.mode },
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Combobox
        style={panelStyle}
        query={QUERY}
        revealCount={revealed}
        itemStyles={[itemStyle]}
        placeholder={p.placeholder ?? "Select a fruit…"}
        mode={p.mode ?? "light"}
      />
    </div>
  );
};

export const comboboxExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const placeholder = values.placeholder as string | undefined;
  const mode = values.mode as string | undefined;

  const props: string[] = [];
  if (placeholder !== undefined && placeholder !== "Select a fruit…")
    props.push(`placeholder="${placeholder}"`);
  if (mode !== undefined && mode !== "light") props.push(`mode="${mode}"`);
  const extraProps = props.length ? `\n        ${props.join("\n        ")}` : "";

  const hookOpts: string[] = [];
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { useCurrentFrame } from "remotion";
import { revealCount } from "@/lib/remocn-ui";
import { Combobox } from "@/components/remocn/combobox";
import { useComboboxTransition } from "@/components/remocn/use-combobox-transition";
import { useSelectItemTransition } from "@/components/remocn/use-select-item-transition";

// Typing "ba" filters ["Apple","Banana","Orange","Grape"] to ["Banana"].
const QUERY = "ba";
const TYPE_START = 32;
const FPS = 30;
const CPS = 4;

export const Scene = () => {
  const frame = useCurrentFrame();

  // Panel opens at frame 16, closes at frame 100.
  const panelStyle = useComboboxTransition(
    [
      { at: 16, state: "opened", duration: 12 },
      { at: 100, state: "closed", duration: 12 },
    ]${optsStr},
  );

  // revealCount drives how many characters of QUERY are visible.
  const revealed = revealCount(
    Math.max(0, frame - TYPE_START),
    FPS,
    QUERY.length,
    CPS,
  );

  // Animate the first row of the filtered list once "ba" narrows it to Banana.
  const itemStyle = useSelectItemTransition(
    [
      { at: 60, state: "hover",    duration: 8 },
      { at: 72, state: "press",    duration: 6 },
      { at: 80, state: "selected", duration: 8 },
    ]${optsStr},
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Combobox${extraProps}
        style={panelStyle}
        query={QUERY}
        revealCount={revealed}
        itemStyles={[itemStyle]}
      />
    </div>
  );
};`;
};
