import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/cluster-manager/payouts/")({
  component: ClusterManagerPayouts,
});

type PayoutStatus = "pending" | "completed" | "failed";

interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  is_manual: boolean;
  created_at: string;
  recipient?: { name: string; email: string };
  group?: { group_name: string };
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const StatusBadge = ({ status }: { status: PayoutStatus }) => {
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

function ClusterManagerPayouts() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: payouts = [], isLoading } = useQuery({
    queryKey: ["cluster-manager", "payouts", statusFilter],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Payout[]>>("cluster-manager/payouts", {
          params: statusFilter !== "all" ? { status: statusFilter } : {},
        })
        .then((r) => r.data.data),
  });

  const processMutation = useMutation({
    mutationFn: (id: string) =>
      apiClient.patch(`cluster-manager/payouts/${id}/process`),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: ["cluster-manager", "payouts"],
      }),
  });

  const filtered = payouts.filter((p) =>
    p.recipient?.name?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const now = new Date();
  const thisMonthTotal = filtered
    .filter((p) => {
      const d = new Date(p.created_at);
      return (
        p.status === "completed" &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    })
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const completedTotal = filtered
    .filter((p) => p.status === "completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Payouts</h1>
        <p className="text-base-content mt-1">Manage member payouts</p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="input flex-1">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search recipients..."
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
            label: "Total Payouts",
            value: formatCurrency(completedTotal),
            cls: "",
          },
          {
            label: "Completed",
            value: filtered.filter((p) => p.status === "completed").length,
            cls: "text-success",
          },
          {
            label: "Pending",
            value: filtered.filter((p) => p.status === "pending").length,
            cls: "text-warning",
          },
          {
            label: "This Month",
            value: formatCurrency(thisMonthTotal),
            cls: "text-info",
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
            No payouts found
          </h3>
          <p className="text-base-content">Payouts will appear here</p>
        </div>
      ) : (
        <div className="card bg-base-100 shadow overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Group</th>
                <th>Amount</th>
                <th>Type</th>
                <th>Status</th>
                <th>Date</th>
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payout) => (
                <tr key={payout.id} className="hover">
                  <td>
                    <div className="font-medium">
                      {payout.recipient?.name ?? "—"}
                    </div>
                    <div className="text-sm text-base-content">
                      {payout.recipient?.email}
                    </div>
                  </td>
                  <td className="text-base-content">
                    {payout.group?.group_name ?? "—"}
                  </td>
                  <td className="font-medium">
                    {formatCurrency(payout.amount)}
                  </td>
                  <td>
                    {payout.is_manual ? (
                      <span className="badge badge-primary">Manual</span>
                    ) : (
                      <span className="badge badge-neutral">Auto</span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={payout.status} />
                  </td>
                  <td className="text-base text-base-content">
                    {new Date(payout.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    {payout.status === "pending" && (
                      <button
                        onClick={() => processMutation.mutate(payout.id)}
                        disabled={processMutation.isPending}
                        className="btn btn-success btn-sm"
                      >
                        <DollarSign className="w-3 h-3" />
                        Pay
                      </button>
                    )}
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
