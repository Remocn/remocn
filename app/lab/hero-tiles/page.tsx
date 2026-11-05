import type { Metadata } from "next";
import { HeroTilesLab } from "./hero-tiles-lab";

export const metadata: Metadata = {
  title: "Hero tiles lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HeroTilesLab />;
}
