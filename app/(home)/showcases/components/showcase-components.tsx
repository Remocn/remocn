import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import type { ShowcaseComponent } from "@/lib/showcases";

const chipClassName =
  "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-foreground/20";

function ComponentChip({ component }: { component: ShowcaseComponent }) {
  if (component.url.startsWith("/")) {
    return (
      <Link href={component.url} className={chipClassName}>
        {component.name}
      </Link>
    );
  }

  return (
    <a
      href={component.url}
      target="_blank"
      rel="noreferrer"
      className={chipClassName}
    >
      {component.name}
      <ArrowUpRight
        className="size-3.5 text-muted-foreground"
        aria-hidden="true"
      />
    </a>
  );
}

export function ShowcaseComponents({
  components,
}: {
  components: ShowcaseComponent[];
}) {
  if (components.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold text-muted-foreground">
        Built with
      </h2>
      <ul className="flex flex-wrap gap-2">
        {components.map((component) => (
          <li key={`${component.name}-${component.url}`}>
            <ComponentChip component={component} />
          </li>
        ))}
      </ul>
    </section>
  );
}
