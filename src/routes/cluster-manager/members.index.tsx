import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Mail,
  Star,
  AlertCircle,
  UserCheck,
  UserX,
} from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import SimpleSelect from "#/components/modals/inputs/SimpleSelect";

export const Route = createFileRoute("/cluster-manager/members/")({
  component: ClusterManagerMembers,
});

type MemberStatus = "active" | "pending" | "suspended" | "removed";

interface Member {
  member_id: string;
  member_status: MemberStatus;
  rating?: number;
  total_contributions?: number;
  profile?: { full_name: string; email: string; phone_number?: string };
  group?: { id: string; group_name: string };
}

const statusBadgeClass: Record<MemberStatus, string> = {
  active: "badge-success",
  pending: "badge-warning",
  suspended: "badge-error",
  removed: "badge-neutral",
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const Avatar = ({ name }: { name?: string }) => (
  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white text-base font-medium shrink-0">
    {(name?.[0] ?? "M").toUpperCase()}
  </div>
);

function ClusterManagerMembers() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [inviteForm, setInviteForm] = useState({ email: "", firstName: "", lastName: "", groupId: "" });

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["cluster-manager", "members"],
    queryFn: () =>
      apiClient.get<ApiResponse<Member[]>>("/members").then((r) => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: MemberStatus }) =>
      apiClient.patch(`cluster-manager/members/${id}/status`, { status }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["cluster-manager", "members"],
      }),
  });

  const inviteMutation = useMutation({
    mutationFn: ({ groupId, ...body }: typeof inviteForm) =>
      apiClient.post(`groups/${groupId}/email-invitation`, body),
    onSuccess: () => {
      modalRef.current?.close();
      setInviteForm({ email: "", firstName: "", lastName: "", groupId: "" });
    },
  });

  const filtered = members.filter((m) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      m.profile?.full_name?.toLowerCase().includes(q) ||
      m.profile?.email?.toLowerCase().includes(q);
    const matchesStatus =
      statusFilter === "all" || m.member_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Members</h1>
          <p className="text-base-content mt-1">
            Manage members across your groups
          </p>
        </div>
        <button
          onClick={() => modalRef.current?.showModal()}
          className="btn btn-primary"
        >
          <Mail className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="input flex-1">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <select
            className="select w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No members found
          </h3>
          <p className="text-base-content">Invite members to your groups</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Group</th>
                <th>Contributions</th>
                <th>Rating</th>
                <th>Status</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => (
                <tr key={member.member_id} className="hover">
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar name={member.profile?.full_name} />
                      <span className="font-medium">
                        {member.profile?.full_name ?? "—"}
                      </span>
                    </div>
                  </td>
                  <td className="text-base-content">
                    {member.profile?.email ?? "—"}
                  </td>
                  <td className="text-base-content">
                    {member.group?.group_name ?? "—"}
                  </td>
                  <td className="font-medium">
                    {formatCurrency(member.total_contributions)}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      {member.rating?.toFixed(1) ?? "—"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge ${statusBadgeClass[member.member_status]}`}
                    >
                      {member.member_status}
                    </span>
                  </td>
                  <td>
                    {member.member_status === "pending" && (
                      <div className="flex gap-1">
                        <button
                          className="btn btn-success btn-sm btn-square"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: member.member_id,
                              status: "active",
                            })
                          }
                        >
                          <UserCheck className="w-3 h-3" />
                        </button>
                        <button
                          className="btn btn-error btn-sm btn-square"
                          disabled={statusMutation.isPending}
                          onClick={() =>
                            statusMutation.mutate({
                              id: member.member_id,
                              status: "suspended",
                            })
                          }
                        >
                          <UserX className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-xl font-semibold">Invite Member</h3>
          <p className="text-base text-base-content mt-1">
            Invite a contributor to a group
          </p>

          <form onSubmit={handleInvite} className="space-y-4 mt-6">
            <div className="grid grid-cols-2 gap-3">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">First Name</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Jane"
                  value={inviteForm.firstName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, firstName: e.target.value })
                  }
                  required
                />
              </fieldset>
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Last Name</legend>
                <input
                  type="text"
                  className="input w-full"
                  placeholder="Doe"
                  value={inviteForm.lastName}
                  onChange={(e) =>
                    setInviteForm({ ...inviteForm, lastName: e.target.value })
                  }
                  required
                />
              </fieldset>
            </div>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Email Address</legend>
              <input
                type="email"
                className="input w-full"
                placeholder="contributor@example.com"
                value={inviteForm.email}
                onChange={(e) =>
                  setInviteForm({ ...inviteForm, email: e.target.value })
                }
                required
              />
            </fieldset>

            <SimpleSelect
              route="groups"
              label="Select Group"
              value={inviteForm.groupId || null}
              onChange={(v) =>
                setInviteForm({ ...inviteForm, groupId: v ?? "" })
              }
              extractItems={(data) => data?.groups ?? []}
              render={(g: any) => (
                <option key={g.id} value={g.id}>
                  {g.groupName ?? g.group_name}
                </option>
              )}
            />

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => modalRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Send Invitation
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
