import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, FormProvider, Controller } from "react-hook-form";
import {
  MessageSquare,
  Send,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";
import PageLoader from "#/components/layout/PageLoader.tsx";
import Modal, { type ModalHandle } from "#/components/modals/DialogModal.tsx";
import SimpleInput from "#/components/modals/inputs/SimpleInput.tsx";
import SimpleSelect from "#/components/modals/inputs/SimpleSelect.tsx";
import apiClient from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import { toast } from "sonner";
import { useRef } from "react";

// ── search schema ────────────────────────────────────────────────────────────

type ComplaintStatus =
  | "pending"
  | "open"
  | "in_progress"
  | "resolved"
  | "escalated"
  | "closed";

interface ComplaintsSearch {
  page: number;
  status: string;
  categoryId: string;
  priorityId: string;
}

export const Route = createFileRoute("/contributor/complaints/")({
  component: ContributorComplaints,
  validateSearch: (s: Record<string, unknown>): ComplaintsSearch => ({
    page: Number(s.page ?? 1),
    status: String(s.status ?? "all"),
    categoryId: String(s.categoryId ?? "all"),
    priorityId: String(s.priorityId ?? "all"),
  }),
});

// ── types ────────────────────────────────────────────────────────────────────

interface ComplaintRef {
  id: number;
  name: string;
}

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  category: ComplaintRef;
  priority: ComplaintRef;
  adminNote?: string | null;
  response?: string | null;
  createdAt: string;
}

interface ComplaintsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ComplaintsData {
  complaints: Complaint[];
  pagination: ComplaintsPagination;
}

interface ComplaintsResponse {
  status: string;
  data: ComplaintsData;
}

interface NewComplaintForm {
  title: string;
  description: string;
  categoryId: string;
  priorityId: string;
}

// ── constants ────────────────────────────────────────────────────────────────

const STATUSES: ComplaintStatus[] = [
  "pending",
  "open",
  "in_progress",
  "resolved",
  "escalated",
  "closed",
];

const statusBadge: Record<ComplaintStatus, string> = {
  pending: "badge-warning",
  open: "badge-warning",
  in_progress: "badge-info",
  resolved: "badge-success",
  escalated: "badge-error",
  closed: "badge-neutral",
};

const priorityBadge: Record<number, string> = {
  1: "badge-neutral",
  2: "badge-ghost",
  3: "badge-warning",
  4: "badge-error",
};

const PAGE_SIZE = 10;

// ── component ────────────────────────────────────────────────────────────────

