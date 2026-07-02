import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import apiClient from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";

export const Route = createFileRoute("/auth/reset-password/request")({
  component: RequestResetPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

function RequestResetPage() {
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiClient.post("/auth/password/forgot", data),
    onSuccess: (_, vars) => {
      setSubmittedEmail(vars.email);
      setSent(true);
    },
    onError: (err) => {
      toast.error(extract_message(err));
    },
  });

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
          <p className="text-base-content/60 mt-1">Digital Cooperative Savings</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {sent ? (
              <div className="text-center py-4 space-y-4">
                <div className="flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-success" />
                  </div>
                </div>
                <h2 className="text-xl font-semibold text-base-content">Check your email</h2>
                <p className="text-base-content/60 text-sm">
                  We sent a password reset link to{" "}
                  <span className="font-medium text-base-content">{submittedEmail}</span>.
                  Follow the link to set a new password.
                </p>
                <p className="text-xs text-base-content/40">
                  Didn't receive it? Check your spam folder or{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setSent(false)}
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-base-content mb-0">
                  Reset your password
                </h2>
                <p className="text-base-content/60 text-sm mb-2">
                  Enter your email and we'll send you a reset link.
                </p>

                <form
                  onSubmit={handleSubmit((d) => mutation.mutate(d))}
                  className="space-y-4"
                >
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Email address</legend>
                    <div className="relative">
                      <input
                        type="email"
                        className={`input w-full pl-10 ${errors.email ? "input-error" : ""}`}
                        placeholder="you@example.com"
                        autoComplete="email"
                        {...register("email")}
                      />
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                    </div>
                    {errors.email && (
                      <p className="fieldset-label text-error text-xs mt-1">
                        {errors.email.message}
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
                        Sending link...
                      </>
                    ) : (
                      "Send reset link"
                    )}
                  </button>
                </form>
              </>
            )}

            <div className="mt-4 text-center">
              <Link
                to="/home/auth/login"
                className="text-sm text-base-content/60 hover:text-base-content inline-flex items-center gap-1"
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
