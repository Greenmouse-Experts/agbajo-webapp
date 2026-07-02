import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contributor/")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/contributor/"!</div>;
}
