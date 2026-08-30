import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/ui/frame";
import { convertNpmCommand } from "@/lib/convert-npm-command";
import { CodeBlockCommand } from "./code-block-command";

export function InstallBlock({ name }: { name: string }) {
  const npmCommand = `npx shadcn@latest add @remocn/${name}`;
  return (
    <Frame id="installation" className="my-6">
      <FrameHeader className="flex-row items-center px-3 py-2.5">
        <FrameTitle>Installation</FrameTitle>
      </FrameHeader>
      <FramePanel className="overflow-hidden p-0">
        <CodeBlockCommand
          component={name}
          variant="plain"
          prompt={`Add the @remocn/${name} component to my project.`}
          {...convertNpmCommand(npmCommand)}
        />
      </FramePanel>
    </Frame>
  );
}
