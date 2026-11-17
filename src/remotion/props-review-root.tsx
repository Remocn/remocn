import { type ComponentType, useEffect, useState } from "react";
import {
  Composition,
  continueRender,
  delayRender,
  getInputProps,
  registerRoot,
} from "remotion";
import { loadPreviewFont } from "@/lib/previews/fonts";
import registry from "@/registry/__index__";

// One composition per component named in the `names` input prop, rendered by
// `scripts/review-props.mts`. `props` go to every component as-is; a
// `fontFamily` among them is loaded first, as the docs preview does.

type Input = { names?: string[]; props?: Record<string, unknown> };
const input = getInputProps() as Input;

function Cell({ name, ...props }: { name: string } & Record<string, unknown>) {
  const [Component, setComponent] = useState<ComponentType<
    Record<string, unknown>
  > | null>(null);
  const [handle] = useState(() => delayRender(`load ${name}`));
  useEffect(() => {
    const font =
      typeof props.fontFamily === "string"
        ? loadPreviewFont(props.fontFamily)
        : Promise.resolve();
    Promise.all([registry[name].load(), font]).then(([m]) => {
      setComponent(() => m.default);
      continueRender(handle);
    });
  }, [name, handle, props.fontFamily]);
  return Component ? <Component {...props} /> : null;
}

function Root() {
  return (
    <>
      {(input.names ?? []).map((name) => (
        <Composition
          key={name}
          id={name}
          component={Cell}
          defaultProps={{ name, ...(input.props ?? {}) }}
          durationInFrames={1}
          fps={30}
          width={1280}
          height={720}
          calculateMetadata={async () => {
            const config = await registry[name].loadConfig();
            return {
              durationInFrames: config.durationInFrames,
              fps: config.fps,
              width: config.compositionWidth,
              height: config.compositionHeight,
            };
          }}
        />
      ))}
    </>
  );
}

registerRoot(Root);
