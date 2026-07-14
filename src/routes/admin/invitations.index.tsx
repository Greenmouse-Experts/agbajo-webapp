import apiClient from "#/api/simpleApi.ts";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/invitations/")({
  component: RouteComponent,
});

function RouteComponent() {
  const query = useQuery({
    queryKey: ["invitations-admin"],
    queryFn: async () => {
      let resp = await apiClient.get(
        "/auth/invitations?cursor=string&limit=10&roleId=2&status=pending&search=John",
      );
      return resp.data;
    },
  });
  return <div>Hello "/admin/invitations/"!</div>;
}
