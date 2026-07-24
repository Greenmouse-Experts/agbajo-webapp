import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Mail, Users, X } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "./-components/PageHeader";
import apiClient from "#/api/simpleApi";
import { extract_message } from "#/helpers/apihelpers";
import PageLoader from "#/components/layout/PageLoader";
import PublicGroupsList from "#/components/groups/PublicGroupsList";
import MyGroupsList from "#/components/groups/MyGroupsList";

type GroupTab = "public" | "my" | "invitations";

export const Route = createFileRoute("/contributor/groups/")({
  validateSearch: (s): { tab: GroupTab } => {
    const t = s?.tab as GroupTab;
    return { tab: t === "my" || t === "invitations" ? t : "public" };
  },
  component: ContributorGroups,
});

const TABS: { label: string; value: GroupTab }[] = [
  { label: "Public Groups", value: "public" },
  { label: "My Groups", value: "my" },
  { label: "Invitations", value: "invitations" },
];

interface InvitedBy { id: string; firstName: string; lastName: string; email: string; }
interface Invitation { id: string; groupId: string; groupName: string; invitedBy: InvitedBy; createdAt: string; }
interface InvitationsData {
  invitations: Invitation[];
  pagination: { limit: number; total: number; nextCursor: string | null; hasMore: boolean; };
}

function InvitationsList() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contributor", "invitations"],
    queryFn: () =>
      apiClient
        .get<{ status: string; data: InvitationsData }>("/groups/invitations")
        .then((r) => r.data.data),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["contributor", "invitations"] });

  const acceptMutation = useMutation({
    mutationFn: (id: string) =>
      toast
        .promise(apiClient.post(`/groups/invitations/${id}/accept`), {
          loading: "Accepting invitation...",
          success: "Invitation accepted",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: invalidate,
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) =>
      toast
        .promise(apiClient.post(`/groups/invitations/${id}/reject`), {
          loading: "Declining invitation...",
          success: "Invitation declined",
          error: extract_message,
        })
        .unwrap(),
    onSuccess: invalidate,
  });

  const isPending = acceptMutation.isPending || declineMutation.isPending;

  return (
    <PageLoader query={query} loadingText="Loading invitations...">
      {(data) => {
        const { invitations, pagination } = data;
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="stat bg-base-100 rounded-box shadow">
                <div className="stat-figure text-primary"><Mail className="w-8 h-8" /></div>
                <div className="stat-title">Total Invitations</div>
                <div className="stat-value text-2xl">{pagination.total}</div>
              </div>
              <div className="stat bg-base-100 rounded-box shadow">
                <div className="stat-figure text-info"><Users className="w-8 h-8" /></div>
                <div className="stat-title">Pending</div>
                <div className="stat-value text-2xl text-info">{invitations.length}</div>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="card bg-base-100 shadow p-12 text-center">
                <Mail className="w-12 h-12 text-base-content/20 mx-auto mb-3" />
                <p className="font-medium text-base-content">No pending invitations</p>
                <p className="text-sm text-base-content/60 mt-1">You'll be notified when you're invited to a group</p>
              </div>
            ) : (
              <div className="space-y-3">
                {invitations.map((inv) => (
                  <div key={inv.id} className="card bg-base-100 shadow">
                    <div className="card-body flex-row items-center gap-4 p-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-base-content truncate">{inv.groupName}</p>
                        <p className="text-sm text-base-content/60 truncate">
                          Invited by{" "}
                          <span className="text-base-content font-medium">
                            {inv.invitedBy.firstName} {inv.invitedBy.lastName}
                          </span>{" "}
                          · {inv.invitedBy.email}
                        </p>
                        <p className="text-xs text-base-content/40 mt-0.5">
                          {new Date(inv.createdAt).toLocaleDateString("en-NG", {
                            day: "numeric", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          className="btn btn-error btn-sm btn-outline"
                          disabled={isPending}
                          onClick={() => declineMutation.mutate(inv.id)}
                        >
                          {declineMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <X className="w-4 h-4" />}
                          Decline
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          disabled={isPending}
                          onClick={() => acceptMutation.mutate(inv.id)}
                        >
                          {acceptMutation.isPending ? <span className="loading loading-spinner loading-xs" /> : <Check className="w-4 h-4" />}
                          Accept
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }}
    </PageLoader>
  );
}

function ContributorGroups() {
  const { tab } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const setTab = (t: GroupTab) =>
    navigate({ search: (prev) => ({ ...prev, tab: t }) });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Groups"
        subtitle="Browse public groups or manage your memberships"
      />

      <div className="tabs tabs-border">
        {TABS.map((t) => (
          <button
            key={t.value}
            className={`tab ${tab === t.value ? "tab-active" : ""}`}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "public" && <PublicGroupsList />}
      {tab === "my" && <MyGroupsList />}
      {tab === "invitations" && <InvitationsList />}
    </div>
  );
}
