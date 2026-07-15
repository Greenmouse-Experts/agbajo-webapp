import { forwardRef, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";

export const Route = createFileRoute("/admin/groups/$d/")({
  component: GroupDetailPage,
});

interface GroupManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupDetail {
  id: string;
  groupName: string;
  contributionAmount: number;
  frequency: string;
  frequencyAmount: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdAt: string;
  managers: GroupManager[];
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

interface AssignModalProps {
  groupId: string;
  managers: GroupManager[];
  onChanged: () => void;
}

const AssignManagerModal = forwardRef<ModalHandle, AssignModalProps>(
  ({ groupId, managers, onChanged }, ref) => {
    const [search, setSearch] = useState("");

    const managersQuery = useQuery<ApiResponseV2<GroupManager[]>>({
      queryKey: ["cluster-managers", "assignable", search],
      queryFn: async () => {
        const resp = await apiClient.get("users/cluster-managers", {
          params: search ? { search } : {},
        });
        return resp.data;
      },
    });

    const assignMutation = useMutation({
      mutationFn: (userId: string) =>
        toast
          .promise(
            apiClient
              .post(`groups/${groupId}/assign-manager/${userId}`)
              .then(onChanged),
            {
              loading: "Assigning manager...",
              success: "Manager assigned",
              error: extract_message,
            },
          )
          .unwrap(),
    });

    const assignedIds = new Set(managers.map((m) => m.id));
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
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content  font-semibold shrink-0">
                      {m.firstName?.[0]?.toUpperCase() ?? "M"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className=" font-medium text-base-content truncate">
                        {managerName(m)}
                      </p>
                      <p className=" text-base-content/60 truncate">
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

const ROLE_IDS: Record<string, number> = {
  user: 2,
  admin: 1,
  "cluster-manager": 3,
};

interface InviteModalProps {
  groupId: string;
}

const defaultInviteForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  role: "user" as string,
};

const InviteUserModal = forwardRef<ModalHandle, InviteModalProps>(
  ({ groupId }, ref) => {
    const [form, setForm] = useState(defaultInviteForm);

    const inviteMutation = useMutation({
      mutationFn: (body: typeof defaultInviteForm) =>
        toast
          .promise(
            apiClient.post("auth/invitations", {
              email: body.email,
              firstName: body.firstName,
              lastName: body.lastName,
              phoneNumber: body.phoneNumber,
              roleId: ROLE_IDS[body.role] ?? 2,
              groupId,
            }),
            {
              loading: "Sending invitation...",
              success: "Invitation sent",
              error: extract_message,
            },
          )
          .unwrap(),
      onSuccess: () => setForm(defaultInviteForm),
    });

    const set = (key: keyof typeof defaultInviteForm) =>
      (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
        setForm((f) => ({ ...f, [key]: e.target.value }));

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      inviteMutation.mutate(form);
    };

    return (
      <Modal ref={ref} title="Invite Member">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">First Name</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="John"
                value={form.firstName}
                onChange={set("firstName")}
                required
              />
            </fieldset>
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Last Name</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="Doe"
                value={form.lastName}
                onChange={set("lastName")}
                required
              />
            </fieldset>
          </div>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Email</legend>
            <input
              type="email"
              className="input w-full"
              placeholder="member@example.com"
              value={form.email}
              onChange={set("email")}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Phone Number</legend>
            <input
              type="tel"
              className="input w-full"
              placeholder="+2348012345678"
              value={form.phoneNumber}
              onChange={set("phoneNumber")}
              required
            />
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Role</legend>
            <select
              className="select w-full"
              value={form.role}
              onChange={set("role")}
            >
              <option value="user">Contributor</option>
              <option value="cluster-manager">Cluster Manager</option>
              <option value="admin">Admin</option>
            </select>
          </fieldset>

          <div className="modal-action mt-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={inviteMutation.isPending}
            >
              {inviteMutation.isPending && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Send Invitation
            </button>
          </div>
        </form>
      </Modal>
    );
  },
);
InviteUserModal.displayName = "InviteUserModal";

function GroupDetailPage() {
  const { d } = Route.useParams();
  const queryClient = useQueryClient();
  const assignModalRef = useRef<ModalHandle>(null);
  const inviteModalRef = useRef<ModalHandle>(null);
  const [memberSearch, setMemberSearch] = useState("");

  const groupQuery = useQuery({
    queryKey: ["admin", "group", d],
    queryFn: async () => {
      const resp = await apiClient.get(`groups/${d}`);
      return resp.data;
    },
  });

  const membersQuery = useQuery({
    queryKey: ["admin", "group", d, "members", memberSearch],
    queryFn: async () => {
      const resp = await apiClient.get(`groups/${d}/members`, {
        params: memberSearch ? { search: memberSearch } : {},
      });
      return resp.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "group", d] });

  const unassignMutation = useMutation({
    mutationFn: (userId: string) =>
      toast
        .promise(
          apiClient
            .delete(`groups/${d}/unassign-manager/${userId}`)
            .then(invalidate),
          {
            loading: "Removing manager...",
            success: "Manager removed",
            error: extract_message,
          },
        )
        .unwrap(),
  });

  const group = groupQuery.data?.data as GroupDetail | undefined;
  const members = (membersQuery.data?.data?.members ?? []) as GroupMember[];

  return (
    <div className="space-y-6">
      <Link to="/admin/groups" className="btn btn-ghost  gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" />
        Groups
      </Link>

      <PageLoader query={groupQuery}>
        {() =>
          group && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-base-content">
                    {group.groupName}
                  </h1>
                  <p className="text-base-content/60 mt-1 capitalize">
                    {group.type} group
                  </p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => inviteModalRef.current?.open()}
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Members
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Contribution",
                    value: formatCurrency(group.contributionAmount),
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Per Frequency",
                    value: formatCurrency(group.frequencyAmount),
                  },
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: "Max Members",
                    value: String(group.maxMembers),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Frequency",
                    value: group.frequency,
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Start Date",
                    value: new Date(group.startDate).toLocaleDateString(),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Created",
                    value: new Date(group.createdAt).toLocaleDateString(),
                  },
                ].map(({ icon, label, value }) => (
                  <div key={label} className="card bg-base-100 shadow-sm p-4">
                    <div className="flex items-center gap-2 text-base-content/60 mb-1">
                      {icon}
                      <span className="">{label}</span>
                    </div>
                    <p className="font-bold capitalize">{value}</p>
                  </div>
                ))}
              </div>

              <div className="card bg-base-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-base-content">
                    Assigned Managers
                  </h3>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => assignModalRef.current?.open()}
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </button>
                </div>

                {group.managers.length === 0 ? (
                  <p className=" text-base-content/60">
                    No managers assigned yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {group.managers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-base-200/50"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content  font-semibold shrink-0">
                          {m.firstName[0]?.toUpperCase() ?? "M"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className=" font-medium text-base-content truncate">
                            {managerName(m)}
                          </p>
                          <p className=" text-base-content/60 truncate">
                            {m.email}
                          </p>
                        </div>
                        <button
                          className="btn btn-ghost btn-sm btn-square text-error shrink-0"
                          disabled={unassignMutation.isPending}
                          onClick={() => unassignMutation.mutate(m.id)}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card bg-base-100 shadow-sm p-5 space-y-4">
                <h3 className="font-semibold text-base-content">Members</h3>

                <SearchBar value={memberSearch} onChange={setMemberSearch} />

                {membersQuery.isLoading ? (
                  <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-md" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-8 text-base-content/60">
                    No members yet
                  </div>
                ) : (
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 p-3 rounded-lg border border-base-200"
                      >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content  font-semibold shrink-0">
                          {m.firstName?.[0]?.toUpperCase() ?? "U"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className=" font-medium text-base-content truncate">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className=" text-base-content/60 truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        }
      </PageLoader>

      {group && (
        <>
          <AssignManagerModal
            ref={assignModalRef}
            groupId={d}
            managers={group.managers}
            onChanged={invalidate}
          />
          <InviteUserModal ref={inviteModalRef} groupId={d} />
        </>
      )}
    </div>
  );
}
