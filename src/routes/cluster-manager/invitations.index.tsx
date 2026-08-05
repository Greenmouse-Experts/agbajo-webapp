import apiClient from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Users } from "lucide-react";

export const Route = createFileRoute("/cluster-manager/invitations/")({
  component: RouteComponent,
});

interface Invitee {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Invitation {
  id: string;
  groupId: string;
  groupName: string;
  status: string;
  invitee: Invitee;
  createdAt: string;
  updatedAt: string;
}

interface InvitationsData {
  invitations: Invitation[];
  pagination: {
    limit: number;
    total: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
}

function RouteComponent() {
  const query = useQuery({
    queryKey: ["cluster-manager", "invitations"],
    queryFn: () =>
      apiClient
        .get<{ status: string; data: InvitationsData }>("/groups/invitations")
        .then((r) => r.data.data),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-base-content">Invitations</h1>
        <p className="text-base-content/60 mt-1">
          Group invitations sent by you
        </p>
      </div>

      <PageLoader query={query} loadingText="Loading invitations...">
        {(data) => {
          const { invitations, pagination } = data;
          const pendingCount = invitations.filter(
            (i) => i.status === "pending"
          ).length;

          return (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="stat bg-base-100 rounded-box shadow">
                  <div className="stat-figure text-primary">
                    <Mail className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Total Sent</div>
                  <div className="stat-value text-2xl">{pagination.total}</div>
                </div>
                <div className="stat bg-base-100 rounded-box shadow">
                  <div className="stat-figure text-info">
                    <Users className="w-8 h-8" />
                  </div>
                  <div className="stat-title">Pending Response</div>
                  <div className="stat-value text-2xl text-info">
                    {pendingCount}
                  </div>
                </div>
              </div>

              {invitations.length === 0 ? (
                <div className="card bg-base-100 shadow p-12 text-center mt-4">
                  <Mail className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                  <p className="font-medium text-base-content">
                    No invitations found
                  </p>
                  <p className="text-sm text-base-content/60 mt-1">
                    Invitations you send to members will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3 mt-4">
                  {invitations.map((inv) => (
                    <div key={inv.id} className="card bg-base-100 shadow">
                      <div className="card-body flex-row items-center gap-4 p-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="w-6 h-6 text-primary" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-base-content truncate">
                            {inv.groupName}
                          </p>
                          <p className="text-sm text-base-content/60 truncate">
                            Invited:{" "}
                            <span className="text-base-content font-medium">
                              {inv.invitee.firstName} {inv.invitee.lastName}
                            </span>{" "}
                            · {inv.invitee.email}
                          </p>
                          <p className="text-xs text-base-content/40 mt-0.5">
                            {new Date(inv.createdAt).toLocaleDateString(
                              "en-NG",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <span
                            className={`badge ${
                              inv.status === "accepted"
                                ? "badge-success"
                                : inv.status === "pending"
                                ? "badge-warning"
                                : "badge-error"
                            } capitalize font-medium`}
                          >
                            {inv.status}
                          </span>
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
    </div>
  );
}
