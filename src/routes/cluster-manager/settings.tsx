import ProfileSettings from "#/components/pages/ProfileSettings.tsx";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/cluster-manager/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <ProfileSettings />
    </>
  );
}
