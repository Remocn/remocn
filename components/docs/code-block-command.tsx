"use client";

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { TerminalIcon, TextAlignStartIcon } from "lucide-react";
import { useMemo } from "react";
import { useTrackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { CopyButton } from "./copy-button";

export type PackageManager = "prompt" | "pnpm" | "yarn" | "npm" | "bun";

const packageManagerAtom = atomWithStorage<PackageManager>(
  "remocn/packageManager",
  "pnpm",
);

export function usePackageManager() {
  return useAtom(packageManagerAtom);
}

export interface CodeBlockCommandProps {
  prompt?: string;
  pnpm?: string;
  yarn?: string;
  npm?: string;
  bun?: string;
  component?: string;
  /**
   * Surface treatment. `muted` (default) is the filled gray slab used in docs.
   * `outline` is a lighter bordered terminal that sits softer on light cards.
   */
  variant?: "muted" | "outline";
}

export function CodeBlockCommand({
  prompt,
  pnpm,
  yarn,
  npm,
  bun,
  component,
  variant = "muted",
}: CodeBlockCommandProps) {
  const [packageManager, setPackageManager] = usePackageManager();
  const trackEvent = useTrackEvent();

  const tabs = useMemo(
    () => ({ prompt, pnpm, yarn, npm, bun }),
    [prompt, pnpm, yarn, npm, bun],
  );

  const tabsFiltered = useMemo(
    () => Object.entries(tabs).filter(([, value]) => !!value),
    [tabs],
  );

  const activeCommand = tabs[packageManager] || "";

  return (
    <div
      className={cn(
        "not-prose relative overflow-hidden rounded-xl",
        variant === "outline" ? "border border-border bg-card" : "bg-muted",
      )}
    >
      <TabsPrimitive.Root
        value={packageManager}
        onValueChange={(value) => setPackageManager(value as PackageManager)}
        className="flex flex-col"
      >
        <div className="px-4 shadow-[inset_0_-1px_0_0] shadow-border">
          <TabsPrimitive.List className="relative z-0 flex h-10 w-fit items-center gap-1 [&_svg]:me-2 [&_svg]:size-4 [&_svg]:text-muted-foreground">
            {getIconForPackageManager(packageManager)}

            {tabsFiltered.map(([key]) => (
              <TabsPrimitive.Tab
                key={key}
                value={key}
                className={cn(
                  "relative h-7 rounded-md px-2 font-mono text-sm font-medium whitespace-nowrap transition-colors outline-none",
                  "text-muted-foreground hover:text-foreground",
                  "data-active:text-foreground",
                  "focus-visible:ring-2 focus-visible:ring-ring/40",
                )}
              >
                {key}
              </TabsPrimitive.Tab>
            ))}

            <TabsPrimitive.Indicator
              className={cn(
                "absolute bottom-0 left-0 -z-1",
                "w-(--active-tab-width) translate-x-(--active-tab-left)",
                "h-0.5 rounded-none bg-foreground",
                "transition-[width,translate] duration-200 ease-in-out",
              )}
            />
          </TabsPrimitive.List>
        </div>

        {tabsFiltered.map(([key, value]) => (
          <TabsPrimitive.Panel key={key} value={key} className="outline-none">
            <pre className="overflow-x-auto overscroll-x-contain p-4">
              <code
                data-slot="code-block"
                data-language="bash"
                className="font-mono text-sm leading-none text-muted-foreground"
              >
                {key !== "prompt" && <span className="select-none">$ </span>}
                {value}
              </code>
            </pre>
          </TabsPrimitive.Panel>
        ))}
      </TabsPrimitive.Root>

      <CopyButton
        value={activeCommand}
        className="absolute top-2 right-2 z-10"
        onCopy={() => {
          if (!component) return;
          trackEvent("install_command_copied", {
            component,
            package_manager: packageManager,
            surface: "docs",
          });
        }}
      />
    </div>
  );
}

function getIconForPackageManager(manager: PackageManager) {
  switch (manager) {
    case "prompt":
      return <TextAlignStartIcon />;
    case "pnpm":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <title>pnpm</title>
          <path
            d="M0 0v7.5h7.5V0zm8.25 0v7.5h7.498V0zm8.25 0v7.5H24V0zM8.25 8.25v7.5h7.498v-7.5zm8.25 0v7.5H24v-7.5zM0 16.5V24h7.5v-7.5zm8.25 0V24h7.498v-7.5zm8.25 0V24H24v-7.5z"
            fill="currentColor"
          />
        </svg>
      );
    case "yarn":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <title>yarn</title>
          <path
            d="M12 0C5.375 0 0 5.375 0 12s5.375 12 12 12 12-5.375 12-12S18.625 0 12 0zm.768 4.105c.183 0 .363.053.525.157.125.083.287.185.755 1.154.31-.088.468-.042.551-.019.204.056.366.19.463.375.477.917.542 2.553.334 3.605-.241 1.232-.755 2.029-1.131 2.576.324.329.778.899 1.117 1.825.278.774.31 1.478.273 2.015a5.51 5.51 0 0 0 .602-.329c.593-.366 1.487-.917 2.553-.931.714-.009 1.269.445 1.353 1.103a1.23 1.23 0 0 1-.945 1.362c-.649.158-.95.278-1.821.843-1.232.797-2.539 1.242-3.012 1.39a1.686 1.686 0 0 1-.704.343c-.737.181-3.266.315-3.466.315h-.046c-.783 0-1.214-.241-1.45-.491-.658.329-1.51.19-2.122-.134a1.078 1.078 0 0 1-.58-1.153 1.243 1.243 0 0 1-.153-.195c-.162-.25-.528-.936-.454-1.946.056-.723.556-1.367.88-1.71a5.522 5.522 0 0 1 .408-2.256c.306-.727.885-1.348 1.32-1.737-.32-.537-.644-1.367-.329-2.21.227-.602.412-.936.82-1.08h-.005c.199-.074.389-.153.486-.259a3.418 3.418 0 0 1 2.298-1.103c.037-.093.079-.185.125-.283.31-.658.639-1.029 1.024-1.168a.94.94 0 0 1 .328-.06z"
            fill="currentColor"
          />
        </svg>
      );
    case "npm":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <title>npm</title>
          <path
            d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
            fill="currentColor"
          />
        </svg>
      );
    case "bun":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <title>bun</title>
          <path
            d="M12 22.596c6.628 0 12-4.338 12-9.688 0-3.318-2.057-6.248-5.219-7.986-1.286-.715-2.297-1.357-3.139-1.89C14.058 2.025 13.08 1.404 12 1.404c-1.097 0-2.334.785-3.966 1.821a49.92 49.92 0 0 1-2.816 1.697C2.057 6.66 0 9.59 0 12.908c0 5.35 5.372 9.687 12 9.687v.001ZM10.599 4.715c.334-.759.503-1.58.498-2.409 0-.145.202-.187.23-.029.658 2.783-.902 4.162-2.057 4.624-.124.048-.199-.121-.103-.209a5.763 5.763 0 0 0 1.432-1.977Zm2.058-.102a5.82 5.82 0 0 0-.782-2.306v-.016c-.069-.123.086-.263.185-.172 1.962 2.111 1.307 4.067.556 5.051-.082.103-.23-.003-.189-.126a5.85 5.85 0 0 0 .23-2.431Zm1.776-.561a5.727 5.727 0 0 0-1.612-1.806v-.014c-.112-.085-.024-.274.114-.218 2.595 1.087 2.774 3.18 2.459 4.407a.116.116 0 0 1-.049.071.11.11 0 0 1-.153-.026.122.122 0 0 1-.022-.083 5.891 5.891 0 0 0-.737-2.331Zm-5.087.561c-.617.546-1.282.76-2.063 1-.117 0-.195-.078-.156-.181 1.752-.909 2.376-1.649 2.999-2.778 0 0 .155-.118.188.085 0 .304-.349 1.329-.968 1.874Zm4.945 11.237a2.957 2.957 0 0 1-.937 1.553c-.346.346-.8.565-1.286.62a2.178 2.178 0 0 1-1.327-.62 2.955 2.955 0 0 1-.925-1.553.244.244 0 0 1 .064-.198.234.234 0 0 1 .193-.069h3.965a.226.226 0 0 1 .19.07c.05.053.073.125.063.197Zm-5.458-2.176a1.862 1.862 0 0 1-2.384-.245 1.98 1.98 0 0 1-.233-2.447c.207-.319.503-.566.848-.713a1.84 1.84 0 0 1 1.092-.11c.366.075.703.261.967.531a1.98 1.98 0 0 1 .408 2.114 1.931 1.931 0 0 1-.698.869v.001Zm8.495.005a1.86 1.86 0 0 1-2.381-.253 1.964 1.964 0 0 1-.547-1.366c0-.384.11-.76.32-1.079.207-.319.503-.567.849-.713a1.844 1.844 0 0 1 1.093-.108c.367.076.704.262.968.534a1.98 1.98 0 0 1 .4 2.117 1.932 1.932 0 0 1-.702.868Z"
            fill="currentColor"
          />
        </svg>
      );
    default:
      return <TerminalIcon />;
  }
}
