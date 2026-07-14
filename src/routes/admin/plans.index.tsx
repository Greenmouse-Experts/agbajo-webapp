import apiClient from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal";
import SimpleInput from "#/components/modals/inputs/SimpleInput";
import CustomTable, { type columnType } from "#/components/tables/CustomTable";
import type { Actions } from "#/components/tables/pop-up";
import { extract_message } from "#/helpers/apihelpers";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";
import { forwardRef, useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/plans/")({
  component: RouteComponent,
});

interface Plan {
  id: string;
  name: string;
  contributionAmount: string;
  frequency: "weekly" | "monthly" | "daily";
  frequencyAmount: number;
  protectionRiskPercentage: string;
  platformServiceChargePercentage: string;
  bankTransactionFee: string;
  createdAt: string;
}

interface PlanFormValues {
  name: string;
  contributionAmount: number;
  frequency: "weekly" | "monthly" | "daily";
  frequencyAmount: number;
  protectionRiskPercentage: number;
  platformServiceChargePercentage: number;
  bankTransactionFee: number;
}

const formatCurrency = (value: string | number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(Number(value));

const FrequencyBadge = ({
  frequency,
  amount,
}: {
  frequency: string;
  amount: number;
}) => {
  const label = amount > 1 ? `Every ${amount} ${frequency}` : frequency;
  const cls =
    frequency === "monthly"
      ? "badge-primary"
      : frequency === "daily"
        ? "badge-success"
        : "badge-info";
  return <span className={`badge ${cls} capitalize`}>{label}</span>;
};

const columns: columnType<Plan>[] = [
  { key: "name", label: "Plan Name" },
  {
    key: "contributionAmount",
    label: "Contribution",
    render: (val) => (
      <span className="font-medium">{formatCurrency(val)}</span>
    ),
  },
  {
    key: "frequency",
    label: "Frequency",
    render: (val, item) => (
      <FrequencyBadge frequency={val} amount={item.frequencyAmount} />
    ),
  },
  {
    key: "protectionRiskPercentage",
    label: "Protection %",
    render: (val) => `${val}%`,
  },
  {
    key: "platformServiceChargePercentage",
    label: "Service Charge %",
    render: (val) => `${val}%`,
  },
  {
    key: "bankTransactionFee",
    label: "Bank Fee",
    render: (val) => formatCurrency(val),
  },
  {
    key: "createdAt",
    label: "Created",
    render: (val) => new Date(val).toLocaleDateString("en-NG"),
  },
];

// ─── Plan Form Modal (shared for create & edit) ───────────────────────────────

interface PlanFormModalProps {
  plan?: Plan | null;
  formId: string;
  onSuccess: () => void;
}

const PlanFormModal = forwardRef<ModalHandle, PlanFormModalProps>(
  ({ plan, formId, onSuccess }, ref) => {
    const isEdit = !!plan;

    const methods = useForm<PlanFormValues>({
      values: plan
        ? {
            name: plan.name,
            contributionAmount: Number(plan.contributionAmount),
            frequency: plan.frequency,
            frequencyAmount: plan.frequencyAmount,
            protectionRiskPercentage: Number(plan.protectionRiskPercentage),
            platformServiceChargePercentage: Number(
              plan.platformServiceChargePercentage,
            ),
            bankTransactionFee: Number(plan.bankTransactionFee),
          }
        : undefined,
    });
    const { register, handleSubmit, reset } = methods;

    const mutation = useMutation({
      mutationFn: (body: PlanFormValues) =>
        toast
          .promise(
            isEdit
              ? apiClient.patch(`/plans/${plan!.id}`, body)
              : apiClient.post("/plans", body),
            {
              loading: isEdit ? "Updating plan..." : "Creating plan...",
              success: isEdit ? "Plan updated" : "Plan created",
              error: extract_message,
            },
          )
          .unwrap(),
      onSuccess: () => {
        if (!isEdit) reset();
        onSuccess();
      },
    });

    const onSubmit = handleSubmit((data) => mutation.mutate(data));

    return (
      <Modal
        ref={ref}
        title={isEdit ? "Edit Plan" : "Create Plan"}
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => (ref as any)?.current?.close()}
            >
              Cancel
            </button>
            <button
              form={formId}
              type="submit"
              className="btn btn-primary"
              disabled={mutation.isPending}
            >
              {mutation.isPending && (
                <span className="loading loading-spinner loading-sm" />
              )}
              {isEdit ? "Save Changes" : "Create Plan"}
            </button>
          </>
        }
      >
        <FormProvider {...methods}>
          <form id={formId} onSubmit={onSubmit} className="space-y-4">
            <SimpleInput
              label="Plan Name"
              placeholder="e.g. Weekly Nano Plan"
              {...register("name", { required: "Name is required" })}
            />

            <div className="grid grid-cols-2 gap-4">
              <SimpleInput
                label="Contribution Amount (₦)"
                type="number"
                placeholder="10000"
                {...register("contributionAmount", {
                  required: true,
                  valueAsNumber: true,
                })}
              />
              <div className="w-full space-y-2">
                <div className="fieldset-label font-semibold">
                  <span className="text-sm">Frequency</span>
                </div>
                <select
                  className="select select-bordered w-full"
                  {...register("frequency", { required: true })}
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SimpleInput
                label="Frequency Amount"
                type="number"
                placeholder="1"
                {...register("frequencyAmount", {
                  required: true,
                  valueAsNumber: true,
                  min: 1,
                })}
              />
              <SimpleInput
                label="Bank Transaction Fee (₦)"
                type="number"
                placeholder="100"
                {...register("bankTransactionFee", {
                  required: true,
                  valueAsNumber: true,
                })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <SimpleInput
                label="Protection Risk (%)"
                type="number"
                placeholder="10"
                {...register("protectionRiskPercentage", {
                  required: true,
                  valueAsNumber: true,
                })}
              />
              <SimpleInput
                label="Service Charge (%)"
                type="number"
                placeholder="10"
                {...register("platformServiceChargePercentage", {
                  required: true,
                  valueAsNumber: true,
                })}
              />
            </div>
          </form>
        </FormProvider>
      </Modal>
    );
  },
);
PlanFormModal.displayName = "PlanFormModal";

