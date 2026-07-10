import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, MessageSquare, Send } from "lucide-react";
import apiClient from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";

export const Route = createFileRoute("/admin/complaints/")({
  component: AdminComplaints,
});

type ReportStatus = "pending" | "open" | "in_progress" | "resolved" | "closed";

interface ReportSeverity {
  id: number;
  name: string;
}

interface ReportGroup {
  id: string;
  groupName: string;
  frequency: string;
  type: string;
}

interface Report {
  id: string;
  title: string;
  description: string;
  groupId: string;
  severityId: number;
  userId: string;
  status: ReportStatus;
  adminNote: string | null;
  createdAt: string;
  updatedAt: string;
  severity: ReportSeverity;
  group: ReportGroup;
}

interface ReportsResponse {
  status: string;
  data: {
    reports: Report[];
    total: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

const statusBadgeClass: Record<ReportStatus, string> = {
  pending: "badge-warning",
  open: "badge-info",
  in_progress: "badge-primary",
  resolved: "badge-success",
  closed: "badge-neutral",
};

const severityBadgeClass: Record<string, string> = {
  Low: "badge-ghost",
  Medium: "badge-warning",
  High: "badge-error",
  Critical: "badge-error",
};

const StatusBadge = ({ status }: { status: ReportStatus }) => (
  <span className={`badge capitalize ${statusBadgeClass[status] ?? "badge-ghost"}`}>
    {status.replace("_", " ")}
  </span>
);

const SeverityBadge = ({ name }: { name: string }) => (
  <span className={`badge ${severityBadgeClass[name] ?? "badge-ghost"}`}>
    {name}
  </span>
);

function AdminComplaints() {
  const queryClient = useQueryClient();
  const modalRef = useRef<HTMLDialogElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Report | null>(null);
  const [adminNote, setAdminNote] = useState("");

  const params: Record<string, string | number> = { limit: 50 };
  if (statusFilter !== "all") params.status = statusFilter;
  if (severityFilter !== "all") params.severityId = Number(severityFilter);

  const reportsQuery = useQuery<ReportsResponse>({
    queryKey: ["admin", "complaints", statusFilter, severityFilter],
    queryFn: async () => {
      const resp = await apiClient.get("groups/reports", { params });
      return resp.data;
    },
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) =>
      apiClient.patch(`groups/reports/${id}`, { adminNote: note, status: "resolved" }),
    onSuccess: () => {
      modalRef.current?.close();
      setAdminNote("");
      queryClient.invalidateQueries({ queryKey: ["admin", "complaints"] });
    },
  });

  const openModal = (report: Report) => {
    setSelected(report);
    setAdminNote(report.adminNote ?? "");
    modalRef.current?.showModal();
  };

  const handleRespond = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    respondMutation.mutate({ id: selected.id, note: adminNote });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Complaints</h1>
        <p className="text-base-content/60 mt-1">
          Review and respond to user-submitted reports
        </p>
      </div>

      <div className="card bg-base-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
          <select
            className="select w-full sm:w-44"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
          <select
            className="select w-full sm:w-44"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="all">All Severity</option>
            <option value="1">Low</option>
            <option value="2">Medium</option>
            <option value="3">High</option>
            <option value="4">Critical</option>
          </select>
        </div>
      </div>

      <PageLoader query={reportsQuery}>
        {(data) => {
          const reports = data.data.reports;
          const q = searchQuery.toLowerCase();
          const filtered = reports.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.description.toLowerCase().includes(q) ||
              r.group.groupName.toLowerCase().includes(q),
          );

          return (
            <>
              {filtered.length === 0 ? (
                <div className="card bg-base-100 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-full bg-base-200 flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-base-content/40" />
                  </div>
                  <h3 className="text-lg font-medium text-base-content mb-1">
                    No complaints found
                  </h3>
                  <p className="text-base-content/60">
                    Try adjusting your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((report) => (
                    <div
                      key={report.id}
                      className="card bg-base-100 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openModal(report)}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                            <MessageSquare className="w-5 h-5 text-base-content/60" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-base-content">
                              {report.title}
                            </h3>
                            <p className="text-sm text-base-content/60 mt-0.5 line-clamp-2">
                              {report.description}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-base-content/40 flex-wrap">
                              <span>{report.group.groupName}</span>
                              <span>·</span>
                              <span className="capitalize">{report.group.type}</span>
                              <span>·</span>
                              <span>
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <SeverityBadge name={report.severity.name} />
                          <StatusBadge status={report.status} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          );
        }}
      </PageLoader>

      {/* Detail / Respond Modal */}
      <dialog ref={modalRef} className="modal">
        {selected && (
          <div className="modal-box max-w-2xl">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold text-base-content">
                {selected.title}
              </h3>
              <div className="flex items-center gap-2 shrink-0">
                <SeverityBadge name={selected.severity.name} />
                <StatusBadge status={selected.status} />
              </div>
            </div>

            <div className="space-y-5 mt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-base-content/60">Group</p>
                  <p className="font-medium text-base-content">
                    {selected.group.groupName}
                  </p>
                </div>
                <div>
                  <p className="text-base-content/60">Group Type</p>
                  <p className="font-medium text-base-content capitalize">
                    {selected.group.type}
                  </p>
                </div>
                <div>
                  <p className="text-base-content/60">Frequency</p>
                  <p className="font-medium text-base-content capitalize">
                    {selected.group.frequency}
                  </p>
                </div>
                <div>
                  <p className="text-base-content/60">Submitted</p>
                  <p className="font-medium text-base-content">
                    {new Date(selected.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="card bg-base-200 p-4">
                <h4 className="text-sm font-medium text-base-content mb-2">
                  Description
                </h4>
                <p className="text-sm text-base-content/80">
                  {selected.description}
                </p>
              </div>

              {selected.adminNote && (
                <div className="card bg-success/10 border border-success/20 p-4">
                  <h4 className="text-sm font-medium text-success mb-2">
                    Admin Note
                  </h4>
                  <p className="text-sm text-base-content">{selected.adminNote}</p>
                </div>
              )}

              {selected.status !== "resolved" && selected.status !== "closed" && (
                <form onSubmit={handleRespond} className="space-y-4">
                  <fieldset className="fieldset">
                    <legend className="fieldset-legend">Admin Note / Response</legend>
                    <textarea
                      className="textarea w-full"
                      rows={4}
                      placeholder="Add a note or response..."
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
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
                      Resolve & Save Note
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
