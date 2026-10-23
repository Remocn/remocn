"use client";

import {
  DemoLockup,
  logoStingCode,
} from "@/components/docs/examples/logo-sting-lockup";
import { OrbitLock, type OrbitLockProps } from "@/registry/remocn/orbit-lock";

export function OrbitLockExampleScene(props: Omit<OrbitLockProps, "children">) {
  return (
    <OrbitLock {...props}>
      <DemoLockup />
    </OrbitLock>
  );
}

export const orbitLockExampleCode = (values: Record<string, unknown>): string =>
  logoStingCode({
    name: "orbit-lock",
    component: "OrbitLock",
    values,
    child: "logo",
  });
