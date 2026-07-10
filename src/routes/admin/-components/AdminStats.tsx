import apiClient from "#/api/simpleApi";
import { formatCurrency } from "#/helpers/currency";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  DollarSign,
  Folder,
  TrendingUp,
  Users,
} from "lucide-react";

interface StatsResponse {
  status: string;
  data: {
    users: { total: number; last7Days: number; percentageChange: number };
    activeGroups: { total: number; last7Days: number; percentageChange: number };
  };
}

const ChangeChip = ({ value }: { value: number }) => {
  const isUp = value >= 0;
  return (
    <span
      className={`flex items-center text-base font-medium ${isUp ? "text-success" : "text-error"}`}
    >
      {isUp ? (
        <ArrowUpRight className="w-4 h-4" />
      ) : (
        <ArrowDownRight className="w-4 h-4" />
      )}
      {Math.abs(value)}%
    </span>
  );
};

export default function AdminStats() {
  const query = useQuery<StatsResponse>({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const resp = await apiClient.get("groups/analytics");
      return resp.data;
    },
  });

  const data = query.data?.data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Users */}
      <div className="stat-card group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-secondary" />
          </div>
          {data ? (
            <ChangeChip value={data.users.percentageChange} />
          ) : (
            <span className="text-base-content/30 text-sm">—</span>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-base-content">
            {data?.users.total ?? (query.isLoading ? "…" : 0)}
          </h3>
          <p className="text-sm text-base-content/60">Total Users</p>
          {data && (
            <p className="text-xs text-base-content/40 mt-0.5">
              +{data.users.last7Days} this week
            </p>
          )}
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          to={"/admin/contributors" as any}
          className="text-sm text-secondary hover:underline mt-2 inline-block font-medium"
        >
          View all users
        </Link>
      </div>

      {/* Active Groups */}
      <div className="stat-card group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Folder className="w-6 h-6 text-primary" />
          </div>
          {data ? (
            <ChangeChip value={data.activeGroups.percentageChange} />
          ) : (
            <span className="text-base-content/30 text-sm">—</span>
          )}
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-base-content">
            {data?.activeGroups.total ?? (query.isLoading ? "…" : 0)}
          </h3>
          <p className="text-sm text-base-content/60">Active Groups</p>
          {data && (
            <p className="text-xs text-base-content/40 mt-0.5">
              +{data.activeGroups.last7Days} this week
            </p>
          )}
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          to={"/admin/groups" as any}
          className="text-sm text-primary hover:underline mt-2 inline-block font-medium"
        >
          View all groups
        </Link>
      </div>

      {/* Total Contributions */}
      <div className="stat-card group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-accent" />
          </div>
          <span className="flex items-center text-success text-base font-medium">
            <TrendingUp className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-base-content">
            {formatCurrency(0)}
          </h3>
          <p className="text-sm text-base-content/60">Total Contributions</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          to={"/admin/contributions" as any}
          className="text-sm text-accent hover:underline mt-2 inline-block font-medium"
        >
          View contributions
        </Link>
      </div>

      {/* Pending Verifications */}
      <div className="stat-card group hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-error" />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-2xl font-bold text-base-content">0</h3>
          <p className="text-sm text-base-content/60">Pending Verifications</p>
        </div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Link
          to={"/admin/cluster-managers" as any}
          className="text-sm text-error hover:underline mt-2 inline-block font-medium"
        >
          Review KYC
        </Link>
      </div>
    </div>
  );
}
