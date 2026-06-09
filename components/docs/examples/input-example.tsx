"use client";

import { Input } from "@/registry/remocn-ui/input";
import { useInputTransition } from "@/registry/remocn-ui/input/use-input-transition";

export const InputExampleScene = () => {
  const style = useInputTransition([
    { at: 10, state: "hover", duration: 8 },
    { at: 24, state: "active", duration: 10 },
    { at: 40, state: "typing", duration: 22 },
    { at: 78, state: "invalid", duration: 12 },
  ]);
  return (
    <Input
      placeholder="you@example.com"
      value="remotion@remocn.dev"
      style={style}
    />
  );
};

export const inputExampleCode = `import { Input } from "@/components/remocn/input";
import { useInputTransition } from "@/components/remocn/use-input-transition";

export const Scene = () => {
  const style = useInputTransition([
    { at: 10, state: "hover", duration: 8 },
    { at: 24, state: "active", duration: 10 },
    { at: 40, state: "typing", duration: 22 },
    { at: 78, state: "invalid", duration: 12 },
  ]);

  return (
    <Input
      placeholder="you@example.com"
      value="remotion@remocn.dev"
      style={style}
    />
  );
};`;
