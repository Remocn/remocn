import { ComponentCard } from "./component-card";

export interface CardItem {
  name: string;
  description: string;
  status: "stable" | "soon";
  href?: string;
}

export function ComponentCardGrid({ items }: { items: CardItem[] }) {
  return (
    <div className="not-prose my-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <ComponentCard key={item.name} item={item} />
      ))}
    </div>
  );
}
