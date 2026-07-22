import WithdrawalPin from "#/components/components/WithdrawalPin.tsx";
import ProfileSettings from "#/components/pages/ProfileSettings.tsx";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contributor/settings")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <ProfileSettings />
      <WithdrawalPin />
    </>
  );
}
