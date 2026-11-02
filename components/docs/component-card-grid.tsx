import { cn } from "@/lib/utils";
import { ComponentCard } from "./component-card";

export interface CardItem {
  name: string;
  description?: string;
  status: "stable" | "soon";
  href?: string;
  /** Registry name to preview; defaults to the last segment of `href`. */
  component?: string;
  isNew?: boolean;
}

export function ComponentCardGrid({
  items,
  className,
}: {
  items: CardItem[];
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "not-prose my-8 grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-5",
        className,
      )}
    >
      {items.map((item) => (
        <li key={item.href ?? item.name}>
          <ComponentCard item={item} />
        </li>
      ))}
    </ul>
  );
}
