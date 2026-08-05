import { forwardRef, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Check,
  DollarSign,
  Mail,
  Users,
  UserPlus,
  X,
  RefreshCw,
} from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import InviteByEmailModal from "#/components/modals/InviteByEmailModal";
import { toast } from "sonner";
import { extract_message } from "#/helpers/apihelpers";
import { useAuth, type AUTHRECORD } from "#/store/authStore";
import JoinRequestsList from "#/components/groups/JoinRequestsList";
import GroupMembersList from "#/components/groups/GroupMembersList";
import GroupHeaderDetails from "#/components/GroupHeaderDetails";
import MyGroupHeaderDetails from "#/components/MyGroupHeaderDetails.tsx";
import GroupSlotList from "#/components/groups/GroupSlotLists.tsx";

type TabParam = "members" | "requests";

export const Route = createFileRoute("/cluster-manager/my-group/$d/")({
  validateSearch: (s): { tab?: TabParam } => ({
    tab: (s?.tab as TabParam) ?? "members",
  }),
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
  minMembers: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdAt: string;
  createdBy: string;
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
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

const Initials = ({
  name,
  color = "from-primary to-secondary",
  size = "sm",
}: {
  name: string;
  color?: string;
  size?: "sm" | "md";
}) => (
  <div
    className={`rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-primary-content font-semibold shrink-0 ${size === "md" ? "w-11 h-11 text-base" : "w-9 h-9 text-sm"}`}
  >
    {(name?.[0] ?? "?").toUpperCase()}
  </div>
);

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
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
              <Users className="w-8 h-8" />
              <p className="text-sm">No cluster managers found</p>
            </div>
          ) : (
            <div className="divide-y divide-base-200 max-h-[50vh] overflow-y-auto -mx-1 px-1">
              {users.map((m) => {
                const isAssigned = assignedIds.has(m.id);
                return (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 py-3 first:pt-0"
                  >
                    <Initials name={m.firstName} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-base-content truncate">
                        {managerName(m)}
                      </p>
                      <p className="text-sm text-base-content/50 truncate">
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

interface InviteModalProps {
  groupId: string;
}

const InviteUserModal = forwardRef<ModalHandle, InviteModalProps>(
  ({ groupId }, ref) => {
    const [search, setSearch] = useState("");

    const usersQuery = useQuery({
      queryKey: ["contributors", "invitable", search],
      queryFn: async () => {
        const resp = await apiClient.get("/users", {
          params: search ? { search } : {},
        });
        return resp.data;
      },
    });

    const inviteMutation = useMutation({
      mutationFn: (userId: string) =>
        toast
          .promise(apiClient.post(`groups/${groupId}/invite/${userId}`), {
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
            <div className="flex justify-center py-10">
              <span className="loading loading-spinner loading-md" />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
              <Users className="w-8 h-8" />
              <p className="text-sm">No users found</p>
            </div>
          ) : (
            <div className="divide-y divide-base-200 max-h-[50vh] overflow-y-auto -mx-1 px-1">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 py-3 first:pt-0"
                >
                  <Initials
                    name={u.firstName}
                    color="from-secondary to-accent"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-base-content truncate">
                      {managerName(u)}
                    </p>
                    <p className="text-sm text-base-content/50 truncate">
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

function GroupDetailPage() {
  const { d } = Route.useParams();
  const queryClient = useQueryClient();
  const [rawUser] = useAuth();
  const authUser = rawUser as AUTHRECORD | null;
  const _authId = String(authUser?.user?.id ?? "");
  const navigate = useNavigate();
  const { tab = "members" } = Route.useSearch();
  const assignModalRef = useRef<ModalHandle>(null);
  const inviteModalRef = useRef<ModalHandle>(null);
  const inviteByEmailModalRef = useRef<ModalHandle>(null);
  const groupQuery = useQuery({
    queryKey: ["admin", "group", d],
    queryFn: async () => {
      const resp = await apiClient.get(`groups/${d}`);
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
  const isOwner = true;

  return (
    <div className="space-y-6">
      <Link
        to="/cluster-manager/groups"
        search={{ createdBy: "self" }}
        className="inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Groups
      </Link>

      <PageLoader query={groupQuery}>
        {() =>
          group && (
            <div className="space-y-5">
              {/* Header */}
              <MyGroupHeaderDetails
                group={group}
                isOwner={isOwner}
                onInvite={() => inviteModalRef.current?.open()}
              />

              {/* Managers */}
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-base-200">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base-content">
                      Managers
                    </h3>
                    <span className="badge badge-neutral badge-sm">
                      {group.managers.length}
                    </span>
                  </div>
                  {isOwner && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => assignModalRef.current?.open()}
                    >
                      <UserPlus className="w-4 h-4" />
                      Assign
                    </button>
                  )}
                </div>

                {group.managers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-base-content/40">
                    <Users className="w-8 h-8" />
                    <p className="text-sm">No managers assigned yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-base-200">
                    {group.managers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-5 py-3.5 hover:bg-base-200/40 transition-colors"
                      >
                        <Initials name={m.firstName} size="md" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base-content truncate">
                            {managerName(m)}
                          </p>
                          <p className="text-sm text-base-content/50 truncate">
                            {m.email}
                          </p>
                        </div>
                        {isOwner && (
                          <button
                            className="btn btn-ghost btn-sm btn-square text-error shrink-0"
                            disabled={unassignMutation.isPending}
                            onClick={() => unassignMutation.mutate(m.id)}
                            title="Unassign"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <GroupSlotList groupId={d} />
              {/* Members / Requests tabs */}
              {(() => {
                const showRequests = isOwner && group.type !== "private";
                const activeTab = showRequests ? tab : "members";
                return (
                  <div className="card bg-base-100 shadow-sm overflow-hidden">
                    <div className="tabs tabs-border border-b border-base-200 px-2 pt-2">
                      <button
                        role="tab"
                        className={`tab${activeTab === "members" ? " tab-active font-semibold" : ""}`}
                        onClick={() =>
                          navigate({
                            to: ".",
                            search: (prev) => ({ ...prev, tab: "members" }),
                          })
                        }
                      >
                        Members
                      </button>
                      {showRequests && (
                        <button
                          role="tab"
                          className={`tab${activeTab === "requests" ? " tab-active font-semibold" : ""}`}
                          onClick={() =>
                            navigate({
                              to: ".",
                              search: (prev) => ({ ...prev, tab: "requests" }),
                            })
                          }
                        >
                          Join Requests
                        </button>
                      )}
                    </div>
                    {activeTab === "members" ? (
                      <GroupMembersList
                        groupId={d}
                        queryScope="cluster-manager"
                        ownerId={authUser?.user.id as string}
                        embedded
                      />
                    ) : (
                      <JoinRequestsList groupId={d} />
                    )}
                  </div>
                );
              })()}
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
          <InviteByEmailModal ref={inviteByEmailModalRef} groupId={d} />
        </>
      )}
    </div>
  );
}
