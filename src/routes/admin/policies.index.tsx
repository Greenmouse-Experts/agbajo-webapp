import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Settings } from "lucide-react";
import { toast } from "sonner";
import apiClient from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import { extract_message } from "#/helpers/apihelpers";

export const Route = createFileRoute("/admin/policies/")({
  component: AdminPolicies,
});

interface Policy {
  id: number;
  lateFeeAmount: string;
  missedPaymentFee: string;
  gracePeriodDays: number;
  ratingReduction: number;
  maximumPenaltyAmount: string;
}

type FormData = {
  lateFeeAmount: string;
  missedPaymentFee: string;
  gracePeriodDays: string;
  ratingReduction: string;
  maximumPenaltyAmount: string;
};

const toForm = (p: Policy): FormData => ({
  lateFeeAmount: p.lateFeeAmount,
  missedPaymentFee: p.missedPaymentFee,
  gracePeriodDays: String(p.gracePeriodDays),
  ratingReduction: String(p.ratingReduction),
  maximumPenaltyAmount: p.maximumPenaltyAmount,
});

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

function AdminPolicies() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "policies"],
    queryFn: () =>
      apiClient
        .get<{ data: Policy }>("/penalty-config")
        .then((r) => r.data.data),
  });

  const [formData, setFormData] = useState<FormData>({
    lateFeeAmount: "0",
    missedPaymentFee: "0",
    gracePeriodDays: "0",
    ratingReduction: "0",
    maximumPenaltyAmount: "0",
  });

  useEffect(() => {
    if (query.data) setFormData(toForm(query.data));
  }, [query.data]);

  const mutation = useMutation({
    mutationFn: (body: object) =>
      toast
        .promise(apiClient.patch(`/penalty-config/${query.data?.id}`, body), {
          loading: "Saving policies...",
          success: "Policies updated",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin", "policies"] }),
  });

  const handleSave = () => {
    mutation.mutate({
      lateFeeAmount: parseFloat(formData.lateFeeAmount) || 0,
      missedPaymentFee: parseFloat(formData.missedPaymentFee) || 0,
      gracePeriodDays: parseInt(formData.gracePeriodDays) || 0,
      ratingReduction: parseFloat(formData.ratingReduction) || 0,
      maximumPenaltyAmount: parseFloat(formData.maximumPenaltyAmount) || 0,
    });
  };

  const field = (key: keyof FormData) => ({
    value: formData[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setFormData({ ...formData, [key]: e.target.value }),
  });

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

      <PageLoader query={query} loadingText="Loading policies...">
        {() => (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h3 className="card-title">
                    <Settings className="w-5 h-5" />
                    Penalty Configuration
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Late Fee Amount</legend>
                      <label className="input w-full">
                        <span className="text-base-content">₦</span>
                        <input type="number" {...field("lateFeeAmount")} />
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
                        <input type="number" {...field("missedPaymentFee")} />
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
                        {...field("gracePeriodDays")}
                      />
                      <p className="fieldset-label">
                        Days allowed before penalty applies
                      </p>
                    </fieldset>

                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">
                        Rating Reduction
                      </legend>
                      <input
                        type="number"
                        step="0.1"
                        className="input w-full"
                        {...field("ratingReduction")}
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
                        <input type="number" {...field("maximumPenaltyAmount")} />
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
                          parseFloat(formData.lateFeeAmount) || 0,
                        ),
                      },
                      {
                        label: "Missed Fee",
                        value: formatCurrency(
                          parseFloat(formData.missedPaymentFee) || 0,
                        ),
                      },
                      {
                        label: "Grace Period",
                        value: `${formData.gracePeriodDays} days`,
                      },
                      {
                        label: "Rating Reduction",
                        value: `${formData.ratingReduction} pts`,
                      },
                      {
                        label: "Max Penalty",
                        value: formatCurrency(
                          parseFloat(formData.maximumPenaltyAmount) || 0,
                        ),
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="flex items-center justify-between p-3 rounded-lg bg-base-200"
                      >
                        <span className="text-base text-base-content">
                          {label}
                        </span>
                        <span className="font-medium text-base">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="card bg-info border border-info">
                <div className="card-body">
                  <h4 className="text-base font-medium text-info-content">
                    Policy Tips
                  </h4>
                  <ul className="text-sm text-info-content space-y-1 mt-1">
                    <li>- Updates apply immediately to all groups</li>
                    <li>- Rating reduction affects trust score</li>
                    <li>- Grace period allows flexibility</li>
                    <li>- Max penalty prevents excessive charges</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </PageLoader>
    </div>
  );
}
