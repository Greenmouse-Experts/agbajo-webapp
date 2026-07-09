import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  Folder,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import apiClient, { type ApiResponse } from "#/api/simpleApi";
import { useAuth } from "#/store/authStore";

export const Route = createFileRoute("/cluster-manager/")({
  component: ClusterManagerDashboard,
});

interface DashboardStats {
  totalGroups: number;
  totalMembers: number;
  totalContributions: number;
  pendingPayouts: number;
}

interface RecentContribution {
  id: string;
  amount: number;
  created_at: string;
  contributor?: { name: string };
}

const formatCurrency = (amount = 0) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
  }).format(amount);

const last7Days = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  return {
    date: date.toLocaleDateString("en-US", { weekday: "short" }),
    amount: Math.floor(Math.random() * 80000) + 20000,
  };
});

function ClusterManagerDashboard() {
  const [user] = useAuth();
  const displayName = user?.user?.name ?? "Manager";

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["cluster-manager", "dashboard"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<DashboardStats>>("cluster-manager/dashboard")
        .then((r) => r.data.data),
  });

  const { data: recentActivity = [], isLoading: activityLoading } = useQuery({
    queryKey: ["cluster-manager", "recent-contributions"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<RecentContribution[]>>(
          "cluster-manager/contributions/recent",
        )
        .then((r) => r.data.data),
  });

  const isLoading = statsLoading || activityLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-base-content">Dashboard</h1>
          <p className="text-base-content/60 mt-1">
            Welcome back, {displayName}
          </p>
        </div>
        <span className="badge badge-success badge-outline">
          Cluster Manager
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Folder className="w-6 h-6 text-emerald-600" />,
            bg: "bg-emerald-100",
            value: stats?.totalGroups ?? 0,
            label: "Active Groups",
            trend: (
              <>
                <ArrowUpRight className="w-4 h-4" /> Active
              </>
            ),
            trendCls: "text-success",
            link: "/cluster-manager/groups" as const,
            linkLabel: "View groups",
            linkCls: "text-emerald-600",
          },
          {
            icon: <Users className="w-6 h-6 text-blue-600" />,
            bg: "bg-blue-100",
            value: stats?.totalMembers ?? 0,
            label: "Active Members",
            trend: (
              <>
                <ArrowUpRight className="w-4 h-4" /> 8%
              </>
            ),
            trendCls: "text-success",
            link: "/cluster-manager/groups" as const,
            linkLabel: "View members",
            linkCls: "text-blue-600",
          },
          {
            icon: <DollarSign className="w-6 h-6 text-amber-600" />,
            bg: "bg-amber-100",
            value: formatCurrency(stats?.totalContributions),
            label: "Total Collected",
            trend: (
              <>
                <TrendingUp className="w-4 h-4" /> 23%
              </>
            ),
            trendCls: "text-success",
            link: "/cluster-manager/groups" as const,
            linkLabel: "View contributions",
            linkCls: "text-amber-600",
          },
          {
            icon: <Clock className="w-6 h-6 text-rose-600" />,
            bg: "bg-rose-100",
            value: stats?.pendingPayouts ?? 0,
            label: "Pending Payouts",
            trend: null,
            trendCls: "",
            link: "/cluster-manager/groups" as const,
            linkLabel: "Process payouts",
            linkCls: "text-rose-600",
          },
        ].map(
          ({
            icon,
            bg,
            value,
            label,
            trend,
            trendCls,
            link,
            linkLabel,
            linkCls,
          }) => (
            <div
              key={label}
              className="card bg-base-100 shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center`}
                >
                  {icon}
                </div>
                {trend && (
                  <span
                    className={`flex items-center text-sm font-medium ${trendCls}`}
                  >
                    {trend}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-base-content">
                  {value}
                </h3>
                <p className="text-sm text-base-content/60">{label}</p>
              </div>
              <Link
                to={link}
                className={`text-xs ${linkCls} hover:underline mt-2 inline-block`}
              >
                {linkLabel}
              </Link>
            </div>
          ),
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card bg-base-100 shadow p-6">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-base-content">
              Collection Trend
            </h3>
            <p className="text-sm text-base-content/60">Last 7 days</p>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={last7Days}>
                <defs>
                  <linearGradient
                    id="colorContributions"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  tickFormatter={(v) => `₦${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(v) => formatCurrency(Number(v))}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #E5E7EB",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#colorContributions)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card bg-base-100 shadow">
          <div className="card-body">
            <h3 className="card-title text-base">Quick Actions</h3>
            <div className="space-y-3 mt-2">
              {[
                {
                  to: "/cluster-manager/groups" as const,
                  bg: "bg-emerald-100 group-hover:bg-emerald-200",
                  border: "hover:border-emerald-200 hover:bg-emerald-50",
                  icon: <Folder className="w-5 h-5 text-emerald-600" />,
                  label: "Create Group",
                  sub: "Setup new Ajo group",
                },
                {
                  to: "/cluster-manager/groups" as const,
                  bg: "bg-blue-100 group-hover:bg-blue-200",
                  border: "hover:border-blue-200 hover:bg-blue-50",
                  icon: <Users className="w-5 h-5 text-blue-600" />,
                  label: "Invite Member",
                  sub: "Add contributors to groups",
                },
                {
                  to: "/cluster-manager/groups" as const,
                  bg: "bg-amber-100 group-hover:bg-amber-200",
                  border: "hover:border-amber-200 hover:bg-amber-50",
                  icon: <DollarSign className="w-5 h-5 text-amber-600" />,
                  label: "Process Payout",
                  sub: "Handle member payouts",
                },
                {
                  to: "/cluster-manager/groups" as const,
                  bg: "bg-red-100 group-hover:bg-red-200",
                  border: "hover:border-red-200 hover:bg-red-50",
                  icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
                  label: "Report Issue",
                  sub: "Escalate to admin",
                },
              ].map(({ to, bg, border, icon, label, sub }) => (
                <Link
                  key={label}
                  to={to}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-base-200 ${border} transition-all group`}
                >
                  <div
                    className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center transition-colors`}
                  >
                    {icon}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-base-content">
                      {label}
                    </p>
                    <p className="text-xs text-base-content/60">{sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow">
        <div className="card-body pb-0">
          <h3 className="card-title text-base">Recent Contributions</h3>
        </div>
        <div className="divide-y divide-base-200">
          {recentActivity.length === 0 ? (
            <div className="p-6 text-center text-base-content/60">
              No recent contributions
            </div>
          ) : (
            recentActivity.map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-4 p-4 hover:bg-base-50"
              >
                <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <ArrowDownRight className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-base-content truncate">
                    {activity.contributor?.name ?? "Unknown"}
                  </p>
                  <p className="text-xs text-base-content/60">
                    Contribution received
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium text-success">
                    {formatCurrency(activity.amount)}
                  </p>
                  <p className="text-xs text-base-content/40">
                    {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
