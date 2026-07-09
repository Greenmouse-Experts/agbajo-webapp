import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, AlertCircle, Settings } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/admin/policies/")({
  component: AdminPolicies,
});

interface Policy {
  id: string;
  late_fee_amount: number;
  missed_fee_amount: number;
  grace_period_days: number;
  rating_deduction: number;
  max_penalty_amount: number;
}

type FormData = {
  late_fee_amount: string;
  missed_fee_amount: string;
  grace_period_days: string;
  rating_deduction: string;
  max_penalty_amount: string;
};

const defaultForm: FormData = {
  late_fee_amount: "0",
  missed_fee_amount: "0",
  grace_period_days: "0",
  rating_deduction: "0",
  max_penalty_amount: "0",
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

function AdminPolicies() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<FormData>(defaultForm);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data: policy, isLoading } = useQuery({
    queryKey: ["admin", "policies"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Policy>>("admin/policies/active")
        .then((r) => r.data.data),
  });

  useEffect(() => {
    if (policy) {
      setFormData({
        late_fee_amount: policy.late_fee_amount?.toString() ?? "0",
        missed_fee_amount: policy.missed_fee_amount?.toString() ?? "0",
        grace_period_days: policy.grace_period_days?.toString() ?? "0",
        rating_deduction: policy.rating_deduction?.toString() ?? "0",
        max_penalty_amount: policy.max_penalty_amount?.toString() ?? "0",
      });
    }
  }, [policy]);

  const mutation = useMutation({
    mutationFn: (body: Partial<Policy>) =>
      apiClient.patch(`admin/policies/${policy?.id}`, body),
    onSuccess: () => {
      setMessage({ type: "success", text: "Policies updated successfully!" });
      queryClient.invalidateQueries({ queryKey: ["admin", "policies"] });
    },
    onError: () => {
      setMessage({
        type: "error",
        text: "Failed to save policies. Please try again.",
      });
    },
  });

  const handleSave = () => {
    setMessage(null);
    mutation.mutate({
      late_fee_amount: parseFloat(formData.late_fee_amount) || 0,
      missed_fee_amount: parseFloat(formData.missed_fee_amount) || 0,
      grace_period_days: parseInt(formData.grace_period_days) || 0,
      rating_deduction: parseFloat(formData.rating_deduction) || 0,
      max_penalty_amount: parseFloat(formData.max_penalty_amount) || 0,
    });
  };

  const field = (key: keyof FormData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">
          Policies & Settings
        </h1>
        <p className="text-base-content mt-1">
          Configure system-wide rules and penalties
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">
                <Settings className="w-5 h-5" />
                Penalty Configuration
              </h3>

              {message && (
                <div
                  className={`alert ${message.type === "success" ? "alert-success" : "alert-error"}`}
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{message.text}</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Late Fee Amount</legend>
                  <label className="input w-full">
                    <span className="text-base-content">₦</span>
                    <input type="number" {...field("late_fee_amount")} />
                  </label>
                  <p className="fieldset-label">
                    Penalty for late contributions
                  </p>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">
                    Missed Payment Fee
                  </legend>
                  <label className="input w-full">
                    <span className="text-base-content">₦</span>
                    <input type="number" {...field("missed_fee_amount")} />
                  </label>
                  <p className="fieldset-label">
                    Penalty for missed contributions
                  </p>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">
                    Grace Period (Days)
                  </legend>
                  <input
                    type="number"
                    className="input w-full"
                    {...field("grace_period_days")}
                  />
                  <p className="fieldset-label">
                    Days allowed before penalty applies
                  </p>
                </fieldset>

                <fieldset className="fieldset">
                  <legend className="fieldset-legend">Rating Deduction</legend>
                  <input
                    type="number"
                    step="0.1"
                    className="input w-full"
                    {...field("rating_deduction")}
                  />
                  <p className="fieldset-label">
                    Points deducted per violation (0–5 scale)
                  </p>
                </fieldset>

                <fieldset className="fieldset md:col-span-2">
                  <legend className="fieldset-legend">
                    Maximum Penalty Amount
                  </legend>
                  <label className="input w-full">
                    <span className="text-base-content">₦</span>
                    <input type="number" {...field("max_penalty_amount")} />
                  </label>
                  <p className="fieldset-label">
                    Cap for total penalties per cycle
                  </p>
                </fieldset>
              </div>

              <div className="flex justify-end pt-4 border-t border-base-200">
                <button
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className="btn btn-primary"
                >
                  {mutation.isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h4 className="font-medium text-base-content text-base">
                Current Policy Summary
              </h4>
              <div className="space-y-2 mt-2">
                {[
                  {
                    label: "Late Fee",
                    value: formatCurrency(
                      parseFloat(formData.late_fee_amount) || 0,
                    ),
                  },
                  {
                    label: "Missed Fee",
                    value: formatCurrency(
                      parseFloat(formData.missed_fee_amount) || 0,
                    ),
                  },
                  {
                    label: "Grace Period",
                    value: `${formData.grace_period_days} days`,
                  },
                  {
                    label: "Rating Deduction",
                    value: `${formData.rating_deduction} pts`,
                  },
                  {
                    label: "Max Penalty",
                    value: formatCurrency(
                      parseFloat(formData.max_penalty_amount) || 0,
                    ),
                  },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between p-3 rounded-lg bg-base-200"
                  >
                    <span className="text-base text-base-content">{label}</span>
                    <span className="font-medium text-base">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="card bg-info border border-info">
            <div className="card-body">
              <h4 className="text-base font-medium text-info">Policy Tips</h4>
              <ul className="text-sm text-info space-y-1 mt-1">
                <li>- Updates apply immediately to all groups</li>
                <li>- Rating deduction affects trust score</li>
                <li>- Grace period allows flexibility</li>
                <li>- Max penalty prevents excessive charges</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
