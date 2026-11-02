"use client";

import {
  DemoWordmark,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import {
  PuzzleSnap,
  type PuzzleSnapProps,
} from "@/registry/remocn/puzzle-snap";

export function PuzzleSnapExampleScene(
  props: Omit<PuzzleSnapProps, "children">,
) {
  return (
    <PuzzleSnap {...props}>
      <DemoWordmark />
    </PuzzleSnap>
  );
}

export const puzzleSnapExampleCode = (
  values: Record<string, unknown>,
): string =>
  logoStingCode({
    name: "puzzle-snap",
    component: "PuzzleSnap",
    values,
    child: "wordmark",
  });
