import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search, DollarSign, Calendar, Activity } from "lucide-react";
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import { formatCurrency } from "#/helpers/currency";
import PageLoader from "#/components/layout/PageLoader";
import type { Group } from "#/types/groups";
import type { MemberStatus } from "#/types/groups";

interface MyGroupItem extends Group {
  memberStatus?: MemberStatus;
  currentCycle?: number;
}

const statusBadge: Record<MemberStatus, string> = {
  active: "badge-success",
  pending: "badge-warning",
  suspended: "badge-error",
  removed: "badge-neutral",
};

export default function MyGroupsList() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);

  const groupsQuery = useQuery<ApiResponseV2<MyGroupItem[]>>({
    queryKey: ["contributor", "my-groups", search, cursor],
    queryFn: () =>
      apiClient
        .get("groups", {
          params: {
            search: search || undefined,
            limit: 10,
            cursor: cursor || undefined,
          },
        })
        .then((r) => r.data),
  });

  const groups = (groupsQuery.data?.data?.data ?? []) as MyGroupItem[];
  const pagination = groupsQuery.data?.data?.pagination;

  return (
    <>
      <div className="card bg-base-100 shadow-sm p-4">
        <label className="input w-full max-w-sm">
          <Search className="w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search my groups..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCursor(null);
            }}
          />
        </label>
      </div>

      <PageLoader query={groupsQuery}>
        {() => (
          <div className="space-y-3">
            {groups.length === 0 ? (
              <div className="card bg-base-100 shadow p-12 text-center">
                <Users className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                <p className="font-medium text-base-content">No groups yet</p>
                <p className="text-sm text-base-content/60 mt-1">
                  Switch to Public Groups to find and join a group
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {groups.map((group) => (
                  <div
                    key={group.id}
                    className="card bg-base-100 shadow hover:shadow-md transition-shadow"
                  >
                    <div className="card-body p-4 gap-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-base-content line-clamp-1">
                          {group.groupName}
                        </h3>
                        {group.memberStatus && (
                          <span
                            className={`badge ${statusBadge[group.memberStatus]} shrink-0 capitalize`}
                          >
                            {group.memberStatus}
                          </span>
                        )}
                      </div>

                      <div className="space-y-1.5 text-sm text-base-content/70">
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {formatCurrency(group.contributionAmount)} ·{" "}
                            <span className="capitalize">
                              {group.frequency}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>Up to {group.maxMembers} members</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            Starts{" "}
                            {new Date(group.startDate).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                        {group.currentCycle !== undefined && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-3.5 h-3.5 shrink-0" />
                            <span>Cycle {group.currentCycle}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

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
      </PageLoader>
    </>
  );
}
