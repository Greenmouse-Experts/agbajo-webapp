import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertCircle } from "lucide-react";
import apiClient from "#/api/simpleApi";
import SimpleInput from "#/components/modals/inputs/SimpleInput.tsx";
import { extract_message } from "#/helpers/apihelpers";

export const Route = createFileRoute("/invitations/accept/")({
  validateSearch: (s): {
    token?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  } => ({
    token: s?.token as string | undefined,
    email: s?.email as string | undefined,
    firstName: s?.firstName as string | undefined,
    lastName: s?.lastName as string | undefined,
    phoneNumber: s?.phoneNumber as string | undefined,
  }),
  component: AcceptInvitePage,
});

const schema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Enter a valid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof schema>;

function AcceptInvitePage() {
  const props = Route.useSearch();
  const { token } = props;
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: props.firstName ?? "",
      lastName: props.lastName ?? "",
      email: props.email ?? "",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      apiClient.post(`/groups/email-invitations/${token}/join`, {
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phoneNumber: props.phoneNumber ? `+${props.phoneNumber}` : undefined,
        password: values.password,
        confirmPassword: values.confirmPassword,
      }),
    onSuccess: () => {
      toast.success("Account created! You can now sign in.");
      navigate({ to: "/home/auth/login" });
    },
    onError: (err) => toast.error(extract_message(err)),
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card bg-base-100 shadow-lg max-w-md w-full">
          <div className="card-body items-center text-center gap-4">
            <AlertCircle className="w-12 h-12 text-error" />
            <h1 className="text-xl font-bold">Invalid invitation link</h1>
            <p className="text-base-content/60 text-sm">
              This link is missing a token. Please use the link from your
              invitation email.
            </p>
            <Link to="/home/auth/login" className="btn btn-primary w-full">
              Go to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-60 from-primary to-primary flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl shadow-lg overflow-hidden mb-4 mx-auto">
            <img
              src="/agbajo-logo.jpeg"
              alt="Agbajo Africa"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-primary-content">AGBAJO</h1>
          <p className="text-primary-content/80 mt-1">Accept your invitation</p>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="text-xl font-semibold text-base-content mb-0">
              Complete your account
            </h2>
            <p className="text-base-content/60 text-sm mb-4">
              Fill in your details to activate your account.
            </p>

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
                <legend className="fieldset-legend">Email Address</legend>
                <input
                  type="email"
                  className={`input w-full ${errors.email ? "input-error" : ""}`}
                  placeholder="john@example.com"
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
                <legend className="fieldset-legend">Password</legend>
                <SimpleInput
                  type="password"
                  className={`input w-full ${errors.password ? "input-error" : ""}`}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  {...register("password")}
                />
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
                  placeholder="Repeat your password"
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
                    Activating account...
                  </>
                ) : (
                  "Activate Account"
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-sm text-base-content/60">
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
