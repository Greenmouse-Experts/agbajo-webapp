import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MessageSquare, Send, AlertCircle } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/admin/complaints/")({
  component: AdminComplaints,
});

type ComplaintStatus =
  "open" | "in_progress" | "resolved" | "escalated" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: Priority;
  category: string;
  created_at: string;
  response_message?: string;
  profile?: { full_name: string; email: string };
  group?: { group_name: string };
}

const statusBadgeClass: Record<ComplaintStatus, string> = {
  open: "badge-warning",
  in_progress: "badge-primary",
  resolved: "badge-success",
  escalated: "badge-error",
  closed: "badge-neutral",
};

const priorityBadgeClass: Record<Priority, string> = {
  low: "badge-ghost",
  normal: "badge-info",
  high: "badge-warning",
  urgent: "badge-error",
};

const StatusBadge = ({ status }: { status: ComplaintStatus }) => (
  <span className={`badge ${statusBadgeClass[status]}`}>
    {status.replace("_", " ")}
  </span>
);

const PriorityBadge = ({ priority }: { priority: Priority }) => (
  <span className={`badge ${priorityBadgeClass[priority]}`}>{priority}</span>
);

function AdminComplaints() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);
  const [responseMessage, setResponseMessage] = useState("");

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ["admin", "complaints", statusFilter],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Complaint[]>>("admin/complaints", {
          params: statusFilter !== "all" ? { status: statusFilter } : {},
        })
        .then((r) => r.data.data),
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) =>
      apiClient.patch(`admin/complaints/${id}/respond`, {
        response_message: message,
        status: "resolved",
      }),
    onSuccess: () => {
      modalRef.current?.close();
      setResponseMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin", "complaints"] });
    },
  });

  const filtered = complaints.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.profile?.full_name?.toLowerCase().includes(q)
    );
  });

  const openModal = (complaint: Complaint) => {
    setSelected(complaint);
    setResponseMessage("");
    modalRef.current?.showModal();
  };

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    respondMutation.mutate({ id: selected.id, message: responseMessage });
  };

  const statItems = [
    { label: "Total", value: complaints.length, cls: "" },
    {
      label: "Open",
      value: complaints.filter((c) => c.status === "open").length,
      cls: "text-warning",
    },
    {
      label: "In Progress",
      value: complaints.filter((c) => c.status === "in_progress").length,
      cls: "text-info",
    },
    {
      label: "Escalated",
      value: complaints.filter((c) => c.status === "escalated").length,
      cls: "text-error",
    },
    {
      label: "Resolved",
      value: complaints.filter((c) => c.status === "resolved").length,
      cls: "text-success",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Complaints</h1>
        <p className="text-base-content mt-1">
          Handle user complaints and escalations
        </p>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <label className="input flex-1">
            <Search className="w-5 h-5 text-base-content" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <select
            className="select w-full sm:w-48"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="escalated">Escalated</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {statItems.map(({ label, value, cls }) => (
          <div key={label} className="stat bg-base-100 rounded-box shadow">
            <div className="stat-title">{label}</div>
            <div className={`stat-value text-2xl ${cls}`}>{value}</div>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <span className="loading loading-spinner loading-lg" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card bg-base-100 shadow p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-base-content" />
          </div>
          <h3 className="text-lg font-medium text-base-content mb-1">
            No complaints found
          </h3>
          <p className="text-base-content">All complaints have been resolved</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((complaint) => (
            <div
              key={complaint.id}
              className="card bg-base-100 shadow p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => openModal(complaint)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-base-content" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base-content">
                      {complaint.title}
                    </h3>
                    <p className="text-base text-base-content mt-1 line-clamp-2">
                      {complaint.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-base text-base-content flex-wrap">
                      <span>{complaint.profile?.full_name ?? "—"}</span>
                      {complaint.group && (
                        <>
                          <span className="text-base-content">|</span>
                          <span>{complaint.group.group_name}</span>
                        </>
                      )}
                      <span className="text-base-content">|</span>
                      <span>
                        {new Date(complaint.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <PriorityBadge priority={complaint.priority} />
                  <StatusBadge status={complaint.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <dialog ref={modalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-2xl">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">{selected.title}</h3>
              <div className="flex items-center gap-2 shrink-0">
                <PriorityBadge priority={selected.priority} />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-2 gap-4 text-base">
                <div>
                  <p className="text-base-content">Submitted by</p>
                  <p className="font-medium">
                    {selected.profile?.full_name ?? "—"}
                  </p>
                </div>
                <div>
                  <p className="text-base-content">Category</p>
                  <p className="font-medium capitalize">{selected.category}</p>
                </div>
                <div>
                  <p className="text-base-content">Group</p>
                  <p className="font-medium">
                    {selected.group?.group_name ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-base-content">Submitted</p>
                  <p className="font-medium">
                    {new Date(selected.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-base font-medium text-base-content mb-2">
                  Description
                </h4>
                <p className="text-base-content">{selected.description}</p>
              </div>

              {selected.response_message && (
                <div className="card bg-success border border-success p-4">
                  <h4 className="text-base font-medium text-success mb-2">
                    Admin Response
                  </h4>
                  <p className="text-base-content">
                    {selected.response_message}
                  </p>
                </div>
              )}

              {selected.status !== "resolved" &&
                selected.status !== "closed" && (
                  <form onSubmit={handleRespond} className="space-y-4">
                    <fieldset className="fieldset">
                      <legend className="fieldset-legend">Response</legend>
                      <textarea
                        className="textarea w-full"
                        rows={4}
                        placeholder="Enter your response..."
                        value={responseMessage}
                        onChange={(e) => setResponseMessage(e.target.value)}
                        required
                      />
                    </fieldset>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        className="btn btn-ghost flex-1"
                        onClick={() => modalRef.current?.close()}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary flex-1"
                        disabled={respondMutation.isPending}
                      >
                        {respondMutation.isPending ? (
                          <span className="loading loading-spinner loading-sm" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send Response
                      </button>
                    </div>
                  </form>
                )}
            </div>

            <div className="modal-action">
              <form method="dialog">
                <button className="btn btn-ghost">Close</button>
              </form>
            </div>
          </div>
        )}
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
