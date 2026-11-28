"use client";

import { useEffect, useState } from "react";

/**
 * Shown only when the embed page is a tab of its own, not an iframe in a chat
 * host: a person opened the preview link an agent gave them, and this is
 * their way on to the full docs page.
 */
export function StandaloneLink({ href }: { href: string }) {
  const [standalone, setStandalone] = useState(false);
  useEffect(() => setStandalone(window.top === window), []);
  if (!standalone) return null;
  return (
    <a
      href={href}
      className="fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-sm text-muted-foreground underline underline-offset-4 backdrop-blur hover:text-foreground"
    >
      Customize & install on remocn.dev
    </a>
  );
}