// ─── Page ─────────────────────────────────────────────────────────────────────

function RouteComponent() {
  const queryClient = useQueryClient();
  const createModalRef = useRef<ModalHandle>(null);
  const editModalRef = useRef<ModalHandle>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const query = useQuery({
    queryKey: ["admin", "plans"],
    queryFn: async () => {
      const resp = await apiClient.get<{ status: string; data: Plan[] }>(
        "/plans/all",
      );
      return resp.data.data;
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      toast
        .promise(apiClient.delete(`/plans/${id}`), {
          loading: "Deleting plan...",
          success: "Plan deleted",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: invalidate,
  });

  const actions: Actions<Plan>[] = [
    {
      key: "edit",
      label: "Edit",
      render: () => (
        <span className="flex items-center gap-2">
          <Pencil className="w-3 h-3" /> Edit
        </span>
      ),
      action: (item) => {
        setSelectedPlan(item);
        editModalRef.current?.open();
      },
    },
    {
      key: "delete",
      label: "Delete",
      render: () => (
        <span className="flex items-center gap-2 text-error">
          <Trash2 className="w-3 h-3" /> Delete
        </span>
      ),
      action: (item) => deleteMutation.mutate(item.id),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Plans</h1>
          <p className="text-base-content/60 mt-1">
            All available savings plans on the platform
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => createModalRef.current?.open()}
        >
          <Plus className="w-4 h-4" />
          Create Plan
        </button>
      </div>

      <PageLoader query={query} loadingText="Loading plans...">
        {(data) => (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Total Plans", value: data.length },
                {
                  label: "Weekly",
                  value: data.filter((p) => p.frequency === "weekly").length,
                  cls: "text-info",
                },
                {
                  label: "Monthly",
                  value: data.filter((p) => p.frequency === "monthly").length,
                  cls: "text-primary",
                },
                {
                  label: "Daily",
                  value: data.filter((p) => p.frequency === "daily").length,
                  cls: "text-success",
                },
              ].map(({ label, value, cls }) => (
                <div
                  key={label}
                  className="stat bg-base-100 rounded-box shadow"
                >
                  <div className="stat-figure text-base-content/30">
                    <LayoutGrid className="w-8 h-8" />
                  </div>
                  <div className="stat-title">{label}</div>
                  <div className={`stat-value text-2xl ${cls ?? ""}`}>
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              {data.length === 0 ? (
                <div className="card bg-base-100 shadow p-12 text-center">
                  <p className="text-base-content font-medium">
                    No plans found
                  </p>
                </div>
              ) : (
                <CustomTable data={data} columns={columns} actions={actions} />
              )}
            </div>
          </>
        )}
      </PageLoader>

      <PlanFormModal
        ref={createModalRef}
        formId="plan-form-create"
        plan={null}
        onSuccess={() => {
          createModalRef.current?.close();
          invalidate();
        }}
      />

      <PlanFormModal
        ref={editModalRef}
        formId="plan-form-edit"
        plan={selectedPlan}
        onSuccess={() => {
          editModalRef.current?.close();
          invalidate();
        }}
      />
    </div>
  );
}
