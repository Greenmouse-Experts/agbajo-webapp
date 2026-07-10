import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cluster-manager/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/cluster-manager/settings"!</div>;
}
