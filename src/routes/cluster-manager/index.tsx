import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cluster-manager/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/cluster-manager/"!</div>;
}
