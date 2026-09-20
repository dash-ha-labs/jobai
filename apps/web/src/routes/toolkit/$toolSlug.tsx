import { createFileRoute, notFound } from "@tanstack/react-router";
import { ToolPageLayout, type ToolMeta, type ToolSlug } from "../../components/tools/ToolPageLayout";
import { ResumeSkillsToolkitTool } from "../../components/tools/ResumeSkillsToolkitTool";
import { getResumeSkillsTool } from "../../components/tools/resume-skills-registry";

export const Route = createFileRoute("/toolkit/$toolSlug")({
  beforeLoad: ({ params }) => {
    const tool = getResumeSkillsTool(params.toolSlug);
    if (!tool) {
      throw notFound();
    }
  },
  component: ResumeSkillsToolPage,
});

function ResumeSkillsToolPage() {
  const { toolSlug } = Route.useParams();
  const def = getResumeSkillsTool(toolSlug)!;
  const tool: ToolMeta = {
    slug: def.slug as ToolSlug,
    name: def.name,
    short: def.short,
    description: def.description,
  };

  return (
    <ToolPageLayout tool={tool} howItWorks={def.howItWorks}>
      <ResumeSkillsToolkitTool tool={def} />
    </ToolPageLayout>
  );
}
