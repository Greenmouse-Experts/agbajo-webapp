import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "./-components/PageHeader";
import Wallet from "#/components/Wallet.tsx";
import WalletTrx from "#/components/WalletTrx.tsx";

export const Route = createFileRoute("/contributor/wallet/")({
  component: ContributorWallet,
});

function ContributorWallet() {
  return (
    <div className="space-y-6">
      <PageHeader title="My Wallet" subtitle="Manage your account balance" />
      <Wallet />
      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="card-body pb-0">
          <h3 className="font-semibold text-base-content">Transaction History</h3>
        </div>
        <WalletTrx />
      </div>
    </div>
  );
}
