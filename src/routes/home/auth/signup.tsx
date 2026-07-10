import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm, Controller, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import apiClient from "#/api/simpleApi";
import SimpleSelect from "#/components/modals/inputs/SimpleSelect";
import SimpleInput from "#/components/modals/inputs/SimpleInput.tsx";

export const Route = createFileRoute("/home/auth/signup")({
  component: SignupPage,
});

const schema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    phoneNumber: z.string().optional(),
    roleId: z.string().min(1, "Select a role"),
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
  const navigate = useNavigate();

  const methods = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = methods;

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      apiClient.post("/auth/sign-up", {
        ...data,
        roleId: Number(data.roleId),
      }),
    onSuccess: () => {
      toast.success("Account created! Check your email for verification.");
      navigate({ to: "/home/auth/login" });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Something went wrong.";
      toast.error(msg);
    },
  });

  return (
    <div className="min-h-screen bg-linear-60 from-primary  to-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden mb-4 mx-auto">
            <img
              src={"/agbajo-logo.jpeg"}
              alt="Agbajo Africa"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary-content">AGBAJO</h1>
          <p className="text-primary-content mt-1">
            Digital Cooperative Savings
          </p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-base-content mb-0">
              Create your account
            </h2>
            <p className="text-base-content text-base mb-2">
              Join AGBAJO to start saving together
            </p>

            <FormProvider {...methods}>
              <form
                onSubmit={handleSubmit((d) => mutation.mutate(d))}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">First Name</legend>
                    <input
                      type="text"
                      className={`input w-full ${errors.firstName ? "input-error" : ""}`}
                      placeholder="John"
                      {...register("firstName")}
                    />
                    {errors.firstName && (
                      <p className="fieldset-label text-error flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.firstName.message}
                      </p>
                    )}
                  </fieldset>

                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Last Name</legend>
                    <input
                      type="text"
                      className={`input w-full ${errors.lastName ? "input-error" : ""}`}
                      placeholder="Doe"
                      {...register("lastName")}
                    />
                    {errors.lastName && (
                      <p className="fieldset-label text-error flex items-center gap-1 mt-1">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {errors.lastName.message}
                      </p>
                    )}
                  </fieldset>
                </div>

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

                <Controller
                  control={control}
                  name="roleId"
                  render={({ field }) => (
                    <SimpleSelect
                      route="/auth/roles"
                      label="Account Type"
                      name="roleId"
                      value={field.value ?? null}
                      onChange={(v) => field.onChange(v)}
                      render={(item: any, idx) => (
                        <option key={idx} value={String(item.id)}>
                          {item.name == "user"
                            ? "CONTRIBUTOR"
                            : String(item.name)
                                .toLocaleUpperCase()
                                .replace("_", " ")}
                        </option>
                      )}
                    />
                  )}
                />
                {errors.roleId && (
                  <p className="text-error text-base flex items-center gap-1 -mt-3">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.roleId.message}
                  </p>
                )}

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Password</legend>
                  <div className="relative">
                    <SimpleInput
                      type={"password"}
                      className={`input w-full pr-10 ${errors.password ? "input-error" : ""}`}
                      placeholder="Create a password"
                      autoComplete="new-password"
                      {...register("password")}
                    />
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
                  <SimpleInput
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

                <button
                  type="submit"
                  disabled={mutation.isPending}
                  className="btn btn-primary w-full"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Creating account...
                    </>
                  ) : (
                    "Create account"
                  )}
                </button>
              </form>
            </FormProvider>

            <div className="mt-4 text-center">
              <p className="text-base text-base-content">
                Already have an account?{" "}
                <Link
                  to="/home/auth/login"
                  className="text-primary font-bold hover:underline"
                >
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
