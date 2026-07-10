import apiClient from "#/api/simpleApi";
import SimpleInput from "#/components/modals/inputs/SimpleInput";
import { useMutation } from "@tanstack/react-query";
import { Lock } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function PasswordChange() {
  const methods = useForm<PasswordForm>({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  const { handleSubmit, reset, watch, formState: { isDirty } } = methods;

  const mutation = useMutation({
    mutationFn: ({ currentPassword, newPassword }: PasswordForm) =>
      apiClient.patch("auth/password", { currentPassword, newPassword }),
    onSuccess: () => {
      toast.success("Password changed successfully");
      reset();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to change password";
      toast.error(msg);
    },
  });

  const onSubmit = (data: PasswordForm) => {
    if (data.newPassword !== data.confirmPassword) {
      methods.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    mutation.mutate(data);
  };

  return (
    <div className="card bg-base-100 shadow-sm p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-base-content">Change Password</h2>
        <p className="text-sm text-base-content/60 mt-0.5">
          Choose a strong password you haven't used before
        </p>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <SimpleInput
            label="Current Password"
            placeholder="Enter current password"
            type="password"
            icon={<Lock className="w-4 h-4 text-base-content/40" />}
            {...methods.register("currentPassword", {
              required: "Current password is required",
            })}
          />

          <SimpleInput
            label="New Password"
            placeholder="Enter new password"
            type="password"
            icon={<Lock className="w-4 h-4 text-base-content/40" />}
            {...methods.register("newPassword", {
              required: "New password is required",
              minLength: { value: 6, message: "At least 6 characters" },
              validate: (v) =>
                v !== watch("currentPassword") ||
                "New password must differ from current",
            })}
          />

          <SimpleInput
            label="Confirm New Password"
            placeholder="Re-enter new password"
            type="password"
            icon={<Lock className="w-4 h-4 text-base-content/40" />}
            {...methods.register("confirmPassword", {
              required: "Please confirm your new password",
            })}
          />

          <div className="pt-2">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={mutation.isPending || !isDirty}
            >
              {mutation.isPending && (
                <span className="loading loading-spinner loading-sm" />
              )}
              Change Password
            </button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
