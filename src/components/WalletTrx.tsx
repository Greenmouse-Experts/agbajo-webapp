import apiClient, { type ApiResponse } from "#/api/simpleApi.ts";
import { formatCurrency } from "#/helpers/currency.ts";
import QueryCompLayout from "#/components/layout/QueryCompLayout.tsx";
import type { WalletTransactionsData } from "#/types/wallet.ts";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownRight, ArrowUpRight, AlertCircle } from "lucide-react";

export default function WalletTrx() {
  const query = useQuery<ApiResponse<WalletTransactionsData>>({
    queryKey: ["wallet", "transactions"],
    queryFn: async () => {
      const resp = await apiClient.get("/wallet/transactions", {
        params: { limit: 10 },
      });
      return resp.data;
    },
  });

  return (
    <QueryCompLayout query={query}>
      {({ data }) => {
        const { transactions } = data;

        if (transactions.length === 0) {
          return (
            <div className="flex flex-col items-center gap-2 py-10 text-base-content/50">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm">No transactions yet</p>
            </div>
          );
        }

        return (
          <div className="divide-y divide-base-200">
            {transactions.map((tx) => {
              const isCredit = tx.type === "credit";
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-base-200 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                    {isCredit ? (
                      <ArrowDownRight className="w-5 h-5 text-success" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-error" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-base-content capitalize">
                      {tx.description}
                    </p>
                    <p className="text-sm text-base-content/60 mt-0.5 truncate">
                      {tx.reference}
                    </p>
                  </div>

                  <p
                    className={`font-semibold shrink-0 ${isCredit ? "text-success" : "text-error"}`}
                  >
                    {isCredit ? "+" : "-"}
                    {formatCurrency(Number(tx.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        );
      }}
    </QueryCompLayout>
  );
}
