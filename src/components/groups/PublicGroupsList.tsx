import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Search, LogIn } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import { formatCurrency } from "#/helpers/currency";
import { toast } from "sonner";
import PageLoader from "#/components/layout/PageLoader";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import DialogModal, { type ModalHandle } from "#/components/modals/DialogModal";
import type { Group, GroupManager } from "#/types/groups";

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

export default function PublicGroupsList() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const joinModalRef = useRef<ModalHandle>(null);
  const [joiningGroup, setJoiningGroup] = useState<Group | null>(null);

  const groupsQuery = useQuery<ApiResponse<{ groups: Group[]; pagination: any }>>({
    queryKey: ["groups", "public", search, cursor],
    queryFn: () =>
      apiClient
        .get("/groups/public", {
          params: { search: search || undefined, limit: 10, cursor: cursor || undefined },
        })
        .then((r) => r.data),
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
            <div className="text-sm">{managerName(managers[0])}</div>
            {managers.length > 1 && (
              <div className="text-xs text-base-content/60">+{managers.length - 1} more</div>
            )}
          </div>
        ),
    },
    {
      key: "maxMembers",
      label: "Members",
      render: (value: number) => (
        <div className="flex items-center gap-1 text-base-content/60">
          <Users className="w-4 h-4" /> {value}
        </div>
      ),
    },
    {
      key: "contributionAmount",
      label: "Amount",
      render: (value: number) => (
        <span className="font-medium">{formatCurrency(value)}</span>
      ),
    },
    {
      key: "frequency",
      label: "Frequency",
      render: (value: string) => <span className="capitalize text-base-content/60">{value}</span>,
    },
    {
      key: "type",
      label: "Type",
      render: (value: string) => (
        <span className="badge badge-outline capitalize">{value}</span>
      ),
    },
    {
      key: "action",
      label: "",
      render: (_: any, item: Group) => {
        const requested = requestedIds.has(item.id);
        if (requested) return <span className="badge badge-warning">Requested</span>;
        return (
          <button
            className="btn btn-primary btn-sm"
            onClick={(e) => {
              e.stopPropagation();
              setJoiningGroup(item);
              joinModalRef.current?.open();
            }}
          >
            <LogIn className="w-4 h-4" />
            Join
          </button>
        );
      },
    },
  ];

  return (
    <>
      <div className="card bg-base-100 shadow-sm p-4">
        <label className="input w-full max-w-sm">
          <Search className="w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search groups..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCursor(null); }}
          />
        </label>
      </div>

      <PageLoader query={groupsQuery}>
        {(data) => {
          const groups = data.data.groups;
          const pagination = data.data.pagination;
          return (
            <div className="space-y-3">
              <CustomTable data={groups} columns={columns} />
              {pagination && (
                <div className="flex items-center justify-between px-1">
                  <span className="text-sm text-base-content/60">
                    {pagination.total} group{pagination.total !== 1 ? "s" : ""}
                  </span>
                  <div className="join">
                    <button className="join-item btn btn-sm" disabled={!cursor} onClick={() => setCursor(null)}>«</button>
                    <button className="join-item btn btn-sm" disabled={!pagination.hasMore} onClick={() => setCursor(pagination.nextCursor)}>»</button>
                  </div>
                </div>
              )}
            </div>
          );
        }}
      </PageLoader>

      <DialogModal
        ref={joinModalRef}
        title="Join Group"
        actions={
          <>
            <button className="btn btn-ghost" onClick={() => joinModalRef.current?.close()}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              disabled={requestJoinMutation.isPending}
              onClick={() => joiningGroup && requestJoinMutation.mutate(joiningGroup.id)}
            >
              {requestJoinMutation.isPending && <span className="loading loading-spinner loading-sm" />}
              Send Request
            </button>
          </>
        }
      >
        {joiningGroup && (
          <p className="text-base-content/70">
            Send a join request to{" "}
            <span className="font-medium text-base-content">{joiningGroup.groupName}</span>?
          </p>
        )}
      </DialogModal>
    </>
  );
}
