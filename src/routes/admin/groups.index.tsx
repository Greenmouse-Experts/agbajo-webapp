import { useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "#/store/authStore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  AlertCircle,
  Plus,
  Pencil,
  Trash2,
  Eye,
  UsersRound,
} from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import type { Actions } from "#/components/tables/pop-up";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";
import type { Group, GroupManager, Plan } from "#/types/groups.js";

type CreatedByFilter = "admin" | "manager";

interface GroupsSearch {
  createdBy: CreatedByFilter;
  search: string;
}

export const Route = createFileRoute("/admin/groups/")({
  validateSearch: (s): GroupsSearch => ({
    createdBy: (s.createdBy as CreatedByFilter) || "admin",
    search: String(s.search ?? ""),
  }),
  component: AdminGroups,
});

type ContributionFrequency = "daily" | "weekly" | "monthly";
type GroupType = "private" | "public";

const defaultForm = {
  groupName: "",
  planId: "",
  contributionAmount: "",
  frequency: "weekly" as ContributionFrequency,
  frequencyAmount: "1",
  maxMembers: "10",
  startDate: "",
  type: "private" as GroupType,
  clusterManagerId: "",
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

const columns: columnType<Group>[] = [
  { key: "groupName", label: "Group Name" },
  {
    key: "managers",
    label: "Managers",
    render: (managers: GroupManager[]) =>
      managers.length === 0 ? (
        <span className="text-base-content/40">—</span>
      ) : (
        <div>
          <div className="text-sm text-base-content">
            {managerName(managers[0])}
          </div>
          {managers.length > 1 && (
            <div className="text-xs text-base-content/60">
              +{managers.length - 1} more
            </div>
          )}
        </div>
      ),
  },
  {
    key: "maxMembers",
    label: "Members",
    render: (value: number) => (
      <div className="flex items-center gap-1 text-base-content/60">
        <Users className="w-4 h-4" />
        {value}
      </div>
    ),
  },
  {
    key: "contributionAmount",
    label: "Amount",
    render: (value: number) => (
      <span className="font-medium text-base-content">
        {formatCurrency(value)}
      </span>
    ),
  },
  {
    key: "frequency",
    label: "Frequency",
    render: (value: string) => (
      <span className="capitalize text-base-content/60">{value}</span>
    ),
  },
  {
    key: "type",
    label: "Type",
    render: (value: string) => (
      <span className="badge badge-outline capitalize">{value}</span>
    ),
  },
  {
    key: "startDate",
    label: "Start Date",
    render: (value: string) => (
      <span className="text-sm text-base-content/60">
        {new Date(value).toLocaleDateString()}
      </span>
    ),
  },
];

const TABS: { label: string; value: CreatedByFilter }[] = [
  { label: "Created by Admin", value: "admin" },
  { label: "Created by Cluster Manager", value: "manager" },
];

function AdminGroups() {
  const [authUser] = useAuth();
  const currentUserId = String(authUser?.user?.id ?? "");
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: Route.fullPath });
  const { createdBy, search: searchQuery } = Route.useSearch();

  const setSearch = (patch: Partial<GroupsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const createModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const [createForm, setCreateForm] = useState(defaultForm);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);

  const groupsQuery = useQuery<ApiResponseV2<Group[]>>({
    queryKey: ["admin", "groups", createdBy, searchQuery],
    queryFn: async () => {
      const resp = await apiClient.get("groups", {
        params: {
          createdBy,
          ...(searchQuery ? { search: searchQuery } : {}),
          limit: 10,
        },
      });
      return resp.data;
    },
  });

  const managersListQuery = useQuery<ApiResponseV2<GroupManager[]>>({
    queryKey: ["admin", "cluster-managers", "all"],
    queryFn: async () => {
      const resp = await apiClient.get("admins/users/cluster-managers");
      return resp.data;
    },
  });

  const plansQuery = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const resp = await apiClient.get<{ status: string; data: Plan[] }>(
        "/plans/all",
      );
      return resp.data.data;
    },
  });

  const managerOptions = (managersListQuery.data?.data?.users ??
    []) as GroupManager[];
  const planOptions = plansQuery.data ?? [];

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "groups", createdBy] });

  const createMutation = useMutation({
    mutationFn: (body: object) =>
      toast
        .promise(apiClient.post("groups", body), {
          loading: "Creating group...",
          success: "Group created",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      createModalRef.current?.close();
      setCreateForm(defaultForm);
      invalidateGroups();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      groupName: createForm.groupName,
      planId: createForm.planId,
      contributionAmount: parseFloat(createForm.contributionAmount),
      frequency: createForm.frequency,
      frequencyAmount: parseInt(createForm.frequencyAmount),
      maxMembers: parseInt(createForm.maxMembers),
      startDate: new Date(createForm.startDate).toISOString(),
      clusterManagerId: createForm.clusterManagerId,
      type: createForm.type,
    });
  };

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      toast
        .promise(apiClient.delete(`admins/groups/${id}`), {
          loading: "Deleting group...",
          success: "Group deleted",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: invalidateGroups,
  });

  const editMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: object }) =>
      toast
        .promise(apiClient.patch(`groups/${id}`, body), {
          loading: "Updating group...",
          success: "Group updated",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      editModalRef.current?.close();
      invalidateGroups();
    },
  });

  const openEdit = (group: Group) => {
    setEditGroup(group);
    setEditForm({
      groupName: group.groupName,
      planId: group.planId,
      contributionAmount: String(group.contributionAmount),
      frequency: group.frequency as ContributionFrequency,
      frequencyAmount: String(group.frequencyAmount),
      maxMembers: String(group.maxMembers),
      startDate: group.startDate.split("T")[0],
      type: group.type as GroupType,
      clusterManagerId: "",
    });
    editModalRef.current?.showModal();
  };

  const handleEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editGroup) return;
    editMutation.mutate({
      id: editGroup.id,
      body: {
        groupName: editForm.groupName,
        contributionAmount: parseFloat(editForm.contributionAmount),
        frequency: editForm.frequency,
        frequencyAmount: parseInt(editForm.frequencyAmount),
        maxMembers: parseInt(editForm.maxMembers),
        startDate: new Date(editForm.startDate).toISOString(),
        type: editForm.type,
      },
    });
  };

  const groupActions: Actions<Group>[] = [
    {
      key: "view",
      label: "View Group",
      render: () => (
        <span className="flex items-center gap-2">
          <Eye className="w-3 h-3" /> View Group
        </span>
      ),
      action: (g, nav) => nav({ to: "/admin/groups/$d", params: { d: g.id } }),
    },
    {
      key: "members",
      label: "Members",
      render: () => (
        <span className="flex items-center gap-2">
          <UsersRound className="w-3 h-3" /> Members
        </span>
      ),
      action: (g, nav) => nav({ to: "/admin/groups/$d", params: { d: g.id } }),
    },
    {
      key: "edit",
      label: "Edit",
      render: (g) => (
        <span className={`flex items-center gap-2 ${g.createdBy !== currentUserId ? "opacity-40" : ""}`}>
          <Pencil className="w-3 h-3" /> Edit
        </span>
      ),
      disabled: (g) => g.createdBy !== currentUserId,
      action: openEdit,
    },
    {
      key: "delete",
      label: "Delete",
      render: () => (
        <span className="flex items-center gap-2 text-error">
          <Trash2 className="w-3 h-3" /> Delete
        </span>
      ),
      action: (g) => deleteMutation.mutate(g.id),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Ajo Groups</h1>
          <p className="text-base-content/60 mt-1">
            View and manage all savings groups
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => createModalRef.current?.showModal()}
        >
          <Plus className="w-4 h-4" />
          Create Group
        </button>
      </div>

      {/* Creator tabs */}
      <div className="tabs tabs-border">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            className={`tab ${createdBy === tab.value ? "tab-active font-semibold" : ""}`}
            onClick={() => setSearch({ createdBy: tab.value })}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card bg-base-100 shadow-sm p-4">
        <SearchBar
          value={searchQuery}
          onChange={(v: string) => setSearch({ search: v })}
        />
      </div>

      <PageLoader query={groupsQuery}>
        {(data) => {
          const filtered = (data.data.groups ?? []) as Group[];

          if (filtered.length === 0) {
            return (
              <div className="card bg-base-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                  <AlertCircle className="w-8 h-8 text-base-content/40" />
                </div>
                <h3 className="text-lg font-medium text-base-content mb-1">
                  No groups found
                </h3>
                <p className="text-base-content/60">
                  Try adjusting your search or create a new group
                </p>
              </div>
            );
          }

          return (
            <CustomTable
              data={filtered}
              columns={columns}
              actions={groupActions}
            />
          );
        }}
      </PageLoader>

      {/* Create Group Modal */}
      <dialog ref={createModalRef} className="modal">
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

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Plan</legend>
              <select
                className="select w-full"
                value={createForm.planId}
                onChange={(e) => {
                  const planId = e.target.value;
                  const plan = planOptions.find((p) => p.id === planId);
                  setCreateForm({
                    ...createForm,
                    planId,
                    ...(plan && {
                      contributionAmount: String(plan.contributionAmount),
                      frequency: plan.frequency as ContributionFrequency,
                      frequencyAmount: String(plan.frequencyAmount),
                    }),
                  });
                }}
                required
              >
                <option value="">Select a plan</option>
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.frequency} × {p.frequencyAmount}
                  </option>
                ))}
              </select>
            </fieldset>

            <div className="grid grid-cols-3 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Contribution Amount</legend>
                <label className="input w-full bg-base-200/50">
                  <span className="text-base-content">₦</span>
                  <input
                    type="text"
                    value={createForm.contributionAmount || "—"}
                    readOnly
                    className="cursor-default"
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Frequency</legend>
                <input
                  type="text"
                  className="input w-full bg-base-200/50 capitalize cursor-default"
                  value={createForm.frequency || "—"}
                  readOnly
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Every (interval)</legend>
                <input
                  type="text"
                  className="input w-full bg-base-200/50 cursor-default"
                  value={createForm.frequencyAmount || "—"}
                  readOnly
                />
              </fieldset>
            </div>

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

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Type</legend>
                <select
                  className="select w-full"
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      type: e.target.value as GroupType,
                    })
                  }
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Start Date</legend>
                <input
                  type="date"
                  className="input w-full"
                  value={createForm.startDate}
                  min={
                    new Date(Date.now() + 86400000).toISOString().split("T")[0]
                  }
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
                {managerOptions.map((m) => (
                  <option key={m.id} value={m.id}>
                    {managerName(m)} — {m.email}
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

      {/* Edit Group Modal */}
      <dialog ref={editModalRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="text-xl font-semibold">Edit Group</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Update group details
          </p>

          <form onSubmit={handleEdit} className="space-y-4 mt-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Group Name</legend>
              <input
                type="text"
                className="input w-full"
                value={editForm.groupName}
                onChange={(e) =>
                  setEditForm({ ...editForm, groupName: e.target.value })
                }
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Plan</legend>
              <select
                className="select w-full"
                value={editForm?.planId}
                onChange={(e) => {
                  const planId = e.target.value;
                  const plan = planOptions.find((p) => p.id === planId);
                  setEditForm({
                    ...editForm,
                    planId,
                    ...(plan && {
                      contributionAmount: String(plan.contributionAmount),
                      frequency: plan.frequency as ContributionFrequency,
                      frequencyAmount: String(plan.frequencyAmount),
                    }),
                  });
                }}
                required
              >
                <option value="">Select a plan</option>
                {planOptions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.frequency} × {p.frequencyAmount}
                  </option>
                ))}
              </select>
            </fieldset>

            <div className="grid grid-cols-3 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Contribution Amount</legend>
                <label className="input w-full bg-base-200/50">
                  <span className="text-base-content">₦</span>
                  <input
                    type="text"
                    value={editForm.contributionAmount}
                    readOnly
                    className="cursor-default"
                  />
                </label>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Frequency</legend>
                <input
                  type="text"
                  className="input w-full bg-base-200/50 capitalize cursor-default"
                  value={editForm.frequency}
                  readOnly
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Every (interval)</legend>
                <input
                  type="text"
                  className="input w-full bg-base-200/50 cursor-default"
                  value={editForm.frequencyAmount}
                  readOnly
                />
              </fieldset>
            </div>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Max Members</legend>
              <input
                type="number"
                className="input w-full"
                value={editForm.maxMembers}
                onChange={(e) =>
                  setEditForm({ ...editForm, maxMembers: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Type</legend>
                <select
                  className="select w-full"
                  value={editForm.type}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      type: e.target.value as GroupType,
                    })
                  }
                >
                  <option value="private">Private</option>
                  <option value="public">Public</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Start Date</legend>
                <input
                  type="date"
                  className="input w-full"
                  value={editForm.startDate}
                  onChange={(e) =>
                    setEditForm({ ...editForm, startDate: e.target.value })
                  }
                  required
                />
              </fieldset>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => editModalRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={editMutation.isPending}
              >
                {editMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Save Changes
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
