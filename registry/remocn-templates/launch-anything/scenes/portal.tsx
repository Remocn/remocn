import type { SceneProps } from "../content";
import { ActionFrame, actionBackground } from "./action-frame";
export function Portal(props: SceneProps) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: actionBackground,
        overflow: "hidden",
      }}
    >
      <ActionFrame {...props} />
    </div>
  );
}
