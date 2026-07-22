import apiClient from "#/api/simpleApi";
import SimpleInput from "#/components/modals/inputs/SimpleInput";
import { extract_message } from "#/helpers/apihelpers";
import { useMutation } from "@tanstack/react-query";
import { KeyRound, Lock } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

interface WithdrawalPinForm {
  password: string;
  pin: string;
}

interface WithdrawalPinProps {
  // Whether a withdrawal PIN already exists — switches set (POST) to update (PATCH).
  hasPin?: boolean;
  onSuccess?: () => void;
}

// TODO: confirm endpoint path with backend.
const PIN_ENDPOINT = "/wallet/withdrawal-pin";

export default function WithdrawalPin({
  hasPin = false,
  onSuccess,
}: WithdrawalPinProps) {
  const methods = useForm<WithdrawalPinForm>({
    defaultValues: { password: "", pin: "" },
  });

  const mutation = useMutation({
    mutationFn: (data: WithdrawalPinForm) =>
      hasPin
        ? apiClient.patch(PIN_ENDPOINT, data)
        : apiClient.post(PIN_ENDPOINT, data),
    onSuccess: () => {
      toast.success(
        hasPin ? "Withdrawal PIN updated" : "Withdrawal PIN set successfully",
      );
      methods.reset();
      onSuccess?.();
    },
    onError: (err) => toast.error(extract_message(err)),
  });

  return (
    <div className="card bg-base-100 shadow-sm p-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-base-content">
          {hasPin ? "Update Withdrawal PIN" : "Set Withdrawal PIN"}
        </h2>
        <p className="text-sm text-base-content/60 mt-1">
          Your 4-digit PIN authorizes withdrawals from your wallet.
        </p>
      </div>

      <FormProvider {...methods}>
        <form
          onSubmit={methods.handleSubmit((data) => mutation.mutate(data))}
          className="space-y-4"
        >
          <SimpleInput
            label="Account Password"
            type="password"
            placeholder="Enter your account password"
            icon={<Lock className="w-4 h-4 text-base-content/40" />}
            {...methods.register("password", {
              required: "Password is required",
            })}
          />

          <SimpleInput
            label="Withdrawal PIN"
            type="password"
            inputMode="numeric"
            maxLength={4}
            placeholder="4-digit PIN"
            icon={<KeyRound className="w-4 h-4 text-base-content/40" />}
            {...methods.register("pin", {
              required: "PIN is required",
              pattern: {
                value: /^\d{4}$/,
                message: "PIN must be exactly 4 digits",
              },
            })}
          />

          <button
            type="submit"
            className="btn btn-primary w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <span className="loading loading-spinner loading-sm" />
            )}
            {hasPin ? "Update PIN" : "Set PIN"}
          </button>
        </form>
      </FormProvider>
    </div>
  );
}
