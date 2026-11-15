"use client";

// Dev only: keeps the previews on an open page in step with their sources.
//
// The dev launcher (scripts/dev.mts) rebuilds the preview bundle when a
// source file is saved and announces the build over a WebSocket. Turbopack's
// Fast Refresh never sees these files, so this module does its job: each
// loaded preview is rendered through a stand-in component that switches to
// the rebuilt one. The Player around it stays mounted and keeps its frame,
// and the customizer keeps its values; a composition holds no state of its
// own, so nothing else is lost.
//
// lib/previews/index.ts imports this module only in development.

import {
  Component,
  type ComponentType,
  createElement,
  type ReactNode,
  useSyncExternalStore,
} from "react";
import {
  onPreviewsUpdate,
  type PreviewBundle,
  previewsRevision,
} from "./index";

// biome-ignore lint/suspicious/noExplicitAny: dynamically-loaded Remotion composition, props shape varies per component
type AnyComponent = ComponentType<any>;

type Manifest = { version: string; port?: number };

const MANIFEST = "/_previews/dev/manifest.json";

async function readManifest(): Promise<Manifest> {
  const response = await fetch(MANIFEST, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(
      "The preview bundle is missing. Start the site with `bun dev`: it builds the previews into public/_previews.",
    );
  }
  return response.json();
}

/**
 * Resolves to the version of the bundle on disk, then calls `onBuilt` with
 * the version of every later build.
 */
export async function connect(
  onBuilt: (version: string) => void,
): Promise<string> {
  const manifest = await readManifest();
  if (manifest.port) {
    listen(manifest.port, onBuilt);
  } else {
    console.warn(
      "[previews] No live channel: previews won't update when their source is saved. Start the site with `bun dev`.",
    );
  }
  return manifest.version;
}

function listen(port: number, onBuilt: (version: string) => void, wait = 3000) {
  // The launcher writes its port to the manifest and takes it out when it
  // exits. So: no port means nobody to call, and a port means try again,
  // whether the launcher was restarted or the connection just dropped. A
  // port nobody answers on is tried less and less often.
  let next = Math.min(wait * 2, 30000);
  const again = () =>
    setTimeout(() => {
      readManifest()
        .then((manifest) => {
          if (manifest.port) listen(manifest.port, onBuilt, next);
          else again();
        })
        .catch(again);
    }, wait);

  let socket: WebSocket;
  try {
    socket = new WebSocket(`ws://${location.hostname}:${port}`);
  } catch (error) {
    // An https page may not open ws:// at all. Previews still load.
    console.warn("[previews] No live channel:", error);
    return;
  }
  socket.onopen = () => {
    next = 3000;
  };
  socket.onmessage = (event) => {
    const message: { type: string; version?: string } = JSON.parse(event.data);
    if (message.version) onBuilt(message.version);
    if (message.type === "failed") {
      console.error(
        "[previews] The rebuild failed: see the terminal running `bun dev`. The page keeps the last good previews.",
      );
    }
  };
  socket.onclose = again;
}

const sameProps = (a: Record<string, unknown>, b: Record<string, unknown>) =>
  a === b ||
  (Object.keys(a).length === Object.keys(b).length &&
    Object.keys(a).every((key) => Object.is(a[key], b[key])));

type BoundaryProps = {
  component: AnyComponent;
  revision: number;
  // biome-ignore lint/suspicious/noExplicitAny: the preview's own props
  props: Record<string, any>;
  children?: ReactNode;
};

/**
 * A preview that threw while rendering. It gets another go whenever
 * something it renders from changes: the component, any rebuild (a fixed
 * config or helper keeps the component as it is), or its props. The Player's
 * own error boundary would stay tripped until a page reload.
 */
class Boundary extends Component<
  BoundaryProps,
  { error: unknown; seen: BoundaryProps }
> {
  state = { error: null as unknown, seen: this.props };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  static getDerivedStateFromProps(
    props: BoundaryProps,
    state: { error: unknown; seen: BoundaryProps },
  ) {
    const { seen } = state;
    if (
      props.component === seen.component &&
      props.revision === seen.revision &&
      sameProps(props.props, seen.props)
    ) {
      return null;
    }
    return { error: null, seen: props };
  }

  render() {
    const { error } = this.state;
    if (error === null) return this.props.children;
    return createElement(
      "pre",
      {
        style: {
          position: "absolute",
          inset: 0,
          margin: 0,
          padding: 40,
          overflow: "auto",
          whiteSpace: "pre-wrap",
          font: "28px/1.4 ui-monospace, monospace",
          color: "#fff",
          background: "#7f1d1d",
        },
      },
      error instanceof Error ? (error.stack ?? error.message) : String(error),
    );
  }
}

type Slot = { current: AnyComponent; StandIn: AnyComponent };

const slots = new Map<string, Slot>();

/**
 * The stand-in for the preview `name`: one component for the life of the
 * page, rendering `component` now and its rebuilt versions later.
 */
export function hotComponent(
  name: string,
  component: AnyComponent,
): AnyComponent {
  // Once a stand-in exists, only `reload` moves it on: a second load of the
  // same preview may still be holding a component from an older bundle.
  const existing = slots.get(name);
  if (existing) return existing.StandIn;
  const slot: Slot = {
    current: component,
    StandIn: (props) => {
      // Every rebuild renders the stand-in again, changed component or not.
      const revision = useSyncExternalStore(
        onPreviewsUpdate,
        previewsRevision,
        previewsRevision,
      );
      const Current = slot.current;
      return createElement(
        Boundary,
        { component: Current, revision, props },
        createElement(Current, props),
      );
    },
  };
  slot.StandIn.displayName = `Preview(${name})`;
  slots.set(name, slot);
  return slot.StandIn;
}

/** Points every stand-in at its component in the rebuilt bundle. */
export async function reload(bundle: PreviewBundle) {
  await Promise.all(
    [...slots].map(async ([name, slot]) => {
      try {
        const entry = bundle.default[name];
        // Unchanged chunks keep their URL, so the same component comes back.
        if (entry) slot.current = (await entry.load()).default;
      } catch (error) {
        // One broken preview doesn't hold the others back.
        console.error(`[previews] "${name}" failed to load`, error);
      }
    }),
  );
}
