import type { Metadata } from "next";
import { HeroShaderLab } from "./hero-shader-lab";

export const metadata: Metadata = {
  title: "Hero shader lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HeroShaderLab />;
}
