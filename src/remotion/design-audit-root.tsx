import { Composition, Folder, registerRoot } from "remotion";
import { designAuditDrafts } from "./design-audit/drafts";

// Studio shelf for the design-audit family: redlines, scan, tokens, guides.
// Run: bun run studio:design-audit
function DesignAuditRoot() {
  return (
    <Folder name="Design-audit">
      {designAuditDrafts.map((entry) => (
        <Composition
          key={entry.id}
          id={entry.id}
          component={entry.component}
          durationInFrames={entry.durationInFrames}
          fps={30}
          width={1280}
          height={720}
          defaultProps={entry.defaultProps ?? {}}
        />
      ))}
    </Folder>
  );
}

registerRoot(DesignAuditRoot);
