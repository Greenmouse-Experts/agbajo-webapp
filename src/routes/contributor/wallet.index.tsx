import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet as WalletIcon,
  AlertCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";
import { formatCurrency } from "#/helpers/currency";

export const Route = createFileRoute("/contributor/wallet/")({
  component: ContributorWallet,
});

type TxType = "deposit" | "payout" | "refund" | "withdrawal" | "contribution" | "penalty";

interface Transaction {
  id: number;
  type: TxType;
  amount: number;
  description: string;
  created_at: string;
}

const CREDIT_TYPES: TxType[] = ["deposit", "payout", "refund"];

const mockTransactions: Transaction[] = [
  { id: 1, type: "deposit", amount: 50000, description: "Wallet funded", created_at: "2026-07-02" },
  { id: 2, type: "contribution", amount: 10000, description: "Lagos Savers — Cycle 3", created_at: "2026-07-01" },
  { id: 3, type: "payout", amount: 120000, description: "Lagos Savers — Payout", created_at: "2026-06-30" },
  { id: 4, type: "contribution", amount: 25000, description: "Victoria Island Circle", created_at: "2026-06-28" },
  { id: 5, type: "deposit", amount: 30000, description: "Wallet funded", created_at: "2026-06-20" },
  { id: 6, type: "penalty", amount: 2000, description: "Late payment fee", created_at: "2026-06-14" },
];

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

function txIcon(type: TxType) {
  return CREDIT_TYPES.includes(type)
    ? <ArrowDownRight className="w-5 h-5 text-success" />
    : <ArrowUpRight className="w-5 h-5 text-error" />;
}

function ContributorWallet() {
  const [fundAmount, setFundAmount] = useState("");
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = () => modalRef.current?.showModal();
  const closeModal = () => {
    modalRef.current?.close();
    setFundAmount("");
  };

  const handleFund = (e: React.FormEvent) => {
    e.preventDefault();
    closeModal();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Wallet" subtitle="Manage your account balance" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Balance card */}
        <div className="lg:col-span-2">
          <div className="card bg-gradient-to-bl from-yellow-800 to-green-700 text-white shadow-lg">
            <div className="card-body gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <WalletIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">Main Wallet</p>
                  <p className="text-white font-medium">My Account</p>
                </div>
              </div>

              <div>
                <p className="text-white/70 text-sm">Available Balance</p>
                <p className="text-4xl font-bold mt-1">{formatCurrency(85000)}</p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/20">
                <div>
                  <p className="text-white/70 text-xs">Pending Balance</p>
                  <p className="text-white font-medium">{formatCurrency(12000)}</p>
                </div>
                <button onClick={openModal} className="btn bg-white text-green-800 hover:bg-white/90 border-0">
                  Fund Wallet
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="card bg-base-100 border border-base-200 shadow-sm">
          <div className="card-body gap-4">
            <h3 className="font-semibold text-base-content">Quick Actions</h3>

            <button
              onClick={openModal}
              className="flex items-center gap-3 p-3 rounded-xl border border-base-200 hover:border-primary/40 hover:bg-primary/5 transition-colors text-left w-full"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-base-content">Fund Wallet</p>
                <p className="text-xs text-base-content/60">Add money to your wallet</p>
              </div>
            </button>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-base-200">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-base-content">Auto Debit</p>
                <p className="text-xs text-base-content/60">Enabled for contributions</p>
              </div>
              <input type="checkbox" className="toggle toggle-success toggle-sm ml-auto" defaultChecked readOnly />
            </div>
          </div>
        </div>
      </div>

      {/* Transaction history */}
      <div className="card bg-base-100 border border-base-200 shadow-sm overflow-hidden">
        <div className="card-body pb-0">
          <h3 className="font-semibold text-base-content">Transaction History</h3>
        </div>

        {mockTransactions.length === 0 ? (
          <div className="p-6">
            <EmptyState
              icon={AlertCircle}
              title="No transactions yet"
              description="Your transaction history will appear here."
            />
          </div>
        ) : (
          <div className="divide-y divide-base-200 mt-4">
            {mockTransactions.map((tx) => {
              const isCredit = CREDIT_TYPES.includes(tx.type);
              return (
                <div
                  key={tx.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-base-200/40 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-base-200 flex items-center justify-center shrink-0">
                    {txIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-base-content capitalize">{tx.type}</p>
                    <p className="text-xs text-base-content/60 mt-0.5">{tx.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-semibold ${isCredit ? "text-success" : "text-error"}`}>
                      {isCredit ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <p className="text-xs text-base-content/40">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fund wallet modal */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-semibold text-base-content">Fund Wallet</h3>
          <p className="text-sm text-base-content/60 mt-0.5">Add money to your wallet</p>

          <form onSubmit={handleFund} className="mt-5 space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Amount</legend>
              <label className="input flex items-center gap-2">
                <span className="text-base-content/50 font-medium">₦</span>
                <input
                  type="number"
                  placeholder="10,000"
                  className="grow"
                  value={fundAmount}
                  onChange={(e) => setFundAmount(e.target.value)}
                  required
                  min="100"
                />
              </label>
            </fieldset>

            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() => setFundAmount(String(amount))}
                >
                  ₦{(amount / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            <div className="modal-action mt-2">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Fund Wallet
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
}
