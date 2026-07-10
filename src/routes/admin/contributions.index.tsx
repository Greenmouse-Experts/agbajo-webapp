import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import SearchBar from "#/components/Searchbar";

export const Route = createFileRoute("/admin/contributions/")({
  component: AdminContributions,
});

type ContributionStatus = "pending" | "completed" | "failed" | "reversed";

interface Contribution {
  id: string;
  amount: number;
  status: ContributionStatus;
  payment_method?: string;
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
    case "reversed":
      return (
        <span className="badge badge-neutral gap-1">
          <XCircle className="w-3 h-3" /> Reversed
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

function AdminContributions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  const { data: contributions = [], isLoading } = useQuery({
    queryKey: ["admin", "contributions", statusFilter, dateRange],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Contribution[]>>("admin/contributions", {
          params: {
            ...(statusFilter !== "all" && { status: statusFilter }),
            ...(dateRange.start && { from: dateRange.start }),
            ...(dateRange.end && { to: dateRange.end }),
          },
        })
        .then((r) => r.data.data),
  });

  const filtered = contributions.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.contributor?.name?.toLowerCase().includes(q) ||
      c.group?.group_name?.toLowerCase().includes(q)
    );
  });

  const handleExport = () => {
    const csv = [
      ["Date", "Contributor", "Group", "Amount", "Status", "Type", "Late"].join(
        ",",
      ),
      ...filtered.map((c) =>
        [
          new Date(c.created_at).toLocaleDateString(),
          c.contributor?.name ?? "",
          c.group?.group_name ?? "",
          c.amount,
          c.status,
          c.contribution_type ?? "",
          c.is_late ? "Yes" : "No",
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `contributions-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const completedTotal = filtered
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + (c.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">
            Contributions
          </h1>
          <p className="text-base-content mt-1">
            Monitor all contribution transactions
          </p>
        </div>
        <button onClick={handleExport} className="btn btn-outline">
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="reversed">Reversed</option>
          </select>
          <input
            type="date"
            className="input"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <input
            type="date"
            className="input"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
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
          <p className="text-base-content">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Contributor</th>
                <th>Group</th>
                <th>Amount</th>
                <th>Method</th>
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
                    {c.payment_method?.replace("_", " ") ?? "—"}
                  </td>
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
