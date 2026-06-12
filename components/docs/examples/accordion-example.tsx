"use client";

import { Accordion } from "@/registry/remocn-ui/accordion";
import { useAccordionTransition } from "@/registry/remocn-ui/accordion/use-accordion-transition";

export const accordionExampleControls = [
  "title", "content", "variant", "mode",
] as const;

export interface AccordionExampleProps {
  title?: string;
  content?: string;
  variant?: "default" | "ghost";
  mode?: "light" | "dark";
}

export const AccordionExampleScene = (p: AccordionExampleProps = {}) => {
  // Forward honored color props into the hook so the interpolated card
  // background tracks variant/mode — otherwise the baked light background wins
  // (via `style` precedence) and dark mode leaves a white card.
  const style = useAccordionTransition(
    [
      { at: 18, state: "opened", duration: 16 },
      { at: 78, state: "closed", duration: 12 },
    ],
    { variant: p.variant, mode: p.mode },
  );
  return (
    <Accordion
      title={p.title ?? "Is it accessible?"}
      content={p.content ?? "Yes. It adheres to the WAI-ARIA design pattern."}
      variant={p.variant ?? "default"}
      mode={p.mode ?? "light"}
      style={style}
    />
  );
};

export const accordionExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const title = values.title as string | undefined;
  const content = values.content as string | undefined;
  const variant = values.variant as string | undefined;
  const mode = values.mode as string | undefined;

  const props: string[] = [];
  if (title !== undefined && title !== "Is it accessible?")
    props.push(`title="${title}"`);
  if (
    content !== undefined &&
    content !== "Yes. It adheres to the WAI-ARIA design pattern."
  )
    props.push(`content="${content}"`);
  if (variant !== undefined && variant !== "default")
    props.push(`variant="${variant}"`);
  if (mode !== undefined && mode !== "light") props.push(`mode="${mode}"`);

  const propsStr = props.length ? `\n      ${props.join("\n      ")}\n    ` : "";

  // variant/mode are also forwarded into the hook so the animated card bg tracks them.
  const hookOpts: string[] = [];
  if (variant !== undefined && variant !== "default")
    hookOpts.push(`variant: "${variant}"`);
  if (mode !== undefined && mode !== "light") hookOpts.push(`mode: "${mode}"`);
  const optsStr = hookOpts.length ? `, { ${hookOpts.join(", ")} }` : "";

  return `import { Accordion } from "@/components/remocn/accordion";
import { useAccordionTransition } from "@/components/remocn/use-accordion-transition";

export const Scene = () => {
  const style = useAccordionTransition([
    { at: 18, state: "opened", duration: 16 },
    { at: 78, state: "closed", duration: 12 },
  ]${optsStr});

  return (
    <Accordion${propsStr === "" ? " " : propsStr}style={style} />
  );
};`;
};
