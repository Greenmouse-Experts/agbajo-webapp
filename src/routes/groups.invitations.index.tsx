import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "#/store/authStore";

export const Route = createFileRoute("/groups/invitations/")({
  component: RouteComponent,
  validateSearch: (search: any): { invitationId?: string } => ({
    invitationId: search?.invitationId,
  }),
});

function RouteComponent() {
  const [auth] = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // console.log(auth);
    if (!auth) {
      navigate({ to: "/home/auth/login" });
      return;
    }

    const role = auth.user.roles[0];

    if (role === "cluster-manager") {
      navigate({ to: "/cluster-manager/invitations" });
    } else {
      navigate({ to: "/contributor/invitations" });
    }
  }, [auth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="loading loading-spinner loading-lg" />
    </div>
  );
}
