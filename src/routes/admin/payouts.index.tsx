import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  CheckCircle,
  Clock,
  XCircle,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import SearchBar from "#/components/Searchbar";
import PageLoader from "#/components/layout/PageLoader";

export const Route = createFileRoute("/admin/payouts/")({
  component: AdminPayouts,
});

type PayoutStatus = "pending" | "processing" | "completed" | "failed";

interface Payout {
  id: string;
  amount: number;
  status: PayoutStatus;
  isManual: boolean;
  reason?: string;
  payoutDate?: string;
  createdAt: string;
  recipient?: { name: string; email: string };
  group?: { name: string };
}

interface PayoutsData {
  payoutAccounts: Payout[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

const formatCurrency = (amount: number) =>
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
    case "processing":
      return <span className="badge badge-primary">Processing</span>;
    default:
      return (
        <span className="badge badge-warning gap-1">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
  }
};

function AdminPayouts() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [manualForm, setManualForm] = useState({ amount: "", reason: "" });

  const query = useQuery({
    queryKey: ["admin", "payouts", statusFilter],
    queryFn: () =>
      apiClient
        .get<{ status: string; data: PayoutsData }>("/payout/accounts", {
          params: statusFilter !== "all" ? { status: statusFilter } : {},
        })
        .then((r) => r.data.data),
  });

  const manualMutation = useMutation({
    mutationFn: (body: { amount: number; reason: string }) =>
      toast
        .promise(apiClient.post("admin/payouts/manual", body), {
          loading: "Processing payout...",
          success: "Payout processed",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      modalRef.current?.close();
      setManualForm({ amount: "", reason: "" });
      queryClient.invalidateQueries({ queryKey: ["admin", "payouts"] });
    },
  });

  const handleManualPayout = (e: React.FormEvent) => {
    e.preventDefault();
    manualMutation.mutate({
      amount: parseFloat(manualForm.amount),
      reason: manualForm.reason,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Payouts</h1>
          <p className="text-base-content mt-1">
            Track and manage all payout transactions
          </p>
        </div>
        <button
          onClick={() => modalRef.current?.showModal()}
          className="btn btn-primary"
        >
          <DollarSign className="w-4 h-4" />
          Manual Payout
        </button>
      </div>

      <div className="card bg-base-100 shadow p-4 ">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <select
            className="select w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="processing">Processing</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      <PageLoader query={query} loadingText="Loading payouts...">
        {(data) => {
          const q = searchQuery.toLowerCase();
          const filtered = data.payoutAccounts.filter(
            (p) =>
              !q ||
              p.recipient?.name?.toLowerCase().includes(q) ||
              p.group?.name?.toLowerCase().includes(q),
          );

          const completedTotal = filtered
            .filter((p) => p.status === "completed")
            .reduce((sum, p) => sum + (p.amount || 0), 0);

          const handleExport = () => {
            const csv = [
              [
                "Date",
                "Recipient",
                "Group",
                "Amount",
                "Status",
                "Manual",
                "Reason",
              ].join(","),
              ...filtered.map((p) =>
                [
                  new Date(p.createdAt).toLocaleDateString(),
                  p.recipient?.name ?? "",
                  p.group?.name ?? "",
                  p.amount,
                  p.status,
                  p.isManual ? "Yes" : "No",
                  p.reason ?? "",
                ].join(","),
              ),
            ].join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `payouts-${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          };

          return (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                {[
                  {
                    label: "Total Payouts",
                    value: formatCurrency(completedTotal),
                    cls: "",
                  },
                  {
                    label: "Completed",
                    value: filtered.filter((p) => p.status === "completed")
                      .length,
                    cls: "text-success",
                  },
                  {
                    label: "Pending",
                    value: filtered.filter((p) => p.status === "pending")
                      .length,
                    cls: "text-warning",
                  },
                  {
                    label: "Manual Payouts",
                    value: filtered.filter((p) => p.isManual).length,
                    cls: "text-info",
                  },
                ].map(({ label, value, cls }) => (
                  <div
                    key={label}
                    className="stat bg-base-100 rounded-box shadow"
                  >
                    <div className="stat-title">{label}</div>
                    <div className={`stat-value text-2xl ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>

              {filtered.length === 0 ? (
                <div className="card bg-base-100 shadow p-12 text-center mt-4">
                  <p className="text-base-content font-medium">
                    No payouts found
                  </p>
                  <p className="text-base-content text-sm mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      onClick={handleExport}
                      className="btn btn-outline btn-sm"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>

                  <div className="card bg-base-100 shadow overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Recipient</th>
                          <th>Group</th>
                          <th>Amount</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Payout Date</th>
                          <th>Reason</th>
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
                              {payout.group?.name ?? "—"}
                            </td>
                            <td className="font-medium">
                              {formatCurrency(payout.amount)}
                            </td>
                            <td>
                              {payout.isManual ? (
                                <span className="badge badge-primary">
                                  Manual
                                </span>
                              ) : (
                                <span className="badge badge-neutral">
                                  Auto
                                </span>
                              )}
                            </td>
                            <td>
                              <StatusBadge status={payout.status} />
                            </td>
                            <td className="text-base-content text-base">
                              {payout.payoutDate
                                ? new Date(
                                    payout.payoutDate,
                                  ).toLocaleDateString()
                                : "—"}
                            </td>
                            <td className="text-base-content text-base max-w-xs truncate">
                              {payout.reason ?? "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          );
        }}
      </PageLoader>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-xl font-semibold">Manual Payout</h3>
          <p className="text-base text-base-content mt-1">
            Process an emergency payout
          </p>

          <form onSubmit={handleManualPayout} className="space-y-4 mt-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Amount</legend>
              <label className="input w-full">
                <span className="text-base-content">₦</span>
                <input
                  type="number"
                  placeholder="50000"
                  value={manualForm.amount}
                  onChange={(e) =>
                    setManualForm({ ...manualForm, amount: e.target.value })
                  }
                  required
                />
              </label>
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Reason</legend>
              <textarea
                className="textarea w-full"
                placeholder="Enter reason for manual payout..."
                rows={3}
                value={manualForm.reason}
                onChange={(e) =>
                  setManualForm({ ...manualForm, reason: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => modalRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={manualMutation.isPending}
              >
                {manualMutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Process Payout
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
