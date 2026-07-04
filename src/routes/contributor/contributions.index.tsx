import { useState, type ReactElement } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";
import { formatCurrency } from "#/helpers/currency";

export const Route = createFileRoute("/contributor/contributions/")({
  component: ContributorContributions,
});

type ContributionStatus = "completed" | "pending" | "failed" | "reversed";

interface Contribution {
  id: number;
  group_name: string;
  amount: number;
  status: ContributionStatus;
  is_late: boolean;
  contribution_type: "auto" | "manual";
  created_at: string;
}

const mockContributions: Contribution[] = [
  { id: 1, group_name: "Lagos Savers", amount: 10000, status: "completed", is_late: false, contribution_type: "auto", created_at: "2026-07-01" },
  { id: 2, group_name: "Victoria Island Circle", amount: 25000, status: "pending", is_late: false, contribution_type: "manual", created_at: "2026-06-28" },
  { id: 3, group_name: "Lagos Savers", amount: 10000, status: "completed", is_late: true, contribution_type: "auto", created_at: "2026-06-21" },
  { id: 4, group_name: "Ibadan Cooperative", amount: 5000, status: "failed", is_late: false, contribution_type: "manual", created_at: "2026-06-14" },
  { id: 5, group_name: "Lagos Savers", amount: 10000, status: "completed", is_late: false, contribution_type: "auto", created_at: "2026-06-07" },
  { id: 6, group_name: "Victoria Island Circle", amount: 25000, status: "completed", is_late: false, contribution_type: "auto", created_at: "2026-05-30" },
];

const statusIcon: Record<ContributionStatus, ReactElement> = {
  completed: <CheckCircle className="w-5 h-5 text-success" />,
  pending: <Clock className="w-5 h-5 text-warning" />,
  failed: <XCircle className="w-5 h-5 text-error" />,
  reversed: <XCircle className="w-5 h-5 text-error" />,
};

const statusBadge: Record<ContributionStatus, string> = {
  completed: "badge-success",
  pending: "badge-warning",
  failed: "badge-error",
  reversed: "badge-error",
};

function ContributorContributions() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockContributions.filter((c) => {
    const matchesSearch = c.group_name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSaved = mockContributions
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My Contributions" subtitle="Track all your savings contributions" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Total Saved</p>
            <p className="text-xl font-bold text-base-content">{formatCurrency(totalSaved)}</p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Completed</p>
            <p className="text-xl font-bold text-success">
              {mockContributions.filter((c) => c.status === "completed").length}
            </p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Pending</p>
            <p className="text-xl font-bold text-warning">
              {mockContributions.filter((c) => c.status === "pending").length}
            </p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Late Payments</p>
            <p className="text-xl font-bold text-error">
              {mockContributions.filter((c) => c.is_late).length}
            </p>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="input flex-1 flex items-center gap-2">
              <Search className="w-4 h-4 text-base-content/40 shrink-0" />
              <input
                type="text"
                placeholder="Search by group..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="grow"
              />
            </label>
            <select
              className="select w-full sm:w-44"
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
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No contributions found"
          description="Try adjusting your search or filter."
        />
      ) : (
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-base-200">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-base-200/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                  {statusIcon[c.status]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-base-content">{c.group_name}</p>
                    {c.is_late && <span className="badge badge-error badge-sm">Late</span>}
                  </div>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    {c.contribution_type === "auto" ? "Auto debit" : "Manual payment"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-base-content">{formatCurrency(c.amount)}</p>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    <span className={`badge badge-sm ${statusBadge[c.status]} capitalize`}>
                      {c.status}
                    </span>
                    <p className="text-xs text-base-content/40">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
