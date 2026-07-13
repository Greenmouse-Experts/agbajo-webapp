import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/plans/$id/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/admin/plans/$id/"!</div>;
}
