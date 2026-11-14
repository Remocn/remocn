// Turbopack loader for `registry/__index__.tsx`, applied to server builds only
// (see `turbopack.rules` in next.config.ts).
//
// Every registry entry has `load: () => import(<component>)`. Previews only
// ever call it in the browser: the Player mounts the composition client-side,
// and SSR renders the stage around it. But the bundler can't know that, so it
// compiled all ~900 components a second time for the server graph on the
// first request to any page that imports the index. Here each server-side
// `load` becomes a stub, which keeps every component out of the server graph.
// `loadConfig` is left alone: SSR does read configs.
//
// The stub rejects, so a server call fails loudly (the prerender errors) rather
// than rendering an empty frame. A Remotion <Player lazyComponent={load}>
// rendered during SSR calls `load` there: mount such a Player after hydration,
// as the docs stage, component cards and shader preset cards do.
//
// lib/build/strip-server-preview-loads.test.ts checks that this still matches
// every entry of the real index.

const LOAD_ENTRY =
  /^([ \t]+)load: \(\) =>\s+import\([\s\S]*?(?=^\1loadConfig:)/gm;

function stripServerPreviewLoads(source) {
  const out = source.replace(
    LOAD_ENTRY,
    (_match, indent) => `${indent}load: serverPreviewLoad,\n`,
  );
  return `${out}
function serverPreviewLoad() {
  return Promise.reject(
    new Error(
      "registry/__index__: load() is browser-only, the server build strips it (lib/build/strip-server-preview-loads.cjs)",
    ),
  );
}
`;
}

module.exports = stripServerPreviewLoads;
module.exports.LOAD_ENTRY = LOAD_ENTRY;
