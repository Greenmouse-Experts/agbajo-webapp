import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Users, DollarSign, Calendar, AlertCircle } from "lucide-react";
import apiClient, { type ApiResponse } from "#/api/simpleApi";

export const Route = createFileRoute("/cluster-manager/groups/")({
  component: ClusterManagerGroups,
});

type GroupStatus = "active" | "frozen" | "closed" | "completed";
type ContributionFrequency = "daily" | "weekly" | "monthly";

interface Group {
  id: string;
  group_name: string;
  contribution_amount: number;
  frequency: ContributionFrequency;
  max_members: number;
  member_count: number;
  total_contributions?: number;
  status: GroupStatus;
  created_at: string;
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const statusBadgeClass: Record<GroupStatus, string> = {
  active: "badge-success",
  frozen: "badge-warning",
  closed: "badge-error",
  completed: "badge-primary",
};

function ClusterManagerGroups() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["cluster-manager", "groups"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Group[]>>("cluster-manager/groups")
        .then((r) => r.data.data),
  });

  const filtered = groups.filter((g) =>
    g.group_name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content">My Groups</h1>
          <p className="text-base-content mt-1">
            Manage your Ajo savings groups
          </p>
        </div>
      </div>

      <div className="card bg-base-100 shadow p-4">
        <label className="input w-full">
          <Search className="w-5 h-5 text-base-content" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
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
            No groups found
          </h3>
          <p className="text-base-content">
            You don't manage any groups yet
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((group) => (
            <div
              key={group.id}
              className="card bg-base-100 shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {group.group_name[0].toUpperCase()}
                  </span>
                </div>
                <span className={`badge ${statusBadgeClass[group.status]}`}>
                  {group.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-base-content">
                {group.group_name}
              </h3>

              <div className="mt-4 space-y-3">
                {[
                  {
                    icon: <Users className="w-4 h-4" />,
                    label: "Members",
                    value: `${group.member_count}/${group.max_members}`,
                  },
                  {
                    icon: <DollarSign className="w-4 h-4" />,
                    label: "Amount",
                    value: formatCurrency(group.contribution_amount),
                  },
                  {
                    icon: <Calendar className="w-4 h-4" />,
                    label: "Frequency",
                    value: group.frequency,
                  },
                ].map(({ icon, label, value }) => (
                  <div
                    key={label}
                    className="flex items-center justify-between text-base"
                  >
                    <div className="flex items-center gap-2 text-base-content">
                      {icon}
                      {label}
                    </div>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-base-200">
                <div className="flex items-center justify-between text-base">
                  <span className="text-base-content">Total Collected</span>
                  <span className="font-semibold text-emerald-600">
                    {formatCurrency(group.total_contributions)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
