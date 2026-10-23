"use client";

import {
  DemoWordmark,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import { Inflate, type InflateProps } from "@/registry/remocn/inflate";

export function InflateExampleScene(props: Omit<InflateProps, "children">) {
  return (
    <Inflate {...props}>
      <DemoWordmark />
    </Inflate>
  );
}

export const inflateExampleCode = (values: Record<string, unknown>): string =>
  logoStingCode({
    name: "inflate",
    component: "Inflate",
    values,
    child: "wordmark",
  });
