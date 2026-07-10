import apiClient from "#/api/simpleApi";
import SimpleInput from "#/components/modals/inputs/SimpleInput";
import PasswordChange from "#/components/pages/PasswordChange";
import { set_user_value, useAuth, type AUTHRECORD } from "#/store/authStore";
import { useMutation } from "@tanstack/react-query";
import { User, Phone, Mail } from "lucide-react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

interface ProfileForm {
  name: string;
  phoneNumber: string;
}

export default function ProfileSettings() {
  const [rawUser, setUser] = useAuth();
  const user = rawUser as AUTHRECORD | null;

  const methods = useForm<ProfileForm>({
    defaultValues: {
      name: user?.user?.name ?? "",
      phoneNumber: String(user?.user?.phoneNumber ?? ""),
    },
  });

  const { handleSubmit, formState: { isDirty } } = methods;

  const mutation = useMutation({
    mutationFn: (data: ProfileForm) => apiClient.patch("auth/me", data),
    onSuccess: (resp) => {
      const updated: AUTHRECORD = {
        ...(rawUser as AUTHRECORD),
        user: { ...(rawUser as AUTHRECORD).user, ...resp.data?.data },
      };
      set_user_value(updated);
      setUser(updated);
      toast.success("Profile updated successfully");
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message ?? "Failed to update profile";
      toast.error(msg);
    },
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Profile Settings</h1>
        <p className="text-base-content/60 mt-1">Update your account information</p>
      </div>

      <div className="card bg-base-100 shadow-sm p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-2xl font-bold shrink-0">
            {(user?.user?.name?.[0] ?? "U").toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-base-content">{user?.user?.name ?? "—"}</p>
            <p className="text-sm text-base-content/60">{user?.user?.email ?? "—"}</p>
          </div>
        </div>

        <FormProvider {...methods}>
          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <SimpleInput
              label="Full Name"
              placeholder="Enter your full name"
              icon={<User className="w-4 h-4 text-base-content/40" />}
              {...methods.register("name", { required: "Name is required" })}
            />

            <SimpleInput
              label="Phone Number"
              placeholder="+234 800 000 0000"
              type="tel"
              icon={<Phone className="w-4 h-4 text-base-content/40" />}
              {...methods.register("phoneNumber")}
            />

            <div className="space-y-2">
              <div className="fieldset-label font-semibold">
                <span className="text-sm">Email Address</span>
              </div>
              <div className="input input-md input-bordered flex items-center gap-2 w-full opacity-60 cursor-not-allowed">
                <Mail className="w-4 h-4 text-base-content/40" />
                <input
                  type="email"
                  className="grow"
                  value={user?.user?.email ?? ""}
                  readOnly
                  disabled
                />
              </div>
              <p className="text-xs text-base-content/40">Email cannot be changed</p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={mutation.isPending || !isDirty}
              >
                {mutation.isPending && (
                  <span className="loading loading-spinner loading-sm" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </FormProvider>
      </div>

      <PasswordChange />
    </div>
  );
}
