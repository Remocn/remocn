"use client";

import { useRemocnTheme } from "@/lib/remocn-ui";
import { TypingIndicator } from "@/registry/remocn-ui/typing-indicator";

export const typingIndicatorExampleControls = [
  "dotCount",
  "size",
  "amplitude",
] as const;

export interface TypingIndicatorExampleProps {
  dotCount?: number;
  size?: number;
  amplitude?: number;
}

export const TypingIndicatorExampleScene = (
  p: TypingIndicatorExampleProps = {},
) => {
  const theme = useRemocnTheme(undefined, "light");

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "18px 22px",
          background: theme.muted,
          borderRadius: 18,
          color: theme.mutedForeground,
        }}
      >
        <TypingIndicator
          dotCount={p.dotCount ?? 3}
          size={p.size ?? 8}
          amplitude={p.amplitude ?? 5}
        />
      </div>
    </div>
  );
};

export const typingIndicatorExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const dotCount = (values.dotCount as number | undefined) ?? 3;
  const size = (values.size as number | undefined) ?? 8;
  const amplitude = (values.amplitude as number | undefined) ?? 5;

  const props: string[] = [];
  if (dotCount !== 3) props.push(`      dotCount={${dotCount}}`);
  if (size !== 8) props.push(`      size={${size}}`);
  if (amplitude !== 5) props.push(`      amplitude={${amplitude}}`);
  const body = props.length > 0 ? `\n${props.join("\n")}\n    ` : " ";

  return `import { TypingIndicator } from "@/components/remocn/typing-indicator";

export const Scene = () => (
  <div
    style={{
      display: "inline-flex",
      padding: "18px 22px",
      background: "var(--muted)",
      borderRadius: 18,
    }}
  >
    <TypingIndicator${body}/>
  </div>
);`;
};
