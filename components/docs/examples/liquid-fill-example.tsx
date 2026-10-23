"use client";

import {
  DemoWordmark,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import {
  LiquidFill,
  type LiquidFillProps,
} from "@/registry/remocn/liquid-fill";

export function LiquidFillExampleScene(
  props: Omit<LiquidFillProps, "children">,
) {
  return (
    <LiquidFill {...props}>
      <DemoWordmark />
    </LiquidFill>
  );
}

export const liquidFillExampleCode = (
  values: Record<string, unknown>,
): string =>
  logoStingCode({
    name: "liquid-fill",
    component: "LiquidFill",
    values,
    child: "wordmark",
  });
