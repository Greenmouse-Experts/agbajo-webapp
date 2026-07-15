import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Search, LogIn } from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import apiClient, {
  type ApiResponse,
  type ApiResponseV2,
} from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import { formatCurrency } from "#/helpers/currency";
import { toast } from "sonner";
import PageLoader from "#/components/layout/PageLoader";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";

export const Route = createFileRoute("/contributor/groups/")({
  component: ContributorGroups,
});

type ContributionFrequency = "daily" | "weekly" | "monthly";
type MemberStatus = "active" | "pending" | "suspended" | "removed";

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
  frequency: ContributionFrequency;
  frequencyAmount: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdAt: string;
  managers: GroupManager[];
}

interface MyGroup {
  id: string;
  group_name: string;
  manager: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  max_members: number;
  current_cycle: number;
  member_status: MemberStatus;
}

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

const columns: columnType<Group>[] = [
  { key: "groupName", label: "Group Name" },
  {
    key: "managers",
    label: "Manager",
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
];

function ContributorGroups() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const joinModalRef = useRef<HTMLDialogElement>(null);
  const [joiningGroup, setJoiningGroup] = useState<Group | null>(null);

  const { data: myGroups = [] } = useQuery({
    queryKey: ["contributor", "groups"],
    queryFn: () =>
      apiClient.get<ApiResponse<MyGroup[]>>("/groups").then((r) => r.data.data),
  });

  const groupsQuery = useQuery<ApiResponseV2<Group[]>>({
    queryKey: ["groups", "public", search, cursor],
    queryFn: async () => {
      const resp = await apiClient.get("groups/public", {
        params: {
          search: search || undefined,
          limit: 10,
          cursor: cursor || undefined,
        },
      });
      return resp.data;
    },
  });

  const requestJoinMutation = useMutation({
    mutationFn: (groupId: string) =>
      toast
        .promise(apiClient.post(`groups/${groupId}/request-join`), {
          loading: "Sending request...",
          success: "Join request sent",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: (_, groupId) => {
      setRequestedIds((prev) => new Set(prev).add(groupId));
      joinModalRef.current?.close();
    },
  });

  const openJoinModal = (group: Group) => {
    setJoiningGroup(group);
    joinModalRef.current?.showModal();
  };

  const tableColumns: columnType<Group>[] = [
    ...columns,
    {
      key: "action",
      label: "",
      render: (_: any, item: Group) => {
        const alreadyMember = myGroupIds.has(item.id);
        const requested = requestedIds.has(item.id);
        if (alreadyMember)
          return <span className="badge badge-success">Member</span>;
        if (requested)
          return <span className="badge badge-warning">Requested</span>;
        return (
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              openJoinModal(item);
            }}
          >
            <LogIn className="w-4 h-4" />
            Join
          </button>
        );
      },
    },
  ];

  const pagination = groupsQuery.data?.data?.pagination;
  const groups = (groupsQuery.data?.data?.data ?? []) as Group[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Public Groups"
        subtitle="Browse and join available savings groups"
      />

      <div className="card bg-base-100 shadow-sm p-4">
        <label className="input w-full max-w-sm">
          <Search className="w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCursor(null);
            }}
          />
        </label>
      </div>

      {/*<PageLoader query={groupsQuery}>
        {() => (
          <div className="space-y-3">
            <CustomTable data={groups} columns={tableColumns} />
            {pagination && (
              <div className="flex items-center justify-between px-1">
                <span className="text-sm text-base-content/60">
                  {pagination.total} group{pagination.total !== 1 ? "s" : ""}
                </span>
                <div className="join">
                  <button
                    className="join-item btn btn-sm"
                    disabled={!cursor}
                    onClick={() => setCursor(null)}
                  >
                    «
                  </button>
                  <button
                    className="join-item btn btn-sm"
                    disabled={!pagination.hasMore}
                    onClick={() => setCursor(pagination.nextCursor)}
                  >
                    »
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </PageLoader>*/}

      <dialog ref={joinModalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-semibold text-base-content">
            Join Group
          </h3>
          {joiningGroup && (
            <p className="mt-2 text-base-content/70">
              Send a join request to{" "}
              <span className="font-medium text-base-content">
                {joiningGroup.groupName}
              </span>
              ?
            </p>
          )}
          <div className="modal-action">
            <form method="dialog">
              <button className="btn btn-ghost">Cancel</button>
            </form>
            <button
              className="btn btn-primary"
              disabled={requestJoinMutation.isPending}
              onClick={() =>
                joiningGroup && requestJoinMutation.mutate(joiningGroup.id)
              }
            >
              Send Request
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
