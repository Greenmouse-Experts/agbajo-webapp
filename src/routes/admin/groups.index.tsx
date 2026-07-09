import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
  Pause,
  XCircle,
  AlertCircle,
} from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/admin/groups/")({
  component: AdminGroups,
});

type GroupStatus = "active" | "frozen" | "closed" | "completed";
type ContributionFrequency = "daily" | "weekly" | "monthly";

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface Group {
  id: string;
  group_name: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  max_members: number;
  member_count: number;
  start_date: string;
  created_at: string;
  status: GroupStatus;
  status_reason?: string;
  current_cycle?: number;
  total_contributions?: number;
  cluster_manager?: { id: string; name: string; email: string };
}

const defaultForm = {
  groupName: "",
  contributionAmount: "",
  frequency: "weekly" as ContributionFrequency,
  maxMembers: "10",
  startDate: "",
  clusterManagerId: "",
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const statusBadgeClass: Record<GroupStatus, string> = {
  active: "badge-success",
  frozen: "badge-warning",
  closed: "badge-error",
  completed: "badge-primary",
};

const StatusBadge = ({ status }: { status: GroupStatus }) => (
  <span className={`badge ${statusBadgeClass[status]}`}>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </span>
);

function AdminGroups() {
  const queryClient = useQueryClient();
  const createModalRef = useRef<HTMLDialogElement>(null);
  const detailsModalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [createForm, setCreateForm] = useState(defaultForm);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin", "groups"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Group[]>>("admin/groups")
        .then((r) => r.data.data),
  });

  const { data: managers = [] } = useQuery({
    queryKey: ["admin", "managers"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Manager[]>>("admin/managers")
        .then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: object) => apiClient.post("admin/groups", body),
    onSuccess: () => {
      createModalRef.current?.close();
      setCreateForm(defaultForm);
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: GroupStatus;
      reason?: string;
    }) =>
      apiClient.patch(`admin/groups/${id}/status`, {
        status,
        status_reason: reason ?? null,
      }),
    onSuccess: () => {
      detailsModalRef.current?.close();
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });
    },
  });

  const filtered = groups.filter((g) => {
    const matchesSearch = g.group_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      group_name: createForm.groupName,
      contribution_amount: parseFloat(createForm.contributionAmount),
      frequency: createForm.frequency,
      max_members: parseInt(createForm.maxMembers),
      start_date: createForm.startDate,
      cluster_manager_id: createForm.clusterManagerId,
    });
  };

  const openDetails = (group: Group) => {
    setSelectedGroup(group);
    detailsModalRef.current?.showModal();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Ajo Groups</h1>
          <p className="text-base-content mt-1">Manage all savings groups</p>
        </div>
        <button
          onClick={() => createModalRef.current?.showModal()}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="input flex-1">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search groups..."
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
            <option value="frozen">Frozen</option>
            <option value="closed">Closed</option>
            <option value="completed">Completed</option>
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
            No groups found
          </h3>
          <p className="text-base-content">
            Try adjusting your search or create a new group
          </p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Group Name</th>
                <th>Manager</th>
                <th>Members</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Status</th>
                <th>Created</th>
                <th className="w-12"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((group) => (
                <tr key={group.id} className="hover">
                  <td className="font-medium">{group.group_name}</td>
                  <td>
                    <div>{group.cluster_manager?.name ?? "—"}</div>
                    <div className="text-sm text-base-content">
                      {group.cluster_manager?.email}
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-base-content" />
                      {group.member_count}/{group.max_members}
                    </div>
                  </td>
                  <td className="font-medium">
                    {formatCurrency(group.contribution_amount)}
                  </td>
                  <td className="capitalize text-base-content">
                    {group.frequency}
                  </td>
                  <td>
                    <StatusBadge status={group.status} />
                  </td>
                  <td className="text-base text-base-content">
                    {new Date(group.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      onClick={() => openDetails(group)}
                      className="btn btn-ghost btn-sm btn-square"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Group Modal */}
      <dialog ref={createModalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="text-xl font-semibold">Create New Group</h3>
          <p className="text-base text-base-content mt-1">
            Set up a new Ajo savings group
          </p>

          <form onSubmit={handleCreateGroup} className="space-y-4 mt-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Group Name</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="Enter group name"
                value={createForm.groupName}
                onChange={(e) =>
                  setCreateForm({ ...createForm, groupName: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Contribution Amount</legend>
                <label className="input w-full">
                  <span className="text-base-content">₦</span>
                  <input
                    type="number"
                    placeholder="5000"
                    value={createForm.contributionAmount}
                    onChange={(e) =>
                      setCreateForm({
                        ...createForm,
                        contributionAmount: e.target.value,
                      })
                    }
                    required
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Max Members</legend>
                <input
                  type="number"
                  className="input w-full"
                  placeholder="10"
                  value={createForm.maxMembers}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, maxMembers: e.target.value })
                  }
                  required
                />
              </fieldset>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Frequency</legend>
                <select
                  className="select w-full"
                  value={createForm.frequency}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      frequency: e.target.value as ContributionFrequency,
                    })
                  }
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Start Date</legend>
                <input
                  type="date"
                  className="input w-full"
                  value={createForm.startDate}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, startDate: e.target.value })
                  }
                  required
                />
              </fieldset>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">
                Assign Cluster Manager
              </legend>
              <select
                className="select w-full"
                value={createForm.clusterManagerId}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    clusterManagerId: e.target.value,
                  })
                }
                required
              >
                <option value="">Select a manager</option>
                {managers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => createModalRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Create Group
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Group Details Modal */}
      <dialog ref={detailsModalRef} className="modal">
        {selectedGroup && (
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedGroup.group_name}
                </h3>
                <p className="text-base text-base-content mt-1">
                  Group Details
                </p>
              </div>
              <StatusBadge status={selectedGroup.status} />
            </div>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: "Members",
                    value: `${selectedGroup.member_count}/${selectedGroup.max_members}`,
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Amount",
                    value: formatCurrency(selectedGroup.contribution_amount),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Frequency",
                    value: selectedGroup.frequency,
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Total",
                    value: formatCurrency(selectedGroup.total_contributions),
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="card bg-base-200 p-4">
                    <div className="flex items-center gap-2 text-base-content mb-1">
                      {icon}
                      <span className="text-sm">{label}</span>
                    </div>
                    <p className="text-lg font-bold capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-base font-medium text-base-content mb-3">
                  Group Information
                </h4>
                <div className="grid grid-cols-2 gap-4 text-base">
                  <div>
                    <p className="text-base-content">Cluster Manager</p>
                    <p className="font-medium">
                      {selectedGroup.cluster_manager?.name ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content">Current Cycle</p>
                    <p className="font-medium">
                      {selectedGroup.current_cycle ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content">Start Date</p>
                    <p className="font-medium">
                      {new Date(selectedGroup.start_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content">Created</p>
                    <p className="font-medium">
                      {new Date(selectedGroup.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {selectedGroup.status_reason && (
                <div className="card bg-warning border border-warning p-4">
                  <h4 className="text-base font-medium text-warning mb-1">
                    Status Reason
                  </h4>
                  <p className="text-base">{selectedGroup.status_reason}</p>
                </div>
              )}

              {selectedGroup.status === "active" && (
                <div className="flex gap-3">
                  <button
                    className="btn btn-outline flex-1"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      const reason = prompt("Enter reason for freezing:");
                      if (reason)
                        statusMutation.mutate({
                          id: selectedGroup.id,
                          status: "frozen",
                          reason,
                        });
                    }}
                  >
                    <Pause className="w-4 h-4" />
                    Freeze Group
                  </button>
                  <button
                    className="btn btn-error flex-1"
                    disabled={statusMutation.isPending}
                    onClick={() => {
                      const reason = prompt("Enter reason for closing:");
                      if (reason)
                        statusMutation.mutate({
                          id: selectedGroup.id,
                          status: "closed",
                          reason,
                        });
                    }}
                  >
                    <XCircle className="w-4 h-4" />
                    Close Group
                  </button>
                </div>
              )}

              {selectedGroup.status === "frozen" && (
                <button
                  className="btn btn-success w-full"
                  disabled={statusMutation.isPending}
                  onClick={() =>
                    statusMutation.mutate({
                      id: selectedGroup.id,
                      status: "active",
                    })
                  }
                >
                  {statusMutation.isPending && (
                    <span className="loading loading-spinner loading-sm" />
                  )}
                  Reactivate Group
                </button>
              )}
            </div>

            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost">Close</button>
              </form>
            </div>
          </div>
        )}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
