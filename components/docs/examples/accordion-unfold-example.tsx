"use client";

import {
  DemoLockup,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import {
  AccordionUnfold,
  type AccordionUnfoldProps,
} from "@/registry/remocn/accordion-unfold";

export function AccordionUnfoldExampleScene(
  props: Omit<AccordionUnfoldProps, "children">,
) {
  return (
    <AccordionUnfold {...props}>
      <DemoLockup scale={0.8} color="#111111" />
    </AccordionUnfold>
  );
}

export const accordionUnfoldExampleCode = (
  values: Record<string, unknown>,
): string =>
  logoStingCode({
    name: "accordion-unfold",
    component: "AccordionUnfold",
    values,
    child: "logo",
  });
