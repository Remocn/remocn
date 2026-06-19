"use client";

import { Progress } from "@/registry/remocn-ui/progress";
import { useProgressTransition } from "@/registry/remocn-ui/progress/use-progress-transition";

export const progressExampleControls = ["showLabel"] as const;

export interface ProgressExampleProps {
  showLabel?: boolean;
}

export const ProgressExampleScene = (p: ProgressExampleProps = {}) => {
  // Bar fills from 0 → 62 (arrives at frame 40), stalls for ~60 frames as if
  // waiting on a slow operation, then resumes to 100 (arrives at frame 130).
  const progressStyle = useProgressTransition([
    { at: 0,   value: 0  },
    { at: 40,  value: 62,  duration: 36 },
    { at: 130, value: 100, duration: 30 },
  ]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Progress style={progressStyle} showLabel={p.showLabel ?? true} width={320} />
    </div>
  );
};

export const progressExampleCode = (
  values: Record<string, unknown> = {},
): string => {
  const showLabel = values.showLabel as boolean | undefined;

  const props: string[] = [];
  if (showLabel !== undefined && showLabel !== true)
    props.push(`showLabel={${showLabel}}`);

  const propsStr = props.length ? ` ${props.join(" ")}` : "";
  return `import { Progress } from "@/components/remocn/progress";
import { useProgressTransition } from "@/components/remocn/use-progress-transition";

export const Scene = () => {
  // Bar fills from 0 → 62 (arrives at frame 40), stalls for ~60 frames as if
  // waiting on a slow operation, then resumes to 100 (arrives at frame 130).
  const progressStyle = useProgressTransition([
    { at: 0,   value: 0  },
    { at: 40,  value: 62,  duration: 36 },
    { at: 130, value: 100, duration: 30 },
  ]);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Progress style={progressStyle} width={320}${propsStr} />
    </div>
  );
};`;
};
