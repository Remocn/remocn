"use client";

import {
  DemoLockup,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import {
  AnamorphicFlare,
  type AnamorphicFlareProps,
} from "@/registry/remocn/anamorphic-flare";

export function AnamorphicFlareExampleScene(
  props: Omit<AnamorphicFlareProps, "children">,
) {
  return (
    <AnamorphicFlare {...props}>
      <DemoLockup />
    </AnamorphicFlare>
  );
}

export const anamorphicFlareExampleCode = (
  values: Record<string, unknown>,
): string =>
  logoStingCode({
    name: "anamorphic-flare",
    component: "AnamorphicFlare",
    values,
    child: "logo",
  });