function ContributorComplaints() {
  const navigate = useNavigate({ from: Route.fullPath });
  const { page, status, categoryId, priorityId } = Route.useSearch();
  const queryClient = useQueryClient();
  const modalRef = useRef<ModalHandle>(null);

  const methods = useForm<NewComplaintForm>({
    defaultValues: { title: "", description: "", categoryId: null as any, priorityId: null as any },
  });

  const setSearch = (patch: Partial<ComplaintsSearch>) =>
    navigate({ search: (prev) => ({ ...prev, ...patch }) });

  const resetPage = () => setSearch({ page: 1 });

  // ── lookup queries (shared cache with SimpleSelect) ──────────────────────

  const categoriesQuery = useQuery({
    queryKey: ["select", "complaints/categories"],
    queryFn: async () => (await apiClient.get("complaints/categories")).data,
  });

  const prioritiesQuery = useQuery({
    queryKey: ["select", "complaints/priorities"],
    queryFn: async () => (await apiClient.get("complaints/priorities")).data,
  });

  // ── query ────────────────────────────────────────────────────────────────

  const params: Record<string, string | number> = { page, limit: PAGE_SIZE };
  if (status !== "all") params.status = status;
  if (categoryId !== "all") params.categoryId = Number(categoryId);
  if (priorityId !== "all") params.priorityId = Number(priorityId);

  const query = useQuery<ComplaintsResponse>({
    queryKey: ["contributor", "complaints", page, status, categoryId, priorityId],
    queryFn: async () => {
      const resp = await apiClient.get("/complaints", { params });
      return resp.data;
    },
  });

  // ── mutation ─────────────────────────────────────────────────────────────

  const createMutation = useMutation({
    mutationFn: (body: object) =>
      toast
        .promise(apiClient.post("complaints", body), {
          loading: "Submitting complaint...",
          success: "Complaint submitted",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: () => {
      modalRef.current?.close();
      methods.reset();
      queryClient.invalidateQueries({ queryKey: ["contributor", "complaints"] });
    },
  });

  const handleSubmit = methods.handleSubmit((values) => {
    createMutation.mutate({
      title: values.title,
      description: values.description,
      categoryId: Number(values.categoryId),
      priorityId: Number(values.priorityId),
    });
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        subtitle="Track and submit complaints"
        action={
          <button
            onClick={() => modalRef.current?.open()}
            className="btn btn-primary btn-sm gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            New Complaint
          </button>
        }
      />

      {/* Filters */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4 flex-col sm:flex-row gap-3">
          <select
            className="select select-sm w-full sm:w-44"
            value={status}
            onChange={(e) => { setSearch({ status: e.target.value }); resetPage(); }}
          >
            <option value="all">All Status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.replace("_", " ")}
              </option>
            ))}
          </select>

          <select
            className="select select-sm w-full sm:w-44"
            value={categoryId}
            onChange={(e) => { setSearch({ categoryId: e.target.value }); resetPage(); }}
          >
            <option value="all">All Categories</option>
            {(categoriesQuery.data?.data as any[] ?? []).map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>

          <select
            className="select select-sm w-full sm:w-44"
            value={priorityId}
            onChange={(e) => { setSearch({ priorityId: e.target.value }); resetPage(); }}
          >
            <option value="all">All Priorities</option>
            {(prioritiesQuery.data?.data as any[] ?? []).map((p: any) => (
              <option key={p.id} value={String(p.id)}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <PageLoader query={query}>
        {({ data }) => {
          const { complaints, pagination } = data;

          if (complaints.length === 0) {
            return (
              <EmptyState
                icon={AlertCircle}
                title="No complaints"
                description="Submit a complaint if you have any issues."
              />
            );
          }

          const hasMore = page < pagination.totalPages;

          return (
            <>
              <div className="space-y-4">
                {complaints.map((c) => (
                  <div
                    key={c.id}
                    className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="card-body gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                          <MessageSquare className="w-5 h-5 text-base-content" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3 flex-wrap">
                            <h3 className="font-semibold text-base-content">{c.title}</h3>
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={`badge badge-sm ${priorityBadge[c.priority?.id] ?? "badge-ghost"} capitalize`}
                              >
                                {c.priority?.name}
                              </span>
                              <span
                                className={`badge badge-sm ${statusBadge[c.status] ?? "badge-ghost"} capitalize`}
                              >
                                {c.status.replace("_", " ")}
                              </span>
                            </div>
                          </div>
                          <p className="text-base text-base-content mt-1 line-clamp-2">
                            {c.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2 text-sm text-base-content">
                            <span className="capitalize">{c.category?.name}</span>
                            <span>·</span>
                            <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {(c.response ?? c.adminNote) && (
                        <div className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success">
                          <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-success mb-1">Admin Response</p>
                            <p className="text-base text-base-content">{c.response ?? c.adminNote}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {(page > 1 || hasMore) && (
                <div className="flex items-center justify-between">
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === 1}
                    onClick={() => setSearch({ page: page - 1 })}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </button>
                  <span className="text-sm text-base-content">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={!hasMore}
                    onClick={() => setSearch({ page: page + 1 })}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          );
        }}
      </PageLoader>

      {/* New complaint modal */}
      <Modal
        ref={modalRef}
        title="New Complaint"
        actions={
          <>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => { modalRef.current?.close(); methods.reset(); }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary gap-2"
              onClick={handleSubmit}
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <span className="loading loading-spinner loading-sm" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Submit
            </button>
          </>
        }
      >
        <FormProvider {...methods}>
          <div className="space-y-4">
            <SimpleInput
              label="Title"
              placeholder="Brief description of your issue"
              {...methods.register("title", { required: "Title is required" })}
            />

            <div className="w-full space-y-2">
              <div className="fieldset-label font-semibold">
                <span className="text-sm">Description</span>
              </div>
              <textarea
                className="textarea textarea-bordered w-full h-24 text-sm"
                placeholder="Detailed description of the issue..."
                {...methods.register("description", { required: "Description is required" })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="categoryId"
                control={methods.control}
                rules={{ required: "Category is required" }}
                render={({ field }) => (
                  <SimpleSelect
                    label="Category"
                    name="categoryId"
                    route="complaints/categories"
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    render={(item: any) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name}
                      </option>
                    )}
                  />
                )}
              />

              <Controller
                name="priorityId"
                control={methods.control}
                rules={{ required: "Priority is required" }}
                render={({ field }) => (
                  <SimpleSelect
                    label="Priority"
                    name="priorityId"
                    route="complaints/priorities"
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    render={(item: any) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name}
                      </option>
                    )}
                  />
                )}
              />
            </div>
          </div>
        </FormProvider>
      </Modal>
    </div>
  );
}
