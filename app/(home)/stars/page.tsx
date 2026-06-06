import type { Metadata } from "next";
import { StarsTool } from "./components/stars-tool";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "GitHub Stars Video Generator",
  description:
    "Turn your repo's stars into a shareable animated video. Paste a GitHub repo and we animate every stargazer into a clip you can own.",
  openGraph: {
    title: "GitHub Stars Video Generator · remocn",
    description:
      "Turn your repo's stars into a shareable animated video. Paste a GitHub repo and we animate every stargazer into a clip you can own.",
  },
};

// The (home) layout already wraps pages in PageShell + SiteHeader + SiteFooter,
// so this server shell only supplies metadata and mounts the client tool.
export default function StarsPage() {
  return (
    <Suspense>
      <StarsTool />
    </Suspense>
  );
}
