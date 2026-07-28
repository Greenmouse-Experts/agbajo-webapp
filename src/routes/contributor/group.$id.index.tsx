import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Users,
  RefreshCw,
  Repeat,
  Hash,
} from "lucide-react";
import apiClient from "#/api/simpleApi";
import PageLoader from "#/components/layout/PageLoader";
import SearchBar from "#/components/Searchbar";

export const Route = createFileRoute("/contributor/group/$id/")({
  component: GroupDetailPage,
});

interface GroupManager {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupDetail {
  id: string;
  groupName: string;
  contributionAmount: number;
  frequency: string;
  frequencyAmount: number;
  maxMembers: number;
  startDate: string;
  type: string;
  createdAt: string;
  managers: GroupManager[];
}

interface GroupMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", { dateStyle: "medium" });

const managerName = (m: GroupManager) => `${m.firstName} ${m.lastName}`.trim();

const Avatar = ({
  name,
  color = "bg-primary/10 text-primary",
}: {
  name: string;
  color?: string;
}) => (
  <div
    className={`w-10 h-10 rounded-full ${color} flex items-center justify-center font-semibold text-sm shrink-0`}
  >
    {(name?.[0] ?? "?").toUpperCase()}
  </div>
);

function GroupDetailPage() {
  const { id } = Route.useParams();
  const [memberSearch, setMemberSearch] = useState("");

  const groupQuery = useQuery({
    queryKey: ["contributor", "group", id],
    queryFn: () => apiClient.get(`groups/${id}`).then((r) => r.data),
  });

  const membersQuery = useQuery({
    queryKey: ["contributor", "group", id, "members", memberSearch],
    queryFn: () =>
      apiClient
        .get(`groups/${id}/members`, {
          params: memberSearch ? { search: memberSearch } : {},
        })
        .then((r) => r.data),
  });

  const group = groupQuery.data?.data as GroupDetail | undefined;
  const members = (membersQuery.data?.data?.members ?? []) as GroupMember[];

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        to="/contributor/groups"
        search={{ tab: "my" }}
        className="inline-flex items-center gap-1.5 text-sm text-base-content/60 hover:text-base-content transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        My Groups
      </Link>

      <PageLoader query={groupQuery}>
        {() =>
          group && (
            <div className="space-y-4">
              {/* Hero header */}
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-primary/10 to-secondary/5 px-6 pt-6 pb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="badge badge-primary capitalize">
                      {group.type}
                    </span>
                    <span className="badge badge-ghost capitalize">
                      {group.frequency}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-base-content">
                    {group.groupName}
                  </h1>
                  <p className="text-xs text-base-content/50 mt-1">
                    Created {formatDate(group.createdAt)}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-base-200">
                  {[
                    {
                      icon: <DollarSign className="w-4 h-4 text-emerald-500" />,
                      label: "Contribution",
                      value: formatCurrency(group.contributionAmount),
                      bg: "bg-emerald-50",
                    },
                    {
                      icon: <Repeat className="w-4 h-4 text-blue-500" />,
                      label: "Per Interval",
                      value: formatCurrency(group.frequencyAmount),
                      bg: "bg-blue-50",
                    },
                    {
                      icon: <Users className="w-4 h-4 text-violet-500" />,
                      label: "Max Members",
                      value: group.maxMembers,
                      bg: "bg-violet-50",
                    },
                    {
                      icon: <Calendar className="w-4 h-4 text-amber-500" />,
                      label: "Start Date",
                      value: formatDate(group.startDate),
                      bg: "bg-amber-50",
                    },
                  ].map(({ icon, label, value, bg }) => (
                    <div key={label} className="flex flex-col gap-2 p-4">
                      <div
                        className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}
                      >
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs text-base-content/50 uppercase tracking-wide">
                          {label}
                        </p>
                        <p className="font-semibold text-base-content text-sm capitalize">
                          {value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Managers */}
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  <h3 className="font-semibold text-base-content">Managers</h3>
                  <span className="badge badge-neutral badge-sm ml-auto">
                    {group.managers.length}
                  </span>
                </div>

                {group.managers.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-base-content/30">
                    <Users className="w-8 h-8" />
                    <p className="text-sm">No managers assigned</p>
                  </div>
                ) : (
                  <div className="divide-y divide-base-200">
                    {group.managers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-base-200/40 transition-colors"
                      >
                        <Avatar name={m.firstName} />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base-content text-sm truncate">
                            {managerName(m)}
                          </p>
                          <p className="text-xs text-base-content/50 truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Members */}
              <div className="card bg-base-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-base-200">
                  <Hash className="w-4 h-4 text-base-content/40" />
                  <h3 className="font-semibold text-base-content">Members</h3>
                  {!membersQuery.isLoading && (
                    <span className="badge badge-neutral badge-sm ml-auto">
                      {members.length}
                    </span>
                  )}
                  {membersQuery.isFetching && (
                    <RefreshCw className="w-3.5 h-3.5 text-base-content/30 animate-spin" />
                  )}
                </div>

                <div className="px-5 py-3 border-b border-base-200">
                  <SearchBar value={memberSearch} onChange={setMemberSearch} />
                </div>

                {membersQuery.isLoading ? (
                  <div className="flex justify-center py-10">
                    <span className="loading loading-spinner loading-md" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-base-content/30">
                    <Users className="w-8 h-8" />
                    <p className="text-sm">
                      {memberSearch
                        ? "No members match your search"
                        : "No members yet"}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-base-200">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-3 px-5 py-3 hover:bg-base-200/40 transition-colors"
                      >
                        <Avatar
                          name={m.firstName}
                          color="bg-secondary/10 text-secondary"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-base-content text-sm truncate">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="text-xs text-base-content/50 truncate">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        }
      </PageLoader>
    </div>
  );
}
