import { zColor } from "@remotion/zod-types";
import { Composition, registerRoot } from "remotion";
import { z } from "zod";
import { WorkflowConsole } from "@/registry/remocn-templates/workflow-console";

const row = z.object({
  at: z.number().min(0),
  text: z.string(),
  kind: z.enum(["prompt", "call", "thought", "note", "result"]).optional(),
  highlight: z.string().optional(),
});
export const workflowSchema = z.object({
  productName: z.string().optional(),
  accentColor: zColor().optional(),
  backgroundColor: zColor().optional(),
  content: z
    .object({
      prefix: z.string().optional(),
      product: z.string().optional(),
      command: z.string().optional(),
      fetching: z.string().optional(),
      launchCommand: z.string().optional(),
      geography: z.string().optional(),
      campaign: z.string().optional(),
      delivery: z.string().optional(),
      deliveryDetail: z.string().optional(),
      growth: z.string().optional(),
      statsLoading: z.string().optional(),
      statsQuestion: z.string().optional(),
      followup: z.string().optional(),
      changeCommand: z.string().optional(),
      recommendation: z.string().optional(),
      budgetLabel: z.string().optional(),
      oldBudget: z.string().optional(),
      newBudget: z.string().optional(),
      doubleCommand: z.string().optional(),
      closing: z.string().optional(),
      terminalTitle: z.string().optional(),
      chartTitle: z.string().optional(),
    })
    .optional(),
  environments: z
    .array(
      z.object({
        label: z.string(),
        topology: z.enum(["single", "parallel", "cluster", "canary"]),
      }),
    )
    .optional(),
  tools: z.array(z.string()).optional(),
  countries: z
    .array(z.enum(["USA", "Brazil", "UAE", "India", "Japan", "China"]))
    .optional(),
  bars: z
    .array(
      z.object({
        label: z.string(),
        value: z.number().min(0),
        detail: z.string(),
      }),
    )
    .optional(),
  terminalRows: z
    .object({
      campaign: z.array(row).optional(),
      launched: z.array(row).optional(),
      stats: z.array(row).optional(),
    })
    .optional(),
  logoSrc: z.string().optional(),
  audioSrc: z.string().optional(),
  volume: z.number().min(0).max(1).optional(),
});

function WorkflowRoot() {
  return (
    <Composition
      id="WorkflowConsole"
      component={WorkflowConsole}
      width={1920}
      height={1080}
      fps={60}
      durationInFrames={2810}
      schema={workflowSchema}
      defaultProps={{
        productName: "Workflow Console",
        accentColor: "#8ed8f8",
        backgroundColor: "#0e1b2b",
      }}
    />
  );
}
registerRoot(WorkflowRoot);
