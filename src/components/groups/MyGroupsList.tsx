import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Users, Search } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import { formatCurrency } from "#/helpers/currency";
import PageLoader from "#/components/layout/PageLoader";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import type { Group, MemberStatus } from "#/types/groups";

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

const columns: columnType<MyGroupItem>[] = [
  { key: "groupName", label: "Group Name" },
  {
    key: "contributionAmount",
    label: "Amount",
    render: (value: number, item: MyGroupItem) => (
      <div>
        <span className="font-medium">{formatCurrency(value)}</span>
        <span className="text-xs text-base-content/60 ml-1 capitalize">/ {item.frequency}</span>
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
    key: "startDate",
    label: "Start Date",
    render: (value: string) =>
      new Date(value).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }),
  },
  {
    key: "memberStatus",
    label: "Status",
    render: (value?: MemberStatus) =>
      value ? (
        <span className={`badge ${statusBadge[value]} capitalize`}>{value}</span>
      ) : null,
  },
];

export default function MyGroupsList() {
  const [search, setSearch] = useState("");
  const [cursor, setCursor] = useState<string | null>(null);
  const navigate = useNavigate();

  const groupsQuery = useQuery<ApiResponse<{ groups: MyGroupItem[]; pagination: any }>>({
    queryKey: ["contributor", "my-groups", search, cursor],
    queryFn: () =>
      apiClient
        .get("groups", {
          params: { search: search || undefined, limit: 10, cursor: cursor || undefined },
        })
        .then((r) => r.data),
  });

  return (
    <>
      <div className="card bg-base-100 shadow-sm p-4">
        <label className="input w-full max-w-sm">
          <Search className="w-4 h-4 text-base-content/50" />
          <input
            type="text"
            placeholder="Search my groups..."
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
              {groups.length === 0 ? (
                <div className="card bg-base-100 shadow p-12 text-center">
                  <Users className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                  <p className="font-medium text-base-content">No groups yet</p>
                  <p className="text-sm text-base-content/60 mt-1">
                    Switch to Public Groups to find and join a group
                  </p>
                </div>
              ) : (
                <CustomTable
                  data={groups}
                  columns={columns}
                  onRowClick={(g) => navigate({ to: "/contributor/group/$id", params: { id: g.id } })}
                />
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
          );
        }}
      </PageLoader>
    </>
  );
}
