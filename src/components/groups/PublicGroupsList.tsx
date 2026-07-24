import { useRef, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Users, Search, LogIn, DollarSign, Calendar } from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import { formatCurrency } from "#/helpers/currency";
import { toast } from "sonner";
import PageLoader from "#/components/layout/PageLoader";
import type { Group } from "#/types/groups";

interface Props {
  myGroupIds?: Set<string>;
}

export default function PublicGroupsList({ myGroupIds = new Set() }: Props) {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const joinModalRef = useRef<HTMLDialogElement>(null);
  const [joiningGroup, setJoiningGroup] = useState<Group | null>(null);

  const groupsQuery = useQuery<ApiResponseV2<Group[]>>({
    queryKey: ["groups", "public", search, cursor],
    queryFn: () =>
      apiClient
        .get("groups/public", {
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

  const groups = (groupsQuery.data?.data?.data ?? []) as Group[];
  const pagination = groupsQuery.data?.data?.pagination;

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
        {() => (
          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="card bg-base-100 shadow p-12 text-center">
                <Users className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                <p className="font-medium text-base-content">No public groups found</p>
                <p className="text-sm text-base-content/60 mt-1">Try a different search</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => {
                  const alreadyMember = myGroupIds.has(group.id);
                  const requested = requestedIds.has(group.id);
                  return (
                    <div key={group.id} className="card bg-base-100 shadow hover:shadow-md transition-shadow">
                      <div className="card-body p-4 gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-base-content line-clamp-1">
                            {group.groupName}
                          </h3>
                          <span className="badge badge-outline capitalize shrink-0">{group.type}</span>
                        </div>

                        <div className="space-y-1.5 text-sm text-base-content/70">
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-3.5 h-3.5 shrink-0" />
                            <span>{formatCurrency(group.contributionAmount)} · <span className="capitalize">{group.frequency}</span></span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="w-3.5 h-3.5 shrink-0" />
                            <span>Up to {group.maxMembers} members</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>Starts {new Date(group.startDate).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}</span>
                          </div>
                          {group.managers.length > 0 && (
                            <p className="truncate text-xs text-base-content/50">
                              Manager: {group.managers[0].firstName} {group.managers[0].lastName}
                            </p>
                          )}
                        </div>

                        <div className="card-actions justify-end mt-1">
                          {alreadyMember ? (
                            <span className="badge badge-success">Member</span>
                          ) : requested ? (
                            <span className="badge badge-warning">Requested</span>
                          ) : (
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => { setJoiningGroup(group); joinModalRef.current?.showModal(); }}
                            >
                              <LogIn className="w-4 h-4" />
                              Join
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

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
        )}
      </PageLoader>

      <dialog ref={joinModalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-lg font-semibold text-base-content">Join Group</h3>
          {joiningGroup && (
            <p className="mt-2 text-base-content/70">
              Send a join request to{" "}
              <span className="font-medium text-base-content">{joiningGroup.groupName}</span>?
            </p>
          )}
          <div className="modal-action">
            <form method="dialog"><button className="btn btn-ghost">Cancel</button></form>
            <button
              className="btn btn-primary"
              disabled={requestJoinMutation.isPending}
              onClick={() => joiningGroup && requestJoinMutation.mutate(joiningGroup.id)}
            >
              {requestJoinMutation.isPending && <span className="loading loading-spinner loading-sm" />}
              Send Request
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop"><button>close</button></form>
      </dialog>
    </>
  );
}
