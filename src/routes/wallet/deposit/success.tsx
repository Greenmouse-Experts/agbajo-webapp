import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { CheckCircle } from "lucide-react";

export const Route = createFileRoute("/wallet/deposit/success")({
  validateSearch: (s): { session_id?: string } => ({
    session_id: s.session_id ? String(s.session_id) : undefined,
  }),
  component: DepositSuccess,
});

function DepositSuccess() {
  const { session_id } = Route.useSearch();
  const qc = useQueryClient();

  // Invalidate wallet balance so the next visit to the wallet page refetches immediately.
  useEffect(() => {
    qc.invalidateQueries({ queryKey: ["wallet", "balance"] });
    qc.invalidateQueries({ queryKey: ["wallet", "transactions"] });
  }, [qc]);

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-lg max-w-md w-full">
        <div className="card-body items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
            <CheckCircle className="w-9 h-9 text-success" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-base-content">
              Payment received
            </h1>
            <p className="text-base-content/60 text-sm mt-1">
              Your wallet is being credited. This usually takes a few seconds.
            </p>
          </div>

          {session_id && (
            <p className="text-xs text-base-content/40 font-mono break-all">
              ref: {session_id}
            </p>
          )}

          <div className="divider my-0" />

          <Link
            to="/contributor/wallet"
            className="btn btn-primary w-full"
          >
            Go to Wallet
          </Link>
        </div>
      </div>
    </div>
  );
}
