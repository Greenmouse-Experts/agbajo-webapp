import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import apiClient from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";

const searchSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/auth/reset-password/confirm")({
  validateSearch: searchSchema,
  component: ConfirmResetPage,
});

const formSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

function ConfirmResetPage() {
  const { token } = Route.useSearch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(formSchema) });

  const mutation = useMutation({
    mutationFn: ({ newPassword }: FormValues) =>
      apiClient.post("/auth/password/reset", { token, newPassword }),
    onSuccess: () => {
      toast.success("Password reset successfully. Please sign in.");
      navigate({ to: "/home/auth/login" });
    },
    onError: (err) => {
      toast.error(extract_message(err));
    },
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl w-full max-w-md">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold text-error">Invalid link</h2>
            <p className="text-base-content text-base">
              This password reset link is missing or invalid.
            </p>
            <Link
              to="/auth/reset-password/request"
              className="btn btn-primary mt-4"
            >
              Request a new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden mb-4 mx-auto">
            <img
              src="/agbajo-logo.jpeg"
              alt="Agbajo Africa"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-base-content">AGBAJO</h1>
          <p className="text-base-content mt-1">Digital Cooperative Savings</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-base-content mb-0">
              Set new password
            </h2>
            <p className="text-base-content text-base mb-2">
              Choose a strong password for your account.
            </p>

            <form
              onSubmit={handleSubmit((d) => mutation.mutate(d))}
              className="space-y-4"
            >
              <fieldset className="fieldset">
                <legend className="fieldset-legend">New password</legend>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input w-full pr-10 ${errors.newPassword ? "input-error" : ""}`}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    {...register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content hover:text-base-content"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.newPassword && (
                  <p className="fieldset-label text-error text-sm mt-1">
                    {errors.newPassword.message}
                  </p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Confirm new password
                </legend>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    className={`input w-full pr-10 ${errors.confirmPassword ? "input-error" : ""}`}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content hover:text-base-content"
                  >
                    {showConfirm ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="fieldset-label text-error text-sm mt-1">
                    {errors.confirmPassword.message}
                  </p>
                )}
              </fieldset>

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn btn-primary w-full"
              >
                {mutation.isPending ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Resetting password...
                  </>
                ) : (
                  "Reset password"
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link
                to="/home/auth/login"
                className="text-base text-base-content hover:text-base-content inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
