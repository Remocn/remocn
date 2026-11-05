import type { Metadata } from "next";
import { HeroScenesLab } from "./hero-scenes-lab";

export const metadata: Metadata = {
  title: "Hero scenes lab",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <HeroScenesLab />;
}
