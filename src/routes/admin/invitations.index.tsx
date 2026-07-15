import apiClient from "#/api/simpleApi.ts";
import PageLoader from "#/components/layout/PageLoader";
import CustomTable, {
  type columnType,
} from "#/components/tables/CustomTable";
import type { Invitation, InvitationsResponse } from "#/types/admin";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle, Clock, Mail, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/invitations/")({
  component: InvitationsPage,
});

const ROLE_LABELS: Record<number, string> = {
  1: "Contributor",
  2: "Cluster Manager",
  3: "Admin",
};

const isExpired = (inv: Invitation) =>
  inv.status === "pending" && new Date(inv.expiresAt) < new Date();

const StatusBadge = ({ inv }: { inv: Invitation }) => {
  const effective = isExpired(inv) ? "expired" : inv.status;
  if (effective === "accepted")
    return (
      <span className="badge badge-success gap-1">
        <CheckCircle className="w-3 h-3" />
        Accepted
      </span>
    );
  if (effective === "expired")
    return (
      <span className="badge badge-error gap-1">
        <XCircle className="w-3 h-3" />
        Expired
      </span>
    );
  return (
    <span className="badge badge-warning gap-1">
      <Clock className="w-3 h-3" />
      Pending
    </span>
  );
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });

const columns: columnType<Invitation>[] = [
  {
    key: "firstName",
    label: "Name",
    render: (_: string, inv: Invitation) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-primary-content text-xs font-semibold shrink-0">
          {inv.firstName?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div className="min-w-0">
          <p className="font-medium text-base-content truncate">
            {inv.firstName} {inv.lastName}
          </p>
          <p className="text-xs text-base-content/50 truncate">
            {inv.phoneNumber}
          </p>
        </div>
      </div>
    ),
  },
  {
    key: "email",
    label: "Email",
    render: (email: string) => (
      <span className="text-base-content/70">{email}</span>
    ),
  },
  {
    key: "roleId",
    label: "Role",
    render: (roleId: number) => (
      <span className="badge badge-outline badge-sm">
        {ROLE_LABELS[roleId] ?? `Role ${roleId}`}
      </span>
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (_: string, inv: Invitation) => <StatusBadge inv={inv} />,
  },
  {
    key: "createdAt",
    label: "Invited",
    render: (v: string) => (
      <span className="text-sm text-base-content/60">{formatDate(v)}</span>
    ),
  },
  {
    key: "expiresAt",
    label: "Expires",
    render: (v: string, inv: Invitation) => (
      <span
        className={`text-sm ${isExpired(inv) ? "text-error" : "text-base-content/60"}`}
      >
        {formatDate(v)}
      </span>
    ),
  },
];

function InvitationsPage() {
  const query = useQuery<InvitationsResponse>({
    queryKey: ["admin", "invitations"],
    queryFn: async () => {
      const resp = await apiClient.get("/auth/invitations");
      return resp.data;
    },
  });

  const invitations = query.data?.data?.invitations ?? [];
  const pagination = query.data?.data?.pagination;

  const accepted = invitations.filter((i) => i.status === "accepted").length;
  const pending = invitations.filter(
    (i) => i.status === "pending" && !isExpired(i),
  ).length;
  const expired = invitations.filter(isExpired).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Invitations</h1>
          <p className="text-sm text-base-content/60 mt-1">
            Track all sent invitations
          </p>
        </div>
        <Mail className="w-6 h-6 text-base-content/30" />
      </div>

      <PageLoader query={query}>
        {() => (
          <div className="space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                {
                  label: "Total",
                  value: pagination?.total ?? 0,
                  cls: "text-base-content",
                },
                { label: "Pending", value: pending, cls: "text-warning" },
                { label: "Accepted", value: accepted, cls: "text-success" },
              ].map(({ label, value, cls }) => (
                <div key={label} className="card bg-base-100 shadow-sm p-4">
                  <p className="text-xs text-base-content/50 uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                </div>
              ))}
            </div>

            {invitations.length === 0 ? (
              <div className="card bg-base-100 shadow-sm p-12 flex flex-col items-center gap-3 text-base-content/40">
                <Mail className="w-10 h-10" />
                <p>No invitations sent yet</p>
              </div>
            ) : (
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-base-200 flex items-center justify-between">
                  <h3 className="font-semibold text-base-content">
                    All Invitations
                  </h3>
                  {expired > 0 && (
                    <span className="badge badge-error badge-sm">
                      {expired} expired
                    </span>
                  )}
                </div>
                <CustomTable data={invitations} columns={columns} />
              </div>
            )}
          </div>
        )}
      </PageLoader>
    </div>
  );
}
