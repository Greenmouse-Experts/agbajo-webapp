import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/cluster-manager/contributions/")({
  component: ClusterManagerContributions,
});

type ContributionStatus = "pending" | "completed" | "failed";

interface Contribution {
  id: string;
  amount: number;
  status: ContributionStatus;
  contribution_type?: string;
  is_late: boolean;
  created_at: string;
  contributor?: { name: string; email: string };
  group?: { group_name: string };
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const StatusBadge = ({ status }: { status: ContributionStatus }) => {
  switch (status) {
    case "completed":
      return (
        <span className="badge badge-success gap-1">
          <CheckCircle className="w-3 h-3" /> Completed
        </span>
      );
    case "failed":
      return (
        <span className="badge badge-error gap-1">
          <XCircle className="w-3 h-3" /> Failed
        </span>
      );
    default:
      return (
        <span className="badge badge-warning gap-1">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
};

function ClusterManagerContributions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ["cluster-manager", "contributions", statusFilter],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Contribution[]>>("cluster-manager/contributions", {
          params: statusFilter !== "all" ? { status: statusFilter } : {},
        })
        .then((r) => r.data.data),
  });

  const filtered = contributions.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.contributor?.name?.toLowerCase().includes(q) ||
      c.contributor?.email?.toLowerCase().includes(q)
    );
  });

  const completedTotal = filtered
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Contributions</h1>
        <p className="text-base-content mt-1">Track all member contributions</p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="input flex-1">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search contributors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <select
            className="select w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Amount",
            value: formatCurrency(completedTotal),
            cls: "",
          },
          {
            label: "Completed",
            value: filtered.filter((c) => c.status === "completed").length,
            cls: "text-success",
          },
          {
            label: "Pending",
            value: filtered.filter((c) => c.status === "pending").length,
            cls: "text-warning",
          },
          {
            label: "Late Payments",
            value: filtered.filter((c) => c.is_late).length,
            cls: "text-error",
          },
        ].map(({ label, value, cls }) => (
          <div key={label} className="stat bg-base-100 rounded-box shadow">
            <div className="stat-title">{label}</div>
            <div className={`stat-value text-2xl ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No contributions found
          </h3>
          <p className="text-base-content">Contributions will appear here</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Group</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Late</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="hover">
                  <td>
                    <div className="font-medium">
                      {c.contributor?.name ?? "—"}
                    </div>
                    <div className="text-sm text-base-content">
                      {c.contributor?.email}
                    </div>
                  </td>
                  <td className="text-base-content">
                    {c.group?.group_name ?? "—"}
                  </td>
                  <td className="font-medium">{formatCurrency(c.amount)}</td>
                  <td className="text-base-content capitalize">
                    {c.contribution_type ?? "—"}
                  </td>
                  <td>
                    {c.is_late ? (
                      <span className="badge badge-error">Late</span>
                    ) : (
                      <span className="badge badge-success">On Time</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="text-base text-base-content">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
