import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle } from "lucide-react";

export const Route = createFileRoute("/wallet/deposit/cancel")({
  component: DepositCancel,
});

function DepositCancel() {
  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-lg max-w-md w-full">
        <div className="card-body items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center">
            <XCircle className="w-9 h-9 text-error" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-base-content">
              Payment cancelled
            </h1>
            <p className="text-base-content/60 text-sm mt-1">
              No charge was made. You can try again whenever you're ready.
            </p>
          </div>

          <div className="divider my-0" />

          <Link
            to="/contributor/wallet"
            className="btn btn-primary w-full"
          >
            Back to Wallet
          </Link>
        </div>
      </div>
    </div>
  );
}
