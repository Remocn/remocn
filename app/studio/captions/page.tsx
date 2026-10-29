import type { Metadata } from "next";
import { Suspense } from "react";
import { StudioCaptionPicker } from "./caption-picker";

export const metadata: Metadata = {
  title: "Caption styles for Remotion Studio",
  robots: { index: false, follow: false },
};

export default function CaptionStylesPage() {
  return (
    <Suspense fallback={<div className="h-dvh bg-background" />}>
      <StudioCaptionPicker />
    </Suspense>
  );
}
