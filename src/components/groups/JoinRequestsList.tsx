import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import QueryCompLayout from "#/components/layout/QueryCompLayout";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import { get_user_value } from "#/store/authStore";
import { extract_message } from "#/helpers/apihelpers";

interface JoinRequest {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
}

interface Props {
  groupId: string;
}

export default function JoinRequestsList({ groupId }: Props) {
  const queryClient = useQueryClient();
  const isAdmin = get_user_value()?.user.roles.includes("admin") ?? false;

  const query = useQuery<ApiResponse<JoinRequest[]>>({
    queryKey: ["group", groupId, "join-requests"],
    queryFn: async () => {
      const resp = await apiClient.get(`groups/${groupId}/join-requests`);
      return resp.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["group", groupId, "join-requests"],
    });

  const acceptMutation = useMutation({
    mutationFn: (userId: string) => {
      const url = isAdmin
        ? `admins/groups/${groupId}/join-requests/${userId}`
        : `groups/${groupId}/join-requests/${userId}`;
      return toast
        .promise(apiClient.patch(url, { action: "accept" }).then(invalidate), {
          loading: "Accepting request...",
          success: "Request accepted",
          error: extract_message,
        })
        .unwrap();
    },
  });

  const declineMutation = useMutation({
    mutationFn: (userId: string) => {
      const url = isAdmin
        ? `admins/groups/${groupId}/join-requests/${userId}`
        : `groups/${groupId}/join-requests/${userId}`;
      return toast
        .promise(apiClient.patch(url, { action: "decline" }).then(invalidate), {
          loading: "Declining request...",
          success: "Request declined",
          error: extract_message,
        })
        .unwrap();
    },
  });

  const isPending = acceptMutation.isPending || declineMutation.isPending;

  const columns: columnType<JoinRequest>[] = [
    {
      key: "name",
      label: "Name",
      render: (_v, r) => `${r.firstName} ${r.lastName}`,
    },
    { key: "email", label: "Email" },
    {
      key: "status",
      label: "Status",
      render: (_v, r) => (
        <span className="badge badge-warning badge-sm capitalize">
          {r.status}
        </span>
      ),
    },
    {
      key: "action",
      label: "Actions",
      render: (_v, r) => (
        <div className="flex gap-2">
          <button
            className="btn btn-success btn-xs"
            disabled={isPending}
            onClick={() => acceptMutation.mutate(r.userId ?? r.id)}
          >
            Accept
          </button>
          <button
            className="btn btn-error btn-xs btn-outline"
            disabled={isPending}
            onClick={() => declineMutation.mutate(r.userId ?? r.id)}
          >
            Decline
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
        <h3 className="font-semibold text-base-content">Join Requests</h3>
      </div>

      <QueryCompLayout query={query}>
        {(res) => {
          const requests = res.data ?? [];
          return <CustomTable data={requests} columns={columns} ring={false} />;
        }}
      </QueryCompLayout>
    </div>
  );
}
