import uiRegistry from "@/registry/remocn-ui/registry.json";

type RegistryFile = { target?: string };
type RegistryItem = { name: string; files?: RegistryFile[] };

const items = uiRegistry.items as RegistryItem[];

function firstTarget(name: string): string | undefined {
  return items.find((item) => item.name === name)?.files?.[0]?.target;
}

const FILE_ICON = "M6 3.5h8l4 4v13H6Z";
const FOLDER_ICON =
  "M3.5 6.5a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z";

/**
 * What `shadcn add` writes for one primitive: its component file and the
 * shared remocn-ui core folder, both read from the registry.
 */
export function InstallWrites({ name }: { name: string }) {
  const component = firstTarget(name);
  const core = firstTarget("remocn-ui")?.replace(/[^/]+$/, "");
  const rows = [
    component && { path: component, icon: FILE_ICON },
    core && { path: core, icon: FOLDER_ICON, note: "shared core" },
  ].filter(Boolean) as { path: string; icon: string; note?: string }[];

  return (
    <ul
      data-not-typeset
      className="not-prose mt-3 grid gap-2 sm:grid-cols-2"
      aria-label="Files it writes"
    >
      {rows.map((row) => (
        <li
          key={row.path}
          className="flex h-11 min-w-0 items-center gap-2.5 rounded-control-sm border border-hairline bg-surface px-3.5"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="size-3.5 shrink-0 fill-none stroke-muted-foreground stroke-[1.8] [stroke-linejoin:round]"
          >
            <path d={row.icon} />
          </svg>
          <code className="truncate font-mono text-mono leading-4 text-foreground">
            {row.path}
          </code>
          {row.note && (
            <span className="shrink-0 text-caption leading-4 text-muted-foreground">
              {row.note}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}
