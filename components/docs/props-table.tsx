import { cn } from "@/lib/utils";
import { BLOCK_SPACING } from "./blocks/spacing";

export interface PropDef {
  name: string;
  type: string;
  default?: string;
  required?: boolean;
  description: string;
}

function Required() {
  return (
    <span className="ml-2 inline-flex h-5 items-center rounded-tag bg-surface-muted px-1.5 font-sans text-micro text-muted-foreground">
      required
    </span>
  );
}

/** Desktop: prop name on the left, type and default over the description. */
function PropsGrid({ rows }: { rows: PropDef[] }) {
  return (
    <div className="overflow-hidden rounded-card border border-hairline bg-surface max-md:hidden">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="h-10 border-b border-hairline bg-surface-muted text-caption font-medium text-foreground">
            <th scope="col" className="w-[190px] pl-5 font-medium">
              Prop
            </th>
            <th scope="col" className="w-[90px] font-medium">
              Type
            </th>
            <th scope="col" className="pr-5 font-medium">
              Default
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.name}
              className="border-b border-hairline align-top last:border-b-0"
            >
              <th
                scope="row"
                className="py-3.5 pr-4 pl-5 font-mono text-caption leading-5 font-normal break-all text-foreground"
              >
                {row.name}
                {row.required ? <Required /> : null}
              </th>
              <td colSpan={2} className="py-3.5 pr-5">
                <div className="flex font-mono text-caption leading-5">
                  <span className="w-[90px] shrink-0 text-foreground">
                    {row.type}
                  </span>
                  <span className="min-w-0 text-muted-foreground">
                    {row.default ?? "—"}
                  </span>
                </div>
                <p className="mt-1 text-small leading-[21px] text-body">
                  {row.description}
                </p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Phones: one card per prop, type as a tag, default under the description. */
function PropsCards({ rows }: { rows: PropDef[] }) {
  return (
    <ul className="flex flex-col gap-2 md:hidden">
      {rows.map((row) => (
        <li
          key={row.name}
          className="flex flex-col gap-2 rounded-cta border border-hairline bg-surface px-4 pt-3.5 pb-4"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="min-w-0 font-mono text-caption leading-5 break-all text-foreground">
              {row.name}
              {row.required ? <Required /> : null}
            </span>
            <span className="max-w-[60%] shrink-0 rounded-tag bg-surface-muted px-[7px] py-[3px] font-mono text-mono wrap-anywhere text-body">
              {row.type}
            </span>
          </div>
          <p className="text-small leading-[21px] text-body">
            {row.description}
          </p>
          {row.default ? (
            <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-caption leading-[18px] text-muted-foreground">
              Default
              <code className="font-mono text-mono leading-[18px]">
                {row.default}
              </code>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function PropsTable({
  rows,
  title,
}: {
  rows: PropDef[];
  title?: string;
}) {
  return (
    <div
      id={title ? title.toLowerCase().replace(/\s+/g, "-") : undefined}
      className={cn(
        "not-prose scroll-mt-24",
        title ? "mt-12 first:mt-0" : BLOCK_SPACING,
      )}
    >
      {title ? (
        <h2 className="mb-4 flex items-baseline gap-2.5 text-quote leading-8 font-medium tracking-title text-foreground max-md:mb-3.5">
          {title}
          <span className="font-normal text-subtle">{rows.length}</span>
        </h2>
      ) : null}
      <PropsGrid rows={rows} />
      <PropsCards rows={rows} />
    </div>
  );
}
