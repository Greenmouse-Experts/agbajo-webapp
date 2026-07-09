import { formatCurrency } from "#/helpers/currency.ts";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Folder,
  TrendingUp,
  Users,
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/admin/")({
  component: RouteComponent,
});

function RouteComponent() {
  const [stats] = useState<any | null>(null);

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base-content/60 mt-1">
              Overview of platform performance and activities
            </p>
          </div>
          <div className="badge badge-primary">Live Data</div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-secondary/10 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-secondary" />
              </div>
              <span className="flex items-center text-success text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                12%
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-base-content">
                {stats?.totalUsers || 0}
              </h3>
              <p className="text-sm text-base-content/60">Total Users</p>
            </div>
            <Link
              to="/admin/contributors"
              className="text-xs text-secondary hover:underline mt-2 inline-block font-medium"
            >
              View all users
            </Link>
          </div>

          <div className="stat-card group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Folder className="w-6 h-6 text-primary" />
              </div>
              <span className="flex items-center text-success text-sm font-medium">
                <ArrowUpRight className="w-4 h-4" />
                8%
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-base-content">
                {stats?.totalGroups || 0}
              </h3>
              <p className="text-sm text-base-content/60">Active Groups</p>
            </div>
            <Link
              to="/admin/groups"
              className="text-xs text-primary hover:underline mt-2 inline-block font-medium"
            >
              View all groups
            </Link>
          </div>

          <div className="stat-card group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
              <span className="flex items-center text-success text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                23%
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-base-content">
                {formatCurrency(stats?.totalContributions || 0)}
              </h3>
              <p className="text-sm text-base-content/60">
                Total Contributions
              </p>
            </div>
            <Link
              to="/admin/contributions"
              className="text-xs text-accent hover:underline mt-2 inline-block font-medium"
            >
              View contributions
            </Link>
          </div>

          <div className="stat-card group hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 bg-error/10 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              <span className="flex items-center text-error text-sm font-medium">
                {stats?.defaultersCount || 0}
              </span>
            </div>
            <div className="mt-4">
              <h3 className="text-2xl font-bold text-base-content">
                {stats?.pendingVerifications || 0}
              </h3>
              <p className="text-sm text-base-content/60">
                Pending Verifications
              </p>
            </div>
            <Link
              to="/admin/cluster-managers"
              className="text-xs text-error hover:underline mt-2 inline-block font-medium"
            >
              Review KYC
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-base-content">
                  Contributions Trend
                </h3>
                <p className="text-sm text-base-content/60">Last 7 days</p>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-base-content/70">Contributions</span>
              </div>
            </div>
            <div className="h-64">
              {/*<ResponsiveContainer width="100%" height="100%">
                <AreaChart data={contributionsData}>
                  <defs>
                    <linearGradient
                      id="colorContributions"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
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
                    tickFormatter={(value) => `N${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fillOpacity={1}
                    fill="url(#colorContributions)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>*/}
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-base-content">
                  Groups Performance
                </h3>
                <p className="text-sm text-base-content/60">
                  Top 5 groups by contributions
                </p>
              </div>
            </div>
            <div className="h-64">
              {/*<ResponsiveContainer width="100%" height="100%">
                <BarChart data={groupsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                    width={60}
                  />
                  <Tooltip
                    formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #E5E7EB",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Bar
                    dataKey="contributions"
                    fill="#10B981"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>*/}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
