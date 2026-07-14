import { forwardRef, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  DollarSign,
  Calendar,
  AlertCircle,
  Plus,
  UserPlus,
  X,
  Check,
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
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";
import { useAuth } from "#/store/authStore.ts";

export const Route = createFileRoute("/cluster-manager/groups/")({
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

interface Plan {
  id: string;
  name: string;
  contributionAmount: string;
  frequency: string;
  frequencyAmount: number;
}

interface GroupManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Group {
  id: string;
  groupName: string;
  contributionAmount: number;
  frequency: string;
  frequencyAmount: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  managers: GroupManager[];
}

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

interface AssignModalProps {
  group: Group | null;
  onChanged: () => void;
}

const AssignManagerModal = forwardRef<ModalHandle, AssignModalProps>(
  ({ group, onChanged }, ref) => {
    const [search, setSearch] = useState("");

    const managersQuery = useQuery<ApiResponseV2<GroupManager[]>>({
      queryKey: ["cluster-managers", "assignable", search],
      queryFn: async () => {
        const resp = await apiClient.get("users/cluster-managers", {
          params: search ? { search } : {},
        });
        return resp.data;
      },
      enabled: !!group,
    });

    const assignMutation = useMutation({
      mutationFn: (userId: string) =>
        toast
          .promise(
            apiClient
              .post(`groups/${group?.id}/assign-manager/${userId}`)
              .then(onChanged),
            {
              loading: "Assigning manager...",
              success: "Manager assigned",
              error: extract_message,
            },
          )
          .unwrap(),
    });

    const assignedIds = new Set((group?.managers ?? []).map((m) => m.id));
    const users = (managersQuery.data?.data?.users ?? []) as GroupManager[];

    return (
      <Modal ref={ref} title="Assign Manager">
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} />

          {managersQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              No cluster managers found
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {users.map((m) => {
                const isAssigned = assignedIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/50"
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-sm font-semibold shrink-0">
                      {m.firstName?.[0]?.toUpperCase() ?? "M"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-base-content truncate">
                        {managerName(m)}
                      </p>
                      <p className="text-xs text-base-content/60 truncate">
                        {m.email}
                      </p>
                    </div>
                    {isAssigned ? (
                      <span className="badge badge-success gap-1 shrink-0">
                        <Check className="w-3 h-3" />
                        Assigned
                      </span>
                    ) : (
                      <button
                        className="btn btn-primary btn-sm shrink-0"
                        disabled={assignMutation.isPending}
                        onClick={() => assignMutation.mutate(m.id)}
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Modal>
    );
  },
);
AssignManagerModal.displayName = "AssignManagerModal";

interface MembersModalProps {
  group: Group | null;
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const GroupMembersModal = forwardRef<ModalHandle, MembersModalProps>(
  ({ group }, ref) => {
    const [search, setSearch] = useState("");

    const membersQuery = useQuery({
      queryKey: ["group", "members", group?.id, search],
      queryFn: async () => {
        const resp = await apiClient.get(`groups/${group?.id}/members`, {
          params: search ? { search } : {},
        });
        return resp.data;
      },
      enabled: !!group,
    });

    const members = (membersQuery.data?.data?.members ?? []) as GroupMember[];

    return (
      <Modal ref={ref} title={`Members — ${group?.groupName ?? ""}`}>
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} />

          {membersQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              No members found
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-base-200"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-sm font-semibold shrink-0">
                    {m.firstName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-base-content truncate">
                      {m.firstName} {m.lastName}
                    </p>
                    <p className="text-xs text-base-content/60 truncate">
                      {m.email}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    );
  },
);
GroupMembersModal.displayName = "GroupMembersModal";

interface InviteModalProps {
  group: Group | null;
}

const InviteUserModal = forwardRef<ModalHandle, InviteModalProps>(
  ({ group }, ref) => {
    const [search, setSearch] = useState("");

    const usersQuery = useQuery({
      queryKey: ["contributors", "invitable", search],
      queryFn: async () => {
        const resp = await apiClient.get("users", {
          params: search ? { search } : {},
        });
        return resp.data;
      },
      enabled: !!group,
    });

    const inviteMutation = useMutation({
      mutationFn: (userId: string) =>
        toast
          .promise(apiClient.post(`groups/${group?.id}/invite/${userId}`), {
            loading: "Sending invite...",
            success: "Invite sent",
            error: extract_message,
          })
          .unwrap(),
    });

    const users = (usersQuery.data?.data?.users ?? []) as GroupManager[];

    return (
      <Modal ref={ref} title="Invite Members">
        <div className="space-y-4">
          <SearchBar value={search} onChange={setSearch} />

          {usersQuery.isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">
              No users found
            </div>
          ) : (
            <div className="space-y-2 max-h-[50vh] overflow-y-auto">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-base-200 hover:bg-base-200/50"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-primary-content text-sm font-semibold shrink-0">
                    {u.firstName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-base-content truncate">
                      {managerName(u)}
                    </p>
                    <p className="text-xs text-base-content/60 truncate">
                      {u.email}
                    </p>
                  </div>
                  <button
                    className="btn btn-primary btn-sm shrink-0"
                    disabled={inviteMutation.isPending}
                    onClick={() => inviteMutation.mutate(u.id)}
                  >
                    <UserPlus className="w-4 h-4" />
                    Invite
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    );
  },
);
InviteUserModal.displayName = "InviteUserModal";

function AdminGroups() {
  const [auth] = useAuth();
  const manager = auth?.user;
  const queryClient = useQueryClient();
  const detailsModalRef = useRef<HTMLDialogElement>(null);
  const assignModalRef = useRef<ModalHandle>(null);
  const inviteModalRef = useRef<ModalHandle>(null);
  const membersModalRef = useRef<ModalHandle>(null);
  const createModalRef = useRef<HTMLDialogElement>(null);
  const editModalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState(defaultForm);
  const [editGroup, setEditGroup] = useState<Group | null>(null);
  const [editForm, setEditForm] = useState(defaultForm);

  const groupsQuery = useQuery<ApiResponseV2<Group[]>>({
    queryKey: ["admin", "groups"],
    queryFn: async () => {
      const resp = await apiClient.get("groups");
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

  const planOptions = plansQuery.data ?? [];

  const groups = (groupsQuery.data?.data?.groups ?? []) as Group[];
  const selected = groups.find((g) => g.id === selectedId) ?? null;

  const invalidateGroups = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "groups"] });

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
      clusterManagerId: manager?.id,
      type: createForm.type,
    });
  };

  const unassignMutation = useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      toast
        .promise(
          apiClient
            .delete(`groups/${groupId}/unassign-manager/${userId}`)
            .then(invalidateGroups),
          {
            loading: "Removing manager...",
            success: "Manager removed",
            error: extract_message,
          },
        )
        .unwrap(),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      toast
        .promise(apiClient.delete(`groups/${id}`), {
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

  const openDetails = (group: Group) => {
    setSelectedId(group.id);
    detailsModalRef.current?.showModal();
  };

  const openEdit = (group: Group) => {
    setEditGroup(group);
    setEditForm({
      groupName: group.groupName,
      planId: "",
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
      label: "View",
      render: () => (
        <span className="flex items-center gap-2">
          <Eye className="w-3 h-3" /> View
        </span>
      ),
      action: openDetails,
    },
    {
      key: "members",
      label: "Members",
      render: () => (
        <span className="flex items-center gap-2">
          <UsersRound className="w-3 h-3" /> Members
        </span>
      ),
      action: (g) => {
        setSelectedId(g.id);
        membersModalRef.current?.open();
      },
    },
    {
      key: "edit",
      label: "Edit",
      render: () => (
        <span className="flex items-center gap-2">
          <Pencil className="w-3 h-3" /> Edit
        </span>
      ),
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

      <div className="card bg-base-100 shadow-sm p-4">
        <SearchBar value={searchQuery} onChange={setSearchQuery} />
      </div>

      <PageLoader query={groupsQuery}>
        {(data) => {
          const all = data.data.groups as Group[];
          const q = searchQuery.toLowerCase();
          const filtered = all.filter(
            (g) =>
              g.groupName.toLowerCase().includes(q) ||
              g.type.toLowerCase().includes(q) ||
              g.frequency.toLowerCase().includes(q),
          );

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

      {/* Details Modal */}
      <dialog ref={detailsModalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-2xl">
            <h3 className="text-xl font-semibold text-base-content">
              {selected.groupName}
            </h3>
            <p className="text-sm text-base-content/60 mt-1">Group Details</p>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Contribution",
                    value: formatCurrency(selected.contributionAmount),
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Per Frequency",
                    value: formatCurrency(selected.frequencyAmount),
                  },
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: "Max Members",
                    value: String(selected.maxMembers),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Frequency",
                    value: selected.frequency,
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Start Date",
                    value: new Date(selected.startDate).toLocaleDateString(),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Created",
                    value: new Date(selected.createdAt).toLocaleDateString(),
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="card bg-base-200 p-4">
                    <div className="flex items-center gap-2 text-base-content/60 mb-1">
                      {icon}
                      <span className="text-sm">{label}</span>
                    </div>
                    <p className="font-bold capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card bg-base-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-base-content">
                    Assigned Managers
                  </h4>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => assignModalRef.current?.open()}
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </button>
                </div>

                {selected.managers.length === 0 ? (
                  <p className="text-sm text-base-content/60">
                    No managers assigned yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {selected.managers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-base-100"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-sm font-semibold shrink-0">
                          {m.firstName[0]?.toUpperCase() ?? "M"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-base-content truncate">
                            {managerName(m)}
                          </p>
                          <p className="text-xs text-base-content/60 truncate">
                            {m.email}
                          </p>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error shrink-0"
                          disabled={unassignMutation.isPending}
                          onClick={() =>
                            unassignMutation.mutate({
                              groupId: selected.id,
                              userId: m.id,
                            })
                          }
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-action">
              <button
                className="btn btn-primary btn-sm"
                onClick={() => inviteModalRef.current?.open()}
              >
                <UserPlus className="w-4 h-4" />
                Invite Members
              </button>
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
                onChange={(e) =>
                  setCreateForm({ ...createForm, planId: e.target.value })
                }
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
                <legend className="fieldset-legend">Every (interval)</legend>
                <input
                  type="number"
                  min={1}
                  className="input w-full"
                  placeholder="1"
                  value={createForm.frequencyAmount}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      frequencyAmount: e.target.value,
                    })
                  }
                  required
                />
              </fieldset>
            </div>

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

            {/*<fieldset className="fieldset">
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
            </fieldset>*/}

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

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Contribution Amount</legend>
                <label className="input w-full">
                  <span className="text-base-content">₦</span>
                  <input
                    type="number"
                    value={editForm.contributionAmount}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
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
                  value={editForm.maxMembers}
                  onChange={(e) =>
                    setEditForm({ ...editForm, maxMembers: e.target.value })
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
                  value={editForm.frequency}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
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
                <legend className="fieldset-legend">Every (interval)</legend>
                <input
                  type="number"
                  min={1}
                  className="input w-full"
                  value={editForm.frequencyAmount}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      frequencyAmount: e.target.value,
                    })
                  }
                  required
                />
              </fieldset>
            </div>

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

      <AssignManagerModal
        ref={assignModalRef}
        group={selected}
        onChanged={invalidateGroups}
      />

      <InviteUserModal ref={inviteModalRef} group={selected} />
      <GroupMembersModal ref={membersModalRef} group={selected} />
    </div>
  );
}
