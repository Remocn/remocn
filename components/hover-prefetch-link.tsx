"use client";

import Link from "next/link";
import { type ComponentProps, useState } from "react";

type HoverPrefetchLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/**
 * A `Link` that prefetches on intent instead of on sight. By default Next
 * prefetches every link that enters the viewport, so a page with a long
 * sidebar, a hidden mega menu or a grid of cards fires dozens of requests on
 * load. This one starts the prefetch on pointer enter, keyboard focus or touch
 * start, which still lands before the click.
 *
 * Pattern from Next's prefetching guide (`HoverPrefetchLink`).
 */
export function HoverPrefetchLink({
  onMouseEnter,
  onFocus,
  onTouchStart,
  ...props
}: HoverPrefetchLinkProps) {
  const [active, setActive] = useState(false);

  return (
    <Link
      {...props}
      prefetch={active ? null : false}
      onMouseEnter={(event) => {
        setActive(true);
        onMouseEnter?.(event);
      }}
      onFocus={(event) => {
        setActive(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setActive(true);
        onTouchStart?.(event);
      }}
    />
  );
}
