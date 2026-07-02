import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import logo from "/agbajo-logo.png";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export const Route = createFileRoute("/home/auth/signup")({
  component: SignupPage,
});

const schema = z
  .object({
    fullName: z.string().min(2, "Full name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phoneNumber: z.string().optional(),
    role: z.enum(["contributor", "cluster_manager"]),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: "contributor" },
  });

  const role = watch("role");

  const onSubmit = async (_data: FormValues) => {
    setIsLoading(true);
    // auth logic goes here
    setIsLoading(false);
    setSuccess(true);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-emerald-50 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-xl max-w-md w-full">
          <div className="card-body items-center text-center">
            <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mb-2">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h2 className="card-title">Account created successfully!</h2>
            <p className="text-base-content/60">Check your email for verification.</p>
            <div className="card-actions mt-2">
              <Link to="/home/auth/login" className="btn btn-primary">
                Go to login
              </Link>
            </div>
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
            <img src={logo} alt="Agbajo Africa" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-base-content">AGBAJO</h1>
          <p className="text-base-content/60 mt-1">Digital Cooperative Savings</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-base-content mb-0">Create your account</h2>
            <p className="text-base-content/60 text-sm mb-2">Join AGBAJO to start saving together</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Full Name</legend>
                <input
                  type="text"
                  className={`input w-full ${errors.fullName ? "input-error" : ""}`}
                  placeholder="John Doe"
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="fieldset-label text-error flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.fullName.message}
                  </p>
                )}
              </fieldset>

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
                  <p className="fieldset-label text-error flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.email.message}
                  </p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Phone Number</legend>
                <input
                  type="tel"
                  className="input w-full"
                  placeholder="+234 800 000 0000"
                  {...register("phoneNumber")}
                />
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Account Type</legend>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setValue("role", "contributor")}
                    className={`btn btn-sm ${role === "contributor" ? "btn-primary" : "btn-outline"}`}
                  >
                    Contributor
                  </button>
                  <button
                    type="button"
                    onClick={() => setValue("role", "cluster_manager")}
                    className={`btn btn-sm ${role === "cluster_manager" ? "btn-secondary" : "btn-outline"}`}
                  >
                    Cluster Manager
                  </button>
                </div>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Password</legend>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`input w-full pr-10 ${errors.password ? "input-error" : ""}`}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content/70"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="fieldset-label text-error flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.password.message}
                  </p>
                )}
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Confirm Password</legend>
                <input
                  type="password"
                  className={`input w-full ${errors.confirmPassword ? "input-error" : ""}`}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <p className="fieldset-label text-error flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.confirmPassword.message}
                  </p>
                )}
              </fieldset>

              <button type="submit" disabled={isLoading} className="btn btn-primary w-full">
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </button>
            </form>

            <div className="mt-2 text-center">
              <p className="text-sm text-base-content/60">
                Already have an account?{" "}
                <Link to="/home/auth/login" className="text-primary font-bold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
