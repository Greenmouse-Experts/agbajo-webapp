import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import apiClient from "#/api/simpleApi";
import { formatCurrency } from "#/helpers/currency";
import { extract_message } from "#/helpers/apihelpers";
import PageLoader from "#/components/layout/PageLoader";
import type { WalletTxStatus } from "#/types/wallet";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/withdrawals/")({
  validateSearch: (s): WithdrawalsSearch => ({
    page: Number(s.page ?? 1),
    status: String(s.status ?? "all"),
    currency: String(s.currency ?? "all"),
  }),
  component: AdminWithdrawals,
});

interface WithdrawalsSearch {
  page: number;
  status: string;
  currency: string;
}

interface AdminWithdrawal {
  id: string;
  walletId: string;
  type: "credit";
  amount: string;
  reference: string;
  description: string;
  status: WalletTxStatus;
  currency: string;
  originalAmount?: string | null;
  originalCurrency?: string | null;
  fxRate?: string | null;
  provider?: "paystack" | "stripe" | null;
  createdAt: string;
  user?: { id: string; name: string; email: string };
}

interface WithdrawalsData {
  withdrawals: AdminWithdrawal[];
  total: number;
  nextCursor: string | null;
  hasMore: boolean;
}

const LIMIT = 20;

const StatusBadge = ({ status }: { status: WalletTxStatus }) => {
  if (status === "success")
    return (
      <span className="badge badge-success gap-1">
        <CheckCircle className="w-3 h-3" /> Success
      </span>
    );
  if (status === "failed")
    return (
      <span className="badge badge-error gap-1">
        <XCircle className="w-3 h-3" /> Failed
      </span>
    );
  return (
    <span className="badge badge-warning gap-1">
      <Clock className="w-3 h-3" /> Pending
    </span>
  );
};

function AdminWithdrawals() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setSearch = (patch: Partial<WithdrawalsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const query = useQuery({
    queryKey: ["admin", "withdrawals", search],
    queryFn: async () => {
      const params: Record<string, string | number> = {
        page: search.page,
        limit: LIMIT,
      };
      if (search.status !== "all") params.status = search.status;
      if (search.currency !== "all") params.currency = search.currency;
      const resp = await apiClient.get<{ data: WithdrawalsData }>(
        "/admin/wallet/withdrawals",
        { params },
      );
      return resp.data.data;
    },
  });

  const handleExport = (withdrawals: AdminWithdrawal[]) => {
    try {
      const csv = [
        ["Date", "User", "Email", "Amount", "Currency", "Provider", "Reference", "Description", "Status"].join(","),
        ...withdrawals.map((w) =>
          [
            new Date(w.createdAt).toLocaleDateString(),
            w.user?.name ?? "—",
            w.user?.email ?? "—",
            w.amount,
            w.currency,
            w.provider ?? "—",
            w.reference,
            `"${w.description}"`,
            w.status,
          ].join(","),
        ),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `withdrawals-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(extract_message(new Error("Export failed")));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Withdrawals</h1>
          <p className="text-base-content/60 mt-1">
            All wallet withdrawal requests across users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-error" />
          <span className="text-sm text-base-content/60">NGN + USD</span>
        </div>
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            className="select select-bordered flex-1 sm:max-w-xs"
            value={search.status}
            onChange={(e) => setSearch({ status: e.target.value, page: 1 })}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          <select
            className="select select-bordered flex-1 sm:max-w-xs"
            value={search.currency}
            onChange={(e) => setSearch({ currency: e.target.value, page: 1 })}
          >
            <option value="all">All Currencies</option>
            <option value="NGN">NGN (Paystack)</option>
            <option value="USD">USD (Stripe)</option>
          </select>
        </div>
      </div>

      <PageLoader query={query} loadingText="Loading withdrawals...">
        {(data) => {
          const { withdrawals, total, hasMore } = data;

          const successTotal = withdrawals
            .filter((w) => w.status === "success")
            .reduce((sum, w) => sum + Number(w.amount), 0);

          return (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Total (page)", value: formatCurrency(successTotal), cls: "" },
                  { label: "All Records", value: total, cls: "" },
                  {
                    label: "Success",
                    value: withdrawals.filter((w) => w.status === "success").length,
                    cls: "text-success",
                  },
                  {
                    label: "Pending",
                    value: withdrawals.filter((w) => w.status === "pending").length,
                    cls: "text-warning",
                  },
                ].map(({ label, value, cls }) => (
                  <div key={label} className="stat bg-base-100 rounded-box shadow-sm">
                    <div className="stat-title">{label}</div>
                    <div className={`stat-value text-2xl ${cls}`}>{value}</div>
                  </div>
                ))}
              </div>

              {withdrawals.length === 0 ? (
                <div className="card bg-base-100 shadow-sm p-12 text-center">
                  <p className="text-base-content font-medium">No withdrawals found</p>
                  <p className="text-base-content/60 text-sm mt-1">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-end">
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleExport(withdrawals)}
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                  </div>

                  <div className="card bg-base-100 shadow-sm overflow-x-auto">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>User</th>
                          <th>Amount</th>
                          <th>Provider</th>
                          <th>Description</th>
                          <th>Reference</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {withdrawals.map((w) => (
                          <tr key={w.id} className="hover">
                            <td>
                              <div className="font-medium">{w.user?.name ?? "—"}</div>
                              <div className="text-xs text-base-content/50">
                                {w.user?.email}
                              </div>
                            </td>
                            <td>
                              <div className="font-semibold text-error">
                                -{formatCurrency(Number(w.amount))}
                              </div>
                              {w.originalAmount && w.originalCurrency && (
                                <div className="text-xs text-base-content/50">
                                  ${w.originalAmount} {w.originalCurrency}
                                  {w.fxRate && (
                                    <> @ ₦{Number(w.fxRate).toFixed(2)}/$</>
                                  )}
                                </div>
                              )}
                            </td>
                            <td>
                              {w.provider === "stripe" ? (
                                <span className="badge badge-info badge-sm">Stripe</span>
                              ) : w.provider === "paystack" ? (
                                <span className="badge badge-accent badge-sm">Paystack</span>
                              ) : (
                                <span className="text-base-content/40 text-sm">—</span>
                              )}
                            </td>
                            <td className="max-w-xs">
                              <span className="text-sm text-base-content/70 line-clamp-2">
                                {w.description || "—"}
                              </span>
                            </td>
                            <td>
                              <span className="font-mono text-xs text-base-content/50 truncate max-w-[120px] block">
                                {w.reference}
                              </span>
                            </td>
                            <td>
                              <StatusBadge status={w.status} />
                            </td>
                            <td className="text-sm text-base-content/60 whitespace-nowrap">
                              {new Date(w.createdAt).toLocaleDateString("en-NG", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-base-content/60">
                      Page {search.page} · {total} total
                    </span>
                    <div className="join">
                      <button
                        className="join-item btn btn-sm"
                        disabled={search.page <= 1}
                        onClick={() => setSearch({ page: search.page - 1 })}
                      >
                        «
                      </button>
                      <button className="join-item btn btn-sm btn-active">
                        {search.page}
                      </button>
                      <button
                        className="join-item btn btn-sm"
                        disabled={!hasMore}
                        onClick={() => setSearch({ page: search.page + 1 })}
                      >
                        »
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          );
        }}
      </PageLoader>
    </div>
  );
}
