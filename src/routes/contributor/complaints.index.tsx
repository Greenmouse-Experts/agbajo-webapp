import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import apiClient, { type ApiResponseV2 } from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import { toast } from "sonner";

export const Route = createFileRoute("/contributor/complaints/")({
  component: ContributorComplaints,
});

type ComplaintStatus =
  | "pending"
  | "open"
  | "in_progress"
  | "resolved"
  | "escalated"
  | "closed";

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

type ComplaintsResponse = ApiResponseV2<Complaint[]> & {
  data: { complaints: Complaint[] };
};

// Reference lists — align ids with the backend category/priority tables.
const CATEGORIES = [
  { id: 1, label: "Contribution" },
  { id: 2, label: "Payout" },
  { id: 3, label: "Group" },
  { id: 4, label: "Manager" },
  { id: 5, label: "Technical" },
  { id: 6, label: "Other" },
];

const PRIORITIES = [
  { id: 1, label: "Low" },
  { id: 2, label: "Normal" },
  { id: 3, label: "High" },
  { id: 4, label: "Urgent" },
];

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

const defaultForm = {
  title: "",
  description: "",
  categoryId: "6",
  priorityId: "2",
};

function ContributorComplaints() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [form, setForm] = useState(defaultForm);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  const params: Record<string, string | number> = {
    page,
    limit: PAGE_SIZE,
  };
  if (statusFilter !== "all") params.status = statusFilter;
  if (categoryFilter !== "all") params.categoryId = Number(categoryFilter);
  if (priorityFilter !== "all") params.priorityId = Number(priorityFilter);

  const complaintsQuery = useQuery({
    queryKey: [
      "contributor",
      "complaints",
      page,
      statusFilter,
      categoryFilter,
      priorityFilter,
    ],
    queryFn: () =>
      apiClient
        .get<ComplaintsResponse>("complaints", { params })
        .then((r) => r.data.data),
  });

  const complaints = complaintsQuery.data?.complaints ?? [];
  const pagination = complaintsQuery.data?.pagination;
  const hasMore = pagination?.hasMore ?? complaints.length === PAGE_SIZE;

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
      closeModal();
      queryClient.invalidateQueries({
        queryKey: ["contributor", "complaints"],
      });
    },
  });

  const openModal = () => modalRef.current?.showModal();
  const closeModal = () => {
    modalRef.current?.close();
    setForm(defaultForm);
  };

  const resetToFirstPage = () => setPage(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title: form.title,
      description: form.description,
      categoryId: Number(form.categoryId),
      priorityId: Number(form.priorityId),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Complaints"
        subtitle="Track and submit complaints"
        action={
          <button onClick={openModal} className="btn btn-primary btn-sm gap-2">
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              resetToFirstPage();
            }}
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
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              resetToFirstPage();
            }}
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="select select-sm w-full sm:w-44"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              resetToFirstPage();
            }}
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      {complaintsQuery.isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : complaints.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No complaints"
          description="Submit a complaint if you have any issues."
        />
      ) : (
        <div className="space-y-4">
          {complaints.map((c) => (
            <div
              key={c.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="card-body gap-4">
                {/* Header row */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-base-content" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold text-base-content">
                        {c.title}
                      </h3>
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

                {/* Admin response */}
                {(c.response ?? c.adminNote) && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-success mb-1">
                        Admin Response
                      </p>
                      <p className="text-base text-base-content">
                        {c.response ?? c.adminNote}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {complaints.length > 0 && (page > 1 || hasMore) && (
        <div className="flex items-center justify-between">
          <button
            className="btn btn-ghost btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>
          <span className="text-sm text-base-content">Page {page}</span>
          <button
            className="btn btn-ghost btn-sm"
            disabled={!hasMore}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* New complaint modal */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-semibold text-base-content">
            New Complaint
          </h3>
          <p className="text-base text-base-content mt-0.5">
            Submit your issue for admin review
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Title</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="Brief description of your issue"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Description</legend>
              <textarea
                className="textarea w-full h-24"
                placeholder="Detailed description of the issue..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Category</legend>
                <select
                  className="select w-full"
                  value={form.categoryId}
                  onChange={(e) =>
                    setForm({ ...form, categoryId: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Priority</legend>
                <select
                  className="select w-full"
                  value={form.priorityId}
                  onChange={(e) =>
                    setForm({ ...form, priorityId: e.target.value })
                  }
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </fieldset>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary gap-2"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button onClick={closeModal}>close</button>
        </form>
      </dialog>
    </div>
  );
}
