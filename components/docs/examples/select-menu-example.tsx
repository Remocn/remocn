"use client";

import {
  SelectMenu,
  type SelectMenuVariant,
} from "@/registry/remocn-ui/select-menu";
import { useSelectMenuTransition } from "@/registry/remocn-ui/select-menu/use-select-menu-transition";

const DEFAULT_OPTIONS = ["New Game", "Continue", "Settings", "Quit"];

const GLIDE_DUR = 12;
const GLIDE_GAP = 20;
const REST_AFTER_ARRIVAL = 6;
const CLICK_DUR = 14;
const SELECTED_HOLD = 20;
const DECAY_DUR = 8;

const clampIndex = (i: number): number =>
  Math.max(0, Math.min(DEFAULT_OPTIONS.length - 1, Math.round(i)));

function buildMenuTimeline(selectedIndex: number) {
  const index = clampIndex(selectedIndex);
  const steps: { at: number; state: string; duration: number }[] = [
    { at: 0, state: DEFAULT_OPTIONS[0], duration: GLIDE_DUR },
  ];
  for (let i = 1; i <= index; i++) {
    steps.push({
      at: i * GLIDE_GAP,
      state: DEFAULT_OPTIONS[i],
      duration: GLIDE_DUR,
    });
  }
  const arrival = index * GLIDE_GAP + GLIDE_DUR;
  const clickAt = arrival + REST_AFTER_ARRIVAL;
  // Decay completes first, then the indicator snaps back to row 0.
  const resetAt = clickAt + CLICK_DUR + SELECTED_HOLD + DECAY_DUR;
  steps.push({ at: resetAt, state: DEFAULT_OPTIONS[0], duration: 0 });
  return { steps, clickAt, loop: resetAt };
}

export const selectMenuExampleControls = ["selectedIndex", "variant"] as const;

export type SelectMenuExampleValues = {
  selectedIndex?: number;
  variant?: string;
};

export const SelectMenuExampleScene = ({
  selectedIndex = 1,
  variant = "soft",
}: SelectMenuExampleValues) => {
  const v = variant as SelectMenuVariant;
  const { steps, clickAt } = buildMenuTimeline(selectedIndex);

  const style = useSelectMenuTransition(steps, {
    variant: v,
    clickAt,
    clickDuration: CLICK_DUR,
    hold: SELECTED_HOLD,
    decayDuration: DECAY_DUR,
  });

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <SelectMenu style={style} options={DEFAULT_OPTIONS} variant={v} />
    </div>
  );
};

export const selectMenuExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const selectedIndex = clampIndex((values.selectedIndex as number) ?? 1);
  const variant = (values.variant as SelectMenuVariant) ?? "soft";
  const { steps, clickAt } = buildMenuTimeline(selectedIndex);

  const stepLines = steps
    .map(
      (s) =>
        `    { at: ${s.at}, state: "${s.state}", duration: ${s.duration} },`,
    )
    .join("\n");

  const props: string[] = [];
  if (variant !== "soft") props.push(`    variant="${variant}"`);
  const extraProps = props.length ? `\n${props.join("\n")}` : "";

  return `import { SelectMenu } from "@/components/remocn/select-menu";
import { useSelectMenuTransition } from "@/components/remocn/use-select-menu-transition";

export const Scene = () => {
  // Glides down to the selected option, clicks it (press + check mark), holds,
  // then instantly jumps back to the first option for a clean restart.
  const style = useSelectMenuTransition([
${stepLines}
  ], { clickAt: ${clickAt}, hold: ${SELECTED_HOLD}, decayDuration: ${DECAY_DUR} });

  return (
    <SelectMenu
      style={style}${extraProps}
    />
  );
};`;
};
