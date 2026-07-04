import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";
import apiClient, { new_url, type ApiResponse } from "#/api/simpleApi";
import { set_user_value, type AUTHRECORD } from "#/store/authStore";
import { extract_message } from "#/helpers/apihelpers";
import axios from "axios";

export const Route = createFileRoute("/home/auth/login")({
  component: LoginPage,
});

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      axios.post<ApiResponse<AUTHRECORD>>(new_url + "auth/login", data),
    onSuccess: ({ data }) => {
      set_user_value(data.data);
      toast.success("Welcome back!");
      navigate({ to: "/contributor" });
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

            <form
              onSubmit={handleSubmit((d) => mutation.mutate(d))}
              className="space-y-4"
            >
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Email address</legend>
                <input
                  type="email"
                  className={`input w-full ${errors.email ? "input-error" : ""}`}
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="fieldset-label text-error text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend flex items-center justify-between">
                  Password
                  <Link
                    to="/auth/reset-password/request"
                    className="text-xs text-primary hover:underline font-normal"
                  >
                    Forgot password?
                  </Link>
                </legend>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input w-full pr-10 ${errors.password ? "input-error" : ""}`}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    {...register("password")}
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
                {errors.password && (
                  <p className="fieldset-label text-error text-xs mt-1">
                    {errors.password.message}
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
