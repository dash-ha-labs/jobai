import { createFileRoute } from "@tanstack/react-router";
import { ToolPageLayout, TOOLS } from "../../components/tools/ToolPageLayout";
import { BulletAnalyzer } from "../../components/tools/BulletAnalyzer";

export const Route = createFileRoute("/toolkit/bullet-analyzer")({
  component: BulletAnalyzerPage,
});

function BulletAnalyzerPage() {
  const tool = TOOLS.find((t) => t.slug === "bullet-analyzer")!;
  return (
    <ToolPageLayout
      tool={tool}
      howItWorks={[
        {
          title: "Action verb check",
          body: "The first word of your bullet is compared against known strong action verbs (engineered, orchestrated, reduced…) and weak passive phrasings (responsible for, helped with…).",
        },
        {
          title: "Quantified metrics check",
          body: "Numbers, percentages, currency amounts, and multipliers (42%, $1.2M, 3x) are detected. Verifiable figures prove real contribution and scope.",
        },
        {
          title: "Print density check",
          body: "Word count is scored against the 10–28 word range that fits a 1–2 line print rhythm on standard A4 margins, so bullets stay readable on paper.",
        },
      ]}
    >
      <BulletAnalyzer showTitle={false} />
    </ToolPageLayout>
  );
}
