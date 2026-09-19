import { createFileRoute } from "@tanstack/react-router";
import { BlogIndexComponent } from "../../blog/index";

export const Route = createFileRoute("/app/blog/")({
  component: AppBlogIndex,
});

function AppBlogIndex() {
  return <BlogIndexComponent isApp={true} />;
}
