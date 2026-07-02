import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/home/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    // auth logic goes here
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden mb-4 mx-auto">
            <img
              src={"/agbajo-logo.jpeg"}
              alt="Agbajo Africa"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-base-content">AGBAJO</h1>
          <p className="text-base-content/60 mt-1">
            Digital Cooperative Savings
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-base-content mb-0">
              Welcome back
            </h2>
            <p className="text-base-content/60 text-sm mb-2">
              Sign in to your account to continue
            </p>

            {error && (
              <div role="alert" className="alert alert-error mb-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email address</legend>
                <input
                  id="email"
                  type="email"
                  className="input w-full"
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Password</legend>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input w-full pr-10"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </fieldset>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full"
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </button>
            </form>

            <div className="mt-2 text-center">
              <p className="text-sm text-base-content/60">
                Don't have an account?{" "}
                <Link
                  to="/home/auth/signup"
                  className="text-primary font-bold hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-base-content/40 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
