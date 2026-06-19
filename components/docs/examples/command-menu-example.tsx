"use client";

import { useCurrentFrame } from "remotion";
import { revealCount } from "@/lib/remocn-ui";
import { CommandMenu, filterCommandItems } from "@/registry/remocn-ui/command-menu";
import { useCommandMenuTransition } from "@/registry/remocn-ui/command-menu/use-command-menu-transition";
import { useCommandMenuItemTransition } from "@/registry/remocn-ui/command-menu-item/use-command-menu-item-transition";

// Full query that gets typed out character by character.
const QUERY = "settings";
// Typing starts at this frame; 8 chars at 4 cps @ 30fps = 60 frames.
const TYPE_START = 20;
const FPS = 30;
const CPS = 4;

export const commandMenuExampleControls = [] as const;

export interface CommandMenuExampleProps {}

export const CommandMenuExampleScene = (_p: CommandMenuExampleProps = {}) => {
  const frame = useCurrentFrame();

  // Panel: closed → opened at frame 16, then closed again at frame 108.
  const panelStyle = useCommandMenuTransition([
    { at: 16, state: "opened", duration: 16 },
    { at: 108, state: "closed", duration: 12 },
  ]);

  // Reveal query characters from TYPE_START onward.
  const revealed = revealCount(
    Math.max(0, frame - TYPE_START),
    FPS,
    QUERY.length,
    CPS,
  );

  // The filtered list shrinks as more characters are revealed. We animate the
  // first row of the filtered list (which becomes "Settings" once "set" is typed).
  const itemStyle = useCommandMenuItemTransition([
    { at: 84, state: "hover",    duration: 8 },
    { at: 92, state: "press",    duration: 6 },
    { at: 100, state: "selected", duration: 8 },
  ]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CommandMenu
        style={panelStyle}
        query={QUERY}
        revealCount={revealed}
        itemStyles={[itemStyle]}
      />
    </div>
  );
};

export const commandMenuExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const extraProps = "";
  const optsStr = "";

  return `import { useCurrentFrame } from "remotion";
import { revealCount } from "@/lib/remocn-ui";
import { CommandMenu } from "@/components/remocn/command-menu";
import { useCommandMenuTransition } from "@/components/remocn/use-command-menu-transition";
import { useCommandMenuItemTransition } from "@/components/remocn/use-command-menu-item-transition";

const QUERY = "settings";
const TYPE_START = 20;
const FPS = 30;
const CPS = 4;

export const Scene = () => {
  const frame = useCurrentFrame();

  // Panel zooms in, holds while query is typed and a row is selected, then closes.
  const panelStyle = useCommandMenuTransition(
    [
      { at: 16, state: "opened", duration: 16 },
      { at: 108, state: "closed", duration: 12 },
    ]${optsStr},
  );

  // revealCount drives how many characters of QUERY are visible — the component
  // filters the list as more characters appear.
  const revealed = revealCount(
    Math.max(0, frame - TYPE_START),
    FPS,
    QUERY.length,
    CPS,
  );

  // Animate the first row of the filtered list: idle → hover → press → selected.
  const itemStyle = useCommandMenuItemTransition(
    [
      { at: 84, state: "hover",    duration: 8 },
      { at: 92, state: "press",    duration: 6 },
      { at: 100, state: "selected", duration: 8 },
    ]${optsStr},
  );

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <CommandMenu${extraProps}
        style={panelStyle}
        query={QUERY}
        revealCount={revealed}
        itemStyles={[itemStyle]}
      />
    </div>
  );
};`;
};
