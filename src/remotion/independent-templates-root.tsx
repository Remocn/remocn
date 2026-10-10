import { Composition, registerRoot } from "remotion";
import { OrderFlow } from "@/registry/remocn-templates/fomo-limit-orders";
import { ProductShowcase } from "@/registry/remocn-templates/launch-anything";
import { WorkflowConsole } from "@/registry/remocn-templates/workflow-console";

function IndependentTemplatesRoot() {
  return (
    <>
      <Composition
        id="OrderFlow"
        component={OrderFlow}
        durationInFrames={1108}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="WorkflowConsole"
        component={WorkflowConsole}
        durationInFrames={2810}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
      <Composition
        id="ProductShowcase"
        component={ProductShowcase}
        durationInFrames={1600}
        fps={60}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
}
registerRoot(IndependentTemplatesRoot);
