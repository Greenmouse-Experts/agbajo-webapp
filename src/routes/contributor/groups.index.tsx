import { createFileRoute } from "@tanstack/react-router";
import { Users, DollarSign, Calendar, Star, AlertCircle } from "lucide-react";
import { PageHeader } from "./-components/PageHeader";
import { EmptyState } from "./-components/EmptyState";
import { formatCurrency } from "#/helpers/currency";

export const Route = createFileRoute("/contributor/groups/")({
  component: ContributorGroups,
});

type MemberStatus = "active" | "pending" | "suspended" | "removed";

interface Group {
  id: number;
  group_name: string;
  manager: string;
  contribution_amount: number;
  frequency: string;
  max_members: number;
  current_cycle: number;
  member_status: MemberStatus;
}

const groups: Group[] = [
  {
    id: 1,
    group_name: "Lagos Savers",
    manager: "Emeka Obi",
    contribution_amount: 10000,
    frequency: "monthly",
    max_members: 12,
    current_cycle: 3,
    member_status: "active",
  },
  {
    id: 2,
    group_name: "Victoria Island Circle",
    manager: "Ngozi Adeyemi",
    contribution_amount: 25000,
    frequency: "weekly",
    max_members: 8,
    current_cycle: 1,
    member_status: "active",
  },
  {
    id: 3,
    group_name: "Ibadan Cooperative",
    manager: "Tunde Bello",
    contribution_amount: 5000,
    frequency: "weekly",
    max_members: 20,
    current_cycle: 7,
    member_status: "pending",
  },
];

const statusBadge: Record<MemberStatus, string> = {
  active: "badge-success",
  pending: "badge-warning",
  suspended: "badge-error",
  removed: "badge-neutral",
};

function ContributorGroups() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="My Groups"
        subtitle="Groups you are participating in"
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No groups yet"
          description="You will be added to groups by your cluster manager."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {groups.map((group) => (
            <div
              key={group.id}
              className="card bg-base-100 border border-base-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="card-body gap-4">
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shrink-0">
                    <span className="text-primary-content font-bold text-xl">
                      {group.group_name.charAt(0)}
                    </span>
                  </div>
                  <span className={`badge ${statusBadge[group.member_status]} capitalize`}>
                    {group.member_status}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-base-content">{group.group_name}</h3>
                  <p className="text-sm text-base-content/60 mt-0.5">Managed by {group.manager}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-base-200 p-3">
                    <div className="flex items-center gap-1.5 text-base-content/60 mb-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span className="text-xs">Amount</span>
                    </div>
                    <p className="font-semibold text-base-content text-sm">
                      {formatCurrency(group.contribution_amount)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-base-200 p-3">
                    <div className="flex items-center gap-1.5 text-base-content/60 mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span className="text-xs">Frequency</span>
                    </div>
                    <p className="font-semibold text-base-content text-sm capitalize">
                      {group.frequency}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-base-200">
                  <div className="flex items-center gap-1.5 text-base-content/60">
                    <Users className="w-4 h-4" />
                    <span className="text-sm">{group.max_members} members</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    <span className="text-sm font-medium text-base-content">
                      Cycle {group.current_cycle}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
