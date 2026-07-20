import apiClient from "#/api/simpleApi.ts";
import { formatCurrency } from "#/helpers/currency.ts";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal.tsx";
import SimpleInput from "#/components/modals/inputs/SimpleInput.tsx";
import type {
  WalletResponse,
  DepositResponse,
  DepositForm,
} from "#/types/wallet.ts";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ArrowDownRight, WalletIcon, Zap } from "lucide-react";
import { useRef } from "react";
import { useForm, FormProvider } from "react-hook-form";

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000];

export default function Wallet() {
  const modalRef = useRef<ModalHandle>(null);
  const methods = useForm<DepositForm>({ defaultValues: { amount: "" } });

  const { data, isLoading } = useQuery({
    queryKey: ["wallet"],
    queryFn: async () => {
      const resp = await apiClient.get<WalletResponse>("/wallet");
      return resp.data.data;
    },
  });

  const deposit = useMutation({
    mutationFn: async (amount: number) => {
      const resp = await apiClient.post<DepositResponse>("/wallet/deposit", {
        amount,
      });
      return resp.data.data;
    },
    onSuccess: ({ authorizationUrl }) => {
      modalRef.current?.close();
      methods.reset();
      window.location.href = authorizationUrl;
    },
  });

  const handleFund = methods.handleSubmit((values) => {
    deposit.mutate(Number(values.amount));
  });

  const balance = Number(data?.balance ?? 0);

  return (
    <>
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
                  <p className="text-white text-base">Main Wallet</p>
                  <p className="text-white font-medium">My Account</p>
                </div>
              </div>

              <div>
                <p className="text-white text-base">Available Balance</p>
                <p className="text-4xl font-bold mt-1">
                  {isLoading ? (
                    <span className="loading loading-dots loading-md" />
                  ) : (
                    formatCurrency(balance)
                  )}
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white">
                <div>
                  <p className="text-white text-sm">Pending Balance</p>
                  <p className="text-white font-medium">{formatCurrency(0)}</p>
                </div>
                <button
                  onClick={() => modalRef.current?.open()}
                  className="btn bg-white text-green-800 hover:bg-white border-0"
                >
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
              onClick={() => modalRef.current?.open()}
              className="btn items-start h-auto p-3 btn-ghost flex justify-start"
            >
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <ArrowDownRight className="w-5 h-5 text-primary" />
              </div>
              <div className="text-left items-start">
                <p className="text-base font-medium text-base-content">
                  Fund Wallet
                </p>
                <p className="text-sm text-base-content">
                  Add money to your wallet
                </p>
              </div>
            </button>

            <div className="flex items-center gap-3 p-3 rounded-xl border border-base-200">
              <div className="w-10 h-10 rounded-lg bg-warning flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-base font-medium text-base-content">
                  Auto Debit
                </p>
                <p className="text-sm text-base-content">
                  Enabled for contributions
                </p>
              </div>
              <input
                type="checkbox"
                className="toggle toggle-success toggle-sm ml-auto"
                defaultChecked
                readOnly
              />
            </div>
          </div>
        </div>
      </div>
      <Modal
        ref={modalRef}
        title="Fund Wallet"
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => {
                modalRef.current?.close();
                methods.reset();
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleFund}
              disabled={deposit.isPending}
            >
              {deposit.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                "Proceed"
              )}
            </button>
          </>
        }
      >
        <FormProvider {...methods}>
          <div className="space-y-4">
            <SimpleInput
              label="Amount (₦)"
              type="number"
              placeholder="e.g. 10000"
              min="100"
              {...methods.register("amount", {
                required: "Amount is required",
                min: { value: 100, message: "Minimum is ₦100" },
              })}
            />

            <div className="grid grid-cols-4 gap-2">
              {QUICK_AMOUNTS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  className="btn btn-sm btn-outline"
                  onClick={() =>
                    methods.setValue("amount", String(amount), {
                      shouldValidate: true,
                    })
                  }
                >
                  ₦{amount / 1000}k
                </button>
              ))}
            </div>
          </div>
        </FormProvider>
      </Modal>
    </>
  );
}
