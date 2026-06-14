import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";
import { ShimmeringText } from "@/components/shimmering-text";
import { cn } from "@/lib/utils";

export function StarsButton({
  className,
  ...props
}: Omit<ComponentProps<typeof Link>, "href" | "children">) {
  return (
    <Link
      href="/stars"
      data-track="cta_clicked"
      data-cta="stars_header"
      data-destination="/stars"
      className={cn(
        "group inline-flex h-9 items-center gap-2 rounded-full border border-border px-3 text-sm font-medium transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className,
      )}
      {...props}
    >
      <Sparkles className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
      <ShimmeringText
        text="Animate your stars"
        duration={1.4}
        className="[--color:var(--muted-foreground)] [--shimmering-color:var(--foreground)]"
      />
    </Link>
  );
}
