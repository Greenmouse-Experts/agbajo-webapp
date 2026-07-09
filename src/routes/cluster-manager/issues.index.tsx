import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { AlertTriangle, Send } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/cluster-manager/issues/")({
  component: ClusterManagerIssues,
});

interface Group {
  id: string;
  group_name: string;
}

const defaultForm = {
  title: "",
  description: "",
  groupId: "",
  severity: "normal",
};

function ClusterManagerIssues() {
  const modalRef = useRef<HTMLDialogElement>(null);
  const [reportForm, setReportForm] = useState(defaultForm);

  const { data: groups = [] } = useQuery({
    queryKey: ["cluster-manager", "groups-list"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Group[]>>("cluster-manager/groups")
        .then((r) => r.data.data),
  });

  const reportMutation = useMutation({
    mutationFn: (body: object) =>
      apiClient.post("cluster-manager/issues", body),
    onSuccess: () => {
      modalRef.current?.close();
      setReportForm(defaultForm);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    reportMutation.mutate({
      title: reportForm.title,
      description: reportForm.description,
      group_id: reportForm.groupId || null,
      priority: reportForm.severity,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Issues</h1>
          <p className="text-base-content/60 mt-1">Report issues to admin</p>
        </div>
        <button
          onClick={() => modalRef.current?.showModal()}
          className="btn btn-primary"
        >
          <AlertTriangle className="w-4 h-4" />
          Report Issue
        </button>
      </div>

      <div className="card bg-base-100 shadow p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-lg font-medium text-base-content mb-1">
          No Active Issues
        </h3>
        <p className="text-base-content/60">
          Report any issues you encounter to the admin
        </p>
      </div>

      <dialog ref={modalRef} className="modal">
        <div className="modal-box">
          <h3 className="text-xl font-semibold">Report an Issue</h3>
          <p className="text-sm text-base-content/60 mt-1">
            Describe the issue for admin review
          </p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Title</legend>
              <input
                type="text"
                className="input w-full"
                placeholder="Brief issue description"
                value={reportForm.title}
                onChange={(e) =>
                  setReportForm({ ...reportForm, title: e.target.value })
                }
                required
              />
            </fieldset>

            <fieldset className="fieldset">
              <legend className="fieldset-legend">Description</legend>
              <textarea
                className="textarea w-full"
                rows={4}
                placeholder="Detailed description of the issue..."
                value={reportForm.description}
                onChange={(e) =>
                  setReportForm({ ...reportForm, description: e.target.value })
                }
                required
              />
            </fieldset>

            <div className="grid grid-cols-2 gap-4">
              <fieldset className="fieldset">
                <legend className="fieldset-legend">
                  Related Group (Optional)
                </legend>
                <select
                  className="select w-full"
                  value={reportForm.groupId}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, groupId: e.target.value })
                  }
                >
                  <option value="">None</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.group_name}
                    </option>
                  ))}
                </select>
              </fieldset>

              <fieldset className="fieldset">
                <legend className="fieldset-legend">Severity</legend>
                <select
                  className="select w-full"
                  value={reportForm.severity}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, severity: e.target.value })
                  }
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </fieldset>
            </div>

            <div className="modal-action">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => modalRef.current?.close()}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={reportMutation.isPending}
              >
                {reportMutation.isPending ? (
                  <span className="loading loading-spinner loading-sm" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Submit Report
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
