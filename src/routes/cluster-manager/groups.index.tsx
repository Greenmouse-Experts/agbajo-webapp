import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  Plus,
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/cluster-manager/groups/")({
  component: ClusterManagerGroups,
});

type GroupStatus = "active" | "frozen" | "closed" | "completed";
type ContributionFrequency = "daily" | "weekly" | "monthly";

interface Group {
  id: string;
  group_name: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  max_members: number;
  member_count: number;
  total_contributions?: number;
  status: GroupStatus;
  created_at: string;
}

const defaultForm = {
  groupName: "",
  contributionAmount: "",
  frequency: "weekly" as ContributionFrequency,
  maxMembers: "10",
  startDate: "",
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

function ClusterManagerGroups() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [createForm, setCreateForm] = useState(defaultForm);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["cluster-manager", "groups"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Group[]>>("cluster-manager/groups")
        .then((r) => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: (body: object) =>
      apiClient.post("cluster-manager/groups", body),
    onSuccess: () => {
      modalRef.current?.close();
      setCreateForm(defaultForm);
      queryClient.invalidateQueries({ queryKey: ["cluster-manager", "groups"] });
    },
  });

  const filtered = groups.filter((g) =>
    g.group_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      group_name: createForm.groupName,
      contribution_amount: parseFloat(createForm.contributionAmount),
      frequency: createForm.frequency,
      max_members: parseInt(createForm.maxMembers),
      start_date: createForm.startDate,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">My Groups</h1>
          <p className="text-base-content/60 mt-1">
            Manage your Ajo savings groups
          </p>
        </div>
        <button
          onClick={() => modalRef.current?.showModal()}
          className="btn btn-primary"
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <label className="input w-full">
          <Search className="w-5 h-5 text-base-content/40" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content/40" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No groups found
          </h3>
          <p className="text-base-content/60">
            Create your first group to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <div
              key={group.id}
              className="card bg-base-100 shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {group.group_name[0].toUpperCase()}
                  </span>
                </div>
                <span className={`badge ${statusBadgeClass[group.status]}`}>
                  {group.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-base-content">
                {group.group_name}
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: "Members",
                    value: `${group.member_count}/${group.max_members}`,
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Amount",
                    value: formatCurrency(group.contribution_amount),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Frequency",
                    value: group.frequency,
                  },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="flex items-center gap-2 text-base-content/60">
                      {icon}
                      {label}
                    </div>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-base-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-base-content/60">Total Collected</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(group.total_contributions)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <dialog ref={modalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="text-xl font-semibold">Create New Group</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Set up a new Ajo savings group
          </p>

          <form onSubmit={handleCreate} className="space-y-4 mt-6">
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
                  <span className="text-base-content/50">₦</span>
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
    </div>
  );
}
