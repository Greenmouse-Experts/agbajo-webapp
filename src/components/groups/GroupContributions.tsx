import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, RefreshCw } from "lucide-react";
import {
  getContributionsApi,
  type Contribution,
  type ContributionsParams,
} from "#/api/groups/groups-api.tsx";
import QueryCompLayout from "#/components/layout/QueryCompLayout";

type StatusFilter = "all" | "pending" | "paid" | "insufficient_funds";

const statusConfig: Record<
  Contribution["status"],
  { label: string; badge: string }
> = {
  pending: { label: "Pending", badge: "badge-warning" },
  paid: { label: "Paid", badge: "badge-success" },
  insufficient_funds: { label: "Insufficient Funds", badge: "badge-error" },
};

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });

interface Props {
  groupId: string;
}

export default function GroupContributions({ groupId }: Props) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const params: ContributionsParams = {
    groupId,
    limit: 20,
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
  };

  const query = useQuery({
    queryKey: ["contributions", groupId, statusFilter],
    queryFn: () => getContributionsApi(params),
  });

  const tabs: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "paid", label: "Paid" },
    { key: "pending", label: "Pending" },
    { key: "insufficient_funds", label: "Failed" },
  ];

  return (
    <div className="card bg-base-100 shadow-sm overflow-hidden h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
        <DollarSign className="w-4 h-4 text-base-content/40" />
        <h3 className="font-semibold text-base-content">Contributions</h3>
        {query.isFetching && !query.isLoading ? (
          <RefreshCw className="w-3.5 h-3.5 text-base-content/30 animate-spin ml-auto" />
        ) : null}
      </div>

      {/* Status filter tabs */}
      <div className="flex border-b border-base-200 px-2 pt-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors ${
              statusFilter === t.key
                ? "border-primary text-primary"
                : "border-transparent text-base-content/50 hover:text-base-content"
            }`}
            onClick={() => setStatusFilter(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <QueryCompLayout query={query}>
        {(res) => {
          const contributions = res.data?.contributions ?? [];
          if (contributions.length === 0) {
            return (
              <div className="flex flex-col items-center gap-2 py-12 text-base-content/30">
                <DollarSign className="w-8 h-8" />
                <p className="text-sm">No contributions yet</p>
              </div>
            );
          }
          return (
            <div className="divide-y divide-base-200 overflow-y-auto max-h-[500px]">
              {contributions.map((c) => {
                const cfg = statusConfig[c.status];
                //@ts-ignore
                const name =
                  //@ts-ignore

                  c.firstName && c.lastName
                    ? //@ts-ignore

                      `${c.firstName} ${c.lastName}`.trim()
                    : "—";
                return (
                  <div
                    key={c.id}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-base-200/40 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm shrink-0">
                      {(c.firstName?.[0] ?? "?").toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-base-content text-sm truncate">
                        {name}
                      </p>
                      <p className="text-xs text-base-content/50">
                        {c.deductedAt ? formatDate(c.deductedAt) : "pending"}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="font-semibold text-sm text-base-content">
                        {formatCurrency(c.contributionAmount)}
                      </span>
                      <span className={`badge badge-sm ${cfg.badge}`}>
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }}
      </QueryCompLayout>
    </div>
  );
}
