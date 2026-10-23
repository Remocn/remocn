"use client";

import {
  DemoLockup,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import { Spotlight, type SpotlightProps } from "@/registry/remocn/spotlight";

export function SpotlightExampleScene(props: Omit<SpotlightProps, "children">) {
  return (
    <Spotlight {...props}>
      <DemoLockup />
    </Spotlight>
  );
}

export const spotlightExampleCode = (values: Record<string, unknown>): string =>
  logoStingCode({
    name: "spotlight",
    component: "Spotlight",
    values,
    child: "logo",
  });
