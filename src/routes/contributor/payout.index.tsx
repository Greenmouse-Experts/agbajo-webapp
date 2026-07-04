import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Clock, XCircle, AlertCircle } from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";
import { formatCurrency } from "#/helpers/currency";

export const Route = createFileRoute("/contributor/payout/")({
  component: ContributorPayouts,
});

type PayoutStatus = "completed" | "pending" | "failed";

interface Payout {
  id: number;
  group_name: string;
  amount: number;
  status: PayoutStatus;
  payout_date: string | null;
  is_manual: boolean;
  created_at: string;
}

const mockPayouts: Payout[] = [
  { id: 1, group_name: "Lagos Savers", amount: 120000, status: "completed", payout_date: "2026-07-01", is_manual: false, created_at: "2026-07-01" },
  { id: 2, group_name: "Victoria Island Circle", amount: 200000, status: "pending", payout_date: null, is_manual: false, created_at: "2026-06-20" },
  { id: 3, group_name: "Ibadan Cooperative", amount: 100000, status: "completed", payout_date: "2026-06-05", is_manual: true, created_at: "2026-06-05" },
  { id: 4, group_name: "Lagos Savers", amount: 120000, status: "failed", payout_date: null, is_manual: false, created_at: "2026-05-15" },
  { id: 5, group_name: "Lagos Savers", amount: 120000, status: "completed", payout_date: "2026-07-02", is_manual: false, created_at: "2026-07-02" },
];

const statusIcon: Record<PayoutStatus, React.ReactElement> = {
  completed: <CheckCircle className="w-5 h-5 text-success" />,
  pending: <Clock className="w-5 h-5 text-warning" />,
  failed: <XCircle className="w-5 h-5 text-error" />,
};

const statusBadge: Record<PayoutStatus, string> = {
  completed: "badge-success",
  pending: "badge-warning",
  failed: "badge-error",
};

function ContributorPayouts() {
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = mockPayouts.filter(
    (p) => statusFilter === "all" || p.status === statusFilter,
  );

  const totalReceived = mockPayouts
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const thisMonth = mockPayouts
    .filter((p) => {
      const d = new Date(p.created_at);
      const now = new Date();
      return (
        p.status === "completed" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader title="My Payouts" subtitle="Track all your received payouts" />

      {/* Summary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Total Received</p>
            <p className="text-xl font-bold text-base-content">{formatCurrency(totalReceived)}</p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Completed</p>
            <p className="text-xl font-bold text-success">
              {mockPayouts.filter((p) => p.status === "completed").length}
            </p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">Pending</p>
            <p className="text-xl font-bold text-warning">
              {mockPayouts.filter((p) => p.status === "pending").length}
            </p>
          </div>
        </div>
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body p-4 gap-1">
            <p className="text-xs text-base-content/60">This Month</p>
            <p className="text-xl font-bold text-secondary">{formatCurrency(thisMonth)}</p>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4">
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

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No payouts yet"
          description="Your payouts will appear here once processed."
        />
      ) : (
        <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
          <div className="divide-y divide-base-200">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-4 hover:bg-base-200/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                  {statusIcon[p.status]}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-base-content">{p.group_name}</p>
                  <p className="text-xs text-base-content/60 mt-0.5">
                    {p.payout_date
                      ? new Date(p.payout_date).toLocaleDateString()
                      : "Processing"}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-success">{formatCurrency(p.amount)}</p>
                  <div className="flex items-center justify-end gap-2 mt-0.5">
                    <span className={`badge badge-sm ${statusBadge[p.status]} capitalize`}>
                      {p.status}
                    </span>
                    {p.is_manual && (
                      <span className="badge badge-sm badge-neutral">Manual</span>
                    )}
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
