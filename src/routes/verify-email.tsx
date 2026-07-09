import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import apiClient from "#/api/simpleApi";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>): { token: string } => ({
    token: String(search.token ?? ""),
  }),
});

function VerifyEmailPage() {
  const { token } = Route.useSearch();

  const mutation = useMutation({
    mutationFn: () => apiClient.post("/auth/verify-email", { token }),
  });

  useEffect(() => {
    if (token) mutation.mutate();
  }, [token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="card bg-base-100 shadow-xl w-full max-w-sm">
        <div className="card-body items-center text-center gap-4">
          <div className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden mx-auto">
            <img
              src="/agbajo-logo.jpeg"
              alt="Agbajo Africa"
              className="w-full h-full object-contain"
            />
          </div>

          {mutation.isPending && (
            <>
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-base-content">
                  Verifying your email
                </h2>
                <p className="text-base-content text-base mt-1">
                  Please wait a moment...
                </p>
              </div>
            </>
          )}

          {mutation.isSuccess && (
            <>
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-base-content">
                  Email verified!
                </h2>
                <p className="text-base-content text-base mt-1">
                  Your account is now active. You can sign in.
                </p>
              </div>
              <Link to="/home/auth/login" className="btn btn-primary w-full">
                Go to login
              </Link>
            </>
          )}

          {mutation.isError && (
            <>
              <div className="w-16 h-16 bg-error rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-error" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-base-content">
                  Verification failed
                </h2>
                <p className="text-base-content text-base mt-1">
                  {(mutation.error as any)?.response?.data?.message ??
                    "This link may be invalid or expired."}
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <button
                  className="btn btn-primary w-full"
                  onClick={() => mutation.mutate()}
                >
                  Try again
                </button>
                <Link to="/home/auth/login" className="btn btn-ghost w-full">
                  Back to login
                </Link>
              </div>
            </>
          )}

          {!token && (
            <>
              <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center">
                <XCircle className="w-8 h-8 text-warning" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-base-content">
                  Invalid link
                </h2>
                <p className="text-base-content text-base mt-1">
                  No verification token found. Check the link in your email.
                </p>
              </div>
              <Link to="/home/auth/login" className="btn btn-ghost w-full">
                Back to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
