import { createFileRoute } from "@tanstack/react-router";
import { BlogSlugPageComponent } from "../../blog/$slug";

export const Route = createFileRoute("/app/blog/$slug")({
  component: AppBlogSlugRoute,
});

function AppBlogSlugRoute() {
  const { slug } = Route.useParams();
  return <BlogSlugPageComponent slug={slug} isApp={true} />;
}
