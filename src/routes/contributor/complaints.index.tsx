import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { MessageSquare, Send, Search, CheckCircle, AlertCircle } from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";

export const Route = createFileRoute("/contributor/complaints/")({
  component: ContributorComplaints,
});

type ComplaintStatus = "open" | "in_progress" | "resolved" | "escalated" | "closed";
type Priority = "low" | "normal" | "high" | "urgent";
type Category = "contribution" | "payout" | "group" | "manager" | "technical" | "other";

interface Complaint {
  id: number;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: ComplaintStatus;
  response_message?: string;
  created_at: string;
}

const mockComplaints: Complaint[] = [
  {
    id: 1,
    title: "Contribution not reflected in my account",
    description: "I made a contribution of ₦10,000 on the 1st of July but it hasn't reflected on my dashboard yet.",
    category: "contribution",
    priority: "high",
    status: "in_progress",
    created_at: "2026-07-02",
  },
  {
    id: 2,
    title: "Payout delayed for Lagos Savers group",
    description: "My expected payout for cycle 3 is overdue by two weeks.",
    category: "payout",
    priority: "urgent",
    status: "resolved",
    response_message: "Your payout has been processed and should reflect in your wallet within 24 hours. Apologies for the delay.",
    created_at: "2026-06-20",
  },
  {
    id: 3,
    title: "Unable to access group details",
    description: "The Victoria Island Circle group page keeps showing an error.",
    category: "technical",
    priority: "normal",
    status: "open",
    created_at: "2026-06-10",
  },
];

const statusBadge: Record<ComplaintStatus, string> = {
  open: "badge-warning",
  in_progress: "badge-info",
  resolved: "badge-success",
  escalated: "badge-error",
  closed: "badge-neutral",
};

const priorityBadge: Record<Priority, string> = {
  low: "badge-neutral",
  normal: "badge-ghost",
  high: "badge-warning",
  urgent: "badge-error",
};

const defaultForm = { title: "", description: "", category: "other" as Category, priority: "normal" as Priority };

function ContributorComplaints() {
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(defaultForm);
  const modalRef = useRef<HTMLDialogElement>(null);

  const openModal = () => modalRef.current?.showModal();
  const closeModal = () => { modalRef.current?.close(); setForm(defaultForm); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    closeModal();
  };

  const filtered = mockComplaints.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  );

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

      {/* Search */}
      <div className="card bg-base-100 border border-base-200 shadow-sm">
        <div className="card-body p-4">
          <label className="input flex items-center gap-2">
            <Search className="w-4 h-4 text-base-content/40 shrink-0" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="grow"
            />
          </label>
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No complaints"
          description="Submit a complaint if you have any issues."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div
              key={c.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="card-body gap-4">
                {/* Header row */}
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-base-200 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-5 h-5 text-base-content/50" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <h3 className="font-semibold text-base-content">{c.title}</h3>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`badge badge-sm ${priorityBadge[c.priority]} capitalize`}>
                          {c.priority}
                        </span>
                        <span className={`badge badge-sm ${statusBadge[c.status]} capitalize`}>
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-base-content/60 mt-1 line-clamp-2">{c.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-base-content/40">
                      <span className="capitalize">{c.category}</span>
                      <span>·</span>
                      <span>{new Date(c.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Admin response */}
                {c.response_message && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
                    <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-success mb-1">Admin Response</p>
                      <p className="text-sm text-base-content/70">{c.response_message}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New complaint modal */}
      <dialog ref={modalRef} className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="text-lg font-semibold text-base-content">New Complaint</h3>
          <p className="text-sm text-base-content/60 mt-0.5">Submit your issue for admin review</p>

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
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">Category</legend>
                <select
                  className="select w-full"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                >
                  <option value="contribution">Contribution</option>
                  <option value="payout">Payout</option>
                  <option value="group">Group</option>
                  <option value="manager">Manager</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Priority</legend>
                <select
                  className="select w-full"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </fieldset>
            </div>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost" onClick={closeModal}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary gap-2">
                <Send className="w-4 h-4" />
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
